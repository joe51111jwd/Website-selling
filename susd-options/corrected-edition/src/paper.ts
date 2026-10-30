import { mulberry32 } from './marks/rng';

// Paper grain, drawn once at load into a small canvas (no image files, no runtime filters):
// fine speckle plus a few short, mostly horizontal fibres. Exposed as --grain.
type Layer = { y: number; blur: number; a: number };

// Every bitmap is drawn on a CPU canvas and encoded asynchronously (toBlob, off the main thread)
// into an object URL, so baking the paper never holds up the first paint. When the last one
// lands, html gets .is-lit and the lamp and the shadows fade in (see sheet.css).
let pending = 0;
function cpuCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | null;
  return { c, ctx };
}
function publish(c: HTMLCanvasElement, prop: string) {
  pending++;
  const done = () => {
    pending--;
    if (!pending) document.documentElement.classList.add('is-lit');
  };
  try {
    c.toBlob((b) => {
      if (b) document.documentElement.style.setProperty(prop, `url(${URL.createObjectURL(b)})`);
      done();
    }, 'image/png');
  } catch {
    done();
  }
}

/**
 * A soft paper shadow, blurred once into a bitmap at half scale. Drawn as a stretched image,
 * it costs nothing to composite (large CSS blurs on rotated sheets are slow to rasterise).
 * w, h: the object in design px; m: margin around it. Returns the data URL.
 */
function makeShadow(w: number, h: number, m: number, layers: Layer[]) {
  const k = 0.4;
  const { c, ctx } = cpuCanvas(Math.round((w + 2 * m) * k), Math.round((h + 2 * m) * k));
  if (!ctx) return null;
  const off = 20000;
  for (const l of layers) {
    ctx.shadowColor = `rgba(8, 5, 2, ${l.a})`;
    ctx.shadowBlur = l.blur * k;
    ctx.shadowOffsetX = off;
    ctx.shadowOffsetY = l.y * k;
    ctx.fillStyle = '#000';
    ctx.fillRect(m * k - off, m * k, w * k, h * k);
  }
  return c;
}

/** Installs --shadow-sheet (every proof sheet) and --shadow-lift (the playbook as it lifts). */
export function installShadows() {
  try {
    const sheet = makeShadow(1240, 844, 180, [
      { y: 14, blur: 28, a: 0.45 },
      { y: 50, blur: 110, a: 0.4 },
    ]);
    if (sheet) publish(sheet, '--shadow-sheet');
    // The lift shadow is only needed once Strike it runs: bake it when the page is idle.
    const later = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 400));
    later(() => {
      const lift = makeShadow(1240, 844, 200, [{ y: 40, blur: 90, a: 0.55 }]);
      if (lift) publish(lift, '--shadow-lift');
    });
  } catch {
    /* no soft shadows: the contact shadow remains */
  }
}

/** A smooth field drawn once into a small canvas and stretched (cheaper to paint than CSS gradients). */
function bake(w: number, h: number, paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const { c, ctx } = cpuCanvas(w, h);
  if (!ctx) return null;
  paint(ctx, w, h);
  return c;
}

/** The raking light on the paper (--light) and the lamp's pool on the desk (--lamp). */
export function installLight() {
  try {
    // Light layer: drawn for the sheet plus 7% overscan each side (so it can rotate ±4°).
    const light = bake(228, 160, (ctx, w, h) => {
      const lin = ctx.createLinearGradient(0, 0, w, h);
      lin.addColorStop(0.3, 'rgba(255,255,255,0.08)');
      lin.addColorStop(0.72, 'rgba(0,0,0,0.07)');
      ctx.fillStyle = lin;
      ctx.fillRect(0, 0, w, h);
      const ell = (cx: number, cy: number, rx: number, ry: number, stops: [number, string][]) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(rx, ry);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        stops.forEach(([o, col]) => g.addColorStop(o, col));
        ctx.fillStyle = g;
        ctx.fillRect(-cx / rx, -cy / ry, w / rx, h / ry);
        ctx.restore();
      };
      ell(w * 0.42, h * 0.33, w * 0.36, h * 0.33, [
        [0, 'rgba(255,251,242,0.24)'],
        [1, 'rgba(255,251,242,0)'],
      ]);
      ell(w * 0.47, h * 0.38, w * 0.62, h * 0.6, [
        [0.55, 'rgba(60,40,20,0)'],
        [1, 'rgba(60,40,20,0.09)'],
      ]);
    });
    // The lamp's pool on the desk, per section: it fades to nothing before the section's top and
    // bottom edges, so sections join without seams.
    const lamp = (rx: number, ry: number, cy: number) =>
      bake(192, 120, (ctx, w, h) => {
        ctx.save();
        ctx.translate(w / 2, h * cy);
        ctx.scale(w * rx, h * ry);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, 'rgba(36,31,25,1)');
        g.addColorStop(0.48, 'rgba(36,31,25,0.55)');
        g.addColorStop(1, 'rgba(36,31,25,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      });
    if (light) publish(light, '--light');
    const l1 = lamp(0.62, 0.49, 0.5);
    if (l1) publish(l1, '--lamp');
  } catch {
    /* unlit: the desk colour alone */
  }
}

export function installGrain() {
  try {
    const size = 252; // 28 laid-line periods of 9 px, so the tile repeats seamlessly
    const { c, ctx } = cpuCanvas(size, size);
    if (!ctx) return;
    const r = mulberry32(1439);
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = r();
      const a = v < 0.5 ? 0 : Math.pow((v - 0.5) / 0.5, 2) * 26;
      d[i] = 74;
      d[i + 1] = 58;
      d[i + 2] = 40;
      d[i + 3] = a;
    }
    ctx.putImageData(img, 0, 0);
    // Laid lines: faint vertical lines every 9 px.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.018)';
    for (let x = 0; x < size; x += 9) ctx.fillRect(x, 0, 1, size);
    ctx.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const x = r() * size;
      const y = r() * size;
      const len = 6 + r() * 22;
      const ang = (r() - 0.5) * 0.5;
      ctx.strokeStyle = `rgba(96, 76, 52, ${0.03 + r() * 0.05})`;
      ctx.lineWidth = 0.5 + r() * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (len / 2) * Math.cos(ang), y + (r() - 0.5) * 2, x + len * Math.cos(ang), y + len * Math.sin(ang));
      ctx.stroke();
    }
    publish(c, '--grain');
  } catch {
    /* no grain: the paper is still paper */
  }
}
