// The cursor's loupe over the Stage's screens (src/cursor, CURSOR.md §4), for every scene: each
// frame, every device that is drawn with a screen on it gets its projected corners and the image
// it shows written to a hidden span, so the loupe magnifies the real UI under the pointer, on any
// device, at any angle. The spans live in <body>, which carries data-cursor="loupe" only while a
// screen is on view (anything closer, a CTA, a link, text, still wins). Fine pointers only.

import * as THREE from "three";
import { writeLoupeQuad } from "../../cursor/loupe";
import { rig, type RigDevice } from "./devices";
import { liveScreens } from "./store";
import { nativeSize, screenUrl } from "./textures";
import { DEVICE_IDS, type DeviceId } from "./types";

const FINE = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Tag the cursor shows over each device's screen. */
const LABEL: Record<DeviceId, string> = { macbook: "Office", iphone: "Crew app", display: "Office" };
/** Lens diameter: the phone's screen is small, a smaller lens suits it. */
const SIZE: Record<DeviceId, number> = { macbook: 200, iphone: 168, display: 200 };

const V = new THREE.Vector3();
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export class StageLoupe {
  private spans = new Map<DeviceId, HTMLSpanElement>();
  private owned = false;
  private blobs = new Map<string, { version: number; url: string | null; pending: boolean }>();
  private corners = [0, 0, 0, 0, 0, 0, 0, 0];

  constructor() {
    if (!FINE || typeof document === "undefined") return;
    for (const id of DEVICE_IDS) {
      const s = document.createElement("span");
      s.hidden = true;
      s.className = "stage-loupe";
      s.setAttribute("data-loupe-space", "viewport");
      s.setAttribute("data-loupe-src", "");
      s.setAttribute("data-loupe-size", String(SIZE[id]));
      s.setAttribute("data-cursor-label", LABEL[id]);
      s.setAttribute("aria-hidden", "true");
      document.body.appendChild(s);
      this.spans.set(id, s);
    }
  }

  /** The image file the loupe should read for a screen id (live screens: a snapshot of the canvas). */
  private srcFor(id: string): { src: string; dpr: number } | null {
    if (id.startsWith("live:")) {
      const l = liveScreens.get(id.slice(5));
      if (!l || !(l.canvas instanceof HTMLCanvasElement)) return null;
      let b = this.blobs.get(id);
      if (!b) this.blobs.set(id, (b = { version: -1, url: null, pending: false }));
      if (b.version !== l.version && !b.pending) {
        const want = l.version;
        const entry = b;
        entry.pending = true;
        l.canvas.toBlob(
          (blob) => {
            entry.pending = false;
            if (!blob) return;
            if (entry.url) URL.revokeObjectURL(entry.url);
            entry.url = URL.createObjectURL(blob);
            entry.version = want;
          },
          "image/webp",
          0.92,
        );
      }
      return b.url ? { src: b.url, dpr: l.canvas.width / l.w } : null;
    }
    const n = nativeSize(id, 1440, 900);
    return { src: screenUrl(id), dpr: n.w === 402 ? 3 : 2 };
  }

  private off(id: DeviceId) {
    const el = this.spans.get(id);
    if (!el || el.getAttribute("data-loupe-src") === "") return;
    el.setAttribute("data-loupe-src", "");
    el.removeAttribute("data-loupe-quad");
  }

  /** Per frame, after the devices are posed. */
  update(camera: THREE.Camera, W: number, H: number) {
    if (!this.spans.size) return;
    // no lens over a screen while the popup covers the page
    const blocked = document.documentElement.dataset.signup === "open";
    let any = false;
    for (const id of DEVICE_IDS) {
      const d = rig.get(id);
      const el = this.spans.get(id)!;
      if (blocked || !d || !d.group.visible || !d.surface.cur.id || !d.surface.cur.tex || d.group.scale.x < 1e-3) {
        this.off(id);
        continue;
      }
      const src = this.srcFor(d.surface.cur.id);
      const win = d.surface.visibleWindow();
      if (!src || !win) {
        this.off(id);
        continue;
      }
      any = true;
      if (el.getAttribute("data-loupe-src") !== src.src) el.setAttribute("data-loupe-src", src.src);
      const crop = `${r4(win.win[0] / win.w)},${r4(win.win[1] / win.h)},${r4(win.win[2] / win.w)},${r4(win.win[3] / win.h)}`;
      if (el.getAttribute("data-loupe-crop") !== crop) el.setAttribute("data-loupe-crop", crop);
      const dpr = String(Math.round(src.dpr * 100) / 100);
      if (el.getAttribute("data-loupe-dpr") !== dpr) el.setAttribute("data-loupe-dpr", dpr);
      this.writeQuad(d, el, camera, W, H);
    }
    // later in the DOM is in front for the cursor: keep the phone (usually in front) last
    const body = document.body;
    if (any && !this.owned && !body.hasAttribute("data-cursor")) {
      body.setAttribute("data-cursor", "loupe");
      this.owned = true;
    } else if (!any && this.owned) {
      body.removeAttribute("data-cursor");
      this.owned = false;
    }
  }

  private writeQuad(d: RigDevice, el: HTMLElement, camera: THREE.Camera, W: number, H: number) {
    const { o, u, v } = d.surface.plane;
    const c = this.corners;
    const pts = [0, 0, 1, 0, 1, 1, 0, 1];
    for (let k = 0; k < 4; k++) {
      V.copy(o).addScaledVector(u, pts[k * 2]).addScaledVector(v, pts[k * 2 + 1]);
      d.screenMesh.localToWorld(V).project(camera);
      c[k * 2] = ((V.x + 1) / 2) * W;
      c[k * 2 + 1] = ((1 - V.y) / 2) * H;
    }
    writeLoupeQuad(el, c);
  }

  dispose() {
    this.spans.forEach((s) => s.remove());
    this.spans.clear();
    if (this.owned) document.body.removeAttribute("data-cursor");
    this.owned = false;
    this.blobs.forEach((b) => b.url && URL.revokeObjectURL(b.url));
    this.blobs.clear();
  }
}
