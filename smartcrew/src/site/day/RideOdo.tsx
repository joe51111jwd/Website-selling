// The big clock of the ride, the film's spine (RIDE_SHOTS §1, "time passes on the clock"): it never
// resets. Between moments it rolls THROUGH the time in between, like a counter, eased (fast in the
// middle, settling on the new time):
//
//   · up to a quarter of an hour: minute by minute (6:42 → 6:55 is thirteen steps; the tens wheel
//     turns as the minutes pass :49 → :50);
//   · longer: the hour wheel turns through every hour (9 → 10, 11, 12, 1 … 4; AM flips to PM as it
//     passes 12) while the minute wheels roll forward to theirs;
//   · Friday: the digits roll up and out and the word rolls in on the same axis.
//
// Every wheel is a track on the film's clock (no React state, no per-frame JS), so it pauses and
// seeks with the rest of the film. Tabular figures: the wheels never change width. Before the first
// moment the clock is empty; it sets as the phone rises.

import { memo, useEffect, useRef } from "react";
import { MOMENTS } from "../../content/moments";
import { EASE, type Player, type TrackFrame } from "../player";
import type { Ride } from "./ride";

type Time = { h: number; m: number; pm: boolean };
const parse = (when: string): Time | null => {
  const x = when.match(/^(\d{1,2}):(\d)(\d)\s*(AM|PM)$/i);
  return x ? { h: +x[1], m: +x[2] * 10 + +x[3], pm: x[4].toUpperCase() === "PM" } : null;
};
const minutesOf = (t: Time) => ((t.h % 12) + (t.pm ? 12 : 0)) * 60 + t.m;

/** The wheels: hours 1–12, tens of minutes 0–5, minutes 0–9; each strip is three turns long. */
const WHEELS = {
  h: { n: 12, label: (k: number) => String(((k % 12) + 12) % 12 || 12) },
  m1: { n: 6, label: (k: number) => String(((k % 6) + 6) % 6) },
  m2: { n: 10, label: (k: number) => String(((k % 10) + 10) % 10) },
} as const;
type WheelId = keyof typeof WHEELS;
const TURNS = 3;
const digitOf = (id: WheelId, t: Time) => (id === "h" ? (t.h % 12) : id === "m1" ? Math.floor(t.m / 10) : t.m % 10);

const y = (id: WheelId, pos: number) => `translate3d(0, ${(-pos / (WHEELS[id].n * TURNS)) * 100}%, 0)`;

