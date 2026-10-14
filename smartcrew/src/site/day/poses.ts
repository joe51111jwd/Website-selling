// One Day's camera, v2 (RIDE_SHOTS.md §4–5): the Stage's keys on the ride's clock (`at` = ms of
// the film; registerPoses("day", keys, { clock })). Every moment is its own SHOT, one continuous
// camera walking through the day, and the camera never stops: every hold keeps a slow move going
// (a dolly, an orbit, a crane, a track) in the direction the move before it was going.
//
//   6:42   extreme close-up on the phone (two taps) → pull back and pan right: the office arrives
//   6:55   a close orbit round the phone; the office seen over its shoulder
//   9:20   crane up: a high angle while the truck drives the haul road on the map ground; then
//          the office comes up to us for the ticket
//   4:12   crane down to a low angle on the phone; then up again after the flying card
//   5:00   the laptop squares up; a straight push into the Profit card (the DOM takes it over)
//   5:30   a counter-orbit; Marcus's phone swings forward with Monday's plan
//   Friday nightfall, a high angle on the lamp-lit desk, a slow turntable down the timecards
//   end    dolly back to the film's one centred, symmetrical frame: the whole app
//
// The stage anchor is the whole takeover (the viewport): positions here are % of the viewport
// (x from the left, y from the top), the phone's size its height in % of the viewport's height,
// the laptop's its width in % of the viewport's width. They become Stage units for the viewport's
// aspect when the keys are registered (again on resize). ./shotkeys.ts compiles the moves and
// events into keys.

import { phone as isPhone } from "../../three/stage/store";
import type { Box, FocusSpec, PoseKey } from "../../three/stage/types";
import { RIDE, type Ride } from "./ride";
import { SCRIPT } from "./script";
import { Film, type MoveTo } from "./shotkeys";

// ─── viewport % → Stage units ─────────────────────────────────────────────────

/** The frame's height in Stage units (1 = 10 cm); its width follows the viewport's aspect. */
const FH = 6;
/** The Stage's camera (src/three/stage/Stage.tsx: CAM_Z 26, FOV 22°). */
const CAM_Z = 26;
const KK = (2 * CAM_Z * Math.tan((22 * Math.PI) / 360)) / FH; // world units per frame unit (any viewport)
/** The models' sizes in Stage units (their re-centred boxes). */
const PHONE_H = 1.634;
const LAPTOP_W = 3.117;

type Rot = { rx?: number; ry?: number; rz?: number; z?: number; power?: number };
type Num = NonNullable<MoveTo["iphone"]>;
let FW = FH * (16 / 9);
const persp = (z: number) => CAM_Z / (CAM_Z - z * KK);

/** The phone, its centre at (x%, y%) of the viewport, h% of the viewport's height tall. */
function ph(x: number, y: number, h: number, r: Rot = {}): Num {
  const z = r.z ?? 0;
  const p = persp(z);
  return { x: ((x / 100 - 0.5) * FW) / p, y: ((0.5 - y / 100) * FH) / p, z, s: ((h / 100) * FH) / (PHONE_H * p), rx: r.rx ?? 0, ry: r.ry ?? 0, rz: r.rz ?? 0, ...(r.power !== undefined ? { power: r.power } : {}) };
}
/** The laptop, its centre at (x%, y%) of the viewport, w% of the viewport's width wide. */
function lp(x: number, y: number, w: number, r: Rot = {}): Num {
  const z = r.z ?? 0;
  const p = persp(z);
  return { x: ((x / 100 - 0.5) * FW) / p, y: ((0.5 - y / 100) * FH) / p, z, s: ((w / 100) * FW) / (LAPTOP_W * p), rx: r.rx ?? 0, ry: r.ry ?? 0, rz: r.rz ?? 0, ...(r.power !== undefined ? { power: r.power } : {}) };
}
/** A pose moved on a little (a hold's drift): `x`/`y` in % of the viewport, the rest in Stage units / degrees. */
function drift(p: Num, d: { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; s?: number }): Num {
  const k = persp(p.z ?? 0);
  return {
    ...p,
    x: (p.x ?? 0) + ((d.x ?? 0) / 100) * (FW / k),
    y: (p.y ?? 0) - ((d.y ?? 0) / 100) * (FH / k),
    z: (p.z ?? 0) + (d.z ?? 0),
    rx: (p.rx ?? 0) + (d.rx ?? 0),
    ry: (p.ry ?? 0) + (d.ry ?? 0),
    rz: (p.rz ?? 0) + (d.rz ?? 0),
    s: (p.s ?? 1) * (d.s ?? 1),
  };
}

