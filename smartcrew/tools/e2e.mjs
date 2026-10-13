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
// hand-off to /book (sessionStorage "sc_lead", src/lib/lead.ts).
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
const DESKTOP = { name: "desktop", ctx: { viewport: { width: 1440, height: 660 }, deviceScaleFactor: 2 }, settle: 900 };
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
  });
  if (init) await ctx.addInitScript(init.fn, init.arg);
  ctx.on("page", (p) => watch(p, device.name));
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

async function open(ctx, path = "/?intro=0") {
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  return page;
}

/** Phones mount the scenes after the hero one by one; laptops load them in parallel. */
async function waitScenes(page, ms = 30000) {
  await page.waitForSelector("#footer", { state: "attached", timeout: ms });
  await wait(600);
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
  const h = await locator.elementHandle({ timeout: 500 }).catch(() => null);
  if (!h) return false;
  return h.evaluate(new Function(`return (${VISIBLE_FN})`)()).catch(() => false);
}

const POPUP_NAME = /set up your smartcrew|book your demo with andrew|who.s setting|where can andrew/i;
const popup = (page) => page.getByRole("dialog", { name: POPUP_NAME });

async function expectPopup(page, ms = 6000) {
  await popup(page).waitFor({ state: "visible", timeout: ms });
}
async function closePopup(page) {
  const d = popup(page);
  await d.getByRole("button", { name: "Close", exact: true }).click({ timeout: 4000 });
  await d.waitFor({ state: "hidden", timeout: 6000 });
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

/** In-page: tag the visible CTAs not clicked yet; count the ones on screen still waiting for their beat. */
const SCAN_FN = `({ re, vis, done }) => {
  const isVis = new Function("return (" + vis + ")")();
  const rx = new RegExp(re, "i");
  const nameOf = (b) => (b.getAttribute("aria-label") || b.textContent || "").trim().replace(/\\s+/g, " ");
  const all = [...document.querySelectorAll("button")].filter((b) => rx.test(nameOf(b)));
  const found = [];
  let waiting = 0;
  for (const b of all) {
    const zone = b.closest("[data-testid]")?.getAttribute("data-testid") || b.closest("section[id]")?.id || (b.closest("header") ? "header" : "page");
    const name = nameOf(b);
    const sec = b.closest("section[id]")?.id ?? "";
    const twins = all.filter((x) => (x.closest("section[id]")?.id ?? "") === sec && nameOf(x) === name);
    const key = zone + "|" + name + "|" + twins.indexOf(b);
    if (done.includes(key)) continue;
    if (isVis(b)) {
      b.setAttribute("data-e2e-cta", key);
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

async function ctaWalk(page, device, stepVh) {
  const H = device.ctx.viewport.height;
  const seen = new Map(); // key → { source, intent }
  const scan = (a) => page.evaluate(([fn, arg]) => new Function(`return (${fn})`)()(arg), [SCAN_FN, a]);
  let y = 0;
  let total = await page.evaluate(() => document.documentElement.scrollHeight);
  while (y <= total) {
    await scrollTo(page, y, device.settle);
    let { found, waiting } = await scan({ re: CTA_TEXT.source, vis: VISIBLE_FN, done: [...seen.keys()] });
    // a CTA that comes in on its scene's beat (Five apps, the FAQ close after the offer's leaves)
    for (let t = 0; !found.length && waiting && t < 12; t++) {
      await wait(400);
      ({ found, waiting } = await scan({ re: CTA_TEXT.source, vis: VISIBLE_FN, done: [...seen.keys()] }));
    }
    if (DEBUG) console.log(`    walk y=${y} scrollY=${await page.evaluate(() => Math.round(scrollY))} new=${found.join(", ")}${waiting ? ` waiting=${waiting}` : ""}`);
    for (const key of found) {
      const before = (await signups(page)).length;
      const loc = page.locator(`[data-e2e-cta="${key.replace(/"/g, '\\"')}"]`);
      // still there and visible (a beat may have moved on)?
      if (!(await isVisible(loc))) continue;
      await loc.click({ timeout: 4000 });
      await expectPopup(page).catch(() => {
        throw new Error(`CTA "${key}" did not open the popup`);
      });
      const after = await signups(page);
      assert(after.length > before, `CTA "${key}" opened no smartcrew:signup event`);
      const s = after[after.length - 1];
      seen.set(key, { source: s.source, intent: s.intent });
      await closePopup(page);
      await page.evaluate((k) => document.querySelector(`[data-e2e-cta="${k}"]`)?.removeAttribute("data-e2e-cta"), key);
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
    await wait(800);
    const box = await cta.boundingBox();
    assert(box && box.y + box.height <= device.ctx.viewport.height, "hero CTA is below the first screen");
    assert(await isVisible(cta), "hero CTA is covered or transparent");
    await cta.click();
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
        : ["hero", "header", "specsheet", "apps", "offer", "offer(demo)", "faq", "faq(demo)"];
    const missing = need.filter((n) => !sources.includes(n));
    assert(!missing.length, `never met (or never opened the popup): ${missing.join(", ")}; met: ${sources.join(", ")}`);
    return `${seen.size} CTAs clicked: ${sources.join(", ")}`;
  } finally {
    await ctx.close();
  }
}

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
      const vis = await page.evaluate(
        ({ vis }) => {
          const isVis = new Function(`return (${vis})`)();
          // orange = a button whose own face is safety orange (the ink text links don't count)
          const orange = (b) => {
            const m = getComputedStyle(b).backgroundColor.match(/\d+(\.\d+)?/g);
            return !!m && +m[0] > 230 && +m[1] > 80 && +m[1] < 170 && +m[2] < 70 && (m[3] === undefined || +m[3] > 0.5);
          };
          return [...document.querySelectorAll("button")]
            .filter(orange)
            .filter(isVis)
            .map((b) => b.closest("[data-testid]")?.getAttribute("data-testid") || b.closest("section[id]")?.id || (b.closest("header") ? "header" : "?"));
        },
        { vis: VISIBLE_FN },
      );
      if (vis.length > 1) bad.push(`y=${y}: ${vis.join(" + ")}`);
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
        await banner.getByRole("link", { name, exact: true }).click();
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
    const sec = page.locator("section#specs");
    await scrollSection(page, "#specs", 0, device.settle);
    await wait(900);
    const row = sec.getByRole("button", { name: /^time & crew/i }).first();
    await row.waitFor({ state: "visible", timeout: 8000 });
    await row.click();
    const panel = device.name === "phone" ? page.getByRole("dialog", { name: /time & crew/i }) : page.getByRole("region", { name: /^time & crew$/i });
    await panel.waitFor({ state: "visible", timeout: 5000 });
    const tools = await panel.innerText();
    assert(/clock/i.test(tools), "the expanded section lists no tools");
    await page.getByRole("button", { name: /^close time & crew$/i }).first().click();
    await panel.waitFor({ state: "hidden", timeout: 5000 });
    await sec.getByRole("button", { name: /^time & crew/i }).first().waitFor({ state: "visible", timeout: 5000 });
    return "opens on a section and closes back to the sheet";
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
    // find the beat where the tap target is live
    let ready = false;
    for (const p of [0.35, 0.5, 0.2, 0.65, 0.05, 0.8]) {
      await scrollSection(page, "#try", p, device.settle + 500);
      if ((await isVisible(clockIn)) && (await clockIn.isEnabled())) {
        ready = true;
        break;
      }
      // it may have demoed itself already: clock out and try again
      const again = sec.getByRole("button", { name: /clock out|again/i }).first();
      if (await isVisible(again)) {
        await again.click().catch(() => {});
        await wait(700);
        if ((await isVisible(clockIn)) && (await clockIn.isEnabled())) {
          ready = true;
          break;
        }
      }
    }
    assert(ready, "never found a live Clock In button");
    await clockIn.click();
    await sec.getByText(/that.s the whole training/i).first().waitFor({ state: "attached", timeout: 5000 });
    const cta = sec.getByRole("button", { name: /get my free trial/i }).first();
    await cta.waitFor({ state: "visible", timeout: 5000 });
    await wait(700);
    await cta.click();
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
    await sec.getByRole("group", { name: /minutes lost/i }).getByRole("button", { name: "15", exact: true }).click();
    await sec.getByRole("group", { name: /hourly/i }).getByRole("button", { name: "$45", exact: true }).click();
    const expected = (18 * 15 * 250 * 45) / 60; // crew × minutes × 250 workdays × $/hr ÷ 60
    const cta = sec.getByRole("button", { name: /get my free trial/i }).first();
    await cta.scrollIntoViewIfNeeded();
    await wait(900);
    await cta.click();
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
    await qs.nth(1).click();
    await wait(400);
    assert((await qs.nth(1).getAttribute("aria-expanded")) === "true", "a question didn't open");
    assert((await qs.nth(0).getAttribute("aria-expanded")) === "false", "two answers open at once");
    const region = page.locator(`#${await qs.nth(1).getAttribute("aria-controls")}`);
    assert((await region.innerText()).trim().length > 20, "the opened answer is empty");
    await qs.nth(1).click();
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
      const page = await open(ctx, `/?intro=0&angle=${angle}`);
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

