// Liquid indicators. A group marked data-seg has a glass thumb (data-seg-thumb) that springs to an
// item (data-seg-item), stretching as it moves and settling with a small wobble, the way the
// selection in an iOS tab bar or segmented control moves.
//   data-seg="checked"  rests on the item holding the checked radio
//   data-seg="current"  rests on the item marked aria-current or aria-selected, and follows the
//                       pointer while it hovers
//   data-seg="hover"    shows only while the pointer hovers
import { still } from '../fx/frame';

type Box = { x: number; y: number; w: number; h: number };

function init(group: HTMLElement) {
  const thumb = group.querySelector<HTMLElement>('[data-seg-thumb]');
  if (!thumb) return;
  const mode = group.dataset.seg || 'checked';
  const items = () => [...group.querySelectorAll<HTMLElement>('[data-seg-item]')];

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
    const stretch = Math.min(0.3, speed / 4200);
    thumb.style.width = `${pos.w}px`;
    thumb.style.height = `${pos.h}px`;
    thumb.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${1 + stretch}, ${1 - stretch * 0.55})`;
    group.style.setProperty('--seg-speed', stretch.toFixed(3));
  };

  const tick = (now: number) => {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    if (!goal) return;
    let moving = false;
    for (const k of ['x', 'y', 'w', 'h'] as const) {
      vel[k] += ((goal[k] - pos[k]) * 420 - vel[k] * 27) * dt;
      pos[k] += vel[k] * dt;
      if (Math.abs(goal[k] - pos[k]) > 0.2 || Math.abs(vel[k]) > 2) moving = true;
    }
    paint();
    raf = moving ? requestAnimationFrame(tick) : 0;
  };

  const go = (item: HTMLElement | null) => {
    items().forEach((i) => i.classList.toggle('is-lit', i === item));
    if (!item) {
      shown = false;
      thumb.classList.remove('on');
      return;
    }
    goal = boxOf(item);
    if (!shown || still) {
      Object.assign(pos, still ? goal : { x: goal.x + goal.w * 0.1, y: goal.y + goal.h * 0.1, w: goal.w * 0.8, h: goal.h * 0.8 });
      Object.assign(vel, { x: 0, y: 0, w: 0, h: 0 });
      paint();
      shown = true;
      thumb.classList.add('on');
    }
    if (still) paint();
    else if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };

  const rest = () =>
    items().find((i) =>
      mode === 'checked'
        ? !!i.querySelector('input:checked')
        : i.getAttribute('aria-current') === 'page' || i.getAttribute('aria-selected') === 'true' || i.classList.contains('is-current'),
    ) ?? null;

  if (mode !== 'checked') {
    group.addEventListener('pointerover', (e) => {
      if ((e as PointerEvent).pointerType !== 'mouse') return;
      const item = (e.target as HTMLElement).closest<HTMLElement>('[data-seg-item]');
      if (item) go(item);
    });
    group.addEventListener('pointerleave', () => go(mode === 'hover' ? null : rest()));
    group.addEventListener('focusin', (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('[data-seg-item]');
      if (item?.matches(':focus-visible, :has(:focus-visible)')) go(item);
    });
    group.addEventListener('focusout', () => {
      if (!group.matches(':hover')) go(mode === 'hover' ? null : rest());
    });
  }
  const sync = () => go(rest());
  group.addEventListener('change', sync);
  group.addEventListener('seg:sync', sync);
  addEventListener('resize', () => goal && sync());
  // the group changes size (a tab bar tucking itself away): keep the thumb on its item
  new ResizeObserver(() => goal && sync()).observe(group);
  addEventListener('pageshow', sync);
  requestAnimationFrame(sync);
  document.fonts?.ready.then(sync);
}

export function segments(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-seg]').forEach((g) => {
    if (g.dataset.segReady) return;
    g.dataset.segReady = '1';
    init(g);
  });
}
