import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { T, track } from "./copy";
import { Ph } from "./ui";

const QA: { id: string; q: string; a: ReactNode }[] = [
  {
    id: "why-call",
    q: "Why do I need a call to get the free trial?",
    a: (
      <>
        <p>
          Because we set your trial up around how you already work. On the call, Andrew shows you how SmartCrew fits your company, or tells you honestly if it doesn’t, and sets up your{" "}
          {T.PROGRAM}.
        </p>
        <Ph label="Placeholder for Andrew: his own reason, in his words">
          <p>Why free? We’re setting up our first dirt work companies by hand, and we want them running SmartCrew on real jobs and telling us what to fix.</p>
        </Ph>
      </>
    ),
  },
  {
    id: "cost",
    q: "How much does it cost?",
    a: (
      <p>
        It depends on the features and your crew size. Andrew gives you exact numbers on the call. No contracts. Andrew’s aim: SmartCrew is designed to return 5–10x what you pay.
        <sup className="f-fn">1</sup>
      </p>
    ),
  },
  {
    id: "crew",
    q: "Is my crew going to hate using it?",
    a: <p>Probably not. Clocking in is one tap, and most crews are up and running within minutes.</p>,
  },
  {
    id: "tracked",
    q: "Will my guys feel tracked? Will it kill their batteries?",
    a: (
      <>
        <p>It runs in the background without draining batteries or being shut down by accident. And no data is shared, so your crew doesn’t have to worry about privacy.</p>
        <Ph label="Placeholder for Andrew to confirm">
          <p>GPS only runs while they’re on the clock.</p>
        </Ph>
      </>
    ),
  },
  {
    id: "qb",
    q: "Does it work with QuickBooks?",
    a: <p>Yes, for payroll. The hours your crew logs go to QuickBooks, so nobody types them twice. Andrew shows you how it works with your setup on the call.</p>,
  },
  {
    id: "setup",
    q: "How fast can we get set up?",
    a: <p>Most companies are fully set up within a few days. We’ll walk you through onboarding and make sure your account is tailored to your exact workflow.</p>,
  },
  { id: "cancel", q: "What if I want to cancel?", a: <p>You can cancel anytime. No contracts. No hassle.</p> },
  {
    id: "support",
    q: "Who do I call if something breaks?",
    a: <p>A real person. We don’t automate or outsource our support, so you can always reach a real live human by phone, chat or email.</p>,
  },
];

export function Faq() {
  const [openId, setOpenId] = useState<string | null>("why-call");
  const reduce = useReducedMotion();
  return (
    <section className="f-faq" id="faq" aria-labelledby="f-faq-h" data-sec="faq">
      <div className="f-wrap f-faq-grid">
        <div className="f-faq-side">
          <h2 id="f-faq-h" className="f-h2">
            Questions contractors ask Andrew
          </h2>
          <figure className="f-katie">
            <Ph label="Placeholder for Andrew: confirm JW or JCR Excavating, and Katie’s permission">
              <blockquote>“I’ve searched for this EXACT software for 10 YEARS! It’s completely changed our business.”</blockquote>
              <figcaption>Katie, JW Excavating</figcaption>
            </Ph>
          </figure>
          <p className="f-faq-mail">
            Something else? Email <a href={`mailto:${T.EMAIL}`}>{T.EMAIL}</a>
          </p>
        </div>

        <div className="f-acc" data-pair-end>
          {QA.map((x) => {
            const on = openId === x.id;
            return (
              <div className={`f-acc-item${on ? " is-open" : ""}`} key={x.id}>
                <h3 className="f-acc-h">
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`f-acc-${x.id}`}
                    id={`f-acc-b-${x.id}`}
                    onClick={() => {
                      setOpenId(on ? null : x.id);
                      if (!on) track("faq_open", { faq_id: x.id });
                    }}
                  >
                    <span>{x.q}</span>
                    <span className="f-acc-icon" aria-hidden="true" />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`f-acc-${x.id}`}
                      role="region"
                      aria-labelledby={`f-acc-b-${x.id}`}
                      className="f-acc-a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.24, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="f-acc-a-in">{x.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
