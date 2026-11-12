import { gsap, reduced } from '../motion.js';
import { splitLines } from '../reveal.js';
import { CLIENTS } from '../../data/content.js';

export function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // client marquee (two copies for a seamless loop; second copy hidden from AT)
  const track = hero.querySelector('[data-marquee]');
  const row = (hidden) => `<ul class="marquee__row" ${hidden ? 'aria-hidden="true"' : ''}>${CLIENTS.map((c) =>
    `<li><img src="/clients/${c.file}" alt="${hidden ? '' : c.name}" width="125" height="80" loading="lazy" decoding="async"></li>`).join('')}</ul>`;
  track.innerHTML = row(false) + row(true);

  // pause control for the endless logo loop (WCAG 2.2.2); hidden under reduced motion, where it is static
  const marquee = hero.querySelector('.marquee');
  const mt = hero.querySelector('[data-marquee-toggle]');
  mt?.addEventListener('click', () => {
    const paused = marquee.classList.toggle('is-paused');
    mt.setAttribute('aria-pressed', String(paused));
    mt.textContent = paused ? 'play' : 'pause';
  });

  // the cue is pinned to the bottom of the first viewport; on tall, narrow screens that can land on the
  // marquee label, so clamp it to sit 20px clear of the marquee's top edge
  const cue = hero.querySelector('.hero__cue');
  if (cue && marquee) {
    const placeCue = () => {
      cue.style.top = '';
      const limit = marquee.offsetTop - cue.offsetHeight - 20;
      if (cue.offsetTop > limit) cue.style.top = `${Math.max(limit, 0)}px`;
    };
    placeCue();
    new ResizeObserver(placeCue).observe(hero);
  }

  if (reduced) return;

  const title = hero.querySelector('.hero__title');
  title.classList.add('is-split');
  // name the h1 itself; SplitText then only hides its line wrappers (no aria-label on generic spans)
  title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
  const tl = gsap.timeline({ delay: 0.15 });
  title.querySelectorAll('.hero__l1, .hero__l2').forEach((s, i) => {
    tl.add(splitLines(s, { trigger: false, stagger: 0.1, duration: 1.3, aria: 'hidden' }) || gsap.set({}, {}), i * 0.12);
  });
  tl.fromTo(hero.querySelectorAll('[data-hero-in]'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.35);
  tl.fromTo(hero.querySelector('[data-hero-render]'), { y: 120, scale: 0.94, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 1.8, ease: 'expo.out' }, 0.45);
  tl.fromTo(hero.querySelectorAll('.hero__note, .hero__cue'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: 'power2.out', stagger: 0.1 }, 1.0);
  tl.fromTo(hero.querySelector('.hero__fx'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.0, ease: 'power2.out' }, 0);

  // scroll: render drifts up and grows a touch; copy lifts away
  gsap.to(hero.querySelector('.hero__render'), {
    yPercent: -10, scale: 1.04, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to(hero.querySelector('.hero__inner'), {
    yPercent: -18, autoAlpha: 0.2, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: '55% top', scrub: true },
  });
}
