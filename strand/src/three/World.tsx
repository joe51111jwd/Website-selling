import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { cubeToolpath, type CubeSpec } from "../lib/toolpath";
import { filaments, heroSpec, liveOrders, liveSpec, products, sizes, stats, type Filament } from "../content/catalog";
import { boxes, layoutVersion } from "../lib/layout";
import { lenis, markDriven, reducedMotion } from "../lib/scroll";
import { line } from "../lib/line";
import { store, useStore } from "../lib/store";
import { filamentMaterial, styleMaterial, StrandMesh } from "./strand";
import { makeNozzle, setNozzleHeat } from "./nozzle";

// The page is one continuous line. It prints the hero piece as the page opens, then follows
// the scroll down, winding itself into each product in turn and finally into the live printer.
//
// Element order along the line: lead-in, hero, then (connector, station) for each station.
// G is the line's position along that list: floor(G) is the element being drawn, the
// fraction is how far along it. Everything on screen is derived from G.

const CAM_Z = 20;
const FOV = 30;
const TILT = 0.42;
const INTRO_LEAD = 1.1;
const INTRO_PRINT = 4.6;
const LIVE_PRINT = 13;
const LIVE_HOLD = 3.2;

type Station = {
  id: string;
  outer: THREE.Group;
  inner: THREE.Group;
  strand: StrandMesh;
  mat: THREE.MeshStandardMaterial;
  ghost: THREE.LineSegments;
  filament: Filament;
  side: number;
  spin: number;
  spinSpeed: number;
  meters: number; // real-world metres in the M size
  realLayers: number;
};

type Conn = {
  mesh: THREE.Mesh;
  curve: THREE.CatmullRomCurve3 | null;
  tubular: number;
  radial: number;
};

export default function World() {
  const inspecting = useStore((s) => s.inspect !== null);
  return (
    <Canvas
      className="world"
      frameloop={inspecting ? "never" : "always"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: FOV, near: 0.5, far: 80, position: [0, 0, CAM_Z] }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ScrollDriver />
      <ambientLight intensity={0.55} />
      <directionalLight position={[-6, 9, 8]} intensity={2.1} />
      <directionalLight position={[7, -2, 4]} intensity={0.5} color="#ffe9d6" />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2.2} position={[0, 6, 4]} scale={[12, 4, 1]} rotation-x={Math.PI / 2.4} />
        <Lightformer intensity={1.1} position={[-7, 1, 3]} scale={[3, 8, 1]} rotation-y={Math.PI / 2.5} />
        <Lightformer intensity={0.8} position={[7, 0, 2]} scale={[3, 8, 1]} rotation-y={-Math.PI / 2.5} color="#ffd9bf" />
      </Environment>
      <Line />
    </Canvas>
  );
}

// Lenis advances inside the render loop, before the camera reads the scroll position.
function ScrollDriver() {
  useFrame(() => {
    lenis.raf(performance.now());
    markDriven();
  }, -1);
  return null;
}

function buildStation(id: string, spec: CubeSpec, f: Filament, infillPct: number): Station {
  const tp = cubeToolpath(spec);
  const mat = filamentMaterial(f);
  const strand = new StrandMesh(tp, mat, 6);
  strand.mesh.frustumCulled = true;
  const outer = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -0.5;
  inner.add(strand.mesh);
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  edges.translate(0, 0.5, 0);
  const ghost = new THREE.LineSegments(
    edges,
    new THREE.LineDashedMaterial({ color: "#151413", dashSize: 0.035, gapSize: 0.03, transparent: true, opacity: 0.3, depthWrite: false }),
  );
  ghost.computeLineDistances();
  inner.add(ghost);
  outer.add(inner);
  outer.rotation.set(TILT, 0.72, 0);
  const s = stats({ infillPct, spec }, sizes[1].mm, f);
  return { id, outer, inner, strand, mat, ghost, filament: f, side: 1, spin: 0, spinSpeed: 0.1, meters: s.lineM, realLayers: s.layers };
}

