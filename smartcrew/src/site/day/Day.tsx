// 2 · One Day. A pinned scene: seven moments of one workday at Cedar Ridge Earthworks, one
// screen of scroll each. Left (top on phones): the time rolling like an odometer, what happens,
// what it means for the office, and the features it carries as one quiet line. Right: the Stage
// plays the moment: the phone acts, an orange pulse crosses, the laptop's row lights up, each
// moment in its own shot. The light follows the clock: the 3D sun moves and warms with the time
// and the page ground tints with it, dawn to Friday night. The rail jumps between moments; its
// last stop opens the popup.

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { MOMENTS, type Moment } from "../../content/moments";
import { DAY_UI, FLAG } from "../../content/copy";
import { Scene, stepOf, useSceneProgress } from "../scene/Scene";
import { StageAnchor } from "../../three/stage/StageAnchor";
import { onStageChange, onStatus, phone, sceneProgress, status } from "../../three/stage/store";
import { openSignup } from "../../signup/contract";
import { Arrow, InlineCta } from "../ui/Cta";
import { scrollToScene } from "../scroll";
import { DAY_STEPS, JUMP, beat, dayClock, dayPresence, groundAt, luminance } from "./clock";
import { dayFrame, dayPoses } from "./poses";
import { startDayLife } from "./life";
import { Odometer } from "./Odometer";
import "./day.css";

const ease = [0.22, 1, 0.36, 1] as const;

/** Margin the poster stills were rendered with (scratchpad design/v2/day/posters.cjs): as much
 * as fits inside the viewport they're shot in (the phone's stage is full-bleed). */
const POSTER_PAD = phone ? 0 : 0.04;

/** The two moments that end on a peak get the one-tap way to the popup. */
const PEAKS = new Set<Moment["id"]>(["profit", "payroll"]);

/**
 * The scene's state from the scroll position: the current moment (React state, changes seven
 * times), and the page ground following the clock (written straight to the DOM). It also
 * re-syncs whenever the Stage re-measures the layout, so a page that loads or reloads mid-scene
 * (scroll restoration, a resize, a scene above changing height) shows the right moment at once,
 * not only after the next scroll.
 *
 * Ground: blends from and back to the page's own ground at either end; on a dark ground the
 * header, the Day copy and the cursor switch to light ink. The tint is painted by the shell's
 * fixed .backdrop (z-index -1), which the body's own opaque background covers (negative z-index
 * paints below in-flow backgrounds); while the Day owns the ground the body goes transparent so
 * the backdrop shows. (Shell fix for the lead: base.css `.sc-page body { background:
 * transparent }`; html keeps var(--ground).)
 */
function useDaySync(grid: RefObject<HTMLDivElement | null>) {
  const { scrollY } = useScroll();
  const [step, setStep] = useState(() => stepOf(sceneProgress("day", typeof window === "undefined" ? 0 : window.scrollY), DAY_STEPS));
  const last = useRef({ owned: false, ground: "", tone: "" });

  const sync = () => {
    const y = window.scrollY;
    const p = sceneProgress("day", y);
    const s = stepOf(p, DAY_STEPS);
    setStep((c) => (c === s ? c : s));

    const L = last.current;
    const root = document.documentElement;
    const w = dayPresence(y, window.innerHeight);
    let tone = "light";
    if (w <= 0) {
      if (L.owned) {
        root.style.removeProperty("--page-ground");
        root.removeAttribute("data-ground");
        document.body.style.removeProperty("background-color");
        L.owned = false;
        L.ground = "";
      }
    } else {
      const c = groundAt(dayClock(p), w);
      const ground = `rgb(${c.join(" ")})`;
      const dark = luminance(c) < 0.45;
      tone = dark ? "dark" : "light";
      if (ground !== L.ground) {
        root.style.setProperty("--page-ground", ground);
        L.ground = ground;
      }
      if (root.dataset.ground !== tone) root.dataset.ground = tone;
      if (!L.owned) document.body.style.setProperty("background-color", "transparent");
      L.owned = true;
    }
    if (tone !== L.tone) {
      grid.current?.setAttribute("data-cursor-tone", tone);
      L.tone = tone;
    }
  };

  useMotionValueEvent(scrollY, "change", sync);
  useEffect(() => {
    sync();
    const off = onStageChange(sync);
    return () => {
      off();
      if (!last.current.owned) return;
      document.documentElement.style.removeProperty("--page-ground");
      document.documentElement.removeAttribute("data-ground");
      document.body.style.removeProperty("background-color");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return step;
}

/**
 * Once the Stage is up: draw the two live screens (Monday on the phone, the QuickBooks toast)
 * and load the light + loupe effects (three.js, already in the Stage's chunk by then).
 */
function useDayFx(mac: RefObject<HTMLSpanElement | null>, ph: RefObject<HTMLSpanElement | null>) {
  useEffect(() => {
    let gone = false;
    let stopFx = () => {};
    let stopLife = () => {};
    const go = () => {
      if (gone) return;
      stopLife = startDayLife();
      import("./stageFx")
        .then((m) => {
          if (!gone) stopFx = m.startStageFx({ macbook: mac.current, iphone: ph.current });
        })
        .catch((e) => console.warn("[day] stage effects failed", e));
    };
    let off = () => {};
    if (status.ready) go();
    else
      off = onStatus(() => {
        if (!status.ready) return;
        off();
        go();
      });
    return () => {
      gone = true;
      off();
      stopFx();
      stopLife();
    };
  }, [mac, ph]);
}

/** Direction of the last step change: forward in time (1) or back (-1). */
function useStepDir(step: number) {
  const last = useRef({ step, dir: 1 });
  if (last.current.step !== step) last.current = { step, dir: step > last.current.step ? 1 : -1 };
  return last.current.dir;
}

function Features({ m }: { m: Moment }) {
  return (
    <>
      {m.features.map((f, k) => (
        <span key={f.id} className="day-feature">
          {k > 0 && (
            <span className="day-dot" aria-hidden="true">
              {" · "}
            </span>
          )}
          {f.label}
          {f.confirm && (
            <span className="flag" title="Andrew to confirm">
              {FLAG}
            </span>
          )}
        </span>
      ))}
    </>
  );
}

const textVariants = {
  enter: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.055, delayChildren: 0.06 } },
  exit: { opacity: 0, transition: { duration: 0.22 } },
};
const lineVariants = {
  enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 16 : -16 }),
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
  exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -10 : 10, transition: { duration: 0.22, ease } }),
};

