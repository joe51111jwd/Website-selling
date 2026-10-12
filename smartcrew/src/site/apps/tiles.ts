// The five app tiles' motion, outside React: each frame it writes one transform + opacity per tile.
//   · drift: a slow float, every tile on its own rhythm
//   · push (fine pointers only): the cursor shoves tiles away; a spring brings them home
//   · pull (scroll): magnet-like, slow then fast, along a slight arc, shrinking into the exact spot
//     on the device's screen that replaces it (projected with the Stage's own maths, ./project.ts)
// On phones the tiles sit in a stack over the dark phone and drain into it, the rest sliding up.
// Reduced motion: no drift, no push, no flight; tiles fade as their beat passes.

import type { MotionValue } from "motion/react";
import { coarse, phone, reducedMotion } from "../../three/stage";
import { writeLoupeQuad } from "../../cursor/loupe";
import { screenPointToViewport, screenQuad, boxCentre, type AnchorBox } from "./project";
import { BEATS, FLY_POSE, SCREEN_ON, SCREEN_SRC, TARGETS, shotAt } from "./poses";

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Desktop homes, in device units from the anchor's centre (+y up), so they hug the devices at any size. */
const HOMES_D: [number, number][] = [
  [3.05, 0.6], // Time tracking  → phone
  [-3.15, 0.15], // Fleet        → laptop
  [0.95, 1.55], // CRM            → laptop
  [2.9, -0.8], // Files           → phone
  [-2.5, -1.12], // Group chat    → laptop
];
/** Each tile's resting tilt, float rhythm and how hard its arc bends. */
// depth: a tile further back is a touch smaller and moves less under the cursor
const PERSONA = [
  { rot: 2.2, fx: 0.53, fy: 0.71, ph: 0.0, arc: -46, depth: 1.04 },
  { rot: -2.6, fx: 0.61, fy: 0.47, ph: 1.9, arc: 38, depth: 0.9 },
  { rot: -1.4, fx: 0.43, fy: 0.66, ph: 3.7, arc: -30, depth: 0.95 },
  { rot: 3.0, fx: 0.58, fy: 0.52, ph: 5.1, arc: 42, depth: 0.92 },
  { rot: -2.0, fx: 0.49, fy: 0.62, ph: 2.6, arc: -36, depth: 1.0 },
];

type Spring = { x: number; v: number };
function spring(s: Spring, to: number, dt: number, omega: number) {
  const x = s.x - to;
  const e = Math.exp(-omega * dt);
  const nx = (x + (s.v + omega * x) * dt) * e;
  s.v = (s.v - omega * (s.v + omega * x) * dt) * e;
  s.x = nx + to;
}

export type TilesOpts = {
  section: HTMLElement;
  stage: HTMLElement;
  anchor: HTMLElement;
  tiles: HTMLElement[];
  pings: HTMLElement[];
  progress: MotionValue<number>;
  /** the Stage's look-around amount in this scene (pose `look`) */
  look: number;
  /** fine pointers: the cursor's loupe over the lit screens (children of the anchor) */
  loupe?: { macbook: HTMLElement; iphone: HTMLElement };
};

