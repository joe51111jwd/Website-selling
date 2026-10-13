// t1 · the site model's worker: samples the land as soon as the hero's size is known (while the
// fonts load), then grades the measured pad and cuts the sheets, off the main thread, so the
// hero's first frame never shares a task with the contouring.

import { buildField, buildPlan, type Field, type Pad, type Plan, type Rect } from "./terrain";

export type FieldReq = { id: number; kind: "field"; W: number; H: number; Hv: number; m: number; phone: boolean };
export type PlanReq = { id: number; kind: "plan"; W: number; H: number; Hv: number; m: number; phone: boolean; pads: Pad[]; blend: number; keep: Rect[]; quiet: Rect[]; labels: number; labelGap: number };
export type PlanRes = { id: number; kind: "plan"; plan: Omit<Plan, "lines">; lines: Float32Array; lineIdx: Int32Array; fieldMs: number; planMs: number };

let cache: { key: string; f: Field; ms: number } | null = null;
const field = (W: number, H: number, Hv: number, m: number, phone: boolean) => {
  const key = `${W}x${H}x${Hv}+${m}:${phone}`;
  if (!cache || cache.key !== key) {
    const t = performance.now();
    const f = buildField(W, H, Hv, phone, m);
    cache = { key, f, ms: performance.now() - t };
  }
  return cache;
};

self.onmessage = (ev: MessageEvent<FieldReq | PlanReq>) => {
  const m = ev.data;
  if (m.kind === "field") {
    field(m.W, m.H, m.Hv, m.m, m.phone);
    return;
  }
  const c = field(m.W, m.H, m.Hv, m.m, m.phone);
  const t = performance.now();
  const { lines, ...plan } = buildPlan(c.f, { pads: m.pads, blend: m.blend, keep: m.keep, quiet: m.quiet, labels: m.labels, labelGap: m.labelGap });
  // the polylines (for the cursor's contour readout), packed: [level, n, x0, y0, …] per line
  let n = 0;
  for (const l of lines) n += l.pts.length;
  const flat = new Float32Array(n);
  const idx = new Int32Array(lines.length * 3);
  let o = 0;
  lines.forEach((l, i) => {
    flat.set(l.pts, o);
    idx[i * 3] = l.level;
    idx[i * 3 + 1] = o;
    idx[i * 3 + 2] = l.pts.length;
    o += l.pts.length;
  });
  const res: PlanRes = { id: m.id, kind: "plan", plan, lines: flat, lineIdx: idx, fieldMs: c.ms, planMs: performance.now() - t };
  (self as unknown as Worker).postMessage(res, [flat.buffer, idx.buffer]);
};
