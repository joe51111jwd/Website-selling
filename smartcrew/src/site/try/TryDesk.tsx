// Try it on desktop: "Pick up the phone" (scratchpad design/v2/scroll/SCROLL_SHOTS.md §1). The 3D
// iPhone (the Stage, fitted into the "try" anchor) is picked up out of the bottom of the frame and
// tilts upright as the scene rises (./poses.ts); its screen wakes on "Ready to clock in?" when it
// is nearly upright (./wake.ts). Once the scene settles: the jobsite's caption under the phone,
// one breath of the Clock In circle, and at 3.2 s, if untouched, the self demo. Real buttons sit
// exactly on the screen's Clock In circle and, once clocked in, on its Clock Out button; the
// screen swaps to "Currently working on" and a timer that starts at the tap runs on it; the
// caption's second line stamps the time. No fence, ring or dot round the phone: the screen's own
// change is the confirmation. Copy left, the two quiet facts right.
//
// Once it holds still, the live crew app (./TryScreen.tsx) lies exactly over the 3D screen, so every
// control on it works (Break, Log & Switch, the tabs, the week strip, …). Resting on the phone or
// tapping it dims the rest of the page (./focus.tsx); a tap on the dim, Esc or scrolling undims.

import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TRY_IT } from "../../content/copy";
import { italicize } from "./italicize";
import { CLASSIC } from "../../lib/look";
import { StageAnchor } from "../../three/stage/StageAnchor";
import { clearScreen, onStatus, reducedMotion, setScreen, status } from "../../three/stage/store";
import { SceneCta } from "./SceneCta";
import { localTime, useClock, useElapsed, useSelfDemo, useStagePhase } from "./clock";
import { TRY_FLOAT, TRY_FRAME } from "./poses";
import { startScreenTimer } from "./screenTimer";
import { useWake } from "./wake";
import { FocusLayer, useFocusMode } from "./focus";

const ease = [0.22, 1, 0.36, 1] as const;

// without the 3D phone the scene shows the live app in a plain frame (loaded only then); with it,
// the live app lies over the 3D screen once the phone holds still
const TryDomPhone = lazy(() => import("./TryDomPhone"));
const TryScreen = lazy(() => import("./TryScreen"));

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
// below the device's centre. The live app is laid over the screen with these.
const SX = 0.001826;
const SY = 0.0018386;
const CY0 = 0.0031;

/** The iPhone model's body, device units (TryDomPhone's BODY). */
const BODY = { w: 0.79, h: 1.6336, r: 0.125 };
/** The 3D screen's corner radius, native px. */
const SCREEN_R = 56;
/** The iPhone model's half height: the caption sits under its chin. */
const CHIN = BODY.h / 2;
/** The caption's gap under the chin, px. */
const CAP_GAP = 18;
/** The breath comes 1.2 s after the scene pins (`pinned` already waits 0.26 s for the Stage). */
const BREATHE_AFTER = 940;


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
function useFloat(layer: React.RefObject<HTMLDivElement | null>, k: number, active: boolean, also?: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = layer.current;
    if (!el || reducedMotion || !active || !k) {
      if (el) el.style.transform = "";
      if (also?.current) also.current.style.transform = "";
      return;
    }
    let raf = 0;
    const tick = () => {
      const t = performance.now() / 1000;
      const fy = Math.sin(t * 0.9 + 1.7) * 0.05 * TRY_FLOAT;
      const rz = Math.sin(t * 0.6 + 1.7) * 0.5 * TRY_FLOAT;
      const tf = `translate3d(0, ${(-fy * k).toFixed(2)}px, 0) rotate(${(-rz).toFixed(3)}deg)`;
      el.style.transform = tf;
      // the focus mode's hole rides the phone too
      if (also?.current) also.current.style.transform = tf;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layer, k, active, also]);
}

/** The section is mostly on screen (the DOM phone has no pin to wait for). */
function useInView(id: string, threshold = 0.5) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [id, threshold]);
  return seen;
}

