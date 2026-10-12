import { lazy, Suspense, useLayoutEffect, useRef, useState, type ComponentType, type CSSProperties, type LazyExoticComponent, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SIZE, screenById } from "../../screens/registry";
import frameUrl from "./assets/iphone-frame.png";

// Real SmartCrew screens (src/screens), rendered live at native size and scaled, never as
// screenshots. The phone sits behind a frame rendered from the real iPhone model
// (assets/iphone-frame.png, made by RenderPhone.tsx + a key-out script), so the device is a
// photographic render, not CSS chrome (AISMELL K3). The office side is a plain app window.

export const EASE = [0.23, 1, 0.32, 1] as const;

const cache = new Map<string, LazyExoticComponent<ComponentType>>();
function screenComp(id: string) {
  let c = cache.get(id);
  if (!c) {
    const def = screenById(id);
    c = lazy(def ? def.load : async () => ({ default: () => null }));
    cache.set(id, c);
  }
  return c;
}

export function NativeScreen({ id }: { id: string }) {
  const def = screenById(id);
  const N = SIZE[def?.kind ?? "web"];
  const C = screenComp(id);
  return (
    <div className="pp-native" style={{ width: N.w, height: N.h }}>
      <Suspense fallback={null}>
        <C />
      </Suspense>
    </div>
  );
}

export function useBox<T extends HTMLElement>(): [RefObject<T | null>, { w: number; h: number }] {
  const ref = useRef<T>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => {
      const r = el.getBoundingClientRect();
      setBox((b) => (Math.abs(b.w - r.width) < 0.5 && Math.abs(b.h - r.height) < 0.5 ? b : { w: r.width, h: r.height }));
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box];
}

// ── A crop of a screen: (x, y) native px at the top-left, scale s ─────────────
type CropProps = {
  id: string;
  x: number;
  y: number;
  s: number;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  animate?: boolean;
  label?: string;
};

export function Crop({ id, x, y, s, style, className = "", children, animate = true, label }: CropProps) {
  const reduce = useReducedMotion();
  const t = animate && !reduce ? { duration: 0.36, ease: EASE } : { duration: 0 };
  return (
    <div className={`pp-crop ${className}`} style={style} role="img" aria-label={label ?? screenById(id)?.title}>
      <AnimatePresence initial={false}>
        <motion.div
          key={id}
          className="pp-crop-in"
          style={{ transformOrigin: "0 0" }}
          initial={{ opacity: 0, x: -x * s, y: -y * s, scale: s }}
          animate={{ opacity: 1, x: -x * s, y: -y * s, scale: s }}
          exit={{ opacity: 0, transition: { duration: animate && !reduce ? 0.18 : 0 } }}
          transition={t}
        >
          <NativeScreen id={id} />
        </motion.div>
      </AnimatePresence>
      {children}
    </div>
  );
}

// ── Plan-sheet callout: an orange stake on real data, a leader and an ink tag ──
export function Mark({ left, top, label, flip = false, delay = 0.28, tone = "ink" }: { left: number; top: number; label: string; flip?: boolean; delay?: number; tone?: "ink" | "light" }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`pp-mark${flip ? " is-flip" : ""} is-${tone}`}
      style={{ left, top }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: reduce ? 0 : delay, duration: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
    >
      <span className="pp-mark-stake" />
      <span className="pp-mark-lead" />
      <span className="pp-mark-tag">{label}</span>
    </motion.div>
  );
}

// ── The phone: frame render on top, live screen underneath ──────────────────────
// Frame geometry from the render: 664×1374, screen hole at x 3.765%, y 1.601%, 92.32% × 96.87%.
export const FRAME = { w: 664, h: 1374, sx: 0.03765, sy: 0.01601, sw: 0.9232, sh: 0.9687 };
export const phoneScale = (frameW: number) => (frameW * FRAME.sw) / 402;

export function Phone({ id, width, ring, className = "", style, animate = true }: { id: string; width: number; ring?: [number, number, number, number]; className?: string; style?: CSSProperties; animate?: boolean }) {
  const s = phoneScale(width);
  const h = (width * FRAME.h) / FRAME.w;
  const reduce = useReducedMotion();
  const dur = animate && !reduce ? 0.3 : 0;
  return (
    <div className={`pp-phone ${className}`} style={{ width, height: h, ...style }}>
      <div className="pp-phone-screen" style={{ left: width * FRAME.sx, top: h * FRAME.sy, width: 402 * s, height: 874 * s, borderRadius: 58 * s }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={id}
            className="pp-phone-native"
            style={{ transform: `scale(${s})`, transformOrigin: "0 0" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur }}
          >
            <NativeScreen id={id} />
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>
          {ring && (
            <motion.span
              key={`${id}-${ring.join("-")}`}
              className="pp-ring"
              style={{ left: ring[0] * s - 4, top: ring[1] * s - 4, width: ring[2] * s + 8, height: ring[3] * s + 8 }}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: dur ? 0.12 : 0, duration: dur ? 0.22 : 0 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            />
          )}
        </AnimatePresence>
      </div>
      <img className="pp-phone-frame" src={frameUrl} alt="" width={width} height={h} draggable={false} />
    </div>
  );
}
