#!/usr/bin/env node
// End-to-end test of the whole funnel: product page → popup → /book, on a laptop (1440×660, mouse)
// and on an iPhone in the Facebook in-app browser (390×664, touch, DPR 3, FBAN/FBIOS user agent).
//
//   node tools/e2e.mjs [baseUrl=http://127.0.0.1:5310] [--only=<text>] [--headed]
//   npm run e2e -- [baseUrl]
//
// Works against the dev server or a built preview (vite preview). It never books a time on
// Andrew's Cal.com: it stops once his calendar has mounted. It never sends a lead anywhere either
// (config.leadWebhook is empty on previews; the test asserts nothing is posted). Round 4 (Andrew's
// Oct 16 feedback): no ride and no 3D, the popup has two steps, /book is one page (video, calendar beside it, his confirmation page once booked). Elements are found the way a visitor
// finds them, by role and name (buttons named "Try SmartCrew", headings, links), plus a few
// stable hooks: #hero-cta / [data-hero-cta], data-testid="sticky-bar|book-cal|book-video|book-covers",
// the smartcrew:signup event every CTA fires (src/signup/contract.ts), and the popup's storage
// hand-off to /book (sessionStorage "sc_lead", src/lib/lead.ts). Taps land where the page itself
// says the element is on screen, opaque, uncovered and still (see press()). There is no intro any
// more: the test asserts none comes back and that the hero's CTA is clickable within 2.5 s.
// Prints a PASS/FAIL table; exits 1 if anything failed.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } = require("/opt/node22/lib/node_modules/playwright"));
}

const args = process.argv.slice(2);
const BASE = (args.find((a) => !a.startsWith("--")) ?? "http://127.0.0.1:5310").replace(/\/$/, "");
const ONLY = args.find((a) => a.startsWith("--only="))?.slice(7).toLowerCase();
const HEADED = args.includes("--headed");
// --look=glass runs every check in the glass look (src/lib/look.ts reads it from sessionStorage)
const LOOK = args.find((a) => a.startsWith("--look="))?.slice(7);
const DEBUG = !!process.env.E2E_DEBUG;
const ROOT = fileURLToPath(new URL("../", import.meta.url));

// ─── what the page should say, read from the source (so copy changes don't break the test) ────
const copySrc = readFileSync(`${ROOT}src/content/copy.ts`, "utf8");
const configSrc = readFileSync(`${ROOT}src/config.ts`, "utf8");
const SIZE = copySrc.match(/SIZE: "([^"]+)"/)?.[1] ?? "";
const HERO_H1 = (copySrc.match(/export const HERO4 = \{[\s\S]*?h1: `([^`]+)`/)?.[1] ?? "").replace("${T.SIZE}", SIZE);
const LOGIN_URL = configSrc.match(/loginUrl:\s*"([^"]+)"/)?.[1];
const VIDEO_ID = configSrc.match(/walkthrough:\s*"([^"]+)"/)?.[1];
const norm = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9$]/g, "");

// ─── devices ────────────────────────────────────────────────────────────────────────────────
const FB_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22A3354 [FBAN/FBIOS;FBAV/480.0.0.0;FBBV/0;FBDV/iPhone16,2;FBMD/iPhone;FBSN/iOS;FBSV/18.0;FBSS/3;FBCR/;FBID/phone;FBLC/en_US;FBOP/5]";
// DPR 1 on the laptop: headless WebGL is software-rendered, and 4× the pixels only makes every
// frame (and so every scroll-driven beat and every in-page call) slower
const DESKTOP = { name: "desktop", ctx: { viewport: { width: 1440, height: 660 }, deviceScaleFactor: 1 }, settle: 900 };
const PHONE = {
  name: "phone",
  ctx: { viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: FB_UA },
  settle: 500,
};
const GL_ARGS = ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"];
const NO_GL_ARGS = ["--disable-webgl", "--disable-3d-apis", "--disable-gpu"];

// ─── noise we ignore (third-party embeds, and the headless browser itself) ──────────────────
const THIRD_PARTY = /(^|\.)(cal\.com|vidalytics\.com|cloudfront\.net|vimeocdn\.com|googleapis\.com|gstatic\.com|google\.com|stripe\.com|sentry\.io|intercom\.io|posthog\.com|amplitude\.com|hotjar\.com)$/i;
const IGNORED = [
  ["third-party embed (Cal.com / Vidalytics) console messages and requests", (e) => e.thirdParty],
  ["headless Chromium has no H.264/HLS codecs (MEDIA_ERR_SRC_NOT_SUPPORTED / Vidalytics player)", (e) => /MEDIA_ERR|SRC_NOT_SUPPORTED|vidalytics/i.test(e.text)],
  ["requests cancelled by a navigation or a page close (net::ERR_ABORTED)", (e) => e.kind === "requestfailed" && /ERR_ABORTED/.test(e.text)],
  ["the /book prefetch the popup warms up (cancelled when the page moves on)", (e) => e.kind === "requestfailed" && /\/book\/?$/.test(e.url)],
  ["Vite dev server HMR socket", (e) => /\[vite\]|@vite\/client|ws:\/\//i.test(e.text + e.url)],
  ["Chromium's own WebGL performance warnings in software rendering", (e) => /GPU stall|GL_CLOSE_PATH|Automatic fallback to software WebGL|swiftshader/i.test(e.text)],
  ["browser preload hints (warnings, not errors)", (e) => /was preloaded using link preload but not used/i.test(e.text)],
];
const ignoredHits = new Map();

// ─── result table ───────────────────────────────────────────────────────────────────────────
const results = [];
let current = null;
async function check(group, name, fn, { timeout = 120000 } = {}) {
  const label = `${group} · ${name}`;
  if (ONLY && !label.toLowerCase().includes(ONLY)) return;
  const t0 = Date.now();
  current = { notes: [] };
  let status = "PASS";
  let detail = "";
  try {
    const r = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error(`timed out after ${timeout / 1000}s`)), timeout))]);
    if (r === "SKIP") status = "SKIP";
    else if (typeof r === "string") detail = r;
  } catch (e) {
    status = "FAIL";
    detail = String(e?.message ?? e).split("\n")[0].slice(0, 220);
  }
  if (current.notes.length) detail = [detail, ...current.notes].filter(Boolean).join("; ");
  results.push({ group, name, status, ms: Date.now() - t0, detail });
  const mark = status === "PASS" ? "PASS" : status === "SKIP" ? "SKIP" : "FAIL";
  console.log(`  ${mark}  ${label}${detail ? `  (${detail.slice(0, 160)})` : ""}`);
}
const note = (s) => current?.notes.push(s);
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ─── browser plumbing: console errors, failed requests, every URL requested ─────────────────
const browsers = {};
async function browser(kind = "gl") {
  if (!browsers[kind]) browsers[kind] = await chromium.launch({ headless: !HEADED, args: kind === "nogl" ? NO_GL_ARGS : GL_ARGS });
  return browsers[kind];
}

const problems = []; // { where, kind, text, url, thirdParty }
const touchCtx = new WeakMap(); // context → taps (phone) or clicks (laptop)
const requested = { desktop: [], phone: [] };

function hostOf(u) {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
}
const baseHost = hostOf(BASE);

async function newContext(device, { kind = "gl", reducedMotion, init } = {}) {
  const b = await browser(kind);
  const ctx = await b.newContext({ ...device.ctx, reducedMotion: reducedMotion ?? "no-preference", locale: "en-US", timezoneId: "America/Chicago" });
  // every CTA fires this event (src/signup/contract.ts): the test reads what it carried
  await ctx.addInitScript(() => {
    window.__signups = [];
    window.addEventListener("smartcrew:signup", (e) => window.__signups.push(e.detail));
    // when the main thread last came out of a stall of a second or more (headless software WebGL
    // parsing the models and compiling shaders): the laptop checks wait for a quiet page first
    window.__stallEnd = 0;
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => e.duration > 1000 && (window.__stallEnd = Math.max(window.__stallEnd, e.startTime + e.duration)))).observe({ type: "longtask", buffered: true });
    } catch {}
  });
  if (LOOK) await ctx.addInitScript((look) => { try { sessionStorage.setItem("sc-look", look); } catch {} }, LOOK);
  if (init) await ctx.addInitScript(init.fn, init.arg);
  ctx.on("page", (p) => watch(p, device.name));
  touchCtx.set(ctx, !!device.ctx.hasTouch);
  return ctx;
}

function watch(page, where) {
  const push = (kind, text, url) => {
    const host = hostOf(url);
    const thirdParty = !!host && host !== baseHost && (THIRD_PARTY.test(host) || !/^(127\.0\.0\.1|localhost)$/.test(host));
    const e = { where, kind, text: String(text).slice(0, 300), url: url ?? "", thirdParty };
    const ig = IGNORED.find(([, f]) => f(e));
    if (ig) ignoredHits.set(ig[0], (ignoredHits.get(ig[0]) ?? 0) + 1);
    else problems.push(e);
  };
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    push("console.error", m.text(), m.location()?.url);
  });
  page.on("pageerror", (err) => push("pageerror", err.message, page.url()));
  page.on("requestfailed", (r) => push("requestfailed", `${r.failure()?.errorText ?? "failed"} ${r.url()}`, r.url()));
  page.on("response", (r) => {
    if (r.status() >= 400) push("http", `${r.status()} ${r.url()}`, r.url());
  });
  page.on("request", (r) => requested[where]?.push(r.url()));
}

// ─── page helpers ───────────────────────────────────────────────────────────────────────────
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(ctx, path = "/") {
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  return page;
}

/** Phones mount the scenes after the hero one by one; laptops load them in parallel. */
async function waitScenes(page, ms = 30000) {
  await page.waitForSelector("#footer", { state: "attached", timeout: ms });
  await wait(600);
  // laptops: the 3D has drawn (or fallen back to its stills) and the page has stopped stalling
  if (!touchCtx.get(page.context())) {
    await page.waitForSelector("html.stage-ready, html.stage-fallback", { state: "attached", timeout: 60000 }).catch(() => note("the 3D never reported ready"));
    await quiet(page);
  }
}

/**
 * Wait until the main thread has gone 1.5 s without a stall of a second or more. Headless WebGL
 * is software-rendered: parsing the models, compiling shaders and uploading textures can block the
 * page for several seconds (a GPU does it in a blink), and a tap sent meanwhile lands late.
 */
async function quiet(page, max = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < max) {
    const since = await page.evaluate(() => performance.now() - (window.__stallEnd || 0)).catch(() => 0);
    if (since > 1500) return;
    await wait(300);
  }
  note("the page never went quiet (main-thread stalls)");
}

async function scrollTo(page, y, settle) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
  await wait(settle);
}

/** Scroll so the element's section is at a progress point (0 = its top at the viewport top). */
async function scrollSection(page, sel, p, settle) {
  const y = await page.evaluate(
    ({ sel, p }) => {
      const s = document.querySelector(sel);
      if (!s) return null;
      const top = s.getBoundingClientRect().top + scrollY;
      const span = Math.max(0, s.offsetHeight - innerHeight);
      return Math.round(top + span * p);
    },
    { sel, p },
  );
  assert(y != null, `${sel} not on the page`);
  await scrollTo(page, y, settle);
}

/** In-page: actually visible (on screen, opaque, not inert, not covered at its centre). */
const VISIBLE_FN = `(el) => {
  if (!el || !el.isConnected || el.closest('[inert]')) return false;
  const r = el.getBoundingClientRect();
  const top = Math.max(r.top, 0), bot = Math.min(r.bottom, innerHeight), left = Math.max(r.left, 0), right = Math.min(r.right, innerWidth);
  if (bot - top < 8 || right - left < 8) return false;
  if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
  let o = 1;
  for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
    const cs = getComputedStyle(e);
    o *= parseFloat(cs.opacity);
    const f = cs.filter && cs.filter.match(/opacity\\(([\\d.]+)\\)/);
    if (f) o *= parseFloat(f[1]);
  }
  if (o < 0.6) return false;
  const at = document.elementFromPoint((left + right) / 2, (top + bot) / 2);
  return !!at && (at === el || el.contains(at));
}`;

async function isVisible(locator) {
  // a generous timeout: a software-rendered WebGL frame can hold the main thread for a second or two
  const h = await locator.elementHandle({ timeout: 5000 }).catch(() => null);
  if (!h) return false;
  return h.evaluate(new Function(`return (${VISIBLE_FN})`)()).catch(() => false);
}

/** In-page: why an element can't be tapped (for the error message). */
const WHY_FN = `(el) => {
  if (performance.now() - (window.__stallEnd || 0) < 3000) return "the page was stalled (main thread blocked for seconds)";
  if (!el.isConnected) return "detached";
  if (el.closest("[inert]")) return "inert";
  const r = el.getBoundingClientRect();
  const top = Math.max(r.top, 0), bot = Math.min(r.bottom, innerHeight), left = Math.max(r.left, 0), right = Math.min(r.right, innerWidth);
  if (bot - top < 8 || right - left < 8) return "off screen (" + Math.round(r.top) + "–" + Math.round(r.bottom) + " px)";
  let o = 1;
  for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
  if (o < 0.6) return "transparent (opacity " + o.toFixed(2) + ")";
  const at = document.elementFromPoint((left + right) / 2, (top + bot) / 2);
  if (at && at !== el && !el.contains(at)) return "covered by " + at.tagName.toLowerCase() + "." + [...at.classList].slice(0, 2).join(".") + (at.parentElement ? " in " + at.parentElement.tagName.toLowerCase() + "." + [...at.parentElement.classList].slice(0, 2).join(".") : "");
  return "not shown";
}`;

/** Where to tap the element now: the centre of its on-screen part, if it is tappable there. */
async function pointOf(locator) {
  const h = await locator.elementHandle({ timeout: 5000 }).catch(() => null);
  if (!h) return null;
  return h
    .evaluate((el, vis) => {
      if (!new Function(`return (${vis})`)()(el)) return null;
      const r = el.getBoundingClientRect();
      return [(Math.max(r.left, 0) + Math.min(r.right, innerWidth)) / 2, (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2];
    }, VISIBLE_FN)
    .catch(() => null);
}

/** Two looks at a point 120 ms apart: tap only once it holds still (a sheet sliding up, a beat moving in). */
async function settledPoint(get) {
  const a = await get();
  if (!a) return null;
  await wait(120);
  const b = await get();
  return b && Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) < 1 ? b : null;
}

async function tapAt(page, pt) {
  if (touchCtx.get(page.context())) await page.touchscreen.tap(pt[0], pt[1]);
  else await page.mouse.click(pt[0], pt[1]);
}

/**
 * Tap (phone) or click (laptop) an element the way a visitor does: once the page itself reports it
 * on screen, opaque, not inert and uncovered at its centre (elementFromPoint), and holding still,
 * at that centre. Playwright's own actionability wait needs consecutive animation frames to agree,
 * which a software-rendered WebGL page (2–5 fps headless) can take many seconds to give.
 */
async function press(page, locator, { timeout = 30000, what = "element", patient = true } = {}) {
  const t0 = Date.now();
  let deadline = t0 + timeout;
  for (;;) {
    const pt = await settledPoint(() => pointOf(locator));
    if (pt) return tapAt(page, pt);
    // a stalled page (software WebGL compiling) doesn't count against the element: wait it out
    const stalled = await page.evaluate(() => performance.now() - (window.__stallEnd || 0) < 2500).catch(() => true);
    if (patient && stalled && Date.now() - t0 < timeout * 3) {
      const q0 = Date.now();
      await quiet(page, 30000);
      deadline += Date.now() - q0;
    }
    if (Date.now() > deadline) {
      const why = await locator.evaluate(new Function(`return (${WHY_FN})`)(), null, { timeout: 8000 }).catch((e) => `not found (${String(e?.message ?? e).split("\n")[0].slice(0, 80)})`);
      throw new Error(`${what} can't be tapped: ${why}`);
    }
    await wait(100);
  }
}

