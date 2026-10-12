// Where a spot on a device's screen lands in the viewport, without three.js: the same fit,
// pose, perspective and look-around maths the Stage uses (src/three/stage/Stage.tsx), run in plain
// JS so the DOM tiles can fly to the exact sidebar row or tab they become.
//
// The screens' planes were read once from the live Stage (window.__stage.rig, see
// scratchpad/design/v2/proof_apps/geo.cjs): corner O, edge U (image x) and V (image y), in the
// device's own upright space, device units. If the models or the Stage's camera change, re-run it.

import type { Box, DevicePose } from "../../three/stage";

type V3 = [number, number, number];
type Geo = {
  O: V3;
  U: V3;
  V: V3;
  aspect: number;
  fit: "width" | "cover";
  native: [number, number];
};

const GEO: Record<"macbook" | "iphone", Geo> = {
  macbook: {
    O: [-1.50375, 1.00765, -1.45093],
    U: [3.00752, 0, 0],
    V: [0.00001, -1.83745, 0.66904],
    aspect: 1.538,
    fit: "width",
    native: [1440, 900],
  },
  iphone: {
    O: [-0.36522, 0.79228, 0.06771],
    U: [0.73021, 0, 0],
    V: [0, -1.58469, 0],
    aspect: 0.46079,
    fit: "cover",
    native: [402, 874],
  },
};

/** Stage camera (Stage.tsx: FOV 22°, camera on +z looking at the origin). */
const FOV = 22;
const D2R = Math.PI / 180;

/** The image window the surface shows (ScreenSurface.window, scroll 0): [w, h, x0, y0] native px. */
function windowOf(g: Geo): [number, number, number, number] {
  const [w, h] = g.native;
  if (g.fit === "cover" && w / h > g.aspect) {
    const vw = h * g.aspect;
    return [vw, h, (w - vw) / 2, 0];
  }
  return [w, w / g.aspect, 0, 0];
}

/** Euler XYZ (three.js order) as a row-major 3×3, degrees in. */
function rot(rxd: number, ryd: number, rzd: number) {
  const x = rxd * D2R,
    y = ryd * D2R,
    z = rzd * D2R;
  const a = Math.cos(x),
    b = Math.sin(x),
    c = Math.cos(y),
    d = Math.sin(y),
    e = Math.cos(z),
    f = Math.sin(z);
  const ae = a * e,
    af = a * f,
    be = b * e,
    bf = b * f;
  return [c * e, -c * f, d, af + be * d, ae - bf * d, -b * c, bf - ae * d, be + af * d, a * c];
}
const mul = (m: number[], v: V3): V3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];

export type Viewport = { W: number; H: number };
export type AnchorBox = { x: number; y: number; w: number; h: number };
export type Look = { x: number; y: number };

/**
 * A native-px point on a device's screen → viewport px.
 * `pose` is the device's resolved pose (all numeric fields), `frame` the key's frame, `anchor` the
 * anchor's viewport box, `look` the composition's look-around (the Stage's lookX/lookY springs).
 */
export function screenPointToViewport(
  device: "macbook" | "iphone",
  px: number,
  py: number,
  pose: Required<Pick<DevicePose, "x" | "y" | "z" | "rx" | "ry" | "rz" | "s">>,
  frame: [number, number],
  anchor: AnchorBox,
  vp: Viewport,
  look: Look = { x: 0, y: 0 },
  view: { rx: number; ry: number } = { rx: 0, ry: 0 },
): [number, number] {
  const g = GEO[device];
  const [ww, wh, x0, y0] = windowOf(g);
  const s = (px - x0) / ww;
  const t = (py - y0) / wh;
  // the point on the screen plane, device-local (device units)
  const local: V3 = [g.O[0] + g.U[0] * s + g.V[0] * t, g.O[1] + g.U[1] * s + g.V[1] * t, g.O[2] + g.U[2] * s + g.V[2] * t];
  // device pose (rotation, scale, offset), then the composition's turn
  const rd = rot(pose.rx, pose.ry, pose.rz);
  const p = mul(rd, [local[0] * pose.s, local[1] * pose.s, local[2] * pose.s]);
  const q = mul(rot(view.rx + look.y * 3, view.ry + look.x * 4, 0), [p[0] + pose.x, p[1] + pose.y, p[2] + pose.z]);
  // device units → CSS px at the focal plane, centred on the anchor (Stage.tsx `fit`)
  const K = Math.min(anchor.w / frame[0], anchor.h / frame[1]);
  const X = anchor.x + anchor.w / 2 - vp.W / 2 + q[0] * K;
  const Y = vp.H / 2 - (anchor.y + anchor.h / 2) + q[1] * K;
  const Z = q[2] * K;
  const dcam = vp.H / (2 * Math.tan((FOV * D2R) / 2));
  const f = dcam / (dcam - Z);
  return [vp.W / 2 + X * f, vp.H / 2 - Y * f];
}

/** The four corners of a device's visible screen in viewport px (TL TR BR BL), e.g. for the cursor's loupe. */
export function screenQuad(device: "macbook" | "iphone", ...rest: DropFirst3<Parameters<typeof screenPointToViewport>>): number[] {
  const [ww, wh, x0, y0] = windowOf(GEO[device]);
  const [w, h] = GEO[device].native;
  // the macbook's window runs past the image's bottom; clamp to the image itself
  const x1 = x0 + Math.min(ww, w);
  const y1 = y0 + Math.min(wh, h);
  const out: number[] = [];
  for (const [px, py] of [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ])
    out.push(...screenPointToViewport(device, px, py, ...rest));
  return out;
}
type DropFirst3<T extends unknown[]> = T extends [unknown, unknown, unknown, ...infer R] ? R : never;

/** A ring box's centre (native px). */
export const boxCentre = (b: Box): [number, number] => [b[0] + b[2] / 2, b[1] + b[3] / 2];