// ─── native px on the screens (web 1440×900, phone 402×874), measured on the rendered screens ──

export const PX = {
  /** phone-home: Clock In; phone-select-task: Start */
  clockIn: [118.5, 383.3, 165, 165] as Box,
  start: [209.3, 785.3, 172.8, 49.5] as Box,
  /** the forms' Submit, the 5 PM Clock Out, Friday's Submit Timecard */
  submit: [207, 777.2, 174.5, 41] as Box,
  clockOut: [205.7, 620.1, 140, 50] as Box,
  submitTimecard: [33, 257.7, 336, 49.5] as Box,
  /** phone-d-clockedin: the running timer; phone-d-service-sent: the summary card */
  timer: [56.3, 312.8, 289.4, 46] as Box,
  serviceCard: [20, 605, 362, 172] as Box,
  /** web-dashboard: the Clock Ins row that lands at 6:42 */
  clockRow: [339, 694, 1057, 66] as Box,
  /** web-d-inspections: the 06:55 inspection */
  inspRow: [139, 506.8, 1257, 62] as Box,
  /** web-d-hauling: ticket #14 */
  haulRow: [339, 351.5, 1057, 56] as Box,
  /** web-d-queue: the D6's request */
  queueRow: [339, 277, 1057, 63.5] as Box,
  /** web-project-detail: the Profit card */
  profit: [560.3, 385, 199.2, 66] as Box,
  /** web-scheduling: Mon 12 and the block that drops into it; the toolbar's Add Schedule */
  monCell: [339, 594, 151, 189] as Box,
  block: [346, 685, 137, 52.8] as Box,
  addSchedule: [1263, 108, 134, 40] as Box,
  /** web-timecards: the Status column's first row (8 rows of 60.75); the toast */
  status0: [1250, 294.3, 110, 60.75] as Box,
  toast: [1018, 70, 404, 100] as Box,
  /** web-dashboard: the sidebar's items, Dashboard (0) … Reports (10) */
  nav: (k: number): Box => [10, 101 + 49 * k, 275, 43],
};
export const centre = (b: Box): [number, number] => [b[0] + b[2] / 2, b[1] + b[3] / 2];

/** The pulse's start on the phone at each moment (native px): where the tap's result shows. */
const FROM_PHONE: [number, number][] = [
  [201, 335], // 6:42 the timer
  [201, 640], // 6:55 the Pre-trip passed sheet
  [201, 640], // 9:20
  [201, 690], // 4:12
  [201, 300], // 5:00 Clocked out
  [201, 520], // 5:30
  [201, 282], // Friday: Timecard submitted
];

// ─── the film ─────────────────────────────────────────────────────────────────

