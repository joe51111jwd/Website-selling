// As the next card slides over, the one beneath sinks back: a touch smaller and darker.
import { clamp, onScroll, still } from './frame';

export function initStack() {
  if (still) return;
  document.querySelectorAll<HTMLElement>('[data-stack]').forEach((stack) => {
    const cards = [...stack.querySelectorAll<HTMLElement>('.stack-card')];
    onScroll(() => {
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const a = card.getBoundingClientRect().top;
        const b = next.getBoundingClientRect().top;
        // 0 while the next card is a screen away, 1 once it has landed on top
        const cover = clamp(1 - (b - a) / innerHeight);
        card.style.setProperty('--sink-scale', String(1 - cover * 0.06));
        card.style.setProperty('--sink-light', String(1 - cover * 0.18));
        card.style.setProperty('--cover', cover.toFixed(3));
      });
    });
  });
}
