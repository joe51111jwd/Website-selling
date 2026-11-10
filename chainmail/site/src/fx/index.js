/* chainmail fx — entry point.  See ./README.md for markup hooks.

   import { initFX } from './fx/index.js';
   const fx = initFX();
   const seq = fx.get(document.querySelector('[data-fx="sequence"]'));
   seq.ready.then(() => seq.setProgress(0.5));
   fx.setTheme(sectionOrCanvas, 'bone');
   fx.destroy();
*/

import { startLoop, stopLoop, subscribe, wake } from './core/loop.js';
import { injectStyles, removeStyles } from './core/style.js';
import { ChromeFX } from './effects/chrome.js';
import { CausticsFX } from './effects/caustics.js';
import { GrainFX } from './effects/grain.js';
import { SequenceFX } from './effects/sequence.js';

const KINDS = {
  chrome: ChromeFX,
  caustics: CausticsFX,
  grain: GrainFX,
  sequence: SequenceFX,
};

function createPointer() {
  const handlers = new Set();
  const emit = (type, x, y) => {
    const e = { type, x, y };
    handlers.forEach((h) => h(e));
  };
  const onMove = (e) => emit('move', e.clientX, e.clientY);
  const onDown = (e) => emit('down', e.clientX, e.clientY);
  const onLeave = () => emit('leave', -1e4, -1e4);
  const onOut = (e) => {
    if (!e.relatedTarget) onLeave();
  };
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerdown', onDown, { passive: true });
  document.addEventListener('pointerout', onOut, { passive: true });
  addEventListener('blur', onLeave);
  return {
    on(h) {
      handlers.add(h);
      return () => handlers.delete(h);
    },
    dispose() {
      handlers.clear();
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerout', onOut);
      removeEventListener('blur', onLeave);
    },
  };
}

/**
 * @param {object}  [opts]
 * @param {ParentNode} [opts.root=document]  where to scan for [data-fx]
 * @param {boolean} [opts.grain=true]        inject a fixed grain overlay when no [data-fx="grain"] exists
 * @param {boolean} [opts.reducedMotion]     force on/off (default: media query)
 */
export function initFX(opts = {}) {
  const root = opts.root || document;
  injectStyles();

  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const ctx = {
    reducedMotion: opts.reducedMotion ?? mq.matches,
    pointer: createPointer(),
    wake,
  };

  const instances = new Map(); // element -> instance
  const unsubs = [];

  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        const inst = instances.get(en.target);
        if (!inst) continue;
        inst.visible = en.isIntersecting;
        if (inst.visible) inst.dirty = true;
      }
      wake();
    },
    { rootMargin: '120px 0px' }
  );

  const ro = new ResizeObserver((entries) => {
    for (const en of entries) {
      const inst = instances.get(en.target);
      if (inst) {
        inst.resize();
        inst.dirty = true;
      }
    }
    wake();
  });

  function mount(el) {
    if (instances.has(el)) return instances.get(el);
    const Kind = KINDS[el.dataset.fx];
    if (!Kind) return null;
    let inst;
    try {
      inst = new Kind(el, ctx);
    } catch (e) {
      console.warn('[fx] failed to mount', el.dataset.fx, e);
      el.classList.add('fx-canvas', 'fx-fallback', `fx-fallback--${el.dataset.fx}`);
      return null;
    }
    instances.set(el, inst);
    if (inst.kind !== 'grain') {
      io.observe(el);
      ro.observe(el);
      unsubs.push(subscribe(inst));
    }
    return inst;
  }

  root.querySelectorAll('[data-fx]').forEach(mount);

  if (opts.grain !== false && !root.querySelector('[data-fx="grain"]')) {
    const g = document.createElement('div');
    g.className = 'fx-grain--injected';
    document.body.appendChild(g);
    instances.set(g, new GrainFX(g, ctx, { injected: true }));
  }

  const onMQ = (e) => {
    if (opts.reducedMotion !== undefined) return;
    ctx.reducedMotion = e.matches;
    instances.forEach((i) => {
      i.dirty = true;
      if (i.kind === 'grain') i.canvas.classList.toggle('fx-grain--still', e.matches);
    });
    wake();
  };
  mq.addEventListener?.('change', onMQ);

  startLoop();

  const api = {
    /** instance for a [data-fx] element (mounts it lazily if it was added after init) */
    get(el) {
      return instances.get(el) || (el?.dataset?.fx ? mount(el) : null);
    },
    /** scan again (e.g. after injecting markup) */
    refresh() {
      root.querySelectorAll('[data-fx]').forEach(mount);
      return api;
    },
    /** tint effects to the section they sit in; el = canvas, or any ancestor of [data-fx] canvases */
    setTheme(el, theme) {
      if (!el) return;
      const targets = el.dataset?.fx ? [el] : [...el.querySelectorAll('[data-fx]')];
      targets.forEach((t) => instances.get(t)?.setTheme?.(theme));
      wake();
    },
    get reducedMotion() {
      return ctx.reducedMotion;
    },
    instances,
    destroy() {
      mq.removeEventListener?.('change', onMQ);
      io.disconnect();
      ro.disconnect();
      unsubs.forEach((u) => u());
      instances.forEach((i) => i.destroy());
      instances.clear();
      ctx.pointer.dispose();
      stopLoop();
      removeStyles();
    },
  };
  return api;
}

export default initFX;
