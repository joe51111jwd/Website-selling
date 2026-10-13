// Pose recipes for scenes that don't use the devices: instead of shrinking away in place, the
// devices leave with a deliberate move (glide + turn out past the edge of the viewport) as the
// scene comes in, and come back the same way. Built on the `out` device field (types.ts):
//
//   out = 0 in place · −1 glided out past the LEFT edge, turned · +1 past the RIGHT edge
//
// `out` is not inherited (like `ring`): every key that doesn't set it means 0. So a device that
// left in one scene glides back in on its own as soon as the next scene's first key poses it.
// See API.md "Round 2 · devices leave, devices return".

import type { DeviceId, PoseKey, Ease } from "./types";

type Side = -1 | 1;

export type ExitOptions = {
  /**
   * When the glide starts and ends, in viewport heights of scroll relative to the moment this
   * scene's top reaches the top of the viewport (negative = before: the scene is still entering
   * from below and the devices are still on screen, riding the scene before). Defaults: exit
   * −0.8 → −0.1, return −0.75 → −0.05.
   */
  start?: number;
  end?: number;
  /**
   * Which way each device goes: −1 left, +1 right. Default for exitKeys: the laptop and the XDR
   * right, the phone left (the usual phone-left / laptop-right composition splits apart). Default
   * for returnKeys: the side of the device's own x in the pose (x < 0 comes in from the left).
   */
  side?: Partial<Record<DeviceId, Side>> | Side;
  /** devices to move (default all three; a device that is already hidden stays hidden) */
  devices?: DeviceId[];
  ease?: Ease;
  /**
   * exitKeys only: the devices are already out when this scene starts (the scene before used
   * exitKeys too): keep them out all the way, no glide. Without it, its first key (which names
   * no device, so out = 0) would bring them back in.
   */
  hold?: boolean;
};

const EXIT_SIDE: Record<DeviceId, Side> = { macbook: 1, iphone: -1, display: 1 };
const ALL: DeviceId[] = ["macbook", "iphone", "display"];

function sideOf(opts: ExitOptions, id: DeviceId, x?: number): Side {
  if (typeof opts.side === "number") return opts.side;
  const s = opts.side?.[id];
  if (s) return s;
  if (x !== undefined && x !== 0) return x < 0 ? -1 : 1;
  return EXIT_SIDE[id];
}

/**
 * Keys for a scene that the devices leave: as the scene comes up from below, the devices (still
 * where the scene before left them) glide and turn out past the edge of the viewport, and stay
 * out (not drawn) through the scene. Pass to <Scene poses={…}> (memoize it).
 */
export function exitKeys(opts: ExitOptions = {}): PoseKey[] {
  const { start = -0.8, end = -0.1, devices = ALL, ease = "in", hold = false } = opts;
  const out = (k: number) => Object.fromEntries(devices.map((id) => [id, { out: sideOf(opts, id) * k }])) as Partial<Record<DeviceId, { out: number }>>;
  if (hold) return [{ at: 0, offset: -1, ease: "linear", ...out(1) }, { at: 1, ease: "linear", ...out(1) }];
  return [
    // a key that names no device: everything holds as it was (out = 0)
    { at: 0, offset: start, ease: "linear" },
    { at: 0, offset: end, ease, ...out(1) },
    { at: 1, ease: "linear", ...out(1) },
  ];
}

/**
 * Keys for the start of a scene the devices come back to: as the scene comes up, they glide in
 * from off-screen into `pose` (your scene's first real key: anchor, frame, device poses,
 * screens). Add your own keys after it (at > 0).
 *
 * Because `out` isn't inherited, any scene whose first key poses the devices brings them back
 * from wherever they went anyway; this makes the entrance deliberate (which side, when).
 */
export function returnKeys(pose: Omit<PoseKey, "at">, opts: ExitOptions = {}): PoseKey[] {
  const { start = -0.75, end = -0.05, devices = ALL, ease = "out" } = opts;
  const named = devices.filter((id) => pose[id]);
  const outAt = Object.fromEntries(named.map((id) => [id, { ...pose[id], out: sideOf(opts, id, pose[id]?.x) }]));
  return [
    { ...pose, at: 0, offset: start, ease: "linear", ...outAt },
    { ...pose, at: 0, offset: end, ease },
  ];
}
