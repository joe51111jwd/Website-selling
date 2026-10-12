// The Stage's devices: the real GLB models (src/three/models.ts), each cloned once, re-centred
// on its own middle (so poses rotate it around itself), with its screen swapped for a
// ScreenSurface. The Stage's driver moves them through `rig`.

import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MODELS } from "../models";
import type { DeviceId } from "./types";
import { ScreenSurface, type Fit } from "./surface";

export type RigDevice = {
  id: DeviceId;
  /** posed by the driver (position, rotation, scale in world units) */
  group: THREE.Group;
  surface: ScreenSurface;
  screenMesh: THREE.Mesh;
  /** model size in device units (1 = 10 cm), after re-centring */
  size: THREE.Vector3;
};

/** Devices that have loaded, keyed by id. The driver reads this every frame. */
export const rig = new Map<DeviceId, RigDevice>();
const rigListeners = new Set<() => void>();
export const onRig = (fn: () => void) => (rigListeners.add(fn), () => void rigListeners.delete(fn));

const FIT: Record<DeviceId, Fit> = { macbook: "width", iphone: "cover", display: "width" };

let shadowMat: THREE.MeshBasicMaterial | null = null;
function shadowMaterial() {
  if (shadowMat) return shadowMat;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.filter = "blur(22px)";
  g.fillStyle = "#000";
  g.beginPath();
  g.roundRect(58, 62, 140, 132, 24);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  shadowMat = new THREE.MeshBasicMaterial({ map: tex, color: "#1a140f", transparent: true, opacity: 0.42, depthWrite: false, toneMapped: false });
  return shadowMat;
}

export function preloadDevices(ids: DeviceId[]) {
  ids.forEach((id) => {
    const spec = MODELS[id];
    if (spec) useGLTF.preload(import.meta.env.BASE_URL + spec.url);
  });
}

export function StageDevice({ id }: { id: DeviceId }) {
  const spec = MODELS[id]!;
  const { scene } = useGLTF(import.meta.env.BASE_URL + spec.url);

  const built = useMemo(() => {
    const root = scene.clone(true);
    let screenMesh: THREE.Mesh | null = null;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      if (!screenMesh && (m.name === spec.screen || mats.some((x) => x?.name === spec.screen))) screenMesh = m;
      // the GLB's own materials, a touch more reflective for the studio rig
      mats.forEach((mat) => {
        const s = mat as THREE.MeshStandardMaterial;
        if (s && "envMapIntensity" in s) s.envMapIntensity = 1;
      });
      m.frustumCulled = false;
    });
    if (!screenMesh) throw new Error(`[stage] no screen "${spec.screen}" in ${spec.url}`);

    // scale to device units, then centre on the bounding box
    const inner = new THREE.Group();
    inner.scale.setScalar(spec.scale ?? 1);
    if (spec.rotation) inner.rotation.set(...spec.rotation);
    inner.add(root);
    inner.updateMatrixWorld(true);
    const surface = new ScreenSurface(screenMesh, FIT[id], (screenMesh as THREE.Mesh).matrixWorld.clone());
    const box = new THREE.Box3().setFromObject(inner);
    const centre = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    inner.position.copy(centre).negate();

    const group = new THREE.Group();
    group.name = `stage-${id}`;
    group.visible = false;
    group.add(inner);
    // a soft contact shadow under the laptop's base, so it sits on something
    if (id === "macbook") {
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 1.5, 2.2 * 1.7), shadowMaterial());
      sh.rotation.x = -Math.PI / 2;
      sh.position.set(0, -size.y / 2 - 0.12, -centre.z + 0.1);
      sh.renderOrder = -1;
      group.add(sh);
    }
    return { group, surface, screenMesh: screenMesh as THREE.Mesh, size };
  }, [scene, spec]);

  useLayoutEffect(() => {
    const prev = built.screenMesh.material;
    built.screenMesh.material = built.surface.material;
    rig.set(id, { id, ...built });
    rigListeners.forEach((f) => f());
    return () => {
      built.screenMesh.material = prev;
      built.surface.material.dispose();
      if (rig.get(id)?.group === built.group) rig.delete(id);
    };
  }, [id, built]);

  return <primitive object={built.group} />;
}
