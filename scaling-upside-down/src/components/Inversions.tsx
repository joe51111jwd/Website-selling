import { useRef } from "react";
import { inversions } from "../content";
import { PyramidMark, Reveal } from "./ui";

/** A row of cards you scroll sideways, like Apple's "Why buy" tiles: the old belief struck out, the book's version as the headline. */
export function Inversions() {
  const row = useRef<HTMLDivElement>(null);
  const page = (dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".inv-card");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 340) + 20) * 2, behavior: "smooth" });
  };

  return (
    <section className="section section-alt inversions" aria-label="Ideas">
      <div className="wrap">
        <Reveal>
          <h2 className="headline-left">{inversions.headline}</h2>
        </Reveal>
      </div>
      <div className="inv-row" ref={row}>
        {inversions.cards.map((c) => (
          <article className="inv-card" key={c.is}>
            <p className="inv-was">
              <s>{c.was}</s>
            </p>
            <h3 className="inv-is">{c.is}</h3>
            <p className="inv-text">{c.text}</p>
            <PyramidMark className="inv-mark" />
          </article>
        ))}
      </div>
      <div className="wrap row-nav">
        <button type="button" className="round-btn" aria-label="Previous" onClick={() => page(-1)}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M12 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="round-btn" aria-label="Next" onClick={() => page(1)}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
