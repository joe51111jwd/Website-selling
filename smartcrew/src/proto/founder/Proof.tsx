import { Flag, Ph } from "./ui";
import yard from "./assets/photo-yard.webp";

export function Proof() {
  return (
    <section className="f-proof" aria-label="What a customer says" data-sec="proof">
      <div className="f-wrap f-proof-grid">
        <figure className="f-proof-photo">
          <img src={yard} alt="A dump truck unloading fill next to a dozer on a site prep job" width={1200} height={533} loading="lazy" />
          <Ph label="Placeholder for Andrew: a real photo of Phil or the Drish crew" className="f-ph-tag" inline>
            {null}
          </Ph>
        </figure>
        <blockquote className="f-quote">
          <p className="f-quote-text" data-pair-end>
            <span className="f-hang">“</span>SmartCrew is literally saving us ~$150k per YEAR in profit. Highest ROI of any software we’ve ever bought. I cannot believe we didn’t start using
            this sooner.”
          </p>
          <footer className="f-quote-by">
            <cite>Phil Drish</cite>, Drish Construction
            <span className="f-quote-note">
              Drish Construction is Andrew’s family’s dirt work company, where SmartCrew started.
              <Flag />
            </span>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
