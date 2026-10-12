import type { OpenSignup } from "./copy";
import { Flag, Ph } from "./ui";
import andrew from "./assets/andrew.webp";
import sig from "./assets/sig-light.png";

// Andrew's letter from smartcrewhq.com, verbatim except the typo fix ("spent" → "spend") and cuts
// marked with an ellipsis. Nothing here is new wording in his voice (TRUTH RED).
export function Founder({ open }: { open: OpenSignup }) {
  return (
    <section className="f-founder" id="andrew" aria-labelledby="f-founder-h" data-sec="founder">
      <div className="f-wrap f-founder-grid">
        <figure className="f-founder-photo">
          <img src={andrew} alt="Andrew Drish, founder of SmartCrew" width={730} height={420} loading="lazy" />
          <Ph inline label="Placeholder: a real photo of Andrew on a job site or in the shop" className="f-ph-tag f-ph-dark">
            {null}
          </Ph>
        </figure>

        <div className="f-founder-copy">
          <h2 id="f-founder-h" className="f-founder-by">
            Andrew Drish, founder
          </h2>
          <blockquote className="f-founder-quote">“It was the worst summer of my life… and the most important gift of my life.”</blockquote>
          <div className="f-letter">
            <p>
              When I was 13, I started working for my dad in our small, family construction business. The first day, he put me in a trench, handed me a shovel and said, “Son – I’m gonna
              teach you how to run a shovel this summer so you learn that you don’t want to spend the rest of your life doing this.”
            </p>
            <p>
              That led me to spending 20 years in the tech world where I built, invested in and advised three of the fastest growing tech companies in America, according to Inc Magazine. […]
              I know software. And the BEST software is about reduction and simplicity. Not complexity.
            </p>
          </div>
          <div className="f-founder-foot">
            <img className="f-sig" src={sig} alt="Andrew" width={277} height={73} />
            <p className="f-founder-credit">
              Featured speaker, CONEXPO-CON/AGG 2026 Small Business Day
              <Flag />
            </p>
          </div>
          <div className="f-founder-ask" data-pair-end>
            <p>
              <b>No sales team. No BDR. Just Andrew.</b> I’ll show you exactly how we fit into your operation—or tell you honestly if we don’t.
            </p>
            <button type="button" className="f-btn f-btn-outline" onClick={() => open({ intent: "demo", source: "founder" })}>
              Book a demo with Andrew
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
