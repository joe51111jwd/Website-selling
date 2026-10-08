// Usage: <DetailBubble n={1} sheet="A-101" label="concept film of …" panelStyle={{ left: 0, top: 56 }}>{detail view}</DetailBubble> opens its detail.
// Owner: A3. Brief 5.5 "detail bubble n / sheet: opens its detail"; 3.4 / 3.13: a <button aria-expanded>;
// the detail expands with clip-path: circle() to 36vw from the bubble; a second click, Esc, or the
// sheet leaving the viewport closes it, and focus returns to the bubble.
// Accessible name (F-035, WCAG 2.5.3): "1 / A-101 detail: <label>", so it starts with the visible text
// (the copy lint allows "1 / A-101"; the slash is not a word for the visible-label check).
// Once open, the page scrolls the least it can to bring the detail's caption inside the band between
// the chrome (F-036). `phoneFlow`: below 768 px the detail opens in flow under the bubble's row.
// The panel content is the caller's (normally <ViewTitle id="…"><LoopVideo id="…" autoPlay={false}/></ViewTitle>):
// its .view-frame is clipped to the circle and its caption prints in once open.
// `static` renders just the symbol (a label for a detail circle drawn elsewhere, e.g. A-103).

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { getLenis, unobscuredBand } from '../system/lenis';
import { prefsStore } from '../system/prefs';
import './marks.css';

export interface DetailBubbleProps {
  /** Detail number (top half) */
  n: number | string;
  /** Sheet (bottom half), e.g. 'A-101' */
  sheet: string;
  /** What the detail shows (brief copy, e.g. "concept film of …"); the button's name is "n / sheet detail: label" */
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
  /** Phones (< 768 px): open in flow under the bubble's row (the parent is a wrapping flex row) */
  phoneFlow?: boolean;
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
      </text>{' '}
      {/* the rule reads as the slash; this invisible one keeps the text "1 / A-101" for copy checks
          (the spaces keep "1" and "A-101" separate words for the visible-label check, F-035) */}
      <text className="mk-id" x={c} y={c} visibility="hidden">
        /
      </text>{' '}
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
  phoneFlow = false,
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

  // Once open (its layout is final): grow from the bubble, and bring the caption into view (F-036).
  useLayoutEffect(() => {
    if (!open) return;
    placeOrigin();
    const raf = requestAnimationFrame(() => revealCaption(panelRef.current));
    return () => cancelAnimationFrame(raf);
  }, [open, placeOrigin]);

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
    <div ref={rootRef} className={`mk-detail ${className ?? ''}`} style={style} data-phone-flow={phoneFlow || undefined}>
      <button
        ref={btnRef}
        type="button"
        className="mk-hit mk-db"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label ? `${n} / ${sheet} detail: ${label}` : undefined}
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

/**
 * Scroll the least needed so the open detail's caption (its view title, which carries the AI
 * disclosure) sits inside the band between the chrome, without pushing the panel's top above it.
 */
function revealCaption(panel: HTMLElement | null) {
  if (!panel) return;
  const cap = panel.querySelector<HTMLElement>('.view-title') ?? panel;
  const band = unobscuredBand();
  const pr = panel.getBoundingClientRect();
  const cr = cap.getBoundingClientRect();
  if (cr.height === 0) return;
  let dy = 0;
  if (cr.bottom > band.bottom) dy = Math.min(cr.bottom - band.bottom + 8, Math.max(0, pr.top - band.top));
  else if (pr.top < band.top) dy = pr.top - band.top;
  if (Math.abs(dy) < 1) return;
  const top = window.scrollY + dy;
  const lenis = getLenis();
  if (lenis && prefsStore.get().motion) lenis.scrollTo(top, { duration: 0.6 });
  else window.scrollTo({ top, behavior: 'auto' });
}

export default DetailBubble;
