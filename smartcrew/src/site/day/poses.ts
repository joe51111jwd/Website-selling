// One Day's choreography for the Stage. Every moment has its own shot (camera height, which
// device leads, which side, how close). In each one the sending device shows the action with a
// ring on what the person taps, an orange pulse carries it across, and the receiving device
// lands on the result with a ring on the exact row, then comes forward. Office → field moments
// (5:30 PM) run the other way. Beats are in ./clock.ts (B).

import { MOMENTS, type Moment } from "../../content/moments";
import { phone as isPhone } from "../../three/stage/store";
import type { Box, DevicePose, PoseKey } from "../../three/stage/types";
import { B, DAY_STEPS, beat } from "./clock";
import { PAYROLL_SCREEN, PAYROLL_TOAST_RING, PLAN_SCREEN, PLAN_SHEET_RING } from "./life";

export { DAY_STEPS, beat };

/** A moment's camera: the devices while the sender acts, and `land` once the result is in. */
type Shot = {
  frame: [number, number];
  view: { rx: number; ry: number };
  macbook: DevicePose;
  iphone: DevicePose;
  land: { macbook: DevicePose; iphone: DevicePose };
};

// Desktop: the anchor is the right ~58% of the stage. Frame [5.0, 3.4] for every moment, so the
// devices keep one scale and the moves read as a camera, not as zooms.
const F: [number, number] = [5.0, 3.4];
const SHOTS: Shot[] = [
  // 6:42 AM · eye level. The crew's phone is the hero, the office laptop waits behind it; when
  // the clock-in lands, the laptop comes forward and the phone steps back.
  {
    frame: F,
    view: { rx: 0, ry: 0 },
    iphone: { x: -1.3, y: -0.05, z: 1.3, rx: 4, ry: 16, rz: 2, s: 1.32 },
    macbook: { x: 0.8, y: 0.2, z: -0.9, rx: 12, ry: -22, rz: 0, s: 1 },
    land: {
      iphone: { x: -1.75, y: -0.15, z: 0.7, rx: 4, ry: 20, rz: 2, s: 1.1 },
      macbook: { x: 0.08, y: 0.3, z: 0.05, rx: 9, ry: -12, rz: 0, s: 1.04 },
    },
  },
  // 6:55 AM · the camera swings round: laptop on the left facing in, the driver's phone right.
  {
    frame: F,
    view: { rx: 0, ry: 0 },
    iphone: { x: 1.45, y: -0.2, z: 1.1, rx: 3, ry: -20, rz: -2, s: 1.24 },
    macbook: { x: -0.65, y: 0.18, z: -0.7, rx: 14, ry: 26, rz: 0, s: 1 },
    land: {
      iphone: { x: 1.52, y: -0.2, z: 0.6, rx: 3, ry: -24, rz: -2, s: 1.04 },
      macbook: { x: -0.35, y: 0.38, z: 0.1, rx: 9, ry: 14, rz: 0, s: 1.05 },
    },
  },
  // 9:20 AM · high sun, the camera rises and looks down. The hauling log right in front of you,
  // the laptop far back in profile; the ticket lands and the laptop slides in square.
  {
    frame: F,
    view: { rx: 6, ry: 0 },
    iphone: { x: -0.85, y: -0.06, z: 1.7, rx: 10, ry: 6, rz: -3, s: 1.3 },
    macbook: { x: 0.75, y: -0.3, z: -1.0, rx: 22, ry: -36, rz: 0, s: 0.88 },
    land: {
      iphone: { x: -1.9, y: -0.32, z: 0.5, rx: 8, ry: 16, rz: -3, s: 1.0 },
      macbook: { x: 0.35, y: 0.3, z: 0.1, rx: 15, ry: -8, rz: 0, s: 1.04 },
    },
  },
  // 4:13 PM · low and tilted: the operator's phone low on the left, the shop's queue big on the
  // right, seen from below.
  {
    frame: F,
    view: { rx: -7, ry: 0 },
    iphone: { x: -1.55, y: -0.32, z: 1.3, rx: -4, ry: 22, rz: 7, s: 1.3 },
    macbook: { x: 0.62, y: 0.28, z: -0.25, rx: 4, ry: -30, rz: 0, s: 1.1 },
    land: {
      iphone: { x: -2.0, y: -0.45, z: 0.55, rx: -4, ry: 26, rz: 7, s: 1.04 },
      macbook: { x: 0.12, y: 0.3, z: 0.3, rx: 5, ry: -17, rz: 0, s: 1.16 },
    },
  },
  // 5:00 PM · the laptop takes over: big and nearly square, the job-cost cards; the phone that
  // clocked out steps back, small and low.
  {
    frame: F,
    view: { rx: 0, ry: 0 },
    iphone: { x: -1.75, y: -0.3, z: 1.2, rx: 5, ry: 20, rz: 3, s: 1.15 },
    macbook: { x: 0.45, y: 0.25, z: -0.3, rx: 11, ry: -10, rz: 0, s: 1.12 },
    land: {
      iphone: { x: -2.2, y: -0.68, z: -0.2, rx: 6, ry: 28, rz: 3, s: 0.82 },
      macbook: { x: 0.12, y: 0.4, z: 0.2, rx: 8, ry: -4, rz: 0, s: 1.12 },
    },
  },
  // 5:30 PM · the other way round: the office plans Monday on the laptop (right, turned in);
  // the pulse goes out to the field and the crew's phone swings forward with Monday on it.
  {
    frame: F,
    view: { rx: 2, ry: -4 },
    macbook: { x: 0.55, y: 0.26, z: -0.1, rx: 12, ry: -32, rz: 0, s: 1.08 },
    iphone: { x: -1.5, y: -0.12, z: 0.2, rx: 4, ry: 30, rz: 2, s: 1.0 },
    land: {
      iphone: { x: -1.0, y: -0.06, z: 1.9, rx: 3, ry: 10, rz: 1, s: 1.42 },
      macbook: { x: 0.72, y: 0.36, z: -0.9, rx: 12, ry: -38, rz: 0, s: 0.95 },
    },
  },
  // Friday night · close and warm, under the lamp: the laptop low in the middle, the phone
  // resting on the right; the timecards land and the laptop leans in for the QuickBooks toast.
  {
    frame: F,
    view: { rx: 4, ry: 0 },
    macbook: { x: -0.25, y: 0.02, z: 0, rx: 16, ry: -14, rz: 0, s: 1.15 },
    iphone: { x: 1.6, y: -0.35, z: 1.0, rx: 8, ry: -22, rz: -5, s: 1.15 },
    land: {
      iphone: { x: 1.95, y: -0.55, z: 0.3, rx: 8, ry: -26, rz: -5, s: 0.95 },
      macbook: { x: -0.4, y: 0.3, z: 0.1, rx: 12, ry: -9, rz: 0, s: 1.0 },
    },
  },
];