export function TryDesk() {
  const anchor = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const fit = useFit(anchor);
  const { phase: stagePhase, pinned: stagePinned } = useStagePhase("try");
  const no3d = useNo3D();
  // without the 3D phone (round 4: always) there is no pin: "settled" means mostly on screen
  const seen = useInView("try");
  const pinned = no3d ? seen : stagePinned;
  const phase = no3d ? (seen ? 0 : -1) : stagePhase;
  // the 3D phone's wake (its black plate lifts as the scene comes up); the DOM phone is always on
  useWake("try");
  const clock = useClock();
  const secs = useElapsed(clock.on, clock.since);
  // the caption has come (it then stays, except while the phone is away below the frame)
  const [captioned, setCaptioned] = useState(reducedMotion);
  const [breathed, setBreathed] = useState(false);
  const [stamp, setStamp] = useState("");
  const timerRef = useRef<ReturnType<typeof startScreenTimer> | null>(null);
  const onClockIn = () => clock.clockIn("visitor");
  const onClockOut = clock.clockOut;
  const doneRef = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const holeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pinned) setCaptioned(true);
  }, [pinned]);
  // classic: no self demo; the phone waits for his tap with Clock In pulsing (Andrew, Oct 22: people
  // didn't know it was clickable, so playing with it is the section's call to action)
  useSelfDemo(clock, !CLASSIC && pinned);
  // the 3D phone floats a little; the DOM phone holds still
  useFloat(layer, fit.k, pinned && !no3d, holeRef);

  // one breath of the Clock In circle, the first time the scene settles untouched
  // (on the live app over the screen: it is on top by then)
  const untouched = !clock.on && !clock.touched && !clock.demoed;
  useEffect(() => {
    if (breathed || !pinned || !untouched || reducedMotion) return;
    const t = window.setTimeout(() => setBreathed(true), BREATHE_AFTER);
    return () => window.clearTimeout(t);
  }, [breathed, pinned, untouched]);

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
  // the DOM phone takes taps wherever it is on screen; the 3D one only once it holds still
  const live = k > 0 && (no3d || pinned);
  const app = {
    on: clock.on,
    secs,
    ghost: clock.ghost,
    live,
    breathe: breathed && untouched,
    // classic: Clock In pulses until he taps (Andrew, Oct 22: make the phone "the primary call to action")
    tapMe: CLASSIC && live && !clock.on && !clock.touched,
    onClockIn,
    onClockOut,
    onTouch: clock.touch,
  };

  // focus mode: the hole is the phone's body, measured unmoved (the float moves the hole itself)
  const measure = useCallback(() => {
    const f = frame.current!.getBoundingClientRect();
    const w = BODY.w * k + 4;
    const h = BODY.h * k + 4;
    return { x: f.left + f.width / 2 - w / 2, y: f.top + f.height / 2 - h / 2, w, h, r: `${(BODY.r * k + 2).toFixed(1)}px` };
  }, [k]);
  const focus = useFocusMode({ el: hit, live, hover: true, measure, onEnter: CLASSIC ? undefined : clock.touch });

  return (
    <div className="try-grid wrap">
      <div className="try-copy">
        <h2 className="t-h2 try-title">{italicize(TRY_IT.title, TRY_IT.em)}</h2>
        <p className="t-lead try-sub">{TRY_IT.sub}</p>
        <div className="try-actions">
          <SceneCta request={() => ({ intent: "trial", source: "try" })} />
        </div>
        {/* once clocked in (by the visitor or the self demo): a way back to the start */}
        <div className="try-say" aria-live="polite">
          <AnimatePresence initial={false}>
            {clock.on && (
              <motion.div
                key="done"
                ref={doneRef}
                tabIndex={-1}
                className="try-done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease, delay: 0.2 }}
              >
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
            <div ref={frame} className="try-frame" style={{ width: TRY_FRAME[0] * k, height: TRY_FRAME[1] * k }}>
              {/* the jobsite, under the phone's chin; once clocked in, the stamp under it. Not in
                  classic: Andrew cut it ("cut this piece right here. That's unnecessary", Oct 20) */}
              {!CLASSIC && <p
                className={`try-cap${captioned && phase !== -1 ? " is-on" : ""}${clock.on ? " is-clocked" : ""}`}
                style={{ top: `calc(50% + ${(CHIN * k + CAP_GAP).toFixed(1)}px)` }}
                aria-hidden="true"
              >
                <span className="try-cap-site">{TRY_IT.site}</span>
                <span className="try-cap-stamp">{stamp ? TRY_IT.clocked.replace("{time}", stamp) : "\u00a0"}</span>
              </p>}
              <div
                ref={layer}
                className={`try-ov${live || no3d ? " is-live" : ""}${focus.open ? " is-focus" : ""}`}
                style={{ ["--k" as string]: k } as CSSProperties}
              >
                {/* the phone: taps, hover and focus here open focus mode */}
                <div ref={hit} className="try-hit" data-cursor="hide" style={{ width: BODY.w * k, height: BODY.h * k, borderRadius: BODY.r * k }}>
                  <Suspense fallback={null}>
                    {no3d ? (
                      // the DOM phone is on from the start: no black screen while it scrolls in
                      <TryDomPhone k={k} awake {...app} />
                    ) : (
                      <div
                        className="try-scr"
                        style={{
                          width: 402 * SX * k,
                          height: 874 * SY * k,
                          marginTop: CY0 * k,
                          borderRadius: SCREEN_R * SX * k,
                        }}
                      >
                        <TryScreen sx={SX * k} sy={SY * k} {...app} />
                      </div>
                    )}
                  </Suspense>
                </div>
              </div>
            </div>
          )}
        </div>
      </StageAnchor>

      <FocusLayer open={focus.open} soft={focus.soft} hole={focus.hole} onExit={focus.exit} variant="desk" holeRef={holeRef} />

      {/* Andrew's round 2: "…But don't take our word for it… Try it yourself." with an arrow to the phone;
          his Loom (Oct 20): "some cool design piece that has the arrow coming here", so classic's arrow
          is hand drawn, loops once and runs right up to the phone, drawing itself in as the section
          arrives (try.css) */}
      {/* classic (Andrew's fixes video, Oct 22): this is now the section's headline, left of the
          phone with the arrow pointing right at it; "So Simple…" and the button sit right of it */}
      <div className="try-nudge" aria-hidden={CLASSIC ? undefined : true}>
        <p className="try-nudge-lead">{TRY_IT.nudgeLead}</p>
        <p className="try-nudge-try">{TRY_IT.nudge}</p>
        {CLASSIC ? (
          <svg className="try-nudge-arrow try-nudge-swoop" viewBox="0 0 260 120" fill="none">
            <path
              className="try-swoop-line"
              pathLength={1}
              d="M236 10C238 46 214 80 170 86C136 91 112 70 124 52C136 35 164 48 156 72C147 98 98 106 60 100C42 97 28 92 14 84"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path className="try-swoop-head" d="M22 96.7 14 84l15 .5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="try-nudge-arrow" viewBox="0 0 200 24" fill="none">
            <path d="M196 12H8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="9 9" />
            <path d="M17 3 6 12l11 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
