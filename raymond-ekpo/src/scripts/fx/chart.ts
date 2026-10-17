// The pinned process chart: scrolling grows each bar in turn, counts readiness up to 100
// and draws the trend line across the tops.
import { clamp, ease, onScroll, pinProgress, still } from './frame';

export function initChart() {
  if (still) return;
  document.querySelectorAll<HTMLElement>('[data-chart]').forEach((root) => {
    const bars = [...root.querySelectorAll<HTMLElement>('.step')];
    const dots = [...root.querySelectorAll<HTMLElement>('.trend-dot')];
    const trend = root.querySelector<SVGElement>('.trend');
    const count = root.querySelector<HTMLElement>('[data-count]');
    const n = bars.length;
    onScroll(() => {
      if (!matchMedia('(min-width: 900px)').matches) {
        bars.forEach((b) => b.style.setProperty('--g', '1'));
        return;
      }
      const p = pinProgress(root);
      bars.forEach((b, i) => b.style.setProperty('--g', String(ease(clamp(p * (n + 0.6) - i * 1.05)))));
      dots.forEach((d, i) => d.classList.toggle('on', p * (n + 0.6) - i * 1.05 > 0.95));
      if (trend) trend.style.clipPath = `inset(0 ${100 - clamp((p - 0.12) / 0.8) * 100}% 0 0)`;
      if (count) count.textContent = String(Math.round(clamp(p / 0.92) * 100));
    });
  });
}
