// The five rings: founders, board, sponsors, management, lenders. One per stakeholder group.
// Scroll moves them through four states, one per scene:
//   0 gyroscope (idle drift) · 1 aligned (one plane) · 2 strain (wrenched apart) · 3 measured (a dial, facing you)
import {
  ACESFilmicToneMapping, Color, Euler, Group, Mesh, MeshPhysicalMaterial, PerspectiveCamera, PMREMGenerator,
  Quaternion, Scene, SRGBColorSpace, TorusGeometry, Vector3, WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const R = [1.0, 1.2, 1.4, 1.6, 1.8];
const HOT = 2; // the ring that strains first: it carries the accent
type Pose = [number, number, number][];

const GYRO: Pose = [[1.2, 0.3, 0.2], [-0.5, 1.1, 0.4], [0.35, -0.8, 1.0], [1.45, 0.75, -0.6], [-1.05, -0.35, 0.9]];
const ALIGNED: Pose = R.map(() => [-1.12, 0.32, 0]);
const STRAIN: Pose = [[-1.12, 0.32, 0], [-0.62, 0.72, 0.2], [-1.62, -0.1, -0.35], [-0.5, -0.3, 0.45], [-1.55, 0.95, -0.2]];
const DIAL: Pose = R.map(() => [0, 0, 0]);
const POSES = [GYRO, ALIGNED, STRAIN, DIAL];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function mountRings(canvas: HTMLCanvasElement, stage: HTMLElement, story: HTMLElement) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return; // the SVG still stays visible
  }
  stage.dataset.gl = "";
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const group = new Group();
  scene.add(group);
  const champagne = new MeshPhysicalMaterial({ color: new Color("#d8c3a0"), metalness: 1, roughness: 0.26, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const accent = new MeshPhysicalMaterial({ color: new Color("#f0a46a"), metalness: 1, roughness: 0.22, clearcoat: 0.8, emissive: new Color("#5a2a10"), emissiveIntensity: 0 });
  const rings = R.map((r, i) => {
    const m = new Mesh(new TorusGeometry(r, i === HOT ? 0.022 : 0.016, 32, 360), i === HOT ? accent : champagne);
    group.add(m);
    return m;
  });

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  let w = 0, h = 0, mobile = false;
  const resize = () => {
    w = stage.clientWidth;
    h = stage.clientHeight;
    mobile = w < 900;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  // Scroll progress through the story, 0..3: one unit per scene.
  let p = 0;
  const measure = () => {
    const r = story.getBoundingClientRect();
    const total = r.height - innerHeight;
    p = total > 0 ? Math.min(3, Math.max(0, (-r.top / total) * 3)) : 0;
  };
  addEventListener("scroll", measure, { passive: true });
  measure();

  const q = new Quaternion(), qa = new Quaternion(), qb = new Quaternion(), e = new Euler();
  const center = new Vector3();
  let visible = true, last = performance.now(), t = 0, scene0 = -1;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(story);

  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduced) t += dt;

    const k = Math.min(2, Math.floor(p));
    const f = smooth(0.2, 0.8, p - k);
    const sceneNow = Math.round(p);
    if (sceneNow !== scene0) {
      scene0 = sceneNow;
      stage.dataset.stage = String(sceneNow);
    }

    rings.forEach((m, i) => {
      const pose = (n: number): Quaternion => {
        const [x, y, z] = POSES[n][i];
        if (n === 0) e.set(x + Math.sin(t * 0.21 + i) * 0.35, y + t * 0.09 * (i % 2 ? 1 : -1), z + Math.cos(t * 0.17 + i * 2) * 0.25);
        else if (n === 2) e.set(x + Math.sin(t * (i === HOT ? 7 : 0.6) + i) * (i === HOT ? 0.018 : 0.04), y + Math.cos(t * 0.5 + i) * 0.04, z);
        else e.set(x + Math.sin(t * 0.4 + i) * 0.015, y, z);
        return n === 0 || n === 2 ? qa.setFromEuler(e).clone() : qb.setFromEuler(e).clone();
      };
      q.copy(pose(k)).slerp(pose(k + 1), f);
      m.quaternion.copy(q);
    });
    accent.emissiveIntensity = Math.max(0, 1 - Math.abs(p - 2)) * 0.9;

    // Where the rings sit: right of the copy on desktop, above it on a phone; centered as the dial.
    const dial = smooth(2.2, 2.8, p);
    const tx = mobile ? 0 : 1.55 * (1 - dial) + 1.62 * dial;
    const ty = mobile ? 1.32 : 0.05;
    const s = mobile ? 0.5 : 1 - dial * 0.08;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    group.position.set(tx, ty, 0);
    group.scale.setScalar(s);
    group.rotation.set(pointer.y * 0.08, pointer.x * 0.12, 0);

    // Hand the dial's center to CSS so the composite sits inside the rings.
    center.set(tx, ty, 0).project(camera);
    stage.style.setProperty("--cx", `${((center.x + 1) / 2) * w}px`);
    stage.style.setProperty("--cy", `${((1 - center.y) / 2) * h}px`);

    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
}
