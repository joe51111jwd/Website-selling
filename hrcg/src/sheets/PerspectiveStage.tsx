// PerspectiveStage: the site's two entrances, one engine (brief 3.4 slide, 3.6 iris, 6). Owner: A3.
//
//   <PerspectiveStage preset="slide" originRef={planRef} videoKey="el-c30" bleed="full"
//     view={<ViewTitle id="a101-perspective"><LoopVideo id="el-c30" /></ViewTitle>}>
//     {composition at rest: the plan, H2, ...}
//   </PerspectiveStage>
//
// Pinned for `pinVh` (70vh) of scroll after a short landing hold; the entrance is scroll-mapped across
// the first 40% of the pin, then it holds. Only transform, opacity and clip-path change per frame;
// layout is measured on resize / load / fonts only (system/scroll onLayout), and scroll reads
// window.scrollY only.
//
// Landing (FIXLIST F-007): the entrance starts no earlier than 20vh after the sheet's landing position
// (lenis landingTop: its data-land, else top - scroll-padding), so an INDEX row, a strip CTA or a deep
// link always arrives on the composed sheet at e = 0. The pin is lengthened by the same amount, so the
// hold keeps its 42vh. `landVh` writes the sheet's data-land while the stage pins.
//
// The composition leaves before the view takes its place (F-032, DIR-1): elements marked
// [data-pst-fade] (or the whole composition when none are marked) fade to exactly 0 before the view
// grows over them, and the composition is inert from then on, so no type ever sits under the film.
//
//   slide  The perspective emerges from under the plan's caption (its bottom edge is the emergence
//          line, so the caption rule is never covered), slides down (DRAW), then grows to full bleed
//          between slab-black mattes (DRAW): the site's one letterboxed 2.39:1 hold. Its own caption
//          travels with the frame's bottom edge, clipped to the frame's width (rule 22: the film is
//          labelled from its first visible pixel).
//   iris   The composition prints out around the detail circle; the circle swells 30% (by area,
//          DRAW), the detail dissolves to the perspective inside it and the DETAIL caption hands over
//          to the PERSPECTIVE caption at that moment; then the circle opens by area (DRAW) to the
//          perspective's native 16:9 frame, set on the spine.
//
// Flow mode (no JS, reduced motion / MOTION OFF, narrow viewports): no pin; the composition, then the
// view, in normal flow (the end state).

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { onLayout, onScroll } from '../system/scroll';
import { usePrefs } from '../system/prefs';
import { videoManager } from '../system/VideoManager';
import { landingTop } from '../system/lenis';
import { drawEase, segment, clamp01 } from '../system/easing';
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
  /** Pin length in vh after the landing hold (default 70) */
  pinVh?: number;
  /** slide: where the origin caption's bottom edge sits (fraction of the viewport) when the pin starts */
  pinAt?: number;
  /** id for the view anchor (view markers target it: lands on the hold, or on the view in flow) */
  anchorId?: string;
  /** Narrowest viewport (px) that pins; below it the stage is in flow (default 768) */
  pinMinWidth?: number;
  /** While pinned, the sheet's data-land (vh from its top) for INDEX / CTA landings (F-015) */
  landVh?: number;
  /** Called with the entrance progress e (0..1) on every frame it changes (no React state) */
  onEntrance?: (e: number) => void;
  className?: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Geo {
  K: number; // sticky top offset (px above the viewport top when pinned)
  vh: number;
  pin: number; // pin length px (entrance + hold)
  startY: number; // window.scrollY at entrance start (e = 0)
  F: Rect; // final frame rect, sticky coords
  O: Rect; // origin rect, sticky coords
  capBottom: number; // slide: the origin caption's bottom edge, sticky coords
  cap: { x: number; w: number } | null; // the view caption's natural left and width, sticky coords
  iris: { cx: number; cy: number; r0: number; r1: number; R: number } | null;
}

const CAPTION_H = 30; // view title under the frame
/** Scroll held at e = 0 after any landing, in vh (F-007) */
const LAND_HOLD = 0.2;
/** slide: emergence + slide phase ends; the composition is gone by then */
const SLIDE_A = 0.35;
const SLIDE_FADE: [number, number] = [0.2, SLIDE_A];
/** slide: gap between the origin caption and the emerged frame */
const SLIDE_GAP = 24;
/** iris beats (e): composition out, detail swells, dissolve + caption hand-over, open */
const IRIS_FADE: [number, number] = [0, 0.3];
const IRIS_SWELL: [number, number] = [0.3, 0.44];
const IRIS_DISSOLVE: [number, number] = [0.44, 0.56];
const IRIS_OPEN: [number, number] = [0.56, 1];
/** iris: radius growth of the detail before it dissolves (F-032: 30%) */
const IRIS_SWELL_K = 1.3;

