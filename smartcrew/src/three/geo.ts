import * as THREE from "three";

// Geometry helpers for the stand-in devices. Units: 1 = 10 cm, so a MacBook Pro 14 is 3.126 wide.

/** A rounded rectangle centred on the origin. */
export function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/**
 * A slab with rounded corners in plan and softened edges, lying in the XY plane with its
 * thickness along Z, centred on the origin (front face at +t/2).
 */
export function slab(w: number, h: number, t: number, r: number, bevel = Math.min(t * 0.3, 0.02)) {
  const b = Math.min(bevel, t / 2 - 1e-4);
  const shape = roundedRect(w - b * 2, h - b * 2, Math.max(r - b, 0.001));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: t - b * 2,
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 6,
    curveSegments: 24,
  });
  g.translate(0, 0, -(t - b * 2) / 2);
  g.computeVertexNormals();
  return g;
}

/** A flat rounded rectangle in the XY plane with UVs running 0..1 across it (for screens). */
export function roundedPlane(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 24);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  }
  uv.needsUpdate = true;
  return g;
}

/** A capsule-ended bar along Y (side buttons). */
export function pill(len: number, thick: number, depth: number) {
  return slab(thick, len, depth, thick / 2, depth * 0.35);
}
