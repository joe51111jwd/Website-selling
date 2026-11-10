// "How a kit gets made": pinned, scroll-scrubbed packing sequence. site-core owns the ScrollTrigger and
// drives fx's sequence via seq.setProgress(p). Captions alternate left/right, price rolls in mono.
import { gsap, ScrollTrigger, reduced, lenis as lenisRef } from '../motion.js';
import { MADE_STEPS } from '../../data/content.js';
import { odometer } from '../odometer.js';
import { money } from '../../kit/state.js';
import { renderPicture, watchMedia } from '../media.js';

// Until the packing sequence frames exist (manifest 404), the stage crossfades one render per step instead
// of holding a single still while five captions go by. Same renders the rest of the site uses.
const STILLS = [
  [{ r: 'kit/product', w: 1200, h: 1200, cls: 'still__a' }],
  [
    { r: 'goods/hoodie', w: 1600, h: 1600, cls: 'still__hoodie' },
    { r: 'goods/tumbler', w: 1600, h: 1600, cls: 'still__tumbler' },
    { r: 'goods/cap', w: 1600, h: 1600, cls: 'still__cap' },
  ],
  [{ r: 'spirits/manojo', w: 800, h: 1600, cls: 'still__bottle' }],
  [{ r: 'kit/note-card', w: 1200, h: 1200, cls: 'still__a' }],
  [{ r: 'kit/closed', w: 1600, h: 1600, cls: 'still__a' }],
];

export function initMade(fxReady) {
  const sec = document.getElementById('made');
  if (!sec) return;
  const pinEl = sec.querySelector('[data-made-pin]');
  const sides = { l: sec.querySelector('[data-side="l"]'), r: sec.querySelector('[data-side="r"]') };
  const ticks = sec.querySelector('[data-made-ticks]');
  const list = sec.querySelector('[data-made-list]');
  const noteEl = sec.querySelector('[data-made-note]');
  const price = odometer(sec.querySelector('[data-made-price]'), { value: MADE_STEPS[0].price, format: money, duration: 800 });
  const n = MADE_STEPS.length;

  const caps = MADE_STEPS.map((s, i) => {
    const el = document.createElement('div');
    el.className = 'cap';
    el.dataset.i = i;
    el.innerHTML = `<span class="cap__n mono">${String(i + 1).padStart(2, '0')} <span>/ ${String(n).padStart(2, '0')}</span></span>
      <p class="cap__t">${s.caption}</p>`;
    (i % 2 === 0 ? sides.l : sides.r).appendChild(el);
    return el;
  });
  ticks.innerHTML = MADE_STEPS.map((s, i) => `<li><button type="button" data-tick="${i}" aria-label="step ${i + 1}: ${s.caption}"><span class="mono">${String(i + 1).padStart(2, '0')}</span><i></i></button></li>`).join('');
  list.innerHTML = MADE_STEPS.map((s, i) => `<li><span class="mono made__list-n">${String(i + 1).padStart(2, '0')}</span><span class="made__list-t">${s.caption}</span><span class="mono made__list-p">${money(s.price)} <small>${s.note}</small></span></li>`).join('');

  // stills layer (used when there is no frame sequence, or no fx at all)
  const stage = sec.querySelector('.made__stage');
  const stillsEl = document.createElement('div');
  stillsEl.className = 'made__stills';
  stillsEl.setAttribute('aria-hidden', 'true');
  stillsEl.innerHTML = STILLS.map((group, i) => `<div class="still" data-still="${i}">${group.map((x) =>
    renderPicture(x.r, { w: x.w, h: x.h, alt: '', cls: `media--contain ${x.cls}` })).join('')}</div>`).join('');
  stage.appendChild(stillsEl);
  watchMedia(stillsEl);
  const stills = [...stillsEl.children];
  const useStills = () => sec.classList.add('made--stills');

  let seq = null;
  let current = -1;
  const proxy = { p: reduced ? 1 : 0 };
  let st = null;
  const canvas = sec.querySelector('canvas[data-fx="sequence"]');
  fxReady.then((fx) => {
    if (!fx) { useStills(); return; }
    try {
      seq = fx.get?.(canvas) || null;
      if (!seq) { useStills(); return; }
      seq.ready?.then(() => {
        sec.classList.add('seq-ready');
        if (seq.mode !== 'sequence') useStills();
      }).catch(useStills);
      seq.setProgress?.(proxy.p);
    } catch (e) { console.warn('[made] sequence unavailable', e); useStills(); }
  });

  function setStep(i, instant = false) {
    if (i === current) return;
    const prev = current;
    current = i;
    caps.forEach((c, k) => c.classList.toggle('is-active', k === i));
    stills.forEach((el, k) => { el.classList.toggle('is-on', k === i); el.classList.toggle('is-past', k < i); });
    ticks.querySelectorAll('button').forEach((b, k) => {
      b.classList.toggle('is-active', k === i);
      b.classList.toggle('is-done', k < i);
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    price.set(MADE_STEPS[i].price);
    noteEl.textContent = MADE_STEPS[i].note;
    if (reduced || instant) return;
    if (prev >= 0) gsap.to(caps[prev], { autoAlpha: 0, y: i > prev ? -28 : 28, duration: 0.45, ease: 'power3.in', overwrite: true });
    gsap.fromTo(caps[i], { autoAlpha: 0, y: i > prev ? 36 : -36 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: prev >= 0 ? 0.18 : 0, overwrite: true });
    gsap.fromTo(noteEl, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' });
  }

  if (reduced) {
    sec.classList.add('made--static');
    setStep(n - 1, true);
    return;
  }

  gsap.set(caps, { autoAlpha: 0 });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: sec,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 4)}`,
      pin: pinEl,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle: (self) => sec.classList.toggle('is-pinned', self.isActive),
    },
  });
  st = tl.scrollTrigger;
  tl.to(proxy, {
    p: 1, ease: 'none', duration: 1,
    onUpdate: () => {
      const p = proxy.p;
      seq?.setProgress?.(p);
      sec.style.setProperty('--made-p', p.toFixed(4));
      setStep(Math.min(n - 1, Math.floor(p * n * 0.9999 + 0.0001)));
    },
  });
  setStep(0, true);
  gsap.set(caps[0], { autoAlpha: 1, y: 0 });

  // tick buttons jump to that step
  ticks.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tick]');
    if (!b) return;
    const i = Number(b.dataset.tick);
    const y = st.start + (st.end - st.start) * ((i + 0.5) / n);
    if (lenisRef) lenisRef.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: 'smooth' });
  });
  ScrollTrigger.refresh();
}
