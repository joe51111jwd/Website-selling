// 2 · One Day. A pinned scene: seven moments of one workday at Cedar Ridge Earthworks, 0.76 of a
// screen of scroll each (./clock.ts PER_MOMENT). Skim it and you get the story from four things
// per moment: the big time (rolling like an odometer), a headline of six words or fewer, ONE big
// state label on the phone ("Clocked in") and ONE on the office laptop ("Marcus · on site 6:42").
// Read it and you see the cause and the effect on the real UI: a finger lands on the phone's
// button, the screen changes, an orange pulse crosses, the office screen updates in place (row
// slides in, number ticks, pill flips), the camera pushes in on it, and the update card shows
// that exact row, crisp, with a leader line to it. The light follows the clock; the rail jumps between moments.
//
// The 3D choreography is ./poses.ts, the screen animations and the triggers ./life.ts, both from
// ./script.ts. This file is the DOM: copy, labels, card, touch ripple, leader lines, rail.

import { Fragment, lazy, Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { MOMENTS, type Moment } from "../../content/moments";
import { DAY2, DAY2_UI, DAY_UI, FLAG } from "../../content/copy";
import { Scene, stepOf, useSceneProgress } from "../scene/Scene";
import { StageAnchor } from "../../three/stage/StageAnchor";
import { onStageChange, onStatus, phone, reducedMotion, sceneProgress, status } from "../../three/stage/store";
import type { StageFrame } from "../../three/stage/store";
import { openSignup } from "../../signup/contract";
import { Arrow, InlineCta } from "../ui/Cta";
import { scrollToScene } from "../scroll";
import { DAY_STEPS, JUMP, PER_MOMENT, beat, dayClock, dayPresence, groundAt, luminance } from "./clock";
import { dayPosterFrame, dayPoses, markOf, tapOf } from "./poses";
import { SCRIPT } from "./script";
import { dayLive, onDayFrame, startDayLife, type DayLive } from "./life";
import { Odometer } from "./Odometer";
import { usePhoneLite } from "../phone";
import DayPhone from "./phone/DayPhone";
import "./day.css";

const UpdateCardBody = lazy(() => import("./UpdateCard"));

const ease = [0.22, 1, 0.36, 1] as const;

/** Margin the poster stills were rendered with. */
const POSTER_PAD = phone ? 0 : 0.04;

/** The two moments that end on a peak get the one-tap way to the popup. */
const PEAKS = new Set<Moment["id"]>(["profit", "payroll"]);

/**
 * The scene's step from the scroll position (React state, changes seven times), and the page
 * ground following the clock (written straight to the DOM). Re-syncs whenever the Stage
 * re-measures, so a page that loads mid-scene shows the right moment at once.
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

/** The live layer (taps, office updates) and the light, once the Stage is up; the DOM state at once. */
function useDayLife() {
  useEffect(() => {
    let gone = false;
    let stopFx = () => {};
    const stopLife = startDayLife();
    // the update card's chunk (the app kit) loads while the visitor is still on the hero
    const idle = window.setTimeout(() => void import("./UpdateCard"), 1200);
    const go = () => {
      if (gone) return;
      import("./stageFx")
        .then((m) => {
          if (!gone) stopFx = m.startStageFx();
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
      window.clearTimeout(idle);
      off();
      stopFx();
      stopLife();
    };
  }, []);
  return useSyncExternalStore(dayLive.subscribe, dayLive.get, dayLive.get);
}

/** Direction of the last step change: forward in time (1) or back (-1). */
function useStepDir(step: number) {
  const last = useRef({ step, dir: 1 });
  if (last.current.step !== step) last.current = { step, dir: step > last.current.step ? 1 : -1 };
  return last.current.dir;
}

function Features({ m }: { m: Moment }) {
  const last = m.features.length - 1;
  return (
    <>
      {m.features.map((f, k) => (
        <Fragment key={f.id}>
          {k > 0 && " "}
          {/* the middot is glued to the end of the label before it, so a line never starts with one */}
          <span className="day-feature">
            {f.label}
            {f.confirm && (
              <span className="flag" title="Andrew to confirm">
                {FLAG}
              </span>
            )}
            {k < last && (
              <span className="day-dot" aria-hidden="true">
                {"\u00a0·"}
              </span>
            )}
          </span>
        </Fragment>
      ))}
    </>
  );
}

const textVariants = {
  enter: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
const lineVariants = {
  enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 18 : -18 }),
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
  exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -12 : 12, transition: { duration: 0.2, ease } }),
};

