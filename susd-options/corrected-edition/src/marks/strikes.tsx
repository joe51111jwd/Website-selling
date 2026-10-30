import type { MutableRefObject } from 'react';
import type { Clock } from '../motion/clock';
import { boxWithin, linesOf, type Line } from './measure';
import { glyphBand, strikeOffset } from './metrics';
import { caretD, strikeD } from './paths';

// A struck line: its measured extent plus the segments the pen actually draws. The pen lifts
// over hyphens, plus and equals signs (a strike through them would turn "40+" into "40-" and
// "=" into "≡"), with 1.5 px of paper either side.
export type StrikeLine = Line & { sy: number; segs: [number, number][] };

const LIFT = '-+=‐';

/** Local x extents of the characters the pen must lift over. */
export function charGaps(words: HTMLElement[], root: HTMLElement, chars = LIFT): [number, number][] {
  const out: [number, number][] = [];
  const range = document.createRange();
  for (const w of words) {
    const text = w.textContent ?? '';
    if (![...chars].some((c) => text.includes(c))) continue;
    const base = boxWithin(w, root);
    const wr = w.getBoundingClientRect();
    const walker = document.createTreeWalker(w, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const s = n.textContent ?? '';
      for (let i = 0; i < s.length; i++) {
        if (!chars.includes(s[i])) continue;
        range.setStart(n, i);
        range.setEnd(n, i + 1);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        const x0 = base.x + (r.left - wr.left);
        out.push([x0 - 1.5, x0 + r.width + 1.5]);
      }
    }
  }
  return out;
}

export function segmentsOf(x0: number, x1: number, gaps: [number, number][]): [number, number][] {
  let segs: [number, number][] = [[x0, x1]];
  for (const [g0, g1] of gaps) {
    segs = segs.flatMap(([a, b]): [number, number][] => {
      if (g1 <= a || g0 >= b) return [[a, b]];
      return ([[a, g0], [g1, b]] as [number, number][]).filter(([p, q]) => q - p > 1);
    });
  }
  return segs;
}

/** Measures a struck phrase (any number of wrapped lines) inside root. */
export function measureStrike(words: HTMLElement[], root: HTMLElement, over: number): StrikeLine[] {
  const ws = words.filter(Boolean);
  if (!ws.length) return [];
  const off = strikeOffset(ws[0], 0.5);
  const gaps = charGaps(ws, root);
  return linesOf(ws, root).map((l) => ({ ...l, sy: l.y + off, segs: segmentsOf(l.x0 - over, l.x1 + over, gaps) }));
}

/** The strike paths for some lines. refs gets one array of segment paths per line. */
export function Strikes({
  lines,
  seed,
  refs,
  className = 'mk mk--strike',
}: {
  lines: StrikeLine[];
  seed: number;
  refs?: MutableRefObject<SVGPathElement[][]>;
  className?: string;
}) {
  if (refs) refs.current.length = 0;
  return (
    <>
      {lines.map((l, i) =>
        l.segs.map(([a, b], j) => (
          <path
            key={`${i}-${j}`}
            className={className}
            d={strikeD(a, b, l.sy, seed + i * 7 + j, 0)}
            ref={(el) => {
              if (el && refs) (refs.current[i] ??= [])[j] = el;
            }}
          />
        )),
      )}
    </>
  );
}

/** Draws every segment in order at a constant pen speed; returns the time the pen lifts. */
export function drawStrikes(t: Clock, groups: SVGPathElement[][], at: number, ms: number) {
  const segs = groups.flat().filter(Boolean);
  const lens = segs.map((p) => p.getTotalLength());
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  let s = at;
  segs.forEach((p, i) => {
    const d = (ms * lens[i]) / total;
    t.draw(p, s, d);
    s += d;
  });
  return s;
}

/**
 * The caret between a struck line and its correction: it points at the word boundary nearest the
 * centre of the correction's first line, its base 18 design px above the tallest ascender.
 */
export function caretFor(corr: HTMLElement[], root: HTMLElement, u: number, compact: boolean) {
  const ws = corr.filter(Boolean);
  if (!ws.length) return '';
  const boxes = ws.map((w) => boxWithin(w, root));
  const y0 = boxes[0].y;
  const first = boxes.filter((b) => Math.abs(b.y - y0) < b.h * 0.4);
  const last = first[first.length - 1];
  const cx = (first[0].x + last.x + last.w) / 2;
  let x = first[0].x;
  let best = Infinity;
  for (let i = 0; i < first.length - 1; i++) {
    const gx = (first[i].x + first[i].w + first[i + 1].x) / 2;
    if (Math.abs(gx - cx) < best) {
      best = Math.abs(gx - cx);
      x = gx;
    }
  }
  const band = glyphBand(ws[0]);
  const w = (compact ? 14 : 18) * u;
  const h = (compact ? 11 : 14) * u;
  const base = y0 + band.top - (compact ? 12 : 18) * u;
  return caretD(x, base - h, w, h);
}
