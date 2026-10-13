// One Day's choreography for the Stage, on the ride's clock (./ride.ts): `at` is ms of the film
// (the Stage evaluates these keys at the player's clock: registerPoses("day", keys, { clock })).
//
// Each moment has two shots:
//  · ACT: the device that acts is big and close (the crew's phone, or the office laptop at
//    5:30 PM), the other waits behind it. The tap lands, its screen shows the result, the orange
//    pulse leaves from the button. Nothing else moves meanwhile.
//  · PUSH: the update has landed; the camera pushes in on the exact spot that changed (Stage
//    `focus`: the laptop scales about that spot) while the phone steps down to the corner, still
//    in front (Stage `front`). Then it HOLDS, perfectly still (no drift, no float), to be read.
// Between moments the devices glide from one moment's PUSH to the next one's ACT (one eased
// move). Before the first, they rise from below the fold (where they waited under the hero).

import { phone as isPhone } from "../../three/stage/store";
import type { Box, DevicePose, FocusSpec, PoseKey } from "../../three/stage/types";
import { RIDE, type Ride } from "./ride";
import { SCRIPT, type Script } from "./script";

type View = { rx: number; ry: number };
type Shot = { view: View; act: { iphone: DevicePose; macbook: DevicePose }; push: { iphone: DevicePose; macbook: DevicePose; view?: View } };

// The stage is the right ~60% of the screen, under the header and above the controls. One frame
// for every moment so the moves read as one camera.
const F: [number, number] = [5.3, 3.4];
/** The frame the poster stills (public/renders/day-*.webp) were rendered with. */
const F_POSTER: [number, number] = [5, 3.4];

const P_ACT: DevicePose = { x: -1.25, y: -0.12, z: 0.9, rx: 3, ry: 16, rz: 2, s: 1.32 };
const M_ACT: DevicePose = { x: 0.95, y: 0.3, z: -0.9, rx: 11, ry: -24, rz: 0, s: 0.98 };
const P_PUSH: DevicePose = { x: -1.95, y: -0.66, z: 1.3, rx: 6, ry: 22, rz: 4, s: 1.0 };
const M_PUSH: DevicePose = { x: 0.6, y: 0.2, z: -0.3, rx: 7, ry: -9, rz: 0, s: 1 };

const v = (p: DevicePose, d: DevicePose): DevicePose => ({ ...p, ...d });