async function intro(device) {
  const out = [];
  // a first visit plays it; a key press (laptop) or a tap (phone) skips it
  for (const how of device.name === "phone" ? ["tap"] : ["key", "click"]) {
    const ctx = await newContext(device);
    try {
      const page = await open(ctx, "/");
      await page.waitForSelector("html.intro-on", { timeout: 3000 });
      assert(await page.locator("#intro").count(), "no #intro on a first visit");
      await wait(500);
      const t0 = Date.now();
      if (how === "key") await page.keyboard.press("Space");
      else if (how === "click") await page.mouse.click(700, 330);
      else await page.touchscreen.tap(195, 330);
      await page.waitForFunction(() => !document.getElementById("intro") || getComputedStyle(document.getElementById("intro")).display === "none" || +getComputedStyle(document.getElementById("intro")).opacity < 0.05, null, { timeout: 4000 });
      const cta = await heroCta(page);
      await cta.waitFor({ state: "visible", timeout: 4000 });
      out.push(`${how} skip ${Date.now() - t0} ms`);
      // the second page view in the session: no intro
      await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
      await wait(400);
      assert(await page.evaluate(() => document.documentElement.classList.contains("no-intro")), "the intro played twice in one session");
    } finally {
      await ctx.close();
    }
  }
  // ?intro=0 never shows it
  const ctx = await newContext(device);
  try {
    const page = await open(ctx, "/?intro=0");
    await wait(300);
    const on = await page.evaluate(() => document.documentElement.classList.contains("intro-on"));
    assert(!on, "?intro=0 still played the intro");
    out.push("?intro=0 off", "2nd visit off");
  } finally {
    await ctx.close();
  }
  return out.join("; ");
}