// Phones (390×664): the stage is the top ~half of the screen. The phone stays large (it's the
// visitor's own medium); the laptop sits smaller behind it and comes forward for results.
const PF: [number, number] = [3.9, 2.8];
const PHONE_SHOTS: Shot[] = [
  {
    frame: PF,
    view: { rx: 0, ry: 0 },
    iphone: { x: -1.2, y: -0.05, z: 1.2, rx: 4, ry: 14, rz: 2, s: 1.45 },
    macbook: { x: 0.6, y: 0.18, z: -0.8, rx: 12, ry: -22, rz: 0, s: 0.8 },
    land: {
      iphone: { x: -1.3, y: -0.15, z: 0.6, rx: 4, ry: 18, rz: 2, s: 1.15 },
      macbook: { x: 0.45, y: 0.25, z: 0.2, rx: 9, ry: -10, rz: 0, s: 0.95 },
    },
  },
  {
    frame: PF,
    view: { rx: 0, ry: 0 },
    iphone: { x: 1.2, y: -0.1, z: 1.1, rx: 3, ry: -16, rz: -2, s: 1.42 },
    macbook: { x: -0.65, y: 0.25, z: -0.7, rx: 13, ry: 22, rz: 0, s: 0.82 },
    land: {
      iphone: { x: 1.35, y: -0.2, z: 0.5, rx: 3, ry: -20, rz: -2, s: 1.12 },
      macbook: { x: -0.3, y: 0.18, z: 0.2, rx: 9, ry: 12, rz: 0, s: 0.92 },
    },
  },
  {
    frame: PF,
    view: { rx: 6, ry: 0 },
    iphone: { x: -0.75, y: -0.08, z: 1.6, rx: 9, ry: 6, rz: -3, s: 1.5 },
    macbook: { x: 0.85, y: -0.1, z: -1.0, rx: 20, ry: -32, rz: 0, s: 0.78 },
    land: {
      iphone: { x: -1.35, y: -0.25, z: 0.5, rx: 8, ry: 14, rz: -3, s: 1.08 },
      macbook: { x: 0.4, y: 0.1, z: 0.2, rx: 14, ry: -7, rz: 0, s: 0.94 },
    },
  },
  {
    frame: PF,
    view: { rx: -3, ry: 0 },
    iphone: { x: -0.95, y: -0.25, z: 1.2, rx: -2, ry: 12, rz: 6, s: 1.42 },
    macbook: { x: 0.6, y: 0.18, z: -0.3, rx: 9, ry: -28, rz: 0, s: 0.85 },
    land: {
      iphone: { x: -1.35, y: -0.4, z: 0.5, rx: -2, ry: 16, rz: 6, s: 1.02 },
      macbook: { x: 0.4, y: 0.1, z: 0.3, rx: 9, ry: -16, rz: 0, s: 0.96 },
    },
  },
  {
    frame: PF,
    view: { rx: 0, ry: 0 },
    iphone: { x: -1.25, y: -0.25, z: 1.1, rx: 5, ry: 18, rz: 3, s: 1.35 },
    macbook: { x: 0.5, y: 0.25, z: -0.3, rx: 11, ry: -10, rz: 0, s: 0.9 },
    land: {
      iphone: { x: -1.4, y: -0.5, z: -0.2, rx: 6, ry: 24, rz: 3, s: 0.88 },
      macbook: { x: 0.3, y: 0.08, z: 0.4, rx: 8, ry: -3, rz: 0, s: 1.04 },
    },
  },
  {
    frame: PF,
    view: { rx: 2, ry: -4 },
    macbook: { x: 0.5, y: 0.25, z: -0.1, rx: 12, ry: -30, rz: 0, s: 0.95 },
    iphone: { x: -1.25, y: -0.1, z: 0.2, rx: 4, ry: 26, rz: 2, s: 1.1 },
    land: {
      iphone: { x: -0.85, y: -0.05, z: 1.6, rx: 3, ry: 8, rz: 1, s: 1.55 },
      macbook: { x: 0.85, y: 0.3, z: -0.8, rx: 12, ry: -36, rz: 0, s: 0.8 },
    },
  },
  {
    frame: PF,
    view: { rx: 4, ry: 0 },
    macbook: { x: -0.3, y: 0.1, z: 0, rx: 16, ry: -12, rz: 0, s: 0.95 },
    iphone: { x: 1.2, y: -0.3, z: 1.0, rx: 8, ry: -20, rz: -5, s: 1.35 },
    land: {
      iphone: { x: 1.38, y: -0.45, z: 0.3, rx: 8, ry: -24, rz: -5, s: 1.02 },
      macbook: { x: -0.3, y: 0.02, z: 0.35, rx: 12, ry: -6, rz: 0, s: 1.04 },
    },
  },
];

