// Checks the hero hold's wheel rules (src/herohold.ts) against recorded-shape gestures:
// node --experimental-strip-types scripts/check-herohold.mjs
import { wheelStep, wheelState, GESTURE_GAP_MS, HOLD_MAX_MS } from "../src/herohold.ts";

const STOP = 140; // px: about where the hold ends on a laptop (0.015 of the story's scroll)
let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failed++;
};

/** play wheel events through the rules; the scroller moves to its target at once (worst case for the hold) */
function play(events, y0 = 0) {
  const s = wheelState();
  let y = y0;
  let held = 0;
  for (const [t, dy] of events) {
    const r = wheelStep(s, t, y, dy, STOP);
    if (r.act === "pass") y += dy;
    else {
      held++;
      if (r.toStop) y = STOP;
    }
  }
  return { y, held };
}
/** a two-finger flick on a Mac trackpad: a few strong events, then the glide decaying every frame */
const fling = (t0, peak = 160, frames = 110, decay = 0.955) => Array.from({ length: frames }, (_, k) => [t0 + k * 16, Math.max(1, peak * decay ** k)]);
const total = (ev) => ev.reduce((a, [, d]) => a + d, 0);

const f1 = fling(0);
check("an ordinary fling would travel far past the hero", total(f1) > 3000, `${Math.round(total(f1))} px`);
const r1 = play(f1);
check("one fling from the top stops at the hold", r1.y === STOP, `ends at ${r1.y}`);
const r2 = play([...f1, ...fling(110 * 16 + GESTURE_GAP_MS + 80)]);
check("the next fling goes on into the story", r2.y > 2000, `ends at ${Math.round(r2.y)}`);
const r3 = play([[0, 40], [16, 30], [32, 20]]);
check("a small nudge on the hero moves freely", r3.y === 90, `ends at ${r3.y}`);
const r4 = play(fling(0), 3000);
check("a fling further down the page is never held", r4.held === 0);
const up = fling(0).map(([t, d]) => [t, -d]);
const r5 = play(up, 3000);
check("scrolling up is never held", r5.held === 0);
// a visitor who keeps scrolling without a pause is let go after HOLD_MAX_MS
const long = Array.from({ length: Math.ceil((HOLD_MAX_MS + 1500) / 16) }, (_, k) => [k * 16, 60]);
const r6 = play(long);
check("an unbroken stream is let go after the hold's limit", r6.y > STOP + 500, `ends at ${Math.round(r6.y)}`);
// a mouse wheel turned notch by notch, slowly: each notch is its own gesture
const notches = Array.from({ length: 6 }, (_, k) => [k * 400, 100]);
const r7 = play(notches);
check("slow mouse-wheel notches stop once at the hold, then carry on", r7.y === STOP + 400, `ends at ${r7.y}`);
// a fast spin of a mouse wheel from the top
const spin = Array.from({ length: 12 }, (_, k) => [k * 40, 100]);
const r8 = play(spin);
check("a fast mouse-wheel spin from the top stops at the hold", r8.y === STOP, `ends at ${r8.y}`);

// a second swipe that lands while the first one's glide is still running (no pause between them)
const glide = fling(0, 160, 60);
const again = fling(60 * 16 + 16, 160, 60).map(([t, d], k) => [t, k < 3 ? [30, 90, 160][k] : d]);
const r9 = play([...glide, ...again]);
check("a second swipe during the first one's glide goes on", r9.y > 1500, `ends at ${Math.round(r9.y)}`);

if (failed) {
  console.log(`${failed} failed`);
  process.exit(1);
}
console.log("all passed");
