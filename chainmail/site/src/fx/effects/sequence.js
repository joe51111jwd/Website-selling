/* sequence — progressive canvas image-sequence player.
   - reads a manifest (see README), picks the 1280 or 720 set for the viewport
   - preload order: first, last, then bisection (mid, quarters, eighths…) so scrubbing is never blank;
     a frame the user scrubs to jumps the queue
   - draws the nearest loaded frame with object-fit contain/cover semantics
   - manifest 404 / bad JSON -> static fallback image (default /renders/kit/hero-open.webp);
     if that is missing too, the canvas gets .fx-seq--empty (skeleton) — never a broken image */

import { DPR_CAP } from '../core/gl-effect.js';

const DEFAULT_FALLBACK = '/renders/kit/hero-open.webp';
const CONCURRENCY = 6;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(img));
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

/* Normalises the supported manifest shapes into { sets: {key: [urls]}, width, height }. */
export function parseManifest(json, baseURL) {
  const abs = (u) => new URL(u, baseURL).href;
  const pad = json.pad ?? 4;
  const start = json.start ?? 1;
  const expand = (spec) => {
    if (Array.isArray(spec)) return spec.map(abs);
    if (typeof spec === 'string' && json.count) {
      return Array.from({ length: json.count }, (_, i) => {
        const n = String(i + start).padStart(pad, '0');
        return abs(spec.replace(/\{#+\}|\{i\}/, n));
      });
    }
    return [];
  };
  const sets = {};
  if (json.sets) for (const k of Object.keys(json.sets)) sets[k] = expand(json.sets[k]);
  else if (json.frames) sets.default = expand(json.frames);
  return { sets, width: json.width || 1600, height: json.height || 1200 };
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
    this.load();
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
    const rect = this.canvas.getBoundingClientRect();
    const need = (rect.width || window.innerWidth) * Math.min(window.devicePixelRatio || 1, 2) * 0.85;
    // small screens / data-saver get the small set regardless
    const saver = navigator.connection?.saveData;
    const key = saver ? numeric[0] : numeric.find((k) => +k >= need) || numeric[numeric.length - 1];
    return sets[key];
  }

  async load() {
    let manifest = null;
    try {
      const res = await fetch(this.manifestURL, { cache: 'force-cache' });
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      manifest = parseManifest(json, new URL(this.manifestURL, location.href).href);
    } catch (e) {
      manifest = null;
    }
    if (this.destroyed) return;
    const urls = manifest ? this.pickSet(manifest.sets) : [];
    if (!urls.length) return this.useFallback();

    this.urls = urls;
    this.frames = new Array(urls.length).fill(null);
    this.queue = bisectionOrder(urls.length);
    this.mode = 'sequence';
    this.canvas.dataset.fxFrames = String(urls.length);
    this.pump();
  }

  async useFallback() {
    const narrow = (this.canvas.getBoundingClientRect().width || innerWidth) < 720;
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
    while (this.inflight.size < CONCURRENCY && this.queue.length) {
      const i = this.queue.shift();
      if (this.frames[i] || this.inflight.has(i)) continue;
      this.inflight.add(i);
      loadImage(this.urls[i])
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
    this.queue = [];
    this.frames = [];
  }
}
