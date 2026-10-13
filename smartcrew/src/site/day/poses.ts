// One Day's choreography for the Stage, on the ride's clock (./ride.ts): `at` is ms of the film
// (the Stage evaluates these keys at the player's clock: registerPoses("day", keys, { clock })).
//
// Each moment has two shots:
//  · ACT: the device that acts is big and close (the crew's phone, or the office laptop at
//    5:30 PM), the other waits behind it. The tap lands, its screen shows the result, the orange
//    pulse leaves from the button. Nothing else moves meanwhile.
//  · PUSH: the update has landed; the camera pushes in on the exact spot that changed (Stage
//    `focus`: the laptop scales about that spot) while the phone steps down to the corner, still
//    in front (Stage `front`). Then it holds to be read, never frozen: the shot keeps drifting,
//    slowly (a short dolly, a degree or two of orbit, the push-in creeping on), slow enough that
//    the words stay easy to read. Each moment has its own: a dolly, an orbit round the phone, a
//    track with the load, a rise, the push going on in, the phone turning to face us, a pull back.
// Between moments the devices glide from one moment's PUSH to the next one's ACT (one eased
// move). Before the first, they rise from below the fold (where they waited under the hero).
// After the last, the FINALE eases out to the whole app: the office dashboard and the crew's
// phone, side by side.

import { phone as isPhone } from "../../three/stage/store";
import type { Box, DevicePose, FocusSpec, PoseKey } from "../../three/stage/types";
import { RIDE, type Ride } from "./ride";
import { SCRIPT, type Script } from "./script";

