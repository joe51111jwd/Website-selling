// /api/comments: the notes Andrew pins to the page in comment mode (src/comments/). James, Oct 20:
// "we need a comment mode"; Andrew: "somewhere I can click and comment so you know exactly what
// needs tweaked".
//
// A Vercel function (api/ under the project's root directory), Web-standard signature. Every call
// carries the review key from the comment link (?comment=KEY) in an x-comment-key header; it must
// match COMMENT_KEY in the project's environment, so nobody without the link can read or write.
// Without COMMENT_KEY or BLOB_READ_WRITE_TOKEN it answers 501.
//
// Each note is its own JSON file, comments/<id>.json, in the private Blob store "smartcrew-comments"
// (BLOB_READ_WRITE_TOKEN), so two people commenting at once never overwrite each other. Reads skip
// the CDN cache, so a note marked done shows as done on the next load.
//
//   GET    → { comments: Note[] }, oldest first (every page; the client filters by page)
//   POST   { note fields }   → { comment }  a new note
//   PATCH  { id, status }    → { comment }  "open" or "done"
//   DELETE { id }            → { ok: true }
//
// To read them as Claude: curl -H "x-comment-key: KEY" https://smartcrew-preview.vercel.app/api/comments

import { del, get, list, put } from "@vercel/blob";

declare const process: { env: Record<string, string | undefined> };

const PREFIX = "comments/";
const MAX_BODY = 12_000;
const MAX_TEXT = 4000;

type Status = "open" | "done";

export type Note = {
  id: string;
  page: string;
  text: string;
  author: string;
  status: Status;
  createdAt: string;
  doneAt?: string;
  /** where it's pinned: the clicked element and the spot inside it (0–1 of its width and height) */
  anchor: { selector: string; ox: number; oy: number; snippet: string; section: string };
  /** the spot in page pixels too, for when the element can't be found again */
  at: { x: number; y: number; vw: number; vh: number };
  device: "laptop" | "phone";
  look: string;
  ua: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

function sameKey(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** null when the call may go ahead, else the response to send */
function gate(request: Request): Response | null {
  const want = process.env.COMMENT_KEY;
  if (!want || !process.env.BLOB_READ_WRITE_TOKEN) return json({ error: "not-configured" }, 501);
  const got = request.headers.get("x-comment-key") ?? "";
  return sameKey(got, want) ? null : json({ error: "bad-key" }, 401);
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return null;
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 10_000) / 10_000 : 0);
const validId = (id: unknown): id is string => typeof id === "string" && /^[a-z0-9-]{6,40}$/.test(id);
const path = (id: string) => `${PREFIX}${id}.json`;

async function readNote(pathname: string): Promise<Note | null> {
  const got = await get(pathname, { access: "private", useCache: false });
  if (!got || got.statusCode !== 200) return null;
  try {
    return JSON.parse(await new Response(got.stream).text()) as Note;
  } catch {
    return null;
  }
}

const save = (note: Note, overwrite: boolean) =>
  put(path(note.id), JSON.stringify(note), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
  });

export async function GET(request: Request): Promise<Response> {
  const no = gate(request);
  if (no) return no;
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    names.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const notes = (await Promise.all(names.map(readNote))).filter((n): n is Note => !!n);
  notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return json({ comments: notes });
}

export async function POST(request: Request): Promise<Response> {
  const no = gate(request);
  if (no) return no;
  const b = await readBody(request);
  const text = str(b?.text, MAX_TEXT).trim();
  if (!b || !text) return json({ error: "bad-request" }, 400);
  const a = (b.anchor ?? {}) as Record<string, unknown>;
  const at = (b.at ?? {}) as Record<string, unknown>;
  const note: Note = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    page: str(b.page, 40) || "/",
    text,
    author: str(b.author, 60).trim() || "Guest",
    status: "open",
    createdAt: new Date().toISOString(),
    anchor: {
      selector: str(a.selector, 1200),
      ox: Math.min(1, Math.max(0, num(a.ox))),
      oy: Math.min(1, Math.max(0, num(a.oy))),
      snippet: str(a.snippet, 240),
      section: str(a.section, 120),
    },
    at: { x: num(at.x), y: num(at.y), vw: num(at.vw), vh: num(at.vh) },
    device: b.device === "phone" ? "phone" : "laptop",
    look: str(b.look, 20) || "classic",
    ua: str(request.headers.get("user-agent"), 300),
  };
  await save(note, false);
  return json({ comment: note }, 201);
}

export async function PATCH(request: Request): Promise<Response> {
  const no = gate(request);
  if (no) return no;
  const b = await readBody(request);
  if (!b || !validId(b.id) || (b.status !== "open" && b.status !== "done")) return json({ error: "bad-request" }, 400);
  const note = await readNote(path(b.id));
  if (!note) return json({ error: "not-found" }, 404);
  note.status = b.status;
  if (b.status === "done") note.doneAt = new Date().toISOString();
  else delete note.doneAt;
  await save(note, true);
  return json({ comment: note });
}

export async function DELETE(request: Request): Promise<Response> {
  const no = gate(request);
  if (no) return no;
  const b = await readBody(request);
  if (!b || !validId(b.id)) return json({ error: "bad-request" }, 400);
  await del(path(b.id));
  return json({ ok: true });
}
