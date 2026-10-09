import * as THREE from "three";
import type { Media } from "../../content/work";
import { clamp, easeInOutExpo, easeOutExpo, isTouch, lerp, onTick, reducedMotion, scroll } from "../ticker";
import { lens } from "../cursor";
import { fragment, vertex } from "./shaders";

/**
 * The WebGL stage: a fixed, transparent canvas behind the page. Every image
 * and film is a plane that copies the position and size of its DOM element
 * each frame, so layout stays in CSS while the pixels go through the shader.
 * A second canvas above the page carries the few planes that must float over
 * text: the hover preview and the picture flying into a case study.
 * If WebGL is unavailable the DOM images simply stay visible.
 */

export type Rect = { x: number; y: number; w: number; h: number };

type TexEntry = {
  texture: THREE.Texture;
  size: THREE.Vector2;
  ready: Promise<void>;
  loaded: boolean;
  video?: HTMLVideoElement;
};

export type PlaneOptions = {
  /** Animate in the first time it scrolls into view. */
  reveal?: boolean;
  /** How far the picture drifts inside its frame as it crosses the screen. */
  parallax?: number;
  /** Zoom the picture in its frame; parallax needs some. */
  zoom?: number;
  radius?: number;
  /** Ripple and zoom on hover. */
  hover?: boolean;
  /** Bend with scroll speed. */
  bend?: boolean;
  /** Show the blueprint under the cursor lens. */
  xray?: boolean;
  /** Draw above other planes. */
  top?: boolean;
  /** Ignore the page fade used during transitions. */
  keep?: boolean;
};

const BLUE = new THREE.Color("#2036f0");

const shared = {
  uTime: { value: 0 },
  uVel: { value: 0 },
  uMotion: { value: reducedMotion ? 0 : 1 },
  uStructure: { value: 0 },
  uLens: { value: new THREE.Vector3() },
  uBlue: { value: new THREE.Vector3(BLUE.r, BLUE.g, BLUE.b) },
  uPage: { value: 1 },
};
const KEEP_PAGE = { value: 1 };

type Layer = { renderer: THREE.WebGLRenderer; scene: THREE.Scene; shown: number; drewEmpty: boolean };
let back: Layer | null = null;
let front: Layer | null = null;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
const geometry = new THREE.PlaneGeometry(1, 1, 24, 24);
const cache = new Map<string, TexEntry>();
const planes = new Set<Plane>();
const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
blank.needsUpdate = true;

let W = window.innerWidth;
let H = window.innerHeight;
let structureTarget = 0;

export class Plane {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  readonly u: Record<string, THREE.IUniform>;
  el: HTMLElement | null = null;
  rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  tex: [TexEntry | null, TexEntry | null] = [null, null];
  opts: PlaneOptions;
  hoverTarget = 0;
  revealStart = -1;
  revealed = false;
  visible = false;
  alpha = 1;
  readonly layer: Layer;
  /** Tilt in radians, for planes that swing as they move. */
  rotation = 0;
  private cleanup: (() => void) | null = null;

