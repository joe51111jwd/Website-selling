// The big clock of the ride: the times roll like an odometer, digit by digit (the minutes' last
// wheel first, the hour last, like a real counter), "AM" / "PM" rolls with them, and at Friday the
// digits leave and the word rolls in letter by letter. Every wheel is a track on the film's clock
// (no React state, no per-frame JS), so it pauses and seeks with the rest of the film. Tabular
// figures: the wheels never change width. Before the first moment the clock is empty and sets
// as the devices rise (the hand-off).

import { memo, useEffect, useRef } from "react";
import { MOMENTS } from "../../content/moments";
import { EASE, type Player, type TrackFrame } from "../player";
import type { Ride } from "./ride";

const DIGITS = 10;
/** two turns of digits on each strip, so a roll can carry on past 9 */
const STRIP = Array.from({ length: DIGITS * 2 }, (_, i) => String(i % DIGITS));

type Parsed = { h: number; m1: number; m2: number; ap: "AM" | "PM" } | null;
const parse = (when: string): Parsed => {
  const m = when.match(/^(\d):(\d)(\d)\s*(AM|PM)$/i);
  return m ? { h: +m[1], m1: +m[2], m2: +m[3], ap: m[4].toUpperCase() as "AM" | "PM" } : null;
};

const y = (pos: number) => `translate3d(0, ${(-pos / STRIP.length) * 100}%, 0)`;

/** A wheel's keyframes: at each moment's roll it turns forward to that moment's digit. */
function wheelFrames(R: Ride, digit: (p: NonNullable<Parsed>) => number, delay: number): TrackFrame[] {
  const fr: TrackFrame[] = [];
  let pos: number | null = null;
  R.moments.forEach((m, i) => {
    const p = parse(MOMENTS[i].when);
    if (!p) return;
    const d = digit(p);
    const a = m.time[0] + delay;
    const b = a + (m.time[1] - m.time[0]) - 90;
    if (pos === null) {
      // the first time sets: it rolls up through the three digits before it
      const from = (d - 3 + DIGITS) % DIGITS;
      fr.push({ t: 0, transform: y(from) }, { t: a, transform: y(from), ease: EASE.out }, { t: b, transform: y(from + 3) });
      pos = from + 3;
      return;
    }
    const base = pos % DIGITS;
    const steps = (d - base + DIGITS) % DIGITS;
    // reset to the first turn (the same glyph, an invisible jump), then roll forward
    fr.push({ t: a, transform: y(pos) }, { t: a, transform: y(base), ease: EASE.inOut }, { t: b, transform: y(base + steps) });
    pos = base + steps;
  });
  return fr;
}

/** One wheel: a strip of two turns of digits, moved by its track. */
function Wheel({ k }: { k: string }) {
  return (
    <span className="day-odo-wheel" data-wheel={k}>
      <span className="day-odo-sizer">0</span>
      <span className="day-odo-strip" style={{ height: `${STRIP.length * 100}%` }}>
        {STRIP.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </span>
    </span>
  );
}

export const RideOdo = memo(function RideOdo({ player, ride: R }: { player: Player; ride: Ride }) {
  const root = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = (s: string) => el.querySelector<HTMLElement>(s);
    const offs: (() => void)[] = [];
    const strip = (k: string) => q(`[data-wheel="${k}"] .day-odo-strip`);
    // minutes' last wheel first, the hour last
    const wheels: [string, (p: NonNullable<Parsed>) => number, number][] = [
      ["m2", (p) => p.m2, 0],
      ["m1", (p) => p.m1, 40],
      ["h", (p) => p.h, 90],
    ];
    for (const [k, fn, delay] of wheels) {
      const s = strip(k);
      if (s) offs.push(player.track(s, wheelFrames(R, fn, delay)));
    }
    // AM / PM
    const ap = q(".day-odo-apstrip");
    if (ap) {
      const fr: TrackFrame[] = [];
      let first = true;
      R.moments.forEach((m, i) => {
        const p = parse(MOMENTS[i].when);
        if (!p) return;
        const to = p.ap === "AM" ? "translate3d(0, 0%, 0)" : "translate3d(0, -50%, 0)";
        if (first) fr.push({ t: 0, transform: to });
        else fr.push({ t: m.time[0] + 120, ease: EASE.inOut }, { t: m.time[0] + 120 + 460, transform: to });
        first = false;
      });
      // the keyframes without a transform take their neighbours' (filled in below)
      let last = fr[0]?.transform;
      for (const f of fr) {
        if (f.transform === undefined) f.transform = last;
        last = f.transform;
      }
      offs.push(player.track(ap, fr));
    }
    // the digits' line: empty until the first time sets; leaves when Friday comes
    const word = R.moments.findIndex((_, i) => !parse(MOMENTS[i].when));
    const line = q(".day-odo-digits");
    const m0 = R.moments[0];
    if (line) {
      const fr: TrackFrame[] = [
        { t: 0, opacity: 0, transform: "translate3d(0, 18%, 0)" },
        { t: m0.time[0], opacity: 0, transform: "translate3d(0, 18%, 0)", ease: EASE.out },
        { t: m0.time[0] + 420, opacity: 1, transform: "translate3d(0, 0, 0)" },
      ];
      if (word >= 0) {
        const w = R.moments[word];
        fr.push({ t: w.time[0], opacity: 1, transform: "translate3d(0, 0, 0)", ease: EASE.inOut }, { t: w.time[0] + 380, opacity: 0, transform: "translate3d(0, -60%, 0)" });
      }
      offs.push(player.track(line, fr));
    }
    if (word >= 0) {
      const w = R.moments[word];
      el.querySelectorAll<HTMLElement>(".day-odo-letter").forEach((l, k) => {
        const a = w.time[0] + 160 + k * 40;
        offs.push(
          player.track(l, [
            { t: 0, opacity: 0, transform: "translate3d(0, 85%, 0)" },
            { t: a, opacity: 0, transform: "translate3d(0, 85%, 0)", ease: EASE.out },
            { t: a + 520, opacity: 1, transform: "translate3d(0, 0, 0)" },
          ]),
        );
      });
    }
    return () => offs.forEach((f) => f());
  }, [player, R]);

  const wordWhen = MOMENTS.find((m) => !parse(m.when))?.when ?? "";
  return (
    <p className="day-odo t-time day-time" ref={root} aria-hidden="true">
      <span className="day-odo-line day-odo-digits">
        <Wheel k="h" />
        <span className="day-odo-colon">:</span>
        <Wheel k="m1" />
        <Wheel k="m2" />
        <span className="day-odo-suffix">
          <span className="day-odo-apstrip">
            <span>AM</span>
            <span>PM</span>
          </span>
        </span>
      </span>
      {wordWhen && (
        <span className="day-odo-line day-odo-word">
          {wordWhen.split("").map((ch, i) => (
            <span key={i} className="day-odo-letter">
              {ch}
            </span>
          ))}
        </span>
      )}
    </p>
  );
});
