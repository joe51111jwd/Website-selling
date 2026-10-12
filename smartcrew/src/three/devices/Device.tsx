import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MODELS, type DeviceKind, type ModelSpec } from "../models";
import { screenMaterial, useScreenTexture, type ScreenSource } from "../screen";
import type { Finish } from "../materials";
import { MacBook, MACBOOK_SCREEN_ASPECT } from "./MacBook";
import { IPhone, IPHONE_SCREEN_ASPECT } from "./IPhone";
import { StudioDisplay, DISPLAY_SCREEN_ASPECT } from "./StudioDisplay";

export type DeviceProps = {
  kind: DeviceKind;
  screen?: ScreenSource;
  /** MacBook lid angle in degrees. */
  open?: number;
  finish?: Finish;
  /** 0 = crop the screen image from its top, 1 = from its bottom. */
  align?: number;
  fit?: "cover" | "width";
};

const ASPECT: Record<DeviceKind, number> = {
  macbook: MACBOOK_SCREEN_ASPECT,
  iphone: IPHONE_SCREEN_ASPECT,
  display: DISPLAY_SCREEN_ASPECT,
};

/** A device: the real model when one is listed in models.ts, otherwise its stand-in. */
export function Device(props: DeviceProps) {
  const spec = MODELS[props.kind];
  if (spec) return <GlbDevice spec={spec} {...props} />;
  if (props.kind === "macbook") return <MacBook {...props} />;
  if (props.kind === "iphone") return <IPhone {...props} />;
  return <StudioDisplay {...props} />;
}

function GlbDevice({ spec, kind, screen, open = 108, align = 0, fit }: DeviceProps & { spec: ModelSpec }) {
  const { scene } = useGLTF(spec.url);
  const root = useMemo(() => scene.clone(true), [scene]);

  // find the screen by mesh or material name; measure it for the image's aspect
  const target = useMemo(() => {
    let found: THREE.Mesh | null = null;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || found) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      if (m.name === spec.screen || mats.some((x) => x?.name === spec.screen)) found = m;
    });
    return found as THREE.Mesh | null;
  }, [root, spec.screen]);

  const aspect = useMemo(() => {
    if (!target) return ASPECT[kind];
    const geom = target.geometry;
    geom.computeBoundingBox();
    const s = new THREE.Vector3();
    geom.boundingBox!.getSize(s);
    const [a, b] = [s.x, s.y, s.z].sort((p, q) => q - p);
    return kind === "iphone" ? b / a : a / b;
  }, [target, kind]);

  const tex = useScreenTexture(screen, aspect, align, fit ?? (kind === "macbook" ? "width" : "cover"));
  const mat = useMemo(() => {
    if (tex) tex.flipY = spec.flipY ?? false;
    return screenMaterial(tex);
  }, [tex, spec.flipY]);

  useLayoutEffect(() => {
    if (!target) return;
    const prev = target.material;
    target.material = mat;
    return () => {
      target.material = prev;
      mat.dispose();
    };
  }, [target, mat]);

  useLayoutEffect(() => {
    if (new URLSearchParams(location.search).has("log")) {
      const names: string[] = [];
      root.traverse((o) => names.push(`${o.type} "${o.name}"` + ((o as THREE.Mesh).isMesh ? ` mat="${((o as THREE.Mesh).material as THREE.Material).name}"` : "")));
      console.log(`[${kind}] nodes:\n` + names.join("\n"));
    }
    if (kind !== "macbook" || !spec.lid) return;
    const lid = root.getObjectByName(spec.lid);
    if (!lid) return;
    const rest = lid.rotation.x;
    lid.rotation.x = rest + THREE.MathUtils.degToRad((spec.lidRestAngle ?? 90) - open);
    return () => void (lid.rotation.x = rest);
  }, [root, kind, spec.lid, spec.lidRestAngle, open]);

  return (
    <group position={spec.position} rotation={spec.rotation} scale={spec.scale ?? 1}>
      <primitive object={root} />
    </group>
  );
}
