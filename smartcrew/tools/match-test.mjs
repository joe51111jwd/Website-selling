// The pain picker's matching, without a browser: `node tools/match-test.mjs`.
//
// 1. The keyword match (src/site/features/match.ts) against headaches the way an owner would type
//    them: at least five for each preset chip's feature and two for the other four, a few with typos,
//    and off-topic lines that must match nothing. "sure" is how many it answers without asking the
//    server; every line must land on its feature either way, since the keyword match is the whole
//    answer wherever the server can't help.
// 2. The server function (api/match-pain.ts) with fetch stubbed, so nothing leaves the machine: no
//    key → 501 and no call; a model answer is only ever one of the ten ids; bad input → 400; upstream
//    trouble → "no match" with a reason, never its body; the text never reaches a log.
//
// Node runs the .ts files as they are (type stripping, Node 22.18+); the hook below lets their
// extensionless imports (Vite's style) find the .ts.

import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (err) {
      if (!/^\.{1,2}\//.test(specifier)) throw err;
      return next(specifier.replace(/\.js$/, "") + ".ts", context);
    }
  },
});

const { painMatch } = await import("../src/site/features/match.ts");
const { FEATURES } = await import("../src/content/features.ts");

// ─── 1. the keyword match ───────────────────────────────────────────────────────────────────
const SAID = {
  time: [
    "guys padding their hours",
    "paper timesheets",
    "my guys forget to clock out",
    "chasing guys for their time every friday",
    "payroll takes me all weekend",
    "don't know where my crew is during the day",
    "guys showing up late and leaving early",
    "foremen turn in hours on scraps of paper",
    "people taking long lunches on the clock",
    "overtime is out of control",
    "timecrads are a mess",
    "i run a dirt company and cant keep track of time",
    // (a second batch, written once the first passed; 50 of its 62 landed before the lists learned from it)
    "my foreman texts me everyones hours",
    "guys clocking in from home",
    "hours dont add up at the end of the week",
    "labor tracking",
    "employees forgetting to punch in",
    "the hours on the timecards are made up",
    "guys sitting in the truck on the clock",
  ],
  costing: [
    "don't know if a job made money",
    "no idea if we're profitable until the job is over",
    "we keep going over budget",
    "find out we lost our shirt after the job is done",
    "can't see bid vs actual",
    "change orders never get billed",
    "margins keep getting thinner",
    "where is all the money going",
    "extra work never gets paid for",
    "customers pay late",
    "job profitibility",
    // (a second batch, written once the first passed; 50 of its 62 landed before the lists learned from it)
    "we underbid every job",
    "no clue what each job costs",
    "cost overruns",
    "losing money on jobs and dont know why",
    "find out too late a job went bad",
    "tracking job expenses",
    "how much labor each job really costs",
    "never know if we made a profit",
  ],
  equipment: [
    "dozer keeps going down",
    "oil changes get missed",
    "machines break down at the worst time",
    "no idea when service is due on the excavator",
    "trucks always need repairs",
    "can't keep up with maintenance",
    "keeping up with DOT inspections",
    "the shop is always behind",
    "my skid steer keeps breaking",
    "repair bills are killing us",
    "excavater is down again",
    // (a second batch, written once the first passed; 50 of its 62 landed before the lists learned from it)
    "keeping track of service intervals",
    "machines sitting idle",
    "nobody does the pre trip",
    "lost track of who has which machine",
    "hydraulic hose blew",
    "loader wont start",
    "guys skip greasing the excavator",
    "fleet maintenance",
    "flat tires on the dump trucks",
  ],
  materials: [
    "dump tickets",
    "drivers lose their load tickets",
    "truck tickets go missing",
    "don't know how many loads we hauled",
    "receipts everywhere",
    "trucking invoices don't match the tickets",
    "fuel slips get lost",
    "no idea how much gravel we used",
    "scale tickets in a shoebox",
    "material deliveries never get written down",
    "lost hual tickets",
    // (a second batch, written once the first passed; 50 of its 62 landed before the lists learned from it)
    "tracking how much fill comes in",
    "trucks hauling to the wrong dump site",
    "suppliers overcharging",
    "fuel costs",
    "drivers paper tickets get wet",
    "counting loads by hand",
    "how many yards of topsoil went out",
  ],
  sales: [
    "bids falling through the cracks",
    "forget to follow up on estimates",
    "leads go cold",
    "never hear back on quotes",
    "don't know which jobs we're bidding on",
    "too many proposals out to keep track of",
    "customers slip through the cracks",
    "need more work",
    "no system for tracking leads",
    "estimats sitting in my inbox",
    // (a second batch, written once the first passed; 50 of its 62 landed before the lists learned from it)
    "too many estimates and no follow up",
    "customers dont call back",
    "keeping track of who we bid with",
    "jobs we quoted months ago",
    "where do I stand on all my bids",
    "need more customers",
  ],
  scheduling: [
    "who's going where tomorrow",
    "every morning is chaos",
    "guys show up at the wrong job",
    "planning next week's crews",
    "juggling crews between jobs",
    "double booked the excavator",
    "nobody knows where to go in the morning",
    "the schedule lives on a whiteboard",
    "short handed every day",
    "shedule changes last minute",
    // (a second batch, written once the first passed; 50 of its 62 landed before the lists learned from it)
    "texting everyone where to be at 5am",
    "moving guys around all day",
    "sub didnt show up",
    "who has the lowboy tomorrow",
    "crew schedules change constantly",
    "figuring out the week ahead",
  ],
  daily: [
    "don't know what got done today",
    "foremen don't fill out reports",
    "no photos from the jobsite",
    "I have to call the foreman to find out what happened",
    "progress updates from the field",
    // (a second batch, written once the first passed; 50 of its 62 landed before the lists learned from it)
    "foreman forgets to send pics",
    "no record of what we did yesterday",
    "daily paperwork",
    "need proof of work done",
  ],
  comms: [
    "texting the crew all day",
    "group texts are a mess",
    "crew never gets the message",
    "nobody's on the same page",
    "on the phone all night telling guys where to go",
    // (a second batch, written once the first passed; 50 of its 62 landed before the lists learned from it)
    "guys dont answer their phones",
    "emails get lost",
    "changes dont get passed along",
    "too many group chats",
  ],
  safety: [
    "OSHA",
    "toolbox talks never get documented",
    "guys not wearing their hard hats",
    "keeping up with safety paperwork",
    "somebody got hurt on site",
    // (a second batch, written once the first passed; 50 of its 62 landed before the lists learned from it)
    "insurance audits",
    "keeping track of training certs",
    "trench safety",
    "safety meetings sign in sheets",
    "accident on site",
  ],
  files: [
    "can't find the plans",
    "guys working off old plans",
    "documents everywhere",
    "where's the latest set of drawings",
    "permits and submittals all over the place",
    // (a second batch, written once the first passed; 50 of its 62 landed before the lists learned from it)
    "plans on paper in the truck",
    "everything is in a filing cabinet",
    "photos scattered on everyones phones",
    "cant share drawings with the crew",
  ],
};

