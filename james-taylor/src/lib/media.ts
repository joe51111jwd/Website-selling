// Rendered media: image sequences (scroll-scrubbed films and drag turntables) and the hero film.
// scripts/pack.py writes public/seq/<name>/manifest.json next to the frames.

export type Manifest = {
  count: number;
  width: number;
  height: number;
  ext: string;
  v: string; // content hash, appended as ?v= so the files can be cached forever
};

const BASE = import.meta.env.BASE_URL;

export const seqUrl = (name: string, file: string) => `${BASE}seq/${name}/${file}`;

export function frameUrl(name: string, m: Manifest, i: number) {
  return seqUrl(name, `${String(i + 1).padStart(4, "0")}.${m.ext}?v=${m.v}`);
}

const manifests = new Map<string, Promise<Manifest>>();

export function manifest(name: string): Promise<Manifest> {
  let p = manifests.get(name);
  if (!p) {
    p = fetch(seqUrl(name, "manifest.json"), { cache: "no-cache" }).then((r) => {
      // a dev server answers unknown paths with the page itself, so check what came back
      if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) throw new Error(`${name}: no manifest`);
      return r.json() as Promise<Manifest>;
    });
    p.catch(() => manifests.delete(name));
    manifests.set(name, p);
  }
  return p;
}

/** Load every frame of a sequence as decoded bitmaps, in an order that fills in coarse-to-fine
 * (every 8th frame first), so a scrub works early and sharpens as the rest arrive. */
export function loadFrames(
  name: string,
  onFrame: (i: number, img: ImageBitmap | HTMLImageElement) => void,
  signal: AbortSignal,
): Promise<Manifest> {
  return manifest(name).then(async (m) => {
    const order: number[] = [];
    const seen = new Set<number>();
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < m.count; i += step) {
        if (!seen.has(i)) {
          seen.add(i);
          order.push(i);
        }
      }
    }
    let next = 0;
    const worker = async () => {
      while (next < order.length && !signal.aborted) {
        const i = order[next++];
        try {
          const img = await decode(frameUrl(name, m, i));
          if (!signal.aborted) onFrame(i, img);
        } catch {
          /* a missing frame just leaves a gap the scrubber skips over */
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    return m;
  });
}

async function decode(url: string): Promise<ImageBitmap | HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(img);
    } catch {
      return img;
    }
  }
  return img;
}

/** nearest loaded frame to i */
export function nearest<T>(frames: (T | undefined)[], i: number): T | undefined {
  if (frames[i]) return frames[i];
  for (let d = 1; d < frames.length; d++) {
    if (frames[i - d]) return frames[i - d];
    if (frames[i + d]) return frames[i + d];
  }
  return undefined;
}

/** Draw an image to a canvas sized to its box (object-fit: contain or cover). */
export function drawFit(
  canvas: HTMLCanvasElement,
  img: CanvasImageSource & { width: number; height: number },
  fit: "contain" | "cover" = "contain",
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const s = fit === "contain" ? Math.min(w / img.width, h / img.height) : Math.max(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
