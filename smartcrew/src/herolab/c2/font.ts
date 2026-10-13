// Herolab c2 · the sign's font: a 5×7 dot-matrix face, the way a work-zone PCMS sets its caps.
// Full-matrix board: one continuous grid of dots (uniform pitch), so a line can be centred to the
// column and the wipe can step column by column. Glyphs are 7 rows tall, 5 columns wide (narrow
// punctuation, I and space are narrower, as on the real signs' proportional fonts), with one blank
// column between characters and two blank rows between lines.
//
// Every phase is ONE path of zero-length round-cap segments ("Mx yh0", ~8 bytes a dot), in grid
// units (1 unit = 1 pitch), so the SVG viewBox scales it crisply to any board size.

const G: Record<string, string> = {
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#",
  B: "####.|#...#|#...#|####.|#...#|#...#|####.",
  C: ".###.|#...#|#....|#....|#....|#...#|.###.",
  D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  E: "#####|#....|#....|####.|#....|#....|#####",
  F: "#####|#....|#....|####.|#....|#....|#....",
  G: ".###.|#...#|#....|#.###|#...#|#...#|.####",
  H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
  I: "###|.#.|.#.|.#.|.#.|.#.|###",
  J: "..###|...#.|...#.|...#.|#..#.|#..#.|.##..",
  K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",
  L: "#....|#....|#....|#....|#....|#....|#####",
  M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#",
  N: "#...#|#...#|##..#|#.#.#|#..##|#...#|#...#",
  O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
  P: "####.|#...#|#...#|####.|#....|#....|#....",
  Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",
  R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
  S: ".####|#....|#....|.###.|....#|....#|####.",
  T: "#####|..#..|..#..|..#..|..#..|..#..|..#..",
  U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
  V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
  W: "#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.",
  X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
  Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",
  Z: "#####|....#|...#.|..#..|.#...|#....|#####",
  // the zero carries the diagonal, so "$4,120" never reads "$4,12O"
  "0": ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",
  "1": "..#..|.##..|..#..|..#..|..#..|..#..|.###.",
  "2": ".###.|#...#|....#|...#.|..#..|.#...|#####",
  "3": "#####|...#.|..#..|...#.|....#|#...#|.###.",
  "4": "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.",
  "5": "#####|#....|####.|....#|....#|#...#|.###.",
  "6": "..##.|.#...|#....|####.|#...#|#...#|.###.",
  "7": "#####|....#|...#.|..#..|.#...|.#...|.#...",
  "8": ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
  "9": ".###.|#...#|#...#|.####|....#|...#.|.##..",
  $: "..#..|.####|#.#..|.###.|..#.#|####.|..#..",
  "+": ".....|..#..|..#..|#####|..#..|..#..|.....",
  "−": ".....|.....|.....|#####|.....|.....|.....",
  "-": "...|...|...|###|...|...|...",
  "#": ".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.",
  ":": ".|#|#|.|#|#|.",
  ".": ".|.|.|.|.|.|#",
  ",": "..|..|..|..|.#|.#|#.",
  "/": "....#|....#|...#.|..#..|.#...|#....|#....",
  "&": ".##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#",
  "'": "#|#|.|.|.|.|.",
  "→": ".....|..#..|...#.|#####|...#.|..#..|.....",
  " ": "...|...|...|...|...|...|...",
};

type Glyph = { w: number; on: [number, number][] };
const cache = new Map<string, Glyph>();

function glyph(ch: string): Glyph {
  const hit = cache.get(ch);
  if (hit) return hit;
  const src = G[ch] ?? G[" "];
  const rows = src.split("|");
  const on: [number, number][] = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => c === "#" && on.push([x, y])));
  const g = { w: rows[0].length, on };
  cache.set(ch, g);
  return g;
}

/** Width of a line in columns (1 blank column between characters). */
export function lineCols(text: string) {
  let w = 0;
  [...text].forEach((ch, i) => (w += glyph(ch).w + (i ? 1 : 0)));
  return w;
}

export const ROWS_PER_LINE = 7;
export const LINE_GAP = 2;

/** The board's dot field: `chars` 5-wide characters per line (+ the blank column), 3 lines. */
export type Grid = { chars: number; cols: number; rows: number };

export function gridFor(chars: number): Grid {
  return { chars, cols: chars * 6 - 1, rows: 3 * ROWS_PER_LINE + 2 * LINE_GAP };
}

/** One phase (3 lines) → its lit dots as one path, plus where each line sits (for the hand-off). */
export function phasePath(lines: string[], g: Grid) {
  let d = "";
  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  lines.forEach((text, li) => {
    const w = lineCols(text);
    if (w > g.cols) console.warn(`[hl2] "${text}" is ${w} columns; the board has ${g.cols}`);
    const x0 = Math.floor((g.cols - w) / 2);
    const y0 = li * (ROWS_PER_LINE + LINE_GAP);
    boxes.push({ x: x0, y: y0, w, h: ROWS_PER_LINE });
    let x = x0;
    for (const ch of text) {
      const gl = glyph(ch);
      for (const [cx, cy] of gl.on) d += `M${x + cx + 0.5} ${y0 + cy + 0.5}h0`;
      x += gl.w + 1;
    }
  });
  return { d, boxes };
}

/** The same, for one line on its own (the "6:42 AM" that flies into One Day). */
export function linePath(text: string) {
  let d = "";
  let x = 0;
  for (const ch of text) {
    const gl = glyph(ch);
    for (const [cx, cy] of gl.on) d += `M${x + cx + 0.5} ${cy + 0.5}h0`;
    x += gl.w + 1;
  }
  return { d, w: Math.max(0, x - 1), h: ROWS_PER_LINE };
}
