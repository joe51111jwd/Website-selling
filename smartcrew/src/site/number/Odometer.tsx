// A money figure that rolls like an odometer: every digit is a wheel of 0–9 (twice, so the first
// reveal spins a full turn) that rolls to its digit, right-hand wheels first. Digits keep their
// wheel as the number grows (keyed from the right). Screen readers get the plain figure.

import { useLayoutEffect, useState } from "react";
import { reducedMotion } from "../../three/stage/store";
import { money } from "./calc";

const DIGITS = Array.from({ length: 20 }, (_, i) => i % 10);

function Wheel({ d, place, spin }: { d: number; place: number; spin: boolean }) {
  // mounts showing 0, then rolls to its digit on the next frame (so new wheels roll in too)
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const r = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const idx = !ready || !spin ? 0 : d + 10;
  return (
    <span className="num-wheel">
      <span
        className="num-strip"
        style={{
          transform: `translate3d(0, ${-idx * 5}%, 0)`,
          transitionDelay: reducedMotion ? "0ms" : `${place * 55}ms`,
        }}
      >
        {DIGITS.map((n, i) => (
          <span key={i}>{n}</span>
        ))}
      </span>
    </span>
  );
}

export function Odometer({ value, className, label }: { value: number | null; className?: string; label?: string }) {
  const on = value != null;
  // unset: a counter at zero ("$00,000"), the wheels waiting to roll
  const str = value == null ? "$00,000" : money(value);
  const chars = str.split("");
  // wheels sit on 0 until a value arrives, then spin a full turn to it; later changes roll
  // within the second turn (the short way)
  let place = 0;
  const cells = chars
    .map((ch, i) => ({ ch, fromRight: chars.length - 1 - i }))
    .reverse()
    .map(({ ch, fromRight }) => {
      if (/\d/.test(ch)) {
        const p = place++;
        return <Wheel key={`d${fromRight}`} d={+ch} place={p} spin={on} />;
      }
      return (
        <span key={`s${fromRight}`} className="num-sep">
          {ch}
        </span>
      );
    })
    .reverse();
  return (
    <span className={`num-odometer${on ? " is-on" : ""}${className ? ` ${className}` : ""}`}>
      <span aria-hidden="true" className="num-cells">
        {cells}
      </span>
      <span className="sr-only">{on ? `${str}${label ? ` ${label}` : ""}` : ""}</span>
    </span>
  );
}
