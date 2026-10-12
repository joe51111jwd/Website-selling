// A count that rolls like a mechanical counter: each digit is a strip of 0–9 that slides to its
// value. Tabular, so the column never jitters. `digits` reserves room (a hidden leading slot) so a
// total that grows from 7 to 38 doesn't shift. Screen readers get the plain number.

import { motion } from "motion/react";

const STRIP = "0123456789".split("");

function Digit({ d, delay, hidden }: { d: number; delay: number; hidden: boolean }) {
  return (
    <span className="roll-col" style={hidden ? { visibility: "hidden" } : undefined}>
      <motion.span
        className="roll-strip"
        initial={false}
        animate={{ y: `${-d * 10}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.8, delay }}
      >
        {STRIP.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </motion.span>
    </span>
  );
}

export function Roll({ value, digits = 1, delay = 0, className }: { value: number; digits?: number; delay?: number; className?: string }) {
  const s = String(Math.max(0, Math.round(value))).padStart(digits, "0");
  const lead = s.length - String(Math.max(0, Math.round(value))).length;
  return (
    <span className={`roll${className ? ` ${className}` : ""}`}>
      <span className="sr-only">{value}</span>
      <span className="roll-digits" aria-hidden="true">
        {s.split("").map((c, i) => (
          // keyed from the right, so a digit keeps its column as the number grows
          <Digit key={s.length - i} d={+c} delay={delay + (s.length - 1 - i) * 0.05} hidden={i < lead} />
        ))}
      </span>
    </span>
  );
}
