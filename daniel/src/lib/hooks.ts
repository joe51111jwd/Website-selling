import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useSpring } from "motion/react";
import { isTouch, reducedMotion } from "./ticker";

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** Phones and small tablets get the stacked layouts. */
export const useCompact = () => useMediaQuery("(max-width: 860px)");

/**
 * Size a line of type so it runs exactly edge to edge of its container.
 * The container holds a hidden [data-fit-probe] copy of the text set at
 * 100px; the visible line gets width / probe width × 100.
 */
export function useFitText(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    const probe = el?.querySelector<HTMLElement>("[data-fit-probe]");
    if (!el || !probe) return;
    const measure = () => {
      const natural = probe.getBoundingClientRect().width;
      const cs = getComputedStyle(el);
      const width = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (natural > 0) setSize((width / natural) * 100);
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Pulls an element toward the pointer while it's near, then springs it home. */
export function useMagnetic<T extends HTMLElement>(strength = 0.35) {
  const ref = useRef<T>(null);
  const x = useSpring(0, { stiffness: 180, damping: 14, mass: 0.3 });
  const y = useSpring(0, { stiffness: 180, damping: 14, mass: 0.3 });
  useEffect(() => {
    const el = ref.current;
    if (!el || isTouch || reducedMotion) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x.set((e.clientX - (r.left + r.width / 2)) * strength);
      y.set((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      x.set(0);
      y.set(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength, x, y]);
  return { ref, x, y };
}

/** The current time in Daniel's city, ticking every second. */
export function useClock(timeZone: string) {
  const fmt = () =>
    new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = window.setInterval(() => setTime(fmt()), 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZone]);
  return time;
}