const OFF_TOPIC = [
  "my dog keeps barking at night",
  "hello",
  "asdfgh",
  "what is this",
  "I like pizza",
  "the Cubs lost again",
  "my wife wants a new kitchen",
  "the coffee is terrible",
  "nothing really",
  "my knees are shot",
  "I don't have time for this",
  "can't find a good taco place",
  "great question",
  "a dozen eggs",
  "I hate mondays",
];

// Too vague for keywords: the server's to answer. Shown, not counted.
const LEFT_TO_SERVER = ["cant tell who actually worked", "losing jobs to cheaper guys", "my guys are lazy"];

const chips = new Set(FEATURES.pain.chips.map((c) => c.id));
const names = Object.fromEntries(FEATURES.cards.map((c) => [c.id, c.name]));
let bad = 0;
const rows = [];
for (const [id, lines] of Object.entries(SAID)) {
  const need = chips.has(id) ? 5 : 2;
  if (lines.length < need) {
    console.log(`  ✗ ${names[id]} has ${lines.length} lines, needs ${need}`);
    bad++;
  }
  let ok = 0;
  let sure = 0;
  const misses = [];
  for (const line of lines) {
    const got = painMatch(line);
    if (got.id === id) {
      ok++;
      if (got.sure) sure++;
    } else misses.push(`"${line}" → ${got.id ?? "no match"}`);
  }
  bad += misses.length;
  rows.push({ id, name: names[id], chip: chips.has(id), ok, sure, n: lines.length, misses });
}