const POPUP_NAME = /set up your smartcrew|book your demo with andrew|who.s setting|where can andrew/i;
const popup = (page) => page.getByRole("dialog", { name: POPUP_NAME });

async function expectPopup(page, ms = 10000) {
  await popup(page).waitFor({ state: "visible", timeout: ms });
}
/**
 * Close the popup with its Close button. The hero checks hold the button to it; the long walks
 * (lenient) fall back to Esc when the page is too stalled for a tap (software WebGL behind the
 * popup) and say so in the result.
 */
async function closePopup(page, { lenient = false } = {}) {
  const d = popup(page);
  await press(page, d.getByRole("button", { name: "Close", exact: true }), { what: "the popup's Close", timeout: lenient ? 8000 : 30000, patient: !lenient }).catch(async (e) => {
    if (lenient && !/covered by|transparent|inert|off screen|detached/.test(e.message)) {
      if (!current?.notes.some((n) => n.startsWith("closed the popup with Esc"))) note("closed the popup with Esc where the page was too stalled to tap Close");
      await page.keyboard.press("Escape");
      return;
    }
    const dialogs = await page
      .evaluate(() =>
        [...document.querySelectorAll("[role=dialog]")]
          .map((x) => {
            const btns = [...x.querySelectorAll("button")].filter((b) => /close/i.test(b.getAttribute("aria-label") || b.textContent || "")).map((b) => `${b.getAttribute("aria-label") || b.textContent.trim()}${b.closest("[inert]") ? " (inert)" : ""}${b.closest("[aria-hidden=true]") ? " (aria-hidden)" : ""}${b.checkVisibility() ? "" : " (hidden)"}`);
            return `"${document.getElementById(x.getAttribute("aria-labelledby") ?? "")?.textContent ?? x.getAttribute("aria-label")}" shown=${x.checkVisibility()} close=[${btns.join("; ")}]`;
          })
          .join(", "),
      )
      .catch(() => "?");
    throw new Error(`${e.message}; dialogs: ${dialogs || "none"}`);
  });
  await d.waitFor({ state: "hidden", timeout: 10000 });
  await wait(250);
}

const signups = (page) => page.evaluate(() => window.__signups.slice());

/** The H1's accessible name (a hero may draw its headline in split, aria-hidden lines). */
async function h1Name(page) {
  const h1 = page.getByRole("heading", { level: 1 }).first();
  await h1.waitFor({ state: "visible", timeout: 15000 });
  const snap = await h1.ariaSnapshot().catch(() => "");
  const m = snap.match(/heading "((?:[^"\\]|\\.)*)"/);
  return m ? m[1].replace(/\\"/g, '"') : (await h1.innerText()).replace(/\s+/g, " ");
}

