// The opening holds on a fast scroll (Michael, 13 Nov), checked in a real browser on the built site:
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/check-hero-browser.mjs [http://localhost:4173/]
//
// Plays a trackpad-shaped fling (a few strong wheel events, then the glide decaying every frame, about 3,500 px
// in all) on the first screen at laptop and desktop sizes, and checks that the page stops with the whole
// opening on screen: the title, the book and the JOIN button. Then a second fling must carry on into the story.
// Also a Page Down, and a phone flick. Needs Playwright (preinstalled in the cloud sessions; else npm i -D playwright).
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const URL = process.argv[2] || "http://localhost:4173/";
let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failed++;
};

/** the opening's parts, as seen now: are they all on screen? */
const whole = (p) =>
  p.evaluate(() => {
    const vh = innerHeight;
    const r = (s) => document.querySelector(s)?.getBoundingClientRect();
    const parts = [".hero-title", ".hero-book img", ".hero-cta .btn"].map(r);
    return { y: Math.round(scrollY), ok: parts.every((b) => b && b.top >= -1 && b.bottom <= vh + 1) };
  });

/** a fling at a real trackpad's pace: one wheel event a frame, sent inside the page (Playwright's own wheel
 *  calls take ~80 ms each, which no trackpad does, and would trip the hold's "keeps scrolling" release) */
const fling = (p, peak = 160, frames = 110, decay = 0.955) =>
  p.evaluate(
    ([peak, frames, decay]) =>
      new Promise((done) => {
        const target = document.elementFromPoint(innerWidth / 2, innerHeight / 2) || document.body;
        let k = 0;
        const step = () => {
          if (k >= frames) return done();
          target.dispatchEvent(new WheelEvent("wheel", { deltaY: Math.max(1, peak * decay ** k), deltaMode: 0, bubbles: true, cancelable: true }));
          k++;
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    [peak, frames, decay],
  );

const b = await chromium.launch();
for (const [w, h] of [
  [1440, 900],
  [1280, 720],
  [1920, 1080],
]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.waitForTimeout(2600); // the opening's own entrance
  await p.mouse.move(w / 2, h / 2);
  await fling(p);
  await p.waitForTimeout(1200);
  const a = await whole(p);
  check(`${w}x${h}: one fast fling stops on the opening`, a.ok && a.y > 0, `scrollY ${a.y}`);
  await p.waitForTimeout(400);
  await fling(p);
  await p.waitForTimeout(1500);
  const c = await whole(p);
  check(`${w}x${h}: the next fling goes on into the story`, c.y > h, `scrollY ${c.y}`);
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(800);
  await p.keyboard.press("PageDown");
  await p.waitForTimeout(1200);
  const d = await whole(p);
  check(`${w}x${h}: Page Down stops on the opening`, d.ok, `scrollY ${d.y}`);
  await p.close();
}

// a phone: a quick flick up the screen. Headless Chromium will not scroll on a synthesized touch gesture, so the
// flick is played as the browser sees it: the finger's touch events, then the glide's jump far down the page.
{
  const ctx = await b.newContext({ ...devices["iPhone 13"] });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.waitForTimeout(2600);
  await p.evaluate(async () => {
    const t = (y) => new Touch({ identifier: 1, target: document.body, clientX: 190, clientY: y });
    const fire = (type, y) => window.dispatchEvent(new TouchEvent(type, { touches: type === "touchend" ? [] : [t(y)], changedTouches: [t(y)], bubbles: true }));
    fire("touchstart", 600);
    for (const y of [580, 540, 480, 400]) fire("touchmove", y);
    fire("touchend", 400);
    // the glide; a phone browser ends it when the page is made unscrollable for a moment (that is how the hold stops it)
    for (let k = 1; k <= 12; k++) {
      if (getComputedStyle(document.documentElement).overflow === "hidden") break;
      window.scrollTo(0, k * 250);
      await new Promise((r) => requestAnimationFrame(r));
    }
  });
  await p.waitForTimeout(800);
  const a = await whole(p);
  check("phone: one quick flick stops on the opening", a.ok && a.y > 0, `scrollY ${a.y}`);
  await ctx.close();
}
await b.close();
if (failed) {
  console.log(`${failed} failed`);
  process.exit(1);
}
console.log("all passed");
