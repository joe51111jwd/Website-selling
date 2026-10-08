// The brief's four easings (§6) and clamped interpolation helpers.
// Every animated value in the film is a pure function of time t (seconds) = frame / fps.
import { Easing, interpolate } from 'remotion';

export const DRAW = Easing.bezier(0.65, 0, 0.35, 1);
export const SETTLE = Easing.bezier(0.16, 1, 0.3, 1);
export const LINEAR = (x: number) => x;

/** TICK: steps(4) over its window. */
export const TICK = (x: number) => Math.min(1, Math.floor(x * 4 + 1e-9) / 4);

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0..1 progress of t through [a, b], eased. */
export const prog = (t: number, a: number, b: number, easing: (x: number) => number = LINEAR) =>
  interpolate(t, [a, b], [0, 1], { ...CLAMP, easing });

/** Clamped linear map with optional easing. */
export const lerpT = (
  t: number,
  input: [number, number],
  output: [number, number],
  easing: (x: number) => number = LINEAR,
) => interpolate(t, input, output, { ...CLAMP, easing });

export const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/** Fade in over [a, a+d] and out over [b-d2, b]. */
export const window01 = (t: number, a: number, inDur: number, b: number, outDur: number) =>
  Math.min(prog(t, a, a + inDur), 1 - prog(t, b - outDur, b));

/** Print-in: opacity only, 200 ms (brief §3.2/§6). */
export const printIn = (t: number, at: number) => prog(t, at, at + 0.2);
