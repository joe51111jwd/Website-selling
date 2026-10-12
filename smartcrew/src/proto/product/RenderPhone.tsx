import { Suspense, useLayoutEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Studio } from "../../three/Studio";

// Dev-only: renders the real iPhone model straight-on with an orthographic camera and the
// display glass in pure key green, on a transparent background. A script screenshots it and
// keys the green out, giving a photographic frame (assets/iphone-frame.png) that the live
// React phone screens sit behind. ?proto=product&render=iphone

const KEY = new THREE.MeshBasicMaterial({ color: "#00ff00", toneMapped: false });

function Phone() {
  const { scene } = useGLTF("models/iphone-18-pro-max.glb");
  const root = useMemo(() => scene.clone(true), [scene]);
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.name === "Front_Screen") m.material = KEY;
    });
    root.scale.setScalar(10);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const c = box.getCenter(new THREE.Vector3());
    const s = box.getSize(new THREE.Vector3());
    root.position.sub(c);
    // fit height with a small margin
    const h = s.y * 1.02;
    const w = (h * size.width) / size.height;
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [root, camera, size]);
  return <primitive object={root} />;
}

export default function RenderPhone() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Canvas orthographic dpr={1} gl={{ alpha: true, antialias: true, toneMapping: THREE.NeutralToneMapping, preserveDrawingBuffer: true }} camera={{ position: [0, 0, 20], zoom: 1 }}>
        <Suspense fallback={null}>
          <Studio shadow={false} />
          <Phone />
        </Suspense>
      </Canvas>
    </div>
  );
}
