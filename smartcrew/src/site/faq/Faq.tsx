// 8 · FAQ + the close. Andrew's doc (Oct 20): his heading and his 7 questions and answers word for
// word (his bold kept), one open at a time; beside them the page's close: the devices' still (round 4: the
// Stage is off) over his "Ready to simplify your business?" and the last orange CTA. That CTA waits (hidden) while the
// offer's CTA above it is still on screen, so two orange buttons never show together
// (src/site/shell/primaryCta.ts usePrimaryElsewhere).

import { useId, useRef, useState, type ReactNode } from "react";
import { CTA, FAQ_CLOSE, FAQ_TITLE, FAQS, FLAG, OFFER } from "../../content/copy";
import { SIZES } from "../../signup/contract";
import { Flag } from "../../signup/Flag";
import { PRICED, PRICE_SLOTS, TRIAL_FIRST, priceBands, priceFrom } from "../../lib/offer";
import { trackCustom } from "../../lib/track";
import { StageAnchor } from "../../three/stage";
import { usePhoneLite } from "../phone";
import { usePrimaryElsewhere } from "../shell/primaryCta";
import { nudgeScroll } from "../scroll";
import { Scene } from "../scene/Scene";
import { DemoButton, TrialButton } from "../offer/Actions";
import { PHONE_HERO_STILL } from "../hero/still";
import { useSeen } from "../offer/useSeen";
import "./faq.css";
import "./glass.css";
import "./focus.css";
import "./bold.css";

type FaqItem = { id: string; q: string; a: string[]; flag?: string; more?: ReactNode };

/** The bold look's offer switches (src/lib/offer.ts) in the FAQ: "Do I need a call?" in place of "How does
 *  the free trial work?" once the trial comes first, and the price in "How much does SmartCrew cost?" (its
 *  ⚑ slot on a review build). Other looks: FAQS as is. */
function offerFaqs(): FaqItem[] {
  return FAQS.map((f): FaqItem => {
    if (f.id === "trial" && TRIAL_FIRST) return { id: f.id, q: OFFER.trialFirst.faq.q, a: [OFFER.trialFirst.faq.a], flag: OFFER.trialFirst.note };
    if (f.id !== "cost" || !PRICE_SLOTS) return f;
    if (!PRICED) return { ...f, more: <PriceSlot /> };
    const from = priceFrom();
    const bands = priceBands(SIZES);
    return {
      ...f,
      a: from ? [`${OFFER.price.faqLead(from)} ${OFFER.price.faqTail}`] : f.a,
      more: bands.length ? (
        <span className="faq-prices">
          {bands.map((b) => (
            <span key={b.size}>
              {b.size} people: <b>{b.price}</b>
            </span>
          ))}
        </span>
      ) : undefined,
    };
  });
}

function PriceSlot() {
  return (
    <span className="faq-prices">
      <span>
        <i>{OFFER.price.placeholder}</i>
        <Flag note={OFFER.price.note} />
      </span>
    </span>
  );
}

const FAQ_LIST = offerFaqs();

/** One of Andrew's paragraphs: **…** in his bold, [label](demo) a link that opens the demo popup. */
function rich(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(demo\))/)
    .filter(Boolean)
    .map((part, k) => {
      if (part.startsWith("**")) return <strong key={k}>{part.slice(2, -2)}</strong>;
      const link = part.match(/^\[([^\]]+)\]\(demo\)$/);
      return link ? <DemoButton key={k} source="faq-answer" label={link[1]} className="faq-link" /> : part;
    });
}

/** Keep `el` at its current height on screen for the answer's open/close (faq.css, 0.42 s). */
function holdOnScreen(el: HTMLElement) {
  const top = el.getBoundingClientRect().top;
  const t0 = performance.now();
  const step = () => {
    const d = el.getBoundingClientRect().top - top;
    if (Math.abs(d) >= 1) nudgeScroll(d);
    if (performance.now() - t0 < 520) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

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

  const toggle = (i: number, btn: HTMLElement) => {
    // opening a question below the open answer collapses that answer: hold the tapped question where
    // it is on screen while it does, instead of letting it slide up out of view (a long first answer
    // on a phone)
    if (open !== -1 && open < i) holdOnScreen(btn);
    setOpen((o) => (o === i ? -1 : i));
    if (open !== i) trackCustom("faq_open", { faq_id: FAQ_LIST[i].id });
  };

  return (
    <div className={`faq-grid wrap${seen ? " is-seen" : ""}`} ref={root}>
      <div className="faq-main">
        <h2 className="t-h2 faq-title">{FAQ_TITLE}</h2>
        <ul className="faq-list">
          {FAQ_LIST.map((f, i) => {
            const isOpen = open === i;
            const qId = `${base}-q${i}`;
            const aId = `${base}-a${i}`;
            return (
              <li key={f.id} className={`faq-item${isOpen ? " is-open" : ""}`} style={{ ["--i" as string]: i }}>
                <h3 className="faq-h">
                  <button type="button" id={qId} className="faq-q" aria-expanded={isOpen} aria-controls={aId} onClick={(e) => toggle(i, e.currentTarget)}>
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
                    <div className="faq-a-text" data-cursor="text">
                      {f.a.map((para, j) => (
                        <p key={j}>
                          {rich(para)}
                          {j === f.a.length - 1 && (
                            <>
                              {f.flag && (
                                <span className="flag" title={f.flag}>
                                  {FLAG}
                                </span>
                              )}
                              {f.more}
                            </>
                          )}
                        </p>
                      ))}
                    </div>
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
          <h3 className="t-h3 faq-close-title">{FAQ_CLOSE.title}</h3>
          <p className="faq-close-line">{FAQ_CLOSE.line}</p>
        </div>
        <div className="faq-actions">
          <TrialButton source="faq" size="lg" />
          <DemoButton source="faq" />
        </div>
        <p className="t-micro faq-micro">
          {priceFrom() && `${priceFrom()}. `}
          {CTA.micro}
        </p>
      </div>
    </div>
  );
}
