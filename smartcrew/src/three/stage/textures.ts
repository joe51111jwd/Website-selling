// Screen textures: loaded once, decoded off the main thread where the browser can, kept crisp
// (sRGB, mipmaps, max anisotropy), and evicted least-recently-used so phones don't run out of
// GPU memory. Live screens (canvas / video) come from store.liveScreens.

import * as THREE from "three";
import { liveScreens, phone } from "./store";

export type ScreenTex = { tex: THREE.Texture; w: number; h: number; live?: string; version?: number };

import { nativeSize, screenUrl } from "./urls";
export { nativeSize, screenUrl };

type Entry = { tex: ScreenTex | null; promise: Promise<ScreenTex | null>; used: number };
const cache = new Map<string, Entry>();
// Phones decode screens at the size they're shown (phone screens 804 px wide, web 1440: about a
// third of the desktop textures' memory each), so they can keep the next moments' screens around
// without evicting them before they're used.
/** ?stageCap (frame-by-frame captures): keep every screen (a capture walks a whole film). */
const CAP = typeof location !== "undefined" && new URLSearchParams(location.search).has("stageCap");
const MAX = phone ? 10 : CAP ? 48 : 12;
/** ?stageHQ (rendering stills): screens at their full size. */
const HQ = typeof location !== "undefined" && new URLSearchParams(location.search).has("stageHQ");
/**
 * GPU memory the screens may take (MB, RGBA with mipmaps). Past it the least-recently-used screens
 * that are neither on a device nor coming up next are let go. A screen in use or coming up is never
 * evicted, so a long prefetch can go over for a moment instead of decoding the same image again.
 */
const BUDGET_MB = CAP || HQ ? Infinity : 48;
const wanted = new Set<string>();
/** The screens coming up (the Stage's prefetch): kept while the budget allows anything else to go. */
export function wantScreens(ids: Iterable<string>) {
  wanted.clear();
  for (const id of ids) wanted.add(id);
  evict();
}
const texBytes = (e: Entry) => {
  const img = e.tex?.tex.image as { width?: number; height?: number } | undefined;
  return img?.width && img.height ? img.width * img.height * 4 * (4 / 3) : 0;
};
let inflight = 0;
/** Screens still loading (captures wait for none before drawing a frame). */
export const screensLoading = () => inflight;
/** GPU memory the cached screen textures take (RGBA, with mipmaps), MB: for the perf checks. */
export function screenTextureMB() {
  let b = 0;
  cache.forEach((e) => (b += texBytes(e)));
  return Math.round((b / 1048576) * 10) / 10;
}
let renderer: THREE.WebGLRenderer | null = null;
let onLoaded: (() => void) | null = null;

export function initTextures(gl: THREE.WebGLRenderer, loaded: () => void) {
  renderer = gl;
  onLoaded = loaded;
}

async function decode(url: string, maxW: number): Promise<ImageBitmap | HTMLImageElement> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const blob = await res.blob();
  if ("createImageBitmap" in window) {
    try {
      const probe = await createImageBitmap(blob);
      if (probe.width <= maxW) return probe;
      const h = Math.round((probe.height * maxW) / probe.width);
      probe.close();
      return await createImageBitmap(blob, { resizeWidth: maxW, resizeHeight: h, resizeQuality: "high" });
    } catch {
      /* fall through to <img> */
    }
  }
  const img = new Image();
  img.decoding = "async";
  img.src = URL.createObjectURL(blob);
  await img.decode();
  return img;
}

function finish(tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 8;
  tex.needsUpdate = true;
  return tex;
}


/** Start loading a screen (no-op if cached). */
export function loadScreen(id: string): Promise<ScreenTex | null> {
  if (id.startsWith("live:")) return Promise.resolve(getScreen(id));
  const hit = cache.get(id);
  if (hit) {
    hit.used = performance.now();
    return hit.promise;
  }
  // Decoded at the size they're shown. Desktop: the laptop's screen is at most ~1170 CSS px wide
  // (One Day's push-ins at 1440 wide), so 2048 px covers it at the Stage's 1.5 DPR cap (14 MB with
  // mipmaps instead of 28 MB at 2880); the phone's screen is at most ~400 CSS px tall, so 804 px
  // wide (1748 tall) is plenty (7.5 MB instead of 17). Phones show the laptop small: 1440.
  const name = id.split("/").pop() ?? id;
  const web = name.startsWith("web-");
  const ph = name.startsWith("phone-");
  const maxW = HQ ? 4096 : phone ? (web ? 1440 : ph ? 804 : 1920) : web ? 2048 : ph ? 804 : 2048;
  const entry: Entry = { tex: null, used: performance.now(), promise: Promise.resolve(null) };
  inflight++;
  entry.promise = decode(screenUrl(id), maxW)
    .finally(() => inflight--)
    .then((img) => {
      const tex = finish(new THREE.Texture(img as unknown as HTMLImageElement));
      const n = nativeSize(id, img.width, img.height);
      entry.tex = { tex, w: n.w, h: n.h };
      if (renderer) renderer.initTexture(tex); // upload now, not on the frame it first shows
      evict();
      onLoaded?.();
      return entry.tex;
    })
    .catch((e) => {
      console.warn("[stage] screen failed", id, e);
      cache.delete(id);
      return null;
    });
  cache.set(id, entry);
  return entry.promise;
}

const liveTex = new Map<string, ScreenTex>();

/** A loaded screen, or null (then call loadScreen). Touches the LRU. */
export function getScreen(id: string): ScreenTex | null {
  if (id.startsWith("live:")) {
    const name = id.slice(5);
    const src = liveScreens.get(name);
    if (!src) return null;
    let t = liveTex.get(name);
    if (!t || t.tex.image !== src.canvas) {
      t?.tex.dispose();
      const tex = src.canvas instanceof HTMLVideoElement ? new THREE.VideoTexture(src.canvas) : new THREE.CanvasTexture(src.canvas);
      finish(tex);
      if (src.canvas instanceof HTMLVideoElement) {
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
      }
      t = { tex, w: src.w, h: src.h, live: name, version: src.version };
      liveTex.set(name, t);
    }
    if (t.version !== src.version) {
      t.version = src.version;
      t.tex.needsUpdate = true;
    }
    return t;
  }
  const e = cache.get(id);
  if (!e) return null;
  e.used = performance.now();
  return e.tex;
}

const pinned = new Set<string>();
/** Screens on a device right now can't be evicted. */
export function pinScreens(ids: Iterable<string>) {
  pinned.clear();
  for (const id of ids) pinned.add(id);
}

function evict() {
  const loaded = [...cache.entries()].filter(([, e]) => e.tex);
  let n = loaded.length;
  let bytes = loaded.reduce((b, [, e]) => b + texBytes(e), 0);
  const budget = BUDGET_MB * 1048576;
  if (n <= MAX && bytes <= budget) return;
  const free = (id: string, e: Entry) => {
    n--;
    bytes -= texBytes(e);
    e.tex?.tex.dispose();
    cache.delete(id);
  };
  const lru = loaded.filter(([id]) => !pinned.has(id)).sort((a, b) => a[1].used - b[1].used);
  // first the ones nobody wants soon, then (only over the count) the coming-up ones
  for (const [id, e] of lru) if ((n > MAX || bytes > budget) && !wanted.has(id)) free(id, e);
  for (const [id, e] of lru) if (n > MAX && cache.has(id)) free(id, e);
}