export function ridePoses(aspect = typeof window !== "undefined" ? window.innerWidth / Math.max(1, window.innerHeight) : 16 / 9, R: Ride = RIDE): PoseKey[] {
  FW = FH * Math.max(1.2, Math.min(2.6, aspect));
  const m = R.moments;
  const b = (i: number, k: string) => m[i].at[k];
  const S = SCRIPT;
  const F = new Film({ anchor: "day", frame: [FW, FH], float: 0, look: 0.2, display: { show: 0 } });

  // ── the wait ("Enjoy the ride"): the phone below the frame, tipped back, its screen already lit;
  // the laptop past the right edge, lit
  F.move(0, "linear", {
    iphone: ph(60, 168, 105, { rx: 34, ry: -8, rz: -1, power: 1 }),
    macbook: lp(152, 47, 50, { rx: 8, ry: -36, z: -0.6, power: 1 }),
    view: { rx: 0, ry: 0 },
    light: { key: 0.85, warm: 0 },
    focus: null,
  });
  F.at(0, { iphone: { screen: "phone-home" }, macbook: { screen: "web-dashboard" }, front: "iphone" });
  F.move(m[0].start, "linear", {});

  // ── 6:42 AM · ECU on the phone → pull back and pan right ──
  {
    const i = 0;
    const ecu = ph(60, 55, 105, { rx: 3, ry: -8, rz: -1 });
    // the rise into the close-up, then a slow dolly in while the time, the headline and the taps play
    F.move(m[i].settle, "inOut", { iphone: ecu, macbook: lp(148, 47, 50, { rx: 8, ry: -36, z: -0.6 }) });
    F.move(b(i, "pull")[0], "linear", { iphone: ph(60, 55, 110, { rx: 3, ry: -10, rz: -1 }), macbook: lp(144, 47, 50, { rx: 8, ry: -34, z: -0.6 }) });
    F.at(b(i, "sheet")[0], { iphone: { screen: "phone-select-task" } });
    F.at(b(i, "clocked")[0], { iphone: { screen: S[i].phone.after } });
    // pull back and pan right: the office arrives (the pan carries on into the hold)
    const pulled = ph(28, 64, 56, { rx: 4, ry: 16, rz: 2, z: 0.6 });
    const office = lp(67, 55, 48, { rx: 8, ry: -14, z: -0.6 });
    F.move(b(i, "pull")[1], "inOut", { iphone: pulled, macbook: office });
    F.pulse(b(i, "pulse")[0], b(i, "pulse")[1], { from: "iphone", to: "macbook", fromPx: FROM_PHONE[0], toPx: centre(PX.clockRow) });
    // push in on the new row (it lifts off the screen: the DOM's, ./fx.ts) as the pan goes on
    const rowFocus: FocusSpec = { device: "macbook", px: centre(PX.clockRow), zoom: 1.06, to: [0.66, 0.63] };
    F.move(b(i, "lift")[0], "linear", { iphone: drift(pulled, { x: -0.5, ry: 0.5 }), macbook: drift(office, { x: -0.4, ry: 0.3 }) });
    F.move(b(i, "lift")[1], "inOut", { iphone: drift(pulled, { x: -1.2, ry: 1.2 }), macbook: drift(office, { x: -0.9, ry: 0.8 }), focus: rowFocus });
    // hold: the pan carries on (the devices drift left, the view turns), the push creeps on
    F.move(m[i].end, "linear", {
      iphone: drift(pulled, { x: -3.6, ry: 3.4, y: -0.6 }),
      macbook: drift(office, { x: -2.6, ry: 2 }),
      view: { ry: 1.4 },
      focus: { ...rowFocus, zoom: 1.09, to: [0.65, 0.625] },
    });
  }

  // ── 6:55 AM · a close orbit round the phone; the office over its shoulder ──
  {
    const i = 1;
    const hero = ph(50, 54, 92, { rx: 2, ry: -10, z: 0.4 });
    const back = lp(81, 35, 30, { rx: 6, ry: -16, z: -2.4, power: 0.45 });
    // the pan turns into the orbit: the phone comes forward to the centre; its screen turns to the
    // form while it is turned away
    F.move(m[i].settle, "inOut", { iphone: hero, macbook: back, view: { rx: -1, ry: -12 }, focus: null, light: { key: 0.95, warm: 0.05 } });
    F.at(b(i, "swap")[0], { iphone: { screen: S[i].phone.before }, macbook: { screen: S[i].laptop.before } });
    F.at(b(i, "sent")[0], { iphone: { screen: S[i].phone.after } });
    F.pulse(b(i, "pulse")[0], b(i, "pulse")[1], { from: "iphone", to: "macbook", fromPx: FROM_PHONE[1], toPx: centre(PX.inspRow) });
    // the orbit: −12° → +12°, linear (the highlights slide across the glass); the laptop lights
    // up as the record lands
    const span = m[i].end - m[i].settle;
    const ry = (t: number) => -12 + (24 * (t - m[i].settle)) / span;
    F.move(b(i, "pulse")[1], "linear", { view: { ry: ry(b(i, "pulse")[1]) }, iphone: drift(hero, { ry: 0.6 }), macbook: drift(back, { z: 0.05 }) });
    F.move(b(i, "insert")[0] + 300, "linear", { view: { ry: ry(b(i, "insert")[0] + 300) }, iphone: drift(hero, { ry: 0.7 }), macbook: { ...drift(back, { z: 0.08 }), power: 1 } });
    F.at(b(i, "ring")[0], { macbook: { ring: PX.inspRow, dim: 0.1 } });
    F.move(m[i].end, "linear", { view: { ry: 12, rx: 0 }, iphone: drift(hero, { z: 0.06, ry: 2 }), macbook: { ...drift(back, { z: 0.2 }), power: 1 } });
  }

  // ── 9:20 AM · crane up; the haul on the map ground; then the office comes up to us ──
  {
    const i = 2;
    const corner = ph(13, 80, 46, { rx: 14, ry: 24, rz: -6, z: 0.6 });
    const low = lp(77, 82, 36, { rx: 30, ry: -10, z: -0.8, power: 0.92 });
    F.at(m[i].start, { macbook: { ring: null, dim: 0.16 } });
    F.at(m[i].start + 450, { iphone: { screen: S[i].phone.before }, macbook: { screen: S[i].laptop.before } });
    F.move(m[i].settle, "inOut", { iphone: corner, macbook: low, view: { rx: 12, ry: 4 }, light: { key: 1.15, warm: 0 } });
    // the track: the camera follows the truck to the right (the devices slide left, slowly)
    F.move(b(i, "drive")[1], "linear", { iphone: drift(corner, { x: -2.2 }), macbook: drift(low, { x: -3.2 }), view: { ry: 1.5 } });
    F.at(b(i, "sent")[0], { iphone: { screen: S[i].phone.after } });
    F.move(b(i, "rise")[0], "linear", { iphone: drift(corner, { x: -3.2, ry: -1.4 }), macbook: drift(low, { x: -4.4 }), view: { ry: 0.6 } });
    // the office comes up to us: Materials · Hauling, a touch pushed in on today's tickets
    const up = lp(64, 55, 49, { rx: 12, ry: -7, z: -0.3, power: 1 });
    const tickets: FocusSpec = { device: "macbook", px: [868, 420], zoom: 1.06, to: [0.66, 0.57] };
    F.move(b(i, "rise")[1], "inOut", { iphone: drift(corner, { x: -4, y: 1, ry: -2 }), macbook: up, view: { rx: 7, ry: 0 }, focus: tickets });
    // hold: the track carries on in the truck's direction
    F.move(m[i].end, "linear", { iphone: drift(corner, { x: -6, y: 1.6, ry: -3 }), macbook: drift(up, { x: -3, ry: 1.2 }), view: { rx: 6, ry: -1.6 }, focus: { ...tickets, zoom: 1.09, to: [0.65, 0.57] } });
  }

  // ── 4:12 PM · crane down to a low angle; then up after the flying card ──
  {
    const i = 3;
    const hero = ph(45, 57, 96, { rx: 1, ry: 16, rz: 3, z: 0.3 });
    const shelf = lp(81, 34, 38, { rx: 2, ry: -24, z: -1.6, power: 0.5 });
    F.at(m[i].start + 500, { iphone: { screen: S[i].phone.before }, macbook: { screen: S[i].laptop.before } });
    F.move(m[i].settle, "inOut", { iphone: hero, macbook: shelf, view: { rx: -6, ry: 2 }, focus: null, light: { key: 1.0, warm: 0.35 } });
    F.at(b(i, "sent")[0], { iphone: { screen: S[i].phone.after } });
    // a slow rise while the request is written, then the crane follows the card up; the laptop
    // comes forward, lit
    F.move(b(i, "fly")[0], "linear", { iphone: drift(hero, { y: -0.8, ry: -1.4 }), macbook: drift(shelf, { y: -0.3 }), view: { rx: -5 } });
    const shelf2 = lp(73, 45, 44, { rx: 4, ry: -20, z: -1.2, power: 1 });
    const hero2 = ph(41, 63, 88, { rx: 3, ry: 14, rz: 3, z: 0.2 });
    F.move(b(i, "fly")[1], "inOut", { iphone: hero2, macbook: shelf2, view: { rx: 4, ry: 1 } });
    F.at(b(i, "ring")[0], { macbook: { ring: PX.queueRow, dim: 0.1 } });
    F.move(m[i].end, "linear", { iphone: drift(hero2, { x: -2, y: 2.5, ry: -2 }), macbook: drift(shelf2, { x: -0.8, ry: 1.5 }), view: { rx: 6, ry: 0 }, light: { key: 0.97, warm: 0.48 } });
  }

  // ── 5:00 PM · the payoff: square up and push straight in on the profit ──
  {
    const i = 4;
    const square = lp(65, 51, 54, { rx: 8, ry: -4, z: -0.4 });
    const fg = ph(23, 70, 64, { rx: 2, ry: 22, rz: 3, z: 0.8 });
    F.at(m[i].start, { macbook: { ring: null, dim: 0.16 } });
    F.at(m[i].start + 450, { iphone: { screen: S[i].phone.before }, macbook: { screen: S[i].laptop.before } });
    F.move(m[i].settle, "inOut", { iphone: fg, macbook: square, view: { rx: 1, ry: -1 }, light: { key: 0.95, warm: 0.55 } });
    F.at(b(i, "sent")[0], { iphone: { screen: S[i].phone.after } });
    F.pulse(b(i, "pulse")[0], b(i, "pulse")[1], { from: "iphone", to: "macbook", fromPx: FROM_PHONE[4], toPx: centre(PX.profit) });
    F.move(b(i, "push")[0], "linear", { iphone: drift(fg, { z: 0.06, x: -0.6 }), macbook: drift(square, { z: 0.06 }), view: { ry: -0.6 } });
    // the push through the screen (the DOM's profit card takes over as it ends)
    const push: FocusSpec = { device: "macbook", px: centre(PX.profit), zoom: 2.4, to: [0.58, 0.47] };
    F.move(b(i, "push")[1], "in", { iphone: drift(fg, { x: -3, z: 0.1, ry: 2 }), macbook: drift(square, { z: 0.1 }), focus: push });
    F.move(m[i].end, "linear", { iphone: drift(fg, { x: -5, z: 0.12, ry: 4 }), macbook: drift(square, { z: 0.14 }), focus: { ...push, zoom: 2.5 }, view: { ry: 0.6 } });
  }

  // ── 5:30 PM · a counter-orbit; the plan goes out; the phone swings forward ──
  {
    const i = 5;
    const right = lp(68, 58, 45, { rx: 8, ry: -12, z: -0.4 });
    const behind = ph(38, 60, 46, { rx: 4, ry: -28, z: -2.4 });
    // the number shrinks back into the screen; the laptop slides right; the phone drops back
    F.move(b(i, "unzoom")[1], "inOut", { macbook: lp(66, 53, 50, { rx: 8, ry: -8, z: -0.4 }), iphone: ph(30, 68, 50, { rx: 4, ry: -12, z: -1 }), focus: null, view: { ry: 4, rx: 2 } });
    F.at(b(i, "unzoom")[0] + 200, { iphone: { screen: "phone-home" } });
    F.at(b(i, "swap")[0], { macbook: { screen: S[i].laptop.before } });
    F.at(b(i, "unzoom")[1], { front: "macbook" });
    const cal: FocusSpec = { device: "macbook", px: [520, 640], zoom: 1.1, to: [0.6, 0.63] };
    F.move(m[i].settle, "inOut", { macbook: right, iphone: behind, view: { ry: 8, rx: 2 }, focus: cal, light: { key: 0.85, warm: 0.75 } });
    // counter-orbit: +8° → −8° across the moment
    const span = m[i].end - m[i].settle;
    const ry = (t: number) => 8 - (16 * (t - m[i].settle)) / span;
    F.at(b(i, "block")[1], { macbook: { ring: PX.block, dim: 0.1 } });
    F.move(b(i, "swing")[0], "linear", { view: { ry: ry(b(i, "swing")[0]) }, focus: { ...cal, zoom: 1.14 }, iphone: drift(behind, { ry: 2 }), macbook: drift(right, { z: 0.03 }) });
    F.at(b(i, "plan")[0], { iphone: { screen: S[i].phone.after } });
    F.at(b(i, "swing")[0] + 500, { front: "iphone" });
    // Marcus's phone swings forward into the left-centre foreground
    const fore = ph(42, 58, 84, { rx: 3, ry: 10, rz: 1, z: 0.9 });
    F.move(b(i, "swing")[1], "inOut", { view: { ry: ry(b(i, "swing")[1]) }, iphone: fore, focus: { ...cal, zoom: 1.16 }, macbook: drift(right, { z: 0.04 }) });
    F.move(m[i].end, "linear", { view: { ry: -8 }, iphone: drift(fore, { ry: -7, z: 0.06 }), macbook: drift(right, { z: 0.08 }), focus: { ...cal, zoom: 1.19 } });
  }

  // ── Friday · nightfall; a high angle on the lamp-lit desk; a slow turntable ──
  {
    const i = 6;
    const desk = lp(66, 63, 47, { rx: 14, ry: -8, z: -0.6 });
    const lean = ph(27, 71, 64, { rx: 12, ry: 14, rz: -2, z: 0.6 });
    F.at(m[i].start, { macbook: { ring: null, dim: 0.16 } });
    F.at(m[i].start + 500, { iphone: { screen: S[i].phone.before }, macbook: { screen: S[i].laptop.before } });
    F.move(m[i].settle, "inOut", { iphone: lean, macbook: desk, view: { rx: 10, ry: -2 }, focus: null, light: { key: 0.7, warm: 1 } });
    F.at(b(i, "sent")[0], { iphone: { screen: S[i].phone.after } });
    F.pulse(b(i, "pulse")[0], b(i, "pulse")[1], { from: "iphone", to: "macbook", fromPx: FROM_PHONE[6], toPx: centre(PX.status0) });
    F.move(b(i, "cascade")[0], "inOut", { iphone: { ...drift(lean, { z: 0.05 }), power: 0.72 }, view: { ry: -1.2 }, focus: { device: "macbook", px: [1250, 300], zoom: 1.12, to: [0.8, 0.42] } });
    // the camera follows the cascade down the Status column, then settles on the toast
    F.move(b(i, "cascade")[1], "linear", { focus: { device: "macbook", px: [1250, 720], zoom: 1.14, to: [0.8, 0.62] }, view: { ry: -0.4 }, iphone: drift(lean, { z: 0.08, ry: 0.6 }) });
    const toast: FocusSpec = { device: "macbook", px: [1180, 150], zoom: 1.1, to: [0.78, 0.4] };
    F.move(b(i, "toast")[1], "inOut", { focus: toast, view: { ry: 0 }, iphone: drift(lean, { z: 0.09, ry: 0.9 }) });
    // hold: the turntable
    F.move(m[i].end, "linear", { focus: { ...toast, zoom: 1.13, to: [0.77, 0.405] }, view: { ry: 4, rx: 11 }, iphone: drift(lean, { z: 0.12, ry: 2.6 }), macbook: drift(desk, { ry: 1 }) });
  }

  // ── the finale: dolly back to the whole app; the one centred frame ──
  {
    const f = R.finale;
    const lap = lp(60, 75, 40, { rx: 10, ry: -10, z: -0.4, power: 1 });
    const phn = ph(33.5, 77, 44, { rx: 4, ry: 16, rz: 1.5, z: 0.6, power: 1 });
    F.at(f.screens, { iphone: { screen: "phone-working" }, macbook: { screen: "web-dashboard", dim: 0.08 } });
    F.move(f.settle, "inOut", { iphone: phn, macbook: lap, focus: null, view: { rx: 3, ry: 0 }, light: { key: 0.8, warm: 0.9 } });
    // the ring glides once down the dashboard's sidebar: Dashboard … Reports
    const [s0, s1] = f.sweep;
    for (let k = 0; k < 11; k++) F.at(s0 + ((s1 - s0) * k) / 10, { macbook: { ring: PX.nav(k) } });
    F.at(s1 + 260, { macbook: { ring: null } });
    // the orbit runs on through the hold and eases out over the last 600 ms (then the Stage rests)
    F.move(f.end - 600, "linear", { view: { ry: 1.8, rx: 3.36 }, iphone: drift(phn, { ry: -1.35 }), macbook: drift(lap, { ry: 1.08 }) });
    F.move(f.end, "out", { view: { ry: 2, rx: 3.4 }, iphone: drift(phn, { ry: -1.5 }), macbook: drift(lap, { ry: 1.2 }) });
  }

  return F.compile();
}

/** Phones never load the Stage; their day is ./phone/DayPhone.tsx. */
export const dayHasStage = !isPhone;
