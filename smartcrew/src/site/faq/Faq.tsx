// 8 · FAQ + the close (BRIEF §8, PLAYBOOK S8; round 2 §6). Five questions, one open at a time,
// answers that start with the fact; beside them the page's close: the devices' still (round 4: the
// Stage is off) over the last line and the last orange CTA. That CTA waits (hidden) while the
// offer's CTA above it is still on screen, so two orange buttons never show together
// (src/site/shell/primaryCta.ts usePrimaryElsewhere).

import { useId, useRef, useState } from "react";
import { ANDREW, CTA, FAQ_CLOSE, FAQ_TITLE, FAQS, FLAG } from "../../content/copy";
import { trackCustom } from "../../lib/track";
import { StageAnchor } from "../../three/stage";
import { usePhoneLite } from "../phone";
import { usePrimaryElsewhere } from "../shell/primaryCta";
import { Scene } from "../scene/Scene";
import { DemoButton, TrialButton } from "../offer/Actions";
import { PHONE_HERO_STILL } from "../hero/still";
import { useSeen } from "../offer/useSeen";
import "./faq.css";

export default function Faq() {
  return <FaqPlain phone={usePhoneLite()} />;
}

// Round 4: the 3D Stage is off (src/App.tsx STAGE_ON), so laptops get the phones' build too: the
// devices' still beside the close instead of the Stage's return (in git history before round 4).
function FaqPlain({ phone: lite }: { phone: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  return (
    <Scene id="faq" pinnedViewports={0} stage="keep" label={FAQ_TITLE} className={`faq${lite ? " faq--phone" : " faq--still"}`}>
      <FaqBody root={root} anchor={anchor} still />
    </Scene>
  );
}

function FaqBody({ root, anchor, still = false }: { root: React.RefObject<HTMLDivElement | null>; anchor: React.RefObject<HTMLDivElement | null>; still?: boolean }) {
  const [open, setOpen] = useState(0);
  const lite = usePhoneLite();
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const seen = useSeen(root, 0.25);
  // the last CTA waits while the offer's is still on screen (one orange button at a time)
  const close = useRef<HTMLDivElement>(null);
  const held = usePrimaryElsewhere(close);

  const toggle = (i: number) => {
    setOpen((o) => (o === i ? -1 : i));
    if (open !== i) trackCustom("faq_open", { faq_id: FAQS[i].id });
  };

  return (
    <div className={`faq-grid wrap${seen ? " is-seen" : ""}`} ref={root}>
      <div className="faq-main">
        <h2 className="t-h2 faq-title">{FAQ_TITLE}</h2>
        <ul className="faq-list">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            const qId = `${base}-q${i}`;
            const aId = `${base}-a${i}`;
            return (
              <li key={f.id} className={`faq-item${isOpen ? " is-open" : ""}`} style={{ ["--i" as string]: i }}>
                <h3 className="faq-h">
                  <button type="button" id={qId} className="faq-q" aria-expanded={isOpen} aria-controls={aId} onClick={() => toggle(i)}>
                    <span className="faq-q-text">{f.q}</span>
                    <span className="faq-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path className="faq-icon-h" d="M7 12h10" />
                        <path className="faq-icon-v" d="M12 7v10" />
                      </svg>
                    </span>
                  </button>
                </h3>
                <div id={aId} role="region" aria-labelledby={qId} className="faq-a" inert={!isOpen}>
                  <div className="faq-a-in">
                    <p className="faq-a-text" data-cursor="text">
                      {f.a}
                      {f.flag && (
                        <span className="flag" title={f.flag}>
                          {FLAG}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* the close: the product back on screen, Andrew's last line, the last CTA */}
      <div className="faq-close" ref={close} data-cta-held={held}>
        <div ref={anchor} className="faq-stage-box">
          {lite || still ? (
            // no 3D: the still of the real devices bookends the page
            <img
              className="faq-still"
              src={PHONE_HERO_STILL.src}
              srcSet={PHONE_HERO_STILL.srcSet}
              sizes="(max-width: 760px) 100vw, 520px"
              alt=""
              width={1170}
              height={774}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <StageAnchor id="faq" className="faq-stage" />
          )}
        </div>
        <div className="faq-close-head">
          <img className="faq-face" src={import.meta.env.BASE_URL + ANDREW.face} alt="" width={48} height={48} loading="lazy" decoding="async" />
          <p className="faq-close-line">{FAQ_CLOSE.line}</p>
        </div>
        <div className="faq-actions">
          <TrialButton source="faq" size="lg" />
          <DemoButton source="faq" />
        </div>
        <p className="t-micro faq-micro">{CTA.micro}</p>
      </div>
    </div>
  );
}
