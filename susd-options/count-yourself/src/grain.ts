// Paper grain and a faint 3 px halftone, drawn once into a small canvas tile at load and used as a
// plain background image (no SVG filters, no blend modes: cheap to rasterize, even on phones).
export function installGrain() {
  try {
    const S = 192; // divisible by 3 so the halftone tiles seamlessly
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(S, S);
    const d = img.data;
    let seed = 1337;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const i = (y * S + x) * 4;
        // Two octaves of value noise: fine tooth plus a softer mottle.
        const v = rnd() * 0.75 + rnd() * 0.25;
        const dot = x % 3 === 1 && y % 3 === 1;
        if (v > 0.5) {
          d[i] = d[i + 1] = d[i + 2] = 255;
          d[i + 3] = Math.round((v - 0.5) * 2 * 22);
        } else {
          d[i] = d[i + 1] = d[i + 2] = 0;
          d[i + 3] = Math.round((0.5 - v) * 2 * 30);
        }
        if (dot) d[i + 3] = Math.max(d[i + 3], 16), (d[i] = d[i + 1] = d[i + 2] = 0);
      }
    }
    ctx.putImageData(img, 0, 0);
    const set = (url: string) => document.documentElement.style.setProperty('--grain', `url("${url}")`);
    if (c.toBlob) c.toBlob((b) => b && set(URL.createObjectURL(b)), 'image/png');
    else set(c.toDataURL('image/png'));
  } catch {
    /* no grain is fine */
  }
}
