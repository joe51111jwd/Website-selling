// Try it on desktop: "Pick up the phone" (scratchpad design/v2/scroll/SCROLL_SHOTS.md §1). The 3D
// iPhone comes up out of the bottom of the frame lying back and tilts upright (./poses.ts, on the
// scroll); these are its two small screen moments, drawn INSIDE the phone's screen by the Stage's
// overlays, so they sit under the glass and follow the tilt exactly:
//
// - the wake: while it is carried in, a black plate covers the screen (it is off); once it is about
//   85 % upright the plate fades out over 280 ms and "Ready to clock in?" is on. Once per page view:
//   scrolling back up never turns it off again.
// - the breathe: 1.2 s after the scene settles, the Clock In circle swells once, 1 → 1.04 → 1 over
//   700 ms. It is a crop of the screen's own circle laid exactly over it (the Stage maps an
//   overlay's rect onto the screen, so only its rect changes: no redraw, no re-upload).
//
// Overlay slots 0 and 1 of the iPhone are Try it's (store.ts); the running timer takes them once
// clocked in (on "phone-working"), so both moments only touch a slot while it still holds their
// own canvas, and both are tied to "phone-home" (they never draw over another screen).
// Desktop only: phones have no Stage (TryPhone has its own CSS wake and breathe).

import { useEffect, useState } from "react";
import { overlays, reducedMotion, setOverlay, updateOverlay } from "../../three/stage/store";
import { screenUrl } from "../../three/stage/urls";
import type { Box } from "../../three/stage/types";

const SCREEN = "phone-home";
const PLATE = 0;
const BREATHE = 1;
/** The whole phone screen, native px. */
const FULL: Box = [0, 0, 402, 874];
/** The Clock In circle on phone-home (TryDesk's CLOCK_IN), native px, and the crop round it. */
const CIRCLE = { cx: 201, cy: 465.8, r: 82.5 };
/** White margin round the circle in the crop: clear of "Ready to clock in?" and "Request day off". */
const MARGIN = 8;
/** phone-home.webp is shot at 3x (1206 px wide). */
const SHOT = 3;

/** The arrival ease (--ease-out) and the travel ease (--ease-calm), as functions of t. */
const easeOut = bezier(0.22, 1, 0.36, 1);
const easeCalm = bezier(0.45, 0, 0.25, 1);

/** A CSS cubic-bezier(x1, y1, x2, y2) as a function (Newton steps, then bisection). */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = X(t) - x;
      const d = dX(t);
      if (Math.abs(e) < 1e-5) return Y(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 20; i++) {
      const v = X(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return Y(t);
  };
}

const mine = (slot: number, canvas: HTMLCanvasElement | null) => !!canvas && overlays.get(`iphone:${slot}`)?.canvas === canvas;

/** Run `step(t)` (t 0..1) on animation frames for `ms`, then `done`. Returns a cancel. */
function tween(ms: number, step: (t: number) => boolean | void, done?: () => void) {
  const t0 = performance.now();
  let raf = 0;
  const tick = () => {
    const t = Math.min(1, (performance.now() - t0) / ms);
    if (step(t) === false) return;
    if (t < 1) raf = requestAnimationFrame(tick);
    else done?.();
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

// ─── the wake ────────────────────────────────────────────────────────────────

let plate: HTMLCanvasElement | null = null;
function plateCanvas() {
  if (!plate) {
    plate = document.createElement("canvas");
    plate.width = plate.height = 4;
    const g = plate.getContext("2d");
    if (g) {
      g.fillStyle = "#000";
      g.fillRect(0, 0, 4, 4);
    }
  }
  return plate;
}
const plateOn = () => {
  if (!overlays.has(`iphone:${PLATE}`) || mine(PLATE, plate)) setOverlay("iphone", PLATE, { canvas: plateCanvas(), rect: FULL, screen: SCREEN, alpha: 1 });
};
const plateOff = () => {
  if (mine(PLATE, plate)) setOverlay("iphone", PLATE, null);
};

/**
 * The screen's wake, keyed to the scene `id` coming up: the plate goes on while the scene is
 * within ~0.6 screen below the viewport (the phone is out of sight, being carried in), and fades
 * out once the scene's top passes 15 % of the viewport (the phone is ~85 % upright there: the
 * tilt's `inOut` leg over −0.38 → −0.02, ./poses.ts). Returns whether it has woken (the DOM phone without
 * WebGL uses it for its own plate). Two IntersectionObservers: nothing runs per scroll event.
 */
export function useWake(id: string) {
  const [awake, setAwake] = useState(reducedMotion);
  useEffect(() => {
    if (reducedMotion) return;
    const el = document.getElementById(id);
    if (!el || typeof IntersectionObserver === "undefined") {
      setAwake(true);
      return;
    }
    let done = false;
    let cancel: (() => void) | null = null;
    const near = new IntersectionObserver(
      ([e]) => {
        if (done) return;
        // only while it comes up from below (coming back down the page, it is already awake)
        if (e.isIntersecting && e.boundingClientRect.top > 0) plateOn();
        else plateOff();
      },
      { rootMargin: "0px 0px 60% 0px" },
    );
    const line = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || done) return;
        done = true;
        near.disconnect();
        line.disconnect();
        setAwake(true);
        if (!mine(PLATE, plate)) return;
        cancel = tween(
          280,
          (t) => {
            if (!mine(PLATE, plate)) return false;
            updateOverlay("iphone", PLATE, { alpha: 1 - easeOut(t) });
          },
          plateOff,
        );
      },
      { rootMargin: "0px 0px -85% 0px" },
    );
    near.observe(el);
    line.observe(el);
    return () => {
      near.disconnect();
      line.disconnect();
      cancel?.();
      plateOff();
    };
  }, [id]);
  return awake;
}

