// The one Lenis instance (brief 6, 8.3). Owner: A1.
// { lerp: 0.09, smoothWheel: true, syncTouch: false }. Off under reduced motion / MOTION OFF and in
// ?capture; stopped while any overlay is open (lockScroll). Loaded by dynamic import on the client
// only, so the prerender never touches it.

import type Lenis from 'lenis';
import { isBrowser } from './store';
import { prefsStore } from './prefs';
import { settleEase } from './easing';
import { announce } from './announce';
import { sheetById } from '../content/sheets';

let lenis: Lenis | null = null;
let loading: Promise<void> | null = null;
let engineStarted = false;
const locks = new Set<string>();

function isCaptureMode(): boolean {
  return isBrowser && document.documentElement.classList.contains('capture');
}

async function create() {
  if (lenis || loading) return loading ?? undefined;
  loading = (async () => {
    const mod = await import('lenis');
    if (!prefsStore.get().motion || isCaptureMode()) return;
    const L = mod.default;
    lenis = new L({ lerp: 0.09, smoothWheel: true, syncTouch: false, autoRaf: true });
    if (locks.size) lenis.stop();
  })().finally(() => {
    loading = null;
  });
  return loading;
}

function destroy() {
  if (!lenis) return;
  lenis.destroy();
  lenis = null;
}

/** Start the scroll engine (the app shell calls this once after hydration). */
export function initScrollEngine(): () => void {
  if (!isBrowser || engineStarted) return () => {};
  engineStarted = true;
  const sync = () => {
    if (prefsStore.get().motion && !isCaptureMode()) void create();
    else destroy();
  };
  sync();
  const unsub = prefsStore.subscribe(sync);
  return () => {
    unsub();
    destroy();
    engineStarted = false;
  };
}

/** The live Lenis instance, or null (reduced motion, MOTION OFF, capture, not loaded yet). */
export function getLenis(): Lenis | null {
  return lenis;
}

/** Stop smooth scroll while an overlay is open. Pair with unlockScroll(key). */
export function lockScroll(key: string) {
  locks.add(key);
  lenis?.stop();
}

export function unlockScroll(key: string) {
  locks.delete(key);
  if (!locks.size) lenis?.start();
}

function scrollPadding(): { top: number; bottom: number } {
  const cs = getComputedStyle(document.documentElement);
  const top = parseFloat(cs.scrollPaddingTop);
  const bottom = parseFloat(cs.scrollPaddingBottom);
  return { top: Number.isFinite(top) ? top : 0, bottom: Number.isFinite(bottom) ? bottom : 0 };
}

function resolve(target: string | HTMLElement): HTMLElement | null {
  if (typeof target !== 'string') return target;
  const id = target.startsWith('#') ? target.slice(1) : target;
  return document.getElementById(id) ?? document.querySelector<HTMLElement>(target.startsWith('#') ? target : `#${id}`);
}

/** The element a landing focuses: the target's H2 (tabindex -1), else the target itself. */
function focusElement(el: HTMLElement): HTMLElement {
  return (el.matches('h2') ? el : el.querySelector<HTMLElement>('h2')) ?? el;
}

function focusTarget(el: HTMLElement) {
  const focusEl = focusElement(el);
  if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
  focusEl.focus({ preventScroll: true });
}

/**
 * The unobscured band between the fixed chrome, in viewport px (FIXLIST F-015): from
 * scroll-padding-top (border + header + 16) down to innerHeight − scroll-padding-bottom
 * (strip or phone bar + border + safe area).
 */
export function unobscuredBand(): { top: number; bottom: number } {
  const pad = scrollPadding();
  return { top: pad.top, bottom: window.innerHeight - pad.bottom };
}

/** A sheet's `data-land` (vh from the sheet top), or null. Only on the [data-sheet] element itself. */
function landVh(el: HTMLElement): number | null {
  if (!el.hasAttribute('data-sheet')) return null;
  const raw = el.dataset.land;
  if (raw == null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * The scroll position a jump to `target` lands on (FIXLIST F-015):
 * - a [data-sheet] with `data-land="N"` (pinned stages): sheet top + N vh, exactly (the owner composed
 *   that frame; the H2 check is skipped);
 * - anything else: its top at scroll-padding-top (+ its own scroll-margin-top).
 */
export function landingTop(target: string | HTMLElement, offset = 0): number | null {
  if (!isBrowser) return null;
  const el = resolve(target);
  if (!el) return null;
  const docTop = el.getBoundingClientRect().top + window.scrollY;
  const vh = landVh(el);
  if (vh !== null) return Math.max(0, docTop + (vh * window.innerHeight) / 100 + offset);
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return Math.max(0, docTop - scrollPadding().top - margin + offset);
}

function jumpTo(top: number) {
  if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
  else window.scrollTo({ top, behavior: 'auto' });
}

/**
 * After a landing: if the H2 that will take focus is not fully inside the unobscured band, jump so
 * its top sits at scroll-padding-top (WCAG 2.4.11). One correction, no loop.
 */
function revealFocusTarget(el: HTMLElement) {
  if (landVh(el) !== null) return;
  const f = focusElement(el);
  const band = unobscuredBand();
  const r = f.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return; // not rendered
  const inside = r.top >= band.top - 1 && r.bottom <= band.bottom + 1;
  if (inside || Math.abs(r.top - band.top) <= 1) return;
  jumpTo(Math.max(0, r.top + window.scrollY - band.top));
}

export interface ScrollToOptions {
  /** Announce "Sheet A-103, Bolted assembly." on landing (INDEX rows and strip CTAs only). */
  announce?: boolean;
  /** Focus the target sheet's H2 on landing (default true). */
  focus?: boolean;
  /** Extra px offset added to the scroll-padding offset. */
  offset?: number;
  /** Jump without animating. */
  immediate?: boolean;
  onComplete?: () => void;
}

/**
 * Scroll to a sheet or element: Lenis (duration 1.2 s, SETTLE) when motion is on, a native jump
 * otherwise. Lands at landingTop() (the sheet's data-land, else under the fixed header), then, two
 * frames later (stages have applied the new scroll), makes sure the H2 is fully inside the unobscured
 * band and focuses it (FIXLIST F-015). `target` is '#a-300', 'a-300' or an element.
 */
export function lenisScrollTo(target: string | HTMLElement, opts: ScrollToOptions = {}): void {
  if (!isBrowser) return;
  const el = resolve(target);
  if (!el) return;
  const top = landingTop(el, opts.offset ?? 0);
  if (top === null) return;
  const land = () => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (opts.focus !== false) {
          revealFocusTarget(el);
          focusTarget(el);
        }
        if (opts.announce) {
          const sheetEl = el.closest<HTMLElement>('[data-sheet]') ?? el;
          const sheet = sheetById(sheetEl.dataset.sheet ?? '');
          if (sheet) announce(sheet.announce);
        }
        opts.onComplete?.();
      }),
    );
  };
  if (lenis && !opts.immediate && prefsStore.get().motion) {
    lenis.scrollTo(top, { duration: 1.2, easing: settleEase, onComplete: land, force: true });
    return;
  }
  jumpTo(top);
  land();
}