type View = { rx: number; ry: number };
/** A slow move over a hold: [dz dolly, dry turn, drx tilt, dx, dy] per device, the camera's turn, the push-in creeping on. */
type Move = { iphone: Drift; macbook: Drift; view: [number, number]; creep?: number };
type Drift = [number, number, number?, number?, number?];
type Shot = {
  view: View;
  act: { iphone: DevicePose; macbook: DevicePose };
  push: { iphone: DevicePose; macbook: DevicePose; view?: View };
  /** the hold's own camera move (every moment its own shot: a dolly, an orbit, a track, a rise …) */
  move: Move;
};

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
  // 6:42 AM · dawn: it opens close on the phone, the office laptop small and far behind it; the
  // push pulls back and brings the office forward as the clock-in lands. Hold: a slow dolly in.
  {
    view: { rx: 0, ry: 0 },
    act: { iphone: v(P_ACT, { x: -0.7, y: -0.1, z: 1.25, ry: 10, rz: 1, s: 1.5 }), macbook: v(M_ACT, { x: 1.45, y: 0.5, z: -2.6, ry: -30, s: 0.82 }) },
    push: { iphone: P_PUSH, macbook: M_PUSH },
    move: { iphone: [0.14, 1.5], macbook: [0.08, 1], view: [0.6, -0.8], creep: 1.08 },
  },
  // 6:55 AM · the camera a touch lower, the phone upright and leading. Hold: a slow orbit round it.
  {
    view: { rx: -3, ry: 2 },
    act: { iphone: v(P_ACT, { ry: 10, rz: -1, y: -0.05 }), macbook: v(M_ACT, { ry: -30, y: 0.36 }) },
    push: { iphone: v(P_PUSH, { ry: 16, rz: -2 }), macbook: v(M_PUSH, { ry: -6, rx: 5 }) },
    move: { iphone: [0.04, 7, 0], macbook: [0.02, -2.5], view: [0, 3.2], creep: 1.04 },
  },
  // 9:20 AM · high sun, the camera looks down on the haul. Hold: it tracks sideways with the load.
  {
    view: { rx: 6, ry: -2 },
    act: { iphone: v(P_ACT, { rx: 10, ry: 8, rz: -3, z: 1.2 }), macbook: v(M_ACT, { rx: 20, ry: -34, y: 0.2 }) },
    push: { iphone: v(P_PUSH, { rx: 10, ry: 14, rz: -4 }), macbook: v(M_PUSH, { rx: 12, ry: -5 }) },
    move: { iphone: [0.02, 1, 0, -0.16], macbook: [0.02, -1, 0, -0.12], view: [0.3, -2.4], creep: 1.05 },
  },
  // 4:12 PM · low and tilted. Hold: the camera rises a little, looking down into the shop queue.
  {
    view: { rx: -5, ry: 3 },
    act: { iphone: v(P_ACT, { rx: -3, ry: 22, rz: 6, y: -0.2 }), macbook: v(M_ACT, { rx: 5, ry: -28, y: 0.38 }) },
    push: { iphone: v(P_PUSH, { rx: -2, ry: 26, rz: 7 }), macbook: v(M_PUSH, { rx: 4, ry: -12 }) },
    move: { iphone: [0.05, 1, 2.5, 0, 0.08], macbook: [0.03, 0.5, 3, 0, 0.06], view: [2.6, -0.6], creep: 1.06 },
  },
  // 5:00 PM · the payoff: the laptop nearly square in the long light. Hold: the push keeps going
  // in on the profit number.
  {
    view: { rx: 1, ry: -3 },
    act: { iphone: v(P_ACT, { ry: 20, rz: 3 }), macbook: v(M_ACT, { ry: -18, rx: 10 }) },
    push: { iphone: v(P_PUSH, { ry: 24, rz: 3, y: -0.7 }), macbook: v(M_PUSH, { ry: -4, rx: 8 }) },
    move: { iphone: [0.06, 1.5], macbook: [0.04, 0.8], view: [0.5, -0.6], creep: 1.2 },
  },
  // 5:30 PM · the other way: the office is already close on the calendar, the phone waits small
  // in the corner, then swings forward with Monday on it. Hold: the phone turns to face us.
  {
    view: { rx: 2, ry: -4 },
    act: { iphone: v(P_PUSH, { ry: 26, rz: 2, s: 0.95 }), macbook: v(M_PUSH, { ry: -12, rx: 9 }) },
    push: { iphone: v(P_ACT, { x: -1.1, y: -0.08, z: 1.6, ry: 12, rz: 1, s: 1.38 }), macbook: v(M_ACT, { x: 1.05, ry: -32, z: -1.0, s: 0.92 }) },
    move: { iphone: [0.1, -6], macbook: [0.03, 1.5], view: [0.6, -1], creep: 1 },
  },
  // Friday night · close and warm under the lamp. Hold: a slow pull back (the finale follows).
  {
    view: { rx: 4, ry: 0 },
    act: { iphone: v(P_ACT, { rx: 6, ry: 12, rz: -2 }), macbook: v(M_ACT, { rx: 15, ry: -20 }) },
    push: { iphone: v(P_PUSH, { rx: 8, ry: 18, rz: -3 }), macbook: v(M_PUSH, { rx: 10, ry: -7 }) },
    move: { iphone: [-0.08, 2], macbook: [-0.06, 1.2], view: [0.8, -1.2], creep: 1.02 },
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

/** The finale: the whole app, the office dashboard and the crew's phone, a calm three-quarter. */
const FINALE: { iphone: DevicePose; macbook: DevicePose; view: View } = {
  iphone: { x: -1.42, y: -0.32, z: 1.0, rx: 4, ry: 18, rz: 2, s: 1.18, screen: "phone-working" },
  macbook: { x: 0.72, y: 0.18, z: -0.55, rx: 9, ry: -17, rz: 0, s: 1.04, screen: "web-dashboard" },
  view: { rx: 2, ry: -1 },
};

/** A slow drift on a pose over a hold (dolly towards the camera, a little turn, a little track). */
const drift = (p: DevicePose, dz: number, dry = 0, drx = 0, dx = 0, dy = 0): DevicePose => ({
  ...p,
  z: (p.z ?? 0) + dz,
  ry: (p.ry ?? 0) + dry,
  rx: (p.rx ?? 0) + drx,
  x: (p.x ?? 0) + dx,
  y: (p.y ?? 0) + dy,
});
const moved = (p: DevicePose, d: Drift) => drift(p, d[0], d[1], d[2] ?? 0, d[3] ?? 0, d[4] ?? 0);

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

/** The push-in on the changed spot; `k` > 1 creeps on during the hold (in, and a little up). */
function focusOf(s: Script, k = 1): FocusSpec {
  const f = s.laptop.focus;
  return { device: "macbook", px: f.px, zoom: 1 + (f.zoom - 1) * k, to: [f.to[0] - (k - 1) * 0.35, f.to[1] - (k - 1) * 0.45] };
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

    // ACT: the glide lands (from the last moment's PUSH, or from the wait); while the time, the
    // headline and the tap play, the shot eases in a touch (never a frozen frame)
    const before = { iphone: { ...act.iphone, screen: s.phone.before }, macbook: { ...act.macbook, screen: s.laptop.before } };
    hold(m.settle, "inOut", before);
    // how far the ACT shot has crept in by time t (0 at settle … 1 at the push)
    const creep = (t: number) => Math.max(0, Math.min(1, (t - m.settle) / Math.max(1, m.push[0] - m.settle)));
    const actAt = (t: number) => ({ iphone: drift(act.iphone, 0.06 * creep(t), 0.8 * creep(t)), macbook: drift(act.macbook, 0.05 * creep(t), -0.6 * creep(t)) });
    const viewAt = (t: number) => ({ rx: shot.view.rx + 0.4 * creep(t), ry: shot.view.ry - 0.5 * creep(t) });
    if (up) {
      // the tap: the phone shows its result
      let a = actAt(m.shown);
      hold(m.shown, "linear", { view: viewAt(m.shown), iphone: { ...a.iphone, screen: s.phone.after }, macbook: { ...a.macbook, screen: s.laptop.before } });
      // the pulse leaves the button … and lands on the row the office screen is about to change
      a = actAt(m.pulse[0]);
      hold(m.pulse[0], "linear", { view: viewAt(m.pulse[0]), iphone: { ...a.iphone, screen: s.phone.after }, macbook: { ...a.macbook, screen: s.laptop.before }, pulse: pulse(0) });
      a = actAt(m.pulse[1]);
      const landed = { iphone: { ...a.iphone, screen: s.phone.after }, macbook: { ...a.macbook, screen: s.laptop.after, ring } };
      hold(m.pulse[1], "inOut", { ...landed, view: viewAt(m.pulse[1]), pulse: pulse(1) });
      a = actAt(m.push[0]);
      hold(m.push[0], "linear", { view: viewAt(m.push[0]), iphone: { ...a.iphone, screen: s.phone.after }, macbook: { ...a.macbook, screen: s.laptop.after, ring } });
      // PUSH: in on the changed spot; then the hold, drifting slowly (dolly in, a degree or two)
      const pushed = { iphone: { ...push.iphone, screen: s.phone.after }, macbook: { ...push.macbook, screen: s.laptop.after, ring, dim: 0.1 } };
      hold(m.push[1], "inOut", { ...pushed, view: pushView, focus: pushFocus });
      hold(m.end, "linear", {
        iphone: { ...moved(push.iphone, shot.move.iphone), screen: s.phone.after },
        macbook: { ...moved(push.macbook, shot.move.macbook), screen: s.laptop.after, ring, dim: 0.1 },
        view: { rx: pushView.rx + shot.move.view[0], ry: pushView.ry + shot.move.view[1] },
        focus: pushFocus ? focusOf(s, shot.move.creep ?? 1.08) : null,
      });
    } else {
      // the click on the office's calendar: the block drops in (./rideLife.ts), its ring
      let a = actAt(m.update[1]);
      const clicked = { iphone: { ...a.iphone, screen: s.phone.before }, macbook: { ...a.macbook, screen: s.laptop.after, ring } };
      hold(m.update[1], "linear", { ...clicked, view: viewAt(m.update[1]) });
      a = actAt(m.pulse[0]);
      hold(m.pulse[0], "linear", { view: viewAt(m.pulse[0]), iphone: { ...a.iphone, screen: s.phone.before }, macbook: { ...a.macbook, screen: s.laptop.after, ring }, pulse: pulse(0) });
      // the plan lands on the crew's phone …
      a = actAt(m.pulse[1]);
      hold(m.pulse[1], "inOut", { view: viewAt(m.pulse[1]), iphone: { ...a.iphone, screen: s.phone.after }, macbook: { ...a.macbook, screen: s.laptop.after, ring }, pulse: pulse(1) });
      // … which swings forward with it, then drifts
      const pushed = { iphone: { ...push.iphone, screen: s.phone.after }, macbook: { ...push.macbook, screen: s.laptop.after } };
      hold(m.push[1], "inOut", { ...pushed, view: pushView, focus: pushFocus });
      hold(m.end, "linear", {
        iphone: { ...moved(push.iphone, shot.move.iphone), screen: s.phone.after },
        macbook: { ...moved(push.macbook, shot.move.macbook), screen: s.laptop.after },
        view: { rx: pushView.rx + shot.move.view[0], ry: pushView.ry + shot.move.view[1] },
        focus: pushFocus,
      });
    }
  });

  // THE FINALE: ease out to the whole app (the dashboard and the crew's phone), then a slow dolly
  const f = R.finale;
  const wide = { iphone: { ...FINALE.iphone }, macbook: { ...FINALE.macbook } };
  keys.push({ ...base, at: f.settle, ease: "inOut", view: FINALE.view, focus: null, ...wide });
  keys.push({
    ...base,
    at: f.end,
    ease: "linear",
    view: { rx: FINALE.view.rx + 0.8, ry: FINALE.view.ry + 2 },
    focus: null,
    iphone: { ...drift(FINALE.iphone, 0.1, -2), screen: FINALE.iphone.screen },
    macbook: { ...drift(FINALE.macbook, 0.08, 2), screen: FINALE.macbook.screen },
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
