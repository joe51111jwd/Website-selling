import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ANGLES, FEATURE_COUNT, SIZES, T, type Angle, type MomentId, type OpenSignup } from "./data";
import { Crop, Mark, Phone, useBox } from "./Shots";
import Moments from "./Moments";
import Calculator from "./Calculator";
import { track } from "./track";

import logoUrl from "./assets/logo.svg";
import logoWhiteUrl from "./assets/logo-white.svg";
import drish from "./assets/logo-drish.png";
import rieke from "./assets/logo-rieke.png";
import jcr from "./assets/logo-jcr.png";
import fireball from "./assets/logo-fireball.png";
import dw from "./assets/logo-dw.png";
import midwest from "./assets/logo-midwest.png";
import truckPhoto from "./assets/photo-truck.webp";
import andrewPhoto from "./assets/andrew.webp";
import signature from "./assets/signature.png";

// ─── shared bits ────────────────────────────────────────────────────────────────
export function Ph({ children, note }: { children: ReactNode; note?: string }) {
  // [placeholder for Andrew]: a proposal or unconfirmed claim, shown so nobody mistakes it for approved copy
  return (
    <span className="pp-ph-box">
      <span className="pp-ph">{note ?? "Placeholder for Andrew"}</span>
      {children}
    </span>
  );
}

const Micro = ({ dark = false }: { dark?: boolean }) => (
  <p className={`pp-micro${dark ? " is-dark" : ""}`}>
    {T.PROGRAM}. Starts with a {T.N}-minute call with Andrew. No contract, cancel anytime.
  </p>
);