// ─── the breathe ─────────────────────────────────────────────────────────────

let crop: Promise<HTMLCanvasElement | null> | null = null;
/** The circle and its white margin, cut from the screen's own image (3x), once. */
function circleCrop() {
  if (!crop) {
    const half = CIRCLE.r + MARGIN;
    const sx = Math.round((CIRCLE.cx - half) * SHOT);
    const sy = Math.round((CIRCLE.cy - half) * SHOT);
    const sw = Math.round(half * 2 * SHOT);
    crop = fetch(screenUrl(SCREEN))
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => createImageBitmap(b, sx, sy, sw, sw))
      .then((bmp) => {
        const c = document.createElement("canvas");
        c.width = c.height = sw;
        c.getContext("2d")?.drawImage(bmp, 0, 0);
        bmp.close?.();
        c.dataset.x = String(sx / SHOT);
        c.dataset.y = String(sy / SHOT);
        c.dataset.s = String(sw / SHOT);
        return c;
      })
      .catch(() => null);
  }
  return crop;
}
/** Start fetching the crop ahead of the breathe. */
export const prepareBreathe = () => void (typeof createImageBitmap === "function" && circleCrop());

/** The Clock In circle swells once (1 → 1.04 → 1, 700 ms, --ease-calm each way). Returns a cancel. */
export function breathe(): () => void {
  if (reducedMotion || typeof createImageBitmap !== "function") return () => {};
  let dead = false;
  let stop: (() => void) | null = null;
  let c: HTMLCanvasElement | null = null;
  circleCrop().then((canvas) => {
    if (dead || !canvas || overlays.has(`iphone:${BREATHE}`)) return;
    c = canvas;
    const x = +canvas.dataset.x!;
    const y = +canvas.dataset.y!;
    const s = +canvas.dataset.s!;
    const rect = (k: number): Box => [x + (s * (1 - k)) / 2, y + (s * (1 - k)) / 2, s * k, s * k];
    setOverlay("iphone", BREATHE, { canvas, rect: rect(1), screen: SCREEN, alpha: 0 });
    stop = tween(
      700,
      (t) => {
        if (!mine(BREATHE, c)) return false;
        const k = 1 + 0.04 * (t < 0.5 ? easeCalm(t * 2) : easeCalm((1 - t) * 2));
        // in and out over the screen's own circle while it is (all but) at its own size
        const a = Math.min(1, t / 0.08, (1 - t) / 0.08);
        updateOverlay("iphone", BREATHE, { rect: rect(k), alpha: a });
      },
      () => mine(BREATHE, c) && setOverlay("iphone", BREATHE, null),
    );
  });
  return () => {
    dead = true;
    stop?.();
    if (mine(BREATHE, c)) setOverlay("iphone", BREATHE, null);
  };
}