const SHOTS: Shot[] = [
  // 6:42 AM · eye level, dawn
  { view: { rx: 0, ry: 0 }, act: { iphone: P_ACT, macbook: M_ACT }, push: { iphone: P_PUSH, macbook: M_PUSH } },
  // 6:55 AM · the camera a touch lower, the phone more upright
  {
    view: { rx: -3, ry: 2 },
    act: { iphone: v(P_ACT, { ry: 10, rz: -1, y: -0.05 }), macbook: v(M_ACT, { ry: -30, y: 0.36 }) },
    push: { iphone: v(P_PUSH, { ry: 16, rz: -2 }), macbook: v(M_PUSH, { ry: -6, rx: 5 }) },
  },
  // 9:20 AM · high sun, the camera rises and looks down
  {
    view: { rx: 6, ry: -2 },
    act: { iphone: v(P_ACT, { rx: 10, ry: 8, rz: -3, z: 1.2 }), macbook: v(M_ACT, { rx: 20, ry: -34, y: 0.2 }) },
    push: { iphone: v(P_PUSH, { rx: 10, ry: 14, rz: -4 }), macbook: v(M_PUSH, { rx: 12, ry: -5 }) },
  },
  // 4:12 PM · low and tilted
  {
    view: { rx: -5, ry: 3 },
    act: { iphone: v(P_ACT, { rx: -3, ry: 22, rz: 6, y: -0.2 }), macbook: v(M_ACT, { rx: 5, ry: -28, y: 0.38 }) },
    push: { iphone: v(P_PUSH, { rx: -2, ry: 26, rz: 7 }), macbook: v(M_PUSH, { rx: 4, ry: -12 }) },
  },
  // 5:00 PM · the laptop nearly square, the long light
  {
    view: { rx: 1, ry: -3 },
    act: { iphone: v(P_ACT, { ry: 20, rz: 3 }), macbook: v(M_ACT, { ry: -18, rx: 10 }) },
    push: { iphone: v(P_PUSH, { ry: 24, rz: 3, y: -0.7 }), macbook: v(M_PUSH, { ry: -4, rx: 8 }) },
  },
  // 5:30 PM · the other way: the office is already close on the calendar, the phone waits small
  // in the corner, then swings forward with Monday on it
  {
    view: { rx: 2, ry: -4 },
    act: { iphone: v(P_PUSH, { ry: 26, rz: 2, s: 0.95 }), macbook: v(M_PUSH, { ry: -12, rx: 9 }) },
    push: { iphone: v(P_ACT, { x: -1.1, y: -0.08, z: 1.6, ry: 12, rz: 1, s: 1.38 }), macbook: v(M_ACT, { x: 1.05, ry: -32, z: -1.0, s: 0.92 }) },
  },
  // Friday night · close and warm under the lamp
  {
    view: { rx: 4, ry: 0 },
    act: { iphone: v(P_ACT, { rx: 6, ry: 12, rz: -2 }), macbook: v(M_ACT, { rx: 15, ry: -20 }) },
    push: { iphone: v(P_PUSH, { rx: 8, ry: 18, rz: -3 }), macbook: v(M_PUSH, { rx: 10, ry: -7 }) },
  },
];

/**
 * Before the ride: where the devices wait while "Enjoy the ride" holds, below the fold of One
 * Day's stage, tipped back (the hero parks them the same way, so the scroll from the hero leaves
 * them out of sight), screens already on the first moment's.
 */
const WAIT: { iphone: DevicePose; macbook: DevicePose } = {
  iphone: v(P_ACT, { y: -5.2, z: 0.5, rx: 34 }),
  macbook: v(M_ACT, { y: -5.6, z: -1.3, rx: 42 }),
};

export const dayFrame = () => F;
export const dayPosterFrame = () => F_POSTER;

const centre = (b: Box): [number, number] => [b[0] + b[2] / 2, b[1] + b[3] / 2];

/** The update's ring on the office screen (the row, the number, the block, the column). */
export function updateRing(s: Script): Box {
  const u = s.laptop.update;
  if (u.kind === "insert") return u.row;
  if (u.kind === "tick") return [558, 383, 204, 70];
  if (u.kind === "block") return u.rect;
  const first = u.cells[0];
  return [first[0], first[1], first[2], first[3] * u.cells.length];
}

function focusOf(s: Script): FocusSpec {
  const f = s.laptop.focus;
  return { device: "macbook", px: f.px, zoom: f.zoom, to: f.to };
}

