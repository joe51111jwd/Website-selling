import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { SIZES, T, type OpenSignup } from "./data";
import { Crop, Phone, useBox } from "./Shots";

// S9, Andrew's "replace 5 apps" closer and the page's one story moment (AISMELL M2).
// Before: the five apps (named in plain text, no logos) plus the paper timecard. After: one
// SmartCrew office window and the crew phone, with QuickBooks still connected for payroll.
// Laptop: a short sticky scrub (under one viewport of scroll). Touch or reduced motion: a toggle.

const ROWS: [string, string, string][] = [
  ["Time tracking app", "busybusy, QB Time, ExactTime", "GPS time tracking app"],
  ["Fleet app", "fleet.io", "Equipment, shop queue and DOT"],
  ["CRM", "HubSpot, Close", "Sales pipeline and bids"],
  ["Storage", "Dropbox, Google Drive", "Project docs in your pocket"],
  ["Group chat", "Slack, WhatsApp", "Crew messaging"],
];

type Card = { k: string; title: string; names: string; x: number; y: number; r: number; body: ReactNode };

const CARDS: Card[] = [
  {
    k: "time",
    title: "Time tracking app",
    names: "busybusy · QB Time · ExactTime",
    x: 0.02,
    y: 0.06,
    r: -3,
    body: (
      <ul className="pr-lines">
        <li><span>Marcus B.</span><b>9h 10m</b></li>
        <li><span>Elena R.</span><b>8h 52m</b></li>
        <li><span>Jake L.</span><b>missing</b></li>
      </ul>
    ),
  },
  {
    k: "fleet",
    title: "Fleet app",
    names: "fleet.io",
    x: 0.5,
    y: 0.02,
    r: 2.5,
    body: (
      <ul className="pr-lines">
        <li><span>Truck 1102</span><b>service due</b></li>
        <li><span>CAT D6</span><b>in the shop</b></li>
      </ul>
    ),
  },
  {
    k: "crm",
    title: "CRM",
    names: "HubSpot · Close",
    x: 0.64,
    y: 0.4,
    r: -2,
    body: (
      <ul className="pr-lines">
        <li><span>Hollis Co. culverts</span><b>$268,500</b></li>
        <li><span>Lot 7 site prep</span><b>bid sent</b></li>
      </ul>
    ),
  },
  {
    k: "files",
    title: "Storage",
    names: "Dropbox · Google Drive",
    x: 0.06,
    y: 0.56,
    r: 2,
    body: (
      <ul className="pr-lines pr-files">
        <li>Hwy9_plans_rev3.pdf</li>
        <li>Hwy9_plans_rev3 (1).pdf</li>
      </ul>
    ),
  },
  {
    k: "chat",
    title: "Group chat",
    names: "Slack · WhatsApp",
    x: 0.37,
    y: 0.62,
    r: -1.5,
    body: (
      <div className="pr-chat">
        <span className="in">Where are we today?</span>
        <span className="out">Hwy 9. Bring the 320.</span>
        <span className="in">Who has the receipt?</span>
      </div>
    ),
  },
  {
    k: "paper",
    title: "Paper timecard",
    names: "rewritten every Friday",
    x: 0.3,
    y: 0.26,
    r: 4,
    body: (
      <div className="pr-paper">
        <span>Mon 7:00 – 3:30</span>
        <span>Tue 7:00 – 4:00</span>
        <span>Wed 6:30 – ?</span>
      </div>
    ),
  },
];

function CardView({ c, p, i, w, h }: { c: Card; p: MotionValue<number>; i: number; w: number; h: number }) {
  const start = i * 0.06;
  const x = useTransform(p, [start, start + 0.55], [c.x * w, w * 0.36]);
  const y = useTransform(p, [start, start + 0.55], [c.y * h, h * 0.32]);
  const rotate = useTransform(p, [start, start + 0.55], [c.r, 0]);
  const scale = useTransform(p, [start, start + 0.55], [1, 0.72]);
  const opacity = useTransform(p, [start + 0.3, start + 0.55], [1, 0]);
  return (
    <motion.div className={`pr-card pr-card-${c.k}`} style={{ x, y, rotate, scale, opacity }}>
      <div className="pr-card-top">
        <strong>{c.title}</strong>
        <span>{c.names}</span>
      </div>
      {c.body}
    </motion.div>
  );
}

