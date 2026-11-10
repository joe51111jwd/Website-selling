// WLZR.TV in big red pixels with the bolt through it. Drawn on a coarse grid in a canvas, so it can
// "tune in" (the grid sharpens from a few blocks to full resolution), and lose signal now and then:
// rows slip sideways and a blue ghost splits off, harder on the beat when the radio is on.

import { radio } from "./radio";

const RED = "#ff1616";
const GHOST = "rgba(20,20,255,.55)";

export function wordmark(cv: HTMLCanvasElement) {
  const g = cv.getContext("2d")!;
  let rows = 34;
  let cells: Uint8Array = new Uint8Array(0), bolt: Uint8Array = new Uint8Array(0), cols = 0;
  let glitch = 0;
  let reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function raster(R: number) {
    rows = R;
    const font = `900 ${R * 1.02}px Archivo, "Arial Black", sans-serif`;
    const m = document.createElement("canvas").getContext("2d")!;
    m.font = font;
    (m as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "semi-expanded";
    const gapAt = m.measureText("WL").width;
    const gap = R * 0.3;
    const tw = m.measureText("WLZR.TV").width + gap;
    cols = Math.ceil(tw + R * 0.1);
    const c = document.createElement("canvas");
    c.width = cols; c.height = R;
    const x = c.getContext("2d", { willReadFrequently: true })!;
    x.font = font;
    (x as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "semi-expanded";
    x.textBaseline = "alphabetic";
    x.fillStyle = "#000";
    const base = R * 0.86;
    x.fillText("WL", 0, base);
    x.fillText("ZR.TV", gapAt + gap, base);
    const a = x.getImageData(0, 0, cols, R).data;
    cells = new Uint8Array(cols * R);
    for (let i = 0; i < cells.length; i++) cells[i] = a[i * 4 + 3] > 110 ? 1 : 0;
    // the bolt: a zigzag that crosses the gap between L and Z, overshooting top and bottom
    x.clearRect(0, 0, cols, R);
    const bx = gapAt + gap * 0.42;
    const pts: [number, number][] = [
      [bx - R * 0.12, -R * 0.02], [bx + R * 0.2, -R * 0.02], [bx + R * 0.12, R * 0.36], [bx + R * 0.34, R * 0.32],
      [bx + R * 0.1, R * 1.06], [bx + R * 0.14, R * 0.58], [bx - R * 0.08, R * 0.62],
    ];
    x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath();
    x.fill();
    const b = x.getImageData(0, 0, cols, R).data;
    bolt = new Uint8Array(cols * R);
    for (let i = 0; i < bolt.length; i++) bolt[i] = b[i * 4 + 3] > 90 ? 1 : 0;
    // knock a one-cell white gap around the bolt out of the letters
    const knock = new Uint8Array(cells.length);
    for (let y = 0; y < R; y++) for (let xx = 0; xx < cols; xx++) {
      if (!bolt[y * cols + xx]) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy, x2 = xx + dx;
        if (yy >= 0 && yy < R && x2 >= 0 && x2 < cols) knock[yy * cols + x2] = 1;
      }
    }
    for (let i = 0; i < cells.length; i++) if (knock[i] && !bolt[i]) cells[i] = 0;
  }

  function size() {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
  }

  function draw() {
    const W = cv.width, H = cv.height;
    g.clearRect(0, 0, W, H);
    // fit the grid, with headroom for the bolt
    const cs = Math.min(W / cols, (H * 0.92) / rows);
    const ox = (W - cols * cs) / 2, oy = (H - rows * cs) / 2;
    const slip = (y: number) => (glitch > 0 && Math.sin(y * 12.9898 + glitch * 78.233) > 0.72 ? Math.round(Math.sin(y * 3.1 + glitch * 9) * 5) : 0);
    const pass = (src: Uint8Array, color: string, dx = 0) => {
      g.fillStyle = color;
      for (let y = 0; y < rows; y++) {
        const s = slip(y);
        let run = -1;
        for (let x = 0; x <= cols; x++) {
          const on = x < cols && src[y * cols + x];
          if (on && run < 0) run = x;
          if (!on && run >= 0) {
            g.fillRect(Math.round(ox + (run + s + dx) * cs), Math.round(oy + y * cs), Math.ceil((x - run) * cs), Math.ceil(cs));
            run = -1;
          }
        }
      }
    };
    if (glitch > 0) pass(cells, GHOST, -2);
    pass(cells, RED);
    pass(bolt, RED);
    // the bolt's dark inner fracture
    g.fillStyle = "#b00000";
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (!bolt[y * cols + x]) continue;
      if (!bolt[y * cols + x + 1] && bolt[y * cols + x - 1]) g.fillRect(Math.round(ox + x * cs), Math.round(oy + y * cs), Math.ceil(cs), Math.ceil(cs));
    }
  }

  function tuneIn() {
    const steps = [5, 8, 12, 18, 26, 34];
    if (reduce) { raster(34); draw(); return; }
    steps.forEach((R, k) => setTimeout(() => { raster(R); draw(); }, 160 + k * 110));
  }

  function hit(len = 180) {
    if (reduce) return;
    const t0 = performance.now();
    const f = () => {
      const t = performance.now() - t0;
      glitch = t < len ? t / 37 + 1 : 0;
      draw();
      if (glitch) requestAnimationFrame(f);
    };
    f();
  }

  const idle = () => {
    hit(120 + Math.random() * 160);
    setTimeout(idle, 2600 + Math.random() * 4200);
  };

  size();
  raster(34);
  draw();
  void document.fonts.load('900 40px "Archivo"').then(() => { tuneIn(); setTimeout(idle, 3000); });
  cv.parentElement!.addEventListener("pointerenter", () => hit(320));
  radio.onBeat((_, strong) => strong && Math.random() < 0.5 && hit(90));

  return {
    resize() { size(); draw(); },
    get reduce() { return reduce; },
    set reduce(v: boolean) { reduce = v; },
  };
}