export function ridePoses(R: Ride = RIDE): PoseKey[] {
  const keys: PoseKey[] = [];
  const base = { anchor: "day", frame: F, float: 0, look: 0.35, front: "iphone" as const };

  // the wait, and the hand-off: the devices rise into the first shot as the title fades
  const s0 = SCRIPT[0];
  const wait = {
    ...base,
    view: SHOTS[0].view,
    iphone: { ...WAIT.iphone, screen: s0.phone.before },
    macbook: { ...WAIT.macbook, screen: s0.laptop.before },
    display: { show: 0 },
  };
  keys.push({ ...wait, at: 0, ease: "linear", look: 0 }, { ...wait, at: R.moments[0].start, ease: "linear", look: 0 });

  R.moments.forEach((m, i) => {
    const s = SCRIPT[i];
    const shot = SHOTS[i];
    const up = m.up;
    const ring = updateRing(s);
    const pushView = shot.push.view ?? shot.view;
    const act = shot.act;
    const push = shot.push;
    // office → field: the office is pushed in from the start, the phone comes forward at the end
    const actFocus = up ? null : focusOf(s);
    const pushFocus = up ? focusOf(s) : null;
    const tapPx = up && s.phone.tap ? centre(s.phone.tap) : s.laptop.tap ? centre(s.laptop.tap) : undefined;
    const pulse = (t: number) =>
      up ? { from: "iphone" as const, to: "macbook" as const, t, fromPx: tapPx } : { from: "macbook" as const, to: "iphone" as const, t, fromPx: centre(ring) };
    const hold = (at: number, ease: PoseKey["ease"], o: Partial<PoseKey> & { iphone?: DevicePose; macbook?: DevicePose }) =>
      keys.push({ ...base, view: shot.view, focus: actFocus, ...o, at, ease });

    // ACT: the glide lands (from the last moment's PUSH, or from the wait)
    const before = { iphone: { ...act.iphone, screen: s.phone.before }, macbook: { ...act.macbook, screen: s.laptop.before } };
    hold(m.settle, "inOut", before);
    if (up) {
      // the tap: the phone shows its result
      hold(m.shown, "linear", { iphone: { ...act.iphone, screen: s.phone.after }, macbook: before.macbook });
      // the pulse leaves the button … and lands on the row the office screen is about to change
      hold(m.pulse[0], "linear", { iphone: { ...act.iphone, screen: s.phone.after }, macbook: before.macbook, pulse: pulse(0) });
      const landed = { iphone: { ...act.iphone, screen: s.phone.after }, macbook: { ...act.macbook, screen: s.laptop.after, ring } };
      hold(m.pulse[1], "inOut", { ...landed, pulse: pulse(1) });
      hold(m.push[0], "linear", landed);
      // PUSH: in on the changed spot; then the hold, perfectly still
      const pushed = { iphone: { ...push.iphone, screen: s.phone.after }, macbook: { ...push.macbook, screen: s.laptop.after, ring, dim: 0.1 } };
      hold(m.push[1], "inOut", { ...pushed, view: pushView, focus: pushFocus });
      hold(m.end, "linear", { ...pushed, view: pushView, focus: pushFocus });
    } else {
      // the click on the office's calendar: the block drops in (./rideLife.ts), its ring
      const clicked = { iphone: before.iphone, macbook: { ...act.macbook, screen: s.laptop.after, ring } };
      hold(m.update[1], "linear", clicked);
      hold(m.pulse[0], "linear", { ...clicked, pulse: pulse(0) });
      // the plan lands on the crew's phone …
      const landed = { iphone: { ...act.iphone, screen: s.phone.after }, macbook: clicked.macbook };
      hold(m.pulse[1], "inOut", { ...landed, pulse: pulse(1) });
      // … which swings forward with it
      const pushed = { iphone: { ...push.iphone, screen: s.phone.after }, macbook: { ...push.macbook, screen: s.laptop.after } };
      hold(m.push[1], "inOut", { ...pushed, view: pushView, focus: pushFocus });
      hold(m.end, "linear", { ...pushed, view: pushView, focus: pushFocus });
    }
  });
  return keys;
}

/** For the DOM: the point of the office screen the update card's leader lands on, per moment. */
export const markOf = (i: number) => SCRIPT[i].laptop.mark;
/** The tap point on the acting screen (native px), or null. */
export function tapOf(i: number): { device: "iphone" | "macbook"; px: [number, number] } | null {
  const s = SCRIPT[i];
  if (s.dir === "up" && s.phone.tap) return { device: "iphone", px: centre(s.phone.tap) };
  if (s.dir === "down" && s.laptop.tap) return { device: "macbook", px: centre(s.laptop.tap) };
  return null;
}

/** Phones never load the Stage; their day is ./phone/DayPhone.tsx. */
export const dayHasStage = !isPhone;
