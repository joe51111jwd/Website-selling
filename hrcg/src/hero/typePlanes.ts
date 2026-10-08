// Type planes for the 3D VIEW (brief 4.1). Owner: A2. Lazy GL chunk only.
// Rasterised AT glReady (not at the crossfade) with canvas2D fillText, after
// document.fonts.load('900 100px "BS H1"'). The face is the static Big Shoulders H1 instance, the
// same file the DOM H1 uses, so glyphs match exactly (canvas2D cannot set opsz). Each block sits on a
// plane at its depth (FAR z = 2.6, NEAR z = 1.05), sized screenPx * z / fPx so it projects
// identically at yaw 0. FAR is occluded by 07's matte layer (drawn over it); NEAR renders last and is
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

/**
 * Build one plane for one or more lines that share a depth (FAR = lines 1-2, NEAR = lines 3-4): one
 * canvas, one draw call per depth (F-004 adds 07's matte layer; the scene stays within 6 draw calls).
 * `scale` = texture px per frame CSS px.
 */
export function createTypePlane(input: TypeLine | TypeLine[], z: number, frame: FrameGeom, scale: number): TypePlane {
  const lines = Array.isArray(input) ? input : [input];
  const pad = Math.ceil(Math.max(...lines.map((l) => l.fontPx)) * 0.18);
  const top = Math.min(...lines.map((l) => l.baseline - l.fontPx * H1_FONT.ascent)) - pad;
  const bottom = Math.max(...lines.map((l) => l.baseline + l.fontPx * H1_FONT.descent)) + pad;
  const left = Math.min(...lines.map((l) => l.x)) - pad;
  const right = Math.max(...lines.map((l) => l.x + l.width)) + pad;
  const cw = Math.max(2, Math.ceil((right - left) * scale));
  const ch = Math.max(2, Math.ceil((bottom - top) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  const anyCtx = ctx as CanvasRenderingContext2D & { letterSpacing?: string; fontKerning?: string };
  for (const line of lines) {
    ctx.font = `${H1_FONT.weight} ${line.fontPx}px "${H1_FONT.family}"`;
    if ('letterSpacing' in anyCtx) anyCtx.letterSpacing = `${line.letterSpacingPx}px`;
    if ('fontKerning' in anyCtx) anyCtx.fontKerning = 'normal';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, line.x - left, line.baseline - top);
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = NoColorSpace;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;

  const plane = lines[0].plane;
  const mat = new MeshBasicMaterial({
    map: tex,
    transparent: true,
    // FAR is bitten by 07's matte layer drawn over it, not by the mesh's depth (A5-fix-2 §2.2): the dilated
    // ring sits at 07's depth and would bite further out than the DOM's CSS matte does
    depthTest: false,
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
  // draw order: plate, mesh (1), FAR (2), 07's matte layer (3), NEAR (4)
  mesh.renderOrder = plane === 'far' ? 2 : 4;
  return {
    mesh,
    dispose() {
      geo.dispose();
      mat.dispose();
      tex.dispose();
    },
  };
}
