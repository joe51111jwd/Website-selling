// "People in the field" on phones (PHONE MODE): the same big drag slider as the desktop's
// CrewSlider, but the crew is ONE canvas, not 100 SVG groups. Each person is a tiny SmartCrew hard
// hat; a new one pops in orange and settles to ink, a removed one fades; the empty slots are survey
// dots that ripple in, column by column, the first time the scene arrives. The canvas only redraws
// while something is still moving (a short rAF burst after each change), never on scroll.
// The thumb and the fill move by transform. The track's box is read on pointerdown (not per move).
// Touch waits for a sideways move so the page still scrolls; keyboard: arrows ±1, Page ±10, Home/End.
// With `glide`, on arrival it runs from 0 up to it (./glide.ts, James, Oct 21) until the visitor
// sets it (a scroll that starts on it doesn't stop it).

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { LOGO_DATA } from "../../brand/Logo";
import { CALC } from "../../content/copy";
import { CREW_MAX } from "./calc";
import { useGlide } from "./glide";

const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clampN = (v: number) => Math.max(1, Math.min(CREW_MAX, Math.round(v)));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const POP_MS = 140;
const TINT_MS = 900;
const FADE_MS = 160;

type Colors = { ink: string; orange: string };

function hex(c: string) {
  const m = c.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return [23, 19, 15];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: number[], b: number[], t: number) {
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

export function CrewCanvas({
  value,
  onChange,
  onFirst,
  onDrag,
  arrived,
  rows,
  glide = null,
}: {
  value: number | null;
  onChange: (v: number) => void;
  onFirst?: () => void;
  /** A drag starts / ends (the meter waits for its end). */
  onDrag?: (on: boolean) => void;
  /** the scene has arrived: the empty slots ripple in (once; CSS) */
  arrived: boolean;
  /** rows of the grid (columns = 100 / rows); the grid fills column by column so its edge follows the thumb */
  rows: number;
  /** On arrival, glide from the current value (0) up to this crew (./glide.ts); null: no glide. */
  glide?: number | null;
}) {
  const cols = Math.ceil(CREW_MAX / rows);
  const area = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(0);
  const drag = useRef<{
    id: number;
    x0: number;
    y0: number;
    on: boolean;
    touch: boolean;
    left: number;
    width: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragCb = useRef(onDrag);
  dragCb.current = onDrag;
  const g = useGlide(glide, arrived, onChange);
  // the meter waits out the glide as it does a drag
  const holding = dragging || g.running;
  useEffect(() => dragCb.current?.(holding), [holding]);

  // per slot: when it was turned on / off (ms, performance.now()), for the pop and the fade
  const born = useRef<Float64Array>(new Float64Array(CREW_MAX));
  const died = useRef<Float64Array>(new Float64Array(CREW_MAX));
  const shown = useRef(0);
  const raf = useRef(0);
  const colors = useRef<{ ink: number[]; orange: number[] } | null>(null);
  const hat = useRef<{ hat: Path2D; jaw: Path2D } | null>(null);

  // the width, on resize only (never read while dragging or scrolling)
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cell = w / cols;
  const h = Math.round(cell * rows);

  const draw = useCallback(() => {
    raf.current = 0;
    const c = cv.current;
    if (!c || !w) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (!colors.current) {
      const cs = getComputedStyle(c);
      const k: Colors = {
        ink: cs.getPropertyValue("--ink") || "#17130f",
        orange: cs.getPropertyValue("--orange") || "#ff7a01",
      };
      colors.current = { ink: hex(k.ink), orange: hex(k.orange) };
    }
    if (!hat.current && typeof Path2D !== "undefined")
      hat.current = {
        hat: new Path2D(LOGO_DATA.mark.hatPlain),
        jaw: new Path2D(LOGO_DATA.mark.jaw),
      };
    const { ink, orange } = colors.current;
    const dpr = c.width / w;
    const now = performance.now();
    const n = shown.current;
    let busy = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const hatW = cell * 0.76;
    const k = hatW / LOGO_DATA.mark.width;
    const hatH = LOGO_DATA.mark.height * k;
    const dotR = Math.max(0.9, cell * 0.085);
    const inkCss = `rgb(${ink.join(",")})`;
    // the empty slots: survey dots (and a hat that just left, fading over its dot)
    for (let i = n; i < CREW_MAX; i++) {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const d = died.current[i];
      const fadeOut = d ? clamp01((now - d) / FADE_MS) : 1;
      // a hat that just left: fade it out over its dot
      if (d && fadeOut < 1) {
        busy = true;
        drawHat(ctx, col, row, 1, 1 - fadeOut, inkCss);
      }
      ctx.globalAlpha = 0.22 * (d && fadeOut < 1 ? fadeOut : 1);
      ctx.fillStyle = inkCss;
      ctx.beginPath();
      ctx.arc(col * cell + cell / 2, row * cell + cell / 2, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
    // the crew
    for (let i = 0; i < n; i++) {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const age = now - born.current[i];
      let s = 1;
      let color = inkCss;
      if (age < TINT_MS && !reduce) {
        busy = true;
        s = 0.6 + 0.4 * easeOut(clamp01(age / POP_MS));
        // orange for the first third, then settling to ink
        const t = clamp01((age / TINT_MS - 0.35) / 0.65);
        color = mix(orange, ink, easeOut(t));
      }
      drawHat(ctx, col, row, s, 1, color);
    }
    ctx.globalAlpha = 1;
    if (busy) raf.current = requestAnimationFrame(draw);

    function drawHat(cx2: CanvasRenderingContext2D, col: number, row: number, s: number, alpha: number, fill: string) {
      const x = col * cell + cell / 2;
      const y = row * cell + cell / 2;
      cx2.globalAlpha = alpha;
      cx2.fillStyle = fill;
      // bottom-centre origin, like the desktop's transform-origin 50% 100%
      cx2.setTransform(dpr * k * s, 0, 0, dpr * k * s, dpr * (x - (hatW * s) / 2), dpr * (y + hatH / 2 - hatH * s + (1 - s) * 1.5));
      if (hat.current) {
        cx2.fill(hat.current.hat);
        cx2.fill(hat.current.jaw);
      } else {
        cx2.fillRect(0, 0, LOGO_DATA.mark.width, LOGO_DATA.mark.height);
      }
      cx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, [w, cell, rows]);

  const kick = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(draw);
  }, [draw]);

  // size the backing store (on resize only)
  useLayoutEffect(() => {
    const c = cv.current;
    if (!c || !w) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    draw();
  }, [w, h, draw]);

  // the value → births and deaths, then a short redraw burst
  useEffect(() => {
    const n = value ?? 0;
    const was = shown.current;
    const now = performance.now();
    if (n > was) for (let i = was; i < n; i++) ((born.current[i] = reduce ? -1e9 : now + (i - was) * 6), (died.current[i] = 0));
    else if (n < was) for (let i = n; i < was; i++) died.current[i] = reduce ? 0 : now;
    shown.current = n;
    kick();
  }, [value, kick]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // the visitor's input (a drag, a tap or a key): it ends the glide where it is
  const set = (v: number) => {
    g.stop();
    onFirst?.();
    if (v !== value) onChange(v);
  };
  const fromX = (clientX: number) => {
    const d = drag.current;
    if (!d || !d.width) return value ?? 1;
    return clampN(((clientX - d.left) / d.width) * CREW_MAX + 0.5);
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const touch = e.pointerType !== "mouse";
    // the track's box, once per gesture
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      on: !touch,
      touch,
      left: r.left,
      width: r.width,
    };
    if (!touch) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      set(fromX(e.clientX));
    }
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.touch && e.buttons === 0) return cancel();
    if (!d.on) {
      const dx = Math.abs(e.clientX - d.x0);
      const dy = Math.abs(e.clientY - d.y0);
      if (dx > 6 && dx > dy) {
        d.on = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      } else return;
    }
    set(fromX(e.clientX));
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    // a tap (no drag) on touch sets the value where it landed
    if (!d.on && d.touch && Math.abs(e.clientX - d.x0) < 8 && Math.abs(e.clientY - d.y0) < 8) set(fromX(e.clientX));
    drag.current = null;
    setDragging(false);
  };
  const cancel = () => {
    drag.current = null;
    setDragging(false);
  };

  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const v = value ?? 0;
    const step: Record<string, number> = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
      PageUp: 10,
      PageDown: -10,
    };
    let n: number | null = null;
    if (e.key in step) n = clampN(v + step[e.key]);
    else if (e.key === "Home") n = 1;
    else if (e.key === "End") n = CREW_MAX;
    if (n == null) return;
    e.preventDefault();
    set(n);
  };

  // while it glides the thumb moves continuously; the hats follow each whole person
  const p = (g.x ?? value ?? 0) / CREW_MAX;
  const touched = value != null;
  const valueText = value == null ? CALC.crewEmpty : `${value} ${value === 1 ? CALC.crewUnitOne : CALC.crewUnit}`;

  return (
    <div className={`ncv${touched ? " is-set" : ""}${dragging ? " is-drag" : ""}`}>
      <p className="ncv-read" aria-hidden="true">
        {value != null && <span className="t-time ncv-n">{value}</span>}
        <span className="ncv-unit">{value == null ? CALC.crewEmpty : value === 1 ? CALC.crewUnitOne : CALC.crewUnit}</span>
      </p>
      <div
        ref={area}
        className="ncv-area"
        role="slider"
        tabIndex={0}
        aria-label={CALC.crewUnit}
        aria-valuemin={1}
        aria-valuemax={CREW_MAX}
        aria-valuenow={value ?? undefined}
        aria-valuetext={valueText}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        onKeyDown={key}
      >
        <div className={`ncv-gridbox${arrived ? " is-in" : ""}`}>
          <canvas ref={cv} className="ncv-grid" style={{ height: h || undefined }} aria-hidden="true" />
          {/* the arrival ripple: the veil slides off the dots, left to right (number-phone.css) */}
          <span className="ncv-veil" aria-hidden="true" />
        </div>
        <div className="ncv-track" aria-hidden="true">
          <span className="ncv-fill" style={{ transform: `scaleX(${p})` }} />
          <span className="ncv-thumb" style={{ transform: `translate3d(${(p * w).toFixed(1)}px, 0, 0)` }}>
            <span className="ncv-stake" style={{ height: h + 14 }} />
            <span className="ncv-knob">
              <svg viewBox="0 0 16 10" aria-hidden="true">
                <path
                  d="M5 1.5 1.5 5 5 8.5M11 1.5 14.5 5 11 8.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
