// A small compiler for clock-driven Stage keys (One Day's ride; usable by any film on the Player).
//
// The Stage blends from one key to the next with the next key's ease, and takes a key's discrete
// fields (screen, ring, dim, front) from the earlier key. Writing a film straight as keys has one
// trap: anything that must happen in the middle of a camera move (a screen change while the phone
// turns, a ring, a pulse) needs a key there, and a plain key would break the move into two eased
// halves (it would stop and start again). So a film is written as two lists:
//
//   · MOVES: where things are going (device numbers, the view's orbit, the light, the push-in),
//     each arriving at its time with its ease; anything a move doesn't name stays where it was;
//   · EVENTS: discrete changes at a time (a screen, a ring, the ring's dim, which device is in
//     front), plus PULSES (the orange data pulse, from one screen to the other over a window).
//
// compile() writes one key at every move and every event; a key that falls inside a move gets the
// move's own values at that time and an ease cut from the move's curve, so the move runs exactly as
// if no key were there.

import { EASES } from "../../three/stage/store";
import type { Box, DeviceId, DevicePose, Ease, FocusSpec, PoseKey, PulseSpec } from "../../three/stage/types";

type Num = "x" | "y" | "z" | "rx" | "ry" | "rz" | "s" | "power";
const NUM: Num[] = ["x", "y", "z", "rx", "ry", "rz", "s", "power"];
type Devs = "iphone" | "macbook";
const DEVS: Devs[] = ["iphone", "macbook"];

export type MoveTo = {
  iphone?: Partial<Record<Num, number>>;
  macbook?: Partial<Record<Num, number>>;
  view?: { rx?: number; ry?: number };
  light?: { key?: number; warm?: number };
  /** the push-in; null = none */
  focus?: FocusSpec | null;
};
export type Event = {
  iphone?: { screen?: string | null; ring?: Box | null; dim?: number };
  macbook?: { screen?: string | null; ring?: Box | null; dim?: number };
  front?: DeviceId | null;
};

type Full = {
  dev: Record<Devs, Record<Num, number>>;
  view: { rx: number; ry: number };
  light: { key: number; warm: number };
  focus: FocusSpec | null;
};
type Disc = {
  dev: Record<Devs, { screen: string | null; ring: Box | null; dim: number }>;
  front: DeviceId | null;
};

const easeOf = (e: Exclude<Ease, (t: number) => number> | ((t: number) => number)) => (typeof e === "function" ? e : EASES[e]);

export class Film {
  private moves: { t: number; ease: (u: number) => number; to: MoveTo }[] = [];
  private events: { t: number; ev: Event }[] = [];
  private pulses: { t0: number; t1: number; spec: Omit<PulseSpec, "t"> }[] = [];
  private base: Omit<PoseKey, "at" | "ease" | "iphone" | "macbook" | "view" | "light" | "focus" | "front" | "pulse">;

  constructor(base: Omit<PoseKey, "at" | "ease" | "iphone" | "macbook" | "view" | "light" | "focus" | "front" | "pulse">) {
    this.base = base;
  }

  /** Everything named arrives at time `t` (ms), along `ease`. */
  move(t: number, ease: Exclude<Ease, (t: number) => number>, to: MoveTo) {
    this.moves.push({ t, ease: easeOf(ease), to });
    return this;
  }
  /** Discrete changes at time `t`. */
  at(t: number, ev: Event) {
    this.events.push({ t, ev });
    return this;
  }
  /** The orange pulse from one screen to the other over [t0, t1]. */
  pulse(t0: number, t1: number, spec: Omit<PulseSpec, "t">) {
    this.pulses.push({ t0, t1, spec });
    return this;
  }
  /** Where a device is (its numbers) at the latest move at or before `t` names it (for drifting on from there). */
  pose(d: Devs, t: number): Record<Num, number> {
    return { ...this.evalMoves(t).dev[d] };
  }