/** The hero's primary CTA: id="hero-cta" (kept by every hero version), else the [data-hero-cta] block's button. */
async function heroCta(page) {
  const byId = page.locator("#hero-cta");
  if (await byId.count()) return byId.first();
  return page.locator("[data-hero-cta]").getByRole("button", { name: /try smartcrew/i }).first();
}

// ─── the CTA walk: scroll the whole page like a visitor, click every CTA met, check the popup ──
const CTA_TEXT = /try smartcrew|book a demo (with andrew|today)|set up smartcrew for your crew/i;

/**
 * In-page: every CTA button with its key (zone|name|n: the section or test id it sits in, its
 * name, and which of the same-named buttons in that section it is). Keys, not element handles:
 * a scene may re-render a button between two looks (One Day swaps its inline CTA per moment).
 */
const CTA_LIB = `(re) => {
  const rx = new RegExp(re, "i");
  const nameOf = (b) => (b.getAttribute("aria-label") || b.textContent || "").trim().replace(/\\s+/g, " ");
  const all = [...document.querySelectorAll("button")].filter((b) => rx.test(nameOf(b)));
  return all.map((b) => {
    const zone = b.closest("[data-testid]")?.getAttribute("data-testid") || b.closest("section[id]")?.id || (b.closest("header") ? "header" : "page");
    const name = nameOf(b);
    const sec = b.closest("section[id]")?.id ?? "";
    const twins = all.filter((x) => (x.closest("section[id]")?.id ?? "") === sec && nameOf(x) === name);
    return { b, zone, name, key: zone + "|" + name + "|" + twins.indexOf(b) };
  });
}`;

/** In-page: the visible CTAs not clicked yet; how many on screen are still waiting for their beat. */
const SCAN_FN = `({ re, vis, lib, done }) => {
  const isVis = new Function("return (" + vis + ")")();
  const ctas = new Function("return (" + lib + ")")()(re);
  const found = [];
  let waiting = 0;
  for (const { b, zone, key } of ctas) {
    if (done.includes(key)) continue;
    if (isVis(b)) {
      found.push(key);
      continue;
    }
    // a scene CTA on screen but not shown yet (inert or fading in on its beat): worth a wait.
    // The header's and the sticky bar's are hidden on purpose, so they don't count.
    if (zone === "header" || zone === "sticky-bar") continue;
    const r = b.getBoundingClientRect();
    if (r.width && r.bottom > 0 && r.top < innerHeight) waiting++;
  }
  return { found, waiting };
}`;

/** In-page: where to tap the CTA with this key now (or a same-named one in its zone), if it's tappable. */
const POINT_FN = `({ re, vis, lib, key }) => {
  const isVis = new Function("return (" + vis + ")")();
  const ctas = new Function("return (" + lib + ")")()(re);
  const [zone, name] = key.split("|");
  const hit = ctas.find((c) => c.key === key && isVis(c.b)) || ctas.find((c) => c.zone === zone && c.name === name && isVis(c.b));
  if (!hit) return null;
  const r = hit.b.getBoundingClientRect();
  return [(Math.max(r.left, 0) + Math.min(r.right, innerWidth)) / 2, (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2];
}`;

async function ctaWalk(page, device, stepVh) {
  const H = device.ctx.viewport.height;
  const seen = new Map(); // key → { source, intent }
  const run = (fn, a) => page.evaluate(([f, arg]) => new Function(`return (${f})`)()(arg), [fn, { re: CTA_TEXT.source, vis: VISIBLE_FN, lib: CTA_LIB, ...a }]);
  let y = 0;
  let total = await page.evaluate(() => document.documentElement.scrollHeight);
  while (y <= total) {
    await scrollTo(page, y, device.settle);
    let { found, waiting } = await run(SCAN_FN, { done: [...seen.keys()] });
    // a CTA that comes in on its scene's beat (Five apps, the FAQ close after the offer's leaves)
    for (let t = 0; !found.length && waiting && t < 12; t++) {
      await wait(400);
      ({ found, waiting } = await run(SCAN_FN, { done: [...seen.keys()] }));
    }
    if (DEBUG) console.log(`    walk y=${y} scrollY=${await page.evaluate(() => Math.round(scrollY))} new=${found.join(", ")}${waiting ? ` waiting=${waiting}` : ""}`);
    for (const key of found) {
      const before = (await signups(page)).length;
      // still there and tappable (a beat may have moved on)? give it a moment
      let pt = null;
      for (let t0 = Date.now(); !pt && Date.now() - t0 < 4000; ) {
        pt = await settledPoint(() => run(POINT_FN, { key }));
        if (!pt) await wait(150);
      }
      if (!pt) {
        if (DEBUG) console.log(`    skipped ${key}: no longer tappable`);
        continue;
      }
      await tapAt(page, pt);
      await expectPopup(page).catch(() => {
        throw new Error(`CTA "${key}" did not open the popup`);
      });
      const after = await signups(page);
      assert(after.length > before, `CTA "${key}" opened no smartcrew:signup event`);
      const s = after[after.length - 1];
      seen.set(key, { source: s.source, intent: s.intent });
      await closePopup(page, { lenient: true });
    }
    y += Math.round(H * stepVh);
    total = await page.evaluate(() => document.documentElement.scrollHeight);
  }
  return seen;
}

// ─── checks ─────────────────────────────────────────────────────────────────────────────────

async function heroBasics(device) {
  const ctx = await newContext(device);
  const page = await open(ctx);
  try {
    const text = await h1Name(page);
    assert(HERO_H1 && norm(text) === norm(HERO_H1), `H1 "${text}" is not HERO4.h1 "${HERO_H1}"`);
    const cta = await heroCta(page);
    await cta.waitFor({ state: "visible", timeout: 10000 });
    await press(page, cta, { what: "the hero CTA" });
    const box = await cta.boundingBox();
    assert(box && box.y + box.height <= device.ctx.viewport.height, "hero CTA is below the first screen");
    await expectPopup(page);
    const s = (await signups(page)).pop();
    assert(s?.source === "hero" && s?.intent === "trial", `hero CTA sent ${JSON.stringify(s)}`);
    await closePopup(page);
    return `CTA at y=${Math.round(box.y)}–${Math.round(box.y + box.height)}`;
  } finally {
    await ctx.close();
  }
}

async function everyCta(device) {
  const ctx = await newContext(device);
  const page = await open(ctx);
  try {
    await waitScenes(page);
    const seen = await ctaWalk(page, device, device.name === "phone" ? 0.5 : 0.4);
    const sources = [...new Set([...seen.values()].map((v) => `${v.source}${v.intent === "demo" ? "(demo)" : ""}`))];
    // the CTAs a visitor must meet just by scrolling (Try it's and the pain picker's need a tap
    // first: their own checks click them)
    const shared = ["hero", "hero(demo)", "replace", "replace(demo)", "features-close", "watch-day", "calculator", "offer", "faq", "faq(demo)"];
    const need = device.name === "phone" ? ["sticky", ...shared] : ["header", ...shared];
    const missing = need.filter((n) => !sources.includes(n));
    assert(!missing.length, `never met (or never opened the popup): ${missing.join(", ")}; met: ${sources.join(", ")}`);
    return `${seen.size} CTAs clicked: ${sources.join(", ")}`;
  } finally {
    await ctx.close();
  }
}

/** In-page: where the orange (primary) buttons on screen are. */
const ORANGE_FN = `({ vis }) => {
  const isVis = new Function("return (" + vis + ")")();
  // orange = a button whose own face is safety orange (the ink text links don't count)
  const orange = (b) => {
    const m = getComputedStyle(b).backgroundColor.match(/\\d+(\\.\\d+)?/g);
    return !!m && +m[0] > 230 && +m[1] > 80 && +m[1] < 170 && +m[2] < 70 && (m[3] === undefined || +m[3] > 0.5);
  };
  return [...document.querySelectorAll("button")]
    .filter(orange)
    .filter(isVis)
    .map((b) => b.closest("[data-testid]")?.getAttribute("data-testid") || b.closest("section[id]")?.id || (b.closest("header") ? "header" : "?"));
}`;

async function oneOrangeAtATime(device) {
  // never two primary (orange) buttons on screen at once, sampled through the whole page
  const ctx = await newContext(device);
  const page = await open(ctx);
  try {
    await waitScenes(page);
    const H = device.ctx.viewport.height;
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const bad = [];
    for (let y = 0; y <= total; y += Math.round(H * 0.25)) {
      await scrollTo(page, y, device.settle + 300);
      const vis = await page.evaluate(new Function(`return (${ORANGE_FN})`)(), { vis: VISIBLE_FN });
      // two at once: the header's and the bar's step-aside runs on the next animation frame, which
      // headless software WebGL can hold back for a second or two; a real overlap is still there
      // after a quiet beat
      if (vis.length > 1) {
        await quiet(page, 10000);
        await wait(800);
        const again = await page.evaluate(new Function(`return (${ORANGE_FN})`)(), { vis: VISIBLE_FN });
        if (again.length > 1) bad.push(`y=${y}: ${again.join(" + ")}`);
        else note(`y=${y}: ${vis.join(" + ")} for a moment`);
      }
    }
    assert(!bad.length, `two orange CTAs at once: ${bad.slice(0, 4).join(" | ")}`);
    return `sampled every ${Math.round(H * 0.25)} px`;
  } finally {
    await ctx.close();
  }
}

