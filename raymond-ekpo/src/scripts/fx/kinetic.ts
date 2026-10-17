// Lines that drift sideways as they pass through the screen, in opposite directions.
import { onScroll, passProgress, still } from './frame';

export function initKinetic() {
  if (still) return;
  const lines = [...document.querySelectorAll<HTMLElement>('[data-drift]')];
  if (!lines.length) return;
  onScroll(() => {
    for (const el of lines) {
      const p = passProgress(el.parentElement ?? el);
      const dir = Number(el.dataset.drift);
      const reach = innerWidth < 700 ? 6 : 22;
      el.style.transform = `translate3d(${(p - 0.5) * dir * reach}vw, 0, 0)`;
    }
  });
}
