// Your number's result as an equipment HOUR METER (scratchpad design/v2/scroll/SCROLL_SHOTS.md
// §2). Every digit is a wheel (a strip of 0–9, four times over, moved by transform only):
// - key-on: when the scene arrives (`keyOn`), the unset meter checks itself: every wheel turns one
//   full revolution, 0 → 0, 900 ms --ease-calm, right to left 55 ms apart. Once per page view.
// - roll: when a value lands, the wheels roll to it (650 ms, right to left 55 ms apart). From the
//   unset "$00,000" they count forward; later changes roll each wheel the short way, and only the
//   wheels whose digit changes move. Digits keep their wheel as the number grows (keyed from the
//   right); a new wheel rolls in from 0.
// Web Animations with explicit from/to (no style flush, no layout reads); a wheel that is
// interrupted rolls on from where it is. Reduced motion: the digits are set at once.
// Screen readers get the plain figure.

import { useEffect, useLayoutEffect, useRef } from "react";
import { reducedMotion } from "../../three/stage/store";
import { money } from "./calc";

/** Four turns of 0–9; a wheel rests in the third (cells 20–29), so it can roll either way. */
const TURNS = 4;
const REST = 20;
const CELLS = Array.from({ length: TURNS * 10 }, (_, i) => i % 10);

const STAGGER = 55;
const ROLL_MS = 650;
const ROLL_EASE = "cubic-bezier(0.16, 0.84, 0.28, 1)";
const KEY_MS = 900;
const KEY_DELAY = 120;
const KEY_EASE = "cubic-bezier(0.45, 0, 0.25, 1)";

const at = (cell: number) => `translate3d(0, ${-cell}em, 0)`;
/** The same digit's cell in the resting turn (identical pixels: the strip repeats). */
const rest = (cell: number) => REST + (((Math.round(cell) % 10) + 10) % 10);

/** A wheel's move: `delta` cells (+ forward, − back, 10 = one full turn). */
type Move = { delta: number; delay: number; ms: number; ease: string } | null;

/** One wheel: its strip and the cell it rests on (always in the resting turn). */
function Wheel({ move }: { move: Move }) {
  const strip = useRef<HTMLSpanElement>(null);
  const cell = useRef(REST);
  const anim = useRef<Animation | null>(null);
  // each move is applied once (effects may run twice for one commit: StrictMode, remounts)
  const applied = useRef<Move>(null);

  useLayoutEffect(() => {
    const el = strip.current;
    if (el) el.style.transform = at(cell.current);
  }, []);

  useLayoutEffect(() => {
    const el = strip.current;
    if (!el || !move || applied.current === move) return;
    applied.current = move;
    // where it is now: mid-roll, wherever the running animation has it (in cells)
    let from = cell.current;
    if (anim.current?.playState === "running") {
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize) || 1;
      if (cs.transform && cs.transform !== "none") from = -new DOMMatrixReadOnly(cs.transform).m42 / fs;
    }
    anim.current?.cancel();
    anim.current = null;
    // land in the resting turn; start the same number of cells before it
    const to = rest(cell.current + move.delta);
    from = to - (cell.current + move.delta - from);
    cell.current = to;
    el.style.transform = at(to);
    if (reducedMotion || typeof el.animate !== "function") return;
    anim.current = el.animate([{ transform: at(from) }, { transform: at(to) }], {
      duration: move.ms,
      delay: move.delay,
      easing: move.ease,
      fill: "backwards",
    });
  }, [move]);

  return (
    <span className="num-wheel">
      <span ref={strip} className="num-strip">
        {CELLS.map((n, i) => (
          <span key={i}>{n}</span>
        ))}
      </span>
    </span>
  );
}

type Cell = { kind: "d"; place: number; digit: number } | { kind: "s"; place: number; ch: string };

