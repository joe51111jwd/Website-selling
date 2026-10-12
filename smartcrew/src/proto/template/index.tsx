import "@fontsource-variable/archivo/wdth.css";
import "./base.css";
import "./sections.css";
import "./features.css";
import "./popup.css";
import "./replace.css";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import ScreenWindow from "./ScreenWindow";
import FeatureSystem, { useCompact } from "./FeatureSystem";
import Calculator from "./Calculator";
import Replace from "./Replace";
import Popup from "./Popup";
import { track } from "./track";
import { SIZES, T, type SignupRequest } from "./types";
import { featuredProject } from "../../screens/data";
import { money } from "../../screens/kit/format";

import logoUrl from "./assets/brand/logo.svg";
import logoWhiteUrl from "./assets/brand/logo-white.svg";
import drish from "./assets/logos/drish.png";
import rieke from "./assets/logos/rieke.png";
import jcr from "./assets/logos/jcr.png";
import fireball from "./assets/logos/fireball.png";
import dw from "./assets/logos/dw.png";
import midwest from "./assets/logos/midwest.png";
import yardPhoto from "./assets/photos/mortier-dump-truck.jpg";
import andrewPhoto from "./assets/andrew/andrew-cutout.png";
import signature from "./assets/andrew/signature.png";

// ─────────────────────────────────────────────────────────────────────────────
// Message match: ?angle= swaps the H1/sub, the hero screen and the open feature group
// (PLAYBOOK §2.0.5). Unknown or missing values fall back to `profit`.
// ─────────────────────────────────────────────────────────────────────────────

type Angle = "profit" | "overbudget" | "timecards" | "payroll" | "replace";
const ANGLES: Record<Angle, { h1: string; sub: string; screen: string; group: "profit" | "hours" }> = {
  profit: {
    h1: "See what every job is making, every day.",
    sub: "GPS fills in your crew’s timecards and tags every hour to the right job. You see each job’s profit daily, in time to fix it.",
    screen: "web-project-detail",
    group: "profit",
  },
  overbudget: {
    h1: "Know which jobs are losing money before it’s too late.",
    sub: "SmartCrew rolls your crew’s hours, machine time and materials into a profit number for every job, updated daily.",
    screen: "web-project-detail",
    group: "profit",
  },
  timecards: {
    h1: "Stop chasing timecards.",
    sub: "Hours log themselves when your crew gets to the job, tagged to the right cost code and ready for QuickBooks payroll.",
    screen: "web-timecards",
    group: "hours",
  },
  payroll: {
    h1: "Payroll without the Friday scramble.",
    sub: "Hours log themselves when your crew gets to the job, tagged to the right cost code and ready for QuickBooks payroll.",
    screen: "web-timecards",
    group: "hours",
  },
  replace: {
    h1: "Replace your time app, your spreadsheets and the group texts.",
    sub: "SmartCrew puts the crew, the machines and the job costs in one app, with QuickBooks integration for payroll.",
    screen: "web-project-detail",
    group: "profit",
  },
};

function readAngle(): Angle {
  try {
    const a = new URLSearchParams(location.search).get("angle") as Angle | null;
    return a && a in ANGLES ? a : "profit";
  } catch {
    return "profit";
  }
}

const LOGOS = [
  { src: drish, name: "Drish Construction", h: 30 },
  { src: rieke, name: "Rieke Grading", h: 30 },
  { src: jcr, name: "JCR Excavating", h: 22 },
  { src: fireball, name: "Fireball Construction", h: 34 },
  { src: dw, name: "DW Companies", h: 30 },
  { src: midwest, name: "Midwest Erosion Specialists", h: 22 },
];