function buildConn(): Conn {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.frustumCulled = false;
  return { mesh, curve: null, tubular: 220, radial: 6 };
}

const _a = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();
const _ca = new THREE.Color();
const _cb = new THREE.Color();

function shapeConn(c: Conn, pts: THREE.Vector3[], radius: number, from: string, to: string) {
  c.curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const geo = new THREE.TubeGeometry(c.curve, c.tubular, radius, c.radial, false);
  c.mesh.geometry.dispose();
  c.mesh.geometry = geo;
  paintConn(c, from, to);
}

function paintConn(c: Conn, from: string, to: string) {
  const geo = c.mesh.geometry;
  const pos = geo.getAttribute("position");
  if (!pos) return;
  _ca.set(from);
  _cb.set(to);
  let col = geo.getAttribute("color") as THREE.BufferAttribute | undefined;
  if (!col) {
    col = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
    geo.setAttribute("color", col);
  }
  const ring = c.radial + 1;
  for (let i = 0; i <= c.tubular; i++) {
    // the colour changes over the middle of the run, like a filament swap purging through
    const t = THREE.MathUtils.smoothstep(i / c.tubular, 0.35, 0.65);
    const r = _ca.r + (_cb.r - _ca.r) * t;
    const g = _ca.g + (_cb.g - _ca.g) * t;
    const b = _ca.b + (_cb.b - _ca.b) * t;
    for (let j = 0; j < ring; j++) col.setXYZ(i * ring + j, r, g, b);
  }
  col.needsUpdate = true;
}

