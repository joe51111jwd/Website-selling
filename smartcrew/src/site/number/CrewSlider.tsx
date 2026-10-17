// "People in the field": the big drag slider. The track is the crew itself: 100 slots in a neat
// grid (5 rows, filled column by column, so the filled edge follows the thumb), each person a tiny
// SmartCrew hard-hat mark. It starts at the preset crew (./calc.ts PRESET); the visitor drags to theirs.
// Pointer: drag anywhere on the grid (touch waits for a sideways move so the page still scrolls);
// keyboard: arrows ±1, Page Up/Down ±10, Home/End.
// Arrival (once, the crew 35 % in view): the empty slots ripple in column by column and, at 1.4 s,
// the knob nudges once (number.css); the parent keys the meter on from `onArrive`.

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { reducedMotion } from "../../three/stage/store";
import { LOGO_DATA } from "../../brand/Logo";
import { CALC } from "../../content/copy";
import { CREW_MAX } from "./calc";

const ROWS = 5;
const COLS = CREW_MAX / ROWS; // 20
const CELL = 10; // svg units per slot
const HAT_W = 7.6;
const HAT_H = (HAT_W * LOGO_DATA.mark.height) / LOGO_DATA.mark.width;

const clamp = (v: number) => Math.max(1, Math.min(CREW_MAX, Math.round(v)));
/** The arrival ripple: 18 ms a column, 560 ms a slot (number.css); after it the slots are static. */
const RIPPLE_DONE = (COLS - 1) * 18 + 560 + 60;

export function CrewSlider({
  value,
  onChange,
  onFirst,
  onArrive,
  onDrag,
}: {
  value: number | null;
  onChange: (v: number) => void;
  onFirst?: () => void;
  /** The crew has come into view (once). */
  onArrive?: () => void;
  /** A drag starts / ends (the meter waits for its end). */
  onDrag?: (on: boolean) => void;
}) {
  const id = useId().replace(/:/g, "");
  const area = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x0: number; y0: number; on: boolean; touch: boolean; left: number; width: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(reducedMotion);
  const [rippled, setRippled] = useState(reducedMotion);
  const touched = value != null;
  const arrive = useRef(onArrive);
  arrive.current = onArrive;
  const dragCb = useRef(onDrag);
  dragCb.current = onDrag;
  useEffect(() => dragCb.current?.(dragging), [dragging]);

  // the empty slots ripple in once, the first time the scene comes into view
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      setInView(true);
      setRippled(true);
      arrive.current?.();
      return;
    }
    let t = 0;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setInView(true);
          arrive.current?.();
          t = window.setTimeout(() => setRippled(true), RIPPLE_DONE);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  const set = (v: number) => {
    if (value == null) onFirst?.();
    if (v !== value) onChange(v);
  };
  // the track's box is read once per gesture (on pointerdown), never per move
  const fromX = (clientX: number) => {
    const d = drag.current;
    if (!d || !d.width) return value ?? 1;
    return clamp(((clientX - d.left) / d.width) * CREW_MAX + 0.5);
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const touch = e.pointerType !== "mouse";
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, on: !touch, touch, left: r.left, width: r.width };
    if (!touch) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      set(fromX(e.clientX));
    }
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    // a mouse released outside the window: end the drag
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
    const step: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    let n: number | null = null;
    if (e.key in step) n = clamp(v + step[e.key]);
    else if (e.key === "Home") n = 1;
    else if (e.key === "End") n = CREW_MAX;
    if (n == null) return;
    e.preventDefault();
    set(n);
  };

  const p = (value ?? 0) / CREW_MAX;
  const valueText = value == null ? CALC.crewEmpty : `${value} ${value === 1 ? CALC.crewUnitOne : CALC.crewUnit}`;

  return (
    <div className={`num-crew${touched ? " is-set" : ""}${dragging ? " is-drag" : ""}${inView ? " is-in" : ""}${rippled ? " is-rippled" : ""}`}>
      <div className="num-crew-read" aria-hidden="true">
        {value != null && <span className="t-time num-crew-n">{value}</span>}
        <span className="num-crew-unit">{value == null ? CALC.crewEmpty : value === 1 ? CALC.crewUnitOne : CALC.crewUnit}</span>
      </div>
      <div
        ref={area}
        className="num-crew-area"
        role="slider"
        tabIndex={0}
        aria-label={CALC.crewUnit}
        aria-valuemin={1}
        aria-valuemax={CREW_MAX}
        aria-valuenow={value ?? undefined}
        aria-valuetext={valueText}
        data-cursor="drag"
        data-cursor-label={touched ? "Drag" : CALC.crewEmpty}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        onKeyDown={key}
        style={{ ["--p" as string]: p } as CSSProperties}
      >
        <svg className="num-grid" viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`} aria-hidden="true">
          <defs>
            <symbol id={`hat-${id}`} viewBox={LOGO_DATA.mark.viewBox}>
              <path d={LOGO_DATA.mark.hatPlain} />
              <path d={LOGO_DATA.mark.jaw} />
            </symbol>
          </defs>
          {Array.from({ length: CREW_MAX }, (_, i) => {
            const c = Math.floor(i / ROWS);
            const r = i % ROWS;
            const cx = c * CELL + CELL / 2;
            const cy = r * CELL + CELL / 2;
            const on = value != null && i < value;
            return (
              <g key={i} className={`num-slot${on ? " on" : ""}`} style={{ ["--c" as string]: c } as CSSProperties}>
                <circle cx={cx} cy={cy} r={0.85} />
                <use href={`#hat-${id}`} x={cx - HAT_W / 2} y={cy - HAT_H / 2} width={HAT_W} height={HAT_H} />
              </g>
            );
          })}
        </svg>
        <div className="num-track" aria-hidden="true">
          <span className="num-track-fill" />
          <span className="num-thumb">
            <span className="num-stake" />
            <span className="num-knob">
              <svg viewBox="0 0 16 10" aria-hidden="true">
                <path d="M5 1.5 1.5 5 5 8.5M11 1.5 14.5 5 11 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
