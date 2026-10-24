import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { COVER, drawBack, drawCover, drawEndpaper, drawPageEdge, drawSpine, drawTitlePage } from "./cover";
import type { View } from "./content";

/*
  The hardcover in "Take a closer look": a page block between two boards, a spine, and a front board
  hinged at the spine so it can open. Studio lighting comes from RoomEnvironment (no HDR download) plus
  one key light; the shadow is a baked soft ellipse, so the scene stays cheap on phones. Every pose is
  a target the book eases toward.
*/

const W = 1.5;
const H = 2.25;
const D = 0.34;
const T = 0.034; // board thickness

type Pose = { rx: number; ry: number; open: number; x: number; dist: number };
const POSES: Record<View, Pose> = {
  front: { rx: 0.05, ry: -0.42, open: 0, x: 0, dist: 1 },
  spine: { rx: 0.05, ry: 1.2, open: 0, x: 0, dist: 1 },
  open: { rx: -0.5, ry: 0, open: Math.PI * 0.93, x: W * 0.5, dist: 1.22 },
  back: { rx: 0.05, ry: Math.PI + 0.42, open: 0, x: 0, dist: 1 },
};

export type BookScene = {
  setView: (v: View) => void;
  setActive: (on: boolean) => void;
  dispose: () => void;
};

export function createBook(canvas: HTMLCanvasElement): BookScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2.2, 5, 3.2);
  scene.add(key);

  // contact shadow: a blurred ellipse on the floor that stretches with the book's footprint
  const sc = document.createElement("canvas");
  sc.width = sc.height = 256;
  const sctx = sc.getContext("2d")!;
  const grad = sctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(0,0,0,0.5)");
  grad.addColorStop(0.45, "rgba(0,0,0,0.22)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(sc);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -H / 2 - 0.42;
  scene.add(ground);

  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    return t;
  };

  const jacket = (map: THREE.Texture) =>
    new THREE.MeshPhysicalMaterial({ map, color: 0xc8c8c8, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.34 });
  const board = new THREE.MeshStandardMaterial({ color: COVER.ink, roughness: 0.62 });
  const endpaper = new THREE.MeshStandardMaterial({ map: tex(drawEndpaper()), roughness: 0.9 });
  const paper = new THREE.MeshStandardMaterial({ color: "#f4efe4", roughness: 0.92 });
  const edgeTex = tex(drawPageEdge());
  const edge = new THREE.MeshStandardMaterial({ map: edgeTex, roughness: 0.95 });
  const edgeTop = new THREE.MeshStandardMaterial({ map: edgeTex.clone(), roughness: 0.95 });
  edgeTop.map!.rotation = Math.PI / 2;
  edgeTop.map!.center.set(0.5, 0.5);

  const book = new THREE.Group();

  // page block, recessed a little from the boards on three sides
  const pages = new THREE.Mesh(new THREE.BoxGeometry(W - 0.07, H - 0.08, D - T * 2 - 0.004), [
    edge, // +x fore-edge
    paper, // -x (against the spine)
    edgeTop, // +y
    edgeTop, // -y
    new THREE.MeshStandardMaterial({ map: tex(drawTitlePage()), roughness: 0.9 }), // +z first page
    paper, // -z
  ]);
  pages.position.x = -0.02;
  book.add(pages);

  // back board: jacket outside (-z), endpaper inside (+z)
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), [board, board, board, board, endpaper, jacket(tex(drawBack()))]);
  back.position.z = -(D / 2 - T / 2);
  book.add(back);

  // spine faces -x
  const spine = new THREE.Mesh(new THREE.BoxGeometry(T, H, D), [board, jacket(tex(drawSpine())), board, board, board, board]);
  spine.position.x = -W / 2 + T / 2;
  book.add(spine);

  // front board on a hinge at the spine
  const hinge = new THREE.Group();
  hinge.position.set(-W / 2 + T / 2, 0, D / 2 - T / 2);
  const front = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), [board, board, board, board, jacket(tex(drawCover())), endpaper]);
  front.position.x = W / 2 - T / 2;
  hinge.add(front);
  book.add(hinge);

  const pivot = new THREE.Group();
  pivot.add(book);
  scene.add(pivot);

  // ---- pose, drag and loop ----
  const cur: Pose = { ...POSES.front };
  let target: Pose = { ...POSES.front };
  let dragY = 0;
  let dragging = false;
  let lastX = 0;
  let active = false;
  let raf = 0;
  let last = performance.now();
  const t0 = last;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = 1 - Math.exp(-dt * 4.2);
    (Object.keys(cur) as (keyof Pose)[]).forEach((p) => (cur[p] += (target[p] - cur[p]) * k));
    if (!dragging) dragY += (0 - dragY) * (1 - Math.exp(-dt * 2.4));

    const t = (now - t0) / 1000;
    pivot.rotation.set(cur.rx, cur.ry + dragY + Math.sin(t * 0.5) * 0.03, 0);
    pivot.position.set(0, Math.sin(t * 0.9) * 0.025, 0);
    book.position.x = cur.x;
    hinge.rotation.y = -cur.open;
    // footprint: wide when the cover faces you, narrow on the spine, a full spread when open
    const turn = Math.abs(Math.sin(cur.ry + dragY));
    const spread = cur.open / Math.PI;
    ground.scale.set(W * 1.9 * (1 - turn * 0.6) + spread * W * 1.6, 1.1 + spread * 1.4, 1);

    // keep the whole book in frame at any aspect
    const fit = camera.aspect < 1 ? 1 / camera.aspect : 1;
    const dist = 7.1 * cur.dist * Math.min(fit, 1.9);
    camera.position.set(0, 0.55, dist);
    camera.lookAt(0, -0.05, 0);
    renderer.render(scene, camera);
  }

  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    dragY += (e.clientX - lastX) * 0.012;
    lastX = e.clientX;
  };
  const onUp = () => (dragging = false);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  return {
    setView(v) {
      target = { ...POSES[v] };
    },
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else cancelAnimationFrame(raf);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            (m as THREE.MeshStandardMaterial).map?.dispose();
            m.dispose();
          });
        }
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
