// ?capture deterministic frame mode (brief G16, 4.1). Owner: A1.
// Scenes register a pure seek(t); scripts/capture.mjs (A5) drives them through window.__hrcgCapture:
//
//   await page.goto(url + '?capture');
//   await page.waitForFunction(() => window.__hrcgCapture?.ready);
//   await page.evaluate(() => window.__hrcgCapture.list());              // ['hero', 'slice', ...]
//   await page.evaluate(([n, t]) => window.__hrcgCapture.seek(n, t), ['hero', 4.3]);
//   await page.screenshot(...)
//
// In capture mode the head script adds `capture` to <html>: Lenis stays off, CSS transitions and
// animations are disabled (base.css), and videos are driven only by the scenes' seek().

import { isBrowser } from './store';

export interface CaptureScene {
  /** seconds */
  duration: number;
  /** Render the frame at time t (seconds). Resolve once the frame is fully painted (await `seeked`, fonts…). */
  seek(t: number): Promise<void>;
}

const scenes = new Map<string, CaptureScene>();
let readyResolve: (() => void) | null = null;

export function isCapture(): boolean {
  return isBrowser && document.documentElement.classList.contains('capture');
}

export function registerCaptureScene(name: string, scene: CaptureScene): () => void {
  scenes.set(name, scene);
  install();
  return () => {
    if (scenes.get(name) === scene) scenes.delete(name);
  };
}

interface CaptureApi {
  ready: boolean;
  whenReady: Promise<void>;
  list(): string[];
  duration(name: string): number | null;
  seek(name: string, t: number): Promise<void>;
}

declare global {
  interface Window {
    __hrcgCapture?: CaptureApi;
  }
}

function install() {
  if (!isBrowser || window.__hrcgCapture) return;
  const whenReady = new Promise<void>((res) => {
    readyResolve = res;
  });
  const api: CaptureApi = {
    ready: false,
    whenReady,
    list: () => [...scenes.keys()],
    duration: (name) => scenes.get(name)?.duration ?? null,
    async seek(name, t) {
      const s = scenes.get(name);
      if (!s) throw new Error(`capture scene "${name}" is not registered`);
      const clamped = Math.max(0, Math.min(s.duration, t));
      await s.seek(clamped);
      // two frames so the seek's DOM/GL writes are on screen before the screenshot
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    },
  };
  window.__hrcgCapture = api;
}

/** The app shell calls this after hydration and fonts.ready. */
export function markCaptureReady() {
  if (!isBrowser) return;
  install();
  const api = window.__hrcgCapture!;
  if (api.ready) return;
  api.ready = true;
  readyResolve?.();
}
