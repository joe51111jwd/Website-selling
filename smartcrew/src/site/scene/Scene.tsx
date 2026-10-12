// The scene framework. A <Scene> is a section of the page that is `pinnedViewports` screens tall,
// with a sticky 100svh stage inside it, so its content stays put while the scroll drives it
// (native scroll; nothing is hijacked). It tells its children and the 3D Stage how far through it
// the visitor is (0..1), and registers its pose keys with the Stage.

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { registerPoses, registerScene, sceneProgress, scheduleMeasure } from "../../three/stage/store";
import type { PoseKey } from "../../three/stage/types";

type Ctx = { id: string; progress: MotionValue<number>; pinned: boolean };
const SceneContext = createContext<Ctx | null>(null);

export type SceneProps = {
  /** Also the section's DOM id (#day), the default stage anchor id, and the analytics source. */
  id: string;
  /**
   * How many screens of scroll the scene takes. > 1: pinned (the stage sticks for n − 1 screens
   * of scroll). 1: one screen, not pinned. 0: natural height (FAQ, footer).
   */
  pinnedViewports: number;
  /** The Stage's pose keys for this scene (`at` = this scene's progress). Omit to hide the devices. */
  poses?: PoseKey[];
  /** "keep": no keys and no hiding: the devices carry on from the scene before. */
  stage?: "hide" | "keep";
  /** Accessible name for the section. */
  label?: string;
  className?: string;
  /** Class on the sticky stage (pinned scenes) or the section's content wrapper. */
  stageClassName?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

const HIDE: PoseKey[] = [
  { at: 0, macbook: { show: 0 }, iphone: { show: 0 }, display: { show: 0 }, ease: "out" },
  { at: 1, macbook: { show: 0 }, iphone: { show: 0 }, display: { show: 0 } },
];

export function Scene({ id, pinnedViewports, poses, stage = "hide", label, className, stageClassName, style, children }: SceneProps) {
  const section = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const pinned = pinnedViewports > 1;

  useLayoutEffect(() => registerScene(id, section.current!, pinned ? inner.current : null, pinned), [id, pinned]);
  useEffect(() => {
    if (poses) return registerPoses(id, poses);
    if (stage === "hide") return registerPoses(id, HIDE);
  }, [id, poses, stage]);
  useEffect(() => scheduleMeasure(), [pinnedViewports]);

  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (y) => sceneProgress(id, y));

  const size: CSSProperties = pinned ? { height: `${pinnedViewports * 100}svh` } : pinnedViewports === 1 ? { minHeight: "100svh" } : {};
  return (
    <SceneContext.Provider value={{ id, progress, pinned }}>
      <section
        ref={section}
        id={id}
        data-scene={id}
        aria-label={label}
        className={`scene scene-${id}${pinned ? " is-pinned" : ""}${className ? ` ${className}` : ""}`}
        style={{ ...size, ...style }}
      >
        <div
          ref={inner}
          className={`${pinned ? "scene-stage" : "scene-body"}${stageClassName ? ` ${stageClassName}` : ""}`}
          data-scene-stage={pinned ? id : undefined}
        >
          {children}
        </div>
      </section>
    </SceneContext.Provider>
  );
}

/** The enclosing scene's id, progress (0..1) and whether it's pinned. */
export function useScene() {
  const c = useContext(SceneContext);
  if (!c) throw new Error("useScene() outside a <Scene>");
  return c;
}

/** The enclosing scene's scroll progress, 0..1 (a motion value: use it in style or useTransform). */
export const useSceneProgress = () => useScene().progress;

// ─── splitting progress into steps ───────────────────────────────────────────

export type StepRange = { start?: number; end?: number };

/**
 * The progress at which step `i` of `count` reaches `phase` (0 = its start, 1 = its end), with the
 * steps spread evenly over [start, end] of the scene. Use it to place pose keys and DOM changes on
 * the same beats.
 */
export function stepAt(i: number, count: number, phase = 0, { start = 0, end = 1 }: StepRange = {}) {
  return start + ((i + phase) / count) * (end - start);
}

/** Which step (0..count-1) a progress value falls in. */
export function stepOf(p: number, count: number, { start = 0, end = 1 }: StepRange = {}) {
  const f = (p - start) / (end - start);
  return Math.max(0, Math.min(count - 1, Math.floor(f * count)));
}

/** The current step as React state (re-renders only when the step changes). */
export function useSceneStep(count: number, range: StepRange = {}) {
  const progress = useSceneProgress();
  const [step, setStep] = useState(() => stepOf(progress.get(), count, range));
  useMotionValueEvent(progress, "change", (p) => {
    const s = stepOf(p, count, range);
    setStep((c) => (c === s ? c : s));
  });
  return step;
}

/** Progress within step `i` (0..1), as a motion value. */
export function useStepProgress(i: number, count: number, range: StepRange = {}) {
  const progress = useSceneProgress();
  return useTransform(progress, [stepAt(i, count, 0, range), stepAt(i, count, 1, range)], [0, 1], { clamp: true });
}

/** A slice of a progress value remapped to 0..1 (clamped). */
export function useSegment(progress: MotionValue<number>, from: number, to: number) {
  return useTransform(progress, [from, to], [0, 1], { clamp: true });
}
