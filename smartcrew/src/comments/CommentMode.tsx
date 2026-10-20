// Comment mode (src/comments/boot.ts turns it on): Andrew clicks any spot on the page, on a laptop
// or a phone, types what should change, and the note is saved pinned to that spot (api/comments.ts,
// a private Blob store) for James and Claude to read and build from. No login: the review link's key
// is the pass.
//
// It sits on top of the page in its own React root (a body child marked data-scc), so the page's own
// code never changes. While "Comment" is picked, a capture listener on window takes every click and
// press before the page sees it (no button fires, no link opens) and drops a pin there instead;
// "Browse" gives the page back, so he can open the sign-up form, a tab or the calendar, then switch
// back and comment on it.
//
// A pin remembers the element it was dropped on (a CSS path) and the spot inside it (0–1 of its
// width and height), so it follows that element through scrolling, resizing and the laptop/phone
// layouts. When the element isn't on screen (a closed popup, another tab) the pin hides and the list
// says so. The spot in page pixels is kept too, as a fallback on the same kind of screen.

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createRoot } from "react-dom/client";
import { LOOK } from "../lib/look";
import { KEY_STORE } from "./boot";
import "./comments.css";

type Device = "laptop" | "phone";
type Anchor = { selector: string; ox: number; oy: number; snippet: string; section: string };
type At = { x: number; y: number; vw: number; vh: number };
type Spot = { anchor: Anchor; at: At; device: Device };
type Note = Spot & {
  id: string;
  page: string;
  text: string;
  author: string;
  status: "open" | "building" | "waiting" | "done";
  createdAt: string;
  doneAt?: string;
  progress?: string;
  look: string;
};
type Load = "loading" | "ready" | "bad-key" | "not-set-up" | "error";

const NAME_STORE = "sc-comment-name";
const HINT_STORE = "sc-comment-hint";
/** a note picked in the list on the other page, shown once that page loads */
const SHOW_STORE = "sc-comment-show";
const PHONE_MAX = 760;
const DRAFT = "draft";

const deviceNow = (): Device => (window.innerWidth <= PHONE_MAX ? "phone" : "laptop");
const pageNow = () => location.pathname.replace(/\/index\.html$/, "/").replace(/\/+$/, "") || "/";
const PAGE_NAMES: Record<string, string> = { "/": "main page", "/book": "booking page" };
const pageName = (p: string) => PAGE_NAMES[p] ?? p;
const ours = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-scc]");

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      /* private mode: it just won't be remembered */
    }
  },
};

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

