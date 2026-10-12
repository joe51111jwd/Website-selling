import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Device } from "../three/devices/Device";
import { Studio } from "../three/Studio";

// Dev sandbox for the device models: ?sandbox=devices&view=hero|front|side|top

const VIEWS: Record<string, { pos: [number, number, number]; target: [number, number, number]; fov: number }> = {
  hero: { pos: [3.6, 3.4, 9.5], target: [0.2, 1.3, 0], fov: 30 },
  front: { pos: [0, 1.6, 11], target: [0, 1.4, 0], fov: 30 },
  side: { pos: [11, 1.8, 0.4], target: [0, 1.3, 0], fov: 30 },
  top: { pos: [0, 12, 3], target: [0, 0, 0], fov: 30 },
};

export default function Devices() {
  const q = new URLSearchParams(location.search);
  const v = VIEWS[q.get("view") ?? "hero"] ?? VIEWS.hero;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#FCFAF8" }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: v.pos, fov: v.fov }}
        gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          <Studio shadowScale={20} />
          <group position={[-3.4, 0, -1.6]}>
            <Device kind="display" screen="screens/web-scheduling.webp" />
          </group>
          <group position={[0.6, 0, 0.6]} rotation={[0, -0.18, 0]}>
            <Device kind="macbook" screen="screens/web-dashboard.webp" finish="black" />
          </group>
          <group position={[3.2, 0.749, 1.8]} rotation={[-0.12, -0.45, 0]}>
            <Device kind="iphone" screen="screens/app-clockin.webp" />
          </group>
        </Suspense>
        <OrbitControls target={v.target} makeDefault />
      </Canvas>
    </div>
  );
}
