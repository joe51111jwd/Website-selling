// Classic's "Everything. Built for dirt." as a feature wheel (James, Oct 20, from his drawing: "a
// carousel… don't make the curve that drastic. You have one at the top, and then you have stuff
// below it. As you scroll through it, it selects the next one. That will pop up and sync to the
// iPad"; before that, Andrew: the type felt tight and a card's name read smaller than its headline;
// and the section fits one screen).
//
// Desktop: the section holds still while the scroll turns the wheel, one feature per step (a pinned
// <Scene>, so the scroll is the page's own, nothing hijacked). The ten sit on a gentle arc on the
// left, the picked one opened out at its middle as a card (icon, name, Andrew's headline, his line,
// his bullets); the others fan above and below it. Beside it an iPad shows the office app on that
// feature's screen, and it stays live: picking a screen in its sidebar turns the wheel to match.
// A click on any feature, or ↑ ↓ on the wheel, scrolls to its step.
//
// Phones: no pinning. The iPad on top with a still of the screen (a tap opens the walkthrough there),
// then the card, which turns with its arrows, its dots, or a swipe on it or the iPad.

import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type TouchEvent } from "react";
import { FEATURES, type FeatureId } from "../../content/features";
import { Scene, stepAt, useSceneStep, type StepRange } from "../scene/Scene";
import { usePhoneLite } from "../phone";
import { useArrive } from "../phone/useArrive";
import { scrollToY } from "../scroll";
import { sceneY } from "../../three/stage/store";
import { AllTools } from "../specsheet/AllTools";
import { stepOf as walkStepOf } from "../specsheet/Walk";
import { Icon } from "../../screens/kit/Icon";
import { Cta } from "../ui/Cta";
import { FEATURE_LIST, featureById, screenDef, type Feature } from "./data";
import { AllButton } from "./Features";
import "../specsheet/all-tools.css";
import "./features.css";
import ipadFrame from "./ipad-mini-frame.webp";
import "./wheel.css";

const AppWindow = lazy(() => import("./AppWindow"));

const N = FEATURE_LIST.length;
/** screens of scroll the desktop wheel takes (one is the section itself): ~⅓ screen per feature */
const PIN = 4;
/** the steps sit in this slice of the scene's progress (a little hold at either end) */
const RANGE: StepRange = { start: 0.03, end: 0.97 };
const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ClassicFeatures() {
  const phone = usePhoneLite();
  const [all, setAll] = useState<{ open: boolean; at: number | null }>({ open: false, at: null });
  const openAll = (at: number | null) => setAll({ open: true, at });
  const walkAt = (id: FeatureId) => openAll(walkStepOf(featureById(id).tools[0]));

  return (
    <>
      <Scene id="features" pinnedViewports={phone ? 0 : PIN} stage="keep" label={FEATURES.label} className={`ft ftw-scene${phone ? "" : " is-pinned-wheel"}`}>
        {phone ? <PhoneWheel onAll={() => openAll(null)} onWalk={walkAt} /> : <DeskWheel onAll={() => openAll(null)} />}
      </Scene>
      <div className={`ft ftw-after${phone ? " is-phone" : ""}`}>
        <div className={`ft-in wrap${phone ? " is-phone" : " is-desk"}`} data-in="">
          <div className="ft-close">
            <h3 className="ft-close-title">{FEATURES.close.title}</h3>
            <p className="ft-close-sub">{FEATURES.close.sub}</p>
            <Cta source="features-close" size="lg" block={phone} className="ft-close-cta" />
          </div>
        </div>
      </div>
      <AllTools open={all.open} startAt={all.at} onClose={() => setAll((s) => ({ ...s, open: false }))} variant={phone ? "phone" : "desk"} />
    </>
  );
}

function Head({ onAll, phone }: { onAll: () => void; phone: boolean }) {
  return (
    <div className="ft-head">
      <div className="ft-head-text" data-ft-in="1">
        <p className="ft-kicker">{FEATURES.kicker}</p>
        <h2 className="t-h2 ft-title">{FEATURES.title}</h2>
        <p className="t-lead ft-sub">{FEATURES.sub}</p>
      </div>
      {!phone && <AllButton onClick={onAll} />}
    </div>
  );
}

// ─── desktop ──────────────────────────────────────────────────────────────────