  private anchors(): { t: number; ease: (u: number) => number; v: Full }[] {
    const ms = [...this.moves].sort((a, b) => a.t - b.t);
    const out: { t: number; ease: (u: number) => number; v: Full }[] = [];
    let cur: Full | null = null;
    for (const m of ms) {
      const prev: Full = cur ?? {
        dev: { iphone: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, power: 1 }, macbook: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, power: 1 } },
        view: { rx: 0, ry: 0 },
        light: { key: 1, warm: 0 },
        focus: null,
      };
      const v: Full = {
        dev: { iphone: { ...prev.dev.iphone, ...defined(m.to.iphone) }, macbook: { ...prev.dev.macbook, ...defined(m.to.macbook) } },
        view: { ...prev.view, ...defined(m.to.view) },
        light: { ...prev.light, ...defined(m.to.light) },
        focus: m.to.focus !== undefined ? m.to.focus : prev.focus,
      };
      out.push({ t: m.t, ease: m.ease, v });
      cur = v;
    }
    return out;
  }

  private evalMoves(t: number): Full {
    const a = this.anchors();
    return evalAnchors(a, t).v;
  }

  /** The keys, `at` in ms of the film. */
  compile(): PoseKey[] {
    const A = this.anchors();
    if (!A.length) return [];
    const ev = [...this.events].sort((a, b) => a.t - b.t);
    const times = new Set<number>(A.map((a) => a.t));
    ev.forEach((e) => times.add(e.t));
    this.pulses.forEach((p) => (times.add(p.t0), times.add(p.t1)));
    const T = [...times].filter((t) => t >= A[0].t).sort((a, b) => a - b);

    // the discrete state in force at each time
    const disc: Disc = {
      dev: { iphone: { screen: null, ring: null, dim: 0.16 }, macbook: { screen: null, ring: null, dim: 0.16 } },
      front: null,
    };
    let ei = 0;
    const keys: PoseKey[] = [];
    let prevT = -Infinity;
    for (const t of T) {
      while (ei < ev.length && ev[ei].t <= t) {
        const e = ev[ei++].ev;
        for (const d of DEVS) {
          const x = e[d];
          if (!x) continue;
          if (x.screen !== undefined) disc.dev[d].screen = x.screen;
          if (x.ring !== undefined) disc.dev[d].ring = x.ring;
          if (x.dim !== undefined) disc.dev[d].dim = x.dim;
        }
        if (e.front !== undefined) disc.front = e.front;
      }
      const { v, seg } = evalAnchors(A, t);
      // the ease of the stretch arriving here: cut from the move this stretch lies in
      let ease: Ease = "linear";
      if (seg && prevT > -Infinity) {
        const span = seg.b.t - seg.a.t;
        const u0 = Math.max(0, Math.min(1, (prevT - seg.a.t) / span));
        const u1 = Math.max(0, Math.min(1, (t - seg.a.t) / span));
        const E = seg.b.ease;
        const e0 = E(u0);
        const e1 = E(u1);
        if (Math.abs(e1 - e0) > 1e-6 && !(u0 === 0 && u1 === 1)) ease = (x: number) => (E(u0 + x * (u1 - u0)) - e0) / (e1 - e0);
        else if (u0 === 0 && u1 === 1) ease = E;
      }
      const pulse = this.pulses.find((p) => t >= p.t0 && t <= p.t1);
      const dev = (d: Devs): DevicePose => ({ ...v.dev[d], show: 1, screen: disc.dev[d].screen, ring: disc.dev[d].ring, dim: disc.dev[d].dim });
      keys.push({
        ...this.base,
        at: t,
        ease,
        iphone: dev("iphone"),
        macbook: dev("macbook"),
        view: { ...v.view },
        light: { ...v.light },
        focus: v.focus,
        front: disc.front,
        pulse: pulse ? { ...pulse.spec, t: (t - pulse.t0) / Math.max(1, pulse.t1 - pulse.t0) } : null,
      });
      prevT = t;
    }
    return keys;
  }
}

function defined<T extends object>(o: T | undefined): Partial<T> {
  const r: Partial<T> = {};
  if (!o) return r;
  for (const k in o) if (o[k] !== undefined) r[k] = o[k];
  return r;
}

type Anchor = { t: number; ease: (u: number) => number; v: Full };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The moves' values at `t`, and the move (a → b) `t` lies in. */
function evalAnchors(A: Anchor[], t: number): { v: Full; seg: { a: Anchor; b: Anchor } | null } {
  if (t <= A[0].t) return { v: A[0].v, seg: null };
  let i = 0;
  while (i < A.length - 1 && A[i + 1].t <= t) i++;
  if (i >= A.length - 1) return { v: A[A.length - 1].v, seg: null };
  const a = A[i];
  const b = A[i + 1];
  if (t === a.t) return { v: a.v, seg: { a, b } };
  const e = b.ease((t - a.t) / (b.t - a.t));
  const v: Full = {
    dev: {
      iphone: Object.fromEntries(NUM.map((k) => [k, lerp(a.v.dev.iphone[k], b.v.dev.iphone[k], e)])) as Record<Num, number>,
      macbook: Object.fromEntries(NUM.map((k) => [k, lerp(a.v.dev.macbook[k], b.v.dev.macbook[k], e)])) as Record<Num, number>,
    },
    view: { rx: lerp(a.v.view.rx, b.v.view.rx, e), ry: lerp(a.v.view.ry, b.v.view.ry, e) },
    light: { key: lerp(a.v.light.key, b.v.light.key, e), warm: lerp(a.v.light.warm, b.v.light.warm, e) },
    focus: blendFocus(a.v.focus, b.v.focus, e),
  };
  return { v, seg: { a, b } };
}

function blendFocus(fa: FocusSpec | null, fb: FocusSpec | null, e: number): FocusSpec | null {
  if (!fa && !fb) return null;
  if (fa && fb && fa.device === fb.device)
    return {
      device: fa.device,
      px: [lerp(fa.px[0], fb.px[0], e), lerp(fa.px[1], fb.px[1], e)],
      zoom: lerp(fa.zoom, fb.zoom, e),
      to: [lerp(fa.to?.[0] ?? 0.5, fb.to?.[0] ?? 0.5, e), lerp(fa.to?.[1] ?? 0.5, fb.to?.[1] ?? 0.5, e)],
      weight: lerp(fa.weight ?? 1, fb.weight ?? 1, e),
    };
  // in or out of a push-in: its weight follows the move
  if (fb && (!fa || fa.device !== fb.device)) return e <= 0 ? fa : { ...fb, weight: (fb.weight ?? 1) * e };
  return e >= 1 ? fb : { ...fa!, weight: (fa!.weight ?? 1) * (1 - e) };
}
