/* sequence — progressive canvas image-sequence player.
   - loading is deferred: nothing is fetched until window load AND the canvas is within ~1.5 viewports
     (or setProgress() is called), so frames never compete with the hero
   - reads a manifest (see README; optimize.py's `sizes` shape is first-class), picks the 1280 or 720 set
   - preload order: first, last, then bisection (mid, quarters, eighths…) so scrubbing is never blank;
     a frame the user scrubs to jumps the queue
   - draws the nearest loaded frame with object-fit contain/cover semantics
   - manifest 404 / bad JSON -> static fallback image (default /renders/kit/hero-open.webp);
     if that is missing too, the canvas gets .fx-seq--empty (skeleton) — never a broken image */

import { DPR_CAP } from '../core/gl-effect.js';

const DEFAULT_FALLBACK = '/renders/kit/hero-open.webp';
const CONCURRENCY = 6;
const WARMUP_CONCURRENCY = 3; // until the first and last frames are in
const DECODE_NEAR = 8; // frames within this distance of the playhead are decoded eagerly; others decode on draw

function loadImage(src, { decode = true, low = false } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    if (low) img.fetchPriority = 'low';
    img.onload = () => {
      // forcing decode() on all 121 frames would pin ~600 MB of bitmaps at 1280; only decode what is near
      (decode && img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(img));
    };
    img.onerror = () => reject(new Error('[fx] image failed: ' + src));
    img.src = src;
  });
}

function bisectionOrder(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const out = [0, n - 1];
  const seen = new Set(out);
  let spans = [[0, n - 1]];
  while (spans.length) {
    const next = [];
    for (const [a, b] of spans) {
      if (b - a < 2) continue;
      const m = (a + b) >> 1;
      if (!seen.has(m)) {
        seen.add(m);
        out.push(m);
      }
      next.push([a, m], [m, b]);
    }
    spans = next;
  }
  for (let i = 0; i < n; i++) if (!seen.has(i)) out.push(i);
  return out;
}

/* Normalises the supported manifest shapes into { sets: {key: [urls]}, width, height }.
   1. tools/optimize.py: { count, sizes: { "1280": { width, height, pattern: "/renders/sequence/1280/{i}.webp", pad }, … } }
      frames numbered from 0 (0000 … count-1), pad per size
   2. { count, start = 1, pad = 4, width, height, sets: { "1280": "1280/{####}.webp", … } }
   3. { count, frames: "pattern" | [urls] } */
