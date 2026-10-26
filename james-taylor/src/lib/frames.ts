// Rendered image sequences, scrubbed by scroll. scripts/pack.py writes
// public/seq/<name>/manifest.json next to the frames.

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

// One shared pool of frame downloads for the whole page. Each sequence is a job; free slots go to
// the job asked for (or bumped) most recently, so the section on screen is served before the ones
// scrolled past on the way. Kept below the browser's six connections per host, so manifests and
// fonts still get through.
type Job = {
  name: string;
  m: Manifest;
  order: number[];
  next: number;
  inflight: number;
  onFrame: (i: number, img: ImageBitmap | HTMLImageElement) => void;
  signal: AbortSignal;
  done: () => void;
};
const jobs: Job[] = [];
const SLOTS = 4;
let busy = 0;

function pump() {
  while (busy < SLOTS) {
    let job: Job | undefined;
    for (let k = jobs.length - 1; k >= 0; k--) {
      const j = jobs[k];
      if (!j.signal.aborted && j.next < j.order.length) {
        job = j;
        break;
      }
    }
    if (!job) return;
    const j = job;
    const i = j.order[j.next++];
    j.inflight++;
    busy++;
    decode(frameUrl(j.name, j.m, i))
      .then((img) => {
        if (!j.signal.aborted) j.onFrame(i, img);
      })
      .catch(() => {
        /* a missing frame just leaves a gap the scrubber skips over */
      })
      .finally(() => {
        busy--;
        j.inflight--;
        if (j.next >= j.order.length || j.signal.aborted) finish(j);
        pump();
      });
  }
}

/** Retire a job once nothing of it is still downloading. */
function finish(job: Job) {
  const k = jobs.indexOf(job);
  if (k < 0 || job.inflight > 0) return;
  jobs.splice(k, 1);
  job.done();
}

/** Move a sequence's download to the front of the queue (it just came on screen). */
export function bump(name: string) {
  const k = jobs.findIndex((j) => j.name === name && !j.signal.aborted);
  if (k >= 0 && k < jobs.length - 1) jobs.push(...jobs.splice(k, 1));
}

/** Load every frame of a sequence as decoded bitmaps, in an order that fills in coarse-to-fine
 * (every 8th frame first), so a scrub works early and sharpens as the rest arrive. */
export function loadFrames(
  name: string,
  onFrame: (i: number, img: ImageBitmap | HTMLImageElement) => void,
  signal: AbortSignal,
): Promise<Manifest> {
  return manifest(name).then(
    (m) =>
      new Promise<Manifest>((resolve) => {
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
        if (signal.aborted || !order.length) return resolve(m);
        const job: Job = { name, m, order, next: 0, inflight: 0, onFrame, signal, done: () => resolve(m) };
        jobs.push(job);
        signal.addEventListener("abort", () => finish(job), { once: true });
        pump();
      }),
  );
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

/** How an image sits in its canvas: "contain", "cover", or a number between them (0 contain, 1 cover). */
export type Fit = "contain" | "cover" | number;

/** Draw an image into a canvas at device resolution. Returns the rectangle it landed in, in CSS px. */
export function drawFit(
  canvas: HTMLCanvasElement,
  img: CanvasImageSource & { width: number; height: number },
  fit: Fit = "contain",
  focusX = 0.5, // where to anchor horizontally when the image overflows (0 left, 1 right)
  focusY = 0.5,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return null;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const contain = Math.min(w / img.width, h / img.height);
  const cover = Math.max(w / img.width, h / img.height);
  const zoom = fit === "contain" ? 0 : fit === "cover" ? 1 : fit;
  const s = contain + (cover - contain) * zoom;
  const rect = { x: (w - img.width * s) * focusX, y: (h - img.height * s) * focusY, w: img.width * s, h: img.height * s };
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
  return rect;
}
