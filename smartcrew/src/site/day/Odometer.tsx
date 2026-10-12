// The big clock: times roll like an odometer, digit by digit (forward in time the wheels turn
// up, scrolling back they turn down; 9:20 → 4:12 runs the hour wheel round through 0). A change
// to a word ("Friday") rolls the whole line instead, letter by letter. Tabular figures, so the
// wheels never change width.

import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { reducedMotion } from "../../three/stage/store";

const ease = [0.22, 1, 0.36, 1] as const;
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const isTime = (s: string) => /^\d{1,2}:\d{2}$/.test(s);

/** One wheel. `n` is a running count (it only ever moves by whole turns), so a roll can pass 9 → 0. */
function Wheel({ n }: { n: MotionValue<number> }) {
  // the strip is 0–9 plus a second 0, so 9 → 0 rolls on instead of jumping back
  const y = useTransform(n, (v) => `${-((((v % 10) + 10) % 10) / DIGITS.length) * 100}%`);
  return (
    <span className="day-odo-wheel">
      <span className="day-odo-sizer" aria-hidden="true">
        0
      </span>
      <motion.span className="day-odo-strip" style={{ y }} aria-hidden="true">
        {DIGITS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </motion.span>
    </span>
  );
}

function useWheel(digit: number, dir: number, delay: number) {
  const n = useMotionValue(digit);
  const cur = useRef(digit);
  // read at the moment the digit changes (they change in the same render)
  const opts = useRef({ dir, delay });
  opts.current = { dir, delay };
  useEffect(() => {
    const from = ((cur.current % 10) + 10) % 10;
    if (from === digit) return;
    const { dir: d, delay: wait } = opts.current;
    const steps = d >= 0 ? (digit - from + 10) % 10 : -((from - digit + 10) % 10);
    cur.current += steps;
    if (reducedMotion) {
      n.set(cur.current);
      return;
    }
    // an interrupted roll carries on from where the wheel is
    const c = animate(n, cur.current, { duration: 0.55 + Math.abs(steps) * 0.045, ease, delay: wait });
    return () => c.stop();
  }, [digit, n]);
  return n;
}

/** "6:42" as two hour wheels (the first only when it's 10–12), the colon and two minute wheels. */
function TimeWheels({ value, dir }: { value: string; dir: number }) {
  const [h, m] = value.split(":");
  const hh = h.padStart(2, " ");
  const d = [hh[0], hh[1], m[0], m[1]].map((c) => (c === " " ? -1 : Number(c)));
  // the minutes' last wheel turns first, the hour last, like a real counter
  const w0 = useWheel(Math.max(0, d[0]), dir, 0.12);
  const w1 = useWheel(d[1], dir, 0.09);
  const w2 = useWheel(d[2], dir, 0.04);
  const w3 = useWheel(d[3], dir, 0);
  return (
    <>
      {d[0] >= 0 && <Wheel n={w0} />}
      <Wheel n={w1} />
      <span className="day-odo-colon">:</span>
      <Wheel n={w2} />
      <Wheel n={w3} />
    </>
  );
}

export function Odometer({ value, step, className }: { value: string; step: number; className?: string }) {
  // direction of the last change of step: forward in time rolls up, back rolls down
  const last = useRef({ step, dir: 1 });
  if (last.current.step !== step) last.current = { step, dir: step > last.current.step ? 1 : -1 };
  const dir = last.current.dir;
  const [clock, suffix] = useMemo(() => {
    const [a, b] = value.split(" ");
    return isTime(a) ? [a, b ?? ""] : [null, ""];
  }, [value]);

  return (
    <p className={`day-odo ${className ?? ""}`} aria-label={value}>
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        {clock ? (
          <motion.span
            key="time"
            className="day-odo-line"
            custom={dir}
            variants={lineVariants}
            initial="enter"
            animate="show"
            exit="exit"
            aria-hidden="true"
          >
            <TimeWheels value={clock} dir={dir} />
            <span className="day-odo-suffix">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.span key={suffix} custom={dir} variants={suffixVariants} initial="enter" animate="show" exit="exit">
                  {suffix}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.span>
        ) : (
          <motion.span key={value} className="day-odo-line day-odo-word" initial="enter" animate="show" exit="exit" aria-hidden="true">
            {value.split("").map((ch, i) => (
              <motion.span key={i} className="day-odo-letter" custom={{ dir, i }} variants={letterVariants}>
                {ch}
              </motion.span>
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </p>
  );
}

const lineVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? "70%" : "-70%", opacity: 0 }),
  show: { y: "0%", opacity: 1, transition: { duration: 0.6, ease } },
  exit: (dir: number) => ({ y: dir > 0 ? "-70%" : "70%", opacity: 0, transition: { duration: 0.4, ease } }),
};

const suffixVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  show: { y: "0%", opacity: 1, transition: { duration: 0.5, ease, delay: 0.12 } },
  exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0, transition: { duration: 0.3, ease } }),
};

const letterVariants = {
  enter: ({ dir }: { dir: number; i: number }) => ({ y: dir > 0 ? "85%" : "-85%", opacity: 0 }),
  show: ({ i }: { dir: number; i: number }) => ({ y: "0%", opacity: 1, transition: { duration: 0.6, ease, delay: 0.08 + i * 0.035 } }),
  exit: ({ dir, i }: { dir: number; i: number }) => ({ y: dir > 0 ? "-85%" : "85%", opacity: 0, transition: { duration: 0.35, ease, delay: i * 0.02 } }),
};
