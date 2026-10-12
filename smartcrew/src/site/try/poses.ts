// 3 · Try it, desktop choreography. The scroll from One Day into this scene is the move: the
// laptop shrinks away and the iPhone turns square to camera, centred and large, showing "Ready to
// clock in?". While the scene is pinned the phone holds that pose (no roll, a little float), so
// the real <button> drawn over its Clock In circle stays exactly on it.

import type { PoseKey } from "../../three/stage/types";

/** The frame the phone is fitted into (device units). Width covers the geofence drawn round it. */
export const TRY_FRAME: [number, number] = [1.8, 2.2];

/** Idle float and look-around while pinned (TryDesk replays the float on its buttons). */
export const TRY_FLOAT = 0.3;
export const TRY_LOOK = 0.18;

const phoneAt = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 };

export function tryPoses(): PoseKey[] {
  return [
    {
      at: 0,
      anchor: "try",
      frame: TRY_FRAME,
      iphone: { ...phoneAt, screen: "phone-home" },
      macbook: { show: 0 },
      float: TRY_FLOAT,
      look: TRY_LOOK,
      view: { rx: 0, ry: 0 },
      light: { key: 1, warm: 0 },
      ease: "inOut",
    },
    { at: 1, anchor: "try", frame: TRY_FRAME, iphone: { ...phoneAt }, macbook: { show: 0 }, float: TRY_FLOAT, look: TRY_LOOK },
  ];
}
