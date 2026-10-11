import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { cubeToolpath, type CubeSpec } from "../lib/toolpath";
import { textKey, textToolpath, type TextOpts } from "../lib/textpath";
import { filaments, heroSpec, liveOrders, liveSpec, products, sizes, stats, type Filament } from "../content/catalog";
import { boxes, layoutVersion } from "../lib/layout";
import { lenis, markDriven, reducedMotion } from "../lib/scroll";
import { line } from "../lib/line";
import { store, useStore } from "../lib/store";
import { filamentMaterial, styleMaterial, StrandMesh } from "./strand";
import { makeNozzle, setNozzleHeat } from "./nozzle";

// The page is one continuous line. It prints the hero piece as the page opens, then follows
// the scroll down: for each product it writes the product's name, then prints the piece,
// and it ends at the live printer. Between prints the line takes a different route every time.
//
// The prints run in page order (`seq`). Element 2i is the connector into print i, element
// 2i+1 is print i. G is the line's position along that list, derived from the scroll, and
// everything on screen comes from G.

const CAM_Z = 20;
const FOV = 30;
const TILT = 0.42;
const INTRO_LEAD = 0.9; // seconds for the line to drop in
const INTRO_CUBE = 4.2; // seconds to print the hero piece
const LIVE_PRINT = 13;
const LIVE_HOLD = 3.2;
const PARALLAX = 0.42; // how far ahead of the page a title drifts in before it locks into place
const TITLE_LOCK = 0.68; // titles lock in (and finish printing) when their centre is here, in viewport heights
const Q_WRITE = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.4, 0, 0)); // the head, leaning in to write
const INK: Filament = { ...filaments.graphite, id: "ink", hex: "#151515" };

// Route shapes for the runs between products, in order down the page, and for the short hop
// from a product's name to its piece.
const ROUTES = ["swing", "coil", "loop", "zigzag", "wave", "swoop", "eight"] as const;
const LINKS = ["curl", "drop", "curl"] as const;
type Route = (typeof ROUTES)[number] | (typeof LINKS)[number] | "lead" | "hop";

type Print = {
  id: string; // key in line.progress
  kind: "cube" | "text";
  intro: boolean; // printed on a clock as the page opens (the headline and the hero piece)
  text: TextOpts | null; // how a text print is laid down
  product: number; // index into products, or -1 for the hero and the live printer
  anchor: string; // data-station of the DOM box it sits on
  outer: THREE.Group;
  inner: THREE.Group;
  strand: StrandMesh | null;
  mat: THREE.MeshStandardMaterial;
  ghost: THREE.LineSegments | null;
  filament: Filament;
  size: number; // cube side, or the font size, in world units
  fontPx: number; // text: font size in CSS px
  spin: number;
  spinSpeed: number;
  meters: number;
  realLayers: number;
  key: string; // text: what its toolpath was built from
  baseY: number; // text: position before parallax
  par: number; // text: current parallax, world units
  cy: number; // page y of its box centre
  win: { start: number; end: number }; // scroll range it prints over
};

