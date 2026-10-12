import { lazy, Suspense, useLayoutEffect, useRef, useState, type ComponentType, type LazyExoticComponent, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SIZE, screenById } from "../../screens/registry";
import type { Callout, Focus } from "./features";

// A real SmartCrew screen (src/screens), rendered at its native size and shown through a
// window: scaled so `focus.w` native px fill the box width, panned so focus.x/y sit top-left.
// Changing `focus` pans and zooms; changing `id` crossfades. No device chrome (AISMELL K3).

const cache = new Map<string, LazyExoticComponent<ComponentType>>();
function comp(id: string) {
  let c = cache.get(id);
  if (!c) {
    const def = screenById(id);
    c = lazy(def ? def.load : async () => ({ default: () => null }));
    cache.set(id, c);
  }
  return c;
}

export function useSize<T extends HTMLElement>(): [RefObject<T | null>, { w: number; h: number }] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize((s) => (Math.abs(s.w - width) < 0.5 && Math.abs(s.h - height) < 0.5 ? s : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

const EASE = [0.23, 1, 0.32, 1] as const;

type Props = {
  id: string;
  focus?: Focus;
  callout?: Callout;
  className?: string;
  /** set false for the hero still, so nothing moves on load */
  animate?: boolean;
  label?: string;
};

export default function ScreenWindow({ id, focus = { x: 0, y: 0 }, callout, className = "", animate = true, label }: Props) {
  const def = screenById(id);
  const kind = def?.kind ?? "web";
  const N = SIZE[kind];
  const [ref, box] = useSize<HTMLDivElement>();
  const reduce = useReducedMotion();
  const s = box.w > 0 ? box.w / (focus.w ?? N.w) : 0;
  const maxX = Math.max(0, N.w - box.w / (s || 1));
  const maxY = Math.max(0, N.h - box.h / (s || 1));
  const x = Math.min(Math.max(0, focus.x), maxX);
  const y = Math.min(Math.max(0, focus.y), maxY);
  const Comp = comp(id);
  const t = animate && !reduce ? { duration: 0.42, ease: EASE } : { duration: 0 };

  let co: { left: number; top: number } | null = null;
  if (callout && s > 0) {
    const left = (callout.x - x) * s;
    const top = (callout.y - y) * s;
    if (left > 8 && top > 8 && left < box.w - 8 && top < box.h - 8) co = { left, top };
  }

  return (
    <div ref={ref} className={`sw sw-${kind} ${className}`} role="img" aria-label={label ?? def?.title}>
      <div className="sw-clip">
        {s > 0 && (
          <AnimatePresence initial={false}>
            <motion.div
              key={id}
              className="sw-native"
              style={{ width: N.w, height: N.h, transformOrigin: "0 0" }}
              initial={{ opacity: 0, x: -x * s, y: -y * s, scale: s }}
              animate={{ opacity: 1, x: -x * s, y: -y * s, scale: s }}
              exit={{ opacity: 0, transition: { duration: animate && !reduce ? 0.2 : 0 } }}
              transition={t}
            >
              <Suspense fallback={null}>
                <Comp />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <AnimatePresence>
        {co && callout && (
          <motion.div
            key={`${id}-${callout.label}`}
            className={`sw-callout sw-callout-${callout.side ?? "below"}`}
            style={{ left: co.left, top: co.top }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: animate && !reduce ? 0.34 : 0, duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <span className="sw-stake" />
            <span className="sw-leader" />
            <span className="sw-tag">{callout.label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
