// 3 · Try it, choreography. The spec sheet before this scene has already glided the devices out
// (laptop past the left edge, phone past the right, src/site/specsheet/SpecSheet.tsx). The scroll
// from the spec sheet into this scene brings the iPhone back alone: it glides in from the right,
// turning square to camera, centred and large, showing "Ready to clock in?"; the laptop stays out
// (`out: -1`) until it is hidden. While the scene is pinned the phone holds that pose (no roll, a
// little float), so the real <button> drawn over its Clock In circle stays exactly on it. As Your
// number comes up, the phone leaves the way it came: up with the page and out past the right edge.
//
// Phones (PHONE MODE): no Stage at all; the scene is ./TryPhone.tsx and registers no keys.

import type { PoseKey } from "../../three/stage/types";
import { returnKeys } from "../../three/stage/recipes";

/** The frame the phone is fitted into (device units). Width covers the geofence drawn round it. */
export const TRY_FRAME: [number, number] = [1.8, 2.2];

/** Idle float and look-around while pinned (TryDesk replays the float on its buttons). */
export const TRY_FLOAT = 0.3;
export const TRY_LOOK = 0.18;

/** How many screens the scene takes (desktop: a short hold for the tap, 0.2 screen; the phone
 *  demos itself after a few seconds anyway, so the hold needn't be long). */
export const TRY_VIEWPORTS = 1.2;

const phoneAt = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 };

/** Scene progress for a point `vh` screens past the end of the pin (the exit runs there). */
const past = (vh: number) => 1 + vh / (TRY_VIEWPORTS - 1);

export function tryPoses(): PoseKey[] {
  const first: Omit<PoseKey, "at"> = {
    anchor: "try",
    frame: TRY_FRAME,
    iphone: { ...phoneAt, screen: "phone-home" },
    // the laptop stays out past the left edge (the Stage's `out`), where the spec sheet sent it
    macbook: { s: 0.6, out: -1 },
    float: TRY_FLOAT,
    look: TRY_LOOK,
    view: { rx: 0, ry: 0 },
    light: { key: 1, warm: 0 },
  };
  return [
    // the phone comes back from the right as this scene rises (riding its anchor up from below),
    // square to camera by the time the scene reaches the top
    ...returnKeys(first, { side: 1, start: -0.6, end: -0.02, devices: ["iphone"] }),
    { ...first, at: 0, ease: "inOut" },
    // out of frame: now it can go (`out` isn't inherited, so it is restated until hidden)
    { at: 0.2, macbook: { show: 0, out: -1 }, iphone: { ...phoneAt } },
    { at: 1, iphone: { ...phoneAt }, macbook: { show: 0 } },
    // the exit, as Your number comes up: a beat, then up with the page and out past the right edge
    { at: past(0.1), iphone: { ...phoneAt } },
    { at: past(0.6), iphone: { ...phoneAt, out: 1 }, ease: "in" },
    { at: past(0.7), iphone: { show: 0, out: 1 } },
  ];
}
