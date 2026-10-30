// The paper grain is an SVG feTurbulence tile (base.css --grain). Chrome re-runs that filter for every
// newly exposed tile while scrolling, which costs frames. Draw the same tile once into a canvas at load
// and swap in the bitmap: it looks identical and scrolls like any other image. Falls back silently.
export function bakeGrain() {
  // after the intro (about 3 s), when the main thread is idle: the swap is invisible, so it can wait
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  window.setTimeout(() => {
    if (w.requestIdleCallback) w.requestIdleCallback(bake, { timeout: 2000 });
    else bake();
  }, 3200);
}

function bake() {
  try {
    const root = document.documentElement;
    const raw = getComputedStyle(root).getPropertyValue('--grain').trim();
    const a = raw.indexOf('url("');
    const b = raw.lastIndexOf('")');
    if (a < 0 || b <= a) return;
    const src = raw.slice(a + 5, b);
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 240;
        c.height = 240;
        // a CPU-backed canvas: reading it back (toBlob) needs no GPU readback
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        c.toBlob((blob) => {
          if (!blob) return;
          root.style.setProperty('--grain', `url("${URL.createObjectURL(blob)}")`);
        }, 'image/png');
      } catch {
        /* a tainted canvas or no toBlob: keep the SVG tile */
      }
    };
    img.src = src;
  } catch {
    /* keep the SVG tile */
  }
}
