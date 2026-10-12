// An odometer for one figure in running type: each digit is a reel that rolls up from 0 to its
// value, the lower places taking extra turns, like a meter clicking over. Decorative (aria-hidden):
// the parent carries the real text for screen readers. With reduced motion it simply shows the value.

import type { CSSProperties } from "react";

type Props = {
  /** The digits to land on, e.g. "150". */
  digits: string;
  /** false: every reel reads 0. true: they roll to `digits`. */
  on: boolean;
  /** Roll time of the longest reel, ms. */
  duration?: number;
  className?: string;
};

export function Odometer({ digits, on, duration = 1500, className }: Props) {
  const n = digits.length;
  return (
    <span className={`odo${className ? ` ${className}` : ""}`} aria-hidden="true">
      {digits.split("").map((ch, i) => {
        const d = Number(ch);
        // every reel makes at least one full turn; each place to the right one more
        const turns = i + 1;
        const cells = 10 * turns + 10;
        const target = on ? 10 * turns + d : 0;
        const style = {
          "--odo-y": String(-target),
          // the reels land together, the leftmost a beat later (it "decides" the figure)
          transitionDuration: `${duration}ms`,
          transitionDelay: on ? `${(n - 1 - i) * 70}ms` : "0ms",
        } as CSSProperties;
        return (
          <span className="odo-col" key={i}>
            <span className="odo-reel" style={style}>
              {Array.from({ length: cells }, (_, k) => (
                <span key={k}>{k % 10}</span>
              ))}
            </span>
            {/* sizes the column to one digit */}
            <span className="odo-size">{d}</span>
          </span>
        );
      })}
    </span>
  );
}
