// Liquid indicators. A group marked data-liquid has a glass thumb that springs to the item under
// the pointer (or, with data-liquid="checked", to the checked option), stretching along the way
// like a drop of water and settling with a little wobble.
import { still } from '../fx/frame';

type Box = { x: number; y: number; w: number; h: number };

function init(group: HTMLElement) {
  const thumb = group.querySelector<HTMLElement>('[data-liquid-thumb]');
  if (!thumb) return;
  const mode = group.dataset.liquid === 'checked' ? 'checked' : 'hover';
  const items = () => [...group.querySelectorAll<HTMLElement>('[data-liquid-item]')];

  const pos = { x: 0, y: 0, w: 0, h: 0 };
  const vel = { x: 0, y: 0, w: 0, h: 0 };
  let goal: Box | null = null;
  let shown = false;
  let raf = 0;
  let last = 0;

  const boxOf = (item: HTMLElement): Box => {
    const g = group.getBoundingClientRect();
    const r = item.getBoundingClientRect();
    return { x: r.left - g.left, y: r.top - g.top, w: r.width, h: r.height };
  };

  const paint = () => {
    const speed = Math.abs(vel.x) + Math.abs(vel.y);
    const stretch = Math.min(0.28, speed / 5200);
    thumb.style.width = `${pos.w}px`;
    thumb.style.height = `${pos.h}px`;
    thumb.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${1 + stretch}, ${1 - stretch * 0.6})`;
  };

  const tick = (now: number) => {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    if (!goal) return;
    let moving = false;
    for (const k of ['x', 'y', 'w', 'h'] as const) {
      const a = (goal[k] - pos[k]) * 380 - vel[k] * 26;
      vel[k] += a * dt;
      pos[k] += vel[k] * dt;
      if (Math.abs(goal[k] - pos[k]) > 0.2 || Math.abs(vel[k]) > 2) moving = true;
    }
    paint();
    raf = moving ? requestAnimationFrame(tick) : 0;
  };

  const go = (item: HTMLElement | null) => {
    if (!item) {
      shown = false;
      thumb.classList.remove('on');
      return;
    }
    goal = boxOf(item);
    items().forEach((i) => i.classList.toggle('is-lit', i === item));
    if (!shown || still) {
      // appear in place, a touch smaller, then swell
      Object.assign(pos, still ? goal : { ...goal, x: goal.x + goal.w * 0.08, w: goal.w * 0.84, y: goal.y + goal.h * 0.08, h: goal.h * 0.84 });
      Object.assign(vel, { x: 0, y: 0, w: 0, h: 0 });
      paint();
      shown = true;
      thumb.classList.add('on');
    }
    if (!raf && !still) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    } else if (still) paint();
  };

  if (mode === 'hover') {
    group.addEventListener('pointerover', (e) => {
      if ((e as PointerEvent).pointerType !== 'mouse') return;
      go((e.target as HTMLElement).closest<HTMLElement>('[data-liquid-item]'));
    });
    group.addEventListener('pointerleave', () => {
      go(null);
      items().forEach((i) => i.classList.remove('is-lit'));
    });
    group.addEventListener('focusin', (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('[data-liquid-item]');
      if (item?.matches(':focus-visible, :has(:focus-visible)')) go(item);
    });
    group.addEventListener('focusout', () => {
      if (!group.matches(':hover')) go(null);
    });
  } else {
    const sync = () => go(items().find((i) => i.querySelector('input:checked') || i.matches(':has(input:checked)')) ?? null);
    group.addEventListener('change', sync);
    addEventListener('resize', () => {
      if (goal) sync();
    });
    // forms can be restored by the browser after load
    requestAnimationFrame(sync);
    addEventListener('pageshow', sync);
  }
}

export function liquid(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-liquid]').forEach((g) => {
    if (g.dataset.liquidReady) return;
    g.dataset.liquidReady = '1';
    init(g);
  });
}
