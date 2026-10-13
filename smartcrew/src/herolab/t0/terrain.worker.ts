// t0 · the ground's worker: builds the land (E) as soon as the viewport is known (before the fonts
// are in), then the plan for the measured pad, off the main thread, so the hero's entrance never
// shares a frame with the contouring (0 long tasks on a phone at 4× CPU).

import { buildField, buildPlan, fieldTexture, pathD, splitByRect, type Field, type Mode, type Pad, type Rect } from "./terrain";
import { BERM } from "./consts";

export type FieldReq = { id: number; kind: "field"; W: number; H: number; mode: Mode; tex: boolean };
export type PlanReq = { id: number; kind: "plan"; W: number; H: number; mode: Mode; pad: Pad; keep: Rect[]; labels: number };
export type FieldRes = { id: number; kind: "field"; tex: Float32Array | null; grid: { x0: number; y0: number; step: number; nx: number; ny: number }; ms: number };
/** berm (phones): the fill slope's first lines under the pad, which ride the blade down the screen */
export type Paths = { natI: string; natX: string; proI: string; proX: string; exPad: string; exSlope: string; berm: string };
export type PlanRes = {
  id: number;
  kind: "plan";
  paths: Paths;
  labels: { x: number; y: number; a: number; t: string }[];
  limits: Rect;
  grade: { pad: Pad; cut: number; fill: number; k: number };
  ms: number;
};

let cache: { key: string; f: Field } | null = null;
const field = (W: number, H: number, mode: Mode) => {
  const key = `${W}x${H}:${mode}`;
  if (!cache || cache.key !== key) cache = { key, f: buildField(W, H, mode) };
  return cache.f;
};

self.onmessage = (ev: MessageEvent<FieldReq | PlanReq>) => {
  const m = ev.data;
  const t0 = performance.now();
  if (m.kind === "field") {
    const f = field(m.W, m.H, m.mode);
    const tex = m.tex ? fieldTexture(f) : null;
    const g = f.fine;
    const res: FieldRes = { id: m.id, kind: "field", tex, grid: { x0: g.x0, y0: g.y0, step: g.step, nx: g.nx, ny: g.ny }, ms: performance.now() - t0 };
    (self as unknown as Worker).postMessage(res, tex ? [tex.buffer] : []);
    return;
  }
  const f = field(m.W, m.H, m.mode);
  const p = buildPlan(f, { W: m.W, H: m.H, mode: m.mode, pad: m.pad, keep: m.keep, labels: m.labels });
  const by = (rs: typeof p.natural, idx: boolean) => pathD(rs.filter((r) => r.index === idx));
  const res: PlanRes = {
    id: m.id,
    kind: "plan",
    paths: {
      natI: by(p.natural, false),
      natX: by(p.natural, true),
      proI: by(p.proposed, false),
      proX: by(p.proposed, true),
      exPad: pathD(p.existingPad),
      exSlope: pathD(p.existingSlope),
      berm: m.mode === "phone" ? pathD(splitByRect(p.proposed, { x: -1e4, y: m.pad.y + m.pad.h, w: 2e4, h: BERM }).inside) : "",
    },
    labels: p.labels,
    limits: p.limits,
    grade: p.grade,
    ms: performance.now() - t0,
  };
  (self as unknown as Worker).postMessage(res);
};
