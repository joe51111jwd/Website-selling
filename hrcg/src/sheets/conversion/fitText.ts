// Fit one line of stencil text to a slot width with canvas measureText (brief 3.10). Owner: A6.
// The first render uses a conservative estimate (state-agnostic, so the prerender matches); after
// hydration, once the face has loaded (document.fonts.load), the real advance width replaces it.

import { useEffect, useState } from 'react';

/** Big Shoulders Stencil 800, the A-300 slot face (brief 5.2) */
export const STENCIL_FONT_FAMILY = '"Big Shoulders Stencil"';
export const STENCIL_WEIGHT = 800;
/** Letter-spacing of the stencil role (+0.02em), included in the measured width */
export const STENCIL_TRACKING = 0.02;

/** Upper-case, at most 24 characters (brief 3.10) */
export const SLOT_MAX_CHARS = 24;

export function slotText(platform: string, fallback: string): string {
  const t = platform.replace(/\s+/g, ' ').trim();
  return (t ? t : fallback).toUpperCase().slice(0, SLOT_MAX_CHARS).trim();
}

/** Width of `text` in em at weight 800, before the font has loaded: deliberately generous. */
export function estimateEm(text: string): number {
  let em = 0;
  for (const ch of text) {
    if (ch === ' ') em += 0.2;
    else if (/[MW]/.test(ch)) em += 0.62;
    else if (/[IJ1.,:;'’!|]/.test(ch)) em += 0.24;
    else em += 0.47;
  }
  return em + text.length * STENCIL_TRACKING;
}

let canvas: HTMLCanvasElement | null = null;
const cache = new Map<string, number>();

/** Width of `text` in em, measured (null when it cannot be measured yet). */
export function measureEm(text: string): number | null {
  if (typeof document === 'undefined') return null;
  const key = text;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  try {
    canvas ??= document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.font = `${STENCIL_WEIGHT} 100px ${STENCIL_FONT_FAMILY}`;
    const w = ctx.measureText(text).width / 100;
    const em = w + Math.max(0, [...text].length - 1) * STENCIL_TRACKING;
    if (em > 0) cache.set(key, em);
    return em > 0 ? em : null;
  } catch {
    return null;
  }
}

let fontsReady: Promise<void> | null = null;
function loadStencil(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return Promise.resolve();
  fontsReady ??= document.fonts
    .load(`${STENCIL_WEIGHT} 100px ${STENCIL_FONT_FAMILY}`, 'YOUR ROBOT 0123456789')
    .then(() => {
      cache.clear();
    })
    .catch(() => {});
  return fontsReady;
}

/**
 * Font size (in the caller's units) that fits `text` into `slotWidth`, capped at `maxSize`.
 * Re-measures after the stencil face loads.
 */
export function useFitSize(text: string, slotWidth: number, maxSize: number): number {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    void loadStencil().then(() => {
      if (alive) setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  const em = (loaded ? measureEm(text) : null) ?? estimateEm(text);
  if (!(slotWidth > 0) || !(em > 0)) return maxSize;
  return Math.min(maxSize, slotWidth / em);
}