console.log("Keyword match (in the browser, no server):\n");
const w = Math.max(...rows.map((r) => r.name.length)) + 7;
for (const r of rows) {
  const label = `${r.name}${r.chip ? " (chip)" : ""}`.padEnd(w);
  console.log(`  ${r.ok === r.n ? "✓" : "✗"}  ${label} ${r.ok}/${r.n} matched, ${r.sure} sure`);
  for (const m of r.misses) console.log(`       miss: ${m}`);
}
const total = rows.reduce((a, r) => a + r.n, 0);
const okAll = rows.reduce((a, r) => a + r.ok, 0);
const sureAll = rows.reduce((a, r) => a + r.sure, 0);
console.log(`\n  ${okAll}/${total} matched (${Math.round((100 * okAll) / total)}%), ${sureAll} sure without asking`);

const wrong = OFF_TOPIC.map((line) => [line, painMatch(line)]).filter(([, m]) => m.id);
bad += wrong.length;
console.log(`  ${wrong.length ? "✗" : "✓"}  off-topic: ${OFF_TOPIC.length - wrong.length}/${OFF_TOPIC.length} matched nothing`);
for (const [line, m] of wrong) console.log(`       wrong: "${line}" → ${m.id}`);
console.log(`  ·  left to the server: ${LEFT_TO_SERVER.map((l) => `"${l}" → ${painMatch(l).id ?? "no match"}`).join(", ")}`);

