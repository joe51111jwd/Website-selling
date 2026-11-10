/* grain — global film grain at near-zero cost.
   A 160px monochrome noise tile is generated once and set as a CSS background;
   a steps() keyframe animation jumps its position ~10x/s, so the compositor does all the work
   (no per-frame JS, no WebGL context spent on it). */

let tileURL = null;

function makeTile(size = 160) {
  if (tileURL) return tileURL;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    // approx gaussian: average of 3 uniforms, centred at mid-grey
    const n = (Math.random() + Math.random() + Math.random()) / 3;
    const v = Math.max(0, Math.min(255, 128 + (n - 0.5) * 2.4 * 255));
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  tileURL = c.toDataURL('image/png');
  return tileURL;
}

export class GrainFX {
  constructor(el, ctx, { injected = false } = {}) {
    this.kind = 'grain';
    this.canvas = el;
    this.injected = injected;
    el.classList.add('fx-grain');
    if (ctx.reducedMotion) el.classList.add('fx-grain--still');
    if (el.dataset.fxOpacity) el.style.setProperty('--fx-grain-opacity', el.dataset.fxOpacity);
    el.style.backgroundImage = `url(${makeTile()})`;
    el.setAttribute('aria-hidden', 'true');
  }
  active() {
    return false;
  }
  tick() {}
  resize() {}
  setTheme(name) {
    this.canvas.dataset.fxTheme = name;
  }
  destroy() {
    if (this.injected) this.canvas.remove();
    else {
      this.canvas.classList.remove('fx-grain', 'fx-grain--still');
      this.canvas.style.backgroundImage = '';
    }
  }
}
