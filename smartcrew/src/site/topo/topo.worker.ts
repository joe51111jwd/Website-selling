// Contour sheets off the main thread: the land, the contours and (where the browser can draw in a
// worker) the finished bitmaps, one per ink. See ./sheet.ts.
import { contours, drawContours, INKS, type Contour } from "./contours";

type Req = { id: number; w: number; h: number; scale: number; inks: ("day" | "night")[]; seed?: number };

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, w, h, scale, inks, seed } = e.data;
  const cs: Contour[] = contours(w, h, 6, seed);
  if (typeof OffscreenCanvas !== "undefined") {
    try {
      const bitmaps: ImageBitmap[] = [];
      for (const k of inks) {
        const c = new OffscreenCanvas(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
        const g = c.getContext("2d");
        if (!g) throw new Error("no 2d");
        g.scale(scale, scale);
        drawContours(g, cs, INKS[k], w, h);
        bitmaps.push(c.transferToImageBitmap());
      }
      (self as unknown as Worker).postMessage({ id, bitmaps }, bitmaps);
      return;
    } catch {
      /* fall through: the page draws them */
    }
  }
  const lines = cs.map((c) => ({ level: c.level, index: c.index, pts: c.pts }));
  (self as unknown as Worker).postMessage({ id, contours: lines }, lines.map((l) => l.pts.buffer));
};
