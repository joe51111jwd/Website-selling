// ArenaPlan: THE FIVE BAYS as one row of five (brief 3.3). Owner: A3.
//
//   <ArenaPlan ref={arenaRef} mode="stage" />     // A2: inside the cover stage (requests/A2-1.md)
//   <ArenaPlan mode="static" />                   // A100Bays: reduced motion, no JS, App fallback
//   arenaRef.current.getBayRect(5) -> DOMRect     // the full 1:1 plan frame of bay 05 (viewport px)
//
// Geometry is R2's units, so every rect registers: content width W, bay b = W / 5.4, gap 0.1 b,
// bay n at x = (n - 1) * 1.1 b. The R2 strip (arena-0104, 1890x350; slot 05 left black) spans the
// whole row. Static mode: b44 plays in slot 05 from 2.60 s, once, and holds its last frame.
// Stage mode: slot 05 is the empty bay box only; A2 lands the plan-cut still and its own b44 film in it.
//
// Each bay is one <a> (gridline bubble + tile + label) to its sheet: hover / focus outlines the tile in
// chalk blue and inks the label (150 ms); nothing else moves. Phones (<768): the same row, labels
// hidden, then the five names as a numbered list of links (rows >= 44 px).
//
// Stage hooks, set by A2 on an ancestor `.cv-a100` (defaults = fully visible):
//   --arena-in (0..1)            opacity of the R2 strip's film and of the tile outlines (bays 01-04);
//                                under it the strip's poster and slot 05's plan still show with the
//                                row (--a100-o), so no bay ever prints as an empty box (F-037)
//   [data-bubbles="in"|"out"]    gridline bubbles drawn / not yet drawn (absent = drawn)
//   [data-print="in"|"out"]      bay labels and the phone list printed in / not yet (absent = visible)
// The R2 strip only claims a decoder once data-bubbles is not "out" (so it never plays under the hero).
// Stage mode holds the row's media in the VideoManager load group "a100" (F-002): no poster, still or
// film bytes on first view; A2 releases the group as the pull-out starts.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import { ViewTitle } from '../chrome/ViewTitle';
import { LabelText } from '../chrome/LabelText';
import { LoopVideo, PHONE_MEDIA } from '../system/LoopVideo';
import { Picture } from '../system/Picture';
import { videoManager } from '../system/VideoManager';
import { media } from '../media/manifest';
import { lenisScrollTo } from '../system/lenis';
import { CHALLENGES } from '../content/challenges';
import { anchorOf } from '../content/sheets';
import { A100 } from '../content/copy/a100-a103';
import { GridBubble } from '../marks/GridBubble';
import { useInView, useMedia } from '../marks/useInView';
import '../marks/marks.css';
import '../marks/sheets/arena.css';

export type BayNo = 1 | 2 | 3 | 4 | 5;

export interface ArenaPlanHandle {
  /** Viewport rect of bay n: its full 1:1 plan frame (the R2 square; slot 05 is where b44 lands). */
  getBayRect(n: BayNo): DOMRect;
  /** The row element (all five bays). */
  readonly row: HTMLElement | null;
}

export interface ArenaPlanProps {
  mode?: 'stage' | 'static';
  className?: string;
}

const STRIP_KEY = 'arena-0104';
const SLOT5_INSTANCE = 'a100';
const SLOT5_START = 2.6;
/** Stage mode: slot 05 holds the plan-cut still (b44 at 2.60 s) until A2 lands its film there */
const SLOT5_STILL = 'plan-b44-260';
const LOAD_GROUP = 'a100';

/**
 * The R2 strip's poster as its own layer under the film (stage mode): the same files the LoopVideo's
 * poster uses (phone variant first), decorative (the film carries the label). Class `picture` puts it
 * under the load-group hold.
 */
function StripPoster() {
  const d = media[STRIP_KEY];
  const m = media[`${STRIP_KEY}-m`];
  if (!d?.posterFallback) return null;
  return (
    <picture className="picture arena-poster" aria-hidden="true">
      {m?.poster ? <source media={PHONE_MEDIA} srcSet={m.poster} type="image/avif" /> : null}
      {m?.posterFallback ? <source media={PHONE_MEDIA} srcSet={m.posterFallback} /> : null}
      {d.poster ? <source srcSet={d.poster} type="image/avif" /> : null}
      <img src={d.posterFallback} alt="" width={d.w} height={d.h} loading="lazy" decoding="async" />
    </picture>
  );
}

