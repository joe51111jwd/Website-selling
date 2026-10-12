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
  /** scene progress where the glide starts (default 0: as the scene's top reaches the top of the viewport) */
  from?: number;
  /** scene progress where the devices are fully out (default 0.35) */
  to?: number;
  /** which way each device leaves (default: the laptop left, the phone right, the XDR left) */
  side?: Partial<Record<DeviceId, Side>> | Side;
  /** devices to move (default all three; a device that is already hidden stays hidden) */
  devices?: DeviceId[];
  ease?: Ease;
};

const DEFAULT_SIDE: Record<DeviceId, Side> = { macbook: -1, iphone: 1, display: -1 };
const ALL: DeviceId[] = ["macbook", "iphone", "display"];

function sideOf(opts: ExitOptions, id: DeviceId): Side {
  if (typeof opts.side === "number") return opts.side;
  return opts.side?.[id] ?? DEFAULT_SIDE[id];
}

/**
 * Keys for a scene that the devices leave: they hold where the previous scene left them at
 * `from`, glide and turn out of the viewport by `to`, and stay out (not drawn) until the scene
 * ends. Pass to <Scene poses={…}> (memoize it). For a scene that should begin with the devices
 * already gone, use `from: 0, to: 0.001`.
 */
export function exitKeys(opts: ExitOptions = {}): PoseKey[] {
  const { from = 0, to = 0.35, devices = ALL, ease = "in" } = opts;
  const out = (k: number) => Object.fromEntries(devices.map((id) => [id, { out: sideOf(opts, id) * k }])) as Partial<Record<DeviceId, { out: number }>>;
  return [
    // a key that names no device: everything holds as it was (out = 0)
    { at: from, ease: "linear" },
    { at: to, ease, ...out(1) },
    { at: 1, ease: "linear", ...out(1) },
  ];
}

/**
 * Keys for the start of a scene the devices come back to: they glide in from off-screen (the
 * side they left by) into `pose` between `from` and `to`. `pose` is your scene's first real key
 * (anchor, frame, device poses, screens); everything after `to` is yours.
 *
 * Because `out` isn't inherited, any scene whose first key poses the devices already brings them
 * back from wherever they went; this helper only makes the entrance explicit (which side, how
 * long) and keeps the devices out until `from`.
 */
export function returnKeys(pose: Omit<PoseKey, "at">, opts: ExitOptions = {}): PoseKey[] {
  const { from = 0, to = 0.3, devices = ALL, ease = "out" } = opts;
  const named = devices.filter((id) => pose[id]);
  const outAt = Object.fromEntries(named.map((id) => [id, { ...pose[id], out: sideOf(opts, id) }]));
  return [
    { ...pose, at: from, ease: "linear", ...outAt },
    { ...pose, at: to, ease },
  ];
}