// ─── 2. the server function, fetch stubbed ──────────────────────────────────────────────────
console.log("\nServer function (api/match-pain.ts, fetch stubbed):\n");
const { POST } = await import("../api/match-pain.ts");
const KEY = "stub-key-for-tests";
const SECRET_BODY = "upstream-error-body-must-not-leak";
const realFetch = globalThis.fetch;
// whatever the function logs while it runs (it may log a status, never the text, key or body)
const logs = [];
let capturing = false;
for (const k of ["log", "warn", "error", "info", "debug"]) {
  const orig = console[k].bind(console);
  console[k] = (...a) => (capturing ? logs.push(a.join(" ")) : orig(...a));
}
let calls = [];
const stub = (fn) => {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return fn(init);
  };
};
const said = (content) => () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
const ask = async (body) => {
  const req = new Request("http://localhost/api/match-pain", { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
  capturing = true;
  try {
    return await POST(req);
  } finally {
    capturing = false;
  }
};
const read = async (res) => ({ status: res.status, body: await res.text() });

const apiChecks = [
  [
    "no key → 501 no-key, nothing called",
    async () => {
      delete process.env.OPENROUTER_API_KEY;
      stub(said('{"id":"costing"}'));
      const r = await read(await ask({ text: "don't know if a job made money" }));
      return [r.status === 501 && r.body === '{"id":null,"reason":"no-key"}' && calls.length === 0, `${r.status} ${r.body}, ${calls.length} calls`];
    },
  ],
  [
    'model says {"id":"costing"} → {id:"costing"}',
    async () => {
      process.env.OPENROUTER_API_KEY = KEY;
      stub(said('{"id":"costing"}'));
      const r = await read(await ask({ text: "  don't know if a job made money  " }));
      const c = calls[0];
      const sent = c && JSON.parse(c.init.body);
      const h = c?.init.headers ?? {};
      const okReq =
        c?.url === "https://openrouter.ai/api/v1/chat/completions" &&
        h.Authorization === `Bearer ${KEY}` &&
        h["HTTP-Referer"] === "https://smartcrew-preview.vercel.app" &&
        h["X-Title"] === "SmartCrew" &&
        sent.model === "deepseek/deepseek-chat" &&
        sent.temperature === 0 &&
        sent.max_tokens <= 60 &&
        sent.messages.at(-1).content.includes("<headache>don't know if a job made money</headache>") &&
        FEATURES.cards.every((f) => sent.messages.at(-1).content.includes(`${f.id}: ${f.name}.`)) &&
        !c.init.body.includes(KEY);
      return [r.status === 200 && r.body === '{"id":"costing"}' && okReq, `${r.status} ${r.body}; request ${okReq ? "as specified" : "NOT as specified"}`];
    },
  ],
  [
    "a bare word (costing) and a name (Job Costing) read too",
    async () => {
      stub(said("costing"));
      const a = await read(await ask({ text: "x job money" }));
      stub(said('{"id": "Job Costing"}'));
      const b = await read(await ask({ text: "x job money" }));
      return [a.body === '{"id":"costing"}' && b.body === '{"id":"costing"}', `${a.body} / ${b.body}`];
    },
  ],
  [
    'an id not in the list ({"id":"payroll"}) → {id:null}',
    async () => {
      stub(said('{"id":"payroll"}'));
      const r = await read(await ask({ text: "payroll is a mess" }));
      return [r.status === 200 && r.body === '{"id":null}', `${r.status} ${r.body}`];
    },
  ],
  [
    'the model says none → {id:null}',
    async () => {
      stub(said('Sure! {"id":"none"}'));
      const r = await read(await ask({ text: "my dog keeps barking at night" }));
      return [r.body === '{"id":null}', r.body];
    },
  ],
  [
    "PAIN_MODEL swaps the model",
    async () => {
      process.env.PAIN_MODEL = "some/other-model";
      stub(said('{"id":"files"}'));
      await ask({ text: "can't find the plans" });
      delete process.env.PAIN_MODEL;
      const m = JSON.parse(calls[0].init.body).model;
      return [m === "some/other-model", m];
    },
  ],
  [
    "bad input → 400 (over 200 chars, empty, blank, not JSON, no text), nothing called",
    async () => {
      stub(said('{"id":"costing"}'));
      const rs = [];
      for (const b of [{ text: "x".repeat(201) }, { text: "" }, { text: "   " }, "not json", { nope: 1 }, { text: 42 }]) rs.push((await ask(b)).status);
      const edge = (await ask({ text: "y".repeat(200) })).status;
      return [rs.every((s) => s === 400) && edge === 200 && calls.length === 1, `${rs.join(" ")}; 200 chars → ${edge}`];
    },
  ],
  [
    "upstream 401 / 500 → 200 no match with a reason, no body or key passed on",
    async () => {
      const out = [];
      for (const status of [401, 500]) {
        stub(() => new Response(SECRET_BODY, { status }));
        out.push(await read(await ask({ text: "dump tickets" })));
      }
      const ok = out.every((r) => r.status === 200 && r.body === '{"id":null,"reason":"upstream"}');
      return [ok, out.map((r) => `${r.status} ${r.body}`).join(" / ")];
    },
  ],
  [
    "network error and unreadable answers → no match with a reason",
    async () => {
      const out = [];
      stub(() => {
        throw new TypeError("fetch failed");
      });
      out.push(await read(await ask({ text: "dump tickets" })));
      stub(() => new Response("<html>oops</html>", { status: 200 }));
      out.push(await read(await ask({ text: "dump tickets" })));
      stub(said('{"id": costing'));
      out.push(await read(await ask({ text: "dump tickets" })));
      stub(() => new Response(JSON.stringify({ error: { message: SECRET_BODY } }), { status: 200 }));
      out.push(await read(await ask({ text: "dump tickets" })));
      const ok = out.every((r) => r.status === 200 && r.body === '{"id":null,"reason":"upstream"}');
      return [ok, out.map((r) => r.body).join(" / ")];
    },
  ],
  [
    "a model that hangs is cut off at ~6 s → no match with a reason",
    async () => {
      stub((init) => new Promise((_, rej) => init.signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")))));
      const t0 = Date.now();
      const r = await read(await ask({ text: "dump tickets" }));
      const s = (Date.now() - t0) / 1000;
      return [r.body === '{"id":null,"reason":"upstream"}' && s > 5 && s < 8, `${r.body} after ${s.toFixed(1)} s`];
    },
  ],
  [
    "nothing typed, no key and no upstream body ever reaches a log",
    async () => {
      const typed = ["don't know if a job made money", "dump tickets", "my dog keeps barking", "payroll is a mess", "can't find the plans"];
      const leaked = logs.filter((l) => typed.some((t) => l.includes(t)) || l.includes(KEY) || l.includes(SECRET_BODY));
      return [!leaked.length, `${logs.length} log lines (${[...new Set(logs)].join("; ") || "none"})${leaked.length ? `; LEAKED: ${leaked[0]}` : ""}`];
    },
  ],
];

for (const [name, fn] of apiChecks) {
  let ok = false;
  let detail = "";
  try {
    [ok, detail] = await fn();
  } catch (err) {
    detail = `threw ${err?.stack ?? err}`;
  }
  if (!ok) bad++;
  console.log(`  ${ok ? "✓" : "✗"}  ${name}${detail ? `  (${String(detail).slice(0, 200)})` : ""}`);
}
globalThis.fetch = realFetch;

console.log(bad ? `\n${bad} problem(s)` : "\nAll good.");
process.exit(bad ? 1 : 0);
