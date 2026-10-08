// PerspectiveStage: the site's two entrances, one engine (brief 3.4 slide, 3.6 iris, 6). Owner: A3.
//
//   <PerspectiveStage preset="slide" originRef={planRef} videoKey="el-c30" bleed="full"
//     view={<ViewTitle id="a101-perspective"><LoopVideo id="el-c30" /></ViewTitle>}>
//     {composition at rest: the plan, H2, ...}
//   </PerspectiveStage>
//
// Pinned for `pinVh` (70vh) of scroll; the entrance is scroll-mapped across the first 40% of the pin
// (SETTLE), then it holds. Only transform, opacity and clip-path change per frame; layout is measured
// on resize / load / fonts only (system/scroll onLayout), and scroll reads window.scrollY only.
//
//   slide  The perspective starts hidden under the origin (the plan), slides down out from under its
//          bottom edge (clip-path reveals it as it clears the edge), then grows to full bleed between
//          slab-black mattes: the site's one letterboxed 2.39:1 hold.
//   iris   The perspective appears inside the origin circle (the detail), then the circle irises open
//          (clip-path: circle()) to the perspective's native 16:9 frame.
//
// Flow mode (no JS, reduced motion / MOTION OFF, phones < 768): no pin; the composition, then the view,
// in normal flow (the end state). The view's .view-frame is the moving part; its caption prints in.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { onLayout, onScroll } from '../system/scroll';
import { usePrefs } from '../system/prefs';
import { videoManager } from '../system/VideoManager';
import { settleEase, segment, clamp01 } from '../system/easing';
import { useMedia } from '../marks/useInView';
import '../marks/sheets/pstage.css';

export type EntrancePreset = 'slide' | 'iris';

export interface PerspectiveStageProps {
  preset: EntrancePreset;
  /** The composition at rest (inside the pinned layer, under the entering view) */
  children: ReactNode;
  /** The perspective view: <ViewTitle …><LoopVideo …/></ViewTitle> */
  view: ReactNode;
  /** VideoManager key of the view's LoopVideo (played only once the entrance starts) */
  videoKey?: string;
  /** slide: the element the view slides out from under; iris: the circle it opens from */
  originRef: RefObject<HTMLElement | null>;
  /** Width of the view at rest: full bleed (slide) or the content column (iris) */
  bleed?: 'full' | 'content';
  /** Aspect of the view's frame (w / h); default 2.39 (slide) or 16 / 9 (iris) */
  aspect?: number;
  /** Pin length in vh (default 70) */
  pinVh?: number;
  /** slide: where the origin's bottom edge sits (fraction of the viewport) when the pin starts */
  pinAt?: number;
  /** id for the view anchor (view markers target it: lands on the hold, or on the view in flow) */
  anchorId?: string;
  /** Narrowest viewport (px) that pins; below it the stage is in flow (default 768) */
  pinMinWidth?: number;
  /** Called with the entrance progress e (0..1) on every frame it changes (no React state) */
  onEntrance?: (e: number) => void;
  className?: string;
}

interface Geo {
  K: number; // sticky top offset (px above the viewport top when pinned)
  vh: number;
  pin: number; // pin length px
  startY: number; // window.scrollY at pin start
  F: { x: number; y: number; w: number; h: number }; // final frame rect, sticky coords
  O: { x: number; y: number; w: number; h: number }; // origin rect, sticky coords
}

const CAPTION_H = 30; // view title under the frame
const CHROME_TOP = () => {
  const cs = getComputedStyle(document.documentElement);
  return (parseFloat(cs.getPropertyValue('--border')) || 24) + (parseFloat(cs.getPropertyValue('--header-h')) || 48);
};
const CHROME_BOTTOM = () => {
  const cs = getComputedStyle(document.documentElement);
  return (parseFloat(cs.getPropertyValue('--border')) || 24) + (parseFloat(cs.getPropertyValue('--strip-h')) || 56);
};