async function headerLinks(device) {
  const ctx = await newContext(device);
  const page = await open(ctx);
  try {
    await waitScenes(page);
    const banner = page.getByRole("banner");
    const out = [];
    if (device.name === "desktop") {
      // Andrew's Loom (Oct 20): Features, How it works, FAQ; his page note: "Add about"
      for (const [name, id] of [
        ["FAQ", "faq"],
        ["Features", "features"],
        ["How it works", "watch"],
        ["About", "offer"],
      ]) {
        await scrollTo(page, 0, 300);
        await press(page, banner.getByRole("link", { name, exact: true }), { what: `the header's "${name}" link` });
        await wait(2600);
        const top = await page.evaluate((i) => document.getElementById(i)?.getBoundingClientRect().top ?? 9999, id);
        assert(Math.abs(top) < 140, `"${name}" left #${id} at ${Math.round(top)} px`);
        out.push(`${name} → #${id} (${Math.round(top)} px)`);
      }
    }
    const login = page.getByRole("link", { name: /^log in$/i }).first();
    const href = await login.getAttribute("href");
    assert(href === LOGIN_URL, `Log in href ${href} ≠ config.loginUrl ${LOGIN_URL}`);
    out.push(`Log in → ${href}`);
    return out.join("; ");
  } finally {
    await ctx.close();
  }
}

async function specSheet(device) {
  const ctx = await newContext(device);
  const page = await open(ctx);
  try {
    await waitScenes(page);
    await scrollSection(page, "#features", 0, device.settle);
    await wait(900);
    // "See all 38 tools": big, and it opens every tool
    const all = page.locator("section#features").getByRole("button", { name: /^see all \d+ tools/i }).first();
    await all.waitFor({ state: "visible", timeout: 8000 });
    // (on phones it sits under the six cards: scroll down to it, as a visitor would)
    await all.scrollIntoViewIfNeeded();
    await wait(300);
    await press(page, all, { what: "See all 38 tools" });
    const dialog = page.getByRole("dialog", { name: /all \d+ tools/i });
    await dialog.waitFor({ state: "visible", timeout: 5000 });
    const n = await dialog.locator("[data-tool]").count();
    assert(n === 38, `the list has ${n} tools, not 38`);
    // any tool starts the walkthrough there, and it plays on by itself
    const pick = dialog.locator('[data-tool="E2"]').first();
    // (on phones the list is a sheet that scrolls: bring the tool into view, as a visitor would)
    await pick.scrollIntoViewIfNeeded();
    await wait(300);
    await press(page, pick, { what: "a tool in the list" });
    const name = dialog.locator(".swk-name");
    await name.waitFor({ state: "visible", timeout: 5000 });
    const first = (await name.innerText()).trim();
    const count = (await dialog.locator(".swk-count").innerText()).replace(/\s+/g, " ").trim();
    assert(/^\d+ \/ 38$/.test(count), `the walkthrough's count reads "${count}"`);
    await wait(4400);
    const next = (await name.innerText()).trim();
    assert(next !== first, `the walkthrough didn't move on from "${first}"`);
    await press(page, dialog.getByRole("button", { name: /^close$/i }).first(), { what: "Close" });
    await dialog.waitFor({ state: "hidden", timeout: 5000 });
    return `38 tools; "${first}" (${count}) → "${next}" by itself; closes`;
  } finally {
    await ctx.close();
  }
}

/** The biggest pain picker: a chip or a typed headache answers "We have a feature for that." and
 *  opens that feature's card, in the owner's own words too ("dozer keeps going down"); a headache it
 *  can't place gets the trial button. A build with the server match (a Vercel build with the key,
 *  src/site/features/ask.ts) asks /api/match-pain first when the keywords aren't sure, so the
 *  no-match answer gets the server's time; elsewhere nothing is asked. */
async function painPicker(device) {
  const ctx = await newContext(device);
  const page = await open(ctx);
  const asked = [];
  page.on("request", (r) => {
    if (/\/api\/match-pain$/.test(new URL(r.url()).pathname)) asked.push(r.method());
  });
  try {
    await waitScenes(page);
    await scrollSection(page, "#features", 0, device.settle);
    await wait(900);
    const sec = page.locator("section#features");
    // classic: Andrew cut the picker (his Loom, Oct 20); the head and the ten cards stay
    if (!LOOK || LOOK === "classic") {
      assert(!(await sec.getByRole("textbox", { name: /type your own/i }).count()), "the pain picker is still on the classic page");
      assert(!(await sec.getByText(/biggest headache/i).count()), "“What’s your biggest headache?” is still on the classic page");
      assert(await sec.getByRole("heading", { name: /everything\. built for dirt\./i }).count(), "no “Everything. Built for dirt.” heading");
      // the feature wheel (Oct 20): all ten on the desktop wheel; on phones one card at a time,
      // its arrow steps through all ten
      let cards = await sec.locator("[data-testid^='feature-card-']").count();
      if (cards < 10) {
        const seen = new Set();
        const next = sec.getByRole("button", { name: /^next feature$/i }).first();
        for (let i = 0; i < 12 && seen.size < 10; i++) {
          seen.add(await sec.locator("[data-testid^='feature-card-']").first().getAttribute("data-testid"));
          if (await next.isDisabled()) break;
          await press(page, next, { what: "Next feature" });
          await wait(250);
        }
        cards = seen.size;
      }
      assert(cards >= 10, `${cards} features on the wheel, not 10`);
      return `classic: no picker; head and ${cards} features`;
    }
    const answer = sec.locator(".ft-answer");
    const said = async () => (await answer.innerText()).replace(/\s+/g, " ").trim();
    const saysSoon = async (re) => {
      for (let t = Date.now(); Date.now() - t < 5000; await wait(150)) if (re.test(await said())) break;
      return said();
    };
    const opened = (id) => sec.getByTestId(`feature-card-${id}`).first().getAttribute("aria-expanded");
    // a pick scrolls the opened card into view; a visitor scrolls back up to the picker to try again
    const toPicker = async () => {
      await wait(1200);
      const y = await input.evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY - innerHeight * 0.35));
      await scrollTo(page, Math.max(0, y), device.settle);
    };
    const input = sec.getByRole("textbox", { name: /type your own/i });
    // a chip
    const chip = sec.getByRole("button", { name: /^lost haul tickets$/i }).first();
    await chip.scrollIntoViewIfNeeded();
    await press(page, chip, { what: "the Lost haul tickets chip" });
    const a1 = await saysSoon(/we have a feature for that/i);
    assert(/materials & hauling/i.test(a1), `"Lost haul tickets" answered "${a1}"`);
    assert((await chip.getAttribute("aria-pressed")) === "true", "the chip doesn't show as picked");
    assert((await opened("materials")) === "true", "Materials & Hauling's card didn't open");
    // typed, sent with Enter
    await toPicker();
    await input.fill("my guys forget to clock out");
    await input.press("Enter");
    const a2 = await saysSoon(/time tracking/i);
    assert(/we have a feature for that/i.test(a2) && /time tracking/i.test(a2), `"my guys forget to clock out" answered "${a2}"`);
    assert((await opened("time")) === "true", "Time Tracking's card didn't open");
    // the owner's wording, not the card's
    await toPicker();
    await input.fill("dozer keeps going down");
    await input.press("Enter");
    const a2b = await saysSoon(/equipment management/i);
    assert(/we have a feature for that/i.test(a2b), `"dozer keeps going down" answered "${a2b}"`);
    assert((await opened("equipment")) === "true", "Equipment Management's card didn't open");
    // no match: the trial button, right under the field
    await toPicker();
    await input.fill("my dog keeps barking at night");
    await input.press("Enter");
    const cta = answer.getByRole("button", { name: /try smartcrew/i }).first();
    // (up to the server's 7.5 s where the build asks it)
    await cta.waitFor({ state: "visible", timeout: 10000 });
    const a3 = await said();
    await press(page, cta, { what: "the no-match CTA" });
    await expectPopup(page);
    const s = (await signups(page)).pop();
    assert(s?.source === "features-pain", `the no-match CTA sent ${JSON.stringify(s)}`);
    await closePopup(page);
    return `chip → "${a1}"; typed → "${a2}"; "dozer keeps going down" → Equipment; no match → "${a3.slice(0, 40)}…" + CTA → popup; server asked ${asked.length}×`;
  } finally {
    await ctx.close();
  }
}

