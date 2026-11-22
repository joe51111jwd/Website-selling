"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/** Three short statements. The words take their ink as the reader scrolls through them. */
export function Statement({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const total = lines.join(" ").split(" ").length;

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.35) / (span + window.innerHeight * 0.35)));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const on = () => (raf ||= requestAnimationFrame(read));
    read();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  let i = 0;
  return (
    <section className="statement ground" data-tone="ground" ref={ref} style={{ "--n": total } as CSSProperties}>
      <div className="statement-pin">
        <div className="wrap">
          {lines.map((line) => (
            <p key={line} aria-label={line}>
              {line.split(" ").map((w) => (
                <span key={i} aria-hidden="true">
                  <span className="sw" style={{ "--i": i++ } as CSSProperties}>{w}</span>{" "}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