export const dayFrame = () => (isPhone ? PF : F);

/** A small dolly during a hold, so the shot breathes instead of stopping dead. */
function drift(p: DevicePose, dz: number): DevicePose {
  return { ...p, z: (p.z ?? 0) + dz };
}

const NUM = ["x", "y", "z", "rx", "ry", "rz", "s"] as const;
/** Halfway between two poses (the camera move's midpoint, where the screens switch). */
function mid(a: DevicePose, b: DevicePose): DevicePose {
  const o: DevicePose = {};
  for (const k of NUM) o[k] = ((a[k] ?? 0) + (b[k] ?? 0)) / 2;
  return o;
}

/** What a moment's screens show at each beat. */
function screensFor(m: Moment, i: number) {
  const prev = MOMENTS[i - 1];
  const up = m.dir === "up";
  const phoneRing: Box | null = m.phone.ring ?? null;
  const officeRing: Box | null = m.office.mark?.b ?? null;
  // before the pulse the receiving screen still shows the previous result (or its idle screen)
  const laptopBefore = up ? (prev ? prev.office.id : "web-dashboard") : m.office.id;
  // 5:30 PM: the crew has clocked out, so the phone waits on its home screen
  const phoneBefore = up ? m.phone.id : "phone-home";
  // the result on the receiving screen; two moments carry a second beat drawn on the screen
  const phoneAfter = m.id === "plan" ? PLAN_SCREEN : m.phone.id;
  const phoneAfterRing = m.id === "plan" ? PLAN_SHEET_RING : phoneRing;
  const laptopPush = m.id === "payroll" ? PAYROLL_SCREEN : m.office.id;
  const laptopPushRing = m.id === "payroll" ? PAYROLL_TOAST_RING : officeRing;
  return { up, phoneRing, officeRing, laptopBefore, phoneBefore, phoneAfter, phoneAfterRing, laptopPush, laptopPushRing };
}