/** The inverse of the film's in-out ease (cubic), for the time each step of a roll is reached. */
function inOutInv(v: number) {
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    const e = mid < 0.5 ? 4 * mid * mid * mid : 1 - Math.pow(-2 * mid + 2, 3) / 2;
    if (e < v) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * The steps every wheel takes in each roll, and when (the roll's eased progress). Returns, per
 * wheel, keyframes on its strip, and the AM/PM flip times.
 */
function plan(R: Ride) {
  const fr: Record<WheelId, TrackFrame[]> = { h: [], m1: [], m2: [] };
  const pos: Record<WheelId, number> = { h: 0, m1: 0, m2: 0 };
  const ap: TrackFrame[] = [];
  let prev: Time | null = null;
  R.moments.forEach((mo, i) => {
    const t = parse(MOMENTS[i].when);
    if (!t) return;
    const [a, b] = mo.clock;
    const stepAt = (k: number, n: number) => a + (b - a) * inOutInv(k / n);
    if (!prev) {
      // the first time sets: each wheel rolls up through the three before it
      (Object.keys(WHEELS) as WheelId[]).forEach((id, w) => {
        const N = WHEELS[id].n;
        const d = digitOf(id, t);
        const from = (d - 3 + N) % N + N;
        const a2 = a + w * 40;
        fr[id].push({ t: 0, transform: y(id, from) }, { t: a2, transform: y(id, from), ease: EASE.out }, { t: b, transform: y(id, from + 3) });
        pos[id] = from + 3;
      });
      ap.push({ t: 0, transform: t.pm ? "translate3d(0, -50%, 0)" : "translate3d(0, 0%, 0)" });
      prev = t;
      return;
    }
    const gap = minutesOf(t) - minutesOf(prev);
    // each wheel: back to its first turn (the same glyph: an invisible jump), then its steps
    const rebase = (id: WheelId) => {
      const N = WHEELS[id].n;
      const base = pos[id] % N;
      fr[id].push({ t: a, transform: y(id, pos[id]) }, { t: a, transform: y(id, base) });
      pos[id] = base;
    };
    (Object.keys(WHEELS) as WheelId[]).forEach(rebase);
    if (gap > 0 && gap <= 15) {
      // minute by minute: m2 steps every minute, m1 turns when the minutes pass :x9 → :x0
      for (let k = 1; k <= gap; k++) {
        const t0 = stepAt(k - 1, gap);
        const t1 = stepAt(k, gap);
        const mins = prev.m + k;
        fr.m2.push({ t: t0, transform: y("m2", pos.m2) }, { t: t1, transform: y("m2", pos.m2 + 1) });
        pos.m2++;
        if (mins % 10 === 0) {
          fr.m1.push({ t: t0, transform: y("m1", pos.m1) }, { t: t1, transform: y("m1", pos.m1 + 1) });
          pos.m1++;
        }
      }
    } else {
      // the hours turn one by one; the minutes roll forward to theirs (a full turn if unchanged)
      const hours = Math.max(0, Math.floor(minutesOf(t) / 60) - Math.floor(minutesOf(prev) / 60));
      const steps: Record<WheelId, number> = {
        h: hours,
        m1: (digitOf("m1", t) - digitOf("m1", prev) + 6) % 6,
        m2: (digitOf("m2", t) - digitOf("m2", prev) + 10) % 10 || (gap >= 10 ? 10 : 0),
      };
      (Object.keys(WHEELS) as WheelId[]).forEach((id) => {
        const n = steps[id];
        for (let k = 1; k <= n; k++) {
          const t0 = stepAt(k - 1, n);
          const t1 = stepAt(k, n);
          fr[id].push({ t: t0, transform: y(id, pos[id]) }, { t: t1, transform: y(id, pos[id] + 1) });
          pos[id]++;
          // AM → PM as the hour wheel passes 11 → 12
          if (id === "h" && (prev!.h + k) % 12 === 0) ap.push({ t: t0, transform: "translate3d(0, 0%, 0)", ease: EASE.inOut }, { t: t1 + 120, transform: "translate3d(0, -50%, 0)" });
        }
      });
    }
    prev = t;
  });
  return { fr, ap };
}

/** One wheel: a strip of three turns of its labels, moved by its track. */
function Wheel({ id }: { id: WheelId }) {
  const W = WHEELS[id];
  const items = Array.from({ length: W.n * TURNS }, (_, k) => W.label(k));
  return (
    <span className={`day-odo-wheel day-odo-wheel--${id}`} data-wheel={id}>
      <span className="day-odo-sizer">0</span>
      <span className="day-odo-strip" style={{ height: `${W.n * TURNS * 100}%` }}>
        {items.map((d, k) => (
          <span key={k} className={d.length > 1 ? "is-2" : undefined}>
            {d}
          </span>
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
    const { fr, ap } = plan(R);
    (Object.keys(WHEELS) as WheelId[]).forEach((id) => {
      const s = q(`[data-wheel="${id}"] .day-odo-strip`);
      if (s && fr[id].length) offs.push(player.track(s, fr[id]));
    });
    const aps = q(".day-odo-apstrip");
    if (aps && ap.length) offs.push(player.track(aps, ap));
    // the digits' line: empty until the first time sets; leaves when Friday comes
    const word = R.moments.findIndex((_, i) => !parse(MOMENTS[i].when));
    const line = q(".day-odo-digits");
    const m0 = R.moments[0];
    if (line) {
      const f: TrackFrame[] = [
        { t: 0, opacity: 0, transform: "translate3d(0, 18%, 0)" },
        { t: m0.clock[0], opacity: 0, transform: "translate3d(0, 18%, 0)", ease: EASE.out },
        { t: m0.clock[0] + 420, opacity: 1, transform: "translate3d(0, 0, 0)" },
      ];
      if (word >= 0) {
        const w = R.moments[word];
        f.push({ t: w.clock[0], opacity: 1, transform: "translate3d(0, 0, 0)", ease: EASE.inOut }, { t: w.clock[0] + 380, opacity: 0, transform: "translate3d(0, -60%, 0)" });
      }
      offs.push(player.track(line, f));
    }
    if (word >= 0) {
      const w = R.moments[word];
      el.querySelectorAll<HTMLElement>(".day-odo-letter").forEach((l, k) => {
        const a = w.clock[0] + 160 + k * 40;
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
        <Wheel id="h" />
        <span className="day-odo-colon">:</span>
        <Wheel id="m1" />
        <Wheel id="m2" />
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
