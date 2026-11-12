// Reasons to blush: one huge centred quote at a time, auto-advance with a progress dot, pause on hover/focus.
import { QUOTES } from '../../data/content.js';
import { gsap, ScrollTrigger, SplitText, reduced } from '../motion.js';
import { icons } from '../icons.js';

const DUR = 7000;

export function initQuotes() {
  const sec = document.getElementById('love');
  if (!sec) return;
  const stage = sec.querySelector('[data-quotes]');
  const dots = sec.querySelector('[data-q-dots]');
  stage.innerHTML = QUOTES.map((q, i) => `<figure class="quote${i === 0 ? ' is-on' : ''}" ${i === 0 ? '' : 'aria-hidden="true" inert'} aria-roledescription="slide" aria-label="${i + 1} of ${QUOTES.length}">
    <blockquote class="quote__text display"><p><span class="quote__mark" aria-hidden="true">“</span>${q.text}<span class="quote__mark" aria-hidden="true">”</span></p></blockquote>
    <figcaption class="quote__by"><span class="quote__name">${q.name}</span><span class="mono quote__org">${q.org}</span></figcaption>
  </figure>`).join('');
  dots.innerHTML = QUOTES.map((q, i) => `<button type="button" class="qdot" data-q="${i}" aria-label="quote ${i + 1}, ${q.name}" aria-pressed="${i === 0}"><i></i></button>`).join('');
  const figs = [...stage.children];
  const dotEls = [...dots.children];
  let cur = 0, timer = null, start = 0, paused = false, inView = false, raf = 0;

  function go(n, dir = 1) {
    if (n === cur) return;
    const prev = figs[cur];
    const next = figs[n];
    cur = n;
    dotEls.forEach((d, i) => { d.setAttribute('aria-pressed', String(i === n)); d.style.setProperty('--p', 0); });
    const off = (f) => { f.classList.remove('is-on'); f.setAttribute('aria-hidden', 'true'); f.inert = true; };
    const on = (f) => { f.classList.add('is-on'); f.removeAttribute('aria-hidden'); f.inert = false; };
    if (reduced) {
      off(prev); on(next);
    } else {
      gsap.to(prev, { autoAlpha: 0, y: -24 * dir, duration: 0.5, ease: 'power3.in', onComplete: () => off(prev) });
      on(next);
      gsap.set(next, { autoAlpha: 1, y: 0 });
      const split = SplitText.create(next.querySelector('p'), { type: 'words', mask: 'words' });
      gsap.from(split.words, { yPercent: 110, duration: 1.0, ease: 'expo.out', stagger: 0.025, delay: 0.45, onComplete: () => split.revert() });
      gsap.from(next.querySelector('.quote__by'), { autoAlpha: 0, y: 12, duration: 0.8, delay: 0.8, ease: 'expo.out' });
    }
    start = performance.now();
  }
  const manual = () => stage.setAttribute('aria-live', 'polite');
  sec.querySelector('.quotes__ui').addEventListener('click', manual);
  // pause / play for the auto-advance (WCAG 2.2.2); taking control with prev / next / a dot also stops it
  let userPaused = false;
  const pb = sec.querySelector('[data-q-pause]');
  const setUserPaused = (v) => {
    userPaused = v;
    if (!pb) return;
    pb.setAttribute('aria-pressed', String(v));
    pb.setAttribute('aria-label', v ? 'play quotes' : 'pause quotes');
    pb.innerHTML = v ? icons.play : icons.pause;
  };
  pb?.addEventListener('click', () => setUserPaused(!userPaused));
  const nextQ = () => go((cur + 1) % figs.length, 1);
  const prevQ = () => go((cur - 1 + figs.length) % figs.length, -1);
  sec.querySelector('[data-q-next]').addEventListener('click', () => { setUserPaused(true); nextQ(); });
  sec.querySelector('[data-q-prev]').addEventListener('click', () => { setUserPaused(true); prevQ(); });
  dots.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) { setUserPaused(true); go(Number(b.dataset.q), Number(b.dataset.q) > cur ? 1 : -1); } });

  if (reduced) { if (pb) pb.hidden = true; return; } // no auto-advance, nothing to pause
  const loop = (now) => {
    if (!paused && !userPaused && inView) {
      const p = Math.min(1, (now - start) / DUR);
      dotEls[cur].style.setProperty('--p', p.toFixed(3));
      if (p >= 1) nextQ();
    } else {
      start = now - (parseFloat(dotEls[cur].style.getPropertyValue('--p')) || 0) * DUR;
    }
    raf = requestAnimationFrame(loop);
  };
  sec.addEventListener('pointerenter', () => { paused = true; });
  sec.addEventListener('pointerleave', () => { paused = false; });
  sec.addEventListener('focusin', () => { paused = true; });
  sec.addEventListener('focusout', (e) => { if (!sec.contains(e.relatedTarget)) paused = false; });
  ScrollTrigger.create({ trigger: sec, start: 'top 75%', end: 'bottom 25%', onToggle: (s) => { inView = s.isActive; } });
  start = performance.now();
  raf = requestAnimationFrame(loop);
}