async function tryIt(device) {
  const ctx = await newContext(device);
  const page = await open(ctx);
  try {
    await waitScenes(page);
    const sec = page.locator("section#try");
    const clockIn = sec.getByRole("button", { name: /^clock in$/i }).first();
    // "Clock out and try it yourself" under the phone (TRY_IT.again), not the app's own Clock Out
    const again = sec.getByRole("button", { name: /try it yourself|again/i }).first();
    // find the beat where the phone is live (Clock In, or Clock out once it has demoed itself)
    let ready = false;
    for (const p of [0.35, 0.5, 0.2, 0.65, 0.05, 0.8]) {
      await scrollSection(page, "#try", p, device.settle + 500);
      if ((await isVisible(clockIn)) || (await isVisible(again))) {
        ready = true;
        break;
      }
    }
    assert(ready, "never found the live phone (Clock In or Clock out)");
    // the scene demos itself once, 4 s after it settles untouched (src/site/try/clock.ts): let it,
    // then clock out (that marks it touched), so the clock-in below is the visitor's own tap
    for (const t0 = Date.now(); Date.now() - t0 < 7000 && !(await isVisible(again)); ) await wait(300);
    if (await isVisible(again)) {
      await press(page, again, { what: "Clock out" });
      await wait(700);
    }
    await press(page, clockIn, { what: "Clock In" });
    await sec.getByText(/currently working on/i).first().waitFor({ state: "attached", timeout: 8000 });
    // classic (Andrew's Loom, Oct 20): only clocking in and out (and Break) work; the tabs and the
    // rest show but can't be tapped, and the jobsite caption under the phone is gone
    let simple = "";
    if (!LOOK || LOOK === "classic") {
      const app = sec.locator(".ca.is-simple").first();
      assert(await app.count(), "the Try it app isn't in its simple (clock in / out only) mode");
      const off = await app.locator("button[aria-disabled='true']").count();
      const tabs = await app.locator(".sc-tab[aria-disabled='true']").count();
      assert(off > 3 && tabs >= 4, `only ${off} controls (${tabs} tabs) are off in the simple app`);
      assert(!(await app.locator(".tp-clockout[aria-disabled='true'], .tp-break[aria-disabled='true']").count()), "Clock Out or Break is switched off");
      assert(!(await sec.locator(".try-cap, .tp-stamp").count()), "the jobsite caption is still under the phone");
      simple = `, simple app (${off} controls off)`;
    }
    // the CTA under the headline (or on phones the sheet's), or (while the tap has dimmed the rest of
    // the page: focus mode, src/site/try/focus.tsx) the one beside the phone / in the dimmed header
    const ctas = [sec.getByRole("button", { name: /try smartcrew/i }).first(), page.locator(".fx.is-open .fx-cta").getByRole("button", { name: /try smartcrew/i }).first()];
    let cta = null;
    for (const t0 = Date.now(); !cta && Date.now() - t0 < 6000; ) {
      for (const c of ctas) if (!cta && (await isVisible(c))) cta = c;
      if (!cta) await wait(250);
    }
    assert(cta, "no Try it CTA showed after the tap");
    await press(page, cta, { what: "Try it's CTA" });
    await expectPopup(page);
    const s = (await signups(page)).pop();
    assert(s?.source === "try", `Try it CTA sent ${JSON.stringify(s)}`);
    await closePopup(page);
    return `tap → clocked in${simple} → CTA → popup`;
  } finally {
    await ctx.close();
  }
}

async function yourNumber(device) {
  const ctx = await newContext(device);
  const page = await open(ctx);
  try {
    await waitScenes(page);
    const sec = page.locator("section#number");
    await scrollSection(page, "#number", 0, device.settle + 400);
    const slider = sec.getByRole("slider").first();
    await slider.waitFor({ state: "visible", timeout: 8000 });
    await slider.scrollIntoViewIfNeeded();
    await slider.focus();
    // it starts from the preset crew (src/site/number/calc.ts PRESET): set it from 1
    await page.keyboard.press("Home"); // 1
    await page.keyboard.press("PageUp"); // 11
    for (let i = 0; i < 7; i++) await page.keyboard.press("ArrowRight"); // 18
    const now = await slider.getAttribute("aria-valuenow");
    assert(now === "18", `slider at ${now}, expected 18`);
    for (const [group, value] of [
      [/minutes lost/i, "15"],
      [/hourly/i, "$40"],
    ]) {
      const b = sec.getByRole("group", { name: group }).getByRole("button", { name: value, exact: true });
      await b.scrollIntoViewIfNeeded();
      await press(page, b, { what: `the ${value} pick` });
    }
    const expected = (18 * 15 * 250 * 40) / 60; // crew × minutes × 250 workdays × $/hr ÷ 60
    const cta = sec.getByRole("button", { name: /try smartcrew/i }).first();
    await cta.scrollIntoViewIfNeeded();
    await press(page, cta, { what: "the calculator's CTA" });
    await expectPopup(page);
    const s = (await signups(page)).pop();
    assert(s?.source === "calculator", `calculator CTA sent source ${s?.source}`);
    assert(s?.size === "13–25", `crew size ${s?.size}, expected 13–25`);
    assert(s?.estimate?.crew === 18 && Math.round(s.estimate.annual) === expected, `estimate ${JSON.stringify(s?.estimate)}`);
    const dlg = await popup(page).innerText();
    const money = `$${expected.toLocaleString("en-US")}`;
    assert(dlg.includes("13–25"), "the popup doesn't show the crew size as saved");
    assert(dlg.includes(money), `the popup doesn't show the estimate ${money}`);
    await closePopup(page);
    return `18 people × 15 min × $40 → ${money} a year, carried into the popup (crew size 13–25 pre-filled)`;
  } finally {
    await ctx.close();
  }
}

async function faq(device) {
  const ctx = await newContext(device);
  const page = await open(ctx);
  try {
    await waitScenes(page);
    const sec = page.locator("section#faq");
    await scrollSection(page, "#faq", 0, device.settle);
    const qs = sec.locator("button[aria-expanded]");
    const n = await qs.count();
    assert(n >= 3, `only ${n} questions`);
    assert((await qs.nth(0).getAttribute("aria-expanded")) === "true", "the first answer isn't open by default");
    await qs.nth(1).scrollIntoViewIfNeeded();
    await press(page, qs.nth(1), { what: "the second question" });
    await wait(400);
    assert((await qs.nth(1).getAttribute("aria-expanded")) === "true", "a question didn't open");
    assert((await qs.nth(0).getAttribute("aria-expanded")) === "false", "two answers open at once");
    const region = page.locator(`#${await qs.nth(1).getAttribute("aria-controls")}`);
    assert((await region.innerText()).trim().length > 20, "the opened answer is empty");
    await press(page, qs.nth(1), { what: "the second question" });
    await wait(400);
    assert((await qs.nth(1).getAttribute("aria-expanded")) === "false", "a question didn't close");
    return `${n} questions, one open at a time`;
  } finally {
    await ctx.close();
  }
}

/** Round 4: the ?angle= headlines are off; every link shows Andrew's one headline. */
async function anglesOff(device) {
  const ctx = await newContext(device);
  try {
    const page = await open(ctx, "/?angle=crew");
    const got = await h1Name(page);
    assert(norm(got) === norm(HERO_H1), `?angle=crew: H1 "${got}" ≠ HERO4.h1`);
    return "?angle=crew shows HERO4.h1";
  } finally {
    await ctx.close();
  }
}

/** In-page: an intro or opening overlay still up (the old intro is gone: there must be none). */
const OVERLAY_FN = `() => {
  const out = [];
  const html = document.documentElement;
  for (const c of ["intro-on", "intro-skip"]) if (html.classList.contains(c)) out.push("html." + c);
  const vw = innerWidth, vh = innerHeight, area = vw * vh;
  const big = (el) => {
    const r = el.getBoundingClientRect();
    const w = Math.min(r.right, vw) - Math.max(r.left, 0), h = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    return w > 0 && h > 0 && w * h > area * 0.3;
  };
  const shown = (el) => (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) && parseFloat(getComputedStyle(el).opacity) > 0.05;
  const name = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.classList.length ? "." + [...el.classList].slice(0, 2).join(".") : "");
  // the old intro's layers, or any fixed layer named like an intro, an opening or a splash,
  // still covering the screen
  for (const el of document.querySelectorAll('#intro, #topo, [id*="intro" i], [class*="intro" i], [class*="splash" i], [class*="opening" i], [class*="preload" i]'))
    if (el !== html && el !== document.body && (el.id === "intro" || el.id === "topo" || getComputedStyle(el).position === "fixed") && shown(el) && big(el)) out.push(name(el));
  // whatever answers a tap at five points of the first screen: never a fixed full-screen layer
  // (the header is fixed but small; the backdrop and the 3D canvas take no pointer events)
  for (const [x, y] of [[0.5, 0.5], [0.25, 0.3], [0.75, 0.3], [0.25, 0.75], [0.75, 0.75]]) {
    for (let e = document.elementFromPoint(vw * x, vh * y); e && e !== html && e !== document.body; e = e.parentElement) {
      if (getComputedStyle(e).position === "fixed" && big(e) && !e.closest("header")) {
        out.push(name(e) + " (answers taps at " + x + "," + y + ")");
        break;
      }
    }
  }
  return [...new Set(out)];
}`;

/**
 * The old intro (a night map with notifications) is gone. A first visit straight from the ad
 * (fresh session, no query) shows no overlay, and the hero's orange CTA is on screen, uncovered,
 * opaque and clickable within 2.5 s of load: of navigation start on a build; of the load event on
 * the dev server (whose unbundled modules alone take seconds to fetch). The machine running the
 * test may be busy, which only ever adds time, so the best of three fresh loads counts.
 */
