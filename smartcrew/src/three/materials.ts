import * as THREE from "three";

// Shared materials for the stand-in devices, made once.

export type Finish = "silver" | "black";

const cache = new Map<string, THREE.Material>();
const once = <T extends THREE.Material>(key: string, make: () => T) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
};

export const aluminium = (finish: Finish) =>
  once(`al-${finish}`, () =>
    finish === "silver"
      ? new THREE.MeshPhysicalMaterial({ color: "#d6d7d9", metalness: 1, roughness: 0.34, envMapIntensity: 1.1 })
      : new THREE.MeshPhysicalMaterial({ color: "#2c2d30", metalness: 0.9, roughness: 0.4, envMapIntensity: 0.9 }),
  );

/** Brushed titanium frame for the phone. */
export const titanium = (finish: Finish) =>
  once(`ti-${finish}`, () =>
    finish === "silver"
      ? new THREE.MeshPhysicalMaterial({ color: "#c9c5bd", metalness: 1, roughness: 0.3 })
      : new THREE.MeshPhysicalMaterial({ color: "#3a3a3c", metalness: 1, roughness: 0.32 }),
  );

/** Matte frosted back glass. */
export const backGlass = (finish: Finish) =>
  once(`bg-${finish}`, () =>
    new THREE.MeshPhysicalMaterial({
      color: finish === "silver" ? "#d9d5cd" : "#2a2a2c",
      roughness: 0.55,
      metalness: 0.1,
      clearcoat: 0.4,
      clearcoatRoughness: 0.5,
    }),
  );

/** Gloss black cover glass around a screen. */
export const bezel = () =>
  once("bezel", () => new THREE.MeshPhysicalMaterial({ color: "#050506", roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04 }));

/** Satin black plastic and rubber: keys, hinges, ports, cut-outs. */
export const satinBlack = () => once("satin", () => new THREE.MeshStandardMaterial({ color: "#0c0c0d", roughness: 0.62, metalness: 0.05 }));

export const deepBlack = () => once("deep", () => new THREE.MeshBasicMaterial({ color: "#000" }));

/** Camera lens glass. */
export const lens = () =>
  once("lens", () => new THREE.MeshPhysicalMaterial({ color: "#0a0b10", roughness: 0.05, metalness: 0.2, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.6 }));
