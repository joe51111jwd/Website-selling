// Try it on desktop: "Pick up the phone" (scratchpad design/v2/scroll/SCROLL_SHOTS.md §1). The 3D
// iPhone (the Stage, fitted into the "try" anchor) is picked up out of the bottom of the frame and
// tilts upright as the scene rises (./poses.ts); its screen wakes on "Ready to clock in?" when it
// is nearly upright (./wake.ts). Once the scene settles: the jobsite's caption under the phone,
// one breath of the Clock In circle, and at 3.2 s, if untouched, the self demo. Real buttons sit
// exactly on the screen's Clock In circle and, once clocked in, on its Clock Out button; the
// screen swaps to "Currently working on" and a timer that starts at the tap runs on it; the
// caption's second line stamps the time. No fence, ring or dot round the phone: the screen's own
// change is the confirmation. Copy left, the two quiet facts right.

import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TRY_IT } from "../../content/copy";
import { StageAnchor } from "../../three/stage/StageAnchor";
import { clearScreen, onStatus, reducedMotion, setScreen, status } from "../../three/stage/store";
import { SceneCta } from "./SceneCta";
import { localTime, useClock, useElapsed, useSelfDemo, useStagePhase } from "./clock";
import { TRY_FLOAT, TRY_FRAME } from "./poses";
import { startScreenTimer } from "./screenTimer";
import { breathe, prepareBreathe, useWake } from "./wake";

const ease = [0.22, 1, 0.36, 1] as const;

// without the 3D phone the scene shows the live app in a plain frame (loaded only then)
const TryDomPhone = lazy(() => import("./TryDomPhone"));

/** No 3D phone to draw on: no WebGL, or the context was lost. (Not "not ready yet": the Stage
 * may still be drawing while some other scene's screen decodes, and two phones would show.) */
function useNo3D() {
  const read = () => !status.webgl || status.failed;
  const [no3d, setNo3d] = useState(read);
  useEffect(() => onStatus(() => setNo3d(read())), []);
  return no3d;
}

// Native screen px (402 × 874) → device units on the face-on phone, measured from the Stage's own
// projection (screen front face, perspective included): the screen's centre sits 0.0031 units
// below the device's centre.
const SX = 0.001826;
const SY = 0.0018386;
const CY0 = 0.0031;
const NX = 201;
const NY = 437;

/** The iPhone model's half height, device units (TryDomPhone's BODY): the caption sits under its chin. */
const CHIN = 1.6336 / 2;
/** The caption's gap under the chin, px. */
const CAP_GAP = 18;
/** The breath comes 1.2 s after the scene pins (`pinned` already waits 0.26 s for the Stage). */
const BREATHE_AFTER = 940;

/** Clock In circle and Clock Out pill on the phone screens, native px. */
const CLOCK_IN = { cx: 201, cy: 465.8, d: 165 };
const CLOCK_OUT = { x: 205.7, y: 620.1, w: 140, h: 50 };

