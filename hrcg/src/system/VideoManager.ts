// VideoManager (brief 8.5). Owner: A1.
// - Registry: every <LoopVideo id> registers here.
// - Loading: IntersectionObserver, rootMargin 150%: preload="metadata" + load(). Playback at >= 50% visible.
// - Decoders: at most 2 playing at once. Each sheet's priority list (manifest sheetVideoPriority)
//   decides which two of the visible videos play; the rest show posters. reserve() lets a video
//   that is not a LoopVideo (the hero film) hold a decoder slot.
// - Unloading: removeAttribute('src') + load() (sources stay as <source> children, preload none)
//   when a video is more than 3 viewports away.
// - play() rejected (Low Power Mode, autoplay policy): state 'blocked' -> LoopVideo shows ▶ PLAY.
// - Error: state 'error' -> poster stays, FILM UNAVAILABLE · POSTER SHOWN.
// - Pauses: off-screen, on visibilitychange, with MOTION OFF (poster shown).
// - Never gates paint or interaction.

import { isBrowser, queryParam } from './store';
import { prefsStore } from './prefs';
import { sheetVideoPriority, type MediaEntry } from '../media/manifest';

export const MAX_DECODERS = 2;

export type VideoState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'blocked'
  | 'error';

export interface RegisterOptions {
  entry?: MediaEntry;
  /** Sheet id whose priority list ranks this video ('A-101'); defaults to the closest [data-sheet]. */
  sheet?: string | null;
  /** Tie-break inside a sheet when the manifest has no list (lower plays first). */
  priority?: number;
  /** Plays when visible (default true). false = only by user (▶) or by play(id). */
  autoplay?: boolean;
  /** Loop (only when the manifest has a clean seam). Default: entry.loop != null. */
  loop?: boolean;
  /** Start position in seconds on first load (A-100 b44 starts at 2.60 s). */
  startAt?: number;
  /** Wrapper that receives data-state / data-user attributes (LoopVideo's root). */
  wrapper?: HTMLElement | null;
}

interface Reg {
  id: string;
  el: HTMLVideoElement;
  wrapper: HTMLElement | null;
  sheet: string | null;
  priority: number;
  autoplay: boolean;
  loop: boolean;
  startAt: number;
  order: number;
  near: boolean;
  ratio: number;
  loaded: boolean;
  everEnded: boolean;
  userPlay: boolean;
  state: VideoState;
  listeners: Set<(s: VideoState) => void>;
  cleanup: () => void;
}

const regs = new Map<string, Reg>();
const byEl = new WeakMap<Element, Reg>();
const reservations = new Set<string>();
let orderSeq = 0;
let nearIO: IntersectionObserver | null = null;
let visIO: IntersectionObserver | null = null;
let farIO: IntersectionObserver | null = null;
let bound = false;
let scheduled = false;

function setState(r: Reg, s: VideoState) {
  if (r.state === s) return;
  r.state = s;
  if (r.wrapper) r.wrapper.dataset.state = s;
  r.listeners.forEach((l) => l(s));
  debugRender();
}

function load(r: Reg) {
  if (r.loaded) return;
  r.loaded = true;
  r.el.preload = 'metadata';
  setState(r, 'loading');
  try {
    r.el.load();
  } catch {
    /* ignore */
  }
}

function unload(r: Reg) {
  if (!r.loaded) return;
  r.loaded = false;
  r.el.pause();
  r.el.preload = 'none';
  r.el.removeAttribute('src');
  try {
    r.el.load();
  } catch {
    /* ignore */
  }
  if (r.state !== 'error') setState(r, 'idle');
}

function rank(r: Reg): number {
  if (r.userPlay) return -1000;
  const list = r.sheet ? sheetVideoPriority[r.sheet] : undefined;
  const idx = list ? list.indexOf(r.id) : -1;
  return (idx >= 0 ? idx : 50) * 100 + r.priority;
}

function schedule() {
  if (scheduled || !isBrowser) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    run();
  });
}