function Line() {
  const { camera, size } = useThree();
  const root = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    const stations: Station[] = [
      buildStation("hero", heroSpec, filaments.signal, 15),
      ...products.map((p) => buildStation(p.slug, p.spec, filaments[p.filaments[0]], p.infillPct)),
      buildStation("live", liveSpec, filaments[liveOrders[0].filament], 20),
    ];
    const conns = stations.map(() => buildConn()); // conns[k] runs into stations[k]; conns[0] is the lead-in
    const nozzle = makeNozzle();
    return { stations, conns, nozzle };
  }, []);

  useEffect(() => {
    const g = root.current!;
    scene.stations.forEach((s) => g.add(s.outer));
    scene.conns.forEach((c) => g.add(c.mesh));
    g.add(scene.nozzle);
    return () => {
      scene.stations.forEach((s) => {
        s.strand.dispose();
        s.mat.dispose();
      });
      scene.conns.forEach((c) => c.mesh.geometry.dispose());
    };
  }, [scene]);

  const st = useRef({
    laidOut: -1,
    vw: 0,
    vh: 0,
    G: 0,
    introT: 0,
    liveT: 0,
    liveOrder: 0,
    heat: 0,
    breaks: [] as { start: number; end: number }[],
  });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const s = st.current;
    const { stations, conns, nozzle } = scene;
    const vw = size.width;
    const vh = size.height;
    const u = (2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / vh;
    const scrollY = window.scrollY;
    camera.position.y = -scrollY * u;

    // --- layout: place every station on its DOM box, and re-route the line between them
    if (s.laidOut !== layoutVersion() || s.vw !== vw || s.vh !== vh) {
      s.laidOut = layoutVersion();
      s.vw = vw;
      s.vh = vh;
      stations.forEach((st) => {
        const box = boxes.get(st.id);
        st.outer.visible = !!box;
        if (!box) return;
        st.side = (box.w * u) / 1.95;
        st.outer.position.set((box.cx - vw / 2) * u, -(box.cy - vh / 2) * u, 0);
        st.outer.scale.setScalar(st.side);
        st.outer.updateMatrixWorld(true);
      });
      route(stations, conns, u, vw, vh);
      s.breaks = stations.map((st, k) => {
        const box = boxes.get(st.id);
        if (!box || k === 0) return { start: 0, end: 0 };
        return { start: box.cy - vh * 0.98, end: box.cy - vh * 0.5 };
      });
      for (let k = 1; k < s.breaks.length; k++) {
        const prev = s.breaks[k - 1];
        const b = s.breaks[k];
        b.start = Math.max(b.start, prev.end + vh * 0.12);
        b.end = Math.max(b.end, b.start + vh * 0.25);
      }
    }

    // --- where the line should be: the intro by time, then the scroll
    const ready = store.get().ready;
    if (ready) s.introT += dt * (scrollY > 30 ? 5 : 1);
    const introG = reducedMotion
      ? 2
      : s.introT < INTRO_LEAD
        ? s.introT / INTRO_LEAD
        : 1 + Math.min(1, (s.introT - INTRO_LEAD) / INTRO_PRINT);
    const last = stations.length - 1;
    let target = introG;
    if (introG >= 2) {
      target = 2 * last + 1;
      for (let k = 1; k <= last; k++) {
        const b = s.breaks[k];
        const prevEnd = s.breaks[k - 1].end;
        if (scrollY < b.start) {
          target = 2 * k + THREE.MathUtils.clamp((scrollY - prevEnd) / Math.max(1, b.start - prevEnd), 0, 1);
          break;
        }
        if (k < last && scrollY < b.end) {
          target = 2 * k + 1 + (scrollY - b.start) / (b.end - b.start);
          break;
        }
      }
      target = Math.max(2, target);
    }
    const prevG = s.G;
    s.G = reducedMotion ? target : s.G + (target - s.G) * (1 - Math.exp(-dt * 6.5));
    if (Math.abs(target - s.G) < 1e-4) s.G = target;
    const G = s.G;

    // --- the live printer runs on its own clock once the line reaches it
    const liveIdx = 2 * last + 1;
    let liveP = 0;
    const live = stations[last];
    if (G >= liveIdx - 1e-3) {
      s.liveT += dt;
      const cycle = LIVE_PRINT + LIVE_HOLD;
      if (s.liveT > cycle) {
        s.liveT -= cycle;
        s.liveOrder = (s.liveOrder + 1) % liveOrders.length;
        const f = filaments[liveOrders[s.liveOrder].filament];
        live.filament = f;
        styleMaterial(live.mat, f);
        paintConn(conns[last], stations[last - 1].filament.hex, f.hex);
      }
      liveP = reducedMotion ? 1 : Math.min(1, s.liveT / LIVE_PRINT);
      // when it's done it sinks into the plate, as if lifted off and shipped
      const out = THREE.MathUtils.smoothstep(s.liveT, cycle - 0.7, cycle);
      live.inner.scale.set(1, Math.max(0.001, 1 - out), 1);
    } else {
      s.liveT = 0;
      live.inner.scale.set(1, 1, 1);
    }
    line.live.progress = liveP;
    line.live.order = s.liveOrder;

    // --- draw: stations, connectors, numbers
    const hover = store.get().hover;
    let meters = 0;
    let layers = 0;
    stations.forEach((st, k) => {
      const p = k === last ? liveP : THREE.MathUtils.clamp(G - (2 * k + 1), 0, 1);
      st.strand.set(p, 0.32);
      const gm = st.ghost.material as THREE.LineDashedMaterial;
      gm.opacity = 0.3 * (1 - THREE.MathUtils.smoothstep(p, 0.02, 0.4));
      st.ghost.visible = gm.opacity > 0.005;
      const want = reducedMotion ? 0 : hover === st.id ? 1.1 : 0.12;
      st.spinSpeed += (want - st.spinSpeed) * (1 - Math.exp(-dt * 4));
      st.spin += st.spinSpeed * dt;
      st.inner.rotation.y = st.spin;
      line.progress.set(st.id, p);
      if (k > 0 && k < last) {
        meters += p * st.meters;
        layers += p * st.realLayers;
      }
    });
    conns.forEach((c, k) => {
      const t = THREE.MathUtils.clamp(G - 2 * k, 0, 1);
      const segs = Math.floor(t * c.tubular);
      c.mesh.geometry.setDrawRange(0, segs * c.radial * 6);
      c.mesh.visible = segs > 0;
    });
    line.meters = meters;
    line.layer = layers;

    // --- the nozzle rides the head of the line
    const e = Math.min(Math.floor(G), liveIdx);
    const f = G - e;
    if (e % 2 === 1) {
      const k = (e - 1) / 2;
      const st = stations[k];
      _a.copy(st.strand.head);
      _a.y += st.strand.tp.h * 0.5;
      st.inner.localToWorld(_a);
      st.inner.getWorldQuaternion(_q);
      nozzle.scale.setScalar(st.side * 0.5);
    } else {
      const k = e / 2;
      const c = conns[k];
      if (c.curve) c.curve.getPointAt(Math.min(1, f), _a);
      stations[k].inner.getWorldQuaternion(_qb);
      if (k > 0) {
        stations[k - 1].inner.getWorldQuaternion(_qa);
        _q.slerpQuaternions(_qa, _qb, THREE.MathUtils.smoothstep(f, 0.1, 0.9));
      } else _q.copy(_qb);
      const sideA = k > 0 ? stations[k - 1].side : stations[0].side;
      nozzle.scale.setScalar(THREE.MathUtils.lerp(sideA, stations[k].side, f) * 0.5);
    }
    nozzle.position.copy(_a);
    nozzle.quaternion.copy(_q);
    const moving = Math.abs(G - prevG) > 1e-5 || (e === liveIdx && liveP > 0 && liveP < 1);
    s.heat += ((moving ? 1 : 0.25) - s.heat) * (1 - Math.exp(-dt * 5));
    setNozzleHeat(nozzle, s.heat);
    nozzle.visible = G > 0.002 && boxes.size > 0;
  });

  return <group ref={root} />;
}