export function PerspectiveStage({
  preset,
  children,
  view,
  videoKey,
  originRef,
  bleed = preset === 'slide' ? 'full' : 'content',
  aspect = preset === 'slide' ? 2.39 : 16 / 9,
  pinVh = 70,
  pinAt = 0.56,
  anchorId,
  pinMinWidth = 768,
  onEntrance,
  className,
}: PerspectiveStageProps) {
  const { motion } = usePrefs();
  const phone = useMedia(`(max-width: ${pinMinWidth - 1}px)`);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const pin = hydrated && motion && !phone;

  const trackRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const compRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const matteRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<HTMLSpanElement>(null);
  const onEntranceRef = useRef(onEntrance);
  onEntranceRef.current = onEntrance;

  // flow mode: clear anything the pinned engine set
  useEffect(() => {
    if (pin) return;
    for (const el of [trackRef.current, stickyRef.current, viewRef.current, matteRef.current]) el?.removeAttribute('style');
    const frame = viewRef.current?.querySelector<HTMLElement>('.view-frame');
    const cap = viewRef.current?.querySelector<HTMLElement>('.view-title');
    frame?.style.removeProperty('transform');
    frame?.style.removeProperty('clip-path');
    frame?.style.removeProperty('opacity');
    cap?.style.removeProperty('opacity');
    onEntranceRef.current?.(1);
  }, [pin]);

  useEffect(() => {
    if (!pin) return;
    const track = trackRef.current;
    const sticky = stickyRef.current;
    const comp = compRef.current;
    const viewEl = viewRef.current;
    const matte = matteRef.current;
    if (!track || !sticky || !comp || !viewEl || !matte) return;
    const frame = viewEl.querySelector<HTMLElement>('.view-frame');
    const cap = viewEl.querySelector<HTMLElement>('.view-title');
    if (!frame) return;

    let geo: Geo | null = null;
    let lastE = -1;
    let playing = false;

    const measure = () => {
      const origin = originRef.current;
      if (!origin) return;
      const vh = window.innerHeight;
      const vw = document.documentElement.clientWidth;
      const top = CHROME_TOP();
      const bottom = CHROME_BOTTOM();
      // reset so we measure the natural layout
      sticky.style.top = '0px';
      const sr = sticky.getBoundingClientRect();
      const or = origin.getBoundingClientRect();
      const O = { x: or.left - sr.left, y: or.top - sr.top, w: or.width, h: or.height };
      // K may be negative: the layer then sticks below the viewport top (the matte covers the gap)
      let K: number;
      if (preset === 'slide') {
        K = O.y + O.h - pinAt * vh;
      } else {
        const band = top + (vh - top - bottom - CAPTION_H) / 2;
        K = O.y + O.h / 2 - band;
      }
      const compH = comp.offsetHeight;
      const H = Math.max(compH, K + vh);
      const pinPx = (pinVh / 100) * vh;
      sticky.style.height = `${H}px`;
      sticky.style.top = `${-K}px`;
      track.style.height = `${H + pinPx}px`;

      // final frame: centred in the band between the chrome, above its caption
      const avail = vh - top - bottom - CAPTION_H - 16;
      const contentW = comp.querySelector<HTMLElement>('.sheet-inner')?.getBoundingClientRect().width ?? vw;
      let w = bleed === 'full' ? vw : contentW;
      let h = w / aspect;
      if (h > avail) {
        h = avail;
        w = h * aspect;
      }
      const x = (vw - w) / 2 - sr.left;
      const y = K + top + (vh - top - bottom - (h + CAPTION_H)) / 2;
      viewEl.style.left = `${x}px`;
      viewEl.style.top = `${y}px`;
      viewEl.style.width = `${w}px`;
      matte.style.top = `${K}px`;
      matte.style.height = `${vh}px`;

      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const sp = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      if (holdRef.current) holdRef.current.style.top = `${K + 0.55 * pinPx + sp}px`;
      geo = { K, vh, pin: pinPx, startY: trackTop + K, F: { x, y, w, h }, O };
      lastE = -1;
      update();
    };

    const apply = (e: number) => {
      if (!geo) return;
      const { F, O } = geo;
      if (preset === 'slide') {
        const hA = O.w / aspect;
        const I = { x: O.x, y: O.y + O.h - hA, w: O.w };
        const M = { x: O.x, y: O.y + O.h + 24, w: O.w };
        const A = 0.42;
        let rx: number, ry: number, rw: number;
        if (e <= A) {
          const t = settleEase(segment(e, 0, A));
          rx = I.x + (M.x - I.x) * t;
          ry = I.y + (M.y - I.y) * t;
          rw = O.w;
        } else {
          const t = settleEase(segment(e, A, 1));
          rx = M.x + (F.x - M.x) * t;
          ry = M.y + (F.y - M.y) * t;
          rw = M.w + (F.w - M.w) * t;
        }
        const s = rw / F.w;
        // phase A only: px of the frame still under the plan's bottom edge (it grows over it after)
        const hidden = e <= A ? Math.max(0, O.y + O.h - ry) : 0;
        frame.style.transform = e >= 1 ? '' : `translate(${rx - F.x}px, ${ry - F.y}px) scale(${s})`;
        frame.style.clipPath = hidden > 0 ? `inset(${hidden / s}px 0 0 0)` : '';
        frame.style.opacity = e <= 0 ? '0' : '1';
        matte.style.opacity = String(segment(e, A, 0.9));
      } else {
        const cx = O.x + O.w / 2 - F.x;
        const cy = O.y + O.h / 2 - F.y;
        const r0 = O.w / 2;
        const R = Math.max(
          Math.hypot(cx, cy),
          Math.hypot(F.w - cx, cy),
          Math.hypot(cx, F.h - cy),
          Math.hypot(F.w - cx, F.h - cy),
        );
        const r = r0 + (R - r0) * settleEase(segment(e, 0.18, 1));
        frame.style.transform = '';
        frame.style.clipPath = e >= 1 ? '' : `circle(${r}px at ${cx}px ${cy}px)`;
        frame.style.opacity = String(segment(e, 0, 0.18));
        matte.style.opacity = String(segment(e, 0.3, 0.85));
      }
      if (cap) cap.style.opacity = String(segment(e, 0.82, 1));
      onEntranceRef.current?.(e);
    };

    const update = () => {
      if (!geo) return;
      const p = clamp01((window.scrollY - geo.startY) / geo.pin);
      const e = clamp01(p / 0.4);
      // the perspective's film claims a decoder only once it is entering
      const wantPlay = window.scrollY > geo.startY - geo.vh * 0.25;
      if (videoKey && wantPlay !== playing) {
        playing = wantPlay;
        if (wantPlay) videoManager.request(videoKey);
        else videoManager.pause(videoKey);
      }
      if (Math.abs(e - lastE) < 0.0005) return;
      lastE = e;
      apply(e);
    };

    if (videoKey) videoManager.pause(videoKey);
    measure();
    viewEl.dataset.ready = '';
    const offS = onScroll(update);
    const offL = onLayout(measure);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure());
      ro.observe(comp);
    }
    return () => {
      offS();
      offL();
      ro?.disconnect();
      delete viewEl.dataset.ready;
      if (videoKey) videoManager.request(videoKey);
    };
  }, [pin, preset, originRef, videoKey, bleed, aspect, pinVh, pinAt]);

  const style = { ['--pin' as string]: pinVh } as CSSProperties;
  return (
    <div
      className={`pstage pstage--${preset} pstage--${bleed} ${className ?? ''}`}
      data-mode={pin ? 'pin' : 'flow'}
      data-pin-min={pinMinWidth > 768 ? pinMinWidth : undefined}
      style={style}
    >
      <div ref={trackRef} className="pstage-track">
        <div ref={stickyRef} className="pstage-sticky">
          <div ref={compRef} className="pstage-comp">
            {children}
          </div>
          <div ref={matteRef} className="pstage-matte" aria-hidden="true" />
          {pin ? null : <span id={anchorId} className="pstage-anchor pstage-anchor--flow" aria-hidden="true" />}
          <div ref={viewRef} className="pstage-view">
            {view}
          </div>
        </div>
        {pin ? <span ref={holdRef} id={anchorId} className="pstage-anchor pstage-anchor--hold" aria-hidden="true" /> : null}
      </div>
    </div>
  );
}

export default PerspectiveStage;