/** "$48,125" → cells keyed from the right (digit places count wheels, separators count chars). */
function cellsOf(str: string): Cell[] {
  const out: Cell[] = [];
  let wheel = 0;
  for (let i = str.length - 1; i >= 0; i--) {
    const ch = str[i];
    if (/\d/.test(ch)) out.push({ kind: "d", place: wheel++, digit: +ch });
    else out.push({ kind: "s", place: str.length - 1 - i, ch });
  }
  return out.reverse();
}

export function Odometer({
  value,
  keyOn = false,
  className,
  label,
  onLand,
}: {
  value: number | null;
  /** The scene has arrived: the unset meter turns its wheels once (desktop). */
  keyOn?: boolean;
  className?: string;
  label?: string;
  /** Called when the last wheel of a roll to a value has landed. */
  onLand?: (value: number) => void;
}) {
  const on = value != null;
  // unset: a meter at zero ("$00,000"), waiting
  const str = value == null ? "$00,000" : money(value);
  const cells = cellsOf(str);
  const digits = cells.filter((c): c is Extract<Cell, { kind: "d" }> => c.kind === "d");

  // the moves handed to the wheels, by place; computed when the value (or key-on) changes
  const moves = useRef<Map<number, Move>>(new Map());
  const shownDigits = useRef<Map<number, number>>(new Map());
  const keyed = useRef(false);
  const landTimer = useRef(0);
  const onLandRef = useRef(onLand);
  onLandRef.current = onLand;

  // value → moves (in render, so the wheels get them in the same commit)
  const lastStr = useRef<string | null>(null);
  const lastKey = useRef(false);
  if (lastStr.current !== str || lastKey.current !== keyOn) {
    const fromUnset = lastStr.current === null || lastStr.current === "$00,000";
    const next = new Map<number, Move>();
    if (str !== lastStr.current) {
      // right to left, 55 ms apart, counting only the wheels that move
      let rank = 0;
      for (const d of digits) {
        const was = shownDigits.current.get(d.place) ?? 0;
        // forward from the unset meter (counting up to his number); otherwise the short way
        const delta = fromUnset ? (d.digit - was + 10) % 10 : ((d.digit - was + 15) % 10) - 5;
        if (!delta) continue;
        next.set(d.place, { delta, delay: rank++ * STAGGER, ms: ROLL_MS, ease: ROLL_EASE });
      }
    }
    // key-on: the unset meter turns every wheel once, 0 → 0 (once per page view)
    if (keyOn && !keyed.current && value == null && !reducedMotion) {
      keyed.current = true;
      for (const d of digits) next.set(d.place, { delta: 10, delay: KEY_DELAY + d.place * STAGGER, ms: KEY_MS, ease: KEY_EASE });
    }
    if (next.size || str !== lastStr.current) moves.current = next;
    lastStr.current = str;
    lastKey.current = keyOn;
  }

  // remember what each wheel shows now (after the commit)
  useEffect(() => {
    const m = new Map<number, number>();
    for (const d of digits) m.set(d.place, d.digit);
    shownDigits.current = m;
    // the last wheel lands at its delay + its roll
    window.clearTimeout(landTimer.current);
    if (value == null) return;
    let end = 0;
    moves.current.forEach((mv) => mv && (end = Math.max(end, mv.delay + mv.ms)));
    const v = value;
    landTimer.current = window.setTimeout(() => onLandRef.current?.(v), reducedMotion ? 0 : end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [str]);
  useEffect(() => () => window.clearTimeout(landTimer.current), []);

  const nodes = cells.map((c) =>
    c.kind === "d" ? (
      <Wheel key={`d${c.place}`} move={moves.current.get(c.place) ?? null} />
    ) : (
      <span key={`s${c.place}`} className="num-sep">
        {c.ch}
      </span>
    ),
  );

  return (
    <span className={`num-odometer${on ? " is-on" : ""}${className ? ` ${className}` : ""}`}>
      <span aria-hidden="true" className="num-cells">
        {nodes}
      </span>
      <span className="sr-only">{on ? `${str}${label ? ` ${label}` : ""}` : ""}</span>
    </span>
  );
}