async function noIntroCtaFast(device) {
  const LIMIT = 2500;
  const runs = [];
  let lastOverlay = [];
  let clicked = false;
  for (let i = 0; i < 3; i++) {
    const ctx = await newContext(device);
    try {
      const page = await ctx.newPage();
      await page.goto(BASE + "/", { waitUntil: "commit", timeout: 60000 });
      const ready = await page
        .waitForFunction(
          ([vis]) => {
            const isVis = new Function(`return (${vis})`)();
            const b = document.getElementById("hero-cta") || document.querySelector("[data-hero-cta] button");
            return b && isVis(b) ? Math.round(performance.now()) : false;
          },
          [VISIBLE_FN],
          { timeout: 15000, polling: 40 },
        )
        .then((h) => h.jsonValue())
        .catch(() => null);
      const nav = await page.evaluate(() => {
        const n = performance.getEntriesByType("navigation")[0];
        return { load: Math.round(n?.loadEventStart || n?.domContentLoadedEventEnd || 0), dev: !!document.querySelector('script[src*="/@vite/client"]') };
      });
      const overlayNow = await page.evaluate((fn) => new Function(`return (${fn})`)()(), OVERLAY_FN);
      // and still none a beat later (nothing comes in over the hero after it's up)
      await wait(Math.max(0, 2600 - (ready ?? 0)) + 300);
      const overlayLater = await page.evaluate((fn) => new Function(`return (${fn})`)()(), OVERLAY_FN);
      lastOverlay = [...new Set([...overlayNow, ...overlayLater])];
      assert(!lastOverlay.length, `an intro/opening overlay is up: ${lastOverlay.join(", ")}`);
      const from = nav.dev ? nav.load : 0;
      runs.push({ ms: ready == null ? Infinity : ready - from, abs: ready, dev: nav.dev, load: nav.load });
      if (!clicked && ready != null) {
        // the CTA really works (clicked the way a visitor would)
        const cta = await heroCta(page);
        await press(page, cta, { what: "the hero CTA" });
        await expectPopup(page);
        await closePopup(page);
        clicked = true;
      }
      if (runs[runs.length - 1].ms <= LIMIT) break;
    } finally {
      await ctx.close();
    }
  }
  const best = runs.reduce((a, b) => (b.ms < a.ms ? b : a));
  const from = best.dev ? "after the load event (dev server)" : "after navigation start";
  const all = runs.map((r) => (r.ms === Infinity ? "never" : `${r.ms} ms`)).join(", ");
  assert(best.ms <= LIMIT, `hero CTA clickable only ${best.ms === Infinity ? "never (15 s)" : `${best.ms} ms`} ${from} (tries: ${all})`);
  return `no overlay; CTA clickable ${best.ms} ms ${from}${best.dev ? ` (${best.abs} ms after navigation start)` : ""}; tries: ${all}`;
}

async function reducedMotion(device) {
  const ctx = await newContext(device, { reducedMotion: "reduce" });
  try {
    const page = await open(ctx, "/");
    const h1 = page.getByRole("heading", { level: 1 }).first();
    await h1.waitFor({ state: "visible", timeout: 8000 });
    const cta = await heroCta(page);
    await cta.waitFor({ state: "visible", timeout: 5000 });
    const overlay = await page.evaluate((fn) => new Function(`return (${fn})`)()(), OVERLAY_FN);
    assert(!overlay.length, `an overlay is up: ${overlay.join(", ")}`);
    assert(norm(await h1Name(page)) === norm(HERO_H1), "the H1 isn't HERO4.h1");
    await press(page, cta, { what: "the hero CTA" });
    await expectPopup(page);
    await closePopup(page);
    return "hero in its end state, no overlay, popup works";
  } finally {
    await ctx.close();
  }
}

async function noWebgl() {
  // round 4: the page is all 2D, so it works the same without WebGL and never loads three.js
  const ctx = await newContext(DESKTOP, { kind: "nogl" });
  try {
    const page = await open(ctx);
    const h1 = page.getByRole("heading", { level: 1 }).first();
    await h1.waitFor({ state: "visible", timeout: 15000 });
    const cta = await heroCta(page);
    await press(page, cta, { what: "the hero CTA" });
    await expectPopup(page);
    await closePopup(page);
    await waitScenes(page);
    await scrollSection(page, "#watch", 0, 800);
    return "hero, popup and every section without WebGL";
  } finally {
    await ctx.close();
  }
}

/** Replace 5 apps: the six cards with the apps they replace, the SmartCrew box and its button. */
async function replaceApps(device) {
  const ctx = await newContext(device);
  const page = await open(ctx);
  try {
    await waitScenes(page);
    const sec = page.locator("section#replace");
    await scrollSection(page, "#replace", 0, device.settle);
    const h2 = (await sec.getByRole("heading", { level: 2 }).first().innerText()).replace(/\s+/g, " ");
    assert(/replace 5 apps/i.test(h2) && /smartcrew/i.test(h2), `heading "${h2}"`);
    const cards = await sec.locator('[data-testid^="rp-card-"]').count();
    assert(cards === 6, `${cards} cards, not 6`);
    assert(await sec.getByRole("heading", { level: 3, name: /materials & hauling/i }).count(), "no Materials & Hauling card");
    assert(await sec.getByTestId("rp-hub").count(), "no SmartCrew box");
    const cta = sec.getByRole("button", { name: /try smartcrew/i }).first();
    await cta.scrollIntoViewIfNeeded();
    await press(page, cta, { what: "Replace 5 apps' CTA" });
    await expectPopup(page);
    const s = (await signups(page)).pop();
    assert(s?.source === "replace", `Replace 5 apps' CTA sent ${JSON.stringify(s)}`);
    await closePopup(page);
    return "6 cards (with Materials & Hauling), the SmartCrew box, CTA → popup";
  } finally {
    await ctx.close();
  }
}

/**
 * Watch it work ("A Day In The Life"): three tabs (The Day, The Week, The Results) switch panels,
 * one panel shown at a time with its headline and items (read from src/content/watch.ts); an item
 * highlights and switches the devices' screens; each panel's button opens the popup with its
 * source; ← → move between the tabs; nothing pins or holds the scroll.
 */
