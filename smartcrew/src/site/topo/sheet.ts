// A contour sheet, ready to show: one bitmap per ink, made off the main thread (./topo.worker.ts)
// and handed to <canvas> elements with no copy (bitmaprenderer). Drawn once per size; the page then
// only moves it (transform), so it costs nothing per frame and never re-rasterises.

import { contours, drawContours, INKS, type Contour } from "./contours";

type Inks = ("day" | "night")[];
let worker: Worker | null = null;
let seq = 0;
const waiting = new Map<number, (r: { bitmaps?: ImageBitmap[]; contours?: Contour[] }) => void>();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./topo.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e) => {
    const f = waiting.get(e.data.id);
    waiting.delete(e.data.id);
    f?.(e.data);
  };
  return worker;
}

/**
 * Paint a w × h (CSS px) contour sheet into each canvas (one per ink), at `scale` device px per
 * CSS px. Resolves once they're painted. Without workers it draws on the main thread, in idle time.
 */
export async function paintSheet(canvases: HTMLCanvasElement[], inks: Inks, w: number, h: number, scale: number, seed?: number) {
  let res: { bitmaps?: ImageBitmap[]; contours?: Contour[] };
  try {
    const id = ++seq;
    res = await new Promise((ok) => {
      waiting.set(id, ok);
      getWorker().postMessage({ id, w, h, scale, inks, seed });
    });
  } catch {
    await new Promise((r) => ("requestIdleCallback" in window ? requestIdleCallback(() => r(0), { timeout: 1500 }) : setTimeout(r, 200)));
    res = { contours: contours(w, h, 6, seed) };
  }
  canvases.forEach((c, k) => {
    const bmp = res.bitmaps?.[k];
    c.width = Math.round(w * scale);
    c.height = Math.round(h * scale);
    if (bmp) {
      const r = c.getContext("bitmaprenderer");
      if (r) return r.transferFromImageBitmap(bmp);
      c.getContext("2d")?.drawImage(bmp, 0, 0);
      return;
    }
    const g = c.getContext("2d");
    if (!g || !res.contours) return;
    g.scale(scale, scale);
    drawContours(g, res.contours, INKS[inks[k]], w, h);
  });
}
