// Type planes for the 3D VIEW (brief 4.1). Owner: A2. Lazy GL chunk only.
// Rasterised AT glReady (not at the crossfade) with canvas2D fillText, after
// document.fonts.load('900 100px "BS H1"'). The face is the static Big Shoulders H1 instance, the
// same file the DOM H1 uses, so glyphs match exactly (canvas2D cannot set opsz). Each line sits on a
// plane at its depth (FAR z = 2.6, NEAR z = 1.05), sized screenPx * z / fPx so it projects
// identically at yaw 0. FAR planes are depth-tested against the mesh; NEAR planes render last and are
// never occluded. Positions come from the DOM line boxes (measured), so GL never drifts from CSS.

import { CanvasTexture, LinearFilter, Mesh, MeshBasicMaterial, NoColorSpace, PlaneGeometry } from 'three';
import { H1_FONT } from './heroLayout';

export interface TypeLine {
  text: string;
  /** CSS colour of the inked line */
  color: string;
  plane: 'far' | 'near';
  /** glyph run box in frame CSS px (x of the first glyph origin, top of the content area) */
  x: number;
  top: number;
  width: number;
  /** baseline y, frame CSS px */
  baseline: number;
  fontPx: number;
  letterSpacingPx: number;
}

export interface FrameGeom {
  /** frame box in CSS px */
  w: number;
  h: number;
  /** focal length in units of half the frame width (brief: f = 1.2) */
  f: number;
}

export interface TypePlane {
  mesh: Mesh;
  dispose(): void;
}

/** Build one plane. `z` is the plane's depth; `scale` = texture px per frame CSS px. */
export function createTypePlane(line: TypeLine, z: number, frame: FrameGeom, scale: number): TypePlane {
  const pad = Math.ceil(line.fontPx * 0.18);
  const top = line.baseline - line.fontPx * H1_FONT.ascent - pad;
  const bottom = line.baseline + line.fontPx * H1_FONT.descent + pad;
  const left = line.x - pad;
  const right = line.x + line.width + pad;
  const cw = Math.max(2, Math.ceil((right - left) * scale));
  const ch = Math.max(2, Math.ceil((bottom - top) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.font = `${H1_FONT.weight} ${line.fontPx}px "${H1_FONT.family}"`;
  const anyCtx = ctx as CanvasRenderingContext2D & { letterSpacing?: string; fontKerning?: string };
  if ('letterSpacing' in anyCtx) anyCtx.letterSpacing = `${line.letterSpacingPx}px`;
  if ('fontKerning' in anyCtx) anyCtx.fontKerning = 'normal';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = line.color;
  ctx.fillText(line.text, line.x - left, line.baseline - top);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = NoColorSpace;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;

  const mat = new MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthTest: line.plane === 'far',
    depthWrite: false,
    toneMapped: false,
  });
  const geo = new PlaneGeometry(1, 1);
  const mesh = new Mesh(geo, mat);
  // frame px -> ndc in units of half the frame width (y up), then onto the plane at depth z
  const half = frame.w / 2;
  const cx = ((left + right) / 2 - half) / half;
  const cy = (frame.h / 2 - (top + bottom) / 2) / half;
  mesh.position.set((cx * z) / frame.f, (cy * z) / frame.f, -z);
  mesh.scale.set((((right - left) / half) * z) / frame.f, (((bottom - top) / half) * z) / frame.f, 1);
  mesh.renderOrder = line.plane === 'far' ? 2 : 3;
  return {
    mesh,
    dispose() {
      geo.dispose();
      mat.dispose();
      tex.dispose();
    },
  };
}
