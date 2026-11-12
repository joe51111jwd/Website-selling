// Sticky nav: blurs once scrolled, adopts the theme of the section under it, live kit count, mobile menu.
import { kit, itemCount } from '../kit/state.js';
import { announceKit } from '../kit/announce.js';

export function initNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  // scrolled state
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // theme follows the section just below the nav's bottom edge, so an anchor jump (section top at --nav-h)
  // gets that section's theme. One IntersectionObserver on a 1px line instead of reading every section's
  // rect on each scroll event.
  const sections = [...document.querySelectorAll('[data-theme]')].filter((s) => s !== nav && !nav.contains(s));
  const hits = new Set();
  const apply = () => {
    let theme = 'bone';
    for (const s of sections) if (hits.has(s)) theme = s.dataset.theme; // DOM order: the innermost wins
    if (nav.dataset.theme !== theme) nav.dataset.theme = theme;
  };
  let io = null;
  const observe = () => {
    io?.disconnect();
    hits.clear();
    const y = nav.offsetHeight + 1;
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? hits.add(e.target) : hits.delete(e.target)));
      apply();
    }, { rootMargin: `-${y}px 0px -${Math.max(0, window.innerHeight - y - 1)}px 0px` });
    sections.forEach((s) => io.observe(s));
  };
  observe();
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(observe, 150); });

  // kit count + a polite status message when something goes in or comes out
  const counts = document.querySelectorAll('[data-kit-count]');
  announceKit(kit.get(), { seed: true });
  kit.subscribe((s) => {
    announceKit(s);
    const n = itemCount(s);
    counts.forEach((c) => {
      if (c.textContent !== String(n)) {
        c.textContent = String(n);
        c.closest('.pill')?.classList.remove('is-bump');
        void c.offsetWidth;
        c.closest('.pill')?.classList.add('is-bump');
      }
    });
    // visible label first ("kit 3"), so voice control ("click kit") matches the accessible name
    document.querySelectorAll('[data-kit-pill]').forEach((p) => p.setAttribute('aria-label', `kit, ${n} item${n === 1 ? '' : 's'}`));
  });

  // mobile menu: focus moves into the menu, Tab cycles burger + links, the page behind is inert, Esc closes
  const toggle = nav.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    const main = document.getElementById('main');
    const footer = document.querySelector('.footer');
    const links = () => [...menu.querySelectorAll('a')];
    const set = (open, { focus = false } = {}) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('menu-open', open);
      toggle.querySelector('.menu-label').textContent = open ? 'close' : 'menu';
      if (main) main.inert = open;
      if (footer) footer.inert = open;
      if (open && focus) requestAnimationFrame(() => links()[0]?.focus());
    };
    toggle.addEventListener('click', (e) => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      set(open, { focus: open && e.detail === 0 }); // detail 0 = keyboard activation
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => {
      if (!nav.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { set(false); toggle.focus(); return; }
      if (e.key !== 'Tab') return;
      const ring = [toggle, ...links()];
      const i = ring.indexOf(document.activeElement);
      const next = i === -1 ? 0 : (i + (e.shiftKey ? -1 : 1) + ring.length) % ring.length;
      e.preventDefault();
      ring[next].focus();
    });
    matchMedia('(min-width: 961px)').addEventListener('change', () => set(false));
  }
}
