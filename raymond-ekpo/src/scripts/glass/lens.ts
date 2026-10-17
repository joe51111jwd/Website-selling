// "Under the lens": a pinned section where a glass lens sweeps a founder's slide line by line,
// magnifying each line and leaving it rewritten. Scroll drives the lens; the renderer draws the
// slide and the glass from the shared lens state.
import { onScroll, pinProgress, clamp, still } from '../fx/frame';
import { lens } from './state';
import { BANDS, ROWS, drawSlides } from './slide';

const smooth = (t: number) => t * t * (3 - 2 * t);

export async function lensStory() {
  const root = document.querySelector<HTMLElement>('[data-lens]');
  if (!root) return;
  const slideEl = root.querySelector<HTMLElement>('[data-lens-slide]')!;
  const steps = [...root.querySelectorAll<HTMLElement>('[data-lens-step]')];
  const fallback = slideEl.querySelector('canvas');

  const { before, after } = await drawSlides();
  lens.slide = slideEl;
  lens.before = before;
  lens.after = after;
  lens.bands = BANDS;
  lens.version++;
  // without WebGL the page shows the rewritten slide as a plain picture
  if (fallback) {
    fallback.width = after.width;
    fallback.height = after.height;
    fallback.getContext('2d')!.drawImage(after, 0, 0);
  }

  // where the lens should be for a given progress, in slide uv, and how far each line is rewritten
  const START = 0.06;
  const END = 0.92;
  const span = (END - START) / BANDS.length;
  const plan = (p: number) => {
    const wipe = [0, 0, 0, 0];
    let u = BANDS[0][0];
    let v = ROWS[0];
    let active = -1;
    BANDS.forEach((b, i) => {
      const a = START + i * span;
      const t = clamp((p - a) / span);
      const cy = ROWS[i];
      // the first part of each segment glides over from the last line, the rest sweeps across
      const glide = i === 0 ? 0 : 0.22;
      const sweep = clamp((t - glide) / (1 - glide));
      wipe[i] = p >= a + span ? 1.2 : b[0] + smooth(sweep) * (b[2] - b[0]);
      if (t <= 0) return;
      active = i;
      if (t < glide) {
        const prev = BANDS[i - 1];
        const g = smooth(t / glide);
        u = prev[2] + (b[0] - prev[2]) * g;
        v = ROWS[i - 1] + (cy - ROWS[i - 1]) * g;
      } else {
        u = b[0] + smooth(sweep) * (b[2] - b[0]);
        v = cy;
      }
    });
    // after the last line the lens settles in the corner, out of the way
    const out = smooth(clamp((p - END) / (1 - END)));
    u += (0.9 - u) * out;
    v += (0.93 - v) * out;
    const on = smooth(clamp(p / START)) * (1 - 0.35 * out);
    return { u, v, wipe, active, on, out };
  };

  let target = plan(0);
  const pos = { u: target.u, v: target.v, vu: 0, vv: 0 };
  let near = false;

  onScroll(() => {
    const r = root.getBoundingClientRect();
    near = r.bottom > -200 && r.top < innerHeight + 200;
    if (!near) return;
    target = plan(pinProgress(root));
    lens.wipe = target.wipe;
    steps.forEach((s, i) => {
      s.classList.toggle('is-active', i === target.active);
      s.classList.toggle('is-done', i < target.active || (i === target.active && target.out > 0));
    });
    root.classList.toggle('is-rewritten', target.out > 0.5);
  });

  let last = performance.now();
  const tick = (now: number) => {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (!near) {
      lens.on = 0;
      return;
    }
    if (still) {
      pos.u = target.u;
      pos.v = target.v;
    } else {
      // a soft spring, so the glass lags a touch behind the scroll like something with weight
      const k = 220;
      const d = 2 * Math.sqrt(k);
      pos.vu += ((target.u - pos.u) * k - pos.vu * d) * dt;
      pos.vv += ((target.v - pos.v) * k - pos.vv * d) * dt;
      pos.u += pos.vu * dt;
      pos.v += pos.vv * dt;
    }
    const r = slideEl.getBoundingClientRect();
    lens.r = r.width * 0.105;
    lens.x = r.left + pos.u * r.width;
    lens.y = r.top + pos.v * r.height;
    lens.on = target.on;
  };
  requestAnimationFrame(tick);
}
