// 3 · Try it, choreography. The scroll from One Day into this scene is the move: the laptop
// glides out past the left edge, turning away (it never just shrinks), while the iPhone turns
// square to camera, centred and large, showing "Ready to clock in?". While the scene is pinned the
// phone holds that pose (no roll, a little float), so the real <button> drawn over its Clock In
// circle stays exactly on it. As Your number comes up, the phone leaves the same way: up with the
// page and out past the right edge, turning.
//
// Phones: no 3D here (the page itself becomes the app); the devices glide up and out of frame as
// the app's sheet rises over them.

import type { PoseKey } from "../../three/stage/types";

/** The frame the phone is fitted into (device units). Width covers the geofence drawn round it. */
export const TRY_FRAME: [number, number] = [1.8, 2.2];

/** Idle float and look-around while pinned (TryDesk replays the float on its buttons). */
export const TRY_FLOAT = 0.3;
export const TRY_LOOK = 0.18;

/** How many screens the scene takes (desktop: a short hold for the tap). */
export const TRY_VIEWPORTS = 1.3;
export const TRY_VIEWPORTS_PHONE = 1.8;

const phoneAt = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 };

/** Scene progress for a point `vh` screens past the end of the pin (the exit runs there). */
const past = (vh: number) => 1 + vh / (TRY_VIEWPORTS - 1);

export function tryPoses(): PoseKey[] {
  return [
    {
      at: 0,
      anchor: "try",
      frame: TRY_FRAME,
      iphone: { ...phoneAt, screen: "phone-home" },
      // the laptop glides out past the left edge, turning (the Stage's `out`), as the phone arrives
      macbook: { s: 0.6, out: -1 },
      float: TRY_FLOAT,
      look: TRY_LOOK,
      view: { rx: 0, ry: 0 },
      light: { key: 1, warm: 0 },
      ease: "inOut",
    },
    // out of frame: now it can go (`out` isn't inherited, so it is restated until hidden)
    { at: 0.2, macbook: { show: 0, out: -1 }, iphone: { ...phoneAt } },
    { at: 1, iphone: { ...phoneAt }, macbook: { show: 0 } },
    // the exit, as Your number comes up: a beat, then up with the page and out past the right edge
    { at: past(0.1), iphone: { ...phoneAt } },
    { at: past(0.6), iphone: { ...phoneAt, out: 1 }, ease: "in" },
    { at: past(0.7), iphone: { show: 0, out: 1 } },
  ];
}

/** Phones: the devices glide out of frame (laptop left, phone right) as the app's sheet rises. */
export function tryPhonePoses(): PoseKey[] {
  return [
    { at: 0, macbook: { out: -1 }, iphone: { out: 1 }, ease: "in" },
    { at: 0.06, macbook: { show: 0, out: -1 }, iphone: { show: 0, out: 1 } },
    { at: 1, macbook: { show: 0 }, iphone: { show: 0 } },
  ];
}