// Re-route the connectors. The line leaves the top of each piece (on its spin axis, so it
// stays attached while the piece turns), runs down the piece's outer side, crosses the gap
// and feeds up into the bottom of the next piece.
function route(stations: Station[], conns: Conn[], u: number, vw: number, vh: number) {
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  stations.forEach((st, k) => {
    if (!st.outer.visible) return;
    const sB = st.side;
    const b = st.outer.localToWorld(V(0, -0.5, 0));
    const bUp = V(0, 1, 0).applyQuaternion(st.outer.quaternion);
    const cB = st.outer.position;
    const outB = Math.sign(cB.x) || (k % 2 ? 1 : -1);
    let pts: THREE.Vector3[];
    let sA = sB;
    if (k === 0) {
      // the lead-in drops in from above the top-right corner of the screen
      pts = [V(vw * 0.6 * u, vh * 0.72 * u, -1), V(cB.x + outB * sB * 1.1, cB.y + sB * 0.4, sB * 0.4)];
    } else {
      const prev = stations[k - 1];
      sA = prev.side;
      const a = prev.outer.localToWorld(V(0, 0.5, 0));
      const aUp = V(0, 1, 0).applyQuaternion(prev.outer.quaternion);
      const cA = prev.outer.position;
      const outA = Math.sign(cA.x) || (k % 2 ? -1 : 1);
      const yA = cA.y - sA * 1.0;
      const yB = cB.y - sB * 1.0;
      pts = [
        a,
        a.clone().addScaledVector(aUp, sA * 0.32).add(V(outA * sA * 0.22, 0, 0)),
        V(cA.x + outA * sA * 0.92, cA.y - sA * 0.1, sA * 0.35),
        V(cA.x + outA * sA * 0.55, yA, sA * 0.6),
        V((cA.x + cB.x) * 0.25, (yA + yB) * 0.5, (sA + sB) * 0.45),
      ];
    }
    pts.push(V(cB.x - outB * sB * 0.15, cB.y - sB * 0.95, sB * 0.3), b.clone().addScaledVector(bUp, -sB * 0.12), b);
    const radius = st.strand.tp.h * 0.62 * (sA + sB) * 0.5;
    const from = k === 0 ? st.filament.hex : stations[k - 1].filament.hex;
    shapeConn(conns[k], pts, radius, from, st.filament.hex);
  });
}