async function watchItWork(device) {
  const src = readFileSync(`${ROOT}src/content/watch.ts`, "utf8");
  const want = [...src.matchAll(/id: "(day|week|results)",\s*name: "([^"]+)"[\s\S]*?headline: "([^"]+)"[\s\S]*?items: \[([\s\S]*?)\n\s*\],/g)].map((m) => ({
    id: m[1],
    name: m[2],
    headline: m[3],
    items: (m[4].match(/title: "/g) ?? []).length,
  }));
  assert(want.length === 3, `read ${want.length} tabs from src/content/watch.ts, not 3`);
  const ctx = await newContext(device);
  const page = await open(ctx);
  const centre = (loc) => loc.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  try {
    await waitScenes(page);
    const sec = page.locator("section#watch");
    await scrollSection(page, "#watch", 0, device.settle);
    // nothing pins: not a pinned scene, nothing sticky or fixed inside it
    const held = await page.evaluate(() => {
      const s = document.querySelector("section#watch");
      if (s.classList.contains("is-pinned")) return "the section is pinned";
      const el = [...s.querySelectorAll("*")].find((e) => /sticky|fixed/.test(getComputedStyle(e).position));
      return el ? `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} is ${getComputedStyle(el).position}` : "";
    });
    assert(!held, held);
    const tabs = sec.getByRole("tablist").getByRole("tab");
    assert((await tabs.count()) === 3, `${await tabs.count()} tabs, not 3`);
    assert((await tabs.nth(0).getAttribute("aria-selected")) === "true", "The Day isn't the tab open at first");
    const seen = [];
    for (let i = 0; i < 3; i++) {
      const w = want[i];
      const tab = tabs.nth(i);
      assert(new RegExp(w.name, "i").test(await tab.innerText()), `tab ${i + 1} reads "${(await tab.innerText()).replace(/\s+/g, " ")}", not ${w.name}`);
      await centre(tab);
      await wait(device.settle);
      await press(page, tab, { what: `the ${w.name} tab` });
      await wait(600);
      assert((await tab.getAttribute("aria-selected")) === "true", `${w.name} didn't open`);
      // one panel shown (getByRole leaves hidden ones out), with its headline and every item
      const panels = sec.getByRole("tabpanel");
      assert((await panels.count()) === 1, `${await panels.count()} panels shown under ${w.name}`);
      const panel = panels.first();
      const h3 = (await panel.getByRole("heading", { level: 3 }).innerText()).replace(/\s+/g, " ").trim();
      assert(norm(h3) === norm(w.headline), `${w.name}: headline "${h3}", not "${w.headline}"`);
      const items = panel.getByRole("listitem");
      assert((await items.count()) === w.items, `${w.name}: ${await items.count()} items, not ${w.items}`);
      for (let k = 0; k < w.items; k++) assert(await items.nth(k).isVisible(), `${w.name}: item ${k + 1} isn't shown`);
      // pointing at an item (laptop) or tapping it (phone) highlights it and switches the screens
      const dev = sec.locator("[data-phone]");
      const before = await dev.evaluate((d) => `${d.dataset.web ?? ""}|${d.dataset.phone}`);
      const item = items.nth(1).getByRole("button");
      await centre(item);
      await wait(device.settle);
      if (touchCtx.get(ctx)) await press(page, item, { what: `${w.name}'s second item` });
      else {
        const pt = await settledPoint(() => pointOf(item));
        assert(pt, `${w.name}'s second item can't be pointed at`);
        await page.mouse.move(pt[0], pt[1], { steps: 4 });
      }
      await wait(500);
      assert((await item.getAttribute("aria-current")) === "true", `${w.name}: the second item didn't highlight`);
      const after = await dev.evaluate((d) => `${d.dataset.web ?? ""}|${d.dataset.phone}`);
      assert(after !== before, `${w.name}: the devices stayed on ${before}`);
      // its button (one shown) opens the popup
      const ctas = sec.getByRole("button", { name: /try smartcrew|see smartcrew in action/i });
      assert((await ctas.count()) === 1, `${w.name}: ${await ctas.count()} buttons shown, not 1`);
      await centre(ctas.first());
      await wait(device.settle);
      await press(page, ctas.first(), { what: `${w.name}'s button` });
      await expectPopup(page);
      const s = (await signups(page)).pop();
      const intent = w.id === "week" ? "demo" : "trial";
      assert(s?.source === `watch-${w.id}` && s?.intent === intent, `${w.name}'s button sent ${JSON.stringify(s)}`);
      await closePopup(page);
      seen.push(`${w.name} (${w.items} items) → ${s.source}${intent === "demo" ? "(demo)" : ""}`);
    }
    // the keyboard: → from The Results wraps to The Day
    await tabs.nth(2).focus();
    await page.keyboard.press("ArrowRight");
    await wait(300);
    assert((await tabs.nth(0).getAttribute("aria-selected")) === "true", "→ on the last tab didn't open The Day");
    // the page scrolls straight past it (no hold): one more screen down, and it has moved
    const y0 = await page.evaluate(() => scrollY);
    await scrollTo(page, y0 + device.ctx.viewport.height, 400);
    assert((await page.evaluate(() => scrollY)) > y0 + 100, "the page didn't scroll past Watch it work");
    return `${seen.join(", ")}; items switch the screens; ← → keys; no hold`;
  } finally {
    await ctx.close();
  }
}

// Andrew's video on /book, faked: the real player can't play here (Vidalytics is blocked, and
// headless Chromium has no H.264), so Vidalytics' loader and player get stand-ins that hand the
// page a player the test can end (window.__vid.fire("ended"))
const FAKE_VIDALYTICS = `
  window.VidalyticsL = window.VidalyticsL || {};
  window.VidalyticsL.Loader = function () { this.loadScript = function (u, cb) { cb(); }; };
  window.Vidalytics = window.Vidalytics || {};
  window.Vidalytics.Embed = function () {
    this.run = function (id) {
      var h = {}, done = false, paused = false;
      var p = {
        on: function (ev, f) { (h[ev] = h[ev] || []).push(f); }, off: function () {},
        play: function () { paused = false; return Promise.resolve(); }, pause: function () { paused = true; },
        paused: function () { return paused; }, ended: function () { return done; }
      };
      window.__vid = { fire: function (ev) { if (ev === "ended") done = true; (h[ev] || []).forEach(function (f) { f(); }); }, paused: p.paused };
      var v = (window._vidalytics = window._vidalytics || {});
      v.embeds = v.embeds || {};
      (v.embeds[id] = v.embeds[id] || {}).player = p;
    };
  };`;

async function funnel(device) {
  const ctx = await newContext(device);
  await ctx.route(/fast\.vidalytics\.com\//, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_VIDALYTICS }));
  const page = await open(ctx);
  const out = [];
  try {
    const cta = await heroCta(page);
    await cta.waitFor({ state: "visible", timeout: 15000 });
    await press(page, cta, { what: "the hero CTA" });
    const dlg = popup(page);
    await dlg.waitFor({ state: "visible", timeout: 20000 });
    const cont = () => dlg.getByRole("button", { name: /^continue/i }).click();
    const errors = async () => (await dlg.getByRole("alert").allInnerTexts()).join(" | ");

    // step 1: nothing filled in → both errors
    await wait(400);
    await cont();
    await wait(500);
    let e = await errors();
    assert(/employees/i.test(e) && /company/i.test(e), `step 1 errors: "${e}"`);
    await dlg.getByRole("radio", { name: "13–25" }).click();
    await dlg.getByLabel("Company name").fill("QA Test Earthworks");
    await cont();
    await dlg.getByLabel("Your name").waitFor({ state: "visible", timeout: 15000 });
    out.push("step 1 errors + employees/company");

    // step 2: a bad email and a short number → errors; then good → /book
    const start = () => dlg.getByRole("button", { name: /get started|pick my time|pick my demo time/i }).click();
    await dlg.getByLabel("Your name").fill("Pat Tester");
    await dlg.getByLabel("Work email").fill("pat@example");
    await dlg.getByLabel("Cell phone").fill("555");
    await start();
    await wait(500);
    e = await errors();
    assert(/email/i.test(e) && /10-digit/i.test(e), `step 2 errors: "${e}"`);
    assert(!(await dlg.getByRole("checkbox", { name: /text me/i }).count()), "the popup still has the text-reminder box (Andrew cut it, Oct 20)");
    await dlg.getByLabel("Work email").fill("pat.tester@example.com");
    await dlg.getByLabel("Cell phone").fill("5555550123");
    await Promise.all([page.waitForURL(/\/book\/?(\?|$)/, { timeout: 15000 }), start()]);
    out.push("step 2 email + phone errors → /book");

    // nothing personal in the URL; the lead rides in sessionStorage
    assert(!/example\.com|Pat|5555550123/i.test(page.url()), `personal data in the URL: ${page.url()}`);
    const lead = await page.evaluate(() => JSON.parse(sessionStorage.getItem("sc_lead") || "null"));
    assert(lead, "no sc_lead in sessionStorage");
    assert(lead.company === "QA Test Earthworks" && lead.name === "Pat Tester" && lead.email === "pat.tester@example.com", `lead ${JSON.stringify(lead).slice(0, 160)}`);
    assert(lead.size === "13–25" && lead.phone_e164 === "+15555550123" && lead.stage === "complete", `lead size/phone ${lead.size} ${lead.phone_e164}`);
    out.push("lead handed over (company, name, email, phone, size)");

    // /book (Andrew's Loom, Oct 20): his headline; the video and the calendar on one page, the
    // calendar to the right of the video (under it on a phone), no skip gate
    const h1 = page.getByRole("heading", { level: 1 }).first();
    await h1.waitFor({ state: "visible", timeout: 10000 });
    assert(/one step away from getting started/i.test(await h1.innerText()), `/book H1 "${await h1.innerText()}" isn't Andrew's headline`);
    const bookText = await page.locator(".bk").innerText();
    assert(!/free trial request received/i.test(bookText), "the free-trial kicker is still on /book");
    assert(!/15-minute/i.test(bookText), "/book still says 15-minute");
    const video = page.getByTestId("book-video");
    assert(await video.isVisible(), "Andrew's video isn't on /book");
    assert(await page.locator(`#vidalytics_embed_${VIDEO_ID}`).count(), `no Vidalytics container #vidalytics_embed_${VIDEO_ID}`);
    const cardHead = page.locator("#bk-card-h");
    await cardHead.waitFor({ state: "visible", timeout: 10000 });
    assert(/quick demo/i.test(await cardHead.innerText()), `the calendar card says "${await cardHead.innerText()}"`);
    assert(!(await page.getByRole("button", { name: /skip the video/i }).count()), "the skip button is back");
    await page.waitForFunction(() => window.__vid, null, { timeout: 15000 }).catch(() => {});
    assert(await page.evaluate(() => !!window.__vid), "the page never got Andrew's video player");
    const vb = await video.boundingBox();
    const cb = await page.locator(".bk-card").boundingBox();
    if (device.name === "phone") assert(cb.y >= vb.y + vb.height - 2, `the calendar isn't under the video: card ${Math.round(cb.y)}, video ends ${Math.round(vb.y + vb.height)}`);
    else assert(cb.x >= vb.x + vb.width - 2 && cb.y < vb.y + vb.height, `the calendar isn't to the right of the video: ${JSON.stringify(cb)} vs ${JSON.stringify(vb)}`);
    out.push(`/book: video ${Math.round(vb.width)}px + calendar ${device.name === "phone" ? "under it" : "to its right"}, no gate`);

    // playing, then scrolled out of sight: it keeps playing in the top-left corner; its × stops it
    await page.evaluate(() => window.__vid.fire("play"));
    const slotEnd = await page.locator(".bk-video-slot").evaluate((el) => Math.round(el.getBoundingClientRect().bottom + scrollY));
    const room = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    if (room >= slotEnd) {
      await scrollTo(page, slotEnd + 20, 900);
      await page.waitForSelector(".bk-video.is-mini", { timeout: 4000 });
      const mini = await video.boundingBox();
      const fixed = await video.evaluate((el) => getComputedStyle(el).position);
      assert(fixed === "fixed" && mini && mini.x < 40 && mini.y < 40 && mini.width < vb.width * 0.8, `the video didn't go to the corner: ${fixed} ${JSON.stringify(mini)}`);
      assert(!(await page.evaluate(() => window.__vid.paused())), "the corner video isn't playing");
      await press(page, page.getByRole("button", { name: "Close the video" }), { what: "the corner video's ×" });
      await wait(400);
      assert(await page.evaluate(() => window.__vid.paused()), "the corner video's × didn't stop it");
      assert(!(await page.locator(".bk-video.is-mini").count()), "the corner video stayed after its ×");
      out.push(`scrolled away while playing → corner video ${Math.round(mini.width)}×${Math.round(mini.height)}, × stops it`);
      await scrollTo(page, 0, 600);
    } else note(`/book is too short here to scroll the video away (${room} < ${slotEnd}): corner player not checked`);

    const frame = page.getByTestId("book-cal").locator("iframe").first();
    // Cal.com mounts its iframe, or (when it can't be reached, as behind a locked-down network) the
    // calendar shows its fallback card: that is only a note when Cal.com itself was unreachable
    const failed = page.locator('[data-testid="book-cal"].is-failed');
    await Promise.race([frame.waitFor({ state: "attached", timeout: 25000 }), failed.waitFor({ state: "attached", timeout: 25000 })]).catch(() => {});
    let calNote = "";
    if (await frame.count()) {
      const src = (await frame.getAttribute("src")) ?? "";
      const q = new URL(src).searchParams;
      assert(/cal\.com/.test(src), `calendar iframe src ${src.slice(0, 80)}`);
      assert(q.get("name") === "Pat Tester" && q.get("email") === "pat.tester@example.com", `Cal prefill name=${q.get("name")} email=${q.get("email")}`);
      // the phone fills Cal's text-reminder field too (Andrew's Loom, Oct 20)
      assert(q.get("smsReminderNumber") === "+15555550123", `Cal's text-reminder number ${q.get("smsReminderNumber")}`);
      await page.waitForSelector('[data-testid="book-cal"].is-ready', { timeout: 25000 }).catch(() => note("Cal didn't report ready within 25 s"));
      calNote = "Cal prefilled (name+email)";
    } else {
      const calBlocked = requested[device.name].some((u) => /cal\.com/.test(u));
      assert(await failed.count(), "the calendar neither loaded nor showed its fallback");
      assert(await page.getByRole("link", { name: /open andrew.s calendar/i }).count(), "the calendar's fallback has no link to Cal.com");
      note(`Cal.com unreachable from this machine${calBlocked ? "" : " (no request seen)"}: the fallback card showed`);
      calNote = "Cal.com unreachable here: fallback card with its link";
    }
    out.push(calNote);

    // "Here's what we'll cover" (Andrew's three) under the calendar
    const topOf = (id) => page.getByTestId(id).evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY));
    const [calTop, covTop] = [await topOf("book-cal"), await topOf("book-covers")];
    assert(calTop < covTop, `/book order: calendar ${calTop}, covers ${covTop}`);
    const items = await page.getByTestId("book-covers").getByRole("heading", { level: 3 }).count();
    assert(items === 3, `${items} items under "Here's what we'll cover"`);

    // the video plays to the end in its place: nothing moves
    await page.evaluate(() => window.__vid.fire("ended"));
    await wait(400);
    assert(!(await page.locator(".bk-video.is-mini").count()), "the corner video showed after the video ended");
    out.push("video ends → stays in place");

    // Andrew's confirmation page (his doc, Oct 20 17:30Z): once booked, /book is his headline and
    // line over the video, the call's ticket under it, no calendar and no bullets. The booking is
    // faked in storage the way a Cal.com booking on this device leaves it (src/lib/lead.ts
    // saveBooking): never a real time on his calendar.
    await page.evaluate(() => {
      const s = new Date(Date.now() + 2 * 864e5);
      localStorage.setItem("sc_booking", JSON.stringify({ uid: "e2e", start: s.toISOString(), end: new Date(+s + 15 * 60e3).toISOString() }));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator(".bk-ticket").waitFor({ timeout: 10000 });
    const bookedH1 = (await page.locator("#bk-h1").textContent())?.trim();
    assert(bookedH1 === "You’re Booked! One Last Thing Before We Meet.", `booked headline "${bookedH1}"`);
    const bookedSub = (await page.locator(".bk-sub").textContent()) ?? "";
    assert(/so we can spend our call focusing on your company instead of covering the basics/i.test(bookedSub), `booked line "${bookedSub.slice(0, 80)}"`);
    const [vidTop, ticketTop] = [await topOf("book-video"), await page.locator(".bk-ticket").evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY))];
    assert(vidTop < ticketTop, `booked order: video ${vidTop}, ticket ${ticketTop}`);
    assert(!(await page.getByTestId("book-covers").count()) && !(await page.getByTestId("book-cal").count()), "the booked page still shows the calendar or the three bullets");
    await page.evaluate(() => localStorage.removeItem("sc_booking"));
    out.push("booked → his confirmation page (headline, line, video, ticket under it)");

    // no lead sent anywhere (no email to Andrew or the visitor from a test): leadWebhook is empty
    assert(/leadWebhook:\s*""/.test(configSrc), "config.leadWebhook is set: a test run would send leads");
    // no tracking IDs on previews
    const tracking = requested[device.name].filter((u) => /facebook\.(com|net)\/(tr|en_US\/fbevents)|googletagmanager\.com|google-analytics\.com/.test(u));
    assert(!tracking.length, `tracking requests went out: ${tracking[0]}`);
    return out.join("; ");
  } finally {
    await ctx.close();
  }
}

async function phoneNoThree() {
  // every URL every phone page requested in this run (all the phone checks above)
  const three = /\.glb(\?|$)|\/three(\.module|\.core|\.webgpu)?[.-][\w-]*\.js|\/deps\/three\.js|@react-three|react-three-fiber|\/three\/stage\/Stage\.tsx|\/Stage-[\w-]+\.js|drei/i;
  const hits = requested.phone.filter((u) => three.test(u));
  const desk = requested.desktop.filter((u) => three.test(u));
  assert(requested.phone.length > 50, `only ${requested.phone.length} phone requests recorded (run the phone checks first)`);
  assert(!hits.length, `phones requested: ${[...new Set(hits)].slice(0, 3).join(", ")}`);
  // round 4: the 3D Stage is off (src/App.tsx STAGE_ON), so laptops never load it either
  assert(!desk.length, `laptops requested: ${[...new Set(desk)].slice(0, 3).join(", ")}`);
  return `${requested.phone.length} phone and ${requested.desktop.length} laptop requests, none for three.js or .glb`;
}

function consoleClean(where) {
  const mine = problems.filter((p) => p.where === where);
  assert(!mine.length, `${mine.length} problem(s): ${mine.slice(0, 3).map((p) => `[${p.kind}] ${p.text.slice(0, 120)}`).join(" | ")}`);
  return "no console errors, page errors or failed requests";
}

// ─── run ────────────────────────────────────────────────────────────────────────────────────
console.log(`SmartCrew e2e against ${BASE}${ONLY ? ` (only "${ONLY}")` : ""}\n`);
const up = await fetch(BASE + "/").then((r) => r.ok).catch(() => false);
if (!up) {
  console.error(`Nothing answers at ${BASE}. Start the dev server (npm run dev) or a preview, or pass the URL.`);
  process.exit(1);
}

for (const device of [DESKTOP, PHONE]) {
  const D = device.name === "desktop" ? "desktop 1440×660" : "iPhone FB 390×664";
  await check(D, "hero: H1 + CTA in the first screen → popup", () => heroBasics(device));
  await check(D, "every CTA on the page opens the popup", () => everyCta(device), { timeout: 900000 });
  await check(D, "never two orange CTAs on screen at once", () => oneOrangeAtATime(device), { timeout: 300000 });
  await check(D, "popup 2 steps + errors → /book side by side, prefilled (no booking)", () => funnel(device), { timeout: 150000 });
  await check(D, "Replace 5 apps: 6 cards → CTA", () => replaceApps(device));
  await check(D, "features: all 38 tools → walkthrough", () => specSheet(device));
  await check(D, "features: biggest pain picker (cut in classic)", () => painPicker(device));
  await check(D, "Watch it work: 3 tabs → panels, items, CTAs, no hold", () => watchItWork(device));
  await check(D, "Try it: tap Clock In → CTA", () => tryIt(device));
  await check(D, "Your number: slider + picks → popup prefill", () => yourNumber(device));
  await check(D, "FAQ toggles", () => faq(device));
  await check(D, "header links + Log in href", () => headerLinks(device));
  await check(D, "?angle= headlines are off", () => anglesOff(device));
  await check(D, "no intro overlay; hero CTA clickable ≤ 2.5 s", () => noIntroCtaFast(device), { timeout: 150000 });
  if (device.name === "desktop") await check(D, "no WebGL: the page still converts", () => noWebgl(), { timeout: 150000 });
  await check(D, "prefers-reduced-motion", () => reducedMotion(device));
  await check(D, "zero console errors / failed requests", async () => consoleClean(device.name));
}
await check("both", "never requests three.js or .glb", () => phoneNoThree());

for (const b of Object.values(browsers)) await b.close();

// ─── report ─────────────────────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const w = { g: 18, n: 52, s: 4, t: 7 };
console.log(`\n${pad("Device", w.g)} | ${pad("Check", w.n)} | ${pad("", w.s)} | ${pad("Time", w.t)} | Detail`);
console.log(`${"-".repeat(w.g)}-+-${"-".repeat(w.n)}-+-${"-".repeat(w.s)}-+-${"-".repeat(w.t)}-+-${"-".repeat(40)}`);
for (const r of results) console.log(`${pad(r.group, w.g)} | ${pad(r.name, w.n)} | ${pad(r.status, w.s)} | ${pad(`${(r.ms / 1000).toFixed(1)}s`, w.t)} | ${r.detail}`);
const failed = results.filter((r) => r.status === "FAIL");
const passed = results.filter((r) => r.status === "PASS");
console.log(`\n${passed.length} passed, ${failed.length} failed, ${results.length - passed.length - failed.length} skipped`);
if (ignoredHits.size) {
  console.log("\nIgnored (not counted as errors):");
  for (const [why, n] of ignoredHits) console.log(`  ${String(n).padStart(4)} × ${why}`);
}
if (problems.length) {
  console.log("\nProblems seen:");
  for (const p of problems.slice(0, 25)) console.log(`  [${p.where}] ${p.kind}: ${p.text.slice(0, 200)}`);
}
process.exit(failed.length ? 1 : 0);