export function dayPoses(): PoseKey[] {
  const shots = isPhone ? PHONE_SHOTS : SHOTS;
  const keys: PoseKey[] = [];
  /** where the previous moment left the devices (its last key) */
  let left: { iphone: DevicePose; macbook: DevicePose; view: { rx: number; ry: number } } | null = null;
  MOMENTS.forEach((m, i) => {
    const shot = shots[i];
    const s = screensFor(m, i);
    const from = s.up ? "iphone" : "macbook";
    const to = s.up ? "macbook" : "iphone";
    const base = { anchor: "day", frame: shot.frame, float: 0.35, look: 0.6, view: shot.view };
    const land = { iphone: { ...shot.iphone, ...shot.land.iphone }, macbook: { ...shot.macbook, ...shot.land.macbook } };

    // the sender acts: field screen + ring (or the office's plan + ring)
    const acting = {
      iphone: { screen: s.phoneBefore, ring: s.up ? s.phoneRing : null },
      macbook: { screen: s.laptopBefore, ring: s.up ? null : s.officeRing },
    };
    // the result is in: the receiving screen switches, ring on the row
    const landed = {
      iphone: { screen: s.up ? m.phone.id : s.phoneAfter, ring: s.up ? null : s.phoneAfterRing },
      macbook: { screen: m.office.id, ring: s.up ? s.officeRing : null },
    };
    // the push-in; on Friday the office screen gets its QuickBooks beat
    const pushed = {
      iphone: landed.iphone,
      macbook: { screen: s.laptopPush, ring: s.up ? s.laptopPushRing : null },
    };

    // the camera move from the previous moment: at its midpoint (the moment boundary, where the
    // time rolls and the copy changes) the screens switch, so the devices arrive already acting
    if (left) {
      keys.push({
        ...base,
        at: beat(i, 0),
        ease: "in",
        view: { rx: (left.view.rx + shot.view.rx) / 2, ry: (left.view.ry + shot.view.ry) / 2 },
        iphone: { ...mid(left.iphone, shot.iphone), ...acting.iphone },
        macbook: { ...mid(left.macbook, shot.macbook), ...acting.macbook },
      });
    }
    keys.push({
      ...base,
      at: beat(i, B.arrive),
      ease: left ? "out" : "inOut",
      iphone: { ...shot.iphone, ...acting.iphone },
      macbook: { ...shot.macbook, ...acting.macbook },
    });
    keys.push({
      ...base,
      at: beat(i, B.send),
      ease: "linear",
      iphone: { ...drift(shot.iphone, 0.06), ...acting.iphone },
      macbook: { ...drift(shot.macbook, 0.06), ...acting.macbook },
      pulse: { from, to, t: 0 },
    });
    keys.push({
      ...base,
      at: beat(i, B.land),
      ease: "inOut",
      iphone: { ...drift(shot.iphone, 0.1), ...landed.iphone },
      macbook: { ...drift(shot.macbook, 0.1), ...landed.macbook },
      pulse: { from, to, t: 1 },
    });
    keys.push({
      ...base,
      at: beat(i, B.push),
      ease: "inOut",
      iphone: { ...land.iphone, ...pushed.iphone },
      macbook: { ...land.macbook, ...pushed.macbook },
    });
    keys.push({
      ...base,
      at: i === DAY_STEPS - 1 ? 1 : beat(i, B.leave),
      ease: "linear",
      iphone: { ...drift(land.iphone, 0.08), ...pushed.iphone },
      macbook: { ...drift(land.macbook, 0.08), ...pushed.macbook },
    });
    left = { iphone: drift(land.iphone, 0.08), macbook: drift(land.macbook, 0.08), view: shot.view };
  });
  return keys;
}
