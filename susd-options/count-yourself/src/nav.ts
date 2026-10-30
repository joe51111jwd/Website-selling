import { prefersReducedMotion } from './hooks/useReducedMotion';

/** Every "Get the Bootloader" and "The book" link scrolls to #paths (instant under reduced motion). */
export function goPaths(e?: { preventDefault(): void }) {
  e?.preventDefault();
  scrollToId('paths');
}

/**
 * Smooth-scrolls to a section and moves focus to its heading. If anything above the target changed
 * height while the scroll ran, it re-aims once the scroll has ended.
 */
export function scrollToId(id: string, focusId?: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const smooth = !prefersReducedMotion();
  el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  if (smooth) {
    const reaim = () => {
      const top = el.getBoundingClientRect().top + (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (Math.abs(top) > 2 && !atBottom) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    };
    const hasScrollEnd = typeof (window as { onscrollend?: unknown }).onscrollend !== 'undefined';
    if (hasScrollEnd) window.addEventListener('scrollend', reaim, { once: true });
    else window.setTimeout(reaim, 1000);
  }
  const f = document.getElementById(focusId ?? `${id}-h`);
  f?.focus({ preventScroll: true });
}

/** Moves focus to the email field (and scrolls it into view) from the book card. */
export function focusEmail(e?: { preventDefault(): void }) {
  e?.preventDefault();
  const input = document.getElementById('email') as HTMLInputElement | null;
  if (!input) return;
  input.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  input.focus({ preventScroll: true });
}
