import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { roundedPlane, slab } from "../geo";
import { aluminium, bezel, deepBlack, satinBlack, type Finish } from "../materials";
import { screenMaterial, useScreenTexture, type ScreenSource } from "../screen";

// MacBook Pro 14" at real proportions (1 unit = 10 cm). Base on the floor (y = 0), keyboard
// towards -z, the user at +z. A stand-in until the real model is dropped in (see models.ts).

const W = 3.126;
const D = 2.212;
const T = 0.105; // base
const LH = 2.17; // lid height
const LT = 0.048; // lid thickness
const SW = 3.025; // screen
const SH = 1.965;
const CHIN = 0.14;
export const MACBOOK_SCREEN_ASPECT = SW / SH;

/** Key widths per row in key units (u). Space bar and arrows are on the last row. */
const ROWS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.7],
  [2.35, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.15],
  [1, 1, 1, 1.25, 4.95, 1.25, 1, 1, 1, 1],
];

export type MacBookProps = {
  screen?: ScreenSource;
  /** Lid angle in degrees: 0 closed, 90 upright, ~108 is how people use it. */
  open?: number;
  finish?: Finish;
  align?: number;
  fit?: "cover" | "width";
};

export function MacBook({ screen, open = 108, finish = "silver", align = 0, fit = "width" }: MacBookProps) {
  const tex = useScreenTexture(screen, MACBOOK_SCREEN_ASPECT, align, fit);
  const screenMat = useMemo(() => screenMaterial(tex), [tex]);
  useLayoutEffect(() => () => screenMat.dispose(), [screenMat]);

  const geo = useMemo(
    () => ({
      base: slab(W, D, T, 0.09, 0.03),
      lid: slab(W, LH, LT, 0.09, 0.016),
      bezel: roundedPlane(W - 0.03, LH - 0.03, 0.075),
      screen: roundedPlane(SW, SH, 0.012),
      notch: roundedPlane(0.205, 0.034, 0.01),
      well: roundedPlane(2.79, 1.2, 0.03),
      pad: slab(1.5, 0.96, 0.004, 0.035, 0.0015),
      key: slab(1, 1, 0.012, 0.045, 0.004),
      port: roundedPlane(0.09, 0.028, 0.012),
    }),
    [],
  );

  // keyboard as one instanced mesh
  const keys = useRef<THREE.InstancedMesh>(null);
  const layout = useMemo(() => {
    const u = 0.19;
    const gap = 0.024;
    const out: { x: number; z: number; w: number; d: number }[] = [];
    let z = -0.93; // back of the keyboard
    ROWS.forEach((row, r) => {
      const h = r === 0 ? u * 0.62 : u;
      let x = -2.755 / 2;
      row.forEach((n) => {
        const w = n * u;
        out.push({ x: x + w / 2, z: z + h / 2, w: w - gap, d: h - gap });
        x += w;
      });
      z += h;
    });
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = keys.current;
    if (!m) return;
    const o = new THREE.Object3D();
    layout.forEach((k, i) => {
      o.position.set(k.x, T + 0.004, k.z);
      o.rotation.set(-Math.PI / 2, 0, 0);
      o.scale.set(k.w, k.d, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [layout]);

  const al = aluminium(finish);
  const lidAngle = THREE.MathUtils.degToRad(90 - open);
  const flat: [number, number, number] = [-Math.PI / 2, 0, 0];

  return (
    <group>
      {/* base */}
      <mesh geometry={geo.base} material={al} rotation={flat} position={[0, T / 2, 0]} castShadow receiveShadow />
      <mesh geometry={geo.well} material={satinBlack()} rotation={flat} position={[0, T + 0.0006, -0.38]} />
      <instancedMesh ref={keys} args={[geo.key, satinBlack(), layout.length]} />
      <mesh geometry={geo.pad} material={al} rotation={flat} position={[0, T + 0.0005, 0.52]} />
      {/* ports: MagSafe, Thunderbolt x2, headphone on the left; HDMI, Thunderbolt, SD on the right */}
      {[-0.78, -0.5, -0.36, 0.78].map((z, i) => (
        <mesh key={`l${i}`} geometry={geo.port} material={deepBlack()} position={[-W / 2 - 0.0008, T * 0.48, z]} rotation={[0, -Math.PI / 2, 0]} scale={i === 0 ? [1.7, 0.9, 1] : i === 3 ? [0.38, 1.2, 1] : 1} />
      ))}
      {[-0.7, -0.45, 0.62].map((z, i) => (
        <mesh key={`r${i}`} geometry={geo.port} material={deepBlack()} position={[W / 2 + 0.0008, T * 0.48, z]} rotation={[0, Math.PI / 2, 0]} scale={i === 0 ? [1.3, 1.1, 1] : i === 2 ? [2.4, 0.5, 1] : 1} />
      ))}
      {/* hinge */}
      <mesh material={satinBlack()} position={[0, T + 0.01, -D / 2 + 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.042, 0.042, W - 0.5, 24]} />
      </mesh>
      {/* lid, pivoting on the hinge */}
      <group position={[0, T + 0.012, -D / 2 + 0.05]} rotation={[lidAngle, 0, 0]}>
        <mesh geometry={geo.lid} material={al} position={[0, LH / 2, -LT / 2]} castShadow />
        <mesh geometry={geo.bezel} material={bezel()} position={[0, LH / 2, 0.0006]} />
        <mesh geometry={geo.screen} material={screenMat} position={[0, CHIN + SH / 2, 0.0012]} />
        <mesh geometry={geo.notch} material={deepBlack()} position={[0, CHIN + SH - 0.017 + 0.004, 0.0016]} />
      </group>
    </group>
  );
}