type Conn = {
  mesh: THREE.Mesh;
  curve: THREE.CatmullRomCurve3 | null;
  tubular: number;
  radial: number;
  offA: { value: THREE.Vector3 };
  offB: { value: THREE.Vector3 };
  travel: boolean; // a travel move: the nozzle moves without laying a line (between headline rows)
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

const dashed = (dash: number) =>
  new THREE.LineDashedMaterial({ color: "#0d0d0d", dashSize: dash, gapSize: dash * 0.85, transparent: true, opacity: 0.3, depthWrite: false });

function cubePrint(id: string, anchor: string, product: number, spec: CubeSpec, f: Filament, infillPct: number): Print {
  const mat = filamentMaterial(f);
  const strand = new StrandMesh(cubeToolpath(spec), mat, 6);
  strand.mesh.frustumCulled = true;
  const outer = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -0.5;
  inner.add(strand.mesh);
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  edges.translate(0, 0.5, 0);
  const ghost = new THREE.LineSegments(edges, dashed(0.035));
  ghost.computeLineDistances();
  inner.add(ghost);
  outer.add(inner);
  outer.rotation.set(TILT, 0.72, 0);
  const s = stats({ infillPct, spec }, sizes[1].mm, f);
  return {
    id, kind: "cube", intro: id === "hero", text: null, product, anchor, outer, inner, strand, mat, ghost, filament: f, size: 1, fontPx: 0, spin: 0, spinSpeed: 0.1,
    meters: s.lineM, realLayers: s.layers, key: "", baseY: 0, par: 0, cy: 0, win: { start: 0, end: 0 },
  };
}

function textPrint(id: string, product: number, f: Filament, text: TextOpts, intro = false): Print {
  const outer = new THREE.Group();
  const inner = new THREE.Group();
  outer.add(inner);
  // the word is printed flat on a bed that faces the camera: bed x -> right, bed z -> down, up -> towards us
  outer.rotation.x = Math.PI / 2;
  return {
    id, kind: "text", intro, text, product, anchor: id, outer, inner, strand: null, mat: filamentMaterial(f),
    ghost: null, filament: f, size: 1, fontPx: 0, spin: 0, spinSpeed: 0, meters: 0, realLayers: 0, key: "", baseY: 0, par: 0, cy: 0,
    win: { start: 0, end: 0 },
  };
}

// (Re)build a title's toolpath from its DOM element when the font, size or text changes.
function buildText(p: Print) {
  const el = document.querySelector<HTMLElement>(`[data-station="${p.anchor}"]`);
  if (!el) return false;
  if (p.strand && textKey(el, p.text!) === p.key) return true;
  const built = textToolpath(el, p.text!);
  if (!built) return false;
  p.key = built.key;
  if (p.strand) {
    p.inner.remove(p.strand.mesh);
    p.strand.dispose();
  }
  if (p.ghost) {
    p.inner.remove(p.ghost);
    p.ghost.geometry.dispose();
  }
  p.strand = new StrandMesh(built.tp, p.mat, 6);
  p.strand.mesh.frustumCulled = true;
  p.inner.add(p.strand.mesh);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(built.ghost, 3));
  p.ghost = new THREE.LineSegments(g, dashed(5));
  p.ghost.computeLineDistances();
  p.inner.add(p.ghost);
  p.fontPx = built.fontPx;
  return true;
}

function connMaterial() {
  const offA = { value: new THREE.Vector3() };
  const offB = { value: new THREE.Vector3() };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 });
  // the ends of a connector follow the titles' parallax: each end is offset, blended along the tube
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uOffA = offA;
    sh.uniforms.uOffB = offB;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aT;\nuniform vec3 uOffA;\nuniform vec3 uOffB;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed += mix(uOffA, uOffB, smoothstep(0.0, 1.0, aT));");
  };
  m.customProgramCacheKey = () => "connector";
  return { m, offA, offB };
}

function buildConn(): Conn {
  const { m, offA, offB } = connMaterial();
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m);
  mesh.frustumCulled = false;
  return { mesh, curve: null, tubular: 220, radial: 6, offA, offB, travel: false };
}

const _a = new THREE.Vector3();
const _o = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();
const _ca = new THREE.Color();
const _cb = new THREE.Color();

