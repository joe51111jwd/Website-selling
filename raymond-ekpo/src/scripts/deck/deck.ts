// The deck: one slide at a time, filling the screen. The arrow keys, page keys and space move
// through it; so does a trackpad or wheel (one slide per gesture) and, on a phone, a swipe that
// drags the next slide in under your finger. Each change is a glass rod sweeping across the
// screen, wiping the old slide into the new one. The slide number opens the contents, Notes shows
// the speaker notes, and the address follows the slide (#id), so any slide can be linked to.
// Pages that aren't decks (the enquiry form, privacy) get the same bar, offering the way back.
import { lensGlass, rodLens } from './lens';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n: number) => String(n).padStart(2, '0');
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const isField = (t: EventTarget | null) => t instanceof Element && !!t.closest('input, textarea, select, [contenteditable]');
const isControl = (t: EventTarget | null) => t instanceof Element && !!t.closest('a, button, summary, label');

/** can this element still scroll along the gesture? then the gesture is its, not the deck's */
const scrolls = (el: HTMLElement, d: number, horizontal: boolean) => {
  const cs = getComputedStyle(el);
  if (horizontal) {
    if (!/auto|scroll/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 1) return false;
    return d > 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth - 1 : el.scrollLeft > 0;
  }
  if (!/auto|scroll/.test(cs.overflowY) || el.scrollHeight <= el.clientHeight + 1) return false;
  return d > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
};

