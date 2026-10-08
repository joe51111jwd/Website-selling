// SECTION A–A (brief 3.8, 4.2): one frame of c34 cut by a depth plane. Owner: A4.
// In front of the plane the frame is drawn as depth contours; behind it is film; where the plane meets
// the scene a 2 px chalk-blue line crawls over 07 and the floor. The plane's position comes from the
// A-105 cut marker (the slider lives on PLAN 05; this component only draws).
//
// Tiers
// - WebGL2: one fullscreen quad in a small raw-three canvas (sliceMaterial.ts, dynamic import, shares the
//   hero's three chunk). Mounted within 1.5 viewports, disposed beyond 3. On context loss: the stills.
// - No GL (?gl=0, no WebGL2, chunk late or failed): three precomputed stills (sec-near / sec-mid /
//   sec-far) stepped by the slider with a 120 ms crossfade.
// - No JS: the middle still.
// Never re-renders per frame: set(s) writes to the canvas or to one data attribute.

import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { ViewTitle } from '../chrome/ViewTitle';
import { Picture } from '../system/Picture';
import { useTier } from '../system/tier';
import { media, hasMedia, loadJson } from '../media/manifest';
import { A105 } from '../content/copy/a104-a200';
import { frames } from './a4/util';
import type { SliceRenderer } from './sliceMaterial';
import './a4/a4.css';

export interface SectionSliceHandle {
  /** s: 0 = camera end, 1 = robot end */
  set(s: number): void;
  get(): number;
  /** Resolves when the current value is on screen (GL frame rendered, or still switched). */
  settled(): Promise<void>;
  /** true while the GL path draws */
  isGL(): boolean;
  /** mount GL now if it can (capture), resolves true when the first frame is drawn */
  ensureGL(timeoutMs?: number): Promise<boolean>;
}

const STEPS = [
  { id: 'sec-near', key: 'near' },
  { id: 'sec-mid', key: 'mid' },
  { id: 'sec-far', key: 'far' },
] as const;

/** Defaults measured on the mock depth map (A4-3 asks A5 for the real values in sec-c34-meta). */
const DEFAULT_RANGE = { nearD: 0.9, farD: 0.17 };

function stepFor(s: number): 'near' | 'mid' | 'far' {
  return s < 1 / 3 ? 'near' : s < 2 / 3 ? 'mid' : 'far';
}

function jpegOf(id: string): string | undefined {
  const src = media[id]?.sources ?? [];
  return (src.find((x) => /jpe?g|png/i.test(x.type)) ?? src[src.length - 1])?.src;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`section: ${url}`));
    img.src = url;
  });
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((res, rej) => {
    const t = window.setTimeout(() => rej(new Error('timeout')), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        res(v);
      },
      (e) => {
        window.clearTimeout(t);
        rej(e);
      },
    );
  });
}

export interface SectionSliceProps {
  handle?: Ref<SectionSliceHandle>;
  /** start value (also the no-JS still: 0.5 → sec-mid) */
  initial?: number;
  className?: string;
}