export function runTiles(o: TilesOpts) {
  const n = o.tiles.length;
  const st = o.tiles.map(() => ({
    dx: 0,
    dy: 0,
    vx: 0,
    vy: 0,
    w: 0,
    h: 0,
    landed: false,
  }));
  const lookX: Spring = { x: 0, v: 0 };
  const lookY: Spring = { x: 0, v: 0 };
  const pointer = { x: -1e4, y: -1e4, nx: 0, ny: 0, on: false };
  const fine = !coarse && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const measure = () => {
    o.tiles.forEach((el, i) => {
      st[i].w = el.offsetWidth;
      st[i].h = el.offsetHeight;
    });
  };
  measure();
  const ro = new ResizeObserver(measure);
  o.tiles.forEach((el) => ro.observe(el));

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.on = true;
  };
  const onLeave = () => (pointer.on = false);
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);

  let raf = 0;
  let last = performance.now();
  let visible = false;

  // dev: where every tile is headed right now (viewport px), for checking the projection
  const debug: [number, number][] = [];
  if (import.meta.env.DEV) (window as unknown as { __appsTargets: () => [number, number][] }).__appsTargets = () => debug;

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const tSec = now / 1000;
    const p = o.progress.get();
    const vp = { W: window.innerWidth, H: window.innerHeight };
    const sr = o.stage.getBoundingClientRect();
    const ar = o.anchor.getBoundingClientRect();
    const anchor: AnchorBox = {
      x: ar.left,
      y: ar.top,
      w: ar.width,
      h: ar.height,
    };
    const shot = FLY_POSE;
    const K = Math.min(anchor.w / shot.frame[0], anchor.h / shot.frame[1]);
    const acx = ar.left + ar.width / 2 - sr.left;
    const acy = ar.top + ar.height / 2 - sr.top;

    // the Stage's look-around, mirrored (same springs) so landings stay on their spot
    const px = coarse ? Math.sin(tSec * 0.45) * 0.55 : pointer.nx;
    const py = coarse ? Math.sin(tSec * 0.31 + 1) * 0.3 : pointer.ny;
    const lk = reducedMotion ? 0 : o.look;
    spring(lookX, px * lk, dt, 4.5);
    spring(lookY, py * lk, dt, 4.5);

    // phones: the stack's slots; tiles that have left free theirs and the rest slide up
    const pitch = phone ? (st[0].h || 46) + 7 : 0;
    const stackTop = phone ? Math.max(sr.height * 0.06, acy - anchor.h * 0.5 + 6) : 0;
    let gone = 0;

    for (let i = 0; i < n; i++) {
      const el = o.tiles[i];
      const s = st[i];
      const b = BEATS[i];
      const per = PERSONA[i];
      const u = clamp((p - b.start) / (b.land - b.start));

      // home
      let hx: number, hy: number;
      if (phone) {
        hx = sr.width / 2;
        hy = stackTop + s.h / 2 + (i - gone) * pitch;
        gone += smooth(0, 0.5, u);
      } else {
        const [ux, uy] = HOMES_D[i];
        hx = clamp(acx + ux * K, s.w / 2 + 16, sr.width - s.w / 2 - 16);
        hy = clamp(acy - uy * K, s.h / 2 + 8, sr.height - s.h / 2 - 8);
      }

      if (reducedMotion) {
        const a = 1 - smooth(0.2, 1, u);
        el.style.transform = `translate3d(${hx - s.w / 2}px, ${hy - s.h / 2}px, 0) rotate(${phone ? 0 : per.rot}deg)`;
        el.style.opacity = String(a);
        el.style.visibility = a < 0.01 ? "hidden" : "visible";
        continue;
      }

      // drift
      const amp = phone ? 2.5 : 7;
      const fx = Math.sin(tSec * per.fx + per.ph) * amp;
      const fy = Math.cos(tSec * per.fy + per.ph * 1.3) * amp * 1.25;
      const fr = Math.sin(tSec * per.fy * 0.8 + per.ph) * (phone ? 0.4 : 1.1);

      // push: the pointer shoves, a spring brings it home
      let ax = -70 * s.dx - 13 * s.vx;
      let ay = -70 * s.dy - 13 * s.vy;
      if (fine && pointer.on && u < 0.4) {
        const cx = hx + fx + s.dx + sr.left;
        const cy = hy + fy + s.dy + sr.top;
        const ddx = cx - pointer.x;
        const ddy = (cy - pointer.y) * 1.35; // tiles are wide: reach further up and down
        const d = Math.hypot(ddx, ddy);
        const R = Math.max(s.w * 0.62, 150);
        if (d < R) {
          const f = Math.pow(1 - d / R, 2) * 11000 * (1 - u * 2.5) * (phone ? 1 : per.depth * per.depth);
          ax += (ddx / (d || 1)) * f;
          ay += (ddy / (d || 1)) * f;
        }
      }
      s.vx += ax * dt;
      s.vy += ay * dt;
      s.dx += s.vx * dt;
      s.dy += s.vy * dt;

      // pull: slow, then a snap into the screen (ease-in), along a slight arc
      const e = u <= 0 ? 0 : Math.pow(u, 2.35);
      const t = TARGETS[i];
      const [tx0, ty0] = boxCentre(t.at);
      const pose = shot[t.device];
      const [vx, vy] = screenPointToViewport(t.device, tx0, ty0, pose, shot.frame, anchor, vp, { x: lookX.x, y: lookY.x });
      if (import.meta.env.DEV) debug[i] = [vx, vy];
      const tx = vx - sr.left;
      const ty = vy - sr.top;
      const sx = hx + (fx + s.dx) * (1 - e);
      const sy = hy + (fy + s.dy) * (1 - e);
      const lx = tx - sx;
      const ly = ty - sy;
      const len = Math.hypot(lx, ly) || 1;
      const bend = Math.sin(Math.PI * e) * per.arc * (phone ? 0.4 : 1);
      // a small wind-up as the magnet takes hold (it resists, then gives)
      const wind = Math.sin(Math.PI * clamp(u / 0.32)) * (1 - u) * (phone ? 6 : 12);
      const x = sx + lx * e + (-ly / len) * bend - (lx / len) * wind;
      const y = sy + ly * e + (lx / len) * bend - (ly / len) * wind;
      const sc = (phone ? 1 : per.depth) * (1 - 0.93 * Math.pow(e, 0.85));
      // a shove tips the card the way it's going
      const tip = clamp(s.vx * 0.012 + s.vy * 0.004, -7, 7);
      const rot = ((phone ? (i % 2 ? -0.8 : 0.8) : per.rot) + fr + tip) * (1 - e);
      const a = 1 - smooth(0.72, 0.98, e);
      el.style.transform = `translate3d(${(x - s.w / 2).toFixed(2)}px, ${(y - s.h / 2).toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      el.style.opacity = a.toFixed(3);
      el.style.visibility = a < 0.01 ? "hidden" : "visible";

      // a ping where it lands (going forward only)
      const landed = u >= 1;
      if (landed && !s.landed) {
        const pg = o.pings[i];
        if (pg) {
          pg.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          pg.classList.remove("is-on");
          void pg.offsetWidth;
          pg.classList.add("is-on");
        }
      }
      s.landed = landed;
    }

    // the cursor's loupe: each lit screen's corners, as the Stage poses it right now
    if (o.loupe && fine) {
      const now3 = shotAt(p);
      for (const dev of ["macbook", "iphone"] as const) {
        const el = o.loupe[dev];
        const lit = p >= SCREEN_ON[dev];
        const src = lit ? `${import.meta.env.BASE_URL}screens/${SCREEN_SRC[dev]}.webp` : null;
        if (src === null) el.removeAttribute("data-loupe-src");
        else if (el.getAttribute("data-loupe-src") !== src) el.setAttribute("data-loupe-src", src);
        if (lit) writeLoupeQuad(el, screenQuad(dev, now3[dev], now3.frame, anchor, vp, { x: lookX.x, y: lookY.x }));
      }
    }
    if (visible) raf = requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    },
    { rootMargin: "20% 0px" },
  );
  io.observe(o.section);
  // first paint in place even before the observer reports
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
  };
}
