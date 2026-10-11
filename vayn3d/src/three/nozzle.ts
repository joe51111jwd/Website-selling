import * as THREE from "three";
import { HOT } from "./strand";

// A print head built from primitives: brass nozzle, aluminium heater block, finned heat sink.
// Its origin is the nozzle tip, pointing down -Y. Height is about 1 unit.
export function makeNozzle() {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: "#caa055", metalness: 1, roughness: 0.32 });
  const alu = new THREE.MeshStandardMaterial({ color: "#c3c6ca", metalness: 1, roughness: 0.42 });
  const dark = new THREE.MeshStandardMaterial({ color: "#232323", metalness: 0.6, roughness: 0.5 });

  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.012, 0.09, 16), brass);
  tip.position.y = 0.045;
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.035, 0.07, 16), brass);
  cone.position.y = 0.125;
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 6), brass);
  hex.position.y = 0.19;
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.24), alu);
  block.position.set(0.06, 0.3, 0);
  const cartridge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.27, 12), dark);
  cartridge.rotation.z = Math.PI / 2;
  cartridge.position.set(0.1, 0.3, 0.06);
  const brk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), alu);
  brk.position.y = 0.44;
  g.add(tip, cone, hex, block, cartridge, brk);
  for (let i = 0; i < 7; i++) {
    const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.022, 24), i % 2 ? dark : alu);
    fin.position.y = 0.52 + i * 0.055;
    g.add(fin);
  }
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 12), alu);
  core.position.y = 0.68;
  g.add(core);

  // the hot spot at the tip
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 12, 8),
    new THREE.MeshBasicMaterial({ color: HOT.clone().multiplyScalar(1.6), toneMapped: false }),
  );
  const light = new THREE.PointLight(HOT, 0.6, 0.9, 2);
  light.position.y = 0.02;
  g.add(glow, light);
  g.userData.heat = (on: number) => {
    glow.visible = on > 0.01;
    glow.scale.setScalar(0.6 + on * 0.6);
    light.intensity = on * 0.8;
  };
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  return g;
}

export const setNozzleHeat = (g: THREE.Group, on: number) => (g.userData.heat as (n: number) => void)(on);