function shapeConn(c: Conn, pts: THREE.Vector3[], radius: number, from: string, to: string, unit: number) {
  c.curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  c.tubular = THREE.MathUtils.clamp(Math.round(c.curve.getLength() / (unit * 0.035)), 160, 1100);
  const geo = new THREE.TubeGeometry(c.curve, c.tubular, radius, c.radial, false);
  const ring = c.radial + 1;
  const t = new Float32Array((c.tubular + 1) * ring);
  for (let i = 0; i <= c.tubular; i++) t.fill(i / c.tubular, i * ring, (i + 1) * ring);
  geo.setAttribute("aT", new THREE.BufferAttribute(t, 1));
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

// where the head is on a print, in world space, and how it's held
function printHead(p: Print, out: THREE.Vector3, q: THREE.Quaternion) {
  if (!p.strand) {
    p.outer.getWorldPosition(out);
    q.copy(p.kind === "text" ? Q_WRITE : p.outer.quaternion);
    return;
  }
  out.copy(p.strand.head);
  out.y += p.strand.tp.h * 0.5;
  p.inner.updateWorldMatrix(true, false);
  p.inner.localToWorld(out);
  if (p.kind === "text") q.copy(Q_WRITE);
  else p.inner.getWorldQuaternion(q);
}

const nozzleSize = (p: Print) => (p.kind === "text" ? p.size * 0.62 : p.size * 0.5);

function Line() {
  const { camera, size } = useThree();
  const root = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    // the headline is drawn as outlines, a single strand round every letter; "line." in orange
    const outline: TextOpts = { perimeters: 1, infill: "none", bead: 0.034 };
    const prints: Print[] = [
      textPrint("h:1", -1, INK, outline, true),
      textPrint("h:2", -1, INK, outline, true),
      textPrint("h:3", -1, INK, outline, true),
      textPrint("h:4", -1, filaments.signal, outline, true),
      cubePrint("hero", "hero", -1, heroSpec, filaments.signal, 15),
    ];
    // product names: one layer, a perimeter and the product's own infill pattern inside
    products.forEach((p, i) => {
      prints.push(textPrint(`t:${p.slug}`, i, INK, { perimeters: 1, infill: p.spec.infill, bead: 0.022 }));
      prints.push(cubePrint(p.slug, p.slug, i, p.spec, filaments[p.filaments[0]], p.infillPct));
    });
    prints.push(cubePrint("live", "live", -1, liveSpec, filaments[liveOrders[0].filament], 20));
    const conns = prints.map(() => buildConn()); // conns[i] runs into seq[i]
    return { prints, conns, nozzle: makeNozzle() };
  }, []);

  useEffect(() => {
    const g = root.current!;
    scene.prints.forEach((p) => g.add(p.outer));
    scene.conns.forEach((c) => g.add(c.mesh));
    g.add(scene.nozzle);
    return () => {
      scene.prints.forEach((p) => {
        p.strand?.dispose();
        p.mat.dispose();
      });
      scene.conns.forEach((c) => c.mesh.geometry.dispose());
      document.documentElement.classList.remove("gl-titles");
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
    seq: [] as Print[],
    introN: 0, // how many prints run on the opening clock
    introDur: [] as number[], // seconds for each element of the opening (connector, print, ...)
    u: 1,
  });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const s = st.current;
    const { prints, conns, nozzle } = scene;
    const vw = size.width;
    const vh = size.height;
    const u = (2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / vh;
    s.u = u;
    const scrollY = window.scrollY;
    camera.position.y = -scrollY * u;

    if (s.laidOut !== layoutVersion() || s.vw !== vw || s.vh !== vh) {
      s.laidOut = layoutVersion();
      s.vw = vw;
      s.vh = vh;
      layout(prints, conns, s, u, vw, vh);
    }
    const seq = s.seq;
    const last = seq.length - 1;

    // titles drift in ahead of the page, more slowly than it scrolls, until they lock into place
    for (const p of seq) {
      if (p.kind !== "text" || p.intro) continue;
      const leadPx = reducedMotion ? 0 : Math.max(0, p.cy - scrollY - TITLE_LOCK * vh) * PARALLAX;
      p.par = leadPx * u;
      p.outer.position.y = p.baseY + p.par;
    }
    conns.forEach((c, i) => {
      const a = seq[i - 1];
      const b = seq[i];
      c.offA.value.set(0, a?.kind === "text" ? a.par : 0, 0);
      c.offB.value.set(0, b?.kind === "text" ? b.par : 0, 0);
    });

    // --- where the line should be: the intro by time, then the scroll
    if (store.get().ready) s.introT += dt * (scrollY > 30 ? 5 : 1);
    const K = s.introN;
    let introG = 2 * K;
    if (!reducedMotion) {
      let t = s.introT;
      for (let e = 0; e < s.introDur.length; e++) {
        if (t < s.introDur[e]) {
          introG = e + t / s.introDur[e];
          break;
        }
        t -= s.introDur[e];
      }
    }
    let target = introG;
    if (introG >= 2 * K) {
      target = 2 * last + 1;
      for (let i = K; i <= last; i++) {
        const w = seq[i].win;
        const prevEnd = seq[i - 1].win.end;
        if (scrollY < w.start) {
          target = 2 * i + THREE.MathUtils.clamp((scrollY - prevEnd) / Math.max(1, w.start - prevEnd), 0, 1);
          break;
        }
        if (i < last && scrollY < w.end) {
          target = 2 * i + 1 + (scrollY - w.start) / (w.end - w.start);
          break;
        }
      }
      target = Math.max(2 * K, target);
    }
    const prevG = s.G;
    s.G = reducedMotion ? target : s.G + (target - s.G) * (1 - Math.exp(-dt * 6.5));
    if (Math.abs(target - s.G) < 1e-4) s.G = target;
    const G = s.G;

    // --- the live printer runs on its own clock once the line reaches it
    const liveIdx = 2 * last + 1;
    const live = seq[last];
    let liveP = 0;
    if (live && G >= liveIdx - 1e-3) {
      s.liveT += dt;
      const cycle = LIVE_PRINT + LIVE_HOLD;
      if (s.liveT > cycle) {
        s.liveT -= cycle;
        s.liveOrder = (s.liveOrder + 1) % liveOrders.length;
        const f = filaments[liveOrders[s.liveOrder].filament];
        live.filament = f;
        styleMaterial(live.mat, f);
        paintConn(conns[last], seq[last - 1].filament.hex, f.hex);
      }
      liveP = reducedMotion ? 1 : Math.min(1, s.liveT / LIVE_PRINT);
      // when it's done it sinks into the plate, as if lifted off and shipped
      const out = THREE.MathUtils.smoothstep(s.liveT, cycle - 0.7, cycle);
      live.inner.scale.set(1, Math.max(0.001, 1 - out), 1);
    } else if (live) {
      s.liveT = 0;
      live.inner.scale.set(1, 1, 1);
    }
    line.live.progress = liveP;
    line.live.order = s.liveOrder;

    // --- draw the prints, the connectors and the numbers
    const hover = store.get().hover;
    let meters = 0;
    let layers = 0;
    seq.forEach((p, i) => {
      const prog = i === last ? liveP : THREE.MathUtils.clamp(G - (2 * i + 1), 0, 1);
      p.strand?.set(prog, p.kind === "text" ? p.fontPx * 0.9 : 0.32);
      if (p.ghost) {
        const gm = p.ghost.material as THREE.LineDashedMaterial;
        gm.opacity = (p.kind === "text" ? 0.4 : 0.3) * (1 - THREE.MathUtils.smoothstep(prog, 0.02, p.kind === "text" ? 0.9 : 0.4));
        p.ghost.visible = gm.opacity > 0.005;
      }
      if (p.kind === "cube") {
        const want = reducedMotion ? 0 : hover === p.id ? 1.1 : 0.12;
        p.spinSpeed += (want - p.spinSpeed) * (1 - Math.exp(-dt * 4));
        p.spin += p.spinSpeed * dt;
        p.inner.rotation.y = p.spin;
      }
      line.progress.set(p.id, prog);
      if (p.kind === "cube" && p.product >= 0) {
        meters += prog * p.meters;
        layers += prog * p.realLayers;
      }
    });
    conns.forEach((c, i) => {
      const t = THREE.MathUtils.clamp(G - 2 * i, 0, 1);
      const segs = Math.floor(t * c.tubular);
      c.mesh.geometry.setDrawRange(0, segs * c.radial * 6);
      c.mesh.visible = segs > 0 && i < seq.length && !c.travel;
    });
    line.meters = meters;
    line.layer = layers;

    // --- the nozzle rides the head of the line
    if (!seq.length) return;
    const e = Math.min(Math.floor(G), liveIdx);
    const f = G - e;
    if (e % 2 === 1) {
      const p = seq[(e - 1) / 2];
      printHead(p, _a, _q);
      nozzle.scale.setScalar(nozzleSize(p));
    } else {
      const i = e / 2;
      const c = conns[i];
      const b = seq[i];
      const a = seq[i - 1];
      const k = THREE.MathUtils.smoothstep(f, 0, 1);
      if (c.curve) c.curve.getPointAt(Math.min(1, f), _a);
      _o.copy(c.offA.value).lerp(c.offB.value, k);
      _a.add(_o);
      if (b.kind === "text") _qb.copy(Q_WRITE);
      else b.inner.getWorldQuaternion(_qb);
      if (a) {
        if (a.kind === "text") _qa.copy(Q_WRITE);
        else a.inner.getWorldQuaternion(_qa);
        _q.slerpQuaternions(_qa, _qb, THREE.MathUtils.smoothstep(f, 0.1, 0.9));
      } else _q.copy(_qb);
      nozzle.scale.setScalar(THREE.MathUtils.lerp(a ? nozzleSize(a) : nozzleSize(b), nozzleSize(b), f));
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

// Place every print on its DOM box, put them in page order, work out the scroll range each
// one prints over, and route the line between them.
function layout(
  prints: Print[],
  conns: Conn[],
  s: { seq: Print[]; introN: number; introDur: number[] },
  u: number,
  vw: number,
  vh: number,
) {
  let built = 0;
  const texts = prints.filter((p) => p.kind === "text");
  for (const p of prints) {
    const box = boxes.get(p.anchor);
    p.outer.visible = !!box;
    if (!box) continue;
    p.cy = box.cy;
    if (p.kind === "cube") {
      p.size = (box.w * u) / 1.95;
      p.outer.position.set((box.cx - vw / 2) * u, -(box.cy - vh / 2) * u, 0);
      p.outer.scale.setScalar(p.size);
    } else {
      if (buildText(p)) built++;
      p.size = (p.fontPx || box.h) * u;
      p.baseY = -(box.cy - box.h / 2 - vh / 2) * u;
      p.outer.position.set((box.cx - box.w / 2 - vw / 2) * u, p.baseY, 0);
      p.outer.scale.setScalar(u);
    }
    p.outer.updateMatrixWorld(true);
  }
  // the headline and names are drawn by the line now; the DOM copy stays for screen readers
  document.documentElement.classList.toggle("gl-titles", built === texts.length);

  // order: the opening (headline, then the hero piece), each product's name and piece in page
  // order, then the live printer
  const seq: Print[] = prints.filter((p) => p.intro && p.outer.visible);
  const introN = seq.length;
  for (let i = 0; i < products.length; i++) {
    const pair = prints.filter((p) => p.product === i && p.outer.visible);
    pair.sort((a, b) => a.cy - b.cy);
    seq.push(...pair);
  }
  const live = prints[prints.length - 1];
  if (live.outer.visible) seq.push(live);
  s.seq = seq;
  s.introN = introN;

  // the opening runs on a clock: a beat to drop in, each line of the headline written at a steady
  // speed with a quick return between lines, then the hero piece
  s.introDur = [];
  for (let i = 0; i < introN; i++) {
    const p = seq[i];
    s.introDur.push(i === 0 ? INTRO_LEAD : p.kind === "cube" ? 0.7 : 0.32);
    s.introDur.push(p.kind === "cube" ? INTRO_CUBE : THREE.MathUtils.clamp((p.strand?.tp.length ?? 600) / 1100, 0.6, 2.2));
  }

  // scroll ranges: names finish as they lock in, pieces when they reach the middle
  seq.forEach((p, i) => {
    if (i < introN) return (p.win = { start: 0, end: 0 });
    const f0 = p.kind === "text" ? 0.98 : 0.92;
    const f1 = p.kind === "text" ? TITLE_LOCK : 0.5;
    const prev = seq[i - 1].win;
    const link = seq[i - 1].product === p.product && p.product >= 0;
    const start = Math.max(p.cy - f0 * vh, prev.end + vh * (link ? 0.03 : 0.12));
    const end = Math.max(p.cy - f1 * vh, start + vh * (p.kind === "text" ? 0.16 : 0.22));
    p.win = { start, end };
  });

  const cubes = prints.filter((p) => p.kind === "cube" && p.outer.visible);
  seq.forEach((p, i) => route(conns[i], seq[i - 1], p, cubes, u, vw, vh));
  if (import.meta.env.DEV) (window as unknown as { __seq: unknown }).__seq = seq.map((p) => ({ id: p.id, ...p.win }));
  for (let i = seq.length; i < conns.length; i++) conns[i].mesh.visible = false;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// One connector, from the end of print `a` (or from off-screen) to the start of print `b`.
function route(c: Conn, a: Print | undefined, b: Print, cubes: Print[], u: number, vw: number, vh: number) {
  const pts: THREE.Vector3[] = [];
  const sB = b.size;
  const sA = a ? a.size : sB;
  const avg = (sA + sB) / 2;

  // --- leave print a
  const style: Route = !a
    ? "lead"
    : b.id === "live"
      ? "eight"
      : b.intro
        ? b.kind === "cube" ? "drop" : "hop" // between the headline's lines, and on to the hero piece
        : a.product === b.product
          ? LINKS[b.product % LINKS.length]
          : ROUTES[b.product % ROUTES.length];
  const exitN = a ? 2 : 1;
  if (!a) {
    pts.push(V(vw * 0.6 * u, vh * 0.72 * u, -1));
  } else if (a.kind === "cube") {
    const top = a.outer.localToWorld(V(0, 0.5, 0));
    const up = V(0, 1, 0).applyQuaternion(a.outer.quaternion);
    pts.push(top, top.clone().addScaledVector(up, sA * 0.32));
  } else {
    let end: THREE.Vector3;
    if (a.strand) {
      const tp = a.strand.tp;
      const o = tp.count * 6 - 3;
      end = a.inner.localToWorld(V(tp.seg[o], tp.h / 2, tp.seg[o + 2]));
    } else end = a.outer.position.clone();
    // leave a word downwards and forwards, so the line never crosses back over it
    pts.push(end, end.clone().add(V(sA * 0.2, -sA * 0.35, sA * 0.5)));
  }
  c.travel = !!a && a.intro && b.intro && a.kind === "text" && b.kind === "text";

  // --- arrive at print b
  const tail: THREE.Vector3[] = [];
  let entry: THREE.Vector3;
  if (b.kind === "cube") {
    entry = b.outer.localToWorld(V(0, -0.5, 0));
    const up = V(0, 1, 0).applyQuaternion(b.outer.quaternion);
    const centre = b.outer.position.clone();
    const from = pts[pts.length - 1];
    const side = Math.sign(from.x - centre.x) || 1;
    tail.push(
      centre.clone().add(V(side * sB * 0.95, 0, sB * 0.3)),
      entry.clone().addScaledVector(up, -sB * 0.5).add(V(side * sB * 0.2, 0, 0)),
      entry.clone().addScaledVector(up, -sB * 0.1),
      entry,
    );
  } else {
    if (!b.strand) {
      entry = b.outer.position.clone();
    } else {
      const tp = b.strand.tp;
      entry = b.inner.localToWorld(V(tp.seg[0], tp.h / 2, tp.seg[2]));
    }
    tail.push(entry.clone().add(V(-sB * 0.3, sB * 0.25, sB * 0.7)), entry.clone().add(V(0, 0, sB * 0.1)), entry);
  }

  // --- the run in between, a different shape each time
  const M0 = pts[pts.length - 1];
  const M1 = tail[0];
  const axis = M1.clone().sub(M0);
  const across = new THREE.Vector3().crossVectors(axis, V(0, 0, 1)).normalize();
  if (across.lengthSq() < 0.5) across.set(1, 0, 0);
  const Z = V(0, 0, 1);
  const along = (t: number) => M0.clone().lerp(M1, t);
  const mid = along(0.5);
  const out = Math.sign(M0.x) || 1;
  switch (style) {
    case "lead":
      pts.push(V(entry.x + sB * 0.8, entry.y + sB * 1.3, sB * 0.4));
      break;
    case "swing": { // a long lazy S, swinging out past the page's edges and back
      const L = M0.distanceTo(M1);
      pts.push(
        M0.clone().add(V(out * avg * 1.1, -L * 0.12, avg * 0.3)),
        along(0.45).add(V(-out * avg * 2.4, 0, avg * 1.1)),
        along(0.78).add(V(out * avg * 1.2, 0, avg * 0.5)),
      );
      break;
    }
    case "coil": { // a spring wound round the path, tipped towards us so every turn reads as a loop
      const dir = axis.clone().normalize();
      for (let k = 1; k < 140; k++) {
        const t = k / 140;
        const r = avg * 0.5 * Math.min(1, Math.sin(Math.PI * t) * 2.5);
        const a2 = Math.PI * 2 * 6 * t;
        pts.push(
          along(t)
            .addScaledVector(across, Math.cos(a2) * r)
            .addScaledVector(dir, Math.sin(a2) * r * 0.7)
            .addScaledVector(Z, Math.sin(a2) * r * 0.7 + avg * 0.4 * Math.sin(Math.PI * t)),
        );
      }
      break;
    }
    case "loop": { // one big loop-the-loop, passing in front of itself
      const r = avg * 0.62;
      const C = mid.clone().add(V(0, r * 0.4, avg * 0.5));
      const bottom = C.clone().add(V(0, -r, 0));
      pts.push(along(0.28).add(V(0, 0, avg * 0.25)), bottom.clone().add(V(-r * 0.9, r * 0.1, 0)));
      for (let k = 0; k <= 24; k++) {
        const th = -Math.PI / 2 + (Math.PI * 2 * k) / 24;
        pts.push(C.clone().add(V(Math.cos(th) * r, Math.sin(th) * r, (k / 24) * avg * 0.7)));
      }
      pts.push(bottom.clone().add(V(r * 0.9, r * 0.1, avg * 0.7)), along(0.78).add(V(0, 0, avg * 0.3)));
      break;
    }
    case "zigzag": { // square steps side to side, like a printer's travel moves
      const steps = 4;
      const xl = mid.x - avg * 1.3;
      const xr = mid.x + avg * 1.3;
      const e = avg * 0.05; // a whisker of rounding at each corner
      let x = out > 0 ? xr : xl;
      pts.push(V(x, M0.y - e, avg * 0.3));
      for (let k = 1; k <= steps; k++) {
        const y = M0.y + (M1.y - M0.y) * (k / (steps + 1));
        pts.push(V(x, y + e, avg * 0.3), V(x + (x === xr ? -e : e), y, avg * 0.3));
        x = x === xr ? xl : xr;
        pts.push(V(x + (x === xr ? -e : e), y, avg * 0.3), V(x, y - e, avg * 0.3));
      }
      break;
    }
    case "wave": // a sine wave down the gap
      for (let k = 1; k < 90; k++) {
        const t = k / 90;
        pts.push(
          along(t)
            .addScaledVector(across, Math.sin(Math.PI * 2 * 4 * t) * avg * 1.05 * Math.min(1, Math.sin(Math.PI * t) * 2))
            .add(V(0, 0, avg * 0.5 * Math.sin(Math.PI * t))),
        );
      }
      break;
    case "swoop": // a big arc out towards the camera and back
      pts.push(along(0.15).add(V(-out * avg * 2.2, avg * 0.3, avg * 2)), along(0.5).add(V(out * avg * 1.4, 0, 9)), along(0.85).add(V(-out * avg * 0.4, 0, avg * 1.6)));
      break;
    case "eight": { // a figure of eight, crossing in front of itself
      const a2 = avg * 0.75;
      const C = mid.clone().add(V(0, 0, avg * 0.6));
      pts.push(along(0.25));
      for (let k = 0; k <= 32; k++) {
        const th = (Math.PI * 2 * k) / 32;
        pts.push(C.clone().add(V(Math.sin(th) * a2, Math.sin(th) * Math.cos(th) * a2 * 1.3, Math.cos(th) * avg * 0.45)));
      }
      pts.push(along(0.75));
      break;
    }
    case "curl": // a little pigtail curl between a name and its piece
      for (let k = 1; k < 28; k++) {
        const t = k / 28;
        const r = avg * 0.16 * Math.sin(Math.PI * t);
        const a2 = Math.PI * 2 * 1.5 * t;
        pts.push(along(t).addScaledVector(across, Math.cos(a2) * r).addScaledVector(Z, Math.sin(a2) * r + avg * 0.25));
      }
      break;
    case "hop": // up and over
      pts.push(mid.clone().add(V(0, avg * 0.6, avg * 0.5)));
      break;
    case "drop": // a sagging hang, like slack filament
      pts.push(mid.clone().add(V(0, -avg * 0.7, avg * 0.3)));
      break;
  }

  // out of a word, stay below its baseline until clear of it
  if (a?.kind === "text" && !c.travel) {
    const below = a.outer.position.y - a.size * 1.05 - sA * 0.12;
    for (const p of pts.slice(exitN)) p.y = Math.min(p.y, below);
  }

  // keep the run in front of every piece it passes, so it never cuts through a model: push the
  // middle of the route forward past the nearest face, stepping out towards us as it leaves
  const middle = pts.slice(exitN);
  if (middle.length) {
    const all = [...pts, ...tail];
    const minX = Math.min(...all.map((p) => p.x));
    const maxX = Math.max(...all.map((p) => p.x));
    const minY = Math.min(...all.map((p) => p.y));
    const maxY = Math.max(...all.map((p) => p.y));
    let floor = -Infinity;
    for (const cb of cubes) {
      const P = cb.outer.position;
      if (P.x + cb.size < minX || P.x - cb.size > maxX || P.y + cb.size < minY || P.y - cb.size > maxY) continue;
      floor = Math.max(floor, P.z + cb.size * 0.9);
    }
    if (floor > -Infinity) {
      const dz = Math.max(0, floor + avg * 0.12 - Math.min(...middle.map((p) => p.z)));
      if (dz > 0) {
        for (const p of middle) p.z += dz;
        const lift = pts[exitN - 1];
        pts.splice(exitN, 0, lift.clone().add(V(0, a?.kind === "cube" ? sA * 0.12 : 0, dz * 0.85)));
      }
    }
  }
  pts.push(...tail);
  // drop points that land on top of each other; the curve can't handle zero-length steps
  const clean = pts.filter((p, k) => k === 0 || p.distanceToSquared(pts[k - 1]) > 1e-8);
  const beadA = a?.strand ? a.strand.tp.h * (a.kind === "text" ? u : a.size) : 0;
  const beadB = b.strand ? b.strand.tp.h * (b.kind === "text" ? u : b.size) : 0;
  const radius = 0.62 * (a ? (beadA + beadB) / 2 : beadB);
  shapeConn(c, clean, Math.max(radius, 0.01), a ? a.filament.hex : b.filament.hex, b.filament.hex, avg);
}