const cssPx = (name: string, fallback: number) =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
const CHROME_TOP = () => cssPx('--border', 24) + cssPx('--header-h', 48);
const CHROME_BOTTOM = () => cssPx('--border', 24) + cssPx('--strip-h', 56);

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
  landVh,
  onEntrance,
  className,
}: PerspectiveStageProps) {
  const { motion } = usePrefs();
  const narrow = useMedia(`(max-width: ${pinMinWidth - 1}px)`);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const pin = hydrated && motion && !narrow;

  const rootRef = useRef<HTMLDivElement>(null);
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
    const comp = compRef.current;
    if (comp) {
      comp.inert = false;
      comp.style.removeProperty('opacity');
      for (const el of comp.querySelectorAll<HTMLElement>('[data-pst-fade]')) el.style.removeProperty('opacity');
    }
    const frame = viewRef.current?.querySelector<HTMLElement>('.view-frame');
    const cap = viewRef.current?.querySelector<HTMLElement>('.view-title');
    for (const el of [frame, cap]) {
      for (const p of ['transform', 'clip-path', 'opacity', 'pointer-events']) el?.style.removeProperty(p);
    }
    const origin = originRef.current;
    const oFrame = origin?.closest<HTMLElement>('.view-frame');
    const oCap = origin?.closest('.view')?.querySelector<HTMLElement>(':scope > .view-title');
    for (const el of [oFrame, oCap]) {
      for (const p of ['transform', 'transform-origin', 'opacity']) el?.style.removeProperty(p);
    }
    if (rootRef.current) delete rootRef.current.dataset.e;
    onEntranceRef.current?.(1);
  }, [pin, originRef]);

  // the sheet's landing offset, only while pinned (in flow the H2 landing under the header applies)
  useEffect(() => {
    if (!pin || landVh === undefined) return;
    const sheet = rootRef.current?.closest<HTMLElement>('[data-sheet]');
    if (!sheet) return;
    sheet.dataset.land = String(landVh);
    return () => {
      delete sheet.dataset.land;
    };
  }, [pin, landVh]);

  useEffect(() => {
    if (!pin) return;
    const root = rootRef.current;
    const track = trackRef.current;
    const sticky = stickyRef.current;
    const comp = compRef.current;
    const viewEl = viewRef.current;
    const matte = matteRef.current;
    if (!root || !track || !sticky || !comp || !viewEl || !matte) return;
    const frame = viewEl.querySelector<HTMLElement>('.view-frame');
    const cap = viewEl.querySelector<HTMLElement>('.view-title');
    if (!frame) return;
    const marked = [...comp.querySelectorAll<HTMLElement>('[data-pst-fade]')];
    const fadeEls = marked.length ? marked : [comp];

    let geo: Geo | null = null;
    let lastE = -1;
    let lastCompO = -1;
    let playing = false;
    // iris: the origin detail's frame and caption (re-resolved on every measure)
    let oFrameEl: HTMLElement | null = null;
    let oCapEl: HTMLElement | null = null;

    const originParts = () => {
      const origin = originRef.current;
      const oView = origin?.closest<HTMLElement>('.view');
      return {
        origin,
        // iris: the detail's frame swells; its caption hands over to the view's
        oFrame: origin?.closest<HTMLElement>('.view-frame') ?? origin ?? null,
        oCap: oView?.querySelector<HTMLElement>(':scope > .view-title') ?? null,
      };
    };

    const measure = () => {
      const { origin, oFrame, oCap } = originParts();
      if (!origin) return;
      oFrameEl = oFrame;
      oCapEl = oCap;
      const vh = window.innerHeight;
      const vw = document.documentElement.clientWidth;
      const top = CHROME_TOP();
      const bottom = CHROME_BOTTOM();
      // reset so we measure the natural layout
      sticky.style.top = '0px';
      frame.style.transform = '';
      if (cap) {
        cap.style.transform = '';
        cap.style.clipPath = '';
      }
      if (preset === 'iris') {
        if (oFrame) oFrame.style.transform = '';
        if (oCap) oCap.style.transform = '';
      }
      const sr = sticky.getBoundingClientRect();
      const or = origin.getBoundingClientRect();
      const O = { x: or.left - sr.left, y: or.top - sr.top, w: or.width, h: or.height };
      const capBottom = (oCap?.getBoundingClientRect().bottom ?? or.bottom) - sr.top;
      const inner = comp.querySelector<HTMLElement>('.sheet-inner')?.getBoundingClientRect();
      const contentL = (inner?.left ?? 0) - sr.left;
      const contentW = inner?.width ?? vw;

      // final frame: in the band between the chrome, above its caption
      const avail = vh - top - bottom - CAPTION_H - 16;
      let w = bleed === 'full' ? vw : contentW;
      let h = w / aspect;
      if (h > avail) {
        h = avail;
        w = h * aspect;
      }
      // full bleed is centred; the content frame sits on the spine (left content edge, F-076)
      const x = bleed === 'full' ? (vw - w) / 2 - sr.left : contentL;

      // K may be negative: the layer then sticks below the viewport top (the matte covers the gap)
      let K: number;
      if (preset === 'slide') {
        // the emerged frame and its caption must clear the strip
        const hA = O.w / aspect;
        const capView = Math.min(pinAt * vh, vh - bottom - CAPTION_H - 16 - hA - SLIDE_GAP);
        // on tall viewports never hold the composition lower than where a landing puts it (no empty band
        // above the sheet tag): it sticks at scroll-padding-top at the latest
        const padTop = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || top;
        K = Math.max(capBottom - capView, -padTop);
      } else {
        const band = top + (vh - top - bottom - CAPTION_H) / 2;
        K = O.y + O.h / 2 - band;
      }
      const y = K + top + (vh - top - bottom - (h + CAPTION_H)) / 2;

      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const sheet = root.closest<HTMLElement>('[data-sheet]');
      const landing = sheet ? (landingTop(sheet) ?? trackTop) : trackTop;
      const pinStart = trackTop + K; // where the sticky layer starts holding
      const startY = Math.max(pinStart, landing + LAND_HOLD * vh);
      const delay = startY - pinStart;

      const compH = comp.offsetHeight;
      const H = Math.max(compH, K + vh);
      const pinPx = (pinVh / 100) * vh;
      sticky.style.height = `${H}px`;
      sticky.style.top = `${-K}px`;
      track.style.height = `${H + delay + pinPx}px`;

      viewEl.style.left = `${x}px`;
      viewEl.style.top = `${y}px`;
      viewEl.style.width = `${w}px`;
      matte.style.top = `${K}px`;
      matte.style.height = `${vh}px`;

      let capGeo: Geo['cap'] = null;
      if (cap) {
        const cr = cap.getBoundingClientRect();
        capGeo = { x: cr.left - sr.left, w: cr.width };
      }

      let iris: Geo['iris'] = null;
      if (preset === 'iris') {
        const cx = O.x + O.w / 2 - x;
        const cy = O.y + O.h / 2 - y;
        const r0 = O.w / 2;
        const R = Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy));
        iris = { cx, cy, r0, r1: r0 * IRIS_SWELL_K, R };
        if (oFrame) oFrame.style.transformOrigin = '50% 50%';
      }

      const sp = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      // the view marker's anchor lands in the hold (scroll-padding is subtracted again on landing)
      if (holdRef.current) holdRef.current.style.top = `${startY - trackTop + 0.55 * pinPx + sp}px`;
      geo = { K, vh, pin: pinPx, startY, F: { x, y, w, h }, O, capBottom, cap: capGeo, iris };
      lastE = -1;
      lastCompO = -1;
      update();
    };

    const setComp = (o: number) => {
      const v = o >= 0.999 ? 1 : o <= 0.001 ? 0 : o;
      if (v === lastCompO) return;
      lastCompO = v;
      for (const el of fadeEls) {
        if (v === 1) el.style.removeProperty('opacity');
        else el.style.opacity = v.toFixed(3);
      }
      // nothing left on screen: out of the tab order and the accessibility tree (F-034)
      comp.inert = v === 0;
    };

    const apply = (e: number) => {
      if (!geo) return;
      const { F, O } = geo;
      let frameOn: boolean;
      if (preset === 'slide') {
        const hA = O.w / aspect;
        const capB = geo.capBottom;
        // I: fully under the caption's bottom edge; M: emerged, 24 px below it; F: the hold
        const I = { x: O.x, y: capB - hA };
        const M = { x: O.x, y: capB + SLIDE_GAP };
        let rx: number, ry: number, rw: number;
        let tB = 0;
        if (e <= SLIDE_A) {
          const t = drawEase(segment(e, 0, SLIDE_A));
          rx = I.x + (M.x - I.x) * t;
          ry = I.y + (M.y - I.y) * t;
          rw = O.w;
        } else {
          tB = drawEase(segment(e, SLIDE_A, 1));
          rx = M.x + (F.x - M.x) * tB;
          ry = M.y + (F.y - M.y) * tB;
          rw = O.w + (F.w - O.w) * tB;
        }
        const s = rw / F.w;
        const rh = rw / aspect;
        // phase A only: px of the frame still above the emergence line (it grows over it after)
        const hidden = e <= SLIDE_A ? Math.max(0, capB - ry) : 0;
        frame.style.transform = e >= 1 ? '' : `translate(${rx - F.x}px, ${ry - F.y}px) scale(${s})`;
        frame.style.clipPath = hidden > 0 ? `inset(${(hidden + 1) / s}px 0 0 0)` : '';
        // not started, or still entirely above the line: hidden outright (no sub-pixel sliver)
        frameOn = e > 0 && hidden < rh - 1;
        frame.style.opacity = frameOn ? '1' : '0';
        setComp(1 - segment(e, SLIDE_FADE[0], SLIDE_FADE[1]));
        matte.style.opacity = String(segment(e, SLIDE_FADE[0], SLIDE_FADE[1]));
        // the caption rides the frame's bottom edge, clipped to the frame's width
        if (cap && geo.cap) {
          const { x: cx0, w: cw } = geo.cap;
          const left = rx + (cx0 - F.x) * tB;
          const width = Math.min(cw, rw - (F.w - cw) * tB);
          const dy = ry + rh - (F.y + F.h);
          cap.style.transform = e >= 1 ? '' : `translate(${(left - cx0).toFixed(2)}px, ${dy.toFixed(2)}px)`;
          cap.style.clipPath = e < 1 && cw - width > 0.5 ? `inset(0 ${(cw - width).toFixed(2)}px 0 0)` : '';
          cap.style.opacity = frameOn ? '1' : '0';
        }
      } else {
        const { cx, cy, r0, r1, R } = geo.iris!;
        const oFrame = oFrameEl;
        const oCap = oCapEl;
        setComp(1 - segment(e, IRIS_FADE[0], IRIS_FADE[1]));
        // the detail swells by area while it is still the detail
        const g1 = drawEase(segment(e, IRIS_SWELL[0], IRIS_SWELL[1]));
        const rs = Math.sqrt(r0 * r0 + (r1 * r1 - r0 * r0) * g1);
        if (oFrame) oFrame.style.transform = g1 > 0 ? `scale(${(rs / r0).toFixed(4)})` : '';
        // its caption moves down with the circle's foot until the hand-over
        if (oCap) {
          oCap.style.transform = g1 > 0 ? `translateY(${(rs - r0).toFixed(2)}px)` : '';
          oCap.style.opacity = e >= IRIS_DISSOLVE[0] ? '0' : '';
        }
        // then the perspective dissolves in at that size, and opens by area to the 16:9 frame
        const g2 = drawEase(segment(e, IRIS_OPEN[0], IRIS_OPEN[1]));
        const r = e < IRIS_OPEN[0] ? rs : Math.sqrt(r1 * r1 + (R * R - r1 * r1) * g2);
        const dis = segment(e, IRIS_DISSOLVE[0], IRIS_DISSOLVE[1]);
        frame.style.transform = '';
        frame.style.clipPath = e >= 1 ? '' : `circle(${r.toFixed(2)}px at ${cx.toFixed(2)}px ${cy.toFixed(2)}px)`;
        frame.style.opacity = dis >= 1 ? '1' : dis.toFixed(3);
        frameOn = dis > 0;
        if (cap) {
          cap.style.transform = '';
          cap.style.clipPath = '';
          cap.style.opacity = e >= IRIS_DISSOLVE[0] ? '1' : '0';
        }
        matte.style.opacity = String(segment(e, IRIS_SWELL[0], IRIS_DISSOLVE[1]));
      }
      // the view's box spans the hold rect: it takes pointer events only where its frame shows (F-034)
      frame.style.pointerEvents = frameOn ? 'auto' : '';
      root.dataset.e = e.toFixed(3);
      onEntranceRef.current?.(e);
    };

    const update = () => {
      if (!geo) return;
      const p = clamp01((window.scrollY - geo.startY) / geo.pin);
      const e = clamp01(p / 0.4);
      // the perspective's film claims a decoder only once it is about to enter (the iris shows it only
      // from its dissolve, so the composition's own films keep both decoders through the landing hold)
      const wantPlay = window.scrollY > geo.startY - geo.vh * (preset === 'iris' ? 0.05 : 0.25);
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
      ref={rootRef}
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
