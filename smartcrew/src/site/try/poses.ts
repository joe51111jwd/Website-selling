// 3 · Try it, choreography: "Pick up the phone" (scratchpad design/v2/scroll/SCROLL_SHOTS.md §1).
// The spec sheet before this scene has already glided the devices out (the laptop past the left
// edge, the phone past the right, src/site/specsheet/SpecSheet.tsx). Out of sight, the iPhone is
// brought round below the frame, lying back like a phone on a truck's dash. As this scene comes up
// it is picked up: it rises out of the bottom of the frame and tilts upright, square to camera,
// centred and large; its screen is off until it is nearly upright, then wakes on "Ready to clock
// in?" (./wake.ts). The laptop stays out (`out: -1`) until it is hidden. While the scene is pinned
// the phone holds that pose (no roll, a little float), so the real <button> drawn over its Clock In
// circle stays exactly on it. As Your number comes up, the phone leaves up with the page and out
// past the right edge. Reduced motion: it is simply upright and awake (it rides in with the page).
//
// Phones (PHONE MODE): no Stage at all; the scene is ./TryPhone.tsx and registers no keys.

import type { PoseKey } from "../../three/stage/types";
import { reducedMotion } from "../../three/stage/store";

/** The frame the phone is fitted into (device units): the phone (0.79 × 1.63) and its caption below. */
export const TRY_FRAME: [number, number] = [1.8, 2.2];

/** Idle float and look-around while pinned (TryDesk replays the float on its buttons). */
export const TRY_FLOAT = 0.3;
export const TRY_LOOK = 0.18;

/** How many screens the scene takes (desktop: a short hold for the tap, 0.2 screen; the phone
 *  demos itself after a few seconds anyway, so the hold needn't be long). */
export const TRY_VIEWPORTS = 1.2;

const phoneAt = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, show: 1, power: 1 };

/** Where it is picked up from: below the frame, lying back 64° (top edge away), a touch smaller. */
const lying = { ...phoneAt, y: -1.5, rx: -64, s: 0.94 };
/** Lifted: up into the bottom of the frame, still lying back (it shows here, screen off). */
const lifted = { ...phoneAt, y: -0.45, rx: -52, s: 0.96 };

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
  const from = reducedMotion ? phoneAt : lying;
  return [
    // out of sight past the right edge (or hidden), where the spec sheet left it: brought round to
    // below the frame while this scene is still more than half a screen down (the anchor, and the
    // phone with it, are below the viewport here)
    { ...first, at: 0, offset: -0.62, ease: "linear", iphone: { ...from, screen: "phone-home", out: 1 } },
    { ...first, at: 0, offset: -0.6, ease: "linear", iphone: { ...from, screen: "phone-home" } },
    // picked up: first lifted into the bottom of the frame, still lying back (that is where it
    // comes into view), then tilted upright as the scene rises: square to camera by the time the
    // scene reaches the top. The screen wakes at ~85 % upright (scene top at 15 % of the viewport,
    // ./wake.ts). Two legs, so the tilt plays on screen rather than below it.
    { ...first, at: 0, offset: -0.38, ease: "out", iphone: { ...(reducedMotion ? phoneAt : lifted), screen: "phone-home" } },
    { ...first, at: 0, offset: -0.02, ease: "inOut" },
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
