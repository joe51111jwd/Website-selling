// The book page's scroll, as a list of moments. Each has a length in screen heights (100 = one screen of
// scrolling). The page pins one stage for the whole list and asks, on every frame, how far through each
// moment the scroll is; nothing here touches the DOM, so it can be checked without a browser.
//
// The order is the book's own: the closed hardcover, opened; the problem (two spreads); the title, turned
// upside down and set right; the cycle, Up then Side then Down (Michael, 23 Nov: "Up for Growth should go
// first? then Sidways for stabilzation? the Down for Pruning?"); the twelve systems; closed again, beside
// the one sign-up.
export const SEGMENTS = [
  ["hero", 90], // the closed book and the one button. Long on purpose: a fast scroll must not skip it (Michael, 13 Nov)
  ["approach", 60], // the book turns to face the reader and comes up to reading size
  ["open", 70], // the cover opens
  ["s0", 40], // who the book is for
  ["t1", 55],
  ["s1", 100], // revenue up, margins down
  ["t2", 55],
  ["s2", 110], // past twelve people
  ["t3", 55],
  ["s3a", 30], // "That isn't scaling."
  ["flip", 70], // the book is turned upside down
  ["s3b", 45], // "That's scaling upside down."
  ["unflip", 45], // and set right
  ["t4", 55],
  ["s4", 110], // the cycle
  ["t5", 55],
  ["s5", 100], // the twelve systems
  ["close", 90], // the book closes and steps aside
  ["end", 60], // the sign-up
] as const;

export type Seg = (typeof SEGMENTS)[number][0];

const START = {} as Record<Seg, number>;
const LEN = {} as Record<Seg, number>;
let sum = 0;
for (const [name, len] of SEGMENTS) {
  START[name] = sum;
  LEN[name] = len;
  sum += len;
}
/** the whole scroll, in screen-height hundredths */
export const TOTAL = sum;
export const startOf = (s: Seg) => START[s];

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** t mapped from [a, b] onto [0, 1], held at the ends */
export const remap = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** the leaves that turn (the cover is not one of them) */
export const LEAVES = 5;
const HOLD: Seg[] = ["s1", "s2", "s3a", "s4", "s5"];
const TURN: Seg[] = ["t1", "t2", "t3", "t4", "t5"];

export type Film = {
  /** 0 on the hero, 1 once the book faces the reader */
  approach: number;
  /** 0 closed, 1 open flat */
  cover: number;
  /** each leaf: 0 on the right, 1 turned to the left */
  leaf: number[];
  /** the whole book's turn in its own plane, degrees (0, 180 upside down, 360 right again) */
  spin: number;
  /** 0 until the book closes at the end, 1 closed and aside */
  close: number;
  /** which page the picture centres on: 1 the right page (or the closed cover), -1 the left, 0 the gutter */
  pan: number;
  /** the hero's words and the sign-up: 0 hidden, 1 shown */
  hero: number;
  end: number;
  /** the diagrams: how far each has drawn, and which year the second one shows (0-3) */
  c1: number;
  year: number;
  c4: number;
  c5: number;
};

/**
 * Where everything is at `y` (the scroll, in screen-height hundredths from the top of the stage).
 * `narrow`: a phone held upright, where one page fills the screen and the picture pans from the left
 * page (the words) to the right page (the diagram) inside each spread.
 */
export function filmAt(y: number, narrow: boolean): Film {
  const g = (s: Seg) => clamp01((y - START[s]) / LEN[s]);
  const closing = g("close");
  // closing: the last leaf turned goes back first, the cover last
  const shut = (lag: number) => ease(clamp01(closing * 1.5 - lag));
  const cover = ease(g("open")) - shut(0.42);
  const leaf: number[] = [];
  for (let i = 1; i <= LEAVES; i++) leaf.push(ease(g(TURN[i - 1])) - shut((LEAVES - i) * 0.07));

  let pan = 1 - cover;
  // the diagrams wait for the picture to reach them
  let from = 0.08;
  let to = 0.85;
  if (narrow) {
    pan = 1;
    for (let i = 0; i < LEAVES; i++) {
      // follow the leaf over to the left page, read it, then cross to the right page
      const back = HOLD[i] === "s3a" ? remap(g("s3a"), 0.45, 1) : remap(g(HOLD[i]), 0.3, 0.52);
      pan += 2 * (ease(back) - ease(g(TURN[i])));
    }
    pan = lerp(pan, 1, shut(0));
    from = 0.52;
    to = 0.97;
  }
  return {
    approach: ease(g("approach")),
    cover,
    leaf,
    spin: 180 * ease(g("flip")) + 180 * ease(g("unflip")),
    close: ease(closing),
    pan,
    hero: 1 - remap(g("approach"), 0, 0.35),
    end: remap(closing, 0.62, 1),
    c1: remap(g("s1"), from, to),
    year: Math.min(3, Math.floor(remap(g("s2"), from, to) * 4)),
    c4: remap(g("s4"), from, to),
    c5: remap(g("s5"), from, to),
  };
}