function DeskWheel({ onAll }: { onAll: () => void }) {
  const [arriveRef, arrived] = useArrive<HTMLDivElement>({ amount: 0.3 });
  const step = useSceneStep(N, RANGE);
  const active = FEATURE_LIST[step];
  const [screen, setScreen] = useState(active.screen);

  // the iPad follows the wheel (unless it's already on one of that feature's screens)
  useEffect(() => {
    setScreen((cur) => (screenDef(cur).feature === active.id ? cur : active.screen));
  }, [active.id, active.screen]);

  // a feature picked anywhere: scroll to its step (the wheel turns as the page gets there)
  const goTo = useCallback((i: number) => {
    const y = sceneY("features", stepAt(Math.max(0, Math.min(N - 1, i)), N, 0.5, RANGE));
    if (y !== null) scrollToY(y);
  }, []);

  // a screen picked in the iPad's sidebar turns the wheel to its feature
  const onScreen = useCallback(
    (id: string) => {
      setScreen(id);
      const i = FEATURE_LIST.findIndex((f) => f.id === screenDef(id).feature);
      if (i !== step) goTo(i);
    },
    [goTo, step],
  );

  return (
    <div ref={arriveRef} className="ftw ft-in wrap is-desk" data-in={arrived || reduce ? "" : undefined}>
      <Head onAll={onAll} phone={false} />
      <div className="ftw-stage">
        <Dial active={step} onPick={goTo} />
        <div className="ftw-ipad-col" data-ft-in="4">
          <Ipad>
            <Suspense fallback={<div className="ft-app ft-app--wait" aria-hidden="true" />}>
              <AppWindow screen={screen} onScreen={onScreen} arrived={arrived} />
            </Suspense>
          </Ipad>
        </div>
      </div>
    </div>
  );
}

/** The wheel: the picked feature opened out at the arc's middle, the rest fanned above and below. */
function Dial({ active, onPick }: { active: number; onPick: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [half, setHalf] = useState(130);

  // the open card's height sets how far its neighbours sit from it
  useLayoutEffect(() => {
    const card = ref.current?.querySelector<HTMLElement>(".ftw-item.is-on");
    if (!card) return;
    const measure = () => setHalf(Math.round(card.offsetHeight / 2));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(card);
    return () => ro.disconnect();
  }, [active]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const to = e.key === "ArrowDown" || e.key === "ArrowRight" ? active + 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? active - 1 : null;
    if (to === null || to < 0 || to >= N) return;
    e.preventDefault();
    onPick(to);
  };

  return (
    <div ref={ref} className="ftw-dial" role="tablist" aria-orientation="vertical" aria-label={FEATURES.label} onKeyDown={onKey} data-ft-in="3">
      <span className="ftw-rim" aria-hidden="true" />
      {FEATURE_LIST.map((f, i) => (
        <Item key={f.id} f={f} i={i} d={i - active} half={half} onPick={onPick} />
      ))}
    </div>
  );
}

/** The arc: radius (px), the gap between the open card and its neighbours, and the step between the rest (deg). */
const R = 1300;
const GAP = 24;
const STEP = 3.3;
/** the names lean with the arc, but only part of the way (James: "don't make the curve that drastic") */
const LEAN = 0.55;
const DEG = Math.PI / 180;

function angleOf(d: number, half: number) {
  if (d === 0) return 0;
  const first = Math.asin(Math.min(0.9, (half + GAP) / R)) / DEG;
  return Math.sign(d) * (first + (Math.abs(d) - 1) * STEP);
}

function Item({ f, i, d, half, onPick }: { f: Feature; i: number; d: number; half: number; onPick: (i: number) => void }) {
  const on = d === 0;
  const a = angleOf(d, half);
  const far = Math.abs(d);
  const style = {
    "--x": `${(-R * (1 - Math.cos(a * DEG))).toFixed(1)}px`,
    "--y": `${(R * Math.sin(a * DEG)).toFixed(1)}px`,
    "--a": `${(a * LEAN).toFixed(2)}deg`,
    "--o": far === 0 ? 1 : far > 4 ? 0 : [1, 0.86, 0.6, 0.38, 0.2][far],
    "--i": i,
  } as CSSProperties;
  return (
    <button
      type="button"
      role="tab"
      className={`ftw-item${on ? " is-on" : ""}`}
      aria-selected={on}
      tabIndex={on ? 0 : -1}
      aria-hidden={far > 4 || undefined}
      data-feature={f.id}
      data-testid={`feature-card-${f.id}`}
      data-cursor="link"
      style={style}
      onClick={() => onPick(i)}
    >
      <span className="ftw-item-top">
        <span className="ftw-icon" aria-hidden="true">
          <Icon name={f.icon} size={18} stroke={1.7} />
        </span>
        <span className="ftw-name">{f.name}</span>
        {on && (
          <span className="ftw-count" aria-hidden="true">
            {i + 1} / {N}
          </span>
        )}
      </span>
      {on && <Detail f={f} />}
    </button>
  );
}

/** Andrew's words for the open feature: his headline, his line and his bullets. */
function Detail({ f }: { f: Feature }) {
  return (
    <span className="ftw-detail">
      <span className="ftw-head">{f.headline}</span>
      <span className="ftw-copy">{f.sub}</span>
      <span className="ftw-ticks">
        {f.ticks.map((t) => (
          <span key={t} className="ftw-tick">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m3.2 8.5 3 3 6.6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t}
          </span>
        ))}
      </span>
    </span>
  );
}

