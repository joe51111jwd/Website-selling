#!/usr/bin/env node
// End-to-end test of the whole funnel: product page → popup → /book, on a laptop (1440×660, mouse)
// and on an iPhone in the Facebook in-app browser (390×664, touch, DPR 3, FBAN/FBIOS user agent).
//
//   node tools/e2e.mjs [baseUrl=http://127.0.0.1:5310] [--only=<text>] [--headed]
//   npm run e2e -- [baseUrl]
//
// Works against the dev server or a built preview (vite preview). It never books a time on
// Andrew's Cal.com: it stops once his calendar has mounted. Elements are found the way a visitor
// finds them, by role and name (buttons named "Get my free trial", headings, links), plus a few
// stable hooks: #hero-cta / [data-hero-cta], data-testid="sticky-bar|book-cal|book-video|book-setup",
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
const DEBUG = !!process.env.E2E_DEBUG;
const ROOT = fileURLToPath(new URL("../", import.meta.url));

// ─── what the page should say, read from the source (so copy changes don't break the test) ────
const copySrc = readFileSync(`${ROOT}src/content/copy.ts`, "utf8");
const configSrc = readFileSync(`${ROOT}src/config.ts`, "utf8");
const anglesBlock = copySrc.slice(copySrc.indexOf("export const ANGLES"));
const ANGLES = Object.fromEntries([...anglesBlock.matchAll(/^\s{2}(\w+): \{\s*\n\s*h1: "([^"]+)"/gm)].slice(0, 5).map((m) => [m[1], m[2]]));
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
  return page.locator("[data-hero-cta]").getByRole("button", { name: /get my free trial/i }).first();
}

// ─── the CTA walk: scroll the whole page like a visitor, click every CTA met, check the popup ──
const CTA_TEXT = /get my free trial|book a demo with andrew|set up smartcrew for your crew/i;

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
    assert(norm(text) === norm(ANGLES.profit), `H1 "${text}" is not ANGLES.profit`);
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
    // the CTAs a visitor must meet just by scrolling (Try it's and the calculator's need a tap
    // first: their own checks click them)
    const need =
      device.name === "phone"
        ? ["hero", "sticky", "specsheet", "apps", "offer", "faq", "faq(demo)"]
        : // One Day's own CTA ("day") only comes in at the end of its ride: the ride check clicks it
          ["hero", "header", "specsheet", "apps", "offer", "offer(demo)", "faq", "faq(demo)"];
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
      for (const [name, id] of [
        ["FAQ", "faq"],
        ["How it works", "day"],
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
    await scrollSection(page, "#specs", 0, device.settle);
    await wait(900);
    // "See all 38 tools": big, and it opens every tool
    const all = page.locator("section#specs").getByRole("button", { name: /^see all \d+ tools/i }).first();
    await all.waitFor({ state: "visible", timeout: 8000 });
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
    await sec.getByText(/that.s the whole training/i).first().waitFor({ state: "attached", timeout: 8000 });
    const cta = sec.getByRole("button", { name: /get my free trial/i }).first();
    await cta.waitFor({ state: "visible", timeout: 5000 });
    await press(page, cta, { what: "Try it's CTA" });
    await expectPopup(page);
    const s = (await signups(page)).pop();
    assert(s?.source === "try", `Try it CTA sent ${JSON.stringify(s)}`);
    await closePopup(page);
    return "tap → clocked in → \"That's the whole training.\" → CTA → popup";
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
    await page.keyboard.press("PageUp"); // 10
    for (let i = 0; i < 8; i++) await page.keyboard.press("ArrowRight"); // 18
    const now = await slider.getAttribute("aria-valuenow");
    assert(now === "18", `slider at ${now}, expected 18`);
    for (const [group, value] of [
      [/minutes lost/i, "15"],
      [/hourly/i, "$45"],
    ]) {
      const b = sec.getByRole("group", { name: group }).getByRole("button", { name: value, exact: true });
      await b.scrollIntoViewIfNeeded();
      await press(page, b, { what: `the ${value} pick` });
    }
    const expected = (18 * 15 * 250 * 45) / 60; // crew × minutes × 250 workdays × $/hr ÷ 60
    const cta = sec.getByRole("button", { name: /get my free trial/i }).first();
    await cta.scrollIntoViewIfNeeded();
    await press(page, cta, { what: "the calculator's CTA" });
    await expectPopup(page);
    const s = (await signups(page)).pop();
    assert(s?.source === "calculator", `calculator CTA sent source ${s?.source}`);
    assert(s?.size === "6–20", `crew size ${s?.size}, expected 6–20`);
    assert(s?.estimate?.crew === 18 && Math.round(s.estimate.annual) === expected, `estimate ${JSON.stringify(s?.estimate)}`);
    const dlg = await popup(page).innerText();
    const money = `$${expected.toLocaleString("en-US")}`;
    assert(dlg.includes("6–20"), "the popup doesn't show the crew size as saved");
    assert(dlg.includes(money), `the popup doesn't show the estimate ${money}`);
    await closePopup(page);
    return `18 people × 15 min × $45 → ${money} a year, carried into the popup (crew size 6–20 pre-filled)`;
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

async function angles(device) {
  const ctx = await newContext(device);
  const out = [];
  try {
    assert(Object.keys(ANGLES).length === 5, `read ${Object.keys(ANGLES).length} angles from copy.ts`);
    for (const [angle, h1Text] of Object.entries(ANGLES)) {
      const page = await open(ctx, `/?angle=${angle}`);
      const got = await h1Name(page);
      assert(norm(got) === norm(h1Text), `?angle=${angle}: H1 "${got}" ≠ "${h1Text}"`);
      out.push(angle);
      await page.close();
    }
    return out.join(", ");
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
    assert(norm(await h1Name(page)) === norm(ANGLES.profit), "the H1 isn't the profit angle's");
    await press(page, cta, { what: "the hero CTA" });
    await expectPopup(page);
    await closePopup(page);
    return "hero in its end state, no overlay, popup works";
  } finally {
    await ctx.close();
  }
}

async function noWebgl() {
  const ctx = await newContext(DESKTOP, { kind: "nogl" });
  try {
    const page = await open(ctx);
    const h1 = page.getByRole("heading", { level: 1 }).first();
    await h1.waitFor({ state: "visible", timeout: 15000 });
    // the Stage only starts once the hero's sand has settled (src/site/ready.ts: holds), so wait
    // for it to report rather than a fixed time
    await page.waitForFunction(() => document.documentElement.classList.contains("stage-fallback"), null, { timeout: 20000 }).catch(() => {});
    const state = await page.evaluate(() => ({
      fallback: document.documentElement.classList.contains("stage-fallback"),
      webgl: !!document.createElement("canvas").getContext("webgl2") || !!document.createElement("canvas").getContext("webgl"),
      posters: [...document.querySelectorAll("img")].filter((i) => /renders\//.test(i.currentSrc || i.src) && i.getBoundingClientRect().width > 50).length,
    }));
    assert(!state.webgl, "WebGL is still on (the flags didn't take)");
    assert(state.fallback, "html.stage-fallback was not set without WebGL");
    assert(state.posters > 0, "no poster still stands in for the 3D");
    const cta = await heroCta(page);
    await press(page, cta, { what: "the hero CTA" });
    await expectPopup(page);
    await closePopup(page);
    await waitScenes(page);
    await scrollSection(page, "#apps", 1, 800);
    return `stage-fallback, ${state.posters} poster(s) on screen, popup works`;
  } finally {
    await ctx.close();
  }
}

// ─── One Day: "Enjoy the ride" (desktop) ─────────────────────────────────────────────────────
//
// Scrolling past the hero starts the ride: the page glides One Day into place and holds it while
// the day plays on a clock. The visitor's own scrolling never fights it (downward input is
// absorbed), a clear scroll up hands the page back with "Resume the ride", the header slides away
// for the takeover and the control bar's own orange button stays clickable (it pauses the ride),
// the controls work (pause / play, the 7-tick rail,
// Space, →, Skip), the page scrolls normally afterwards, and the ride ends on its own orange
// button with Replay. ?rideDebug exposes the ride's state (and lets the test jump to its end).

const rideState = (page) =>
  page.evaluate(() => ({
    y: Math.round(scrollY),
    ...window.__ride.state(),
    t: Math.round(window.__ride.time()),
    bar: Math.round(document.querySelector("#day .day-controls")?.getBoundingClientRect().top ?? -1),
  }));
const dayTopOf = (page) => page.evaluate(() => Math.round(document.getElementById("day").getBoundingClientRect().top + scrollY));
async function rideDbg(page, label) {
  if (DEBUG) console.log(`    ride ${label.padEnd(26)} ${JSON.stringify(await rideState(page))}`);
}
async function until(page, fn, what, ms = 8000) {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < ms) {
    last = await rideState(page);
    if (fn(last)) return last;
    await wait(150);
  }
  throw new Error(`${what} (state ${JSON.stringify(last)})`);
}
/** Wait until the page has stopped scrolling (the smooth scroll's glide after a wheel). */
async function settleScroll(page, ms = 6000) {
  const t0 = Date.now();
  let y = -1;
  while (Date.now() - t0 < ms) {
    const now = await page.evaluate(() => scrollY);
    if (now === y) return;
    y = now;
    await wait(250);
  }
}
const wheel = async (page, dy, n = 1, gap = 40) => {
  for (let i = 0; i < n; i++) {
    await page.mouse.wheel(0, dy);
    await wait(gap);
  }
};

/**
 * The whole ride, functionally. `kind: "nogl"` (the stills stand in for the 3D): headless software
 * WebGL redraws a 1440×660 frame in ~0.3 s and uploads each screen texture in seconds, so while
 * the ride plays the page is stalled most of the time and taps land seconds late; the controls,
 * the hold and the CTA are DOM either way. `full: false` (with the 3D): it starts and holds, input
 * is absorbed, Skip hands the page back.
 */
async function ride(device, { kind = "nogl", full = true } = {}) {
  const ctx = await newContext(device, {
    kind,
    init: {
      fn: () => {
        window.__tracks = [];
        window.addEventListener("smartcrew:track", (e) => window.__tracks.push(e.detail.event));
      },
    },
  });
  // a quarter of the film's pace: headless software WebGL stalls for seconds at a time, and the
  // ride must not run out from under the test
  const page = await open(ctx, "/?rideDebug&rideRate=0.25");
  const out = [];
  try {
    await waitScenes(page);
    await scrollTo(page, 0, 400);
    await quiet(page);
    const top = await dayTopOf(page);
    const ctrl = page.locator("#day .day-controls");

    // starts on scroll: a few wheel notches down from the hero
    await page.mouse.move(720, 330);
    await wheel(page, 100, 3, 60);
    let s = await until(page, (x) => x.state === "playing" && Math.abs(x.y - top) <= 2, "the ride didn't start and hold One Day after a scroll down", 12000);
    out.push("starts on scroll, One Day held");

    // input during the ride: a trackpad-like burst down scrolls THROUGH the film (the page stays
    // put, the day moves on faster than real time), and it plays on once the scrolling stops
    const t1 = s.t;
    for (let i = 0; i < 30; i++) await page.mouse.wheel(0, 9);
    await wait(300);
    s = await rideState(page);
    assert(s.y === top && s.t - t1 > 2500, `scrolling down during the ride didn't move through the film (or moved the page): ${JSON.stringify(s)}`);
    s = await until(page, (x) => x.state === "playing" && x.y === top, "the ride didn't play on after the scrolling stopped", 4000);
    out.push("scrolling moves through the ride, then it plays on");
    // never a still frame: the map ground keeps walking while it plays (a track on the film's clock)
    const walk = () => page.evaluate(() => getComputedStyle(document.querySelector(".day-topo-sheet")).transform);
    // (polled: headless software WebGL can stall a frame for over a second, and the film's clock
    // only advances between frames)
    const w0 = await walk();
    let moved = false;
    for (let i = 0; i < 12 && !moved; i++) {
      await wait(400);
      moved = w0 !== (await walk());
    }
    assert(moved, "the ground stood still while the ride played");
    out.push("the ground walks");
    if (!full) {
      await press(page, ctrl.getByRole("button", { name: /^skip$/i }), { what: "Skip" });
      s = await until(page, (x) => x.state === "paused" && x.reason === "skip" && !x.held && x.y > top + 100, "Skip didn't hand the page back and move on", 20000);
      out.push("Skip moves on");
      return out.join("; ");
    }

    // the controls: pause, play, Space, → (next moment), a tick
    await press(page, ctrl.getByRole("button", { name: /^pause$/i }), { what: "Pause" });
    await until(page, (x) => x.state === "paused", "Pause didn't pause");
    await press(page, ctrl.getByRole("button", { name: /^play the day$/i }), { what: "Play" });
    await until(page, (x) => x.state === "playing" && x.held, "Play didn't play");
    await rideDbg(page, "after Play");
    await page.locator("body").focus().catch(() => {});
    await page.keyboard.press("Space");
    await rideDbg(page, "after Space 1");
    await until(page, (x) => x.state === "paused", "Space didn't pause");
    await rideDbg(page, "paused by Space");
    await page.keyboard.press("Space");
    await rideDbg(page, "after Space 2");
    await until(page, (x) => x.state === "playing", "Space didn't play");
    const c0 = (await rideState(page)).chapter;
    await page.keyboard.press("ArrowRight");
    await until(page, (x) => x.chapter === c0 + 1, "→ didn't go to the next moment");
    await press(page, ctrl.locator(".plc-rail button").nth(4), { what: "the 5:00 PM tick" });
    await until(page, (x) => x.chapter === 4 && x.state === "playing", "the 5:00 PM tick didn't jump there");
    out.push("pause / play / Space / → / tick");

    // the takeover: the header has slid away while the ride plays; the control bar carries the
    // orange button, which opens the popup and pauses the ride (and the header comes back)
    const headerShown = () => page.evaluate(() => getComputedStyle(document.querySelector(".site-header")).visibility !== "hidden");
    await wait(900);
    assert(!(await headerShown()), "the header is still there during the ride (the takeover)");
    // …and nothing of the page above or below peeks into the frame
    const peek = await page.evaluate(() =>
      [[720, 3], [8, 330], [innerWidth - 8, 330], [720, innerHeight - 3], [innerWidth - 8, 8]]
        .map(([x, y]) => {
          const e = document.elementFromPoint(x, y);
          return e && e !== document.body && e !== document.documentElement && !e.closest("#day") ? `${e.tagName}.${e.className}` : null;
        })
        .filter(Boolean),
    );
    assert(!peek.length, `the page peeks into the ride's frame: ${peek.join(", ")}`);
    await press(page, ctrl.getByRole("button", { name: /get my free trial/i }), { what: "the control bar's CTA during the ride" });
    await expectPopup(page);
    s = await rideState(page);
    assert(s.state === "paused" && s.reason === "cta", `the ride didn't pause for the popup: ${JSON.stringify(s)}`);
    const sigBar = (await signups(page)).pop();
    assert(sigBar?.source === "ride", `the control bar's CTA sent ${JSON.stringify(sigBar)}`);
    await rideDbg(page, "popup open");
    await closePopup(page);
    await rideDbg(page, "popup closed");
    await ctrl.getByRole("button", { name: /resume the ride/i }).waitFor({ state: "visible", timeout: 5000 });
    await wait(900);
    await rideDbg(page, "header back?");
    assert(await headerShown(), "the header didn't come back when the ride paused for the popup");
    out.push("header away during the ride; the bar's CTA works (pauses, popup, Resume, header back)");

    // scrolling up moves the day back; past its start it hands the page back, with "Resume the ride"
    await press(page, ctrl.getByRole("button", { name: /resume the ride/i }), { what: "Resume the ride" });
    s = await until(page, (x) => x.state === "playing" && x.held, "Resume didn't play");
    const t2 = s.t;
    await wheel(page, -60, 3, 30);
    await wait(300);
    s = await rideState(page);
    assert(s.y === top && s.t < t2, `scrolling up didn't move the day back: ${JSON.stringify(s)}`);
    await wheel(page, -120, 40, 25);
    s = await until(page, (x) => x.state === "paused" && x.reason === "exit" && x.y < top, "scrolling up past the start didn't hand the page back");
    out.push(`scroll up moves it back, past its start the page goes up (${s.y - top} px)`);

    // Skip: the page moves on past One Day, and scrolls normally after. (Back to One Day first,
    // once the smooth scroll of the exit has come to rest: a jump while it still glides is undone.)
    await settleScroll(page);
    await scrollTo(page, top, 500);
    await press(page, ctrl.getByRole("button", { name: /resume the ride/i }), { what: "Resume the ride" });
    await until(page, (x) => x.state === "playing" && x.held, "Resume didn't play");
    await press(page, ctrl.getByRole("button", { name: /^skip$/i }), { what: "Skip" });
    s = await until(page, (x) => x.state === "paused" && x.reason === "skip" && !x.held && x.y > top + 100, "Skip didn't hand the page back and move on", 10000);
    const y0 = s.y;
    await wheel(page, 120, 4, 80);
    await wait(1200);
    s = await rideState(page);
    assert(s.y > y0 + 100, `the page doesn't scroll after Skip (${y0} → ${s.y})`);
    out.push("Skip moves on, scroll works after");

    // the end: Friday, its orange button, the page handed back, Replay
    await scrollTo(page, top, 500);
    await press(page, ctrl.getByRole("button", { name: /resume the ride/i }), { what: "Resume the ride" });
    await until(page, (x) => x.state === "playing", "Resume didn't play");
    await page.evaluate(() => window.__ride.seek(window.__ride.ride.duration - 1200));
    await until(page, (x) => x.state === "ended" && !x.held, "the ride didn't end and hand the page back", 12000);
    const dayCta = page.locator("#day .day-end").getByRole("button", { name: /get my free trial/i });
    await press(page, dayCta, { what: "One Day's own CTA" });
    await expectPopup(page);
    const sig = (await signups(page)).pop();
    assert(sig?.source === "day", `One Day's CTA sent ${JSON.stringify(sig)}`);
    await closePopup(page);
    const ye = (await rideState(page)).y;
    await wheel(page, 120, 3, 80);
    await wait(1000);
    s = await rideState(page);
    assert(s.y > ye + 100 && s.state === "ended", `the page doesn't scroll on after the end (${ye} → ${s.y})`);
    await scrollTo(page, top, 600);
    s = await rideState(page);
    assert(s.state === "ended", `scrolling back up replayed it: ${JSON.stringify(s)}`);
    await press(page, ctrl.getByRole("button", { name: /replay/i }), { what: "Replay" });
    await until(page, (x) => x.state === "playing" && x.held, "Replay didn't play again");
    out.push("ends on its CTA, released, no auto-replay, Replay");

    const tracks = await page.evaluate(() => window.__tracks.filter((e) => e.startsWith("ride_")));
    for (const e of ["ride_start", "ride_exit_up", "ride_skip", "ride_complete"]) assert(tracks.includes(e), `no ${e} tracked (${tracks.join(", ")})`);
    out.push(`tracked ${[...new Set(tracks)].join(", ")}`);
    return out.join("; ");
  } finally {
    await ctx.close();
  }
}

/** Reduced motion: One Day never plays on its own or holds the page; Previous / Next step through it. */
async function rideReduced(device) {
  const ctx = await newContext(device, { reducedMotion: "reduce" });
  const page = await open(ctx, "/?rideDebug");
  try {
    await waitScenes(page);
    const top = await dayTopOf(page);
    await page.mouse.move(720, 330);
    await scrollTo(page, Math.round(top - 0.6 * device.ctx.viewport.height), 300);
    await wheel(page, 100, 3, 60);
    await wait(1500);
    let s = await rideState(page);
    assert(s.state !== "playing" && !s.held, `reduced motion: the ride played or held the page: ${JSON.stringify(s)}`);
    await scrollTo(page, top, 400);
    const ctrl = page.locator("#day .day-controls");
    const c0 = (await rideState(page)).chapter;
    await press(page, ctrl.getByRole("button", { name: /next moment/i }), { what: "Next" });
    s = await until(page, (x) => x.chapter === c0 + 1, "Next didn't step");
    await press(page, ctrl.getByRole("button", { name: /previous moment/i }), { what: "Previous" });
    await until(page, (x) => x.chapter === c0, "Previous didn't step back");
    return "no autoplay, no hold; Previous / Next step through the moments";
  } finally {
    await ctx.close();
  }
}

/** The popup's 3 steps with their errors, the hand-off to /book, and /book itself (no booking). */
async function funnel(device) {
  const ctx = await newContext(device);
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
    assert(/crew size/i.test(e) && /company/i.test(e), `step 1 errors: "${e}"`);
    await dlg.getByRole("radio", { name: "6–20" }).click();
    await dlg.getByLabel("Company name").fill("QA Test Earthworks");
    await cont();
    await dlg.getByLabel("Your name").waitFor({ state: "visible", timeout: 15000 });
    out.push("step 1 errors + size/company");

    // step 2: a bad email → error; then good
    await dlg.getByLabel("Your name").fill("Pat Tester");
    await dlg.getByLabel("Email").fill("pat@example");
    await cont();
    await wait(500);
    e = await errors();
    assert(/email/i.test(e), `step 2 error: "${e}"`);
    await dlg.getByLabel("Email").fill("pat.tester@example.com");
    await cont();
    await dlg.getByLabel("Mobile number").waitFor({ state: "visible", timeout: 15000 });
    out.push("step 2 email error");

    // step 3: a short number → error; then good → /book
    await dlg.getByLabel("Mobile number").fill("555");
    await dlg.getByRole("button", { name: /pick my (call|demo) time/i }).click();
    await wait(500);
    e = await errors();
    assert(/10-digit/i.test(e), `step 3 error: "${e}"`);
    await dlg.getByLabel("Mobile number").fill("5555550123");
    await Promise.all([page.waitForURL(/\/book\/?(\?|$)/, { timeout: 15000 }), dlg.getByRole("button", { name: /pick my (call|demo) time/i }).click()]);
    out.push("step 3 phone error → /book");

    // nothing personal in the URL; the lead rides in sessionStorage
    assert(!/example\.com|Pat|5555550123/i.test(page.url()), `personal data in the URL: ${page.url()}`);
    const lead = await page.evaluate(() => JSON.parse(sessionStorage.getItem("sc_lead") || "null"));
    assert(lead, "no sc_lead in sessionStorage");
    assert(lead.company === "QA Test Earthworks" && lead.name === "Pat Tester" && lead.email === "pat.tester@example.com", `lead ${JSON.stringify(lead).slice(0, 160)}`);
    assert(lead.size === "6–20" && lead.phone_e164 === "+15555550123" && lead.stage === "complete", `lead size/phone ${lead.size} ${lead.phone_e164}`);
    out.push("lead handed over (company, name, email, phone, size)");

    // /book: personal headline, Andrew's video, his calendar prefilled
    const h1 = page.getByRole("heading", { level: 1 }).first();
    await h1.waitFor({ state: "visible", timeout: 10000 });
    assert(/pat/i.test(await h1.innerText()), `/book H1 "${await h1.innerText()}" doesn't greet Pat`);
    assert(/QA Test Earthworks/.test(await page.locator("body").innerText()), "/book doesn't name the company");
    const video = page.getByTestId("book-video");
    assert(await video.isVisible(), "Andrew's video isn't on /book");
    assert(await page.locator(`#vidalytics_embed_${VIDEO_ID}`).count(), `no Vidalytics container #vidalytics_embed_${VIDEO_ID}`);
    const frame = page.getByTestId("book-cal").locator("iframe").first();
    await frame.waitFor({ state: "attached", timeout: 25000 });
    const src = (await frame.getAttribute("src")) ?? "";
    const q = new URL(src).searchParams;
    assert(/cal\.com/.test(src), `calendar iframe src ${src.slice(0, 80)}`);
    assert(q.get("name") === "Pat Tester" && q.get("email") === "pat.tester@example.com", `Cal prefill name=${q.get("name")} email=${q.get("email")}`);
    await page.waitForSelector('[data-testid="book-cal"].is-ready', { timeout: 25000 }).catch(() => note("Cal didn't report ready within 25 s"));
    const calTop = await page.getByTestId("book-cal").evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY));
    const vh = device.ctx.viewport.height;
    assert(calTop < vh * 0.7, `the calendar starts ${calTop} px down (more than 0.7 of the first screen)`);
    out.push(`/book: H1, video, Cal prefilled (name+email), calendar at ${calTop} px`);

    // the product details under the calendar
    const setup = page.getByTestId("book-setup");
    assert(await setup.count(), "no 'What you're setting up' block");
    const groups = await setup.getByRole("heading", { level: 3 }).count();
    assert(groups === 6, `${groups} spec groups under the calendar`);

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
  if (!desk.length && requested.desktop.length) note("the pattern matched nothing on desktop either: check it still finds the 3D chunks");
  return `${requested.phone.length} phone requests, none for three.js or .glb (desktop: ${new Set(desk).size} such URLs)`;
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
  await check(D, "popup 3 steps + errors → /book prefilled (no booking)", () => funnel(device), { timeout: 150000 });
  await check(D, "spec sheet: all 38 tools → walkthrough", () => specSheet(device));
  await check(D, "Try it: tap Clock In → CTA", () => tryIt(device));
  await check(D, "Your number: slider + picks → popup prefill", () => yourNumber(device));
  await check(D, "FAQ toggles", () => faq(device));
  await check(D, "header links + Log in href", () => headerLinks(device));
  if (device.name === "desktop") {
    await check(D, "One Day ride (3D): scroll starts it, holds, Skip", () => ride(device, { kind: "gl", full: false }), { timeout: 300000 });
    await check(D, "One Day ride (stills): controls, CTA, exit, Skip, end", () => ride(device), { timeout: 300000 });
    await check(D, "One Day ride: reduced motion steps, no autoplay", () => rideReduced(device), { timeout: 150000 });
  }
  await check(D, "?angle= variants render their own H1", () => angles(device));
  await check(D, "no intro overlay; hero CTA clickable ≤ 2.5 s", () => noIntroCtaFast(device), { timeout: 150000 });
  if (device.name === "desktop") await check(D, "no WebGL: posters stand in, page still converts", () => noWebgl(), { timeout: 150000 });
  await check(D, "prefers-reduced-motion", () => reducedMotion(device));
  await check(D, "zero console errors / failed requests", async () => consoleClean(device.name));
}
await check("iPhone FB 390×664", "never requests three.js or .glb", () => phoneNoThree());

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
