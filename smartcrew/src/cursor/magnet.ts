import { useEffect, type RefObject } from "react";
import { addTask, wake } from "./ticker";
import { Spring, clamp, r2 } from "./spring";

// Magnetic buttons: the element drifts a few px toward the pointer when it is close, and springs
// back when the pointer leaves. Moves with the CSS `translate` property, which composes with any
// `transform` the element already has (motion, hover lifts) instead of overwriting it.

export const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const PAD = 20; // px around the element where the pull starts

type Magnet = {
  el: HTMLElement;
  strength: number;
  hooks: number; // useMagnetic owners
  held: boolean; // the cursor is on it (data-cursor="cta")
  x: Spring;
  y: Spring;
  ax: number; // translate currently applied
  ay: number;
  l: number; // untranslated box
  t: number;
  w: number;
  h: number;
};

const reg = new Map<HTMLElement, Magnet>();
let px = -1e5;
let py = -1e5;
let reduced = false;
let installed = false;
let removeTask: (() => void) | null = null;

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      px = e.clientX;
      py = e.clientY;
      if (reg.size) wake();
    },
    { passive: true },
  );
  addEventListener("scroll", () => reg.size && wake(), { passive: true, capture: true });
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  reduced = mq.matches;
  mq.addEventListener("change", () => {
    reduced = mq.matches;
    wake();
  });
}

const task = {
  read() {
    for (const m of reg.values()) {
      const r = m.el.getBoundingClientRect();
      m.l = r.left - m.ax;
      m.t = r.top - m.ay;
      m.w = r.width;
      m.h = r.height;
    }
  },
  write(dt: number) {
    let busy = false;
    for (const m of reg.values()) {
      let tx = 0;
      let ty = 0;
      if (!reduced && m.w > 0) {
        const near = m.held || (px > m.l - PAD && px < m.l + m.w + PAD && py > m.t - PAD && py < m.t + m.h + PAD);
        if (near) {
          tx = clamp((px - (m.l + m.w / 2)) / (m.w / 2 + PAD), -1, 1) * m.strength;
          ty = clamp((py - (m.t + m.h / 2)) / (m.h / 2 + PAD), -1, 1) * m.strength * 0.7;
        }
      }
      m.x.target = tx;
      m.y.target = ty;
      if (reduced) {
        m.x.snap();
        m.y.snap();
      }
      const a = m.x.step(dt);
      const b = m.y.step(dt);
      if (a || b) busy = true;
      const ax = r2(m.x.x);
      const ay = r2(m.y.x);
      if (ax !== m.ax || ay !== m.ay) {
        m.el.style.translate = ax || ay ? `${ax}px ${ay}px` : "";
        m.ax = ax;
        m.ay = ay;
      }
      if (!m.hooks && !m.held && !a && !b && !tx && !ty) reg.delete(m.el);
    }
    if (!reg.size && removeTask) {
      removeTask();
      removeTask = null;
    }
    return busy;
  },
};

function entry(el: HTMLElement, strength: number) {
  install();
  let m = reg.get(el);
  if (!m) {
    m = { el, strength, hooks: 0, held: false, x: new Spring(0, 17, 0.62, 0.01), y: new Spring(0, 17, 0.62, 0.01), ax: 0, ay: 0, l: 0, t: 0, w: 0, h: 0 };
    reg.set(el, m);
  }
  m.strength = strength;
  if (!removeTask) removeTask = addTask(task);
  wake();
  return m;
}

/** The cursor holds a magnet while it is on a CTA. */
export function holdMagnet(el: HTMLElement, strength: number) {
  entry(el, strength).held = true;
}

export function releaseMagnet(el: HTMLElement) {
  const m = reg.get(el);
  if (m) m.held = false;
  wake();
}

/** The translate a magnet currently applies to its element (0,0 if none). */
export function magnetOffset(el: HTMLElement | null) {
  const m = el && reg.get(el);
  return m ? { x: m.ax, y: m.ay } : { x: 0, y: 0 };
}

/** Imperative form of useMagnetic. Returns a detach function. */
export function attachMagnet(el: HTMLElement, strength = 6) {
  if (typeof window === "undefined" || !matchMedia(FINE_POINTER).matches) return () => {};
  const m = entry(el, strength);
  m.hooks++;
  return () => {
    m.hooks = Math.max(0, m.hooks - 1);
    wake();
  };
}

/**
 * Pulls the element up to `strength` px toward the pointer when it comes within 20px.
 * Mouse and trackpad only; off under prefers-reduced-motion. Elements with
 * data-cursor="cta" get this automatically while the cursor is on them.
 */
export function useMagnetic(ref: RefObject<HTMLElement | null>, strength = 6) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return attachMagnet(el, strength);
  }, [ref, strength]);
}