async function introPlaysThrough(device) {
  const ctx = await newContext(device);
  try {
    const page = await open(ctx, "/");
    await page.waitForSelector("html.intro-on", { timeout: 3000 });
    const t0 = Date.now();
    await page.waitForFunction(() => !document.getElementById("intro"), null, { timeout: 9000 });
    const cta = await heroCta(page);
    await cta.waitFor({ state: "visible", timeout: 5000 });
    return `hands over to the hero by itself after ${Date.now() - t0} ms`;
  } finally {
    await ctx.close();
  }
}

async function reducedMotion(device) {
  const ctx = await newContext(device, { reducedMotion: "reduce" });
  try {
    const page = await open(ctx, "/");
    await wait(300);
    assert(!(await page.evaluate(() => document.documentElement.classList.contains("intro-on"))), "the intro played with reduced motion");
    const h1 = page.getByRole("heading", { level: 1 }).first();
    await h1.waitFor({ state: "visible", timeout: 8000 });
    const cta = await heroCta(page);
    await cta.waitFor({ state: "visible", timeout: 5000 });
    await cta.click();
    await expectPopup(page);
    await closePopup(page);
    return "no intro, hero and popup work";
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
    await wait(4000);
    const state = await page.evaluate(() => ({
      fallback: document.documentElement.classList.contains("stage-fallback"),
      webgl: !!document.createElement("canvas").getContext("webgl2") || !!document.createElement("canvas").getContext("webgl"),
      posters: [...document.querySelectorAll("img")].filter((i) => /renders\//.test(i.currentSrc || i.src) && i.getBoundingClientRect().width > 50).length,
    }));
    assert(!state.webgl, "WebGL is still on (the flags didn't take)");
    assert(state.fallback, "html.stage-fallback was not set without WebGL");
    assert(state.posters > 0, "no poster still stands in for the 3D");
    const cta = await heroCta(page);
    await cta.click();
    await expectPopup(page);
    await closePopup(page);
    await waitScenes(page);
    await scrollSection(page, "#apps", 1, 800);
    return `stage-fallback, ${state.posters} poster(s) on screen, popup works`;
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
    await wait(600);
    await cta.click();
    const dlg = popup(page);
    await dlg.waitFor({ state: "visible", timeout: 6000 });
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
    await dlg.getByLabel("Your name").waitFor({ state: "visible", timeout: 4000 });
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
    await dlg.getByLabel("Mobile number").waitFor({ state: "visible", timeout: 4000 });
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
  await check(D, "every CTA on the page opens the popup", () => everyCta(device), { timeout: 420000 });
  await check(D, "never two orange CTAs on screen at once", () => oneOrangeAtATime(device), { timeout: 300000 });
  await check(D, "popup 3 steps + errors → /book prefilled (no booking)", () => funnel(device), { timeout: 150000 });
  await check(D, "spec sheet: expand + collapse", () => specSheet(device));
  await check(D, "Try it: tap Clock In → CTA", () => tryIt(device));
  await check(D, "Your number: slider + picks → popup prefill", () => yourNumber(device));
  await check(D, "FAQ toggles", () => faq(device));
  await check(D, "header links + Log in href", () => headerLinks(device));
  await check(D, "?angle= variants render their own H1", () => angles(device));
  await check(D, "intro: skip by input, ?intro=0, once per session", () => intro(device));
  if (device.name === "desktop") {
    await check(D, "intro plays through on its own", () => introPlaysThrough(device));
    await check(D, "no WebGL: posters stand in, page still converts", () => noWebgl(), { timeout: 150000 });
  }
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
