// Try it's focus mode. The moment the visitor taps the phone (or, with a mouse, rests on it for a
// beat), the rest of the page dims behind a calm dark scrim and the phone stays bright on top, so
// it reads as "you're holding the crew's phone now". A tap anywhere on the dim, Esc, or scrolling
// away gives the page back. The orange "Get my free trial" stays reachable: on desktop it appears
// next to the phone (and the header stays above the dim); on phones, where the header has no CTA,
// it sits in the dimmed header band.
//
// The scrim is portalled to <body> (the 3D phone lives on the Stage canvas under the page, so it
// can't be lifted above a page layer): a rounded hole cut where the phone is (one element with a
// huge spread shadow), and four hit bands round the hole that catch the tap that closes it.
// Opacity only; no per-frame JS (on desktop the hole rides the phone's float on the frame loop that
// already moves its buttons). Reduced motion: instant.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Cta } from "../ui/Cta";
import "./focus.css";

export type Hole = { x: number; y: number; w: number; h: number; r: string };

const DWELL = 220;
const HOVER_OUT = 300;
const SCROLL_OUT = 32;

export function useFocusMode({
  el,
  live,
  hover,
  measure,
  onEnter,
}: {
  /** the phone: taps / hover / focus inside it open focus mode */
  el: RefObject<HTMLElement | null>;
  /** the phone is on screen and settled (focus mode closes when it isn't) */
  live: boolean;
  /** a mouse resting on the phone opens it too ("soft": leaving onto the dim closes it again) */
  hover: boolean;
  /** the hole, in viewport px */
  measure: (el: HTMLElement) => Hole;
  onEnter?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [soft, setSoft] = useState(false);
  const [hole, setHole] = useState<Hole | null>(null);
  const openRef = useRef(false);
  const softRef = useRef(false);
  const liveRef = useRef(live);
  liveRef.current = live;
  const measureRef = useRef(measure);
  measureRef.current = measure;
  const enterRef = useRef(onEnter);
  enterRef.current = onEnter;
  const y0 = useRef(0);

  const enter = useCallback(
    (isSoft: boolean) => {
      const node = el.current;
      if (!node || !liveRef.current) return;
      const wasOpen = openRef.current;
      softRef.current = wasOpen ? softRef.current && isSoft : isSoft;
      setSoft(softRef.current);
      if (wasOpen) return;
      openRef.current = true;
      y0.current = window.scrollY;
      setHole(measureRef.current(node));
      setOpen(true);
      enterRef.current?.();
    },
    [el],
  );

  const exit = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    softRef.current = false;
    setOpen(false);
    setSoft(false);
  }, []);

  // taps (a click: a swipe that scrolls past never opens it), hover, keyboard focus
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    let dwell = 0;
    const onClick = () => enter(false);
    const onEnterPtr = (e: PointerEvent) => {
      if (!hover || e.pointerType !== "mouse") return;
      window.clearTimeout(dwell);
      dwell = window.setTimeout(() => enter(true), DWELL);
    };
    const onLeavePtr = () => window.clearTimeout(dwell);
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.matches?.(":focus-visible")) enter(false);
    };
    node.addEventListener("click", onClick, true);
    node.addEventListener("pointerenter", onEnterPtr);
    node.addEventListener("pointerleave", onLeavePtr);
    node.addEventListener("focusin", onFocus);
    return () => {
      window.clearTimeout(dwell);
      node.removeEventListener("click", onClick, true);
      node.removeEventListener("pointerenter", onEnterPtr);
      node.removeEventListener("pointerleave", onLeavePtr);
      node.removeEventListener("focusin", onFocus);
    };
  });

  // while open: Esc, scrolling away, focus leaving, a resize (re-measure)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    const onScroll = () => {
      if (Math.abs(window.scrollY - y0.current) > SCROLL_OUT) exit();
    };
    const onResize = () => {
      if (el.current) setHole(measureRef.current(el.current));
    };
    const onFocus = (e: FocusEvent) => {
      const t = e.target as Node | null;
      if (!t || el.current?.contains(t) || (t as Element).closest?.(".fx")) return;
      exit();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open, exit, el]);

  useEffect(() => {
    if (!live) exit();
  }, [live, exit]);

  return { open, soft, hole, exit };
}

export function FocusLayer({
  open,
  soft,
  hole,
  onExit,
  variant,
  holeRef,
}: {
  open: boolean;
  soft: boolean;
  hole: Hole | null;
  onExit: () => void;
  /** desk: under the header, the CTA beside the phone · phone: over the header, the CTA in it */
  variant: "desk" | "phone";
  /** the hole element (desktop: it rides the phone's float) */
  holeRef?: RefObject<HTMLDivElement | null>;
}) {
  const out = useRef(0);
  useEffect(() => () => window.clearTimeout(out.current), []);
  if (typeof document === "undefined") return null;
  const h = hole ?? { x: 0, y: 0, w: 0, h: 0, r: "0px" };
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  // desktop CTA: beside the phone, on whichever side has room
  const right = h.x + h.w + 300 < vw;
  const style = {
    "--x": `${h.x}px`,
    "--y": `${h.y}px`,
    "--w": `${h.w}px`,
    "--h": `${h.h}px`,
    "--r": h.r,
    "--cx": right ? `${h.x + h.w + 44}px` : "auto",
    "--cr": right ? "auto" : `${vw - h.x + 44}px`,
  } as CSSProperties;
  const bandProps = {
    onClick: onExit,
    onPointerEnter: (e: RPointerEvent) => {
      if (!soft || e.pointerType !== "mouse") return;
      window.clearTimeout(out.current);
      out.current = window.setTimeout(onExit, HOVER_OUT);
    },
    onPointerLeave: () => window.clearTimeout(out.current),
    "aria-hidden": true as const,
  };
  return createPortal(
    <div className={`fx fx--${variant}${open ? " is-open" : ""}`} style={style}>
      <div ref={holeRef} className="fx-hole" />
      <div className="fx-b fx-b--t" {...bandProps} />
      <div className="fx-b fx-b--b" {...bandProps} />
      <div className="fx-b fx-b--l" {...bandProps} />
      <div className="fx-b fx-b--r" {...bandProps} />
      <div className="fx-cta" onPointerEnter={() => window.clearTimeout(out.current)}>
        <Cta source="try" size={variant === "phone" ? "sm" : "md"} cue={false} primary={false} tabIndex={open ? 0 : -1} />
      </div>
    </div>,
    document.body,
  );
}
