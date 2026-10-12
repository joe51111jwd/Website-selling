import { useEffect, useRef, useState, type RefObject } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import ScreenWindow, { useSize } from "./ScreenWindow";
import { SIZES, T, type OpenSignup } from "./types";

// S9, Andrew’s "replace 5 apps" closer (LV’s exact five, plain-text names, AMBER + trademark
// footnote). The page’s one story moment: five separate apps → five items in one real
// SmartCrew sidebar. Plays once when it comes into view; a toggle flips it either way.

const APPS = [
  { cat: "Time tracking app", names: "busybusy · QB Time · ExactTime", to: "GPS time tracking", nav: "Dashboard", y: 131 },
  { cat: "File storage", names: "Dropbox · Google Drive", to: "Project docs in your pocket", nav: "Projects", y: 180 },
  { cat: "Fleet app", names: "fleet.io", to: "Equipment, shop queue and DOT", nav: "Equipment", y: 327 },
  { cat: "CRM", names: "HubSpot · Close", to: "Sales pipeline and bids", nav: "Pipeline", y: 474 },
  { cat: "Group chat", names: "Slack · WhatsApp", to: "Crew messaging", nav: "Messaging", y: 572 },
];

const WIN = { x: 0, y: 92, w: 300 };
const EASE = [0.23, 1, 0.32, 1] as const;

export default function Replace({ onCta, ctaRef }: { onCta: OpenSignup; ctaRef: RefObject<HTMLDivElement | null> }) {
  const reduce = useReducedMotion();
  const [after, setAfter] = useState<boolean>(!!reduce);
  const played = useRef(false);
  const vis = useRef<HTMLDivElement>(null);
  const inView = useInView(vis, { amount: 0.45 });

  // plays once, after it has been in view for a moment (a fast scroll past doesn't use it up)
  useEffect(() => {
    if (!inView || played.current) return;
    const t = window.setTimeout(
      () => {
        played.current = true;
        setAfter(true);
      },
      reduce ? 0 : 650,
    );
    return () => window.clearTimeout(t);
  }, [inView, reduce]);

  return (
    <section className="sec rp" id="replace" aria-labelledby="rp-h">
      <div className="rp-copy">
        <h2 className="h2" id="rp-h">
          Replace your apps and spreadsheet madness with one app your crew will actually use.
        </h2>
        <div className="rp-cta" ref={ctaRef}>
          <p className="rp-ask" id="rp-ask">
            How big is your crew?
          </p>
          <div className="rp-chips" role="group" aria-labelledby="rp-ask">
            {SIZES.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => onCta({ intent: "trial", source: "closer_chip", size: s })}>
                {s}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-dark btn-lg" onClick={() => onCta({ intent: "trial", source: "closer" })}>
            Get my free trial
          </button>
          <p className="caption rp-micro">
            {T.PROGRAM}. Starts with a {T.N}-minute call with Andrew. No contract, cancel anytime.
          </p>
        </div>
      </div>

      <div className="rp-vis" ref={vis}>
        <div className="rp-toggle" role="group" aria-label="Show">
          <button
            type="button"
            aria-pressed={!after}
            className={!after ? "is-on" : ""}
            onClick={() => {
              played.current = true;
              setAfter(false);
            }}
          >
            Before
          </button>
          <button
            type="button"
            aria-pressed={after}
            className={after ? "is-on" : ""}
            onClick={() => {
              played.current = true;
              setAfter(true);
            }}
          >
            With SmartCrew
          </button>
        </div>
        <Board after={after} reduce={!!reduce} />
      </div>
    </section>
  );
}

function Board({ after, reduce }: { after: boolean; reduce: boolean }) {
  const [boardRef, board] = useSize<HTMLDivElement>();
  const [shotRef, shot] = useSize<HTMLDivElement>();
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [rows, setRows] = useState<{ y: number; r: number }[]>([]);

  useEffect(() => {
    const b = boardRef.current?.getBoundingClientRect();
    if (!b) return;
    setRows(
      rowRefs.current.map((el) => {
        const r = el?.getBoundingClientRect();
        return r ? { y: r.top - b.top + r.height / 2, r: r.right - b.left } : { y: 0, r: 0 };
      }),
    );
  }, [board.w, board.h, shot.w, shot.h, after, boardRef]);

  const shotEl = shotRef.current;
  const bRect = boardRef.current?.getBoundingClientRect();
  const sRect = shotEl?.getBoundingClientRect();
  const k = shot.w ? shot.w / WIN.w : 0;
  const ox = sRect && bRect ? sRect.left - bRect.left : 0;
  const oy = sRect && bRect ? sRect.top - bRect.top : 0;

  return (
    <div className={`rp-board ${after ? "is-after" : ""}`} ref={boardRef}>
      <ul className="rp-rows">
        {APPS.map((a, i) => (
          <li key={a.cat} ref={(el) => void (rowRefs.current[i] = el)} className="rp-row">
            <span className="rp-cat">{a.cat}</span>
            <span className="rp-names">
              <span className="rp-strike" style={{ transitionDelay: after && !reduce ? `${120 + i * 90}ms` : "0ms" }} />
              {a.names}
            </span>
            <span className="rp-to" style={{ transitionDelay: after && !reduce ? `${260 + i * 90}ms` : "0ms" }}>
              {a.to}
            </span>
          </li>
        ))}
        <li className="rp-row rp-qb">
          <span className="rp-cat">QuickBooks stays.</span>
          <span className="rp-qb-line">SmartCrew connects to it for payroll.</span>
        </li>
      </ul>

      <div className="rp-shot" ref={shotRef}>
        <ScreenWindow id="web-dashboard" focus={WIN} animate={false} className="rp-win" label="SmartCrew office app: the sidebar" />
        <span className="rp-one">One SmartCrew app</span>
      </div>

      {k > 0 && rows.length === APPS.length && (
        <svg className="rp-lines" width={board.w} height={board.h} aria-hidden>
          {APPS.map((a, i) => {
            const x1 = rows[i].r + 10;
            const y1 = rows[i].y;
            const x2 = ox + 24 * k;
            const y2 = oy + (a.y - 5 - WIN.y) * k;
            const mx = (x1 + x2) / 2;
            const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
            return (
              <g key={a.nav}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke="#1D1A16"
                  strokeWidth={1}
                  initial={false}
                  animate={{ pathLength: after ? 1 : 0, opacity: after ? 1 : 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.5, delay: after ? 0.2 + i * 0.09 : 0, ease: EASE }}
                />
                <motion.circle
                  cx={x2}
                  cy={y2}
                  r={5}
                  fill="#fff"
                  stroke="#FF7A01"
                  strokeWidth={2}
                  initial={false}
                  animate={{ scale: after ? 1 : 0, opacity: after ? 1 : 0 }}
                  style={{ transformOrigin: `${x2}px ${y2}px` }}
                  transition={reduce ? { duration: 0 } : { duration: 0.24, delay: after ? 0.55 + i * 0.09 : 0, ease: EASE }}
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