export default function Replace({ openSignup, onCtaVisible }: { openSignup: OpenSignup; onCtaVisible: (v: boolean) => void }) {
  const reduce = useReducedMotion();
  const outer = useRef<HTMLElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const [vis, box] = useBox<HTMLDivElement>();
  const [scrub, setScrub] = useState(false);
  const p = useMotionValue(reduce ? 1 : 0);
  const [after, setAfter] = useState(!!reduce);
  const { scrollYProgress } = useScroll({ target: outer, offset: ["start 64px", "end end"] });

  // scrub only on a laptop-sized pointer screen with motion allowed
  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 980px) and (min-height: 560px) and (pointer: fine)");
    const set = () => setScrub(mq.matches && !reduce);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, [reduce]);

  useEffect(() => {
    if (!scrub) return;
    const u = scrollYProgress.on("change", (v) => {
      const q = Math.max(0, Math.min(1, (v - 0.12) / 0.7));
      p.set(q);
    });
    p.set(Math.max(0, Math.min(1, (scrollYProgress.get() - 0.12) / 0.7)));
    return u;
  }, [scrub, scrollYProgress, p]);

  useEffect(() => p.on("change", (v) => setAfter(v > 0.5)), [p]);

  useEffect(() => {
    const el = cta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => onCtaVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [onCtaVisible]);

  const go = (toAfter: boolean) => {
    if (scrub && outer.current) {
      const r = outer.current.getBoundingClientRect();
      const span = outer.current.offsetHeight - (window.innerHeight - 64);
      const top = window.scrollY + r.top - 64 + span * (toAfter ? 0.86 : 0.08);
      window.scrollTo({ top, behavior: "smooth" });
    } else {
      animate(p, toAfter ? 1 : 0, { duration: reduce ? 0 : 0.6, ease: [0.23, 1, 0.32, 1] });
    }
  };

  const winOpacity = useTransform(p, [0.45, 0.8], [0, 1]);
  const winScale = useTransform(p, [0.45, 0.9], [0.96, 1]);
  const W = box.w;
  const H = box.h;
  const ow = W * 0.8;
  const sw = ow / 1180;

  return (
    <section ref={outer} className={`p-sec pr${scrub ? " is-scrub" : ""}`} id="replace" aria-labelledby="pr-h">
      <div className="pr-sticky">
        <div className="pp-wrap pr-grid">
          <div className="pr-copy">
            <h2 className="pp-h2" id="pr-h">
              Replace your apps and spreadsheet madness with one app your crew will actually use.
            </h2>
            <table className="pr-table">
              <thead>
                <tr>
                  <th scope="col">What you use now</th>
                  <th scope="col">SmartCrew instead</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([cat, names, sc]) => (
                  <tr key={cat}>
                    <td>
                      <strong>{cat}</strong> <span>{names}</span>
                      <sup>1</sup>
                    </td>
                    <td>{sc}</td>
                  </tr>
                ))}
                <tr className="pr-qb">
                  <td colSpan={2}>QuickBooks stays. SmartCrew connects to it for payroll.</td>
                </tr>
              </tbody>
            </table>
            <div className="pr-cta" ref={cta}>
              <p className="pr-ask" id="pr-ask">
                How big is your crew?
              </p>
              <div className="pp-sizes-row" role="group" aria-labelledby="pr-ask">
                {SIZES.map((s) => (
                  <button key={s} type="button" className="pp-size is-dark" onClick={() => openSignup({ intent: "trial", source: "closer", size: s })}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="pr-btnrow">
                <button type="button" className="pp-btn pp-btn-light" onClick={() => openSignup({ intent: "trial", source: "closer" })}>
                  Get my free trial
                </button>
                <p className="pp-micro is-dark">
                  {T.PROGRAM}. Starts with a {T.N}-minute call with Andrew. No contract, cancel anytime.
                </p>
              </div>
            </div>
          </div>

          <div className="pr-visual">
            <div className="pr-toggle" role="group" aria-label="Before and after">
              <button type="button" aria-pressed={!after} className={!after ? "is-on" : ""} onClick={() => go(false)}>
                Before
              </button>
              <button type="button" aria-pressed={after} className={after ? "is-on" : ""} onClick={() => go(true)}>
                With SmartCrew
              </button>
            </div>
            <div className="pr-stage" ref={vis}>
              {W > 0 && (
                <>
                  {CARDS.map((c, i) => (
                    <CardView key={c.k} c={c} p={p} i={i} w={W} h={H} />
                  ))}
                  <motion.div className="pr-after" style={{ opacity: winOpacity, scale: winScale }} aria-hidden={!after}>
                    <Crop id="web-dashboard" x={300} y={88} s={sw} className="pr-win" style={{ width: ow, height: H * 0.82 }} animate={false} label="SmartCrew office app: dashboard" />
                    <div className="pr-phone">
                      <Phone id="phone-home" width={Math.round(Math.min(150, W * 0.24))} animate={false} />
                    </div>
                    <span className="pr-qbnode">
                      <i />
                      Works with QuickBooks for payroll
                    </span>
                  </motion.div>
                </>
              )}
            </div>
            <p className="pr-cap">{after ? "One login for the crew and the office. Demo account; names and numbers are made up." : "One day on one job, the way most crews run it now."}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
