// Herolab c1 · layout: everything is a function of the viewport (W × H), so the first frame is
// computed, not measured. Sheet metrics hit the brief's numbers exactly at 1440×660, 1280×600 and
// 390×664 and scale smoothly between.

import { DESIGN_DESK, DESIGN_PHONE, HEX_C, INTRO_CAM, INTRO_NOTES, SCENE_DESK, SCENE_PHONE, type Design, type NoteId, type Pt, type Scene } from "./geometry";

export type Rect = { x: number; y: number; w: number; h: number };

export type Layout = {
  W: number;
  H: number;
  phone: boolean;
  inset: number;
  /** top strip (logo + nav) */
  strip: Rect;
  /** the drawing field (clip) */
  field: Rect;
  /** title block (desktop: one band of three cells; phone: a stack) */
  tb: Rect;
  /** desktop cell edges (x of the two inner rules) */
  cells: [number, number];
  /** final camera: world → screen */
  k: number;
  origin: Pt; // screen position of HEX_C
  /** the intro's camera */
  ki: number;
  focus: Pt;
  /** the pull-back, as a CSS transform on a layer laid out in INTRO screen coords: x' = t + r x */
  r: number;
  t: Pt;
  /** uniform scale of the design (type in the field scales with it) */
  q: number;
  scene: Scene;
  noteW: number;
  notes: Record<NoteId, Rect>;
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function computeLayout(W: number, H: number): Layout {
  const phone = W <= 760;
  let inset: number, strip: Rect, field: Rect, tb: Rect, cells: [number, number];
  if (phone) {
    inset = 8;
    const stripH = 44;
    const fieldH = Math.round(clamp(H - 454, 180, 330));
    strip = { x: inset, y: inset, w: W - 2 * inset, h: stripH };
    field = { x: inset, y: inset + stripH, w: W - 2 * inset, h: fieldH };
    tb = { x: inset, y: field.y + fieldH + 8, w: W - 2 * inset, h: Math.max(0, H - inset - (field.y + fieldH + 8)) };
    cells = [0, 0];
  } else {
    inset = clamp(Math.floor(W / 120), 8, 16);
    const stripH = Math.round(clamp(4 + H / 15, 40, 60));
    const tbH = Math.round(clamp(90 + 0.2333 * H, 214, 300));
    strip = { x: inset, y: inset, w: W - 2 * inset, h: stripH };
    const tbTop = H - inset - tbH;
    field = { x: inset, y: inset + stripH, w: W - 2 * inset, h: tbTop - 8 - (inset + stripH) };
    tb = { x: inset, y: tbTop, w: W - 2 * inset, h: tbH };
    const cw = Math.round(clamp(0.2125 * W - 2, 250, 380));
    const bw = Math.round(clamp(0.2 * W + 64, 270, 420));
    cells = [W - inset - cw - bw, W - inset - cw];
  }

  // final camera: the reference design, uniformly scaled into this field and centred
  const d: Design = phone ? DESIGN_PHONE : DESIGN_DESK;
  const dw = d.field[2] - d.field[0];
  const dh = d.field[3] - d.field[1];
  const q = Math.min(field.w / dw, field.h / dh);
  const k = d.k * q;
  const origin: Pt = [field.x + (field.w - dw * q) / 2 + (d.hex[0] - d.field[0]) * q, field.y + (field.h - dh * q) / 2 + (d.hex[1] - d.field[1]) * q];

  // the intro's camera at the end of its hold (index.html: --ms = max(W/1600, H/1000))
  const port = W / H <= 1;
  const ic = port ? INTRO_CAM.port : INTRO_CAM.land;
  const ms = Math.max(W / 1600, H / 1000);
  const ki = ms * ic.z;
  const focus: Pt = [ic.fx, ic.fy];

  // the pull-back: s_f = origin + (p − HEX_C)·k, s_i = C + (p − focus)·ki  ⇒  s_f = t + r·s_i
  const r = k / ki;
  const t: Pt = [origin[0] - r * W / 2 + (focus[0] - HEX_C[0]) * k, origin[1] - r * H / 2 + (focus[1] - HEX_C[1]) * k];

  const noteW = phone ? 322 : 324;
  const noteH = phone ? 60 : 64;
  const nd = INTRO_NOTES[port ? "port" : "land"];
  const notes = {} as Record<NoteId, Rect>;
  for (const id of Object.keys(nd) as NoteId[]) {
    const n = nd[id];
    notes[id] = { x: W / 2 + (n.pin[0] - focus[0]) * ki + n.ox(noteW), y: H / 2 + (n.pin[1] - focus[1]) * ki + n.oy, w: noteW, h: noteH };
  }

  return { W, H, phone, inset, strip, field, tb, cells, k, origin, ki, focus, r, t, q, scene: phone ? SCENE_PHONE : SCENE_DESK, noteW, notes };
}

/** world → final screen */
export const toScreen = (L: Layout, p: Pt): Pt => [L.origin[0] + (p[0] - HEX_C[0]) * L.k, L.origin[1] + (p[1] - HEX_C[1]) * L.k];
/** world → intro screen */
export const toIntro = (L: Layout, p: Pt): Pt => [L.W / 2 + (p[0] - L.focus[0]) * L.ki, L.H / 2 + (p[1] - L.focus[1]) * L.ki];