function MomentText({ m, dir }: { m: Moment; dir: number }) {
  return (
    <div className="day-text">
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div key={m.id} className="day-text-in" variants={textVariants} initial="enter" animate="show" exit="exit" custom={dir}>
          <motion.h3 className="t-h3 day-title" variants={lineVariants} custom={dir}>
            {m.title}
          </motion.h3>
          <motion.p className="t-lead day-outcome" variants={lineVariants} custom={dir} data-cursor="text">
            {m.outcome}
          </motion.p>
          <motion.p className="day-features" variants={lineVariants} custom={dir}>
            <Features m={m} />
          </motion.p>
          {PEAKS.has(m.id) && (
            <motion.div variants={lineVariants} custom={dir}>
              <InlineCta source={`day-${m.id}`} className="day-cta" />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** A rail segment fills as the visitor scrolls through its moment. */
function RailFill({ i, progress }: { i: number; progress: MotionValue<number> }) {
  const scaleX = useTransform(progress, [beat(i, 0), beat(i, 1)], [0, 1], { clamp: true });
  return <motion.span className="day-rail-fill" style={{ scaleX }} />;
}

function Rail({ step }: { step: number }) {
  const progress = useSceneProgress();
  return (
    <nav className="day-rail" aria-label={DAY_UI.rail}>
      <ol>
        {MOMENTS.map((m, i) => (
          <li key={m.id} className={i === step ? "is-on" : i < step ? "is-past" : undefined}>
            <button
              type="button"
              onClick={() => scrollToScene("day", beat(i, JUMP))}
              aria-current={i === step ? "step" : undefined}
              aria-label={`${m.when}: ${m.title}`}
              data-cursor="view"
              data-cursor-label={DAY_UI.short[m.id]}
            >
              <span className="day-rail-track" aria-hidden="true">
                <RailFill i={i} progress={progress} />
              </span>
              <span className="day-rail-t" aria-hidden="true">
                {m.when}
              </span>
            </button>
          </li>
        ))}
        <li className="day-rail-end">
          <button
            type="button"
            onClick={() => openSignup({ intent: "trial", source: "day-rail" })}
            aria-label={DAY_UI.crewAria}
            data-cursor="cta"
            data-cursor-magnet="3"
          >
            <span className="day-rail-track" aria-hidden="true" />
            <span className="day-rail-t">
              {DAY_UI.crew}
              <Arrow className="day-rail-arrow" />
            </span>
          </button>
        </li>
      </ol>
    </nav>
  );
}

function DayStage() {
  const grid = useRef<HTMLDivElement>(null);
  const step = useDaySync(grid);
  const dir = useStepDir(step);
  const loupeMac = useRef<HTMLSpanElement>(null);
  const loupePhone = useRef<HTMLSpanElement>(null);
  useDayFx(loupeMac, loupePhone);
  const m = MOMENTS[step];
  const frame = dayFrame();
  return (
    <div className="day-grid wrap" ref={grid} data-cursor-tone="light">
      <div className="day-copy" aria-live="polite">
        <Odometer value={m.when} step={step} className="t-time day-time" />
        <MomentText m={m} dir={dir} />
      </div>
      <StageAnchor
        id="day"
        className="day-stage"
        poster={{ src: `renders/day-${m.id}${phone ? "-phone" : ""}.webp`, frame, pad: POSTER_PAD, alt: `${m.when}: ${m.title}` }}
      >
        {/* the cursor's loupe over both screens; stageFx writes each screen's corners every frame */}
        <div className="day-loupe" data-cursor="loupe">
          <span ref={loupeMac} hidden data-loupe-src="" data-loupe-space="viewport" data-loupe-dpr="2" data-cursor-label={DAY_UI.office} />
          <span
            ref={loupePhone}
            hidden
            data-loupe-src=""
            data-loupe-space="viewport"
            data-loupe-dpr="3"
            data-loupe-size="168"
            data-cursor-label={DAY_UI.crewApp}
          />
        </div>
        <p className="day-caption">{DAY_UI.caption}</p>
      </StageAnchor>
      <Rail step={step} />
    </div>
  );
}

export default function Day() {
  const poses = useMemo(dayPoses, []);
  return (
    <Scene id="day" pinnedViewports={DAY_STEPS + 1} poses={poses} label={DAY_UI.rail} className="day">
      <DayStage />
    </Scene>
  );
}
