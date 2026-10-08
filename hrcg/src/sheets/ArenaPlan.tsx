// ArenaPlan: THE FIVE BAYS as one row of five (brief 3.3). Owner: A3.
//
//   <ArenaPlan ref={arenaRef} mode="stage" progress={P} />   // A2: inside the cover stage
//   <ArenaPlan mode="static" />                              // A100Bays (reduced motion, fallback)
//   arenaRef.current.getBayRect(5) -> DOMRect                // A2: the pull-out lands exactly here
//
// Geometry is R2's units, so every rect registers: content width W, bay b = W / 5.4, gap 0.1 b,
// bay n at x = (n - 1) * 1.1 b. The R2 strip (arena-0104, 1890x350, slot 05 left black) spans the
// whole row; b44 plays in slot 05 from 2.60 s, once, and holds its last frame.
//
// Each bay is one <a> (gridline bubble + tile + label) to its sheet: hover / focus outlines the tile
// in chalk blue and inks the label (150 ms), nothing else moves. Phones (<768): the same row, labels
// hidden, then the five names as a numbered list of links (rows >= 44 px).
//
// Stage mode (progress = cover-stage P, brief 3.3): R2 fades in over P .45-.72 and starts playing at
// .40; the bubbles draw on (DRAW 400 ms, 120 ms stagger) from .45; at .75 the slot lands (b44 shows
// and plays from 2.60 s) and the labels print in. A2 may also call setLanded() itself.

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import type { MotionValue } from 'motion/react';
import { ViewTitle } from '../chrome/ViewTitle';
import { LoopVideo } from '../system/LoopVideo';
import { videoManager } from '../system/VideoManager';
import { lenisScrollTo } from '../system/lenis';
import { segment } from '../system/easing';
import { CHALLENGES } from '../content/challenges';
import { anchorOf } from '../content/sheets';
import { A100 } from '../content/copy/a100-a103';
import { GridBubble } from '../marks/GridBubble';
import { useInView, useMedia } from '../marks/useInView';
import '../marks/sheets/arena.css';

export type BayNo = 1 | 2 | 3 | 4 | 5;

export interface ArenaPlanHandle {
  /** Viewport rect of bay n's tile (the video square; slot 05 is where b44 renders). */
  getBayRect(n: BayNo): DOMRect;
  /** Stage mode: show slot 05's b44 video (true) or leave the slot empty for the FLIP (false). */
  setLanded(landed: boolean): void;
  /** The row element (all five tiles), for A2's measurements. */
  readonly row: HTMLElement | null;
}

export interface ArenaPlanProps {
  mode?: 'stage' | 'static';
  /** Stage mode: the cover stage's progress P (0..1). */
  progress?: MotionValue<number>;
  className?: string;
}

const STRIP_KEY = 'arena-0104';
const SLOT5_INSTANCE = 'a100';
const SLOT5_KEY = `plan-b44#${SLOT5_INSTANCE}`;
const SLOT5_START = 2.6;

export const ArenaPlan = forwardRef<ArenaPlanHandle, ArenaPlanProps>(function ArenaPlan(
  { mode = 'static', progress, className },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const stage = mode === 'stage';
  const phone = useMedia('(max-width: 767px)');

  // static: draw the bubbles when the row arrives; stage: driven by P
  const inView = useInView(rowRef, { rootMargin: '0px 0px -10% 0px' });
  const [drawn, setDrawn] = useState(false);
  const [landed, setLandedState] = useState(!stage);
  const landedRef = useRef(!stage);

  const setLanded = useCallback(
    (on: boolean) => {
      if (landedRef.current === on) return;
      landedRef.current = on;
      setLandedState(on);
      if (!stage) return;
      if (on) videoManager.request(SLOT5_KEY);
      else videoManager.pause(SLOT5_KEY);
    },
    [stage],
  );

  useImperativeHandle(
    ref,
    () => ({
      getBayRect(n: BayNo) {
        const el = tileRefs.current[n - 1];
        return el ? el.getBoundingClientRect() : new DOMRect();
      },
      setLanded,
      get row() {
        return rowRef.current;
      },
    }),
    [setLanded],
  );

  useEffect(() => {
    if (!stage) setDrawn(inView);
  }, [stage, inView]);

  // stage mode: map P to strip opacity, playback, bubbles and landing (no React state per frame)
  useEffect(() => {
    if (!stage || !progress) return;
    let stripOn = false;
    const apply = (p: number) => {
      const strip = stripRef.current;
      if (strip) strip.style.opacity = String(segment(p, 0.45, 0.72));
      if (p >= 0.4 && !stripOn) {
        stripOn = true;
        videoManager.request(STRIP_KEY);
      } else if (p < 0.35 && stripOn) {
        stripOn = false;
        videoManager.pause(STRIP_KEY);
      }
      setDrawn(p >= 0.45);
      setLanded(p >= 0.75);
    };
    apply(progress.get());
    return progress.on('change', apply);
  }, [stage, progress, setLanded]);

  // phones: the numbered list carries the links for assistive tech; the tiles stay tappable
  const tileA11y = phone ? { tabIndex: -1, 'aria-hidden': true as const } : {};

  const go = (e: MouseEvent<HTMLAnchorElement>, anchor: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const el = document.getElementById(anchor);
    if (!el) return;
    e.preventDefault();
    lenisScrollTo(el);
  };

  return (
    <div
      ref={rootRef}
      className={`arena ${className ?? ''}`}
      data-mode={mode}
      data-landed={landed || undefined}
      data-drawn={drawn || undefined}
    >
      <ViewTitle id="a100-plans" className="arena-view" frame={false}>
        <div className="arena-plot">
          <div ref={rowRef} className="arena-row">
            <div ref={stripRef} className="arena-strip">
              <LoopVideo id="arena-0104" label={A100.videoLabel} autoPlay={!stage} fit="cover" />
            </div>
            <div className="arena-slot5">
              <LoopVideo
                id="plan-b44"
                instance={SLOT5_INSTANCE}
                label={A100.slot5Label}
                startAt={SLOT5_START}
                autoPlay={!stage}
                fit="cover"
              />
            </div>
          </div>
          <ol className="arena-bays">
            {CHALLENGES.map((c, i) => (
              <li key={c.no} className="arena-bay" style={{ ['--i' as string]: i } as CSSProperties}>
                <a
                  className="arena-link"
                  href={`#${anchorOf(c.sheet)}`}
                  onClick={(e) => go(e, anchorOf(c.sheet))}
                  {...tileA11y}
                >
                  <GridBubble n={c.num} leader={14} drawn={drawn} delay={i * 120} className="arena-bubble" />
                  <span
                    ref={(el) => {
                      tileRefs.current[i] = el;
                    }}
                    className="arena-tile"
                    data-bay={c.no}
                  />
                  <span className="arena-label t-label">{c.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </ViewTitle>

      <ol className="arena-list" aria-label="The five bays">
        {CHALLENGES.map((c) => (
          <li key={c.no}>
            <a className="arena-list-link" href={`#${anchorOf(c.sheet)}`} onClick={(e) => go(e, anchorOf(c.sheet))}>
              <span className="num">{c.num}</span>
              <span className="arena-list-name">{c.upper}</span>
              <span className="arena-list-arrow" aria-hidden="true">
                →
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
});

export default ArenaPlan;