export function SectionSlice({ handle, initial = 0.5, className }: SectionSliceProps) {
  const { gl } = useTier();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const value = useRef(initial);
  const r = useRef<SliceRenderer | null>(null);
  const raf = useRef(0);
  const mounting = useRef<Promise<boolean> | null>(null);
  const range = useRef(DEFAULT_RANGE);
  const failed = useRef(false);

  const paint = useCallback(() => {
    raf.current = 0;
    const root = rootRef.current;
    if (!root) return;
    const s = value.current;
    const step = stepFor(s);
    root.dataset.step = step;
    if (r.current) r.current.render(s);
    // no-GL: the label follows the still on screen (each still has its own alt in the manifest)
    root.setAttribute('aria-label', r.current ? A105.sectionLabel : (media[`sec-${step}`]?.alt ?? A105.sectionLabel));
  }, []);

  const schedule = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(paint);
  }, [paint]);

  const disposeGL = useCallback(() => {
    r.current?.dispose();
    r.current = null;
    mounting.current = null;
    const root = rootRef.current;
    if (root) {
      root.removeAttribute('data-gl');
      root.setAttribute('aria-label', media[`sec-${stepFor(value.current)}`]?.alt ?? A105.sectionLabel);
    }
  }, []);

  const mountGL = useCallback((): Promise<boolean> => {
    if (r.current) return Promise.resolve(true);
    if (mounting.current) return mounting.current;
    if (!gl || failed.current) return Promise.resolve(false);
    const canvas = canvasRef.current;
    const stillUrl = jpegOf('sec-c34-color');
    const depthUrl = media['sec-c34-depth']?.sources?.[0]?.src;
    if (!canvas || !stillUrl || !depthUrl) return Promise.resolve(false);
    mounting.current = (async () => {
      try {
        if (hasMedia('sec-c34-meta')) {
          try {
            const m = await loadJson<{ nearD?: number; farD?: number }>('sec-c34-meta');
            if (typeof m.nearD === 'number' && typeof m.farD === 'number') range.current = { nearD: m.nearD, farD: m.farD };
          } catch {
            /* defaults */
          }
        }
        const [mod, still, depth] = await withTimeout(
          Promise.all([import('./sliceMaterial'), loadImage(stillUrl), loadImage(depthUrl)]),
          8000,
        );
        if (!canvasRef.current) return false;
        const renderer = mod.createSliceRenderer(canvas, { still, depth, ...range.current });
        r.current = renderer;
        const box = rootRef.current!.getBoundingClientRect();
        renderer.resize(Math.max(1, Math.round(box.width)), Math.max(1, Math.round(box.height)), Math.min(1.75, Math.max(1, window.devicePixelRatio || 1)));
        renderer.render(value.current);
        rootRef.current?.setAttribute('data-gl', '');
        rootRef.current?.setAttribute('aria-label', A105.sectionLabel);
        return true;
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[A-105] section GL unavailable, using the stills:', e);
        failed.current = true;
        mounting.current = null;
        return false;
      }
    })();
    return mounting.current;
  }, [gl]);

  // mount within 1.5 viewports, dispose beyond 3
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !gl || typeof IntersectionObserver === 'undefined') return;
    const near = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && void mountGL(), {
      rootMargin: '150% 0px 150% 0px',
    });
    const far = new IntersectionObserver((es) => es.some((e) => !e.isIntersecting) && disposeGL(), {
      rootMargin: '300% 0px 300% 0px',
    });
    near.observe(root);
    far.observe(root);
    return () => {
      near.disconnect();
      far.disconnect();
      disposeGL();
    };
  }, [gl, mountGL, disposeGL]);

  // size and context loss
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const onLost = (e: Event) => {
      e.preventDefault();
      failed.current = true; // brief: no retry
      disposeGL();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        const b = root.getBoundingClientRect();
        if (r.current && b.width) {
          r.current.resize(Math.round(b.width), Math.round(b.height), Math.min(1.75, Math.max(1, window.devicePixelRatio || 1)));
          r.current.render(value.current);
        }
      });
      ro.observe(root);
    }
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost);
      ro?.disconnect();
    };
  }, [disposeGL]);

  useImperativeHandle(
    handle,
    () => ({
      set(s: number) {
        const v = Math.min(1, Math.max(0, s));
        if (v === value.current) return;
        value.current = v;
        schedule();
      },
      get: () => value.current,
      async settled() {
        if (raf.current) {
          cancelAnimationFrame(raf.current);
          paint();
        }
        await frames(2);
      },
      isGL: () => !!r.current,
      async ensureGL(timeoutMs = 10000) {
        try {
          return await withTimeout(mountGL(), timeoutMs);
        } catch {
          return false;
        }
      },
    }),
    [schedule, paint, mountGL],
  );

  return (
    <ViewTitle id="a105-section" className={`a105-section ${className ?? ''}`}>
      <div
        className="slice"
        ref={rootRef}
        role="img"
        aria-label={media[`sec-${stepFor(initial)}`]?.alt ?? A105.sectionLabel}
        data-step={stepFor(initial)}
        data-capture-crop="slice"
      >
        {STEPS.map((st) => (
          <Picture key={st.id} id={st.id} decorative className={`slice-still slice-still--${st.key}`} />
        ))}
        <canvas ref={canvasRef} className="slice-canvas" aria-hidden="true" />
      </div>
    </ViewTitle>
  );
}

export default SectionSlice;