export function parseManifest(json, baseURL) {
  const abs = (u) => new URL(u, baseURL).href;
  const start = json.start ?? (json.sizes ? 0 : 1);
  const expand = (spec, pad = json.pad ?? 4) => {
    if (Array.isArray(spec)) return spec.map(abs);
    if (typeof spec === 'string' && json.count) {
      return Array.from({ length: json.count }, (_, i) =>
        abs(spec.replace(/\{#+\}|\{i\}/, String(i + start).padStart(pad, '0'))));
    }
    return [];
  };
  const sets = {};
  let width = json.width;
  let height = json.height;
  if (json.sizes && typeof json.sizes === 'object') {
    for (const k of Object.keys(json.sizes)) {
      const sz = json.sizes[k] || {};
      sets[k] = expand(sz.pattern, sz.pad ?? json.pad ?? 4);
      if (!width && sz.width) { width = sz.width; height = sz.height; } // same aspect across sizes
    }
  } else if (json.sets) for (const k of Object.keys(json.sets)) sets[k] = expand(json.sets[k]);
  else if (json.frames) sets.default = expand(json.frames);
  return { sets, width: width || 1600, height: height || 1200 };
}

export class SequenceFX {
  constructor(canvas, ctx) {
    this.kind = 'sequence';
    this.canvas = canvas;
    this.ctx = ctx;
    this.g = canvas.getContext('2d', { alpha: true });
    this.fit = canvas.dataset.fit === 'cover' ? 'cover' : 'contain';
    this.manifestURL = canvas.dataset.manifest || '/renders/sequence/manifest.json';
    this.fallbackURL = canvas.dataset.fallback || DEFAULT_FALLBACK;
    this.progress = 0;
    this.frames = [];
    this.urls = [];
    this.inflight = new Set();
    this.queue = [];
    this.mode = 'loading';
    this.dirty = false;
    this.destroyed = false;
    this.drawn = -1;
    canvas.classList.add('fx-canvas', 'fx-seq', 'fx-seq--loading');
    this.resize();
    let resolveReady;
    this.ready = new Promise((r) => (resolveReady = r));
    this._resolveReady = resolveReady;
    this._armLoad();
  }

  /* Start loading after window load, once the canvas is within ~1.5 viewports (the pinned section then has
     about a viewport of scroll to warm up), or immediately on setProgress() (deep link / fast scroll). */
  _armLoad() {
    const start = () => {
      if (this._started || this.destroyed) return;
      this._started = true;
      this._io?.disconnect();
      this.load();
    };
    this._start = start;
    const afterLoad = (fn) => (document.readyState === 'complete' ? fn() : addEventListener('load', fn, { once: true }));
    afterLoad(() => {
      if (this._started || this.destroyed) return;
      if (!('IntersectionObserver' in window)) return start();
      this._io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && start(), { rootMargin: '150% 0px' });
      // observe the canvas's container: the site may keep the canvas display:none (a stills layer) until frames exist
      this._io.observe(this.canvas.parentElement || this.canvas);
    });
  }

  /* css width of the stage, even while the canvas itself is display:none */
  boxWidth() {
    return this.canvas.getBoundingClientRect().width || this.canvas.parentElement?.getBoundingClientRect().width || window.innerWidth;
  }

  get frameCount() {
    return this.urls.length;
  }
  get loadedCount() {
    return this.frames.filter(Boolean).length;
  }

  pickSet(sets) {
    const keys = Object.keys(sets).filter((k) => sets[k].length);
    if (!keys.length) return [];
    const numeric = keys.filter((k) => !isNaN(+k)).sort((a, b) => +a - +b);
    if (!numeric.length) return sets[keys[0]];
    const need = this.boxWidth() * Math.min(window.devicePixelRatio || 1, 2) * 0.85;
    // small screens / data-saver get the small set regardless
    const saver = navigator.connection?.saveData;
    const key = saver ? numeric[0] : numeric.find((k) => +k >= need) || numeric[numeric.length - 1];
    return sets[key];
  }

  async load() {
    let manifest = null;
    try {
      // no-cache = always revalidate (one 304 when unchanged): a 404 cached before the frames were published, or
      // an old manifest after a re-render, can never stick
      const res = await fetch(this.manifestURL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      manifest = parseManifest(json, new URL(this.manifestURL, location.href).href);
    } catch (e) {
      manifest = null;
    }
    if (this.destroyed) return;
    let urls = manifest ? this.pickSet(manifest.sets) : [];
    if (!urls.length) return this.useFallback();
    // Data Saver or a phone-sized stage: every 2nd frame is plenty for a scrubbed sequence (keep the last one)
    const narrow = this.boxWidth() < 600;
    if ((navigator.connection?.saveData || narrow) && urls.length > 40) {
      urls = urls.filter((_, i) => i % 2 === 0 || i === urls.length - 1);
    }

    this.urls = urls;
    this.frames = new Array(urls.length).fill(null);
    this.queue = bisectionOrder(urls.length);
    this.keyframes = new Set(this.queue.slice(0, 17)); // first, last + the first bisection levels: always decoded
    this.mode = 'sequence';
    this.canvas.dataset.fxFrames = String(urls.length);
    this.pump();
  }

  async useFallback() {
    const narrow = this.boxWidth() < 720;
    const half = this.fallbackURL.replace(/\.webp$/, '@half.webp');
    const tries = narrow ? [half, this.fallbackURL] : [this.fallbackURL, half];
    for (const src of tries) {
      try {
        const img = await loadImage(src);
        if (this.destroyed) return;
        this.mode = 'fallback';
        this.urls = [src];
        this.frames = [img];
        this.canvas.classList.remove('fx-seq--loading');
        this.canvas.classList.add('fx-seq--fallback');
        this.invalidate();
        this._resolveReady(this);
        return;
      } catch (e) {
        /* try next */
      }
    }
    this.mode = 'empty';
    this.canvas.classList.remove('fx-seq--loading');
    this.canvas.classList.add('fx-seq--empty');
    this._resolveReady(this);
  }

  pump() {
    const n = this.frames.length;
    const warm = this.frames[0] && this.frames[n - 1];
    const limit = warm ? CONCURRENCY : WARMUP_CONCURRENCY;
    while (this.inflight.size < limit && this.queue.length) {
      const i = this.queue.shift();
      if (this.frames[i] || this.inflight.has(i)) continue;
      this.inflight.add(i);
      const target = this.targetIndex();
      const near = Math.abs(i - target) <= DECODE_NEAR;
      loadImage(this.urls[i], { decode: near || this.keyframes?.has(i), low: i !== target })
        .then((img) => {
          if (this.destroyed) return;
          this.frames[i] = img;
          if (this.drawn < 0 || this.nearestLoaded(this.targetIndex()) === i) this.invalidate();
          if (this.drawn < 0 || i === 0) {
            this.canvas.classList.remove('fx-seq--loading');
            this._resolveReady(this);
          }
        })
        .catch(() => {
          /* a missing frame is skipped; nearestLoaded() bridges the gap */
        })
        .finally(() => {
          this.inflight.delete(i);
          if (!this.destroyed) {
            this.pump();
            // every frame failed (e.g. manifest points at nothing yet)
            if (!this.inflight.size && !this.queue.length && !this.frames.some(Boolean) && this.mode === 'sequence') {
              this.useFallback();
            }
          }
        });
    }
  }

  targetIndex() {
    const n = this.frames.length;
    return n ? Math.round(this.progress * (n - 1)) : 0;
  }

  nearestLoaded(i) {
    const f = this.frames;
    if (f[i]) return i;
    for (let d = 1; d < f.length; d++) {
      if (f[i - d]) return i - d; // prefer the earlier frame: reads as "not yet", not "skipped ahead"
      if (f[i + d]) return i + d;
    }
    return -1;
  }

  setProgress(p) {
    const v = Math.min(1, Math.max(0, +p || 0));
    if (v > 0) this._start?.(); // scrubbing into the section (or a fast scroll past it) starts loading now
    if (v === this.progress && this.drawn >= 0) return;
    this.progress = v;
    if (this.mode === 'sequence') {
      const i = this.targetIndex();
      if (!this.frames[i] && !this.inflight.has(i)) {
        // jump the queue: the frame being looked at, then its neighbours
        this.queue = [i, i + 1, i - 1, ...this.queue].filter((k) => k >= 0 && k < this.frames.length);
        this.pump();
      }
      if (this.nearestLoaded(i) !== this.drawn) this.invalidate();
    }
  }

  invalidate() {
    this.dirty = true;
    this.ctx.wake();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.drawn = -1;
      this.dirty = true;
    }
  }

  active() {
    return this.dirty && !this.destroyed;
  }

  tick() {
    this.dirty = false;
    const i = this.mode === 'fallback' ? 0 : this.nearestLoaded(this.targetIndex());
    const img = i >= 0 ? this.frames[i] : null;
    if (!img) return;
    const g = this.g;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const s = this.fit === 'cover' ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih);
    const dw = iw * s;
    const dh = ih * s;
    g.clearRect(0, 0, cw, ch);
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    this.drawn = i;
  }

  setTheme(name) {
    this.canvas.dataset.fxTheme = name;
  }

  destroy() {
    this.destroyed = true;
    this._io?.disconnect();
    this.queue = [];
    this.frames = [];
  }
}
