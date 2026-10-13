// One Day's ground: the contour map the ride walks across (RIDE_SHOTS §1, "the ground is the map
// you walk across"). Pure numbers here (./RideGround.tsx draws it):
//
//  · THE WALK: where the contour sheet is at each ms of the film, as an offset in % of the viewport
//    (x, y) and a scale. It always moves, opposite the camera: a few % during each camera move,
//    a slow drift during the holds, so the ground never stands still.
//  · THE HAUL (9:20 AM, variant B of RIDE_SHOTS §4.3): the road from the pit to the job, drawn on
//    the map itself, in the sheet's own coordinates (it walks with the ground).

import { RIDE, type Ride } from "./ride";

type Seg = { a: number; b: number; d: number; ease?: "inOut" | "linear" | "out" };
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out = (t: number) => 1 - Math.pow(1 - t, 3);
const ez = (e: Seg["ease"], t: number) => (e === "inOut" ? inOut(t) : e === "out" ? out(t) : t);

/** Each axis as a list of moves (start ms, end ms, change), summed. */
function axes(R: Ride) {
  const m = R.moments;
  const at = (i: number, k: string) => m[i].at[k];
  const x: Seg[] = [];
  const y: Seg[] = [];
  const s: Seg[] = [];
  const hold = (arr: Seg[], a: number, b: number, perSec: number) => arr.push({ a, b, d: (perSec * (b - a)) / 1000 });
  // the opening: the page's own scroll carries straight on, up
  y.push({ a: 0, b: R.moments[0].start, d: -2, ease: "out" });
  hold(x, 0, at(0, "pull")[0], -0.2);
  hold(y, R.moments[0].start, at(0, "pull")[0], -0.15);
  // 6:42 the pull back and pan: left
  x.push({ a: at(0, "pull")[0], b: at(0, "pull")[1], d: -8, ease: "inOut" });
  hold(x, at(0, "pull")[1], m[0].end, -0.5);
  // 6:55 the orbit: right
  x.push({ a: m[1].start, b: m[1].settle, d: 4, ease: "inOut" });
  hold(x, m[1].settle, m[1].end, 0.45);
  // 9:20 the crane up: down; the track with the truck: left
  y.push({ a: m[2].start, b: m[2].settle, d: 6, ease: "inOut" });
  x.push({ a: at(2, "drive")[0], b: at(2, "drive")[1], d: -10, ease: "inOut" });
  hold(x, at(2, "drive")[1], m[2].end, -0.45);
  // 4:12 the crane down: up; then up after the card: down
  y.push({ a: m[3].start, b: m[3].settle, d: -6, ease: "inOut" });
  hold(y, m[3].settle, at(3, "fly")[0], -0.15);
  y.push({ a: at(3, "fly")[0], b: at(3, "fly")[1], d: 3, ease: "inOut" });
  hold(y, at(3, "fly")[1], m[3].end, 0.3);
  // 5:00 drift, then the push: the ground grows with it
  hold(x, m[4].start, at(4, "push")[0], -0.3);
  s.push({ a: at(4, "push")[0], b: at(4, "macro")[1], d: 0.06, ease: "inOut" });
  s.push({ a: at(4, "macro")[1], b: m[4].end, d: 0.02 });
  // 5:30 left, and back to scale 1
  x.push({ a: m[5].start, b: m[5].settle, d: -4, ease: "inOut" });
  s.push({ a: m[5].start, b: m[5].settle, d: -0.08, ease: "inOut" });
  hold(x, m[5].settle, m[5].end, -0.4);
  // Friday: down
  y.push({ a: m[6].start, b: m[6].settle, d: 4, ease: "inOut" });
  hold(y, m[6].settle, m[6].end, 0.3);
  // the finale: it pulls back
  s.push({ a: R.finale.start, b: R.finale.settle, d: -0.06, ease: "inOut" });
  s.push({ a: R.finale.settle, b: R.finale.end, d: -0.012 });
  hold(x, R.finale.settle, R.finale.end, 0.18);
  return { x, y, s };
}

const sum = (segs: Seg[], t: number) => segs.reduce((v, g) => v + g.d * ez(g.ease, Math.max(0, Math.min(1, (t - g.a) / Math.max(1, g.b - g.a)))), 0);

/** The sheet's offset (% of the viewport) and scale at ms `t`. */
export function walkAt(t: number, R: Ride = RIDE) {
  const a = axes(R);
  return { x: sum(a.x, t), y: sum(a.y, t), s: 1 + sum(a.s, t) };
}

/** The walk as keyframes every `step` ms (for one Web Animation on the film's clock). */
export function walkFrames(R: Ride = RIDE, step = 100) {
  const a = axes(R);
  const fr: { t: number; x: number; y: number; s: number }[] = [];
  for (let t = 0; t <= R.duration; t += step) fr.push({ t, x: sum(a.x, t), y: sum(a.y, t), s: 1 + sum(a.s, t) });
  return fr;
}

/** How far the walk goes (for sizing the sheet): min/max offset in % and the smallest scale. */
export function walkRange(R: Ride = RIDE) {
  const f = walkFrames(R, 250);
  return {
    x: [Math.min(...f.map((p) => p.x)), Math.max(...f.map((p) => p.x))] as [number, number],
    y: [Math.min(...f.map((p) => p.y)), Math.max(...f.map((p) => p.y))] as [number, number],
    s: Math.min(...f.map((p) => p.s)),
  };
}

/**
 * The haul road (9:20 AM), in the sheet's own frame: % of the viewport where it is when the walk's
 * offset is 0. It is placed so that, with the walk, the truck crosses the free band right of the
 * copy and above the devices: from about (40 %, 33 %) to (86 %, 27 %) of the screen.
 */
export function haulRoute(R: Ride = RIDE) {
  const [d0, d1] = R.moments[2].at.drive;
  const w0 = walkAt(d0, R);
  const w1 = walkAt(d1, R);
  // the ends, on screen at the drive's start and end, back into the sheet's frame
  const A = { x: 40 - w0.x, y: 34 - w0.y };
  const Z = { x: 86 - w1.x, y: 27 - w1.y };
  // County Rd 6 east out of the pit, through Cedar Ridge, then Hwy 30 to Riverside
  const lerp = (k: number, dx = 0, dy = 0) => ({ x: A.x + (Z.x - A.x) * k + dx, y: A.y + (Z.y - A.y) * k + dy });
  const pts = [A, lerp(0.12, 0, -2.6), lerp(0.27, 0, -3.2), lerp(0.4, 0, 0.6), lerp(0.55, 0, 1.6), lerp(0.7, 0, -1.6), lerp(0.84, 0, -2.2), Z];
  return { pts, from: A, to: Z };
}