// six contractors, optically normalised to the same ink area (AISMELL V13)
const LOGOS: [string, string, number][] = [
  ["Drish Construction", drish, 2.18],
  ["Rieke Grading", rieke, 1.75],
  ["JCR Excavating", jcr, 2.6],
  ["Fireball Construction", fireball, 1.49],
  ["DW Companies", dw, 1.63],
  ["Midwest Erosion Specialists", midwest, 4.03],
];
export function Logos({ area = 1450 }: { area?: number }) {
  return (
    <div className="pp-logos">
      <span className="pp-logos-k">Used by</span>
      <ul>
        {LOGOS.map(([name, src, a]) => {
          const h = Math.round(Math.sqrt(area / a));
          return (
            <li key={name}>
              <img src={src} alt={name} height={h} width={Math.round(h * a)} style={{ height: `calc(${h}px * var(--logo-k, 1))` }} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── header ─────────────────────────────────────────────────────────────────────
export function Header({ showCta, openSignup }: { showCta: boolean; openSignup: OpenSignup }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`pp-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="pp-wrap pp-header-in">
        <a href="#top" className="pp-logo" aria-label="SmartCrew, back to top">
          <img src={logoUrl} alt="SmartCrew" width={143} height={20} />
        </a>
        <button type="button" className={`pp-btn pp-btn-dark pp-btn-sm pp-header-cta${showCta ? " is-on" : ""}`} tabIndex={showCta ? 0 : -1} aria-hidden={!showCta} onClick={() => openSignup({ intent: "trial", source: "header" })}>
          Get my free trial
        </button>
      </div>
    </header>
  );
}

// ─── S1 hero ────────────────────────────────────────────────────────────────────
export function Hero({ angle, openSignup, ctaRef }: { angle: Angle; openSignup: OpenSignup; ctaRef: RefObject<HTMLButtonElement | null> }) {
  const a = ANGLES[angle];
  return (
    <section className="p-sec ph" id="top" aria-labelledby="ph-h">
      <div className="pp-wrap ph-grid">
        <div className="ph-copy">
          <p className="ph-eyebrow">For dirt work contractors with {T.SIZE} employees</p>
          <h1 className="ph-h1" id="ph-h">
            {a.h1}
          </h1>
          <p className="ph-sub">{a.sub}</p>
          <div className="ph-ctas">
            <button ref={ctaRef} type="button" className="pp-btn pp-btn-dark pp-btn-lg" onClick={() => openSignup({ intent: "trial", source: "hero" })}>
              Get my free trial
            </button>
            <button type="button" className="pp-textlink" onClick={() => openSignup({ intent: "demo", source: "hero" })}>
              or book a demo with Andrew
            </button>
          </div>
          <Micro />
          <Logos />
        </div>
      </div>
      <HeroVisual />
    </section>
  );
}

function HeroVisual() {
  const [ref, box] = useBox<HTMLDivElement>();
  const W = box.w;
  const H = box.h;
  let inner = null;
  if (W > 0 && H > 0) {
    const narrow = W < 600;
    // laptop: the office window sits back-right, the crew phone in front-left (field → office)
    const fx = narrow ? 120 : 130;
    const fy = narrow ? 376 : 96;
    const s = narrow ? W / 700 : Math.min(0.78, (W - 70) / 960);
    const winLeft = narrow ? 0 : 70;
    const winTop = narrow ? 0 : Math.round(H * 0.07);
    const winH = narrow ? H - 30 : Math.min(H - winTop - 40, 470);
    const pw = narrow ? Math.round(W * 0.34) : Math.round(Math.min(250, Math.max(196, W * 0.29)));
    const pLeft = narrow ? W - pw - 4 : 0;
    const pTop = narrow ? Math.round(H * 0.24) : Math.round(H * 0.33);
    const mx = winLeft + (754 - fx) * s;
    const my = winTop + (428 - fy) * s;
    inner = (
      <>
        <Crop id="web-project-detail" x={fx} y={fy} s={s} className="ph-win" style={{ left: winLeft, top: winTop, width: W - winLeft + 60, height: winH }} animate={false} label="SmartCrew office app: job costing for Hwy 9 Culvert Replacement" />
        {!narrow && <Mark left={mx} top={my} label="Profit on Hwy 9, to date" delay={0} />}
        <div className="ph-phone" style={{ left: pLeft, top: pTop }}>
          <Phone id={narrow ? "phone-home" : "phone-working"} width={pw} animate={false} />
        </div>
      </>
    );
  }
  return (
    <div className="ph-visual" ref={ref}>
      {inner}
      <p className="ph-cap">Demo account. Names and numbers are made up.</p>
    </div>
  );
}

// ─── S2 proof ───────────────────────────────────────────────────────────────────
export function Proof() {
  return (
    <section className="p-sec pq" aria-label="What a customer says">
      <div className="pp-wrap pq-grid">
        <figure className="pq-photo">
          <img src={truckPhoto} alt="A dump truck unloading fill on a dirt work job" />
          <figcaption>
            <Ph>Photo of Phil or the Drish crew and yard goes here. This one is a stand-in.</Ph>
          </figcaption>
        </figure>
        <blockquote className="pq-quote">
          <p>
            <span className="pq-mark">“</span>SmartCrew is literally saving us ~$150k per YEAR in profit. Highest ROI of any software we’ve ever bought. I cannot believe we didn’t start using this sooner.”
          </p>
          <footer>
            <cite>Phil Drish, Drish Construction</cite>
            <Ph note="Placeholder for Andrew: approve the disclosure wording">Drish Construction is Andrew’s family’s dirt work company, where SmartCrew started.</Ph>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

// ─── S3 the leak + calculator ───────────────────────────────────────────────────
export function Leak({ openSignup }: { openSignup: OpenSignup }) {
  return (
    <section className="p-sec pl" id="numbers" aria-labelledby="pl-h">
      <div className="pp-wrap pl-grid">
        <div className="pl-copy">
          <h2 className="pp-h2" id="pl-h">
            You’re losing margin on every job. You just don’t know it yet.
          </h2>
          <p className="pp-body">
            Time tracking in one app. Job costs in spreadsheets. Hauling logs in paper folders. Receipts in texts. Payroll re-entered into QuickBooks. By the time the numbers are clean, the job is already over.
          </p>
        </div>
        <Calculator openSignup={openSignup} />
      </div>
    </section>
  );
}

// ─── S4 your crew will use it ───────────────────────────────────────────────────
const STEPS: { id: string; x: number; y: number; s: number; t: string; d: string; ring?: [number, number, number, number] }[] = [
  { id: "phone-home", x: 27, y: 262, s: 0.66, t: "Clock in", d: "Start the shift with one tap." },
  { id: "phone-select-task", x: 9, y: 440, s: 0.6, t: "Select your task", d: "Pick the job and the task. Switch anytime." },
  { id: "phone-working", x: 27, y: 362, s: 0.66, t: "Clock out", d: "End the day with one tap." },
];

export function Crew() {
  return (
    <section className="p-sec pw" aria-labelledby="pw-h">
      <div className="pp-wrap pw-grid">
        <div className="pw-copy">
          <h2 className="pp-h2" id="pw-h">
            No training. Your crew taps Clock In, picks the task and goes to work.
          </h2>
          <ul className="pw-facts">
            <li>Designed for simplicity. No training needed. Just open the app and go.</li>
            <li>It runs in the background without draining batteries or being shut down by accident.</li>
            <li>No data is shared, so your crew doesn’t have to worry about privacy.</li>
            <li>Most crews are up and running within minutes.</li>
            <li>
              <Ph>GPS only runs while they’re on the clock.</Ph>
            </li>
          </ul>
        </div>
        <ol className="pw-steps">
          {STEPS.map((st, i) => (
            <li key={st.id} className="pw-step">
              <Crop id={st.id} x={st.x} y={st.y} s={st.s} className="pw-shot" animate={false} />
              <p className="pw-t">
                {i < 2 && <span className="pw-arrow" aria-hidden="true">→</span>}
                <strong>{st.t}</strong>
                <span>{st.d}</span>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── S5 the feature system ──────────────────────────────────────────────────────
export function Features({ initial }: { initial: MomentId }) {
  return (
    <section className="p-sec pf" id="what-it-does" aria-labelledby="pf-h">
      <div className="pp-wrap">
        <div className="pf-top">
          <h2 className="pp-h2" id="pf-h">
            Your crew enters it once. The office sees it on the job.
          </h2>
          <p className="pf-count">
            {FEATURE_COUNT} things SmartCrew does, in {MOMENTS_COUNT} moments of one normal day. Tap a moment.
          </p>
        </div>
        <Moments initial={initial} />
      </div>
    </section>
  );
}
const MOMENTS_COUNT = 7;

// ─── S6 the Founding Member trial ──────────────────────────────────────────────
export function Offer({ openSignup }: { openSignup: OpenSignup }) {
  return (
    <section className="p-sec po" id="trial" aria-labelledby="po-h">
      <div className="pp-wrap">
        <div className="po-card">
          <div className="po-head">
            <div>
              <h2 className="pp-h2" id="po-h">
                The Founding Member trial
              </h2>
              <p className="po-for">For dirt work contractors with {T.SIZE} employees.</p>
            </div>
            <p className="po-why">
              <Ph>Why free? We’re setting up our first dirt work companies by hand, and we want them running SmartCrew on real jobs and telling us what to fix.</Ph>
            </p>
          </div>
          <div className="po-body">
            <div className="po-col">
              <h3 className="po-k">What you get</h3>
              <ul className="po-list">
                <li>Everything in SmartCrew: the crew app and the office app.</li>
                <li>Set up with you within a few days, tailored to how you work.</li>
                <li>Your crew on it with no training.</li>
                <li>The founder on your call.</li>
                <li>Real people on support, by phone, chat or email.</li>
                <li>No contract. Cancel anytime.</li>
              </ul>
            </div>
            <div className="po-col po-col-r">
              <h3 className="po-k">What it takes from you</h3>
              <p className="po-ask">One {T.N}-minute call with Andrew.</p>
              <p className="po-price">Price depends on the features and your crew size. Andrew covers it on the call.</p>
              <h3 className="po-k po-k2">What happens when you tap the button</h3>
              <ol className="po-steps">
                <li>Tell us about your company. Less than a minute.</li>
                <li>Pick a time with Andrew. {T.N} minutes.</li>
                <li>He sets up your trial around how you work. Most companies are fully set up within a few days.</li>
              </ol>
              <div className="po-guar">
                <Ph>Crew Uses It Guarantee: if your crew isn’t clocking in within your first 30 paid days, we refund that month.</Ph>
              </div>
            </div>
          </div>
          <div className="po-foot">
            <div className="po-sizes">
              <p className="po-ask-s" id="po-ask">
                How big is your crew?
              </p>
              <div className="pp-sizes-row" role="group" aria-labelledby="po-ask">
                {SIZES.map((s) => (
                  <button key={s} type="button" className="pp-size" onClick={() => openSignup({ intent: "trial", source: "s6", size: s })}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="po-go">
              <button type="button" className="pp-btn pp-btn-dark pp-btn-lg" onClick={() => openSignup({ intent: "trial", source: "s6" })}>
                Get my free trial
              </button>
              <Micro />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── S7 Andrew ──────────────────────────────────────────────────────────────────
export function Founder({ openSignup }: { openSignup: OpenSignup }) {
  return (
    <section className="p-sec pa" id="andrew" aria-labelledby="pa-h">
      <div className="pp-wrap pa-grid">
        <figure className="pa-photo">
          <img src={andrewPhoto} alt="Andrew Drish, founder of SmartCrew" />
          <figcaption>
            <Ph>A real photo of Andrew on a job site, in the shop or in a truck. This is his existing portrait.</Ph>
          </figcaption>
        </figure>
        <div className="pa-copy">
          <h2 className="pp-h2" id="pa-h">
            No sales team. No BDR. Just Andrew.
          </h2>
          <div className="pa-letter">
            <p>
              “When I was 13, I started working for my dad in our small, family construction business. The first day, he put me in a trench, handed me a shovel and said, ‘Son – I’m gonna teach you how to run a shovel this summer so you learn that you don’t want to spend the rest of your life doing this.’
            </p>
            <p>It was the worst summer of my life… and the most important gift of my life. Because it taught me to value working hard AND smart. That led me to spending 20 years in the tech world where I built, invested in and advised three of the fastest growing tech companies in America, according to Inc Magazine.”</p>
          </div>
          <div className="pa-sign">
            <img src={signature} alt="Andrew’s signature" width={138} height={36} />
            <span className="pa-name">
              <strong>Andrew Drish</strong>
              <span>Founder</span>
            </span>
            <Ph>Featured speaker, CONEXPO-CON/AGG 2026 Small Business Day</Ph>
          </div>
          <div className="pa-go">
            <button type="button" className="pp-btn pp-btn-outline" onClick={() => openSignup({ intent: "demo", source: "founder" })}>
              Book a demo with Andrew
            </button>
            <p className="pa-promise">“I’ll show you exactly how we fit into your operation, or tell you honestly if we don’t.”</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── S8 FAQ ─────────────────────────────────────────────────────────────────────
const FAQ: { id: string; q: string; a: ReactNode }[] = [
  {
    id: "why-call",
    q: "Why do I need a call to get the free trial?",
    a: <Ph>Because we set your trial up around how you already work. On the call, Andrew shows you how SmartCrew fits your company, or tells you honestly if it doesn’t, and sets up your Founding Member trial.</Ph>,
  },
  { id: "cost", q: "How much does it cost?", a: "It depends on the features and your crew size. Andrew gives you exact numbers on the call. No contracts." },
  { id: "crew", q: "Is my crew going to hate using it?", a: "Probably not. Clocking in is one tap, and most crews are up and running within minutes." },
  { id: "tracked", q: "Will my guys feel tracked? Will it kill their batteries?", a: "No. The app runs in the background without draining batteries or being shut down by accident, and no data is shared, so your crew doesn’t have to worry about privacy." },
  { id: "qb", q: "Does it work with QuickBooks?", a: "Yes, for payroll. The hours your crew logs go to QuickBooks, so nobody types them twice. Andrew shows you how it works with your setup on the call." },
  { id: "setup", q: "How fast can we get set up?", a: "Most companies are fully set up within a few days. We’ll walk you through onboarding and make sure your account is tailored to your exact workflow." },
  { id: "cancel", q: "What if I want to cancel?", a: "You can cancel anytime. No contracts. No hassle." },
  { id: "support", q: "Who do I call if something breaks?", a: "A real person. We don’t automate or outsource our support, so you can always reach a real live human by phone, chat or email." },
];

export function Faq() {
  const [open, setOpen] = useState<string | null>("why-call");
  const reduce = useReducedMotion();
  return (
    <section className="p-sec pz" id="faq" aria-labelledby="pz-h">
      <div className="pp-wrap pz-grid">
        <div className="pz-side">
          <h2 className="pp-h2" id="pz-h">
            Questions contractors ask Andrew
          </h2>
          <figure className="pz-katie">
            <Ph note="Placeholder for Andrew: JW or JCR Excavating, and permission">
              <blockquote>“I’ve searched for this EXACT software for 10 YEARS! It’s completely changed our business.”</blockquote>
              <figcaption>Katie, JW Excavating</figcaption>
            </Ph>
          </figure>
        </div>
        <ul className="pz-list">
          {FAQ.map((f) => {
            const on = open === f.id;
            return (
              <li key={f.id} className={`pz-item${on ? " is-on" : ""}`}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`pz-${f.id}`}
                    onClick={() => {
                      setOpen(on ? null : f.id);
                      if (!on) track("faq_open", { faq_id: f.id });
                    }}
                  >
                    <span>{f.q}</span>
                    <i aria-hidden="true" />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div id={`pz-${f.id}`} className="pz-a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.24, ease: [0.23, 1, 0.32, 1] }}>
                      <div className="pz-a-in">{f.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ─── S10 footer ─────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="p-sec pfoot">
      <div className="pp-wrap">
        <div className="pfoot-block">
          <div className="pfoot-cell pfoot-brand">
            <img src={logoWhiteUrl} alt="SmartCrew" width={143} height={20} />
            <span>Software for dirt work contractors with {T.SIZE} employees.</span>
          </div>
          <div className="pfoot-cell">
            <span className="pfoot-k">Contact</span>
            <a href={`mailto:${T.EMAIL}`}>{T.EMAIL}</a>
            <Ph>Andrew’s business number</Ph>
          </div>
          <div className="pfoot-cell">
            <span className="pfoot-k">Legal</span>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
          <div className="pfoot-cell">
            <span className="pfoot-k">Customers</span>
            <a href="https://smart-crew-app.web.app/">Log in</a>
            <span>© 2026 SmartCrew</span>
          </div>
        </div>
        <div className="pfoot-notes">
          <h2 className="pfoot-k">Notes</h2>
          <ol>
            <li>busybusy, QB Time, ExactTime, fleet.io, HubSpot, Close, Dropbox, Google Drive, Slack, WhatsApp and QuickBooks are trademarks of their owners. SmartCrew isn’t affiliated with them.</li>
            <li>Product screens show a demo account. Names and numbers are made up.</li>
          </ol>
        </div>
      </div>
    </footer>
  );
}

// ─── phone sticky bar + "finish" pill ───────────────────────────────────────────
export function StickyBar({ show, openSignup }: { show: boolean; openSignup: OpenSignup }) {
  return (
    <div className={`pp-sticky${show ? " is-on" : ""}`} aria-hidden={!show}>
      <p>
        <strong>{T.PROGRAM}</strong>
        <span>Starts with a call with Andrew</span>
      </p>
      <button type="button" className="pp-btn pp-btn-dark" tabIndex={show ? 0 : -1} onClick={() => openSignup({ intent: "trial", source: "sticky" })}>
        Get my free trial
      </button>
    </div>
  );
}

export function FinishPill({ show, onOpen }: { show: boolean; onOpen: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button type="button" className="pp-pill" onClick={onOpen} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
          Finish claiming your trial
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function useInView<T extends Element>(ref: RefObject<T | null>, threshold = 0) {
  const [v, setV] = useState(true);
  const seen = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setV(e.isIntersecting);
        if (e.isIntersecting && !seen.current) {
          seen.current = true;
        }
      },
      { threshold, rootMargin: "-64px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return v;
}
