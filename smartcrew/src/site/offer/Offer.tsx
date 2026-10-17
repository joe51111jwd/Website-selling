// 8 · Why us, round 4 (Andrew's Loom 2:48–3:03): a static photo instead of the animation, and his
// founder story from smartcrewhq.com instead of "No sales team. No BDR. Just Andrew." (a sales team
// is coming, so the page no longer puts every call on him). The first three paragraphs of the letter
// show; "Read more" opens the rest in place. Signed, then the orange CTA. The Founding Member
// receipt is gone with the rest of the Founding Member copy. One layout for laptops and phones
// (offer.css stacks it); no scroll-linked motion: the words come up once as they are first seen.

import { useId, useRef, useState } from "react";
import { ANDREW, WHY } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { Cta } from "../ui/Cta";
import { Signature } from "./Signature";
import { useSeen } from "./useSeen";
import "./offer.css";

export default function Offer() {
  const root = useRef<HTMLDivElement>(null);
  const seen = useSeen(root, 0.2);
  const [open, setOpen] = useState(false);
  const restId = useId();
  const lead = WHY.letter.slice(0, WHY.lead);
  const rest = WHY.letter.slice(WHY.lead);

  return (
    <Scene id="offer" pinnedViewports={0} stage="keep" label={WHY.kicker} className="offer why">
      <div className={`why-grid wrap${seen ? " is-seen" : ""}`} ref={root}>
        <figure className="why-photo">
          <img src={import.meta.env.BASE_URL + ANDREW.photo} alt={ANDREW.photoAlt} width={456} height={420} loading="lazy" decoding="async" />
        </figure>

        <div className="why-story">
          <p className="why-kicker">{WHY.kicker}</p>
          <h2 className="t-h2 why-title">{WHY.title}</h2>
          <div className="why-letter" data-cursor="text">
            {lead.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <div id={restId} className={`why-rest${open ? " is-open" : ""}`} inert={!open}>
              <div className="why-rest-in">
                {rest.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
            <button type="button" className="link why-more" aria-expanded={open} aria-controls={restId} onClick={() => setOpen((o) => !o)}>
              {open ? WHY.less : WHY.more}
              <svg viewBox="0 0 16 16" aria-hidden="true" className="why-more-icon">
                <path d="M4 6.2 8 10.2l4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="why-sign">
            <span className="why-signoff">{WHY.signoff}</span>
            <Signature className="why-sig" title={WHY.signatureAlt} />
            <span className="why-by">{WHY.signedBy}</span>
          </div>

          <div className="why-act" data-hides-sticky>
            <Cta source="offer" size="lg" cue={false} className="why-cta" />
          </div>
        </div>
      </div>
    </Scene>
  );
}
