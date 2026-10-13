// One Day's choreography for the Stage, built from ./script.ts on the beats in ./clock.ts.
//
// Each moment has two shots:
//  · ACT: the device that acts is big and close (the crew's phone, or the office laptop at
//    5:30 PM), the other waits behind it. Its screen shows the button, ringed; the tap lands; the
//    screen changes state; the orange pulse leaves from the button.
//  · PUSH: the pulse lands, the office screen updates, and the camera pushes in on the exact
//    spot that changed (Stage `focus`: the laptop scales about that spot and carries it into the
//    stage) while the phone steps down to the corner, still in front (Stage `front`).
// Between moments the devices travel from one moment's PUSH to the next one's ACT (the time
// rolls and the headline swaps half way). During holds every pose keeps drifting a little.

import { MOMENTS } from "../../content/moments";
import { phone as isPhone, reducedMotion } from "../../three/stage/store";
import type { Box, DevicePose, FocusSpec, PoseKey } from "../../three/stage/types";
import { B, DAY_STEPS, beat } from "./clock";
import { SCRIPT, type Script } from "./script";
import { HO_DOCK_OFFSET } from "./handoff";

export { DAY_STEPS, beat };

type View = { rx: number; ry: number };
type Shot = { view: View; act: { iphone: DevicePose; macbook: DevicePose }; push: { iphone: DevicePose; macbook: DevicePose; view?: View } };

// Desktop: the stage is the right ~60% of the screen, header to bottom. One frame for every
// moment so the moves read as one camera. It is a touch wider than the 1440×660 stage box needs
// (there the height decides the fit): on narrower laptops (1280×600, 1366×768) the width decides
// it, so the devices step down a few % and the pushed-in laptop keeps clear of the copy column.
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

// Phones (390×664): the stage is the band between the headline and the rail; the update card
// takes its bottom ~40%. While the phone acts it is big and central; when the update lands both
// devices rise into the top of the band and the laptop comes forward (the card does the reading).
const PF: [number, number] = [3.9, 4.1];
const PP_ACT: DevicePose = { x: -0.62, y: 0.2, z: 0.8, rx: 3, ry: 12, rz: 2, s: 1.95 };
const PM_ACT: DevicePose = { x: 1.15, y: 0.5, z: -0.8, rx: 12, ry: -22, rz: 0, s: 0.72 };
const PP_PUSH: DevicePose = { x: -1.05, y: 0.52, z: 0.9, rx: 4, ry: 18, rz: 3, s: 1.38 };
const PM_PUSH: DevicePose = { x: 0.62, y: 0.6, z: -0.2, rx: 8, ry: -10, rz: 0, s: 0.86 };

const PHONE_SHOTS: Shot[] = SHOTS.map((s, i) =>
  i === 5
    ? { view: s.view, act: { iphone: v(PP_PUSH, { s: 1.3 }), macbook: v(PM_PUSH, { s: 0.95 }) }, push: { iphone: v(PP_ACT, { y: 0.5, s: 1.6 }), macbook: v(PM_ACT, { y: 0.8, s: 0.62 }) } }
    : {
        view: { rx: s.view.rx * 0.6, ry: s.view.ry * 0.6 },
        act: { iphone: v(PP_ACT, { rx: s.act.iphone.rx, rz: s.act.iphone.rz }), macbook: PM_ACT },
        push: { iphone: v(PP_PUSH, { rz: s.push.iphone.rz }), macbook: PM_PUSH },
      },
);

export const dayFrame = () => (isPhone ? PF : F);
export const dayPosterFrame = () => (isPhone ? PF : F_POSTER);

/** A small dolly during a hold, so the shot breathes instead of stopping dead. */
const drift = (p: DevicePose, dz: number, dry = 0): DevicePose => ({ ...p, z: (p.z ?? 0) + dz, ry: (p.ry ?? 0) + dry });

const NUM = ["x", "y", "z", "rx", "ry", "rz", "s"] as const;
const mid = (a: DevicePose, b: DevicePose): DevicePose => {
  const o: DevicePose = {};
  for (const k of NUM) o[k] = ((a[k] ?? 0) + (b[k] ?? 0)) / 2;
  return o;
};

const centre = (b: Box): [number, number] => [b[0] + b[2] / 2, b[1] + b[3] / 2];

/** The update's ring on the office screen (the row, the number, the block, the column). */
function updateRing(s: Script): Box {
  const u = s.laptop.update;
  if (u.kind === "insert") return u.row;
  if (u.kind === "tick") return [558, 383, 204, 70];
  if (u.kind === "block") return u.rect;
  const first = u.cells[0];
  return [first[0], first[1], first[2], first[3] * u.cells.length];
}

function focusOf(s: Script, k = 1): FocusSpec {
  const f = s.laptop.focus;
  const zoom = isPhone ? Math.min(1.3, f.zoom) : f.zoom;
  const to: [number, number] = isPhone ? [0.72, 0.34] : f.to;
  // during the hold the camera keeps creeping in (k > 1), across and up
  return { device: "macbook", px: f.px, zoom: 1 + (zoom - 1) * k, to: [to[0] - (k - 1) * 0.5, to[1] - (k - 1) * 0.6] };
}