/** The iPad mini, flat and landscape: the frame is a still rendered from James's model
 *  (ipad_mini_2023.glb, Oct 20), its screen cut out; the screen sits under it. */
function Ipad({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`ftw-ipad ${className}`}>
      <div className="ftw-ipad-screen">{children}</div>
      <img className="ftw-ipad-frame" src={ipadFrame} width={1600} height={1129} alt="" aria-hidden="true" draggable={false} decoding="async" />
    </div>
  );
}

// ─── phones ───────────────────────────────────────────────────────────────────

function PhoneWheel({ onAll, onWalk }: { onAll: () => void; onWalk: (id: FeatureId) => void }) {
  const [arriveRef, arrived] = useArrive<HTMLDivElement>({ amount: 0.18 });
  const [step, setStep] = useState(0);
  const f = FEATURE_LIST[step];
  const go = (i: number) => setStep(Math.max(0, Math.min(N - 1, i)));

  // a sideways swipe on the iPad or the card turns the wheel
  const start = useRef<{ x: number; y: number } | null>(null);
  const swipe = {
    onTouchStart: (e: TouchEvent) => (start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }),
    onTouchEnd: (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.changedTouches[0].clientX - s.x;
      const dy = e.changedTouches[0].clientY - s.y;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) go(step + (dx < 0 ? 1 : -1));
    },
  };

  return (
    <div ref={arriveRef} className="ftw ft-in wrap is-phone" data-in={arrived || reduce ? "" : undefined}>
      <Head onAll={onAll} phone />
      <div className="ftw-phone-ipad" data-ft-in="3" {...swipe}>
        <Ipad className="is-small">
          <button type="button" className="ftw-shot" onClick={() => onWalk(f.id)} aria-label={FEATURES.shotLabel(f.name)}>
            <img key={f.id} src={f.shot.src} width={f.shot.w} height={f.shot.h} alt="" decoding="async" draggable={false} />
            <span className="ft-shot-hint" aria-hidden="true">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.5 4.2v11.6c0 .6.6.9 1.1.6l9-5.8a.7.7 0 0 0 0-1.2l-9-5.8c-.5-.3-1.1 0-1.1.6Z" fill="currentColor" />
              </svg>
              {FEATURES.shotHint}
            </span>
          </button>
        </Ipad>
      </div>
      <div className="ftw-card" role="group" aria-roledescription="carousel" aria-label={FEATURES.label} data-ft-in="3" {...swipe}>
        <div className="ftw-item-top">
          <span className="ftw-icon" aria-hidden="true">
            <Icon name={f.icon} size={18} stroke={1.7} />
          </span>
          <span className="ftw-name" aria-live="polite" data-testid={`feature-card-${f.id}`}>
            {f.name}
          </span>
          <button type="button" className="ftw-arrow" aria-label="Previous feature" disabled={step === 0} onClick={() => go(step - 1)}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="ftw-arrow" aria-label="Next feature" disabled={step === N - 1} onClick={() => go(step + 1)}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m6 3.5 4.5 4.5L6 12.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <Detail key={f.id} f={f} />
      </div>
      <div className="ft-foot">
        <AllButton onClick={onAll} />
      </div>
    </div>
  );
}