export function deck() {
  const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
  const root = document.querySelector<HTMLElement>('[data-deck]');
  const pb = $('[data-pb]');
  const contents = $('[data-contents]');
  const openB = $<HTMLButtonElement>('[data-contents-open]');
  const closeB = $<HTMLButtonElement>('[data-contents-close]');
  const titleEl = $('[data-title]');
  if (!pb) return;

  const openContents = () => {
    contents.hidden = false;
    openB.setAttribute('aria-expanded', 'true');
    if (root) root.inert = true;
    pb.inert = true;
    (contents.querySelector<HTMLElement>('[aria-current="true"]') ?? closeB).focus({ preventScroll: true });
  };
  const closeContents = () => {
    contents.hidden = true;
    openB.setAttribute('aria-expanded', 'false');
    if (root) root.inert = false;
    pb.inert = false;
    openB.focus({ preventScroll: true });
  };
  openB.addEventListener('click', () => (contents.hidden ? openContents() : closeContents()));
  closeB.addEventListener('click', closeContents);
  contents.addEventListener('click', (e) => {
    if (e.target === contents) closeContents();
  });

  lensGlass();

  // ---------- a page that isn't a deck ----------
  if (!root) {
    pb.classList.add('is-doc');
    if (location.pathname.startsWith('/work-with-me')) pb.classList.add('is-ask');
    titleEl.textContent = 'Contents';
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !contents.hidden) closeContents();
    });
    return;
  }

  const slides = [...root.querySelectorAll<HTMLElement>(':scope > .d-slide')];
  const N = slides.length;
  if (!N) return;
  const no = $('[data-no]');
  const prevB = $<HTMLButtonElement>('[data-prev]');
  const nextB = $<HTMLButtonElement>('[data-next]');
  const notesB = $<HTMLButtonElement>('[data-notes-toggle]');
  const notesBox = $('[data-notesbox]');
  const notesBody = $('[data-notes-body]');
  const notesSlide = $('[data-notes-slide]');
  const progress = $('[data-progress]');
  const rod = $('[data-rod]');
  const live = $('[data-live]');
  const grid = $('[data-contents-grid]');
  $('[data-of]').textContent = `/ ${pad(N)}`;

  // the parts of each slide that arrive one by one
  slides.forEach((s) => s.querySelectorAll<HTMLElement>('[data-b]').forEach((el, i) => el.style.setProperty('--i', String(i))));

  // a slide taller than the screen starts at the top and scrolls
  const measure = () =>
    slides.forEach((s) => {
      const b = s.querySelector<HTMLElement>('.d-body');
      if (!b) return;
      const tall = b.scrollHeight > b.clientHeight + 2;
      b.classList.toggle('is-tall', tall);
      // a slide that scrolls can be scrolled from the keyboard too
      if (tall) b.tabIndex = 0;
      else b.removeAttribute('tabindex');
    });

  const hasNotes = slides.some((s) => s.querySelector('.d-notes'));
  if (!hasNotes) notesB.hidden = true;
  let notesOn = false;
  try {
    notesOn = hasNotes && sessionStorage.getItem('deck-notes') === '1';
  } catch {
    /* storage can be off */
  }

  let cur = -1;
  const indexOf = (id: string) => slides.findIndex((s) => s.id === id);

  const showNotes = () => {
    const s = slides[cur];
    const n = s.querySelector('.d-notes');
    notesSlide.textContent = `${pad(cur + 1)} · ${s.dataset.title}`;
    notesBody.innerHTML = n ? n.innerHTML : '<p>No notes on this slide.</p>';
    notesBox.hidden = !notesOn;
    notesB.setAttribute('aria-pressed', String(notesOn));
  };
  const toggleNotes = (on = !notesOn) => {
    notesOn = on && hasNotes;
    try {
      sessionStorage.setItem('deck-notes', notesOn ? '1' : '0');
    } catch {
      /* storage can be off */
    }
    showNotes();
  };
  notesB.addEventListener('click', () => toggleNotes());

  const sync = () => {
    const s = slides[cur];
    no.textContent = pad(cur + 1);
    titleEl.textContent = s.dataset.title ?? '';
    prevB.disabled = cur === 0;
    nextB.disabled = cur === N - 1;
    const tone = s.dataset.tone || 'chalk';
    for (const el of [pb, notesBox, progress]) el.dataset.tone = tone;
    document.documentElement.dataset.slideTone = tone;
    progress.style.setProperty('--p', String((cur + 1) / N));
    showNotes();
    const base = location.pathname + location.search;
    history.replaceState(history.state, '', cur === 0 && !location.hash ? base : `${base}#${s.id}`);
    live.textContent = `Slide ${cur + 1} of ${N}: ${s.dataset.title}`;
    grid.querySelectorAll('.dc-thumb').forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
  };

  const build = (s: HTMLElement) => {
    s.classList.remove('is-built');
    void s.offsetWidth;
    s.classList.add('is-built');
  };

  /** make slide i the current one, at rest */
  const settle = (i: number) => {
    slides.forEach((s, k) => {
      const on = k === i;
      s.classList.toggle('is-current', on);
      s.classList.remove('is-in');
      s.style.clipPath = '';
      s.style.transform = '';
      s.style.opacity = '';
      s.inert = !on;
      if (!on) s.classList.remove('is-built');
    });
    cur = i;
    sync();
    slides[i].dispatchEvent(new CustomEvent('slideenter'));
  };

  // ---------- the wipe ----------
  type Wipe = { from: number; to: number; dir: number; p: number; raf: number };
  let tr: Wipe | null = null;

  const render = (p: number) => {
    if (!tr) return;
    tr.p = p;
    const from = slides[tr.from];
    const to = slides[tr.to];
    if (still) {
      to.style.opacity = String(p);
      return;
    }
    const W = innerWidth;
    const shift = W * 0.06;
    // where the seam is, and how far each slide has drifted
    const edge = tr.dir > 0 ? (1 - p) * W : p * W;
    const toOff = tr.dir > 0 ? (1 - p) * shift : -(1 - p) * shift;
    const fromOff = tr.dir > 0 ? -p * shift : p * shift;
    to.style.transform = `translate3d(${toOff}px, 0, 0)`;
    from.style.transform = `translate3d(${fromOff}px, 0, 0)`;
    const local = edge - toOff;
    to.style.clipPath = tr.dir > 0 ? `inset(0 0 0 ${local}px)` : `inset(0 ${W - local}px 0 0)`;
    rod.style.transform = `translate3d(${edge - rod.offsetWidth / 2}px, 0, 0)`;
  };

  const prepare = (to: number, dir: number) => {
    const s = slides[to];
    s.classList.add('is-in');
    s.inert = true;
    tr = { from: cur, to, dir, p: 0, raf: 0 };
    if (!still) {
      rod.hidden = false;
      rod.dataset.tone = slides[cur].dataset.tone;
      rodLens(rod);
    }
    build(s);
    render(0);
  };

  const finish = () => {
    if (!tr) return;
    cancelAnimationFrame(tr.raf);
    const to = tr.to;
    const hadFocus = slides[tr.from].contains(document.activeElement) || document.activeElement === document.body;
    tr = null;
    rod.hidden = true;
    settle(to);
    if (hadFocus) slides[to].focus({ preventScroll: true });
  };

  const back = () => {
    if (!tr) return;
    cancelAnimationFrame(tr.raf);
    const s = slides[tr.to];
    s.classList.remove('is-in', 'is-built');
    s.style.clipPath = '';
    s.style.transform = '';
    s.style.opacity = '';
    slides[tr.from].style.transform = '';
    tr = null;
    rod.hidden = true;
  };

  const animate = (target: number, dur: number, curve: (t: number) => number, done: () => void) => {
    if (!tr) return;
    cancelAnimationFrame(tr.raf);
    const start = tr.p;
    const t0 = performance.now();
    const step = (now: number) => {
      if (!tr) return;
      const t = Math.min(1, (now - t0) / dur);
      render(start + (target - start) * curve(t));
      if (t < 1) tr.raf = requestAnimationFrame(step);
      else done();
    };
    tr.raf = requestAnimationFrame(step);
  };

  const go = (i: number) => {
    if (i < 0 || i >= N) return;
    if (tr) finish();
    if (i === cur) return;
    prepare(i, i > cur ? 1 : -1);
    animate(1, still ? 200 : 780, ease, finish);
  };

  prevB.addEventListener('click', () => go(cur - 1));
  nextB.addEventListener('click', () => go(cur + 1));

  // ---------- keys ----------
  addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!contents.hidden) {
      if (e.key === 'Escape') closeContents();
      return;
    }
    const t = e.target as HTMLElement;
    if (isField(t) && !(t as HTMLInputElement).type?.match(/radio|range/)) return;
    const k = e.key;
    if (k === 'Escape' && notesOn) return toggleNotes(false);
    // radios and sliders use the arrow keys themselves
    if (k.startsWith('Arrow') && t.closest?.('input[type=radio], input[type=range], [role=radiogroup]')) return;
    let i = -1;
    const vertical = k === 'ArrowDown' || k === 'ArrowUp' || k === 'PageDown' || k === 'PageUp' || k === ' ';
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey && !isControl(t))) i = cur + 1;
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey && !isControl(t))) i = cur - 1;
    else if (k === 'Home') i = 0;
    else if (k === 'End') i = N - 1;
    else if (k === 'n' || k === 'N') return toggleNotes();
    else if (k === 'g' || k === 'G') return openContents();
    else return;
    // a slide that scrolls scrolls first
    const body = slides[cur].querySelector<HTMLElement>('.d-body');
    if (vertical && body && scrolls(body, i > cur ? 1 : -1, false)) return;
    e.preventDefault();
    go(i);
  });

  // ---------- wheel and trackpad: one slide per gesture ----------
  let locked = false;
  let lockedAt = 0;
  let lastWheel = 0;
  let acc = 0;
  root.addEventListener(
    'wheel',
    (e) => {
      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const d = horizontal ? e.deltaX : e.deltaY;
      for (let el = e.target as HTMLElement | null; el && el !== root; el = el.parentElement) {
        if (scrolls(el, d, horizontal)) return;
      }
      e.preventDefault();
      if (locked) {
        // wait for the gesture (and a trackpad's glide) to end before the next one counts
        if (gap > 200 && now - lockedAt > 450) locked = false;
        else return;
      }
      if (gap > 200) acc = 0;
      acc += d;
      if (Math.abs(acc) > 36) {
        const i = cur + Math.sign(acc);
        acc = 0;
        locked = true;
        lockedAt = now;
        go(i);
      }
    },
    { passive: false },
  );

  // ---------- swipe: the next slide follows your finger ----------
  let drag: { x: number; y: number; id: number; axis: '' | 'x' | 'y'; t: number } | null = null;
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || tr) return;
    if ((e.target as Element).closest('input, textarea, select, [data-nodrag]')) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, axis: '', t: performance.now() };
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.axis) {
      if (Math.hypot(dx, dy) < 10) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
      if (drag.axis === 'y') {
        drag = null;
        return;
      }
    }
    const dir = dx < 0 ? 1 : -1;
    const i = cur + dir;
    if (i < 0 || i >= N) {
      // nothing that way: the slide gives a little and springs back
      if (tr) back();
      slides[cur].style.transform = `translate3d(${dx * 0.18}px, 0, 0)`;
      return;
    }
    if (!tr || tr.dir !== dir) {
      if (tr) back();
      prepare(i, dir);
    }
    render(Math.min(1, Math.abs(dx) / innerWidth));
  });
  const release = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const v = Math.abs(e.clientX - drag.x) / Math.max(1, performance.now() - drag.t);
    drag = null;
    slides[cur].style.transform = '';
    if (!tr) return;
    if (e.type === 'pointerup' && (tr.p > 0.28 || v > 0.45)) animate(1, 420, easeOut, finish);
    else animate(0, 300, easeOut, back);
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);

  // ---------- links to a slide, and the address ----------
  addEventListener('hashchange', () => {
    const i = indexOf(decodeURIComponent(location.hash.slice(1)));
    if (i < 0 || i === cur) return;
    if (!contents.hidden) closeContents();
    go(i);
  });

  // ---------- contents: every slide on the light table ----------
  const strip = (el: HTMLElement) => {
    el.removeAttribute('id');
    el.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    el.querySelectorAll('[name]').forEach((n) => n.removeAttribute('name'));
    el.querySelectorAll('[for]').forEach((n) => n.removeAttribute('for'));
    el.querySelectorAll('[data-seg], [data-rodcompare], [data-fit]').forEach((n) => {
      n.removeAttribute('data-seg');
      n.removeAttribute('data-rodcompare');
      n.removeAttribute('data-fit');
    });
  };
  const scaleThumbs = () => {
    grid.style.setProperty('--ar', `${innerWidth} / ${innerHeight}`);
    grid.querySelectorAll<HTMLElement>('.dc-frame').forEach((f) => {
      const c = f.firstElementChild as HTMLElement;
      c.style.width = `${innerWidth}px`;
      c.style.height = `${innerHeight}px`;
      c.style.transform = `scale(${f.clientWidth / innerWidth})`;
    });
  };
  let gridBuilt = false;
  const buildGrid = () => {
    gridBuilt = true;
    slides.forEach((s, i) => {
      const li = document.createElement('li');
      li.className = 'dc-item';
      li.style.setProperty('--i', String(i));
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dc-thumb';
      b.setAttribute('aria-current', String(i === cur));
      const frame = document.createElement('span');
      frame.className = 'dc-frame';
      const clone = s.cloneNode(true) as HTMLElement;
      strip(clone);
      clone.classList.add('is-current', 'is-built');
      clone.classList.remove('is-in');
      clone.style.clipPath = '';
      clone.style.opacity = '';
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('aria-label');
      clone.removeAttribute('tabindex');
      clone.inert = true;
      frame.append(clone);
      const cap = document.createElement('span');
      cap.className = 'dc-cap';
      const n = document.createElement('span');
      n.textContent = pad(i + 1);
      const t = document.createElement('span');
      t.textContent = s.dataset.title ?? '';
      cap.append(n, t);
      b.append(frame, cap);
      b.addEventListener('click', () => {
        closeContents();
        go(i);
      });
      li.append(b);
      grid.append(li);
    });
    scaleThumbs();
  };
  openB.addEventListener('click', () => {
    if (!gridBuilt && !contents.hidden) {
      buildGrid();
      contents.querySelector<HTMLElement>('.dc-thumb[aria-current="true"]')?.focus({ preventScroll: true });
    }
  });

  addEventListener('resize', () => {
    if (tr) finish();
    measure();
    if (gridBuilt) scaleThumbs();
  });

  // ---------- start ----------
  const first = Math.max(0, indexOf(decodeURIComponent(location.hash.slice(1))));
  root.classList.add('is-live');
  measure();
  document.fonts?.ready.then(measure);
  settle(first);
  build(slides[first]);
  if (notesOn) showNotes();

  if (import.meta.env.DEV) {
    // for screenshots: hold a wipe at any point
    const hold = (i: number, p: number) => {
      if (tr) back();
      prepare(i, i > cur ? 1 : -1);
      render(p);
    };
    Object.assign(window, { __deck: { go, hold, get cur() { return cur; }, slides } });
  }
}
