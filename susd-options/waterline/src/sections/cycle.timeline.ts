// The cycle's scroll timeline, in screens of scroll (V). Lap 1 plays slowly enough to read every
// caption; laps 2 and 3 are quicker because the legend (all three phases) stays on screen.
export type Phase = 'intro' | 'up' | 'side' | 'down' | 'close' | 'oxygen';
export type Seg = { phase: Phase; lap: number; a: number; b: number };

const INTRO = 0.3;
const LAP0 = 0.6; // per phase
const LAPN = 0.35; // per phase, laps 2 and 3
const CLOSE = 1.0;
const OXYGEN = 0.6;

const raw: Seg[] = [];
let at = 0;
const push = (phase: Phase, lap: number, d: number) => {
  raw.push({ phase, lap, a: at, b: at + d });
  at += d;
};
push('intro', 0, INTRO);
for (let k = 0; k < 3; k++) {
  const d = k === 0 ? LAP0 : LAPN;
  push('up', k, d);
  push('side', k, d);
  push('down', k, d);
}
push('close', 2, CLOSE);
push('oxygen', 2, OXYGEN);

/** Total scroll travel of the sticky stage: 5.8 screens, so #cycle is 680vh. */
export const CYCLE_TRAVEL = at;
export const SEGS: Seg[] = raw.map((s) => ({ ...s, a: s.a / at, b: s.b / at }));

export const seg = (phase: Phase, lap = 0) => SEGS.find((s) => s.phase === phase && (s.lap === lap || phase === 'close' || phase === 'oxygen' || phase === 'intro'))!;

export function segAt(p: number): Seg {
  for (const s of SEGS) if (p < s.b) return s;
  return SEGS[SEGS.length - 1];
}

/** Progress at the end of lap n (1..3): its Down has drained, the next phase has not begun. */
export const lapEndP = (n: number) => seg('down', Math.min(3, Math.max(1, n)) - 1).b - 0.004;
export const CLOSE_P = seg('close').a;
export const OXYGEN_P = seg('oxygen').a;
