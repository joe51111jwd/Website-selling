// Scroll reveals, the word-by-word statement, before/after sliders, the narrative lab tabs
// and the hover previews on the notes index, plus the set pieces in ./fx. Everything degrades
// to a static page.
import { still } from './fx/frame';
import { initCursor } from './fx/cursor';
import { initStory } from './fx/story';
import { initPanels } from './fx/panels';
import { initFit } from './fx/fit';
import { initStack } from './fx/stack';
import { initKinetic } from './fx/kinetic';
import { initChart } from './fx/chart';
import { initShelf } from './fx/shelf';
import { initDraw } from './fx/draw';

(window as unknown as { __motion: boolean }).__motion = true;

initStory();
initPanels();
initFit();
initStack();
initKinetic();
initChart();
initShelf();
initDraw();
initCursor();

/* Reveal blocks as they enter the viewport */
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
);
document.querySelectorAll('[data-reveal], [data-inview]').forEach((el) => io.observe(el));

/* Statements whose words darken as you read down the page */
const statements = [...document.querySelectorAll<HTMLElement>('[data-words]')].map((el) => ({
  el,
  words: [...el.querySelectorAll<HTMLElement>('.w')],
}));

if (statements.length) {
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    for (const { el, words } of statements) {
      const r = el.getBoundingClientRect();
      const p = still ? 1 : Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (r.height + vh * 0.25)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < lit));
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
}

/* Before/after sliders: drag anywhere on the slide, or use the arrow keys on the hidden range */
document.querySelectorAll<HTMLElement>('[data-compare]').forEach((cmp) => {
  const frame = cmp.querySelector<HTMLElement>('.cmp-frame')!;
  const range = cmp.querySelector<HTMLInputElement>('.cmp-range')!;
  let touched = false;

  const set = (v: number) => {
    const pos = Math.min(100, Math.max(0, v));
    range.value = String(pos);
    cmp.style.setProperty('--pos', `${pos}%`);
  };
  const fromEvent = (e: PointerEvent) => {
    const r = frame.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  };

  range.addEventListener('input', () => {
    touched = true;
    set(Number(range.value));
  });
  frame.addEventListener('pointerdown', (e) => {
    touched = true;
    frame.setPointerCapture(e.pointerId);
    cmp.classList.add('dragging');
    fromEvent(e);
  });
  frame.addEventListener('pointermove', (e) => {
    if (frame.hasPointerCapture(e.pointerId)) fromEvent(e);
  });
  const end = (e: PointerEvent) => {
    if (frame.hasPointerCapture(e.pointerId)) frame.releasePointerCapture(e.pointerId);
    cmp.classList.remove('dragging');
  };
  frame.addEventListener('pointerup', end);
  frame.addEventListener('pointercancel', end);

  // The slide arrives as the original; when it scrolls into view the rewrite wipes across it
  const rest = 7;
  if (!still) {
    set(100);
    const wipe = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        wipe.disconnect();
        const from = Number(range.value);
        const start = performance.now() + 450;
        const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
        const step = (t: number) => {
          if (touched) return;
          const k = Math.min(1, Math.max(0, (t - start) / 1500));
          set(from + (rest - from) * ease(k));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.35 },
    );
    wipe.observe(frame);
  }
});

/* Narrative lab tabs */
document.querySelectorAll<HTMLElement>('[data-lab]').forEach((lab) => {
  const tabs = [...lab.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = [...lab.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  const select = (i: number, focus = false) => {
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(i === j));
      t.tabIndex = i === j ? 0 : -1;
    });
    panels.forEach((p, j) => (p.hidden = i !== j));
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') select((i + 1) % tabs.length, true);
      if (e.key === 'ArrowLeft') select((i - 1 + tabs.length) % tabs.length, true);
    });
  });
});

/* Notes index: a preview of the rewritten slide follows the cursor */
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-preview-list]').forEach((list) => {
    const card = document.createElement('div');
    card.className = 'peek';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = '<p class="peek-label"></p><p class="peek-head"></p>';
    document.body.appendChild(card);
    const label = card.querySelector<HTMLElement>('.peek-label')!;
    const head = card.querySelector<HTMLElement>('.peek-head')!;
    let x = 0;
    let y = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const loop = () => {
      cx += (x - cx) * (still ? 1 : 0.18);
      cy += (y - cy) * (still ? 1 : 0.18);
      card.style.transform = `translate(${cx + 28}px, ${cy - 70}px)`;
      raf = requestAnimationFrame(loop);
    };
    list.querySelectorAll<HTMLElement>('[data-preview]').forEach((row) => {
      row.addEventListener('mouseenter', (e) => {
        label.textContent = row.dataset.previewLabel ?? '';
        head.textContent = row.dataset.preview ?? '';
        x = cx = e.clientX;
        y = cy = e.clientY;
        card.classList.add('show');
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      });
      row.addEventListener('mousemove', (e) => {
        x = e.clientX;
        y = e.clientY;
      });
      row.addEventListener('mouseleave', () => {
        card.classList.remove('show');
        cancelAnimationFrame(raf);
      });
    });
  });
}
