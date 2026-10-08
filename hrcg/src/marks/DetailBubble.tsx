// Usage: <DetailBubble n={1} sheet="A-101" label="Open detail 1, …" panelStyle={{ left: 0, top: 56 }}>{detail view}</DetailBubble> opens its detail.
// Owner: A3. Brief 5.5 "detail bubble n / sheet: opens its detail"; 3.4 / 3.13: a <button aria-expanded>;
// the detail expands with clip-path: circle() to 36vw from the bubble; a second click, Esc, or the
// sheet leaving the viewport closes it, and focus returns to the bubble.
// The panel content is the caller's (normally <ViewTitle id="…"><LoopVideo id="…" autoPlay={false}/></ViewTitle>):
// its .view-frame is clipped to the circle and its caption prints in once open.
// `static` renders just the symbol (a label for a detail circle drawn elsewhere, e.g. A-103).

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './marks.css';

export interface DetailBubbleProps {
  /** Detail number (top half) */
  n: number | string;
  /** Sheet (bottom half), e.g. 'A-101' */
  sheet: string;
  /** Plain-language accessible name of the button (brief copy) */
  label?: string;
  /** Bubble diameter in px (default 44) */
  size?: number;
  /** The detail view shown when open */
  children?: ReactNode;
  /** Panel placement relative to the bubble's wrapper (absolute): left/top/right/bottom/width */
  panelStyle?: CSSProperties;
  panelClassName?: string;
  /** Called when the detail opens or closes (start / stop its video here) */
  onOpenChange?: (open: boolean) => void;
  /** Symbol only: no button, no panel (aria-hidden unless `title`) */
  static?: boolean;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

function BubbleSymbol({ n, sheet, size }: { n: number | string; sheet: string; size: number }) {
  const r = size / 2;
  const box = size + 10;
  const c = box / 2;
  return (
    <svg className="mk" viewBox={`0 0 ${box} ${box}`} width={box} height={box} aria-hidden="true" focusable="false">
      <circle className="mk-face" cx={c} cy={c} r={r} />
      <circle className="mk-line mk-ink" cx={c} cy={c} r={r} />
      <line className="mk-line mk-ink" x1={c - r} y1={c + 2} x2={c + r} y2={c + 2} />
      <text className="mk-id" x={c} y={c - 4} textAnchor="middle" style={{ fontSize: 13 }}>
        {n}
      </text>
      {/* the rule reads as the slash; this invisible one keeps the text "1 / A-101" for copy checks */}
      <text className="mk-id" x={c} y={c} visibility="hidden">
        /
      </text>
      <text className="mk-id" x={c} y={c + 15} textAnchor="middle">
        {sheet}
      </text>
      <circle className="mk-ring" cx={c} cy={c} r={r + 4} />
    </svg>
  );
}

export function DetailBubble({
  n,
  sheet,
  label,
  size = 44,
  children,
  panelStyle,
  panelClassName,
  onOpenChange,
  static: isStatic = false,
  title,
  className,
  style,
}: DetailBubbleProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const onOpenRef = useRef(onOpenChange);
  onOpenRef.current = onOpenChange;

  // Measure the bubble centre relative to the panel so the circle grows out of the bubble.
  const placeOrigin = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    const p = panelRef.current;
    if (!b || !p) return;
    const pr = p.getBoundingClientRect();
    p.style.setProperty('--cx', `${b.left + b.width / 2 - pr.left}px`);
    p.style.setProperty('--cy', `${b.top + b.height / 2 - pr.top}px`);
    p.style.setProperty('--r0', `${size / 2}px`);
  }, [size]);

  const setOpenState = useCallback(
    (next: boolean, returnFocus: boolean) => {
      if (next) placeOrigin();
      setOpen(next);
      onOpenRef.current?.(next);
      if (!next && returnFocus) {
        const active = document.activeElement;
        if (!active || active === document.body || panelRef.current?.contains(active)) {
          btnRef.current?.focus({ preventScroll: true });
        }
      }
    },
    [placeOrigin],
  );

  // Esc closes; leaving the sheet closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpenState(false, false);
        btnRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKey);
    const sheet = rootRef.current?.closest('[data-sheet]') ?? rootRef.current;
    let io: IntersectionObserver | undefined;
    if (sheet && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => !e.isIntersecting)) setOpenState(false, true);
      });
      io.observe(sheet);
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      io?.disconnect();
    };
  }, [open, setOpenState]);

  if (isStatic) {
    const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
    return (
      <span className={`mk-db mk-db--static ${className ?? ''}`} style={style} {...a11y}>
        <BubbleSymbol n={n} sheet={sheet} size={size} />
      </span>
    );
  }

  return (
    <div ref={rootRef} className={`mk-detail ${className ?? ''}`} style={style}>
      <button
        ref={btnRef}
        type="button"
        className="mk-hit mk-db"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        onClick={() => setOpenState(!open, true)}
      >
        <BubbleSymbol n={n} sheet={sheet} size={size} />
      </button>
      <div
        ref={panelRef}
        id={panelId}
        className={`mk-detail-panel ${panelClassName ?? ''}`}
        data-open={open || undefined}
        style={panelStyle}
      >
        {children}
      </div>
    </div>
  );
}

export default DetailBubble;
