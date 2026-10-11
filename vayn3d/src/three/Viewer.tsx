import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Line, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { cubeToolpath, type CubeSpec } from "../lib/toolpath";
import type { Filament } from "../content/catalog";
import { reducedMotion } from "../lib/scroll";
import { filamentMaterial, styleMaterial, StrandMesh } from "./strand";
import { makeNozzle, setNozzleHeat } from "./nozzle";

// The inspector's 3D viewer: the piece on a build plate, orbit to turn it, and a print state
// shared with the DOM (the layer slider writes to it, the viewer animates it).

export type PrintState = {
  p: number; // shown progress, 0..1
  target: number; // where it's heading
  speed: number; // progress per second while printing
  dragging: boolean;
  printId: number; // bump to reprint from zero
};

type Props = {
  spec: CubeSpec;
  filament: Filament;
  mm: number;
  lightsOff: boolean;
  print: React.MutableRefObject<PrintState>;
  labels: React.RefObject<(HTMLElement | null)[]>; // DOM labels for the two dimension lines
};

export default function Viewer(props: Props) {
  return (
    <Canvas
      className="viewer"
      shadows="percentage"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 30, near: 0.05, far: 60, position: [3.4, 2.6, 4.2] }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Scene {...props} />
    </Canvas>
  );
}

const _v = new THREE.Vector3();
// where the two dimension labels sit, in the piece's local units (side 1)
const LABEL_AT: [number, number, number][] = [
  [0, 0.002, 0.76],
  [0.74, 0.5, 0.5],
];

function plateTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#26231f";
  g.fillRect(0, 0, 512, 512);
  // textured PEI: fine bright and dark speckle
  for (let i = 0; i < 26000; i++) {
    const v = Math.random();
    g.fillStyle = v > 0.5 ? `rgba(214,170,98,${0.08 + Math.random() * 0.22})` : `rgba(0,0,0,${0.15 + Math.random() * 0.25})`;
    const r = Math.random() * 1.3 + 0.3;
    g.fillRect(Math.random() * 512, Math.random() * 512, r, r);
  }
  // a 10 mm scale along two edges, like the marks on a real bed
  g.strokeStyle = "rgba(214,170,98,0.55)";
  g.lineWidth = 2;
  for (let i = 1; i < 12; i++) {
    const x = (i / 12) * 512;
    const len = i % 2 ? 10 : 18;
    g.beginPath();
    g.moveTo(x, 512 - 8);
    g.lineTo(x, 512 - 8 - len);
    g.moveTo(8, x);
    g.lineTo(8 + len, x);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Scene({ spec, filament, mm, lightsOff, print, labels }: Props) {
  const { camera, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const piece = useRef<THREE.Group>(null);
  const nozzleRef = useRef<THREE.Group>(null);
  const dims = useRef<THREE.Group>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const plateMat = useRef<THREE.MeshStandardMaterial>(null);
  const scale = mm / 45;

  const tp = useMemo(() => cubeToolpath(spec), [spec]);
  const mat = useMemo(() => filamentMaterial(filament), []); // eslint-disable-line react-hooks/exhaustive-deps
  const strand = useMemo(() => {
    const s = new StrandMesh(tp, mat, 10);
    s.mesh.castShadow = true;
    s.mesh.receiveShadow = true;
    return s;
  }, [tp, mat]);
  const nozzle = useMemo(() => makeNozzle(), []);
  const plate = useMemo(() => plateTexture(), []);

  useEffect(() => () => strand.dispose(), [strand]);
  useEffect(() => styleMaterial(mat, filament, lightsOff ? 1.6 : 0.3), [mat, filament, lightsOff]);

  const st = useRef({ scale, lastPid: -1, idleT: 0, interacting: false, glowK: 0 });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const s = st.current;
    const pr = print.current;

    if (pr.printId !== s.lastPid) {
      s.lastPid = pr.printId;
      pr.p = reducedMotion ? 1 : 0;
      pr.target = 1;
    }
    if (!pr.dragging) {
      if (pr.p < pr.target) pr.p = Math.min(pr.target, pr.p + pr.speed * dt);
      else if (pr.p > pr.target) pr.p = pr.target;
    }
    strand.set(pr.p, 0.3);

    // the piece grows or shrinks to the chosen size
    s.scale += (scale - s.scale) * (1 - Math.exp(-dt * 7));
    piece.current?.scale.setScalar(s.scale);

    // nozzle rides the top of the print while it's unfinished
    const nz = nozzleRef.current;
    if (nz) {
      const printing = pr.p < 0.999;
      nz.visible = printing;
      if (printing) {
        nz.position.copy(strand.head).multiplyScalar(s.scale);
        nz.position.y += tp.h * 0.5 * s.scale;
        nz.scale.setScalar(0.55 * s.scale);
        setNozzleHeat(nz, pr.dragging ? 0.3 : 1);
      }
    }
    // dimensions only once the piece is whole; the labels are DOM, placed by projection
    const isDone = pr.p >= 0.999;
    if (dims.current) dims.current.visible = isDone;
    LABEL_AT.forEach((at, i) => {
      const el = labels.current?.[i];
      if (!el) return;
      _v.set(at[0], at[1], at[2]).multiplyScalar(s.scale).project(camera);
      el.style.transform = `translate(-50%, -50%) translate(${((_v.x + 1) / 2) * size.width}px, ${((1 - _v.y) / 2) * size.height}px)`;
      el.classList.toggle("is-hidden", !isDone || _v.z > 1);
    });

    // lights off for glow filament
    s.glowK += ((lightsOff ? 1 : 0) - s.glowK) * (1 - Math.exp(-dt * 3));
    if (amb.current) amb.current.intensity = 0.5 * (1 - s.glowK * 0.92);
    if (key.current) key.current.intensity = 2.2 * (1 - s.glowK * 0.95);
    if (plateMat.current) plateMat.current.envMapIntensity = 1 - s.glowK * 0.9;

    // auto-turn when left alone
    const c = controls.current;
    if (c) {
      s.idleT = s.interacting ? 0 : s.idleT + dt;
      c.autoRotate = !reducedMotion && s.idleT > 2.5;
      c.target.y += (0.5 * s.scale - c.target.y) * (1 - Math.exp(-dt * 6));
      c.update();
    }
  });

  // frame the piece when the size changes
  useEffect(() => {
    const dist = 2.6 + scale * 3.2;
    const dir = camera.position.clone().sub(new THREE.Vector3(0, 0.5 * scale, 0)).normalize();
    camera.position.copy(dir.multiplyScalar(dist).add(new THREE.Vector3(0, 0.5 * scale, 0)));
  }, [scale, camera]);

  const half = 0.5;
  const tick = 0.06;
  return (
    <>
      <ambientLight ref={amb} intensity={0.5} />
      <directionalLight
        ref={key}
        position={[-3, 6, 4]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0004}
      />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2} position={[0, 5, 3]} scale={[10, 3, 1]} rotation-x={Math.PI / 2.5} />
        <Lightformer intensity={1.2} position={[-5, 1.5, 1]} scale={[2, 6, 1]} rotation-y={Math.PI / 2.4} />
        <Lightformer intensity={0.9} position={[5, 1, -2]} scale={[2, 6, 1]} rotation-y={-Math.PI / 2.4} color="#ffd6b8" />
      </Environment>

      {/* build plate */}
      <mesh position={[0, -0.03, 0]} receiveShadow>
        <boxGeometry args={[2.5, 0.06, 2.5]} />
        <meshStandardMaterial ref={plateMat} map={plate} roughness={0.78} metalness={0.25} />
      </mesh>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.55} scale={2.4} blur={2.2} far={1.2} resolution={512} />

      <group ref={piece}>
        <primitive object={strand.mesh} />
        <group ref={dims}>
          {/* width along the front edge, height up the corner, like calipers */}
          <Line points={[[-half, 0.002, half + 0.12], [half, 0.002, half + 0.12]]} color="#151413" lineWidth={1.2} />
          <Line points={[[-half, 0.002, half + 0.12 - tick], [-half, 0.002, half + 0.12 + tick]]} color="#151413" lineWidth={1.2} />
          <Line points={[[half, 0.002, half + 0.12 - tick], [half, 0.002, half + 0.12 + tick]]} color="#151413" lineWidth={1.2} />
          <Line points={[[half + 0.12, 0, half], [half + 0.12, 1, half]]} color="#151413" lineWidth={1.2} />
          <Line points={[[half + 0.12 - tick, 1, half], [half + 0.12 + tick, 1, half]]} color="#151413" lineWidth={1.2} />
        </group>
      </group>
      <primitive object={nozzle} ref={nozzleRef} />

      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={1.6}
        maxDistance={11}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2 - 0.06}
        autoRotateSpeed={0.9}
        target={[0, 0.5, 0]}
        onStart={() => (st.current.interacting = true)}
        onEnd={() => (st.current.interacting = false)}
      />
    </>
  );
}