export const ArenaPlan = forwardRef<ArenaPlanHandle, ArenaPlanProps>(function ArenaPlan({ mode = 'static', className }, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const stage = mode === 'stage';
  const phone = useMedia('(max-width: 767px)');
  const inView = useInView(rowRef, { rootMargin: '0px 0px -10% 0px' });
  const [drawn, setDrawn] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      getBayRect(n: BayNo) {
        const el = tileRefs.current[n - 1];
        return el ? el.getBoundingClientRect() : new DOMRect();
      },
      get row() {
        return rowRef.current;
      },
    }),
    [],
  );

  // static: draw the gridline bubbles when the row arrives (stage: A2's data-bubbles decides)
  useEffect(() => {
    if (!stage) setDrawn(inView);
  }, [stage, inView]);

  // stage: the R2 strip plays only once the pull-out has begun (data-bubbles != "out")
  useEffect(() => {
    if (!stage) return;
    const host = rootRef.current?.closest<HTMLElement>('.cv-a100');
    const sync = () => {
      if (!host || host.dataset.bubbles !== 'out') videoManager.request(STRIP_KEY);
      else videoManager.pause(STRIP_KEY);
    };
    sync();
    if (!host || typeof MutationObserver === 'undefined') return;
    const mo = new MutationObserver(sync);
    mo.observe(host, { attributes: true, attributeFilter: ['data-bubbles'] });
    return () => mo.disconnect();
  }, [stage]);

  // phones: the numbered list carries the links for assistive tech; the tiles stay tappable
  const tileA11y = phone ? { tabIndex: -1, 'aria-hidden': true as const } : {};

  const go = (e: MouseEvent<HTMLAnchorElement>, anchor: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const el = document.getElementById(anchor);
    if (!el) return;
    e.preventDefault();
    lenisScrollTo(el);
  };

  return (
    <div ref={rootRef} className={`arena ${className ?? ''}`} data-mode={mode}>
      <ViewTitle id="a100-plans" className="arena-view" frame={false}>
        <div className="arena-plot">
          <div ref={rowRef} className="arena-row" data-vm-group={stage ? LOAD_GROUP : undefined}>
            {stage ? <StripPoster /> : null}
            <div className="arena-strip">
              <LoopVideo id="arena-0104" label={A100.videoLabel} autoPlay={!stage} fit="cover" />
            </div>
            <div className="arena-slot5">
              {stage ? (
                <Picture id={SLOT5_STILL} decorative fit="cover" className="arena-slot5-still" />
              ) : (
                <LoopVideo id="plan-b44" instance={SLOT5_INSTANCE} label={A100.slot5Label} startAt={SLOT5_START} fit="cover" />
              )}
            </div>
          </div>
          <ol className="arena-bays">
            {CHALLENGES.map((c, i) => (
              <li key={c.no} className="arena-bay" style={{ ['--i' as string]: i } as CSSProperties}>
                <a className="arena-link" href={`#${anchorOf(c.sheet)}`} onClick={(e) => go(e, anchorOf(c.sheet))} {...tileA11y}>
                  <GridBubble n={c.num} leader={12} drawn={stage || drawn} delay={i * 120} className="arena-bubble" />
                  <span
                    ref={(el) => {
                      tileRefs.current[i] = el;
                    }}
                    className="arena-tile"
                    data-bay={c.no}
                  />
                  <span className="arena-label t-label a100-print">
                    <LabelText text={c.label} />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </ViewTitle>

      <ol className="arena-list a100-print">
        {CHALLENGES.map((c) => (
          <li key={c.no}>
            <a className="arena-list-link" href={`#${anchorOf(c.sheet)}`} onClick={(e) => go(e, anchorOf(c.sheet))}>
              <span className="arena-list-num num">{c.num}</span>
              <span className="arena-list-name">{c.upper}</span>
              <span className="arena-list-sheet num" aria-hidden="true">
                {c.sheet}
              </span>
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
