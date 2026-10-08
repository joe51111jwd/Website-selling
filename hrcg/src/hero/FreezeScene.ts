// HeroScene: the frozen 3D VIEW of frame 84 (brief 4.1, 8.4). Owner: A2.
// LAZY CHUNK: imported only through import() by CoverStage's controller; never at module scope of
// anything App imports (three stays out of the shell and the prerender).
//
// Raw three 0.186: WebGLRenderer, Scene, PerspectiveCamera, Mesh, ShaderMaterial. No R3F, drei or
// maath. Draw calls: plate 1, mesh 1, type planes 4 (<= 6, QA H9). One context, disposed by the
// controller after the plan cut (P 0.10). Renders on demand; the controller runs the rig.
//
// Mesh: (cols-1) x (rows-1) quads plus one overscan ring (12 %, edge-clamped depth and UV).
// Depth is baked per vertex on the CPU from hero-depth-*.bin (Uint16 LE, vertex samples):
//   z = 1 / (a + b * d),  pos = (ndc.xy * z / f, -z),  ndc in units of half the frame width.
// The camera's fov matches f, so at yaw 0 every vertex projects back onto its own pixel.

import {
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  NoColorSpace,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
  LinearSRGBColorSpace,
} from 'three';
import { createFreezeMaterial, stretchK } from './freezeMaterial';
import { createTypePlane, type TypeLine, type TypePlane } from './typePlanes';
import { TYPE_Z } from './heroLayout';

export interface FreezeMeta {
  a: number;
  b: number;
  f: number;
  pivotZ: number;
  overscan?: number;
  mock?: boolean;
}

export interface FreezeSceneOptions {
  host: HTMLElement;
  /** frame size in source px (1920x1076 or 1076x1912) */
  frameW: number;
  frameH: number;
  /** depth grid samples (cols x rows), row-major, top row first; d = v / 65535, near = 1 */
  depth: Uint16Array;
  cols: number;
  rows: number;
  meta: FreezeMeta;
  /** [avif, jpg] candidates for the still that matches the playing codec */
  stillUrls: string[];
  plateUrls: string[];
  /** from hero-meta: the plate quad's depth and its size relative to the frame-matched size there */
  plate?: { z?: number; scale?: number };
  lines: TypeLine[];
  /** CSS px of the frame box on screen (canvas size) */
  cssW: number;
  cssH: number;
  dpr: number;
}

export interface FreezeScene {
  canvas: HTMLCanvasElement;
  setPose(yawDeg: number, pitchDeg: number, dolly: number): void;
  render(): void;
  resize(cssW: number, cssH: number, dpr?: number): void;
  setDpr(dpr: number): void;
  drawCalls(): number;
  onContextLost(cb: () => void): void;
  dispose(): void;
}

function loadImage(urls: string[]): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let i = 0;
    const next = () => {
      if (i >= urls.length) {
        reject(new Error('freeze: image failed'));
        return;
      }
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (img.decode) img.decode().then(() => resolve(img), () => resolve(img));
        else resolve(img);
      };
      img.onerror = () => {
        i++;
        next();
      };
      img.src = urls[i];
    };
    next();
  });
}

