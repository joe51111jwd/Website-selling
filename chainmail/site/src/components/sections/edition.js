// Edition of 48: a grid of numbered lid tiles; a few flip to real work photos (hover + while in view).
import { gsap, ScrollTrigger, reduced } from '../motion.js';
import { odometer } from '../odometer.js';
import { money } from '../../kit/state.js';
import { renderPicture } from '../media.js';
import { RENDERS, WORK, SHOWN_KIT } from '../../data/content.js';

const FLIPS = [3, 10, 17, 21, 28, 34, 40, 45];

export function initEdition() {
  const sec = document.getElementById('edition');
  if (!sec) return;
  const grid = sec.querySelector('[data-edition-grid]');
  const photos = WORK.map((w) => ({ src: `/work/${w.photos[0]}`, title: w.title }));

  grid.innerHTML = Array.from({ length: SHOWN_KIT.edition }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const fi = FLIPS.indexOf(i);
    const back = fi >= 0
      ? `<span class="tile__b"><span class="media" data-media><img src="${photos[fi % photos.length].src}" alt="" width="1080" height="1080" loading="lazy" decoding="async"></span><span class="tile__bt mono">${photos[fi % photos.length].title}</span></span>`
      : '';
    return `<li class="tile${fi >= 0 ? ' tile--flip' : ''}" aria-label="kit no. ${num} of 48">
      <span class="tile__in">
        <span class="tile__f">${renderPicture(RENDERS.lidTop, { w: 1200, h: 1200, alt: '', half: true, cls: 'media--cover' })}<span class="tile__n mono">${num}</span></span>
        ${back}
      </span>
    </li>`;
  }).join('');

  const total = odometer(sec.querySelector('[data-edition-total]'), { value: reduced ? SHOWN_KIT.perKit * SHOWN_KIT.edition : 0, format: money, duration: 1400 });
  if (reduced) return;

  const tiles = [...grid.children];
  gsap.set(tiles, { autoAlpha: 0, scale: 0.86 });
  ScrollTrigger.create({
    trigger: grid, start: 'top 80%', once: true,
    onEnter: () => {
      gsap.to(tiles, {
        autoAlpha: 1, scale: 1, duration: 0.9, ease: 'expo.out',
        stagger: { each: 0.018, grid: 'auto', from: 'start' },
      });
    },
  });
  ScrollTrigger.create({
    trigger: sec, start: 'top 60%', once: true,
    onEnter: () => total.set(SHOWN_KIT.perKit * SHOWN_KIT.edition),
  });

  // ambient flips while the grid is on screen
  const flippers = tiles.filter((t) => t.classList.contains('tile--flip'));
  let timer = null, k = 0;
  const step = () => {
    flippers.forEach((t) => t.classList.remove('is-flipped'));
    flippers[k % flippers.length].classList.add('is-flipped');
    if (k % 3 === 2) flippers[(k + 4) % flippers.length].classList.add('is-flipped');
    k++;
  };
  ScrollTrigger.create({
    trigger: grid, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => {
      clearInterval(timer);
      if (self.isActive) { timer = setInterval(step, 1700); }
      else flippers.forEach((t) => t.classList.remove('is-flipped'));
    },
  });
}
