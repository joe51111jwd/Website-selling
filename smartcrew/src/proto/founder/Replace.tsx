import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import type { OpenSignup } from "./copy";
import { ScreenCrop } from "./Screen";
import { Micro, SizeChips, TrialButton } from "./ui";

const ROWS = [
  { now: "Time tracking app", names: "busybusy · QB Time · ExactTime", sc: "GPS time tracking app" },
  { now: "Fleet app", names: "fleet.io", sc: "Equipment, shop queue and DOT" },
  { now: "CRM", names: "HubSpot · Close", sc: "Sales pipeline and bids" },
  { now: "Storage", names: "Dropbox · Google Drive", sc: "Project docs in your pocket" },
  { now: "Group chat", names: "Slack · WhatsApp", sc: "Crew messaging" },
];

function useDesktopScrub() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px) and (min-height: 560px)");
    const f = () => setOn(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return on;
}

// The page's one story moment (PLAYBOOK S9): five apps and the paper resolve into one SmartCrew.
// Laptop: a sticky viewport with at most one extra viewport of scroll. Phone: a toggle.
export function Replace({ open }: { open: OpenSignup }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const scrub = useDesktopScrub() && !reduce;
  const [after, setAfter] = useState(!!reduce);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (scrub) setAfter(p > 0.42);
  });

  const go = (to: boolean) => {
    if (scrub && ref.current) {
      const top = ref.current.getBoundingClientRect().top + scrollY - 64;
      const extra = ref.current.offsetHeight - (innerHeight - 64);
      scrollTo({ top: to ? top + extra * 0.75 : top, behavior: "smooth" });
    } else setAfter(to);
  };

  return (
    <section ref={ref} className={`f-replace${scrub ? " is-scrub" : ""}${after ? " is-after" : ""}`} id="replace" aria-labelledby="f-replace-h" data-sec="replace">
      <div className="f-replace-sticky">
        <div className="f-wrap">
          <h2 id="f-replace-h" className="f-h2 f-replace-h">
            Replace your apps and spreadsheet madness with one app your crew will actually use.
          </h2>
          <div className="f-replace-grid">
            <div className="f-replace-left">
              <ul className="f-apps">
                {ROWS.map((r) => (
                  <li key={r.now} className="f-apps-row">
                    <span className="f-apps-now">
                      <b>{r.now}</b>
                      <span className="f-apps-names">{r.names}</span>
                    </span>
                    <span className="f-apps-arrow" aria-hidden="true" />
                    <span className="f-apps-sc">{r.sc}</span>
                  </li>
                ))}
                <li className="f-apps-row f-apps-qb">
                  <span className="f-apps-now">
                    <b>QuickBooks stays.</b>
                  </span>
                  <span className="f-apps-sc">SmartCrew connects to it for payroll.</span>
                </li>
              </ul>
              <div className="f-replace-cta" id="f-final-cta" data-pair-end>
                <SizeChips open={open} source="closer" />
                <TrialButton open={open} source="closer" className="f-btn-lg" />
                <Micro face={false} />
              </div>
            </div>

            <div className="f-replace-pic">
                <div className="f-swap" role="group" aria-label="Show before or after">
                <button type="button" aria-pressed={!after} onClick={() => go(false)}>
                  Before
                </button>
                <button type="button" aria-pressed={after} onClick={() => go(true)}>
                  With SmartCrew
                </button>
              </div>
              <div className="f-mess" aria-label="Before: five apps, a spreadsheet and a paper timecard" role="img">
                <div className="f-win f-win-time">
                  <span className="f-win-bar">
                    <b>Time tracking app</b>
                  </span>
                  <span className="f-win-row">M. Bell · 6:58a – 3:31p</span>
                  <span className="f-win-row">E. Ruiz · 7:00a – ?</span>
                  <span className="f-win-row">K. Mori · no job picked</span>
                </div>
                <div className="f-win f-win-fleet">
                  <span className="f-win-bar">
                    <b>Fleet app</b>
                  </span>
                  <span className="f-win-row">CAT 320 · service due</span>
                  <span className="f-win-row">Mack #1102 · DVIR?</span>
                </div>
                <div className="f-win f-win-crm">
                  <span className="f-win-bar">
                    <b>CRM</b>
                  </span>
                  <span className="f-win-row">Greenway Trail · bid sent</span>
                  <span className="f-win-row">Hollis Co. culvert · call back</span>
                </div>
                <div className="f-win f-win-files">
                  <span className="f-win-bar">
                    <b>Storage</b>
                  </span>
                  <span className="f-win-row">Hwy 9 plans rev C.pdf</span>
                  <span className="f-win-row">Hwy 9 plans rev C (1).pdf</span>
                </div>
                <div className="f-win f-win-chat">
                  <span className="f-win-bar">
                    <b>Group chat</b>
                  </span>
                  <span className="f-bubble">who has the 320 tmrw?</span>
                  <span className="f-bubble f-bubble-me">receipt pic for the rock</span>
                </div>
                <div className="f-win f-win-sheet">
                  <span className="f-win-bar">
                    <b>Job costs.xlsx</b>
                  </span>
                  <span className="f-grid" />
                </div>
                <div className="f-paper">
                  <b>Time card</b>
                  <span>Mon 7:00 – 3:30</span>
                  <span>Tue 7:00 – 3:30</span>
                  <span>Wed 7:00 – 3:30</span>
                </div>
              </div>
              <div className="f-after" aria-label="With SmartCrew: one app for the crew and the office" role="img">
                <ScreenCrop id="web-dashboard" x={330} y={96} w={1090} h={470} className="f-after-web" label="SmartCrew dashboard" />
                <div className="f-after-phone">
                  <ScreenCrop id="phone-home" w={402} h={874} className="f-phone" label="SmartCrew crew app" />
                </div>
                <span className="f-after-label">One login for the crew and the office.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