function texture(img: HTMLImageElement): Texture {
  const t = new Texture(img);
  t.colorSpace = NoColorSpace; // straight passthrough of the sRGB values
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  t.wrapS = ClampToEdgeWrapping;
  t.wrapT = ClampToEdgeWrapping;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

function buildMesh(o: FreezeSceneOptions): BufferGeometry {
  const { cols, rows, depth, meta } = o;
  const os = meta.overscan ?? 0.12;
  const aspect = o.frameH / o.frameW;
  const us = [-os, ...Array.from({ length: cols }, (_, i) => i / (cols - 1)), 1 + os];
  const vs = [-os, ...Array.from({ length: rows }, (_, j) => j / (rows - 1)), 1 + os];
  const C = us.length;
  const R = vs.length;
  const pos = new Float32Array(C * R * 3);
  const uv = new Float32Array(C * R * 2);
  for (let j = 0; j < R; j++) {
    const jj = Math.max(0, Math.min(rows - 1, j - 1));
    const v = vs[j];
    for (let i = 0; i < C; i++) {
      const ii = Math.max(0, Math.min(cols - 1, i - 1));
      const u = us[i];
      const d = depth[jj * cols + ii] / 65535;
      const z = 1 / (meta.a + meta.b * d);
      const nx = 2 * u - 1;
      const ny = (1 - 2 * v) * aspect;
      const k = (j * C + i) * 3;
      pos[k] = (nx * z) / meta.f;
      pos[k + 1] = (ny * z) / meta.f;
      pos[k + 2] = -z;
      const t = (j * C + i) * 2;
      uv[t] = Math.max(0, Math.min(1, u));
      uv[t + 1] = 1 - Math.max(0, Math.min(1, v));
    }
  }
  const quads = (C - 1) * (R - 1);
  const index = new Uint32Array(quads * 6);
  let n = 0;
  for (let j = 0; j < R - 1; j++) {
    for (let i = 0; i < C - 1; i++) {
      const a = j * C + i;
      const b = a + 1;
      const c = a + C;
      const d = c + 1;
      index[n++] = a;
      index[n++] = c;
      index[n++] = b;
      index[n++] = b;
      index[n++] = c;
      index[n++] = d;
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('uv', new BufferAttribute(uv, 2));
  g.setIndex(new BufferAttribute(index, 1));
  return g;
}

export async function createFreezeScene(o: FreezeSceneOptions): Promise<FreezeScene> {
  const [stillImg, plateImg] = await Promise.all([loadImage(o.stillUrls), loadImage(o.plateUrls)]);

  const canvas = document.createElement('canvas');
  canvas.className = 'cv-gl-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'default',
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
  });
  renderer.outputColorSpace = LinearSRGBColorSpace; // no output conversion: passthrough
  renderer.setClearColor(0x0b0b0a, 1);
  renderer.setPixelRatio(o.dpr);
  renderer.setSize(o.cssW, o.cssH, false);

  const scene = new Scene();
  const { meta } = o;
  const aspect = o.frameW / o.frameH;
  const fovY = (2 * Math.atan(o.frameH / o.frameW / meta.f) * 180) / Math.PI;
  const camera = new PerspectiveCamera(fovY, aspect, 0.05, 100);
  const pivot = new Vector3(0, 0, -meta.pivotZ);

  // background plate: frame 84, near region inpainted, blurred and darkened (A5), behind everything
  const plateTex = texture(plateImg);
  const plateZ = o.plate?.z ?? (1 / meta.a) * 1.06;
  const over = o.plate?.scale ?? 1.5;
  const plateGeo = new PlaneGeometry(1, 1);
  const puv = plateGeo.getAttribute('uv') as BufferAttribute;
  for (let i = 0; i < puv.count; i++) {
    puv.setXY(i, 0.5 + (puv.getX(i) - 0.5) * over, 0.5 + (puv.getY(i) - 0.5) * over);
  }
  const plateMat = new MeshBasicMaterial({ map: plateTex, depthWrite: false, depthTest: true, toneMapped: false });
  const plate = new Mesh(plateGeo, plateMat);
  plate.position.set(0, 0, -plateZ);
  plate.scale.set(((2 * plateZ) / meta.f) * over, ((2 * plateZ) / meta.f) * (o.frameH / o.frameW) * over, 1);
  plate.renderOrder = 0;
  scene.add(plate);

  // the depth mesh
  const stillTex = texture(stillImg);
  const geo = buildMesh(o);
  const mat = createFreezeMaterial(stillTex);
  const mesh = new Mesh(geo, mat);
  mesh.renderOrder = 1;
  mesh.frustumCulled = false;
  scene.add(mesh);

  // type planes (FAR depth-tested, NEAR last and never occluded)
  const frame = { w: o.cssW, h: o.cssH, f: meta.f };
  const rasterScale = Math.max(1.5, Math.min(2.5, o.dpr * 1.25));
  const planes: TypePlane[] = o.lines.map((l) =>
    createTypePlane(l, l.plane === 'far' ? TYPE_Z.far : TYPE_Z.near, frame, rasterScale),
  );
  planes.forEach((p) => scene.add(p.mesh));

  let lost = false;
  let lostCb: (() => void) | null = null;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    lostCb?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  o.host.appendChild(canvas);

  const api: FreezeScene = {
    canvas,
    setPose(yawDeg, pitchDeg, dolly) {
      const yaw = (yawDeg * Math.PI) / 180;
      const pitch = (pitchDeg * Math.PI) / 180;
      const r = meta.pivotZ * (1 - dolly);
      camera.position.set(
        pivot.x + r * Math.sin(yaw) * Math.cos(pitch),
        pivot.y + r * Math.sin(pitch),
        pivot.z + r * Math.cos(yaw) * Math.cos(pitch),
      );
      camera.lookAt(pivot);
      (mat.uniforms.uK as { value: number }).value = stretchK(yawDeg, pitchDeg);
    },
    render() {
      if (lost) return;
      renderer.render(scene, camera);
    },
    resize(cssW, cssH, dpr) {
      if (dpr) renderer.setPixelRatio(dpr);
      renderer.setSize(cssW, cssH, false);
    },
    setDpr(dpr) {
      renderer.setPixelRatio(dpr);
      const s = renderer.getSize(new Vector2());
      renderer.setSize(s.x, s.y, false);
    },
    drawCalls() {
      return renderer.info.render.calls;
    },
    onContextLost(cb) {
      lostCb = cb;
      if (lost) cb();
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      planes.forEach((p) => p.dispose());
      geo.dispose();
      mat.dispose();
      stillTex.dispose();
      plateGeo.dispose();
      plateMat.dispose();
      plateTex.dispose();
      renderer.dispose();
      try {
        renderer.forceContextLoss();
      } catch {
        /* already lost */
      }
      canvas.remove();
    },
  };
  api.setPose(0, 0, 0);
  return api;
}