  constructor(opts: PlaneOptions) {
    this.opts = opts;
    this.u = {
      ...shared,
      uPage: opts.keep ? KEEP_PAGE : shared.uPage,
      uTex0: { value: blank },
      uTex1: { value: blank },
      uRes0: { value: new THREE.Vector2(1, 1) },
      uRes1: { value: new THREE.Vector2(1, 1) },
      uMix: { value: 0 },
      uSize: { value: new THREE.Vector2(1, 1) },
      uHover: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uReveal: { value: opts.reveal && !reducedMotion ? 0 : 1 },
      uAlpha: { value: 1 },
      uParallax: { value: 0 },
      uZoom: { value: opts.zoom ?? 1 + (opts.parallax ?? 0) },
      uRadius: { value: opts.radius ?? 0 },
      uLensOn: { value: opts.xray === false ? 0 : 1 },
      uBend: { value: opts.bend === false || reducedMotion ? 0 : 1.6 },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: this.u,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.renderOrder = opts.top ? 10 : 0;
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
    this.layer = (opts.top && front) || back!;
    this.layer.scene.add(this.mesh);
    planes.add(this);
  }

  /** Follow a DOM element. */
  track(el: HTMLElement) {
    this.el = el;
    if (this.opts.hover && !isTouch) {
      const enter = () => (this.hoverTarget = 1);
      const leave = () => (this.hoverTarget = 0);
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        (this.u.uMouse.value as THREE.Vector2).set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      };
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      el.addEventListener("pointermove", move);
      this.cleanup = () => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
        el.removeEventListener("pointermove", move);
      };
    }
    return this;
  }

  setRect(r: Rect) {
    this.rect = r;
  }

  /** Show one picture, or two with a wipe between them (mix 0 → 1). */
  show(a: Media, b?: Media | null, mix = 0) {
    this.tex[0] = load(a);
    this.tex[1] = b ? load(b) : null;
    this.u.uMix.value = b ? mix : 0;
    const first = this.tex[0];
    if (this.el && first.loaded) this.el.classList.add("gl-on");
    else first.ready.then(() => first.loaded && this.tex[0] === first && this.el?.classList.add("gl-on"));
  }

  set(name: string, value: number) {
    this.u[name].value = value;
  }

  get ready() {
    return !!this.tex[0]?.loaded;
  }

  dispose() {
    this.cleanup?.();
    this.el?.classList.remove("gl-on");
    this.layer.scene.remove(this.mesh);
    this.mesh.material.dispose();
    planes.delete(this);
  }

  update(time: number) {
    const el = this.el;
    if (el) {
      const r = el.getBoundingClientRect();
      this.rect = { x: r.left, y: r.top, w: r.width, h: r.height };
    }
    const { x, y, w, h } = this.rect;
    const t0 = this.tex[0];
    this.visible = !!t0 && t0.loaded && w > 1 && h > 1 && y < H + 120 && y + h > -120 && x < W + 120 && x + w > -120 && this.alpha > 0.001;
    this.mesh.visible = this.visible;
    if (!this.visible) return;

    // reveal the first time the plane is well into the viewport
    if (this.opts.reveal && !this.revealed && y < H * 0.92) {
      this.revealed = true;
      this.revealStart = time;
    }
    if (this.revealStart >= 0) {
      const t = clamp((time - this.revealStart) / 1500);
      this.u.uReveal.value = easeOutExpo(t);
      if (t >= 1) this.revealStart = -1;
    }

    this.u.uHover.value = lerp(this.u.uHover.value as number, this.hoverTarget, 0.08);
    if (this.opts.parallax) this.u.uParallax.value = clamp(((y + h / 2) - H / 2) / ((H + h) / 2), -1, 1);
    this.u.uAlpha.value = this.alpha;

    this.mesh.position.set(x + w / 2 - W / 2, H / 2 - y - h / 2, 0);
    this.mesh.rotation.z = this.rotation;
    this.mesh.scale.set(w, h, 1);
    (this.u.uSize.value as THREE.Vector2).set(w, h);
    this.u.uTex0.value = t0!.texture;
    (this.u.uRes0.value as THREE.Vector2).copy(t0!.size);
    const t1 = this.tex[1];
    this.u.uTex1.value = t1?.loaded ? t1.texture : t0!.texture;
    (this.u.uRes1.value as THREE.Vector2).copy(t1?.loaded ? t1.size : t0!.size);
  }
}

function load(media: Media): TexEntry {
  const key = media.src;
  const hit = cache.get(key);
  if (hit) return hit;

  const size = new THREE.Vector2(16, 10);
  const entry = { size, loaded: false } as TexEntry;

  const image = (src: string, done: () => void, fail: () => void) => {
    const tex = new THREE.TextureLoader().load(
      src,
      (t) => {
        const img = t.image as HTMLImageElement;
        size.set(img.naturalWidth || img.width, img.naturalHeight || img.height);
        done();
      },
      undefined,
      fail,
    );
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 4;
    return tex;
  };

  if (media.kind === "video") {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.src = media.src;
    entry.video = video;
    // the poster stands in until the film has frames to show
    entry.ready = new Promise<void>((resolve) => {
      const showFilm = () => {
        const vt = new THREE.VideoTexture(video);
        vt.minFilter = THREE.LinearFilter;
        vt.magFilter = THREE.LinearFilter;
        vt.generateMipmaps = false;
        size.set(video.videoWidth, video.videoHeight);
        entry.texture = vt;
        entry.loaded = true;
        resolve();
      };
      if (media.poster) {
        entry.texture = image(
          media.poster,
          () => {
            if (!(entry.texture instanceof THREE.VideoTexture)) {
              entry.loaded = true;
              resolve();
            }
          },
          () => {},
        );
      } else entry.texture = blank;
      video.addEventListener("loadeddata", showFilm, { once: true });
      // a missing film shouldn't hold anything up; the DOM image stays
      video.addEventListener("error", () => resolve(), { once: true });
      video.load();
    });
  } else {
    entry.ready = new Promise<void>((resolve) => {
      entry.texture = image(
        media.src,
        () => {
          entry.loaded = true;
          resolve();
        },
        () => resolve(),
      );
    });
  }
  cache.set(key, entry);
  return entry;
}

function resize() {
  if (!back) return;
  W = window.innerWidth;
  // the canvases are 100lvh tall so mobile toolbars don't make them jump
  H = Math.max(back.renderer.domElement.clientHeight, window.innerHeight);
  back.renderer.setSize(W, H, false);
  front?.renderer.setSize(W, H, false);
  camera.left = -W / 2;
  camera.right = W / 2;
  camera.top = H / 2;
  camera.bottom = -H / 2;
  camera.updateProjectionMatrix();
}

