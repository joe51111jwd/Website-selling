// Try it on phones: the visitor's own phone becomes the crew's phone. The scene opens on the
// line and the two quiet facts with the SmartCrew app peeking up from below; the scroll lifts the
// app until it fills the screen (the page's own header stays, like the browser's chrome). They tap
// the big black Clock In → it clocks in, the timer runs, and the page slides a note over the
// bottom: "That's the whole training. Your crew gets this." + the CTA.

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useTransform } from "motion/react";
import { TRY_IT } from "../../content/copy";
import { reducedMotion } from "../../three/stage/store";
import { useSceneProgress } from "../scene/Scene";
import { Cta } from "../ui/Cta";
import { localTime, useClock, useElapsed, useSelfDemo } from "./clock";
import { TryApp } from "./TryApp";
import "./try-phone.css";

const ease = [0.22, 1, 0.36, 1] as const;

/** Scene progress where the app starts rising and where it fills the screen. */
const RISE: [number, number] = [0.04, 0.52];
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function TryPhone() {
  const progress = useSceneProgress();
  const clock = useClock();
  const secs = useElapsed(clock.on, clock.since);
  const [stamp, setStamp] = useState("");
  const [full, setFull] = useState(false);
  const [sheet, setSheet] = useState(false);

  // 0 → 1 as the app rises into the full screen (a step under reduced motion)
  const e = useTransform(progress, (p) => {
    const t = Math.min(1, Math.max(0, (p - RISE[0]) / (RISE[1] - RISE[0])));
    return reducedMotion ? (t > 0.5 ? 1 : 0) : easeInOut(t);
  });
  const appY = useTransform(e, (v) => `calc(${(1 - v) * 100}% * var(--tp-peek))`);
  const appR = useTransform(e, (v) => `${(1 - v) * 30}px`);
  const appS = useTransform(e, (v) => 0.92 + 0.08 * v);
  const introO = useTransform(e, [0, 0.55], [1, 0]);
  const introY = useTransform(e, [0, 1], [0, -40]);
  const shadowO = useTransform(e, [0.7, 1], [1, 0]);

  // "settled": the scene is pinned and the app fills the screen
  const [pinned, setPinned] = useState(false);
  useMotionValueEvent(progress, "change", (p) => {
    setFull(p >= RISE[1] - 0.01);
    setPinned(p > 0 && p < 1);
  });
  const settled = full && pinned;
  useSelfDemo(clock, settled);

  useEffect(() => {
    if (!clock.on) {
      setSheet(false);
      return;
    }
    setStamp(localTime());
    navigator.vibrate?.(12);
    const t = window.setTimeout(() => setSheet(true), reducedMotion ? 0 : 900);
    return () => window.clearTimeout(t);
  }, [clock.on]);

  return (
    <div className="tp">
      <motion.div className="tp-intro wrap" style={{ opacity: introO, y: introY }} aria-hidden={full}>
        <h2 className="t-h2 tp-title">{TRY_IT.title}</h2>
        <p className="t-lead tp-prompt">{TRY_IT.promptPhone}</p>
        <ul className="tp-facts">
          {TRY_IT.facts.map((f) => (
            <li key={f.lead}>
              <strong>{f.lead}</strong> {f.rest}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div className="tp-app tp-ui" style={{ y: appY, scale: appS, borderRadius: appR }}>
        <motion.div className="tp-app-shadow" style={{ opacity: shadowO }} aria-hidden="true" />
        <TryApp
          on={clock.on}
          secs={secs}
          ghost={clock.ghost}
          live={full}
          onClockIn={() => clock.clockIn("visitor")}
          onClockOut={clock.clockOut}
        />
      </motion.div>

      <AnimatePresence>
        {sheet && (
          <motion.div
            className="tp-sheet"
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            exit={{ y: "105%", transition: { duration: 0.3 } }}
            transition={{ duration: 0.6, ease }}
            role="status"
          >
            <p className="tp-stamp">
              {TRY_IT.site} · {TRY_IT.clocked.replace("{time}", stamp)}
            </p>
            <p className="t-h3 tp-done-1">{TRY_IT.done}</p>
            <p className="tp-done-2">{TRY_IT.doneSub}</p>
            <Cta source="try" className="tp-cta" />
            <button type="button" className="link tp-again" onClick={clock.clockOut}>
              {TRY_IT.again}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