/** The anchor's size → px per device unit (the Stage's contain fit). */
function useFit(ref: React.RefObject<HTMLDivElement | null>) {
  const [fit, setFit] = useState({ w: 0, h: 0, k: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setFit({ w, h, k: Math.min(w / TRY_FRAME[0], h / TRY_FRAME[1]) });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return fit;
}

/**
 * Replays the Stage's idle float on the overlay (same clock, same formula: y bob ±0.05 units,
 * roll ±0.5°, phase 1.7 for the iPhone), so the buttons ride with the phone.
 */
function useFloat(layer: React.RefObject<HTMLDivElement | null>, k: number, active: boolean) {
  useEffect(() => {
    const el = layer.current;
    if (!el || reducedMotion || !active || !k) {
      if (el) el.style.transform = "";
      return;
    }
    let raf = 0;
    const tick = () => {
      const t = performance.now() / 1000;
      const fy = Math.sin(t * 0.9 + 1.7) * 0.05 * TRY_FLOAT;
      const rz = Math.sin(t * 0.6 + 1.7) * 0.5 * TRY_FLOAT;
      el.style.transform = `translate3d(0, ${(-fy * k).toFixed(2)}px, 0) rotate(${(-rz).toFixed(3)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layer, k, active]);
}

export function TryDesk() {
  const anchor = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const fit = useFit(anchor);
  const { phase, pinned } = useStagePhase("try");
  const awake = useWake("try");
  const clock = useClock();
  const secs = useElapsed(clock.on, clock.since);
  // the caption has come (it then stays, except while the phone is away below the frame)
  const [captioned, setCaptioned] = useState(reducedMotion);
  const [breathed, setBreathed] = useState(false);
  const [stamp, setStamp] = useState("");
  const timerRef = useRef<ReturnType<typeof startScreenTimer> | null>(null);
  const no3d = useNo3D();
  // keyboard: after clocking in, focus moves to the payoff (next Tab is the CTA); after clocking
  // out, back to the Clock In circle
  const doneRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLButtonElement>(null);
  const hadFocus = useRef(false);
  const onClockIn = () => {
    hadFocus.current = document.activeElement === inRef.current;
    clock.clockIn("visitor");
  };
  const onClockOut = () => {
    hadFocus.current = !!document.activeElement && document.activeElement !== document.body;
    clock.clockOut();
  };
  useEffect(() => {
    if (!hadFocus.current) return;
    hadFocus.current = false;
    const t = window.setTimeout(() => (clock.on ? doneRef.current : inRef.current)?.focus({ preventScroll: true }), 650);
    return () => window.clearTimeout(t);
  }, [clock.on]);

  useEffect(() => {
    if (pinned) setCaptioned(true);
  }, [pinned]);
  useSelfDemo(clock, pinned);
  useFloat(layer, fit.k, pinned);

  // one breath of the Clock In circle, the first time the scene settles untouched
  const untouched = !clock.on && !clock.touched && !clock.demoed;
  useEffect(() => {
    if (!awake || no3d || reducedMotion) return;
    prepareBreathe();
  }, [awake, no3d]);
  const stopBreathe = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (breathed || !pinned || !untouched || reducedMotion) return;
    const t = window.setTimeout(() => {
      setBreathed(true);
      if (!no3d) stopBreathe.current = breathe();
    }, BREATHE_AFTER);
    return () => window.clearTimeout(t);
  }, [breathed, pinned, untouched, no3d]);
  useEffect(() => () => stopBreathe.current?.(), []);

  // While this scene covers the middle of the viewport the phone shows the app's home ("Ready to
  // clock in?"), so it has switched by the time it arrives; the tap swaps it to "Currently working
  // on" and starts the timer on it.
  useEffect(() => {
    if (!clock.on) {
      setScreen("iphone", "phone-home", { scene: "try" });
      return;
    }
    setStamp(localTime());
    setScreen("iphone", "phone-working", { scene: "try" });
    const t = startScreenTimer();
    timerRef.current = t;
    return () => {
      t.clear();
      timerRef.current = null;
    };
  }, [clock.on]);
  useEffect(() => () => clearScreen("iphone"), []);
  useEffect(() => timerRef.current?.draw(secs), [secs]);

  const k = fit.k;
  const px = (nx: number, ny: number) => ({ x: (nx - NX) * SX * k, y: ((ny - NY) * SY + CY0) * k });
  const cin = px(CLOCK_IN.cx, CLOCK_IN.cy);
  const cout = px(CLOCK_OUT.x + CLOCK_OUT.w / 2, CLOCK_OUT.y + CLOCK_OUT.h / 2);
  const live = pinned && k > 0 && !no3d;

  return (
    <div className="try-grid wrap">
      <div className="try-copy">
        <h2 className="t-h2 try-title">{TRY_IT.title}</h2>
        <div className="try-say" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {!clock.on ? (
              <motion.p
                key="prompt"
                className="t-lead try-prompt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease }}
              >
                {TRY_IT.prompt.replace(TRY_IT.promptTap, "").trim()}
                <strong>{TRY_IT.promptTap}</strong>
              </motion.p>
            ) : (
              <motion.div
                key="done"
                ref={doneRef}
                tabIndex={-1}
                className="try-done"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.55, ease, delay: 0.25 }}
              >
                <p className="t-h3 try-done-1">{TRY_IT.done}</p>
                <p className="t-lead try-done-2">{TRY_IT.doneSub}</p>
                <div className="try-actions">
                  <SceneCta request={() => ({ intent: "trial", source: "try" })} />
                </div>
                <button type="button" className="link try-again" onClick={onClockOut}>
                  {TRY_IT.again}
                </button>
                <span className="sr-only">{TRY_IT.live}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <StageAnchor id="try" className="try-anchor">
        <div ref={anchor} className="try-fit" onPointerMove={clock.poke} onFocusCapture={clock.poke}>
          {k > 0 && (
            <div className="try-frame" style={{ width: TRY_FRAME[0] * k, height: TRY_FRAME[1] * k }}>
              {no3d && (
                <Suspense fallback={null}>
                  <TryDomPhone
                    k={k}
                    awake={awake}
                    on={clock.on}
                    secs={secs}
                    ghost={clock.ghost}
                    live={pinned}
                    breathe={breathed && untouched}
                    onClockIn={() => clock.clockIn("visitor")}
                    onClockOut={clock.clockOut}
                  />
                </Suspense>
              )}
              {/* the jobsite, under the phone's chin; once clocked in, the stamp under it */}
              <p
                className={`try-cap${captioned && phase !== -1 ? " is-on" : ""}${clock.on ? " is-clocked" : ""}`}
                style={{ top: `calc(50% + ${(CHIN * k + CAP_GAP).toFixed(1)}px)` }}
                aria-hidden="true"
              >
                <span className="try-cap-site">{TRY_IT.site}</span>
                <span className="try-cap-stamp">{stamp ? TRY_IT.clocked.replace("{time}", stamp) : "\u00a0"}</span>
              </p>
              <div
                ref={layer}
                className={`try-ov${live ? " is-live" : ""}`}
                style={{ ["--k" as string]: k } as CSSProperties}
              >
                {/* the Clock In circle on "Ready to clock in?" */}
                <button
                  ref={inRef}
                  type="button"
                  className={`try-in${clock.on ? " is-off" : ""}${clock.ghost ? " is-ghost" : ""}`}
                  style={{ left: cin.x, top: cin.y, width: CLOCK_IN.d * SX * k, height: CLOCK_IN.d * SX * k }}
                  onClick={onClockIn}
                  disabled={clock.on}
                  tabIndex={live && !clock.on ? 0 : -1}
                  aria-label={TRY_IT.clockIn}
                  data-cursor="cta"
                  data-cursor-label="Clocked in · {time}"
                  data-cursor-magnet="4"
                >
                  <span className="try-ghost" aria-hidden="true" />
                </button>
                {/* the Clock Out pill on "Currently working on" */}
                <button
                  type="button"
                  className={`try-out${clock.on ? " is-on" : ""}`}
                  style={{ left: cout.x, top: cout.y, width: CLOCK_OUT.w * SX * k, height: CLOCK_OUT.h * SY * k }}
                  onClick={onClockOut}
                  disabled={!clock.on}
                  tabIndex={live && clock.on ? 0 : -1}
                  aria-label={TRY_IT.clockOut}
                />
              </div>
            </div>
          )}
        </div>
      </StageAnchor>

      <ul className="try-facts">
        {TRY_IT.facts.map((f) => (
          <li key={f.lead} data-cursor="text">
            <strong>{f.lead}</strong> {f.rest}
          </li>
        ))}
      </ul>
    </div>
  );
}
