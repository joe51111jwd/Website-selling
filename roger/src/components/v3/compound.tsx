"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Brick } from "./bricks";

/**
 * It compounds. A nine by nine wall: three bricks to start, three more every Monday.
 * Scroll walks weeks 1 to 3 one at a time, then runs to week 26 (78 to 81).
 * Under reduced motion the same two states are shown side by side, still.
 */
const WEEKS = 26;
const COLS = 9;
const levelOfRow = (row: number) => Math.min(5, 1 + Math.floor(row / 2));

function weekAt(p: number) {
  if (p < 0.08) return 0;
  if (p < 0.18) return 1;
  if (p < 0.28) return 2;
  if (p < 0.46) return 3;
  if (p >= 0.86) return WEEKS;
  return Math.min(WEEKS, 4 + Math.floor(((p - 0.46) / 0.4) * (WEEKS - 3)));
}

function Wall({ week, style }: { week: number; style?: CSSProperties }) {
  const built = (week + 1) * 3;
  return (
    <div className="wall" style={style}>
      {Array.from({ length: 81 }, (_, cell) => {
        // The grid paints top to bottom; the wall builds bottom to top, left to right.
        const row = COLS - 1 - Math.floor(cell / COLS);
        const col = cell % COLS;
        const i = row * COLS + col;
        const on = i < built;
        return (
          <span key={cell} className={`cell${on ? " on" : ""}${on && i >= built - 3 ? " new" : ""}`}>
            <Brick level={levelOfRow(row)} style={{ "--k": i % 3 } as CSSProperties} />
          </span>
        );
      })}
    </div>
  );
}

const sum = (w: number) => (w === 0 ? "3 bricks to start" : `${w * 3} → ${w * 3 + 3} bricks`);

export function Compound({ title, line }: { title: string; line: string }) {
  const track = useRef<HTMLDivElement>(null);
  const wall = useRef<HTMLDivElement>(null);
  const [week, setWeek] = useState(WEEKS);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
      setWeek(weekAt(p));
      // Start close on the first bricks, then pull back to the whole wall.
      const z = 1 - Math.min(1, p / 0.4);
      const scale = 1 + 1.5 * z * z;
      if (wall.current) wall.current.style.transform = `scale(${scale.toFixed(4)})`;
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

  return (
    <section className="ground-2" data-tone="ground" aria-labelledby="compounds">
      <div className="compound-track" ref={track}>
        <div className="compound-pin">
          <div className="wrap compound-grid">
            <div className="compound-copy">
              <h2 id="compounds" className="t-h2">{title}</h2>
              <p className="t-lead ink-2" style={{ marginTop: "1rem", maxWidth: "26rem" }}>{line}</p>
              <div aria-hidden="true" style={{ marginTop: "clamp(1rem, 5vh, 3rem)" }}>
                <p className="week-count">{week === 0 ? "Start" : `Week ${week}`}</p>
                <p className="week-sum"><span className="marker" />{sum(week)}</p>
              </div>
              <p className="sr-only">Three bricks to start. Week 3: 9 to 12 bricks. Week 26: 78 to 81 bricks.</p>
            </div>
            <div className="wall-box" aria-hidden="true">
              <div ref={wall} style={{ position: "absolute", inset: 0, transformOrigin: "0% 100%" }}>
                <Wall week={week} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="compound-static chapter">
        <div className="wrap">
          <div className="center-head">
            <h2 className="t-h2">{title}</h2>
            <p className="t-lead ink-2" style={{ marginTop: "1rem" }}>{line}</p>
          </div>
          <div className="static-pair">
            {[3, WEEKS].map((w) => (
              <figure key={w}>
                <div className="wall-box" role="img" aria-label={`Week ${w}: ${w * 3 + 3} bricks set up`}><Wall week={w} /></div>
                <figcaption style={{ marginTop: "1rem" }}>
                  <span className="t-h3">Week {w}</span>
                  <span className="week-sum" style={{ fontSize: "1.125rem", marginTop: "0.25rem" }}><span className="marker" />{sum(w)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
