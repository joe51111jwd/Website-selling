// Timing and layout of the closed loop, the scene after the story (render/closed.py).
// p is the scroll progress through its pinned stage (0-1).
//
// 0-.10   the opening shot again, but buried: what AI keeps adding is piled on Up / Side / Down
// .10-.45 the pile is swept off and eleven of the twelve systems are set down in a ring
// .45-.48 Quality is lowered over the last gap; .47-.73 the copy pose (copying drops it in)
// .74-.92 the camera slides along the table to the book; then the book
import geo from "./closed.json";
import cb from "./copyblock.json";

export { cb, geo };
export const CL_VH = 480;
export const BOOTLOADER_P = 0.53;
export const BOOK_P = 0.955;

const KEYS: [p: number, frame: number][] = [
  [0, 0],
  [0.1, 12],
  [0.45, 49],
];
export function frameAt(p: number): number {
  if (p <= 0) return 0;
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [p0, f0] = KEYS[i];
    const [p1, f1] = KEYS[i + 1];
    if (p <= p1) return f0 + ((p - p0) / (p1 - p0)) * (f1 - f0);
  }
  return KEYS[KEYS.length - 1][1];
}

// text windows [in, out]
export const BEATS = {
  open: [0.02, 0.19],
  closing: [0.25, 0.44],
  copy: [0.47, 0.73],
  pair: [0.795, 0.865],
  mini: [0.86, 0.915],
  book: [0.915, 1], // stays up as the stage scrolls away
} as const;

// the copy ritual, in ms: the COPY block and Quality fall together and land on one frame (fall),
// the line closes round the ring while the count runs (hairMs), the block turns green (seal)
export const T = { fall: 240, hairStart: 260, hairMs: 1000, swapAfterSeal: 40, flash: 3400, againMs: 600, againLift: 360, wave: 420, shakeDelay: 300, shake: 320, errorMs: 4000 };
/** the COPY block is laid out at its lifted size; every state is a scale at or below 1 of that, so it stays sharp */
export const LIFT = 1.08;
export const fmtWords = (n: number) => n.toLocaleString("en-US");

export const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (6 * c - 15) + 10);
};
/** the hairline's ease: slow start, steady sweep, soft landing */
export function hairEase(t: number) {
  // cubic-bezier(.65, 0, .25, 1), solved for x
  const x = Math.max(0, Math.min(1, t));
  let u = x;
  for (let i = 0; i < 6; i++) {
    const bx = 3 * (1 - u) * (1 - u) * u * 0.65 + 3 * (1 - u) * u * u * 0.25 + u * u * u - x;
    const dx = 3 * (1 - u) * (1 - u) * 0.65 + 6 * (1 - u) * u * (0.25 - 0.65) + 3 * u * u * (1 - 0.25);
    if (Math.abs(dx) < 1e-6) break;
    u = Math.max(0, Math.min(1, u - bx / dx));
  }
  return 3 * (1 - u) * u * u + u * u * u;
}

/**
 * Android: a thud as the blocks land (with `thud`), then one 3ms tick as the line passes each system.
 * A vibration pattern alternates buzz and pause, starting with a buzz.
 */
export function hapticPattern(thud: boolean): number[] {
  const lead = thud ? T.hairStart - T.fall : 0; // the line starts this long after the thud
  const out = [thud ? 10 : 0];
  let t = out[0];
  for (let k = 0; k < 12; k++) {
    // when the eased sweep reaches the middle of system k
    const target = (k + 0.5) / 12;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (hairEase(mid) < target) lo = mid;
      else hi = mid;
    }
    const pause = Math.max(0, Math.round(lead + lo * T.hairMs) - t);
    out.push(pause, 3);
    t += pause + 3;
  }
  return out;
}

export type Rect = { ox: number; oy: number; dw: number; dh: number };
/** desk: words left, ring right; phone: ring above the words; land: a phone on its side */
export type Mode = "desk" | "phone" | "land";
const RATIO = 1.6;
const RING_H = 0.75; // the ring's outer diameter, as a share of the frame's height
const COL = 320; // the words' column (280) and its gutters, left of the ring's line on a desk

/** the layout for this window, decided the way the stylesheet's media queries decide it */
export function modeNow(): Mode {
  if (window.innerWidth > 900) return "desk";
  return window.matchMedia("(orientation: landscape)").matches ? "land" : "phone";
}

