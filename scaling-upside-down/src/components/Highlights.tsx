import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { highlights } from "../content";
import { Photo } from "./ui";

/*
  "Get the highlights." Big rounded cards in a row, the current one centered. Each plays for six
  seconds while its dot fills, then the row slides on. Dots jump, the button pauses, and a swipe
  moves one card either way.
*/

const DURATION = 6000;

function FileCard() {
  return (
    <div className="hl-boot" aria-hidden="true">
      <div className="hl-boot-window">
        <div className="hl-boot-file">
          <svg viewBox="0 0 16 20">
            <path d="M2 1h8l4 4v14H2z" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 1v4h4" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span>scaling-upside-down.md</span>
          <em>47K tokens</em>
        </div>
        <p className="hl-boot-q">We’re 9 people and flat for three quarters. Should we hire a head of ops?</p>
        <p className="hl-boot-route">Route · Diagnose / Complexity</p>
        <p className="hl-boot-a">
          You’re under the <b>ceiling of 12</b>, so headcount is unlikely to be the constraint. Let the work show which role
          is missing first.
        </p>
      </div>
    </div>
  );
}

export function Highlights() {
  const n = highlights.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const section = useRef<HTMLElement>(null);
  const inView = useInView(section, { amount: 0.35 });
  const fill = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);

  // the active dot fills while the card plays; written straight to the DOM, no re-render per frame
  useEffect(() => {
    const el = fill.current;
    if (el) el.style.transform = `scaleX(${progress.current})`;
    if (!playing || !inView) return;
    let raf = 0;
    const start = performance.now() - progress.current * DURATION;
    const tick = (now: number) => {
      const p = (now - start) / DURATION;
      if (p >= 1) {
        progress.current = 0;
        setIndex((i) => (i + 1) % n);
        return;
      }
      progress.current = p;
      if (fill.current) fill.current.style.transform = `scaleX(${p})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, inView, index, n]);

  const go = (i: number) => {
    progress.current = 0;
    setIndex(((i % n) + n) % n);
  };

  const downX = useRef<number | null>(null);

  return (
    <section className="section section-alt highlights" ref={section} aria-roledescription="carousel" aria-label="Highlights">
      <div className="wrap hl-head">
        <h2 className="headline-left">Get the highlights.</h2>
        <a className="link" href="#bootloader">
          Read the first chapter
          <svg className="play-ring" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 6.5l5 3.5-5 3.5z" fill="currentColor" />
          </svg>
        </a>
      </div>

      <div
        className="hl-viewport"
        onPointerDown={(e) => (downX.current = e.clientX)}
        onPointerUp={(e) => {
          if (downX.current === null) return;
          const dx = e.clientX - downX.current;
          downX.current = null;
          if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        <ul className="hl-track" style={{ transform: `translateX(calc(${-index} * (var(--hl-w) + var(--hl-gap))))` }}>
          {highlights.map((h, i) => (
            <li
              key={h.id}
              className={`hl-card tone-${h.tone}${i === index ? " is-current" : ""}`}
              aria-hidden={i !== index}
              onClick={() => i !== index && go(i)}
            >
              {h.image ? <Photo name={h.image} alt="" className="hl-img" position={h.position} /> : <FileCard />}
              <h3 className="hl-caption">
                {h.lines[0]}
                <br />
                {h.lines[1]}
              </h3>
            </li>
          ))}
        </ul>
      </div>

      <div className="hl-controls">
        <div className="dotnav" role="tablist" aria-label="Choose a highlight">
          {highlights.map((h, i) => (
            <button
              key={h.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${h.lines[0]} ${h.lines[1]}`}
              className={`dot${i === index ? " is-active" : ""}`}
              onClick={() => go(i)}
            >
              {i === index ? <span className="dot-fill" ref={fill} /> : null}
            </button>
          ))}
        </div>
        <button type="button" className="playpause" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)}>
          {playing ? (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="5.5" y="4.5" width="3" height="11" rx="1" fill="currentColor" />
              <rect x="11.5" y="4.5" width="3" height="11" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6.5 4.5l9 5.5-9 5.5z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}
