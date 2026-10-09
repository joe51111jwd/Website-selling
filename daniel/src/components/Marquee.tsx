import { useEffect, useRef } from "react";
import { onTick, reducedMotion, scroll } from "../lib/ticker";

/** An endless band that speeds up with scroll and turns around when you do. */
export function Marquee({ items }: { items: string[] }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    let x = 0;
    let dir = 1;
    return onTick((_, dt) => {
      const el = track.current;
      if (!el) return;
      const half = el.scrollWidth / 2;
      if (Math.abs(scroll.velocity) > 0.5) dir = Math.sign(scroll.velocity);
      const speed = (0.7 + Math.min(Math.abs(scroll.velocity) * 0.3, 14)) * dir;
      x -= (speed * dt) / 16.67;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      el.style.transform = `translate3d(${x}px, 0, 0)`;
    });
  }, []);

  return (
    <div className="marquee" aria-hidden data-x="div.marquee">
      <div className="marquee-track" ref={track}>
        {[0, 1].map((k) => (
          <div className="marquee-group" key={k}>
            {items.map((item, i) => (
              <span key={i}>
                {i % 2 ? <span className="em">{item}</span> : item}
                <svg viewBox="0 0 20 20" aria-hidden>
                  <path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
