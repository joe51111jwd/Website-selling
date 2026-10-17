// The floating chrome: the tab bar tucks itself smaller while you read down the page and opens
// again when you scroll back up, as iOS tab bars do. Glass that can bend what's behind it does.
// Over a light surface (data-surface="light"), the glass thickens so its labels stay readable.
import { still } from '../fx/frame';
import { lensGlass } from './lensfilter';

export function tabs() {
  const bar = document.querySelector<HTMLElement>('[data-tabbar]');
  const top = document.querySelector<HTMLElement>('[data-topbar]');
  lensGlass();
  if (!bar) return;

  let lastY = scrollY;
  let ticking = false;
  const chrome = [bar, ...document.querySelectorAll<HTMLElement>('[data-topbar] .l-mark')];
  const light = [...document.querySelectorAll<HTMLElement>('[data-surface="light"]')];
  const over = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const update = () => {
    ticking = false;
    const y = scrollY;
    if (light.length) {
      const rects = light.map((el) => el.getBoundingClientRect());
      for (const el of chrome) {
        const r = el.getBoundingClientRect();
        el.classList.toggle('is-on-light', rects.some((l) => over(r, l)));
      }
    }
    const down = y > lastY + 4;
    const up = y < lastY - 4;
    if (!still) {
      if (down && y > 240) bar.classList.add('is-compact');
      else if (up || y < 120) bar.classList.remove('is-compact');
    }
    top?.classList.toggle('is-scrolled', y > 40);
    if (down || up) lastY = y;
  };
  addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}
