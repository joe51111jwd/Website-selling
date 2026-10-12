// One Day's choreography for the Stage: for every moment, the devices take that moment's shot;
// the phone shows the field action with a ring on what the crew taps; an orange pulse carries it
// to the laptop, which lands on the office result with a ring on the exact row. Office → field
// moments (dir "down") run the other way.
//
// Each moment owns 1/7 of the scene's progress, in beats:
//   0.00 arrive (devices move into the moment's shot, phone shows the field screen + ring)
//   0.28 hold, pulse leaves the sending screen
//   0.58 pulse lands; the receiving screen switches to the result, ring on the row
//   0.76 push-in: the receiving device comes forward (the shot's `land`)
//   0.94 hold until the next moment
// Moments 1–2 have hand-tuned shots; 3–7 cycle through the same two until the Day owner tunes them.

import { MOMENTS, type Moment } from "../../content/moments";
import { phone as isPhone } from "../../three/stage/store";
import type { DevicePose, PoseKey } from "../../three/stage/types";
import { stepAt } from "../scene/Scene";

export const DAY_STEPS = MOMENTS.length;
const RANGE = { start: 0, end: 1 };
export const beat = (i: number, phase: number) => stepAt(i, DAY_STEPS, phase, RANGE);

/** A moment's camera: `macbook`/`iphone` while the field acts, `land` once the pulse lands (the push-in). */
type Shot = {
  frame: [number, number];
  macbook: DevicePose;
  iphone: DevicePose;
  view?: { rx?: number; ry?: number };
  land?: { macbook?: DevicePose; iphone?: DevicePose };
};

// desktop shots: the anchor is the right ~58% of a 100svh stage
const SHOTS: Shot[] = [
  // 6:42 AM: the phone is the hero (the crew's hand), the office laptop waits behind it; when
  // the clock-in lands, the laptop pushes in and the phone steps back
  {
    frame: [5.0, 3.4],
    iphone: { x: -1.3, y: -0.05, z: 1.3, rx: 4, ry: 16, rz: 2, s: 1.32 },
    macbook: { x: 0.8, y: 0.2, z: -0.9, rx: 12, ry: -22, rz: 0, s: 1 },
    land: {
      iphone: { x: -1.75, y: -0.15, z: 0.7, rx: 4, ry: 20, rz: 2, s: 1.1 },
      macbook: { x: 0.3, y: 0.3, z: 0.1, rx: 9, ry: -12, rz: 0, s: 1.1 },
    },
  },
  // 6:55 AM: the camera swings round; laptop on the left facing in, phone right
  {
    frame: [5.0, 3.4],
    iphone: { x: 1.45, y: -0.2, z: 1.1, rx: 3, ry: -20, rz: -2, s: 1.24 },
    macbook: { x: -0.65, y: 0.18, z: -0.7, rx: 14, ry: 26, rz: 0, s: 1 },
    land: {
      iphone: { x: 1.65, y: -0.2, z: 0.6, rx: 3, ry: -24, rz: -2, s: 1.04 },
      macbook: { x: -0.35, y: 0.38, z: 0.1, rx: 9, ry: 14, rz: 0, s: 1.05 },
    },
  },
];

const PHONE_SHOTS: Shot[] = [
  {
    frame: [5.0, 3.2],
    iphone: { x: -1.5, y: -0.05, z: 1.2, rx: 4, ry: 14, rz: 2, s: 1.3 },
    macbook: { x: 0.85, y: 0.15, z: -0.8, rx: 12, ry: -20, s: 1 },
    land: {
      iphone: { x: -1.95, y: -0.15, z: 0.6, rx: 4, ry: 18, rz: 2, s: 1.1 },
      macbook: { x: 0.5, y: 0.18, z: 0.1, rx: 9, ry: -10, s: 1.18 },
    },
  },
  {
    frame: [5.0, 3.2],
    iphone: { x: 1.6, y: -0.15, z: 1.0, rx: 3, ry: -18, rz: -2, s: 1.2 },
    macbook: { x: -0.7, y: 0.15, z: -0.7, rx: 13, ry: 22, s: 1 },
    land: {
      iphone: { x: 1.95, y: -0.25, z: 0.5, rx: 3, ry: -22, rz: -2, s: 1.05 },
      macbook: { x: -0.4, y: 0.18, z: 0.1, rx: 9, ry: 12, s: 1.18 },
    },
  },
];

function shotFor(i: number): Shot {
  const list = isPhone ? PHONE_SHOTS : SHOTS;
  return list[i % list.length];
}

export function dayPoses(): PoseKey[] {
  const keys: PoseKey[] = [];
  MOMENTS.forEach((m: Moment, i) => {
    const shot = shotFor(i);
    const prev = MOMENTS[i - 1];
    const up = m.dir === "up";
    const phoneRing = m.phone.ring ?? null;
    const officeRing = m.office.mark?.b ?? null;
    // before the pulse: the receiving screen still shows the previous result
    const laptopBefore = up ? (prev ? prev.office.id : "web-dashboard") : m.office.id;
    const phoneBefore = up ? m.phone.id : prev ? prev.phone.id : "phone-home";
    const pulseFrom = up ? "iphone" : "macbook";
    const pulseTo = up ? "macbook" : "iphone";
    const base = { anchor: "day", frame: shot.frame, float: 0.35, look: 0.6, view: shot.view ?? { rx: 0, ry: 0 } };

    keys.push({
      ...base,
      at: beat(i, 0),
      ease: "inOut",
      iphone: { ...shot.iphone, screen: phoneBefore, ring: up ? phoneRing : null },
      macbook: { ...shot.macbook, screen: laptopBefore, ring: up ? null : officeRing },
    });
    keys.push({
      ...base,
      at: beat(i, 0.28),
      ease: "linear",
      iphone: { ...shot.iphone, screen: phoneBefore, ring: up ? phoneRing : null },
      macbook: { ...shot.macbook, screen: laptopBefore, ring: up ? null : officeRing },
      pulse: { from: pulseFrom, to: pulseTo, t: 0 },
    });
    keys.push({
      ...base,
      at: beat(i, 0.58),
      ease: "inOut",
      iphone: { ...shot.iphone, screen: m.phone.id, ring: up ? null : phoneRing },
      macbook: { ...shot.macbook, screen: m.office.id, ring: up ? officeRing : null },
      pulse: { from: pulseFrom, to: pulseTo, t: 1 },
    });
    // the push-in: the receiving device comes forward to show the result
    const land = shot.land ?? {};
    keys.push({
      ...base,
      at: beat(i, 0.76),
      ease: "inOut",
      iphone: { ...shot.iphone, ...land.iphone, screen: m.phone.id, ring: up ? null : phoneRing },
      macbook: { ...shot.macbook, ...land.macbook, screen: m.office.id, ring: up ? officeRing : null },
    });
    keys.push({
      ...base,
      at: beat(i, 0.94),
      ease: "linear",
      iphone: { ...shot.iphone, ...land.iphone, screen: m.phone.id, ring: up ? null : phoneRing },
      macbook: { ...shot.macbook, ...land.macbook, screen: m.office.id, ring: up ? officeRing : null },
    });
  });
  return keys;
}
