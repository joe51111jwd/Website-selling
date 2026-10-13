// The fence round the crew phone's Clock In button (6:42 AM, phone-home), in the phone screen's
// native px (402 × 874). Desktop: the hero's fence flies onto it, projected onto the 3D iPhone
// (./handoff.ts). Phones: a small CSS copy closes round the PhoneFrame's button just before the
// tap (./phone/DayPhone.tsx). Same hexagon, same six stakes as the hero's fence (no DOM here).

import { hexFence, type Pt } from "../hero/fence/geom";
import { SCRIPT } from "./script";

type Box = [x: number, y: number, w: number, h: number];

/** The Clock In button (round) on the 6:42 AM phone screen. */
export const CLOCK_IN: Box = SCRIPT[0].phone.tap ?? [118.5, 383.3, 165, 165];

/** Six stakes round it: left point, top-left, top-right, right point, bottom-right, bottom-left. */
export const CLOCK_IN_FENCE: Pt[] = hexFence(
  { x0: CLOCK_IN[0], y0: CLOCK_IN[1], x1: CLOCK_IN[0] + CLOCK_IN[2], y1: CLOCK_IN[1] + CLOCK_IN[3] },
  { clear: [18, 20], point: 38, inset: 14, jitter: 0.8 },
);

/** Its bounding box with `pad` native px round it (for an overlay sized to it). */
export function fenceBox(pad = 6): Box {
  const xs = CLOCK_IN_FENCE.map((p) => p[0]);
  const ys = CLOCK_IN_FENCE.map((p) => p[1]);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return [x, y, Math.max(...xs) + pad - x, Math.max(...ys) + pad - y];
}