let flights = 0;

function makeLayer(canvas: HTMLCanvasElement | null): Layer | null {
  if (!canvas) return null;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.75 : 2));
    renderer.setClearColor(0x000000, 0);
    return { renderer, scene: new THREE.Scene(), shown: 0, drewEmpty: false };
  } catch {
    return null;
  }
}

/** Draw a layer, or once more to clear it when it has nothing left to show. */
function draw(layer: Layer | null) {
  if (!layer) return;
  if (layer.shown > 0 || !layer.drewEmpty) layer.renderer.render(layer.scene, camera);
  layer.drewEmpty = layer.shown === 0;
  layer.shown = 0;
}

export const stage = {
  enabled: false,

  /** Start rendering. Returns false if WebGL isn't available. */
  mount(backCanvas: HTMLCanvasElement, frontCanvas?: HTMLCanvasElement | null) {
    if (back) return true;
    back = makeLayer(backCanvas);
    if (!back) return false;
    front = makeLayer(frontCanvas ?? null);
    stage.enabled = true;
    document.documentElement.classList.add("has-gl");
    resize();
    window.addEventListener("resize", resize);

    onTick((time) => {
      shared.uTime.value = time / 1000;
      shared.uVel.value = reducedMotion ? 0 : scroll.velocity;
      const s = shared.uStructure.value;
      shared.uStructure.value = Math.abs(structureTarget - s) < 0.002 ? structureTarget : lerp(s, structureTarget, 0.09);
      const dpr = back!.renderer.getPixelRatio();
      (shared.uLens.value as THREE.Vector3).set(lens.x * dpr, (H - lens.y) * dpr, lens.r * dpr);

      const playing = new Set<HTMLVideoElement>();
      planes.forEach((p) => {
        p.update(time);
        if (!p.visible) return;
        p.layer.shown++;
        for (const t of p.tex) if (t?.video && (t === p.tex[0] || (p.u.uMix.value as number) > 0.001)) playing.add(t.video);
      });
      cache.forEach((t) => {
        if (!t.video) return;
        if (playing.has(t.video)) {
          if (t.video.paused) t.video.play().catch(() => {});
        } else if (!t.video.paused) t.video.pause();
      });
      draw(back);
      draw(front);
    });
    return true;
  },

  /** A plane that follows `el` and shows `media`. */
  track(el: HTMLElement, media: Media, opts: PlaneOptions = {}) {
    const p = new Plane(opts).track(el);
    p.show(media);
    return p;
  },

  /** A plane you position yourself with setRect. */
  free(opts: PlaneOptions = {}) {
    return new Plane(opts);
  },

  /** Fetch pictures ahead of time; resolves when all are ready. */
  preload(media: Media[], onEach?: () => void) {
    return Promise.all(
      media.map((m) =>
        load(m).ready.then(() => {
          onEach?.();
        }),
      ),
    );
  },

  isReady(media: Media) {
    return !!cache.get(media.src)?.loaded;
  },

  setStructure(on: boolean, instant: boolean) {
    structureTarget = on ? 1 : 0;
    if (instant || reducedMotion) shared.uStructure.value = structureTarget;
  },

  /** Fade every plane on the page except the ones marked `keep`. */
  setPage(alpha: number) {
    shared.uPage.value = alpha;
  },

  get flying() {
    return flights > 0;
  },

  /**
   * Lift a picture out of the page and fly it to a new rect. Used for the
   * shared-element transition into a case study.
   */
  fly(media: Media, from: Rect, fromZoom = 1) {
    const plane = new Plane({ keep: true, top: true, bend: false, xray: false, zoom: fromZoom });
    plane.setRect(from);
    plane.show(media);
    flights++;
    let disposed = false;
    return {
      plane,
      to(target: Rect, duration = 1100, zoom = fromZoom) {
        return new Promise<void>((resolve) => {
          const start = performance.now();
          const stop = onTick((time) => {
            const t = clamp((time - start) / duration);
            const e = reducedMotion ? 1 : easeInOutExpo(t);
            plane.setRect({
              x: lerp(from.x, target.x, e),
              y: lerp(from.y, target.y, e),
              w: lerp(from.w, target.w, e),
              h: lerp(from.h, target.h, e),
            });
            plane.set("uZoom", lerp(fromZoom, zoom, e));
            if (t >= 1) {
              stop();
              resolve();
            }
          });
        });
      },
      done() {
        if (disposed) return;
        disposed = true;
        flights--;
        plane.dispose();
      },
    };
  },
};

if (import.meta.env.DEV) (window as unknown as { __gl: unknown }).__gl = { cache, planes, stage };
