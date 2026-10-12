import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { roundedPlane, slab } from "../geo";
import { aluminium, bezel, satinBlack, type Finish } from "../materials";
import { screenMaterial, useScreenTexture, type ScreenSource } from "../screen";

// Apple Studio Display (27") on its tilt stand, at real proportions (1 unit = 10 cm).
// Foot on the floor (y = 0), screen towards +z.

const W = 6.23;
const H = 3.62;
const T = 0.24;
const SW = 5.977;
const SH = 3.362;
const BOTTOM = 1.16; // panel's lower edge above the desk
export const DISPLAY_SCREEN_ASPECT = SW / SH;

/** The stand's side profile, a bent sheet: foot plate, a bend at the back, an arm leaning forward. */
function standGeometry(width: number) {
  const t = 0.05;
  const pts: THREE.Vector2[] = []; // centreline as (z, y)
  for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector2(0.62 - (i / 8) * 1.55, t / 2));
  const c = new THREE.Vector2(-0.93, 0.28); // bend centre
  for (let i = 1; i <= 16; i++) {
    const a = -Math.PI / 2 - (i / 16) * (Math.PI * 0.62);
    pts.push(new THREE.Vector2(c.x + Math.cos(a) * 0.255, c.y + Math.sin(a) * 0.255));
  }
  const top = new THREE.Vector2(-0.2, 2.75);
  const last = pts[pts.length - 1];
  for (let i = 1; i <= 10; i++) pts.push(last.clone().lerp(top, i / 10));
  // offset the centreline both ways into a closed outline
  const left: THREE.Vector2[] = [];
  const right: THREE.Vector2[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(i - 1, 0)];
    const b = pts[Math.min(i + 1, pts.length - 1)];
    const n = new THREE.Vector2(-(b.y - a.y), b.x - a.x).normalize().multiplyScalar(t / 2);
    left.push(p.clone().add(n));
    right.push(p.clone().sub(n));
  });
  const outline = [...left, ...right.reverse()].map((p) => new THREE.Vector2(-p.x, p.y));
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(outline), {
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 4,
  });
  g.rotateY(Math.PI / 2);
  g.translate(-width / 2, 0, 0);
  g.computeVertexNormals();
  return g;
}

export type StudioDisplayProps = { screen?: ScreenSource; finish?: Finish; align?: number; fit?: "cover" | "width" };

export function StudioDisplay({ screen, finish = "silver", align = 0, fit = "cover" }: StudioDisplayProps) {
  const tex = useScreenTexture(screen, DISPLAY_SCREEN_ASPECT, align, fit);
  const screenMat = useMemo(() => screenMaterial(tex), [tex]);
  useLayoutEffect(() => () => screenMat.dispose(), [screenMat]);

  const geo = useMemo(
    () => ({
      panel: slab(W, H, T, 0.07, 0.03),
      glass: roundedPlane(W - 0.02, H - 0.02, 0.06),
      screen: roundedPlane(SW, SH, 0.012),
      stand: standGeometry(1.5),
    }),
    [],
  );
  const al = aluminium(finish);
  const cy = BOTTOM + H / 2;

  return (
    <group>
      <mesh geometry={geo.panel} material={al} position={[0, cy, 0]} castShadow />
      <mesh geometry={geo.glass} material={bezel()} position={[0, cy, T / 2 + 0.0006]} />
      <mesh geometry={geo.screen} material={screenMat} position={[0, cy, T / 2 + 0.0012]} />
      {/* stand, and the hinge block it meets on the back of the panel */}
      <group position={[0, 0, -T / 2 - 0.02]}>
        <mesh geometry={geo.stand} material={al} castShadow />
      </group>
      <mesh material={satinBlack()} position={[0, 2.75, -T / 2 - 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 1.4, 24]} />
      </mesh>
      <mesh material={al} position={[0, 2.75, -T / 2 - 0.1]}>
        <boxGeometry args={[1.42, 0.22, 0.2]} />
      </mesh>
    </group>
  );
}
