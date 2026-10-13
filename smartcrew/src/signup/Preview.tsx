import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import "@fontsource-variable/inter";
import { Icon, type IconName } from "../screens/kit/Icon";
import type { Intent, Size } from "./contract";
import { digits, firstName, initials, type Draft, type Field } from "../lib/lead";
import markUrl from "./assets/mark.svg";

// The visitor's own SmartCrew, building itself as he types (the IKEA / endowed-progress moment).
// A small, dedicated copy of the real app's look (src/screens: white shell, Inter, the sidebar,
// the company + login in the top bar). It's labelled a preview; Andrew sets up the real one.

const CREW_DOTS: Record<Size, number> = { "1–5": 3, "6–20": 7, "21–50": 10, "51–100": 12, "100+": 13 };

const NAV: { label: string; icon: IconName }[] = [
  { label: "Dashboard", icon: "home" },
  { label: "Projects", icon: "projects" },
  { label: "Workforce", icon: "workforce" },
  { label: "Equipment", icon: "equipment" },
  { label: "Scheduling", icon: "scheduling" },
  { label: "Reports", icon: "reports" },
];

type Props = { draft: Draft; intent: Intent; focus: Field | null; compact: boolean; saving: boolean; hidden?: boolean };

export default function Preview(p: Props) {
  return p.compact ? <Compact {...p} /> : <Full {...p} />;
}

function useFacts(draft: Draft) {
  const company = draft.company.trim();
  const first = firstName(draft.name);
  const done = {
    company: company.length >= 2,
    size: !!draft.size,
    admin: draft.name.trim().length >= 2,
    mobile: digits(draft.phone).length === 10,
  };
  const count = Object.values(done).filter(Boolean).length;
  return { company, first, email: draft.email.trim(), done, count };
}

const Caret = ({ on }: { on: boolean }) => (on ? <span className="su-caret" aria-hidden="true" /> : null);

