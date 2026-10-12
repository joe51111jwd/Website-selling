// 8 · FAQ + the close (BRIEF §8, PLAYBOOK S8). Five questions, one open at a time, answers that
// start with the fact; beside them the page's last line and its last CTA, so the button stays in
// view whichever answer is open.

import { useId, useRef, useState } from "react";
import {
  ANDREW,
  CTA,
  FAQ_CLOSE,
  FAQ_TITLE,
  FAQS,
  FLAG,
} from "../../content/copy";
import { trackCustom } from "../../lib/track";
import { Scene } from "../scene/Scene";
import { DemoButton, TrialButton } from "../offer/Actions";
import { useSeen } from "../offer/useSeen";
import "./faq.css";

export default function Faq() {
  return (
    <Scene id="faq" pinnedViewports={0} label={FAQ_TITLE} className="faq">
      <FaqBody />
    </Scene>
  );
}

function FaqBody() {
  const [open, setOpen] = useState(0);
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLDivElement>(null);
  const seen = useSeen(root, 0.25);

  const toggle = (i: number) => {
    setOpen((o) => (o === i ? -1 : i));
    if (open !== i) trackCustom("faq_open", { faq_id: FAQS[i].id });
  };

  return (
    <div className={`faq-grid wrap${seen ? " is-seen" : ""}`} ref={root}>
      <div className="faq-side">
        <h2 className="t-h2 faq-title">{FAQ_TITLE}</h2>
        <div className="faq-close" data-hides-sticky>
          <div className="faq-close-head">
            <img
              className="faq-face"
              src={import.meta.env.BASE_URL + ANDREW.face}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
            />
            <p className="faq-close-line">{FAQ_CLOSE.line}</p>
          </div>
          <div className="faq-actions">
            <TrialButton source="faq" />
            <DemoButton source="faq" />
          </div>
          <p className="t-micro faq-micro">{CTA.micro}</p>
        </div>
      </div>

      <ul className="faq-list">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          const qId = `${base}-q${i}`;
          const aId = `${base}-a${i}`;
          return (
            <li
              key={f.id}
              className={`faq-item${isOpen ? " is-open" : ""}`}
              style={{ ["--i" as string]: i }}
            >
              <h3 className="faq-h">
                <button
                  type="button"
                  id={qId}
                  className="faq-q"
                  aria-expanded={isOpen}
                  aria-controls={aId}
                  onClick={() => toggle(i)}
                >
                  <span className="faq-q-text">{f.q}</span>
                  <span className="faq-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path className="faq-icon-h" d="M7 12h10" />
                      <path className="faq-icon-v" d="M12 7v10" />
                    </svg>
                  </span>
                </button>
              </h3>
              <div
                id={aId}
                role="region"
                aria-labelledby={qId}
                className="faq-a"
                inert={!isOpen}
              >
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
  );
}