export function dayPoses(): PoseKey[] {
  const shots = isPhone ? PHONE_SHOTS : SHOTS;
  const keys: PoseKey[] = [];
  let left: { iphone: DevicePose; macbook: DevicePose; view: View } | null = null;

  MOMENTS.forEach((_, i) => {
    const s = SCRIPT[i];
    const shot = shots[i];
    const up = s.dir === "up";
    const ring = updateRing(s);
    const base = { anchor: "day", frame: isPhone ? PF : F, float: 0.35, look: 0.6, front: "iphone" as const };
    const at = (ph: number) => beat(i, ph);
    const pushView = shot.push.view ?? shot.view;

    // screens + rings at each beat (desktop, 6:42 AM: the hero's fence is the ring round the
    // button: it flies there from the words, ./handoff.ts)
    const fenced = i === 0 && !isPhone && !reducedMotion;
    const phoneTapRing = up && s.phone.tap && !fenced ? s.phone.tap : null;
    const before = { iphone: { screen: s.phone.before }, macbook: { screen: s.laptop.before } };
    const shown = up
      ? { iphone: { screen: s.phone.after }, macbook: { screen: s.laptop.before } }
      : { iphone: { screen: s.phone.before }, macbook: { screen: s.laptop.after } };
    const landed = { iphone: { screen: s.phone.after }, macbook: { screen: s.laptop.after } };
    // the pulse leaves from the button that was tapped (its ring is gone by then)
    const tapPx = up && s.phone.tap ? centre(s.phone.tap) : s.laptop.tap ? centre(s.laptop.tap) : undefined;
    const pulse = (t: number) =>
      up ? { from: "iphone" as const, to: "macbook" as const, t, fromPx: tapPx } : { from: "macbook" as const, to: "iphone" as const, t, fromPx: tapPx };

    const act = shot.act;
    const push = shot.push;
    // office → field: the office is pushed in from the start, the phone comes forward at the end
    const actFocus = up ? null : focusOf(s);
    const pushFocus = up ? focusOf(s) : null;

    if (left) {
      keys.push({
        ...base,
        at: at(0),
        ease: "in",
        view: { rx: (left.view.rx + shot.view.rx) / 2, ry: (left.view.ry + shot.view.ry) / 2 },
        iphone: { ...mid(left.iphone, act.iphone), ...before.iphone },
        macbook: { ...mid(left.macbook, act.macbook), ...before.macbook },
        focus: actFocus ? focusOf(s, 0.5) : null,
      });
    }
    // the hand-off from the hero (desktop): the devices rise from the hero's park pose into this
    // first shot while the hero scrolls away, DOCKED (fitted into One Day's stage box where it
    // will stick, though the scene is still coming up from below), so they arrive and hold still
    // on screen by hero progress 0.7, when the fence lands on the phone's button, and One Day's
    // copy rises into place beside them. Once the scene sticks, docked and undocked are the same.
    if (i === 0 && !isPhone) {
      const shot0 = {
        ...base,
        view: shot.view,
        iphone: { ...act.iphone, ...before.iphone },
        macbook: { ...act.macbook, ...before.macbook },
        focus: null,
        dock: true,
      };
      keys.push({ ...shot0, at: 0, offset: HO_DOCK_OFFSET, ease: "inOut" }, { ...shot0, at: 0, ease: "linear" });
    }
    // ACT: settled, the button ringed. The very first one is the move from the hero: on phones it
    // is linear, so the devices glide straight from the hero's spot to this one (an eased blend
    // first rides up with the hero, then drops back down behind its CTA and copy)
    keys.push({
      ...base,
      at: at(B.arrive),
      ease: left ? "out" : isPhone ? "linear" : "inOut",
      view: shot.view,
      iphone: { ...act.iphone, ...before.iphone, ring: phoneTapRing },
      macbook: { ...act.macbook, ...before.macbook, ring: up ? null : s.laptop.tap ?? null },
      focus: actFocus,
    });
    // the tap lands; a beat later the acting screen shows the result
    keys.push({
      ...base,
      at: at(B.shown),
      ease: "linear",
      view: shot.view,
      iphone: { ...drift(act.iphone, 0.03, 0.6), ...shown.iphone, ring: null },
      macbook: { ...drift(act.macbook, 0.02), ...shown.macbook, ring: up ? null : ring },
      focus: actFocus,
    });
    // the pulse leaves the button …
    keys.push({
      ...base,
      at: at(B.send),
      ease: "linear",
      view: shot.view,
      iphone: { ...drift(act.iphone, 0.05, 1), ...shown.iphone, ring: null },
      macbook: { ...drift(act.macbook, 0.04), ...shown.macbook, ring: up ? null : ring },
      pulse: pulse(0),
      focus: actFocus,
    });
    // … and lands on the row the office screen is about to change
    keys.push({
      ...base,
      at: at(B.land),
      ease: "inOut",
      view: shot.view,
      iphone: { ...drift(act.iphone, 0.1, 2), ...landed.iphone, ring: null },
      macbook: { ...drift(act.macbook, 0.1, 1), ...landed.macbook, ring: up ? ring : null },
      pulse: pulse(1),
      focus: actFocus,
    });
    // PUSH: in on the changed spot
    keys.push({
      ...base,
      at: at(B.push),
      ease: "inOut",
      view: pushView,
      iphone: { ...push.iphone, ...landed.iphone },
      macbook: { ...push.macbook, ...landed.macbook, ring: up ? ring : null, dim: 0.1 },
      focus: pushFocus,
    });
    // hold, still drifting
    const last = i === DAY_STEPS - 1;
    const hold = { iphone: drift(push.iphone, 0.12, 2), macbook: drift(push.macbook, 0.06, 1.5) };
    keys.push({
      ...base,
      at: last ? 1 : at(B.leave),
      ease: "linear",
      view: { rx: pushView.rx + 0.6, ry: pushView.ry - 0.8 },
      iphone: { ...hold.iphone, ...landed.iphone },
      macbook: { ...hold.macbook, ...landed.macbook, ring: up ? ring : null, dim: 0.1 },
      focus: pushFocus ? focusOf(s, 1.1) : null,
    });
    left = { ...hold, view: pushView };
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