function run() {
  const motion = prefsStore.get().motion;
  const hidden = document.visibilityState === 'hidden';
  const slots = Math.max(0, MAX_DECODERS - reservations.size);
  const candidates: Reg[] = [];
  for (const r of regs.values()) {
    const eligible =
      !hidden &&
      r.loaded &&
      r.ratio >= 0.5 &&
      r.state !== 'error' &&
      r.state !== 'blocked' &&
      (r.userPlay || (motion && r.autoplay && !(r.everEnded && !r.loop)));
    if (eligible) candidates.push(r);
    else if (!r.el.paused) r.el.pause();
  }
  candidates.sort((a, b) => rank(a) - rank(b) || b.ratio - a.ratio || a.order - b.order);
  candidates.forEach((r, i) => {
    if (i < slots) play(r);
    else if (!r.el.paused) r.el.pause();
  });
}

function play(r: Reg) {
  if (!r.el.paused) return;
  const p = r.el.play();
  if (p && typeof p.catch === 'function') {
    p.catch((err: unknown) => {
      const name = (err as { name?: string })?.name;
      if (name === 'NotAllowedError') {
        r.userPlay = false;
        setState(r, 'blocked');
      } else if (name === 'NotSupportedError') {
        setState(r, 'error');
      }
      // AbortError: a pause() interrupted play(); the scheduler decides again
    });
  }
}

function bind() {
  if (bound || !isBrowser || typeof IntersectionObserver === 'undefined') return;
  bound = true;
  nearIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const r = byEl.get(e.target);
        if (!r) continue;
        r.near = e.isIntersecting;
        if (r.near) load(r);
      }
      schedule();
    },
    { rootMargin: '150% 0px 150% 0px' },
  );
  visIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const r = byEl.get(e.target);
        if (!r) continue;
        r.ratio = e.isIntersecting ? e.intersectionRatio : 0;
        if (r.ratio === 0 && r.userPlay && r.el.paused === false) r.userPlay = false;
      }
      schedule();
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  farIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const r = byEl.get(e.target);
        if (r && !e.isIntersecting) unload(r);
      }
    },
    { rootMargin: '300% 0px 300% 0px' },
  );
  document.addEventListener('visibilitychange', schedule);
  prefsStore.subscribe(() => {
    if (!prefsStore.get().motion) {
      // MOTION OFF: pause every video within one frame (synchronously, not on the next rAF)
      for (const r of regs.values()) {
        r.userPlay = false;
        if (!r.el.paused) r.el.pause();
      }
    }
    schedule();
  });
  if (queryParam('debug') === 'video') debugMount();
  (window as unknown as { __hrcgVideos?: () => unknown }).__hrcgVideos = () =>
    [...regs.values()].map((r) => ({
      id: r.id,
      state: r.state,
      playing: !r.el.paused,
      ratio: Number(r.ratio.toFixed(2)),
      loaded: r.loaded,
      src: r.el.currentSrc,
    }));
}