function Full({ draft, intent, focus, saving }: Props) {
  const reduce = useReducedMotion() ?? false;
  const { company, first, email, done, count } = useFacts(draft);
  const dots = draft.size ? CREW_DOTS[draft.size] : 0;
  const callLabel = intent === "demo" ? "Demo with Andrew" : "Setup call with Andrew";

  const rows: { key: string; label: string; value: ReactNode; ok: boolean }[] = [
    { key: "company", label: "Company", value: company, ok: done.company },
    { key: "crew", label: "Crew size", value: draft.size ? `${draft.size} people` : "", ok: done.size },
    { key: "admin", label: "Admin", value: first, ok: done.admin },
    { key: "mobile", label: "Mobile", value: draft.phone, ok: done.mobile },
  ];

  return (
    <div className="su-pv">
      <p className="su-pv-label">
        <span className="su-pv-live" aria-hidden="true" />
        Preview of your SmartCrew
      </p>

      <Tilt reduce={reduce}>
        <div className="su-win" aria-hidden="true">
          <div className="su-win-side">
            <div className="su-win-logo">
              <img src={markUrl} alt="" />
              <span>SMARTCREW</span>
            </div>
            <ul className="su-win-nav">
              {NAV.map((n, i) => (
                <li key={n.label} className={i === 0 ? "is-on" : undefined}>
                  <Icon name={n.icon} size={13} stroke={i === 0 ? 1.8 : 1.6} />
                  {n.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="su-win-main">
            <div className="su-win-top">
              <div className="su-acct" data-pulse="company">
                <span className="su-acct-name">
                  {company ? <span className="su-acct-v">{company}</span> : <span className="su-skel su-skel--name" />}
                  <Caret on={focus === "company"} />
                </span>
                <span className="su-acct-mail">
                  {email ? <span className="su-acct-v">{email}</span> : <span className="su-skel su-skel--mail" />}
                  <Caret on={focus === "email"} />
                </span>
              </div>
              <Icon name="chevronDown" size={11} stroke={1.8} />
            </div>

            <div className="su-win-body">
              <p className="su-win-title">Dashboard</p>

              <div className="su-card su-crew" data-pulse="crew">
                <div className="su-card-head">
                  <Icon name="workforce" size={12} stroke={1.7} />
                  Workforce
                </div>
                <div className="su-crew-count">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={draft.size ?? "none"}
                      className={draft.size ? undefined : "is-empty"}
                      initial={{ opacity: 0, y: reduce ? 0 : 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: reduce ? 0 : -10, filter: "blur(4px)" }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {draft.size ? `${draft.size} crew members` : "How big is the crew?"}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="su-avs">
                  <AnimatePresence initial={false}>
                    {done.admin && (
                      <motion.span
                        key="admin"
                        layout
                        className="su-av su-av--admin"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 520, damping: 26 }}
                      >
                        {initials(draft.name)}
                      </motion.span>
                    )}
                    {Array.from({ length: dots }, (_, i) => (
                      <motion.span
                        key={i}
                        layout
                        className="su-av"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0, transition: { duration: 0.12 } }}
                        transition={{ type: "spring", stiffness: 560, damping: 24, delay: reduce ? 0 : i * 0.035 }}
                      >
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <circle cx="10" cy="7.6" r="3.2" />
                          <path d="M3.8 17.2c.8-3.3 3.3-5 6.2-5s5.4 1.7 6.2 5" />
                        </svg>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  {!dots && !done.admin && <span className="su-skel su-skel--avs" />}
                  {draft.size && (draft.size === "21–50" || draft.size === "51–100" || draft.size === "100+") && (
                    <motion.span className="su-av-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                      +
                    </motion.span>
                  )}
                </div>
              </div>

              <div className="su-card su-setup">
                <div className="su-card-head">
                  <Icon name="checklist" size={12} stroke={1.7} />
                  Getting set up
                  <span className="su-setup-n">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span key={count} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                        {count}
                      </motion.span>
                    </AnimatePresence>
                    &nbsp;of 5
                  </span>
                </div>
                <ul className="su-steps">
                  {rows.map((r) => (
                    <li key={r.key} className={r.ok ? "is-ok" : undefined} data-pulse={r.key === "admin" ? "admin" : undefined}>
                      <Tick on={r.ok} reduce={reduce} />
                      <span className="su-steps-l">{r.label}</span>
                      <span className="su-steps-v">{r.ok ? r.value : ""}</span>
                    </li>
                  ))}
                  <li className={`su-steps-call${saving ? " is-going" : ""}`} data-pulse="call">
                    <span className="su-callring" aria-hidden="true" />
                    <span className="su-steps-l">{callLabel}</span>
                    <span className="su-steps-v">{saving ? "Opening…" : "Pick a time"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Tilt>

      <p className="su-pv-note">{intent === "demo" ? "A preview. Andrew shows you the real thing on your demo." : "A preview. Andrew sets up the real one with you on the call."}</p>
    </div>
  );
}

function Tick({ on, reduce }: { on: boolean; reduce: boolean }) {
  return (
    <span className={`su-tick${on ? " is-on" : ""}`} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14">
        <motion.path
          d="M3.4 7.3 6 9.8l4.8-5.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </span>
  );
}

/** The window leans toward the cursor and breathes, so the panel feels alive. Laptops only. */
function Tilt({ children, reduce }: { children: ReactNode; reduce: boolean }) {
  const rx = useSpring(5, { stiffness: 90, damping: 18 });
  const ry = useSpring(-9, { stiffness: 90, damping: 18 });
  useEffect(() => {
    if (reduce || window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      ry.set(-9 + x * 9);
      rx.set(5 - y * 6);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, rx, ry]);
  return (
    <div className="su-stage">
      <motion.div
        className="su-tilt"
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
        initial={{ opacity: 0, y: reduce ? 0 : 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20, delay: reduce ? 0 : 0.12 }}
      >
        <motion.div animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          {children}
        </motion.div>
      </motion.div>
      <div className="su-stage-glow" aria-hidden="true" />
    </div>
  );
}

/** Phones: the same idea as one app top bar on the dark strip above the form. */
function Compact({ draft, focus, hidden }: Props) {
  const reduce = useReducedMotion() ?? false;
  const { company, first, done, count } = useFacts(draft);
  const sub = [draft.size ? `${draft.size} crew members` : null, done.admin ? `Admin ${first}` : null].filter(Boolean).join(" · ");
  return (
    // while the keyboard is up the strip steps out at once (animating its height would lay the
    // sheet out every frame while the keyboard itself is moving); it fades back in after
    <div className={`su-pvc${hidden ? " is-hidden" : ""}`}>
      <div className="su-pvc-in">
        <p className="su-pv-label">
          <span className="su-pv-live" aria-hidden="true" />
          Preview of your SmartCrew
        </p>
        <div className="su-pvc-bar" data-pulse="company crew admin mobile call" aria-hidden="true">
          <img src={markUrl} alt="" className="su-pvc-mark" />
          <div className="su-pvc-text">
            <b>
              {company || <span className="su-pvc-ph">Your company</span>}
              <Caret on={focus === "company"} />
            </b>
            <span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={sub || "none"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                  {sub || "Crew size and admin come next"}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>
          <span className="su-pvc-ring" aria-label={`${count} of 5 set up`}>
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <circle cx="17" cy="17" r="14" fill="none" stroke="#ececec" strokeWidth="3" />
              <motion.circle
                cx="17"
                cy="17"
                r="14"
                fill="none"
                stroke="var(--orange)"
                strokeWidth="3"
                strokeLinecap="round"
                transform="rotate(-90 17 17)"
                initial={false}
                animate={{ pathLength: Math.max(0.02, count / 5) }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
              />
            </svg>
            <i>{count}/5</i>
          </span>
        </div>
      </div>
    </div>
  );
}
