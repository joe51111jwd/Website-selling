import type { MouseEvent } from 'react';
import { isCompact, isReduced } from './hooks/media';
import { tick } from './motion/ticker';

// Every "Get the Bootloader" link scrolls to the finale and runs the strike's fast path, so the
// file is always one click away (the opt-in is never gated by the hold). Every "The book" link
// does the same and then lands on the book, not the email field.
type StrikeFn = (opts: { fast: boolean; focus: boolean }) => Promise<void> | void;
let strikeHandler: StrikeFn | null = null;

export function registerStrike(fn: StrikeFn) {
  strikeHandler = fn;
  return () => {
    if (strikeHandler === fn) strikeHandler = null;
  };
}

function targetTop(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const top = window.scrollY + r.top;
  // Centre the finale when it fits the screen, otherwise align its top.
  return r.height < vh ? top - (vh - r.height) / 2 : top - 8;
}

/** Smooth-scrolls to y (instant under reduced motion); resolves when the scroll has settled. */
function scrollToY(y: number) {
  return new Promise<void>((resolve) => {
    if (isReduced()) {
      window.scrollTo({ top: y, behavior: 'auto' });
      resolve();
      return;
    }
    window.scrollTo({ top: y, behavior: 'smooth' });
    const t0 = performance.now();
    let lastY = window.scrollY;
    let still = 0;
    tick((now) => {
      const sy = window.scrollY;
      still = Math.abs(sy - lastY) < 0.5 ? still + 1 : 0;
      lastY = sy;
      if (Math.abs(sy - y) < 3 || still > 6 || now - t0 > 1800) {
        resolve();
        return false;
      }
      return true;
    });
  });
}

async function arrive(focus: boolean) {
  const el = document.getElementById('paths');
  if (!el) return;
  document.documentElement.classList.add('no-snap');
  await scrollToY(Math.max(0, targetTop(el)));
  await strikeHandler?.({ fast: true, focus });
  setTimeout(() => document.documentElement.classList.remove('no-snap'), 120);
}

export function goToFile(e?: MouseEvent) {
  e?.preventDefault();
  void arrive(true);
}

export function goToBook(e?: MouseEvent) {
  e?.preventDefault();
  void (async () => {
    await arrive(false);
    const book = document.getElementById('book');
    const btn = book?.querySelector<HTMLElement>('.btn');
    if (!book) return;
    // On phone the book sits under the file: bring it into view.
    if (isCompact()) {
      const r = book.getBoundingClientRect();
      await scrollToY(Math.max(0, window.scrollY + r.top - Math.max(16, (window.innerHeight - r.height) / 2)));
    }
    btn?.focus({ preventScroll: true });
  })();
}
