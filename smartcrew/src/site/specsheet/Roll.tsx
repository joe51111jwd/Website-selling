// A count that rolls like a mechanical counter: each digit is a 0–9 strip that slides once to its
// value when `go` turns true (a CSS transition on transform, eased out, no overshoot; nothing
// runs per frame from JS). Tabular, so the figure never jitters. Screen readers get the number.
// Reduced motion: the strips sit at their value (the transition is off in CSS).

import type { CSSProperties } from "react";

export function Roll({ value, go = true, delay = 0, className }: { value: number; go?: boolean; delay?: number; className?: string }) {
  const digits = String(Math.max(0, Math.round(value))).split("");
  return (
    <span className={`roll${className ? ` ${className}` : ""}`}>
      <span className="sr-only">{value}</span>
      <span className="roll-digits" aria-hidden="true">
        {digits.map((d, i) => (
          <span key={digits.length - i} className="roll-col">
            <span
              className="roll-strip"
              style={
                {
                  "--d": go ? Number(d) : 0,
                  "--delay": `${delay + (digits.length - 1 - i) * 90}ms`,
                } as CSSProperties
              }
            >
              {"0123456789".split("").map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