/** where frame 50 sits on screen at the copy pose */
export function poseRect(cw: number, ch: number, mode: Mode): Rect {
  const [rx, ry] = geo.ringC;
  if (mode === "land") {
    // a phone on its side: the ring right of the words, as large as the height allows, clear of the menu
    const dh = Math.min(0.86 * ch, 0.6 * cw);
    const dw = dh * RATIO;
    return { ox: 0.72 * cw - rx * dw, oy: 0.5 * ch + 22 - ry * dh, dw, dh };
  }
  if (mode === "phone") {
    // the ring's centre sits half a frame below the menu
    const d = Math.min(0.88 * cw, (ch <= 600 ? 0.3 : ch <= 760 ? 0.33 : 0.37) * ch); // leaves room below for the address and the block
    const dh = d / RING_H;
    const dw = dh * RATIO;
    return { ox: 0.5 * cw - rx * dw, oy: 56 + 0.5 * dh - ry * dh, dw, dh };
  }
  // the table fills the height; a squarer window shrinks it, so the ring's line stays clear of the words
  const fit = (rx * cw - COL) / (geo.hair.rx * RATIO);
  const dh = Math.min(ch, Math.max(0.4 * ch, fit));
  const dw = dh * RATIO;
  return { ox: rx * cw - rx * dw, oy: (ch - dh) / 2, dw, dh };
}

/** the opening of the sequence on a phone: the buried row, larger, at the top */
function openRect(cw: number, ch: number): Rect {
  const dh = 0.62 * ch;
  const dw = dh * RATIO;
  return { ox: 0.5 * cw - geo.ringC[0] * dw, oy: 0, dw, dh };
}

const mix = (a: Rect, b: Rect, t: number): Rect => {
  const dw = Math.exp(Math.log(a.dw) + (Math.log(b.dw) - Math.log(a.dw)) * t);
  return { ox: a.ox + (b.ox - a.ox) * t, oy: a.oy + (b.oy - a.oy) * t, dw, dh: dw / RATIO };
};

/** the sequence frames' rect (upright phones ease from the open fit to the pose as the ring is set) */
export function seqRect(frame: number, cw: number, ch: number, mode: Mode): Rect {
  const pose = poseRect(cw, ch, mode);
  if (mode !== "phone") return pose;
  return mix(openRect(cw, ch), pose, smooth((frame - 12) / 36));
}

/** the slide along the table: the pose, then the pair (desktop), then the book */
export function truckRect(p: number, cw: number, ch: number, mode: Mode): Rect {
  const r0 = poseRect(cw, ch, mode);
  const rx = geo.ringC[0];
  const bx = geo.book.c[0];
  const by = geo.book.c[1];
  // the book ends where the ring was, at the same size
  const r2 = { ox: r0.ox + (rx - bx) * r0.dw, oy: r0.oy, dw: r0.dw, dh: r0.dh };
  if (mode === "land") return mix(r0, r2, smooth((p - 0.76) / 0.11));
  if (mode === "phone") {
    const dw = 1.21 * r0.dw;
    const dh = dw / RATIO;
    // upright: the book centred above the words, a little closer
    const near = { ox: 0.5 * cw - bx * dw, oy: 0.36 * ch - by * dh, dw, dh };
    return mix(r0, near, smooth((p - 0.76) / 0.11));
  }
  const dw1 = (0.61 * cw) / (rx - bx);
  const r1 = { ox: 0.16 * cw - bx * dw1, oy: 0.5 * ch - 0.5 * (dw1 / RATIO), dw: dw1, dh: dw1 / RATIO };
  if (p < 0.8) return mix(r0, r1, smooth((p - 0.74) / 0.06));
  if (p < 0.86) return r1;
  return mix(r1, r2, smooth((p - 0.86) / 0.06));
}

/** the stamp's two sizes for a block W wide */
export function stampFor(W: number) {
  const faceH = W * cb.faceAR;
  const big = Math.round(0.5 * faceH);
  return { faceH, big, small: Math.max(19, Math.round(0.25 * big)) };
}

export type BlockFit = { W: number; big: number; small: number; gapb: number; short: boolean };
/**
 * The COPY block's size. `rest` is the height of everything else in the column (kicker, headline,
 * the rows below), measured from the page; `room` is the height the whole column may take.
 */
export function blockFit(mode: Mode, colW: number, room: number, rest: number, ch: number, ringRoom = Infinity): BlockFit {
  let W: number;
  let short = false;
  let gapb: number;
  if (mode === "desk") {
    W = Math.min(colW / LIFT, Math.max(260, Math.min(ringRoom, 0.6 * ch, 460))); // never into the ring
    gapb = Math.max(40, Math.round(0.25 * stampFor(W).faceH + 6));
  } else {
    gapb = mode === "land" || ch <= 620 ? 12 : ch <= 760 ? 16 : 22;
    const max = Math.min(460, colW / LIFT);
    W = Math.min(max, (room - rest - gapb) / cb.bodyAR);
    if (W < 0.7 * max) {
      W = 0.7 * max;
      short = true; // a very short screen: the block keeps its size, the headline steps aside
    }
  }
  const { big, small } = stampFor(W);
  return { W, big, small, gapb, short };
}
