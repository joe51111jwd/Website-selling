// Sticky nav: blurs once scrolled, adopts the theme of the section under it, live kit count, mobile menu.
import { kit, itemCount } from '../kit/state.js';

export function initNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  // scrolled state
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // theme follows the section crossing the nav's centre line
  const sections = [...document.querySelectorAll('[data-theme]')].filter((s) => s !== nav && !nav.contains(s));
  const probe = () => {
    const y = nav.offsetHeight / 2;
    let theme = 'bone';
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { theme = s.dataset.theme; }
    }
    if (nav.dataset.theme !== theme) nav.dataset.theme = theme;
  };
  probe();
  window.addEventListener('scroll', probe, { passive: true });
  window.addEventListener('resize', probe);

  // kit count
  const counts = document.querySelectorAll('[data-kit-count]');
  kit.subscribe((s) => {
    const n = itemCount(s);
    counts.forEach((c) => {
      if (c.textContent !== String(n)) {
        c.textContent = String(n);
        c.closest('.pill')?.classList.remove('is-bump');
        void c.offsetWidth;
        c.closest('.pill')?.classList.add('is-bump');
      }
    });
    document.querySelectorAll('[data-kit-pill]').forEach((p) => p.setAttribute('aria-label', `your kit, ${n} item${n === 1 ? '' : 's'}`));
  });

  // mobile menu
  const toggle = nav.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    const set = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('menu-open', open);
      toggle.querySelector('.menu-label').textContent = open ? 'close' : 'menu';
    };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('menu-open')) { set(false); toggle.focus(); } });
    matchMedia('(min-width: 961px)').addEventListener('change', () => set(false));
  }
}