export default function Template() {
  const angle = useRef(readAngle()).current;
  const A = ANGLES[angle];
  const [req, setReq] = useState<SignupRequest | null>(null);
  const [resume, setResume] = useState(false);
  const [heroCtaOut, setHeroCtaOut] = useState(false);
  const [closerIn, setCloserIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroCta = useRef<HTMLDivElement>(null);
  const closerCta = useRef<HTMLDivElement>(null);

  // the page owns the document while it’s mounted: no UA margin, warm ground behind overscroll
  useLayoutEffect(() => {
    const b = document.body.style;
    const h = document.documentElement.style;
    const prev = [b.margin, b.background, h.background, h.scrollPaddingTop];
    b.margin = "0";
    b.background = "#FCFAF8";
    h.background = "#FCFAF8";
    h.scrollPaddingTop = "64px";
    document.title = "SmartCrew · Software for dirt work contractors";
    return () => {
      [b.margin, b.background, h.background, h.scrollPaddingTop] = prev;
    };
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.target === heroCta.current) setHeroCtaOut(!e.isIntersecting && e.boundingClientRect.top < 0);
          if (e.target === closerCta.current) setCloserIn(e.isIntersecting);
        }),
      { threshold: 0 },
    );
    if (heroCta.current) io.observe(heroCta.current);
    if (closerCta.current) io.observe(closerCta.current);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    track("page_view", { angle });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [angle]);

  const open = useCallback((r: SignupRequest) => {
    track("cta_click", { source: r.source, intent: r.intent, size_prefilled: !!r.size });
    setResume(false);
    setReq(r);
  }, []);

  const onClose = useCallback((unfinished: boolean) => {
    setReq(null);
    setResume(unfinished);
  }, []);

  return (
    <div className="p-template">
      <header className={`hdr ${scrolled ? "is-scrolled" : ""}`}>
        <div className="hdr-in">
          <a href="#top" aria-label="SmartCrew, back to top" className="focusable">
            <img className="logo" src={logoUrl} alt="SmartCrew" width={150} height={21} />
          </a>
          <button type="button" className={`btn btn-dark btn-sm hdr-cta ${heroCtaOut && !req ? "is-on" : ""}`} tabIndex={heroCtaOut ? 0 : -1} onClick={() => open({ intent: "trial", source: "header" })}>
            Get my free trial
          </button>
        </div>
      </header>

      <main id="top">
        <Hero A={A} angle={angle} onCta={open} ctaRef={heroCta} />
        <Proof />
        <Leak onCta={open} />
        <Crew />
        <FeatureSystem initialGroup={A.group} />
        <Offer onCta={open} />
        <Founder onCta={open} />
        <Faq />
        <Replace onCta={open} ctaRef={closerCta} />
      </main>
      <Footer />

      <div className={`sbar ${heroCtaOut && !closerIn && !req ? "is-on" : ""}`} aria-hidden={!heroCtaOut || closerIn || !!req}>
        <p className="sbar-text">
          <b>{T.PROGRAM}</b>
          Starts with a call with Andrew
        </p>
        <button type="button" className="btn btn-dark" tabIndex={heroCtaOut && !closerIn ? 0 : -1} onClick={() => open({ intent: "trial", source: "sticky" })}>
          Get my free trial
        </button>
      </div>

      <AnimatePresence>
        {resume && !req && (
          <motion.button
            type="button"
            className="resume focusable"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
            onClick={() => open({ intent: "trial", source: "resume" })}
          >
            <i aria-hidden />
            Finish claiming your trial
          </motion.button>
        )}
      </AnimatePresence>

      <Popup req={req} onClose={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S1 Hero
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ A, angle, onCta, ctaRef }: { A: (typeof ANGLES)[Angle]; angle: Angle; onCta: (r: SignupRequest) => void; ctaRef: React.RefObject<HTMLDivElement | null> }) {
  const p = featuredProject;
  const timecards = A.screen === "web-timecards";
  return (
    <section className="sec hero" aria-labelledby="hero-h" data-angle={angle}>
      <div className="hero-copy">
        <p className="hero-eyebrow">For dirt work contractors with {T.SIZE} employees</p>
        <h1 className="h1" id="hero-h">
          {A.h1}
        </h1>
        <p className="lead hero-sub">{A.sub}</p>
        <div className="hero-cta" ref={ctaRef}>
          <div className="hero-cta-row">
            <button type="button" className="btn btn-dark btn-lg" onClick={() => onCta({ intent: "trial", source: "hero" })}>
              Get my free trial
            </button>
            <button type="button" className="link hero-demo" onClick={() => onCta({ intent: "demo", source: "hero" })}>
              or book a demo with Andrew
            </button>
          </div>
          <p className="hero-micro">
            {T.PROGRAM}. Starts with a {T.N}-minute call with Andrew. No contract, cancel anytime.
          </p>
        </div>
        <div className="usedby">
          <p className="usedby-label">Used by</p>
          <ul className="usedby-row">
            {LOGOS.map((l) => (
              <li key={l.name}>
                <img src={l.src} alt={l.name} style={{ height: l.h }} loading="eager" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="hero-vis">
        <ScreenWindow
          id={A.screen}
          animate={false}
          className="hero-web"
          focus={timecards ? { x: 330, y: 92, w: 1040 } : { x: 132, y: 100, w: 1010 }}
          callout={timecards ? { x: 612, y: 332, label: "This week’s hours, per person", side: "below" } : { x: 676, y: 436, label: `Profit on ${p.name}, today`, side: "below" }}
          label={timecards ? "SmartCrew office app: this week’s timecards" : `SmartCrew office app: ${p.name}, revenue ${money(p.revenue)}, profit ${money(p.profit)}`}
        />
        <ScreenWindow id="phone-home" animate={false} className="hero-phone" focus={{ x: 0, y: 0 }} callout={{ x: 262, y: 472, label: "One tap to clock in", side: "right" }} label="SmartCrew crew app: ready to clock in" />
        <p className="hero-note caption">Demo account. Names and numbers are made up.</p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S2 Proof from a dirt work family
// ─────────────────────────────────────────────────────────────────────────────

function Ph({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`ph-tag ${className}`}>{children}</span>;
}

function Proof() {
  return (
    <section className="sec proof" aria-label="What a customer says">
      <figure className="proof-photo ph">
        <img src={yardPhoto} alt="An articulated dump truck hauling dirt across a site" loading="lazy" />
        <Ph className="ph-abs proof-ph">Placeholder for Andrew: a photo of Phil or the Drish crew and yard</Ph>
      </figure>
      <figure className="proof-quote">
        <blockquote>
          <p>
            <span className="hang">“</span>SmartCrew is literally saving us ~$150k per YEAR in profit. Highest ROI of any software we’ve ever bought. I cannot believe we didn’t start using this sooner.”
          </p>
        </blockquote>
        <figcaption>
          <b>Phil Drish</b>, Drish Construction
          <span className="proof-disc">Drish Construction is Andrew’s family’s dirt work company, where SmartCrew started.</span>
        </figcaption>
      </figure>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S3 The leak: problem + "Run your own numbers"
// ─────────────────────────────────────────────────────────────────────────────

function Leak({ onCta }: { onCta: (r: SignupRequest) => void }) {
  return (
    <section className="sec leak" aria-labelledby="leak-h">
      <div className="leak-copy">
        <h2 className="h2" id="leak-h">
          You’re losing margin on every job. You just don’t know it yet.
        </h2>
        <p className="body leak-p">
          Time tracking in one app. Job costs in spreadsheets. Hauling logs in paper folders. Receipts in texts. Payroll re-entered into QuickBooks. By the time the numbers are clean, the job is already over.
        </p>
      </div>
      <Calculator onCta={onCta} />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S4 Your crew will use it
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "phone-home", label: "Clock in", glyph: "in", focus: { x: 0, y: 40 }, compact: { x: 0, y: 236 } },
  { id: "phone-select-task", label: "Select your task", glyph: "task", focus: { x: 0, y: 200 }, compact: { x: 0, y: 424 } },
  { id: "phone-working", label: "Clock out", glyph: "out", focus: { x: 0, y: 212 }, compact: { x: 0, y: 262 } },
];

function Glyph({ k }: { k: string }) {
  if (k === "in") return <span className="glyph glyph-in" aria-hidden />;
  if (k === "task")
    return (
      <svg className="glyph" viewBox="0 0 12 12" aria-hidden>
        <path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return <span className="glyph glyph-out" aria-hidden />;
}

function Crew() {
  const [step, setStep] = useState(0);
  const compact = useCompact();
  return (
    <section className="sec crew" aria-labelledby="crew-h">
      <div className="crew-copy">
        <h2 className="h2" id="crew-h">
          No training. Your crew taps Clock In, picks the task and goes to work.
        </h2>
        <ul className="crew-facts">
          <li>Designed for simplicity. No training needed. Just open the app and go.</li>
          <li>It runs in the background without draining batteries or being shut down by accident.</li>
          <li>No data is shared, so your crew doesn’t have to worry about privacy.</li>
          <li>Most crews are up and running within minutes.</li>
          <li className="crew-ph">
            <span className="ph">GPS only runs while they’re on the clock.</span> <Ph>Placeholder for Andrew: confirm</Ph>
          </li>
        </ul>
      </div>

      <div className="crew-steps">
        <div className="crew-tabs" role="tablist" aria-label="The three taps">
          {STEPS.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={step === i} className={`crew-tab ${step === i ? "is-on" : ""}`} onClick={() => setStep(i)}>
              <Glyph k={s.glyph} />
              {s.label}
            </button>
          ))}
        </div>
        <ol className="crew-phones">
          {STEPS.map((s, i) => (
            <li key={s.id} className={`crew-phone ${step === i ? "is-on" : ""}`}>
              <p className="crew-cap">
                <Glyph k={s.glyph} />
                <span>{s.label}</span>
                {i < STEPS.length - 1 && <span className="crew-then" aria-hidden />}
              </p>
              <ScreenWindow id={s.id} focus={compact ? s.compact : s.focus} animate={false} className="crew-win" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S6 The Founding Member trial: what you get, what it takes, what happens next
// ─────────────────────────────────────────────────────────────────────────────

function Offer({ onCta }: { onCta: (r: SignupRequest) => void }) {
  // phone only: "what you get" and "what happens next" swap in place (PLAYBOOK §2.0.1)
  const [tab, setTab] = useState<"get" | "extras" | "next">("get");
  return (
    <section className="sec offer" aria-labelledby="offer-h">
      <div className="wo">
        <div className="wo-head">
          <div>
            <h2 className="h2" id="offer-h">
              The {T.PROGRAM}
            </h2>
            <p className="body wo-for">For dirt work contractors with {T.SIZE} employees. Andrew sets it up with you.</p>
          </div>
          <div className="wo-asym" aria-label="What it takes from you">
            <span className="wo-asym-k">What it takes from you</span>
            <span className="wo-asym-v">
              One {T.N}-minute call with Andrew.
            </span>
          </div>
        </div>

        <div className="wo-tabs" role="tablist" aria-label="Founding Member trial details">
          <button type="button" role="tab" aria-selected={tab === "get"} className={tab === "get" ? "is-on" : ""} onClick={() => setTab("get")}>
            What you get
          </button>
          <button type="button" role="tab" aria-selected={tab === "extras"} className={tab === "extras" ? "is-on" : ""} onClick={() => setTab("extras")}>
            Extras
          </button>
          <button type="button" role="tab" aria-selected={tab === "next"} className={tab === "next" ? "is-on" : ""} onClick={() => setTab("next")}>
            Next steps
          </button>
        </div>
        <div className={`wo-grid wo-tab-${tab}`}>
          <div className="wo-col wo-col-get">
            <h3 className="wo-k">What you get</h3>
            <ul className="wo-list">
              <li>Everything in SmartCrew: the crew app and the office app.</li>
              <li>Set up with you within a few days, tailored to how you work.</li>
              <li>Your crew on it with no training.</li>
              <li>The founder on your call. No sales team. No BDR. Just Andrew.</li>
              <li>Real people on support, by phone, chat or email.</li>
              <li>No contract. Cancel anytime.</li>
            </ul>
            <p className="wo-price">
              <b>Price:</b> depends on the features and your crew size. Andrew covers it on the call.
            </p>
          </div>

          <div className="wo-col wo-col-ph wo-col-extras">
            <h3 className="wo-k">
              Founding members also get <Ph>Placeholder for Andrew</Ph>
            </h3>
            <div className="ph wo-ph">
              <ul className="wo-list wo-list-ph">
                <li>
                  <b>A founding rate</b>, locked for as long as you stay.
                </li>
                <li>
                  <b>The Crew Uses It guarantee.</b> If your crew isn’t clocking in within your first 30 paid days, we refund that month.
                </li>
              </ul>
              <p className="wo-why">
                <b>Why free?</b> We’re setting up our first dirt work companies by hand, and we want them running SmartCrew on real jobs and telling us what to fix.
              </p>
            </div>
          </div>

          <div className="wo-col wo-col-next">
            <h3 className="wo-k wo-k-next">What happens when you tap the button</h3>
            <ol className="wo-steps">
              <li>
                <span className="wo-n tnum">1</span>Tell us about your company. Less than a minute.
              </li>
              <li>
                <span className="wo-n tnum">2</span>Pick a time with Andrew. {T.N} minutes.
              </li>
              <li>
                <span className="wo-n tnum">3</span>He sets up your trial around how you work. Most companies are fully set up within a few days.
              </li>
            </ol>
            <div className="wo-cta">
              <button type="button" className="btn btn-light btn-lg" onClick={() => onCta({ intent: "trial", source: "s6" })}>
                Get my free trial
              </button>
              <p className="wo-ask" id="wo-ask">
                How big is your crew?
              </p>
              <div className="wo-chips" role="group" aria-labelledby="wo-ask">
                {SIZES.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => onCta({ intent: "trial", source: "s6_chip", size: s })}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S7 Andrew
// ─────────────────────────────────────────────────────────────────────────────

function Founder({ onCta }: { onCta: (r: SignupRequest) => void }) {
  return (
    <section className="sec founder" aria-labelledby="founder-h">
      <figure className="founder-photo ph">
        <img src={andrewPhoto} alt="Andrew Drish, founder of SmartCrew" loading="lazy" />
        <Ph className="ph-abs founder-ph">Placeholder for Andrew: a photo on a job site, in the shop or in a truck</Ph>
      </figure>
      <div className="founder-copy">
        <h2 className="h2" id="founder-h">
          Software for dirt work, built by a dirt work family.
        </h2>
        <div className="letter">
          <p>
            When I was 13, I started working for my dad in our small, family construction business. The first day, he put me in a trench, handed me a shovel and said, “Son – I’m gonna teach you how to run a shovel this summer so you learn that you don’t want to spend the rest of your life doing this.”
          </p>
          <p>
            It was the worst summer of my life… and the most important gift of my life. Because it taught me to value working hard AND smart. That led me to spending 20 years in the tech world where I built, invested in and advised three of the fastest growing tech companies in America, according to Inc Magazine.
          </p>
        </div>
        <div className="founder-sign">
          <img src={signature} alt="Andrew’s signature" width={139} height={37} />
          <p className="small">
            Andrew Drish, founder. Featured speaker, CONEXPO-CON/AGG 2026 Small Business Day.
          </p>
        </div>
        <div className="founder-promise">
          <p>
            “No sales team. No BDR. Just Andrew. I’ll show you exactly how we fit into your operation—or tell you honestly if we don’t.”
          </p>
          <button type="button" className="btn btn-light" onClick={() => onCta({ intent: "demo", source: "founder" })}>
            Book a demo with Andrew
          </button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S8 Questions contractors ask Andrew
// ─────────────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    id: "why-call",
    q: "Why do I need a call to get the free trial?",
    a: "Because we set your trial up around how you already work. On the call, Andrew shows you how SmartCrew fits your company, or tells you honestly if it doesn’t, and sets up your Founding Member trial.",
    ph: true,
  },
  { id: "cost", q: "How much does it cost?", a: "It depends on the features and your crew size. Andrew gives you exact numbers on the call. No contracts." },
  { id: "crew", q: "Is my crew going to hate using it?", a: "Probably not. Clocking in is one tap, and most crews are up and running within minutes." },
  {
    id: "tracked",
    q: "Will my guys feel tracked? Will it kill their batteries?",
    a: "No. It runs in the background without draining batteries or being shut down by accident, and no data is shared, so your crew doesn’t have to worry about privacy.",
  },
  {
    id: "qb",
    q: "Does it work with QuickBooks?",
    a: "Yes, for payroll. The hours your crew logs go to QuickBooks, so nobody types them twice. Andrew shows you how it works with your setup on the call.",
    note: 1,
  },
  { id: "setup", q: "How fast can we get set up?", a: "Most companies are fully set up within a few days. We’ll walk you through onboarding and make sure your account is tailored to your exact workflow." },
  { id: "cancel", q: "What if I want to cancel?", a: "You can cancel anytime. No contracts. No hassle." },
  { id: "support", q: "Who do I call if something breaks?", a: "A real person. We don’t automate or outsource our support, so you can always reach a real live human by phone, chat or email." },
];

function Faq() {
  const [open, setOpen] = useState("why-call");
  return (
    <section className="sec faq" aria-labelledby="faq-h">
      <div className="faq-side">
        <h2 className="h2" id="faq-h">
          Questions contractors ask Andrew
        </h2>
        <p className="body faq-sub">Anything else, ask him on the call. He’ll answer it straight.</p>
        <figure className="katie ph">
          <Ph className="ph-abs katie-ph">Placeholder for Andrew: JW or JCR Excavating? Permission?</Ph>
          <blockquote>“I’ve searched for this EXACT software for 10 YEARS! It’s completely changed our business.”</blockquote>
          <figcaption>Katie, JW Excavating</figcaption>
        </figure>
      </div>
      <ul className="faq-list">
        {FAQ.map((f) => {
          const on = open === f.id;
          return (
            <li key={f.id} className={`faq-item ${on ? "is-on" : ""}`}>
              <h3>
                <button
                  type="button"
                  className="faq-q focusable"
                  aria-expanded={on}
                  aria-controls={`faq-${f.id}`}
                  onClick={() => {
                    setOpen(on ? "" : f.id);
                    if (!on) track("faq_open", { faq_id: f.id });
                  }}
                >
                  <span>{f.q}</span>
                  <span className="faq-pm" aria-hidden />
                </button>
              </h3>
              <div className="faq-a" id={`faq-${f.id}`} role="region" hidden={!on}>
                <p>
                  {f.a}
                  {f.note && <sup className="fn">{f.note}</sup>}
                  {f.ph && (
                    <>
                      {" "}
                      <Ph>Placeholder for Andrew: add his own reason</Ph>
                    </>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S10 Footer: one plan-sheet title block + Notes
// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="ft">
      <div className="ft-in">
        <div className="tb" aria-label="SmartCrew contact and legal">
          <div className="tb-cell tb-brand">
            <img src={logoWhiteUrl} alt="SmartCrew" className="ft-logo" width={150} height={21} />
            <p>Software for dirt work contractors with {T.SIZE} employees.</p>
          </div>
          <div className="tb-cell">
            <span className="tb-k">Contact</span>
            <a href={`mailto:${T.EMAIL}`}>{T.EMAIL}</a>
            <span className="tb-ph">Andrew’s business number goes here</span>
          </div>
          <div className="tb-cell">
            <span className="tb-k">Legal</span>
            <span className="tb-links">
              <a href="#privacy" onClick={(e) => e.preventDefault()}>
                Privacy
              </a>
              <a href="#terms" onClick={(e) => e.preventDefault()}>
                Terms
              </a>
              <a href="#login" onClick={(e) => e.preventDefault()}>
                Log in
              </a>
            </span>
          </div>
          <div className="tb-cell tb-sheet">
            <span className="tb-k">Sheet</span>
            <span>© 2026 SmartCrew</span>
          </div>
        </div>
        <div className="notes">
          <h2 className="notes-h">Notes</h2>
          <ol>
            <li>QuickBooks integration for payroll. Andrew confirms how it works with your QuickBooks setup on the call.</li>
            <li>Product screens use a demo account. Names and numbers are made up.</li>
            <li>busybusy, QB Time, ExactTime, fleet.io, HubSpot, Close, Dropbox, Google Drive, Slack, WhatsApp and QuickBooks are trademarks of their owners. SmartCrew isn’t affiliated with them.</li>
          </ol>
        </div>
      </div>
    </footer>
  );
}
