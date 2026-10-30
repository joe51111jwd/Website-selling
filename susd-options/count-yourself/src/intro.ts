import { getState, setN, setState } from './state/store';
import { drum } from './state/drum';
import { fontsReady } from './motion/timeline';
import { addTick } from './motion/loop';
import { clamp, easeInQuad } from './motion/ease';

let running: { final: number; stop: () => void } | null = null;
let finalN = 8;

/** A beat: the drum lands on n at time t (ms), after rolling for d ms. */
type Beat = { t: number; n: number; d: number };

/**
 * The count as a list of beats: 01 while the question settles; 1 → 15 from 150 ms, each step from 150 ms
 * down to 60 ms (easeInQuad, scaled to 1.05 s); a 580 ms hold at 15 while the oxblood floods and the
 * stamp ("Past twelve, something breaks.") is read; then 15 → n, where the two Threshold steps (14, 13)
 * get a full beat each so the ochre registers, and the rest run quickly. About 2.15 s in all, so the
 * verdict and paths are in well before 3 s (the claim is in from the start).
 */
function beats(final: number): { list: Beat[]; end: number } {
  const list: Beat[] = [];
  const steps = 14;
  const raw = Array.from({ length: steps }, (_, i) => 150 - 90 * easeInQuad(i / (steps - 1)));
  const scale = 1050 / raw.reduce((a, b) => a + b, 0);
  let t = 150;
  for (let i = 0; i < steps; i++) {
    const gap = raw[i] * scale;
    t += gap;
    list.push({ t, n: i + 2, d: Math.min(90, gap * 0.72) });
  }
  t += 580;
  const dir = final >= 15 ? 1 : -1;
  for (let k = 15 + dir; dir < 0 ? k >= final : k <= final; k += dir) {
    const gap = k === 14 || k === 13 ? 82 : 42;
    t += gap;
    list.push({ t, n: k, d: gap * 0.74 });
  }
  return { list, end: t + 30 };
}

const smooth = (p: number) => p * p * (3 - 2 * p);

/** The drum's position at time v, and the number it is rolling toward. */
function at(list: Beat[], v: number): { x: number; to: number } {
  let x = 1;
  for (const b of list) {
    if (v >= b.t) {
      x = b.n;
      continue;
    }
    const s = b.t - b.d;
    if (v > s) return { x: x + (b.n - x) * smooth((v - s) / b.d), to: b.n };
    return { x, to: x };
  }
  return { x, to: x };
}

/**
 * Plays the intro. The drum is driven directly by a clock; the page (colour, stamp, ruler mark,
 * pathways, verdict) follows the integer the drum is actually showing, so they never disagree.
 * The clock absorbs stalls (the loop caps each frame at 50 ms), so a busy device plays every beat
 * a little late instead of skipping 13 and 15. A stall of more than 600 ms (a device that cannot
 * animate this now) ends the count at once on the visitor's number, so the page is never late.
 */
export async function playIntro(final: number) {
  finalN = final;
  let aborted = false;
  running = { final, stop: () => (aborted = true) };
  const offSkip = armSkip();
  await fontsReady(1200);
  if (aborted) return;

  const { list, end } = beats(final);
  drum.scripted = true;
  drum.n.jump(1);
  setN(1, 'intro');
  setState({ phase: 'intro' });

  let virt = 0;
  let t0 = 0;
  let last = 0;
  let cut = false;
  const off = addTick((dt, now) => {
    if (aborted) return false;
    if (!t0) t0 = last = now - dt * 1000;
    // Ordinary slow frames advance the clock in full; only a stall (one frame over 150 ms) is absorbed.
    virt += Math.min(now - last, 150);
    last = now;
    if (now - t0 - virt > 600) {
      virt = end;
      cut = true;
    }
    const { x, to } = at(list, Math.min(virt, end));
    drum.n.v = dt > 0 ? (x - drum.n.x) / dt : 0;
    drum.n.x = x;
    drum.n.target = to;
    const shown = clamp(Math.round(x), 1, 40);
    if (shown !== getState().n) setN(shown, 'intro');
    const stamp = shown >= 13;
    if (getState().stamp !== stamp) setState({ stamp });
    if (virt >= end) {
      done();
      return false;
    }
    return true;
  }, true);

  function done() {
    off();
    offSkip();
    running = null;
    drum.scripted = false;
    drum.n.jump(final);
    setN(final, 'intro');
    // Cut short by a stall: the verdict, claim and paths appear at once, with no entrance.
    if (cut) {
      document.documentElement.classList.add('no-entrance');
      window.setTimeout(() => document.documentElement.classList.remove('no-entrance'), 120);
    }
    setState({ phase: 'ready', stamp: false, caret: getState().caret + 1 });
  }
  running.stop = () => {
    aborted = true;
    off();
    offSkip();
  };
}

/** Ends the intro at once (any input). Returns true if an intro was running. */
export function skipIntro(): boolean {
  if (!running) return false;
  running.stop();
  running = null;
  drum.scripted = false;
  drum.n.target = finalN;
  setN(finalN, 'skip');
  setState({ phase: 'ready', stamp: false });
  return true;
}

function armSkip() {
  const opts = { capture: true, passive: true } as const;
  const onInput = (e: Event) => {
    if (e.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta'].includes((e as KeyboardEvent).key)) return;
    skipIntro();
  };
  const types = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
  types.forEach((t) => window.addEventListener(t, onInput, opts));
  return () => types.forEach((t) => window.removeEventListener(t, onInput, opts));
}