async function call<T>(key: string, method: string, body?: unknown): Promise<T> {
  const r = await fetch("/api/comments", {
    method,
    headers: { "x-comment-key": key, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!r.ok) throw new HttpError(r.status);
  return (await r.json()) as T;
}

// ---------------------------------------------------------------------------------------------------
// Where a pin goes

/** A CSS path from the element up to the nearest unique id (or body), by tag and position. */
function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const id = node.id;
    if (id && /^[A-Za-z][\w-]*$/.test(id) && document.querySelectorAll(`#${id}`).length === 1) {
      parts.unshift(`#${id}`);
      break;
    }
    const tag = node.localName;
    let i = 1;
    for (let s = node.previousElementSibling; s; s = s.previousElementSibling) if (s.localName === tag) i++;
    parts.unshift(`${CSS.escape(tag)}:nth-of-type(${i})`);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

const squash = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

function snippetOf(el: Element): string {
  const text = squash(el instanceof HTMLElement ? el.innerText : el.textContent);
  if (text) return text.slice(0, 200);
  const label = el.getAttribute("aria-label") || el.getAttribute("alt") || el.getAttribute("title") || el.querySelector("img")?.alt;
  return (label || `<${el.localName}>`).slice(0, 200);
}

/** The part of the page it's in, for reading the notes later: "#faq · Frequently Asked Questions". */
function sectionOf(el: Element): string {
  const dlg = el.closest('[role="dialog"], dialog');
  const sec = dlg ?? el.closest("section") ?? el.closest("[id]:not(#root)");
  if (!sec) return "";
  const head = squash(sec.querySelector("h1, h2, h3")?.textContent).slice(0, 80);
  const name = dlg ? "pop-up" : sec.id ? `#${sec.id}` : "";
  return [name, head].filter(Boolean).join(" · ");
}

function spotAt(el: Element, x: number, y: number): Spot {
  const r = el.getBoundingClientRect();
  const frac = (v: number, size: number) => (size > 0 ? Math.min(1, Math.max(0, v / size)) : 0.5);
  return {
    anchor: { selector: cssPath(el), ox: frac(x - r.left, r.width), oy: frac(y - r.top, r.height), snippet: snippetOf(el), section: sectionOf(el) },
    at: { x: x + window.scrollX, y: y + window.scrollY, vw: window.innerWidth, vh: window.innerHeight },
    device: deviceNow(),
  };
}

function query(sel: string): Element | null {
  if (!sel) return null;
  try {
    return document.querySelector(sel);
  } catch {
    return null;
  }
}

type Found = { el: Element | null; tried: number };

/** The pin's spot on screen now, or null when what it's pinned to isn't showing. */
function locate(id: string, spot: Spot, seen: Map<string, Found>, now: number): { x: number; y: number } | null {
  let f = seen.get(id);
  if (!f || (f.el ? !f.el.isConnected : now - f.tried > 400)) {
    f = { el: query(spot.anchor.selector), tried: now };
    seen.set(id, f);
  }
  const el = f.el;
  if (el) {
    const shown = typeof el.checkVisibility === "function" ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true;
    const r = el.getBoundingClientRect();
    if (!shown || (r.width === 0 && r.height === 0)) return null;
    return { x: r.left + spot.anchor.ox * r.width, y: r.top + spot.anchor.oy * r.height };
  }
  if (spot.at.vw && spot.device === deviceNow()) {
    return { x: (spot.at.x * window.innerWidth) / spot.at.vw - window.scrollX, y: spot.at.y - window.scrollY };
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function CommentMode({ apiKey }: { apiKey: string }) {
  const [load, setLoad] = useState<Load>("loading");
  const [notes, setNotes] = useState<Note[]>([]);
  const [mode, setMode] = useState<"comment" | "browse">("comment");
  const [draft, setDraft] = useState<Spot | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [hint, setHint] = useState(() => store.get(HINT_STORE) !== "1");
  const [toast, setToast] = useState<string | null>(null);
  const [phone, setPhone] = useState(deviceNow() === "phone");
  const page = pageNow();

  const pinEls = useRef(new Map<string, HTMLElement>());
  const popEl = useRef<HTMLDivElement | null>(null);
  const hoverEl = useRef<HTMLDivElement | null>(null);
  const tracked = useRef<{ id: string; spot: Spot }[]>([]);
  const popFor = useRef<string | null>(null);
  const flashT = useRef(0);
  /** ids already seen here, so a note someone else just left can be announced */
  const known = useRef<Set<string> | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(flashT.current);
    flashT.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { comments } = await call<{ comments: Note[] }>(apiKey, "GET");
      const seen = known.current;
      const fresh = seen ? comments.filter((n) => !seen.has(n.id)) : [];
      known.current = new Set(comments.map((n) => n.id));
      if (fresh.length === 1) flash(`New note from ${fresh[0].author} on the ${pageName(fresh[0].page)}`);
      else if (fresh.length > 1) flash(`${fresh.length} new notes`);
      setNotes(comments);
      setLoad("ready");
    } catch (e) {
      const s = e instanceof HttpError ? e.status : 0;
      setLoad((l) => (s === 401 ? "bad-key" : s === 501 ? "not-set-up" : l === "ready" ? l : "error"));
    }
  }, [apiKey, flash]);

  useEffect(() => {
    void refresh();
    // notes left on another device or by someone else show up within a few seconds
    const t = window.setInterval(() => document.visibilityState === "visible" && void refresh(), 8000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    const onResize = () => setPhone(deviceNow() === "phone");
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const here = useMemo(() => notes.filter((n) => n.page === page), [notes, page]);
  // each page numbers its own pins; the list shows every page, this one first
  const number = useMemo(() => {
    const m = new Map<string, number>();
    const count = new Map<string, number>();
    for (const n of notes) {
      const i = (count.get(n.page) ?? 0) + 1;
      count.set(n.page, i);
      m.set(n.id, i);
    }
    return m;
  }, [notes]);
  const groups = useMemo(() => {
    const pages = [page, ...new Set(notes.map((n) => n.page).filter((p) => p !== page))];
    return pages.map((p) => ({ page: p, notes: notes.filter((n) => n.page === p) }));
  }, [notes, page]);
  const openCount = notes.filter((n) => n.status !== "done").length;
  const pinned = here.filter((n) => showDone || n.status !== "done" || n.id === openId);

  tracked.current = [...pinned.map((n) => ({ id: n.id, spot: n as Spot })), ...(draft ? [{ id: DRAFT, spot: draft }] : [])];
  popFor.current = draft ? DRAFT : openId;

  // pins (and the open note's card) follow what they're pinned to, every frame
  useEffect(() => {
    let raf = 0;
    const seen = new Map<string, Found>();
    const where = new Map<string, { x: number; y: number }>();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      where.clear();
      for (const { id, spot } of tracked.current) {
        const node = pinEls.current.get(id);
        if (!node) continue;
        const p = locate(id, spot, seen, now);
        if (!p) {
          node.dataset.off = "1";
          continue;
        }
        where.set(id, p);
        node.dataset.off = "0";
        const tx = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`;
        if (node.dataset.tx !== tx) {
          node.dataset.tx = tx;
          node.style.transform = tx;
        }
      }
      const pop = popEl.current;
      const p = popFor.current ? where.get(popFor.current) : undefined;
      if (pop && deviceNow() === "laptop") {
        const w = pop.offsetWidth;
        const h = pop.offsetHeight;
        let left = p ? p.x + 22 : window.innerWidth - w - 24;
        if (p && left + w > window.innerWidth - 12) left = p.x - 22 - w;
        const top = p ? Math.min(Math.max(12, p.y - 18), window.innerHeight - h - 12) : 80;
        pop.style.left = `${Math.max(12, Math.round(left))}px`;
        pop.style.top = `${Math.round(top)}px`;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // "Comment": every click and press on the page drops a pin instead of doing what it would do
  const place = useRef<(el: Element, x: number, y: number) => void>(() => {});
  place.current = (el, x, y) => {
    setOpenId(null);
    setHint(false);
    setDraft(spotAt(el, x, y));
    // phones: the note sheet covers the bottom half, so bring a low spot up
    if (deviceNow() === "phone" && y > window.innerHeight * 0.42) window.scrollBy({ top: y - window.innerHeight * 0.28 });
  };

  useEffect(() => {
    if (mode !== "comment" || load !== "ready") return;
    const html = document.documentElement;
    html.classList.add("scc-placing");
    const stop = (e: Event) => {
      if (ours(e.target)) return;
      e.stopImmediatePropagation();
      const mouseDown = e.type === "mousedown" || e.type === "mouseup" || e.type === "dblclick" || e.type === "auxclick";
      const penDown = e.type === "pointerdown" && (e as PointerEvent).pointerType === "mouse";
      if (e.cancelable && (mouseDown || penDown)) e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      if (ours(e.target)) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      const el = e.target instanceof Element ? e.target : document.elementFromPoint(e.clientX, e.clientY);
      if (el) place.current(el, e.clientX, e.clientY);
    };
    const passive = ["touchstart", "touchend"];
    const blocking = ["pointerdown", "pointerup", "mousedown", "mouseup", "dblclick", "auxclick"];
    for (const t of passive) window.addEventListener(t, stop, { capture: true, passive: true });
    for (const t of blocking) window.addEventListener(t, stop, { capture: true });
    window.addEventListener("click", onClick, { capture: true });

    // laptops: outline what a click would pin to
    const box = hoverEl.current;
    const onMove = (e: PointerEvent) => {
      if (!box) return;
      const t = e.target;
      if (e.pointerType !== "mouse" || ours(t) || !(t instanceof Element) || t === document.documentElement || t === document.body) {
        box.style.display = "none";
        return;
      }
      const r = t.getBoundingClientRect();
      box.style.display = "block";
      box.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`;
      box.style.width = `${r.width}px`;
      box.style.height = `${r.height}px`;
    };
    const hideBox = () => box && (box.style.display = "none");
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", hideBox, { passive: true });
    return () => {
      html.classList.remove("scc-placing");
      for (const t of passive) window.removeEventListener(t, stop, { capture: true });
      for (const t of blocking) window.removeEventListener(t, stop, { capture: true });
      window.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", hideBox);
      hideBox();
    };
  }, [mode, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (draft) setDraft(null);
      else if (openId) setOpenId(null);
      else if (panel) setPanel(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, openId, panel]);

  const save = async (text: string, author: string) => {
    if (!draft) return false;
    try {
      const { comment } = await call<{ comment: Note }>(apiKey, "POST", { ...draft, page, text, author, look: LOOK });
      setNotes((n) => [...n, comment]);
      setDraft(null);
      flash("Note saved");
      return true;
    } catch {
      return false;
    }
  };

  const setStatus = async (n: Note, status: Note["status"]) => {
    try {
      const { comment } = await call<{ comment: Note }>(apiKey, "PATCH", { id: n.id, status });
      setNotes((all) => all.map((x) => (x.id === n.id ? comment : x)));
      if (status === "done") flash("Marked done");
    } catch {
      flash("Couldn't save that. Try again.");
    }
  };

  const remove = async (n: Note) => {
    try {
      await call(apiKey, "DELETE", { id: n.id });
      setNotes((all) => all.filter((x) => x.id !== n.id));
      setOpenId(null);
      flash("Note deleted");
    } catch {
      flash("Couldn't delete that. Try again.");
    }
  };

  const show = (n: Note) => {
    setDraft(null);
    setOpenId(n.id);
    if (phone) setPanel(false);
    const el = query(n.anchor.selector);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    else if (n.device === deviceNow()) window.scrollTo({ top: n.at.y - window.innerHeight / 2, behavior: "smooth" });
  };

  const exit = () => {
    store.set(KEY_STORE, null);
    location.reload();
  };

  const openNote = openId ? here.find((n) => n.id === openId) : undefined;

  const pickedElsewhere = useRef(store.get(SHOW_STORE));
  useEffect(() => {
    const id = pickedElsewhere.current;
    if (!id || load !== "ready") return;
    const n = here.find((x) => x.id === id);
    pickedElsewhere.current = null;
    store.set(SHOW_STORE, null);
    // let the page lay itself out first
    if (n) window.setTimeout(() => show(n), 900);
  });

  if (load === "bad-key" || load === "not-set-up") {
    return (
      <div className="scc-bar scc-bar--msg" role="status">
        <span>{load === "bad-key" ? "This comment link isn't valid. Ask James for a new one." : "Comments aren't set up on this copy of the site."}</span>
        <button type="button" className="scc-btn" onClick={exit}>
          Close
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="scc-layer">
        <div className="scc-hover" ref={hoverEl} />
        {pinned.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`scc-pin${n.status === "done" ? " is-done" : ""}${n.id === openId ? " is-open" : ""}`}
            ref={(el) => {
              if (el) pinEls.current.set(n.id, el);
              else pinEls.current.delete(n.id);
            }}
            data-off="1"
            aria-label={`Note ${number.get(n.id)}: ${n.text}`}
            onClick={() => {
              setDraft(null);
              setOpenId(openId === n.id ? null : n.id);
            }}
          >
            {number.get(n.id)}
          </button>
        ))}
        {draft && (
          <span
            className="scc-pin is-draft"
            ref={(el) => {
              if (el) pinEls.current.set(DRAFT, el);
              else pinEls.current.delete(DRAFT);
            }}
            data-off="1"
          >
            +
          </span>
        )}
      </div>

      {draft && <Composer popRef={popEl} phone={phone} onSave={save} onCancel={() => setDraft(null)} />}
      {!draft && openNote && (
        <NoteCard
          popRef={popEl}
          phone={phone}
          note={openNote}
          n={number.get(openNote.id) ?? 0}
          onClose={() => setOpenId(null)}
          onStatus={(s) => void setStatus(openNote, s)}
          onDelete={() => void remove(openNote)}
        />
      )}

      {panel && (
        <aside className="scc-panel" aria-label="Notes on this page">
          <header className="scc-panel-head">
            <strong>All notes ({openCount} open)</strong>
            <button type="button" className="scc-x" aria-label="Close the list" onClick={() => setPanel(false)}>
              ×
            </button>
          </header>
          <div className="scc-scroll">
            {notes.length === 0 && <p className="scc-empty">No notes yet. Click any spot on the page to leave one.</p>}
            {groups.map((g) => {
              const list = g.notes.filter((n) => showDone || n.status !== "done");
              if (g.page !== page && list.length === 0) return null;
              return (
                <section key={g.page} className="scc-group">
                  <h3 className="scc-group-head">
                    {g.page === page ? `This page (the ${pageName(g.page)})` : `The ${pageName(g.page)}`}
                  </h3>
                  {list.length === 0 && <p className="scc-empty">{g.notes.length ? "Every note here is done." : "No notes here yet."}</p>}
                  <ol className="scc-list">
                    {list.map((n) => (
                      <li key={n.id} className={n.status === "done" ? "is-done" : undefined}>
                        <button
                          type="button"
                          className="scc-item"
                          onClick={() => {
                            if (n.page === page) return show(n);
                            store.set(SHOW_STORE, n.id);
                            location.href = n.page;
                          }}
                        >
                          <span className="scc-num">{number.get(n.id)}</span>
                          <span className="scc-item-body">
                            <span className="scc-item-text">{n.text}</span>
                            {n.anchor.snippet && <span className="scc-where">On “{n.anchor.snippet.slice(0, 60)}{n.anchor.snippet.length > 60 ? "…" : ""}”</span>}
                            <span className="scc-meta">
                              {n.author} · {when(n.createdAt)} · {n.device === "phone" ? "phone" : "laptop"}
                              {n.status === "done" ? " · done" : ""}
                            </span>
                            {n.progress && <span className="scc-progress">{n.progress}</span>}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
          {notes.some((n) => n.status === "done") && (
            <label className="scc-check">
              <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show done notes
            </label>
          )}
        </aside>
      )}

      {hint && load === "ready" && (
        <div className="scc-hint" role="note">
          <p>
            <strong>Comment mode is on.</strong> {phone ? "Tap" : "Click"} any spot on the page and type what should change. Your note stays
            pinned to that spot.
          </p>
          <p>To open the sign-up form, a tab or the calendar first, switch to Browse, then back to Comment.</p>
          <button
            type="button"
            className="scc-btn scc-btn--main"
            onClick={() => {
              setHint(false);
              store.set(HINT_STORE, "1");
            }}
          >
            Got it
          </button>
        </div>
      )}

      {toast && (
        <div className="scc-toast" role="status">
          {toast}
        </div>
      )}

      <div className="scc-bar" role="toolbar" aria-label="Comment mode">
        <div className="scc-seg">
          <button type="button" className={mode === "comment" ? "is-on" : undefined} aria-pressed={mode === "comment"} onClick={() => setMode("comment")}>
            Comment
          </button>
          <button
            type="button"
            className={mode === "browse" ? "is-on" : undefined}
            aria-pressed={mode === "browse"}
            onClick={() => {
              setMode("browse");
              setDraft(null);
            }}
          >
            Browse
          </button>
        </div>
        <button type="button" className={`scc-btn${panel ? " is-on" : ""}`} onClick={() => setPanel(!panel)} aria-expanded={panel}>
          Notes{load === "ready" ? ` (${openCount})` : load === "loading" ? " …" : ""}
        </button>
        {load === "error" && (
          <button type="button" className="scc-btn" onClick={() => void refresh()}>
            Retry
          </button>
        )}
        <button type="button" className="scc-x" aria-label="Leave comment mode" title="Leave comment mode" onClick={exit}>
          ×
        </button>
      </div>
    </>
  );
}

function Composer({
  popRef,
  phone,
  onSave,
  onCancel,
}: {
  popRef: RefObject<HTMLDivElement | null>;
  phone: boolean;
  onSave: (text: string, author: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [name, setName] = useState(() => store.get(NAME_STORE) ?? "");
  const [askName, setAskName] = useState(() => !store.get(NAME_STORE));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const area = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    area.current?.focus({ preventScroll: true });
  }, []);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setFailed(false);
    const who = name.trim();
    if (who) store.set(NAME_STORE, who);
    const ok = await onSave(text.trim(), who || "Guest");
    if (!ok) {
      setBusy(false);
      setFailed(true);
    }
  };

  return (
    <div className={`scc-pop${phone ? " is-sheet" : ""}`} ref={popRef} role="dialog" aria-label="New note">
      <textarea
        ref={area}
        className="scc-text"
        rows={phone ? 3 : 4}
        maxLength={4000}
        placeholder="What should change here?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
        }}
      />
      {askName ? (
        <input className="scc-name" maxLength={60} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      ) : (
        <p className="scc-as">
          As {name}.{" "}
          <button type="button" className="scc-link" onClick={() => setAskName(true)}>
            Change
          </button>
        </p>
      )}
      {failed && <p className="scc-err">Couldn't save. Check your connection and try again.</p>}
      <div className="scc-row">
        <button type="button" className="scc-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="scc-btn scc-btn--main" disabled={!text.trim() || busy} onClick={() => void submit()}>
          {busy ? "Saving…" : "Save note"}
        </button>
      </div>
    </div>
  );
}

function NoteCard({
  popRef,
  phone,
  note,
  n,
  onClose,
  onStatus,
  onDelete,
}: {
  popRef: RefObject<HTMLDivElement | null>;
  phone: boolean;
  note: Note;
  n: number;
  onClose: () => void;
  onStatus: (s: Note["status"]) => void;
  onDelete: () => void;
}) {
  const [sure, setSure] = useState(false);
  return (
    <div className={`scc-pop${phone ? " is-sheet" : ""}`} ref={popRef} role="dialog" aria-label={`Note ${n}`}>
      <header className="scc-pop-head">
        <span className="scc-num">{n}</span>
        <span className="scc-meta">
          {note.author} · {when(note.createdAt)} · {note.device === "phone" ? "phone" : "laptop"}
          {note.status === "done" ? " · done" : ""}
        </span>
        <button type="button" className="scc-x" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </header>
      <p className="scc-body">{note.text}</p>
      {note.progress && <p className="scc-progress">{note.progress}</p>}
      <div className="scc-row">
        {sure ? (
          <button type="button" className="scc-btn scc-btn--danger" onClick={onDelete}>
            Yes, delete it
          </button>
        ) : (
          <button type="button" className="scc-btn" onClick={() => setSure(true)}>
            Delete
          </button>
        )}
        {note.status !== "done" ? (
          <button type="button" className="scc-btn scc-btn--main" onClick={() => onStatus("done")}>
            Mark done
          </button>
        ) : (
          <button type="button" className="scc-btn" onClick={() => onStatus("open")}>
            Reopen
          </button>
        )}
      </div>
    </div>
  );
}

export function startCommentMode(key: string) {
  if (document.querySelector("[data-scc-root]")) return;
  const host = document.createElement("div");
  host.setAttribute("data-scc", "");
  host.setAttribute("data-scc-root", "");
  host.setAttribute("data-clarity-mask", "True");
  document.body.appendChild(host);
  document.documentElement.classList.add("scc-on");
  createRoot(host).render(<CommentMode apiKey={key} />);
}
