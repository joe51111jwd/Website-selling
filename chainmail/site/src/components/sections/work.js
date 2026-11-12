// The work: full-bleed horizontal rail. Native scroll (touch, trackpad, keyboard) + mouse drag with inertia.
import { WORK } from '../../data/content.js';
import { photo, esc } from '../media.js';
import { gsap, reduced } from '../motion.js';

export function initWork() {
  const rail = document.querySelector('[data-rail]');
  if (!rail) return;
  const vp = rail.querySelector('[data-rail-viewport]');
  const track = rail.querySelector('[data-rail-track]');
  const bar = rail.querySelector('[data-rail-bar]');
  const idx = rail.querySelector('[data-rail-i]');

  track.innerHTML = WORK.map((w, i) => `<li class="card" data-card>
    <figure class="card__fig">
      <div class="card__imgs">
        ${w.photos.map((p, k) => photo(`/work/${p}`, { alt: k === 0 ? `${w.title}: ${w.desc}` : '', cls: `card__img${k === 0 ? ' is-on' : ''}`, w: p.endsWith('.jpg') ? 1400 : 1080, h: p.endsWith('.jpg') ? 1400 : 1080 })).join('')}
        <span class="card__dots" aria-hidden="true">${w.photos.map((_, k) => `<i class="${k === 0 ? 'is-on' : ''}"></i>`).join('')}</span>
      </div>
      <figcaption class="card__cap">
        <span class="card__n mono">${String(i + 1).padStart(2, '0')}</span>
        <span class="card__title">${esc(w.title)}</span>
        <span class="card__tag mono">${esc(w.tag)}</span>
        <span class="card__desc">${esc(w.desc)}</span>
      </figcaption>
    </figure>
  </li>`).join('');

  const cards = [...track.children];

  // cycle photos on hover (fine pointers) — and on focus within
  cards.forEach((card) => {
    const imgs = [...card.querySelectorAll('.card__img')];
    const dots = [...card.querySelectorAll('.card__dots i')];
    let t = null, k = 0;
    const go = (n) => { k = n; imgs.forEach((im, j) => im.classList.toggle('is-on', j === k)); dots.forEach((d, j) => d.classList.toggle('is-on', j === k)); };
    card.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse' || reduced) return; go(1); t = setInterval(() => go((k + 1) % imgs.length), 1100); });
    card.addEventListener('pointerleave', () => { clearInterval(t); go(0); });
  });

  // progress + index
  const update = () => {
    const max = vp.scrollWidth - vp.clientWidth;
    const p = max > 0 ? vp.scrollLeft / max : 0;
    bar.style.transform = `scaleX(${Math.max(0.06, p)})`;
    // index from progress, so it runs 01 … 09 with the bar (the last cards can never scroll to the left edge)
    const i = Math.round(p * (cards.length - 1));
    idx.textContent = String(i + 1).padStart(2, '0');
  };
  vp.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  const stepBy = (dir) => {
    const w = cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
    const to = Math.round(vp.scrollLeft / w + dir) * w;
    smoothTo(to);
  };
  const smoothTo = (x) => {
    if (reduced) { vp.scrollLeft = x; return; }
    gsap.to(vp, { scrollLeft: x, duration: 0.9, ease: 'expo.out', overwrite: true });
  };
  rail.querySelector('[data-rail-prev]').addEventListener('click', () => stepBy(-1));
  rail.querySelector('[data-rail-next]').addEventListener('click', () => stepBy(1));
  vp.addEventListener('keydown', (e) => {
    if (e.target !== vp) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stepBy(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepBy(-1); }
    if (e.key === 'Home') { e.preventDefault(); smoothTo(0); }
    if (e.key === 'End') { e.preventDefault(); smoothTo(vp.scrollWidth); }
  });

  // mouse drag with inertia
  let down = false, startX = 0, startL = 0, lastX = 0, lastT = 0, vel = 0, moved = 0;
  vp.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = 0; startX = lastX = e.clientX; startL = vp.scrollLeft; lastT = performance.now(); vel = 0;
    gsap.killTweensOf(vp);
    vp.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const now = performance.now();
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    vp.scrollLeft = startL - dx;
    vel = (e.clientX - lastX) / Math.max(1, now - lastT);
    lastX = e.clientX; lastT = now;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    vp.classList.remove('is-dragging');
    if (!reduced && Math.abs(vel) > 0.05) gsap.to(vp, { scrollLeft: vp.scrollLeft - vel * 420, duration: 1.1, ease: 'expo.out' });
  });
  vp.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  vp.addEventListener('dragstart', (e) => e.preventDefault());
}
