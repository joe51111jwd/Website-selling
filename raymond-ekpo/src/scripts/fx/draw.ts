// The hero slide leans towards the cursor, and after its own edit has played the visitor can
// draw on it in red pen. Strokes are stored in slide coordinates so they survive a resize.
import { finePointer, still } from './frame';
import { track } from '../track';

type Pt = [number, number];

export function initDraw() {
  const fig = document.querySelector<HTMLElement>('[data-draw]');
  if (!fig || !finePointer) return;
  const stage = fig.querySelector<HTMLElement>('.mk-stage')!;
  const canvas = fig.querySelector<HTMLCanvasElement>('.mk-canvas')!;
  const hint = fig.querySelector<HTMLElement>('.mk-hint')!;
  const clear = fig.querySelector<HTMLButtonElement>('.mk-clear')!;
  const ctx = canvas.getContext('2d')!;
  const strokes: Pt[][] = [];
  let current: Pt[] | null = null;
  let tracked = false;

  const size = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    redraw();
  };

  const path = (pts: Pt[]) => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = ((pts[i][0] + pts[i + 1][0]) / 2) * w;
      const my = ((pts[i][1] + pts[i + 1][1]) / 2) * h;
      ctx.quadraticCurveTo(pts[i][0] * w, pts[i][1] * h, mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0] * w, last[1] * h);
    ctx.stroke();
  };

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#a3241f';
    ctx.lineWidth = Math.max(2, canvas.width / 260);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokes) if (s.length > 1) path(s);
  }

  const at = (e: PointerEvent): Pt => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  // The pen becomes available once the slide has finished its own edit
  setTimeout(
    () => {
      document.documentElement.classList.add('can-draw');
      hint.hidden = false;
      size();
    },
    still ? 0 : 5200,
  );
  addEventListener('resize', size);

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    canvas.setPointerCapture(e.pointerId);
    current = [at(e)];
    strokes.push(current);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!current) return;
    current.push(at(e));
    redraw();
  });
  const end = () => {
    if (!current) return;
    current = null;
    clear.hidden = false;
    if (!tracked) {
      tracked = true;
      track('Hero doodle');
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  clear.addEventListener('click', () => {
    strokes.length = 0;
    redraw();
    clear.hidden = true;
  });

  // Lean towards the cursor, and sit still while it's over the slide (so drawing lines up)
  if (still) return;
  const hero = fig.closest('section') ?? document.body;
  let tx = 0;
  let ty = 0;
  let rx = 0;
  let ry = 0;
  let raf = 0;
  const loop = () => {
    rx += (tx - rx) * 0.08;
    ry += (ty - ry) * 0.08;
    stage.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    stage.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    raf = Math.abs(tx - rx) + Math.abs(ty - ry) > 0.01 ? requestAnimationFrame(loop) : 0;
  };
  hero.addEventListener('pointermove', (e) => {
    const over = stage.contains(e.target as Node);
    const r = stage.getBoundingClientRect();
    const cx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
    const cy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
    tx = over ? 0 : -cy * 9;
    ty = over ? 0 : cx * 12;
    if (!raf) raf = requestAnimationFrame(loop);
  });
}