function MomentText({ m, dir }: { m: Moment; dir: number }) {
  return (
    <div className="day-text">
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div key={m.id} className="day-text-in" variants={textVariants} initial="enter" animate="show" exit="exit" custom={dir}>
          <motion.h3 className="day-title" variants={lineVariants} custom={dir}>
            {DAY2[m.id].headline}
          </motion.h3>
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
              aria-label={`${m.when}: ${DAY2[m.id].headline}`}
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
          <button type="button" onClick={() => openSignup({ intent: "trial", source: "day-rail" })} aria-label={DAY_UI.crewAria} data-cursor="cta" data-cursor-magnet="3">
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

// ─── the office: its big state label + the update card ─────────────────────────
/** Without WebGL (posters only) nothing can be pinned to the phone: its label joins the office's. */
function useNoStage() {
  const [no, setNo] = useState(() => !status.webgl || status.failed);
  useEffect(() => onStatus(() => setNo(!status.webgl || status.failed)), []);
  return no;
}

function OfficeCard({ st, cardRef }: { st: DayLive; cardRef: RefObject<HTMLDivElement | null> }) {
  const m = MOMENTS[st.i];
  const copy = DAY2[m.id];
  const noStage = useNoStage();
  return (
    <div className="day-office" ref={cardRef} data-on={st.officeLabel ? "1" : "0"}>
      <AnimatePresence initial={false}>
        {st.officeLabel && (
          <motion.div
            key={m.id}
            className="day-office-in"
            initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
          >
            {noStage && st.phoneLabel && (
              <p className="day-tag day-tag--phone" aria-hidden="true">
                <span className="day-tag-dot" />
                {copy.phone}
              </p>
            )}
            <p className="day-tag day-tag--office">
              <span className="day-tag-dot" aria-hidden="true" />
              <span className="sr-only">{DAY2_UI.officeSr} </span>
              {copy.office}
            </p>
            <div className="day-card" data-cursor="text">
              <p className="day-card-where">{copy.where}</p>
              <Suspense fallback={<div className="day-card-wait" />}>
                <UpdateCardBody id={m.id} />
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── the annotation layer: touch ripple, the phone's label, leader lines ───────
const PHONE_W = 402;

function Annotations({ st, cardRef }: { st: DayLive; cardRef: RefObject<HTMLDivElement | null> }) {
  const touch = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const lineP = useRef<SVGLineElement>(null);
  const haloP = useRef<SVGLineElement>(null);
  const haloO = useRef<SVGPolylineElement>(null);
  const officeG = useRef<SVGGElement>(null);
  const dotP = useRef<SVGCircleElement>(null);
  const lineO = useRef<SVGPolylineElement>(null);
  const dotO = useRef<SVGCircleElement>(null);
  const ringO = useRef<SVGCircleElement>(null);
  const m = MOMENTS[st.i];
  const up = SCRIPT[st.i].dir === "up";

  useEffect(() => {
    const set = (el: Element | null, attrs: Record<string, string | number>) => {
      if (!el) return;
      for (const k in attrs) {
        const v = String(attrs[k]);
        if (el.getAttribute(k) !== v) el.setAttribute(k, v);
      }
    };
    const place = (el: HTMLElement | null, x: number, y: number) => {
      if (!el) return;
      const t = `translate3d(${Math.round(x * 10) / 10}px, ${Math.round(y * 10) / 10}px, 0)`;
      if (el.style.transform !== t) el.style.transform = t;
    };
    return onDayFrame((f: StageFrame, s: DayLive) => {
      const i = s.i;
      const sc = SCRIPT[i];
      const tap = tapOf(i);
      // all layout reads first, then the writes (no forced layout per frame)
      const c = chip.current;
      const cw = c?.offsetWidth ?? 0;
      const ch = c?.offsetHeight ?? 0;
      const cardRect = cardRef.current?.querySelector<HTMLElement>(".day-card")?.getBoundingClientRect() ?? null;
      // the touch ripple sits on the button that gets tapped
      if (tap) {
        const p = f.project(tap.device, tap.px[0], tap.px[1]);
        if (p) place(touch.current, p.x, p.y);
      }
      // the phone's label: beside the phone, level with where its screen shows the new state
      const [ax, ay] = sc.phone.mark;
      const edge = f.project("iphone", PHONE_W, ay);
      const from = f.project("iphone", ax, ay);
      if (edge && from && c) {
        const w = cw;
        const h = ch;
        let x = edge.x + (phone ? 10 : 22);
        if (x + w > f.w - 8) x = Math.max(8, f.w - 8 - w);
        const y = Math.max(phone ? 60 : 72, Math.min(f.h - h - 8, edge.y - h / 2));
        place(c, x, y);
        if (c.dataset.placed !== "1") c.dataset.placed = "1";
        set(lineP.current, { x1: from.x, y1: from.y, x2: x, y2: y + h / 2 });
        set(haloP.current, { x1: from.x, y1: from.y, x2: x, y2: y + h / 2 });
        set(dotP.current, { cx: from.x, cy: from.y });
      }
      // the office leader: from the card to the spot that changed
      const mk = markOf(i);
      const to = f.project("macbook", mk[0], mk[1]);
      if (to && cardRect) {
        const r = cardRect;
        const below = to.y > r.bottom;
        const sx = Math.max(r.left + 28, Math.min(r.right - 28, to.x));
        const sy = below ? r.bottom : r.top;
        const ex = to.x;
        const ey = to.y;
        const pts = `${sx},${sy} ${sx},${sy + (below ? 1 : -1) * Math.min(18, Math.abs(ey - sy) / 2)} ${ex},${ey}`;
        set(lineO.current, { points: pts });
        set(haloO.current, { points: pts });
        set(dotO.current, { cx: ex, cy: ey });
        set(ringO.current, { cx: ex, cy: ey });
        officeG.current?.style.setProperty("opacity", "1");
      } else officeG.current?.style.setProperty("opacity", "0");
    });
  }, [cardRef]);

  return (
    <div className="day-ann" aria-hidden="true">
      <svg ref={svg} className="day-ann-svg" data-phone={st.phoneLabel ? "1" : "0"} data-office={st.officeLabel ? "1" : "0"}>
        <line ref={haloP} className="day-lead day-lead-halo day-lead--phone" />
        <line ref={lineP} className="day-lead day-lead--phone" />
        <circle ref={dotP} className="day-lead-dot day-lead--phone" r="3.5" />
        <g ref={officeG}>
          <polyline ref={haloO} className="day-lead day-lead-halo day-lead--office" fill="none" />
          <polyline ref={lineO} className="day-lead day-lead--office" fill="none" />
          <circle ref={ringO} className="day-lead-ring day-lead--office" r="9" />
          <circle ref={dotO} className="day-lead-dot day-lead--office" r="3.5" />
        </g>
      </svg>
      <div ref={touch} className="day-touch">
        {st.tapped && <span key={`${st.i}-${st.tapCount}`} className={`day-touch-in${up ? "" : " is-click"}`} />}
      </div>
      <div ref={chip} className="day-chip" data-on={st.phoneLabel ? "1" : "0"}>
        <p className="day-tag day-tag--phone">
          <span className="day-tag-dot" />
          {DAY2[m.id].phone}
        </p>
      </div>
    </div>
  );
}

function DayStage() {
  const grid = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = useDaySync(grid);
  const st = useDayLife();
  const dir = useStepDir(step);
  const m = MOMENTS[step];
  const frame = dayPosterFrame();
  return (
    <div className="day-grid wrap" ref={grid} data-cursor-tone="light">
      <div className="day-copy" aria-live="polite">
        <Odometer value={m.when} step={step} className="t-time day-time" />
        <MomentText m={m} dir={dir} />
        <p className="sr-only">
          {DAY2_UI.phoneSr} {DAY2[m.id].phone}. {DAY2_UI.officeSr} {DAY2[m.id].office}.
        </p>
      </div>
      <StageAnchor id="day" className="day-stage" poster={{ src: `renders/day-${m.id}${phone ? "-phone" : ""}.webp`, frame, pad: POSTER_PAD, alt: `${m.when}: ${DAY2[m.id].headline}` }}>
        <OfficeCard st={st} cardRef={cardRef} />
        <p className="day-caption">{DAY_UI.caption}</p>
      </StageAnchor>
      <Rail step={step} />
      <Annotations st={st} cardRef={cardRef} />
    </div>
  );
}

/** Phones get the light 2D day (./phone/DayPhone.tsx: one screen per moment, plays on arrival). */
export default function Day() {
  return usePhoneLite() ? <DayPhone /> : <DayDesk />;
}

function DayDesk() {
  const poses = useMemo(dayPoses, []);
  return (
    <Scene id="day" pinnedViewports={DAY_STEPS * PER_MOMENT + 1} poses={poses} label={DAY_UI.rail} className="day">
      <DayStage />
    </Scene>
  );
}
