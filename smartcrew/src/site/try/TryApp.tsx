// The SmartCrew crew app as live DOM, built from the real phone screen parts (src/screens/phone),
// without a status bar: on a phone the visitor's own status bar is right above it. Ready to clock
// in? → the big black Clock In circle (a real button) → Currently working on, with a timer that
// starts at the tap. Used by Try it on phones (and as the desktop fallback without WebGL).

import { AnimatePresence, motion } from "motion/react";
import { Icon, TabBar, timer } from "../../screens/kit";
import { currentActivity } from "../../screens/data";
import { DayHeader, Stopwatch, WeekStrip } from "../../screens/phone/ClockParts";
import { TRY_IT } from "../../content/copy";

const ease = [0.22, 1, 0.36, 1] as const;

export type TryAppProps = {
  on: boolean;
  secs: number;
  ghost: boolean;
  /** the button can take focus / taps (the app is fully on screen) */
  live: boolean;
  onClockIn: () => void;
  onClockOut?: () => void;
  /**
   * Phones build the app a piece at a time (./warm.ts), so its first layout is never one long task:
   * 1 the Clock In body · 2 + the day header and week strip · 3 + the tab bar. Parts not built yet
   * keep their exact space (no shift when they land). Default: everything at once.
   */
  stage?: number;
};

export function TryApp({ on, secs, ghost, live, onClockIn, onClockOut, stage }: TryAppProps) {
  const a = currentActivity;
  const staged = stage !== undefined;
  const at = stage ?? 3;
  const chrome = (
    <>
      <DayHeader />
      <WeekStrip todayMark={on ? "check" : undefined} />
    </>
  );
  return (
    <div className="sc tp-sc">
      <div className="tp-body">
        {!staged ? chrome : at >= 2 ? <div className="tp-chrome">{chrome}</div> : <div className="tp-chrome tp-chrome--wait" aria-hidden="true" />}
        <AnimatePresence mode="wait" initial={false}>
          {at < 1 ? null : !on ? (
            <motion.div
              key="ready"
              className="pc-ready tp-ready"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ duration: 0.3, ease }}
            >
              <div className="pc-ready-q">Ready to clock in?</div>
              <button
                type="button"
                className={`pc-clockin tp-clockin${ghost ? " is-ghost" : ""}`}
                onClick={onClockIn}
                tabIndex={live ? 0 : -1}
                aria-label={TRY_IT.clockIn}
                data-cursor="cta"
                data-cursor-label="Clocked in · {time}"
              >
                <Stopwatch size={22} stroke={1.7} />
                <span className="pc-clockin-label">Clock In</span>
                <span className="tp-ring" aria-hidden="true" />
                <span className="tp-ghost" aria-hidden="true" />
              </button>
              <div className="pc-dayoff">
                <Icon name="calendarOff" size={21} stroke={1.55} />
                <span>Request day off</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="work"
              className="pc-work tp-work"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease }}
            >
              <div className="pc-work-title">Currently working on</div>
              <div className="pc-task">
                <div className="pc-timer">{timer(secs)}</div>
                <div className="pc-rows">
                  <div className="pc-row">
                    <span className="pc-row-k">Project</span>
                    <span className="pc-row-v">{a.project}</span>
                  </div>
                  <div className="pc-row">
                    <span className="pc-row-k">Activity code</span>
                    <span className="pc-row-v">{a.activity}</span>
                  </div>
                  <div className="pc-row">
                    <span className="pc-row-k">Equipment</span>
                    <span className="pc-row-v">{a.equipment}</span>
                  </div>
                </div>
                <div className="pc-btns">
                  <span className="pc-btn">
                    <Icon name="coffee" size={19} stroke={1.6} />
                    Break
                  </span>
                  <span className="pc-btn pc-btn--dark">
                    <Icon name="save" size={18} stroke={1.6} />
                    Log &amp; Switch
                  </span>
                </div>
              </div>
              <div className="pc-work-rule" />
              <div className="pc-total">
                <span>
                  <span className="pc-total-k">Total hours</span>
                  <span className="pc-total-v">{timer(secs)}</span>
                </span>
                <button type="button" className="pc-btn pc-btn--pink tp-clockout" onClick={onClockOut} tabIndex={live ? 0 : -1}>
                  <Stopwatch size={21} stroke={1.8} />
                  Clock Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {at >= 3 ? <TabBar active="Home" /> : <div className="tp-tabs--wait" aria-hidden="true" />}
    </div>
  );
}
