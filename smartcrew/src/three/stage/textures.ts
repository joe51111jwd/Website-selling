// Screen textures: loaded once, decoded off the main thread where the browser can, kept crisp
// (sRGB, mipmaps, max anisotropy), and evicted least-recently-used so phones don't run out of
// GPU memory. Live screens (canvas / video) come from store.liveScreens.

import * as THREE from "three";
import { liveScreens, phone } from "./store";

export type ScreenTex = { tex: THREE.Texture; w: number; h: number; live?: string; version?: number };

/** Native CSS px size of the recreated screens (src/screens/registry.ts SIZE). */
const NATIVE = { web: { w: 1440, h: 900 }, phone: { w: 402, h: 874 } };

const base = import.meta.env.BASE_URL;
export const screenUrl = (id: string) => (id.includes("/") || id.includes(".") ? base + id.replace(/^\//, "") : `${base}screens/${id}.webp`);

type Entry = { tex: ScreenTex | null; promise: Promise<ScreenTex | null>; used: number };
const cache = new Map<string, Entry>();
const MAX = phone ? 6 : 12;
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

function nativeSize(id: string, iw: number, ih: number) {
  if (id.startsWith("web-")) return NATIVE.web;
  if (id.startsWith("phone-")) return NATIVE.phone;
  return { w: iw, h: ih };
}

/** Start loading a screen (no-op if cached). */
export function loadScreen(id: string): Promise<ScreenTex | null> {
  if (id.startsWith("live:")) return Promise.resolve(getScreen(id));
  const hit = cache.get(id);
  if (hit) {
    hit.used = performance.now();
    return hit.promise;
  }
  // phones show the laptop small: a 1920-wide web screen is plenty and saves ~45% memory
  const maxW = phone && id.startsWith("web-") ? 1920 : 4096;
  const entry: Entry = { tex: null, used: performance.now(), promise: Promise.resolve(null) };
  entry.promise = decode(screenUrl(id), maxW)
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
  if (loaded.length <= MAX) return;
  loaded
    .filter(([id]) => !pinned.has(id))
    .sort((a, b) => a[1].used - b[1].used)
    .slice(0, loaded.length - MAX)
    .forEach(([id, e]) => {
      e.tex?.tex.dispose();
      cache.delete(id);
    });
}
