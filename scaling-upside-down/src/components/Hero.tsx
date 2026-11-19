import { useEffect, useRef } from "react";
import { COPY } from "../copy";
import { BOOK } from "../book";
import { holdHero } from "../herohold";
import { lenis } from "../lenis";
import { track } from "../scroll";

/** where one scroll that starts on the opening stops: still on the opening (a fraction of the screen's height) */
export const HERO_HOLD = 0.08;

// The first screen: the book itself, lit, and the cover's subtitle set around it. "Revenue Up." rises on
// one side and "Margins Down." sinks on the other, as the page loads and as it scrolls.
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const h = COPY.hero;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const off = track(el, "pin");
    // Michael, 13 Nov: one fast scroll must not carry a visitor past the book (src/herohold.ts)
    const unhold = holdHero(
      () => Math.round(window.innerHeight * HERO_HOLD),
      () => lenis,
    );
    // the light follows the pointer, a little
    const stage = el.firstElementChild as HTMLElement;
    const fine = window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        stage.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5).toFixed(3));
        stage.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5).toFixed(3));
      });
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      off();
      unhold();
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero" id="top" ref={ref} aria-labelledby="hero-title">
      <div className="hero-stage">
        <div className="aura" aria-hidden="true" />
        <header className="hero-head">
          <h1 id="hero-title" className="hero-title">
            {h.title}
          </h1>
          <p className="hero-by">
            <span>{h.byline}</span> <i aria-hidden="true" /> <span>{h.reader}</span>
          </p>
        </header>
        <p className="hero-sub">
          <span className="hero-up">{h.up}</span> <span className="hero-down">{h.down}</span>{" "}
          <span className="hero-trap">{h.trap}</span>
        </p>
        <figure className="hero-book">
          <img src={BOOK.src} srcSet={BOOK.srcSet} sizes="(max-width: 760px) 60vw, 34vw" width={BOOK.w} height={BOOK.h} alt={h.cover} fetchPriority="high" decoding="async" />
        </figure>
        <div className="hero-cta">
          <a className="btn btn-light" href="#join">
            {h.join}
          </a>
          <span className="hero-free">{h.free}</span>
        </div>
      </div>
    </section>
  );
}