export const videoManager = {
  /** Register a <video>. Returns an unregister fn. LoopVideo does this for you. */
  register(id: string, el: HTMLVideoElement, opts: RegisterOptions = {}): () => void {
    if (!isBrowser) return () => {};
    bind();
    const prev = regs.get(id);
    if (prev) prev.cleanup();
    const sheet =
      opts.sheet !== undefined ? opts.sheet : (el.closest<HTMLElement>('[data-sheet]')?.dataset.sheet ?? null);
    const r: Reg = {
      id,
      el,
      wrapper: opts.wrapper ?? null,
      sheet,
      priority: opts.priority ?? 0,
      autoplay: opts.autoplay ?? true,
      loop: opts.loop ?? (opts.entry ? opts.entry.loop != null : false),
      startAt: opts.startAt ?? 0,
      order: orderSeq++,
      near: false,
      ratio: 0,
      loaded: false,
      everEnded: false,
      userPlay: false,
      state: 'idle',
      listeners: new Set(),
      cleanup: () => {},
    };
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.controls = false;
    el.loop = r.loop;
    el.preload = 'none';
    el.removeAttribute('autoplay');
    if (r.wrapper) r.wrapper.dataset.state = 'idle';

    const on = (type: string, fn: () => void) => {
      el.addEventListener(type, fn);
      return () => el.removeEventListener(type, fn);
    };
    const offs = [
      on('loadedmetadata', () => {
        if (r.everEnded && !r.loop && Number.isFinite(el.duration)) {
          el.currentTime = Math.max(0, el.duration - 0.04); // hold the last frame after a reload
        } else if (r.startAt > 0 && el.currentTime < r.startAt) {
          el.currentTime = r.startAt;
        }
      }),
      on('loadeddata', () => {
        if (r.state === 'loading') setState(r, 'ready');
        schedule();
      }),
      on('playing', () => setState(r, 'playing')),
      on('pause', () => {
        if (r.state === 'playing') setState(r, el.ended ? 'ended' : 'paused');
      }),
      on('ended', () => {
        r.everEnded = true;
        r.userPlay = false;
        setState(r, 'ended');
        schedule();
      }),
      on('error', () => setState(r, 'error')),
    ];
    // a failing last <source> fires 'error' on the source element, not the video
    const sources = Array.from(el.querySelectorAll('source'));
    const last = sources[sources.length - 1];
    const onSourceError = () => {
      if (r.loaded) setState(r, 'error');
    };
    last?.addEventListener('error', onSourceError);

    r.cleanup = () => {
      offs.forEach((f) => f());
      last?.removeEventListener('error', onSourceError);
      nearIO?.unobserve(el);
      visIO?.unobserve(el);
      farIO?.unobserve(el);
      regs.delete(id);
      byEl.delete(el);
      schedule();
    };
    regs.set(id, r);
    byEl.set(el, r);
    nearIO?.observe(el);
    visIO?.observe(el);
    farIO?.observe(el);
    return () => r.cleanup();
  },

  /** User-initiated play (▶ PLAY): plays even under MOTION OFF, takes priority. */
  userPlay(id: string) {
    const r = regs.get(id);
    if (!r) return;
    r.userPlay = true;
    if (r.everEnded && !r.loop) {
      r.everEnded = false;
      r.el.currentTime = r.startAt || 0;
    }
    if (r.state === 'blocked') setState(r, 'paused');
    load(r);
    const p = r.el.play();
    p?.catch(() => setState(r, 'blocked'));
    schedule();
  },

  /** Programmatic play request (counts against the 2-decoder cap like autoplay). */
  request(id: string) {
    const r = regs.get(id);
    if (!r) return;
    r.autoplay = true;
    load(r);
    schedule();
  },

  pause(id: string) {
    const r = regs.get(id);
    if (!r) return;
    r.autoplay = false;
    r.userPlay = false;
    r.el.pause();
    schedule();
  },

  /** Reload the element's sources (after React swapped <source> children, e.g. a phone variant). */
  reload(id: string) {
    const r = regs.get(id);
    if (!r) return;
    const wasLoaded = r.loaded;
    r.loaded = false;
    if (wasLoaded || r.near) load(r);
  },

  state(id: string): VideoState {
    return regs.get(id)?.state ?? 'idle';
  },

  /** Subscribe to one video's state. */
  onState(id: string, fn: (s: VideoState) => void): () => void {
    const r = regs.get(id);
    if (!r) return () => {};
    r.listeners.add(fn);
    return () => {
      r.listeners.delete(fn);
    };
  },

  /**
   * Hold one decoder slot for a video the manager does not drive (the hero film while it plays).
   * Returns release().
   */
  reserve(key: string): () => void {
    reservations.add(key);
    schedule();
    return () => {
      reservations.delete(key);
      schedule();
    };
  },

  /** Ids currently playing (QA: never more than MAX_DECODERS). */
  playing(): string[] {
    return [...regs.values()].filter((r) => !r.el.paused).map((r) => r.id);
  },
};

// ---------- ?debug=video overlay ----------
let debugEl: HTMLElement | null = null;
function debugMount() {
  debugEl = document.createElement('pre');
  debugEl.setAttribute('aria-hidden', 'true');
  debugEl.style.cssText =
    'position:fixed;z-index:99999;top:80px;right:32px;margin:0;padding:8px 10px;background:#0B0B0A;color:#ECE8E1;font:11px/1.4 "JetBrains Mono",monospace;border:1px solid #9A958C;pointer-events:none;max-width:340px;white-space:pre-wrap';
  document.body.appendChild(debugEl);
  debugRender();
}
function debugRender() {
  if (!debugEl) return;
  const rows = [...regs.values()].map(
    (r) => `${r.el.paused ? '  ' : '▶ '}${r.id.padEnd(18)} ${r.state.padEnd(8)} ${r.ratio.toFixed(2)}`,
  );
  debugEl.textContent = `VIDEO ${videoManager.playing().length}/${MAX_DECODERS} (+${reservations.size} reserved)\n${rows.join('\n')}`;
}
