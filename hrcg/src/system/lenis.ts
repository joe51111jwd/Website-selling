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

function scrollPaddingTop(): number {
  const v = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  return Number.isFinite(v) ? v : 0;
}

function resolve(target: string | HTMLElement): HTMLElement | null {
  if (typeof target !== 'string') return target;
  const id = target.startsWith('#') ? target.slice(1) : target;
  return document.getElementById(id) ?? document.querySelector<HTMLElement>(target.startsWith('#') ? target : `#${id}`);
}

/** Focus the target sheet's H2 (tabindex -1), else the target itself. */
function focusTarget(el: HTMLElement) {
  const focusEl =
    (el.matches('h2') ? el : el.querySelector<HTMLElement>('h2')) ?? el;
  if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
  focusEl.focus({ preventScroll: true });
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
 * otherwise. Lands under the fixed header (scroll-padding-top), then focuses the target's H2.
 * `target` is '#a-300', 'a-300' or an element.
 */
export function lenisScrollTo(target: string | HTMLElement, opts: ScrollToOptions = {}): void {
  if (!isBrowser) return;
  const el = resolve(target);
  if (!el) return;
  const offset = -scrollPaddingTop() + (opts.offset ?? 0);
  const land = () => {
    if (opts.focus !== false) focusTarget(el);
    if (opts.announce) {
      const sheetEl = el.closest<HTMLElement>('[data-sheet]') ?? el;
      const sheet = sheetById(sheetEl.dataset.sheet ?? '');
      if (sheet) announce(sheet.announce);
    }
    opts.onComplete?.();
  };
  if (lenis && !opts.immediate && prefsStore.get().motion) {
    lenis.scrollTo(el, { offset, duration: 1.2, easing: settleEase, onComplete: land, force: true });
    return;
  }
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
  else window.scrollTo({ top, behavior: 'auto' });
  land();
}
