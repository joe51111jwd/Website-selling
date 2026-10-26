// Frame store for the rendered sequence.
// Chunks arrive as compressed WebP blobs; only a window of frames around the
// playhead is decoded at a time, so memory stays bounded on phones.

export type Manifest = {
  count: number;
  width: number;
  height: number;
  chunks: string[];
  frames: [chunk: number, offset: number, length: number][];
};

/** fetch that retries a dropped connection or a server error a couple of times */
export async function fetchOk(url: string, tries = 3): Promise<Response> {
  for (let n = 1; ; n++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
      if (n >= tries) throw new Error(`${url} ${r.status}`);
    } catch (e) {
      if (n >= tries) throw e;
    }
    await new Promise((r) => setTimeout(r, 800 * n));
  }
}

export class FrameStore {
  readonly blobs: (Blob | null)[];
  private decoded = new Map<number, ImageBitmap>();
  private pending = new Map<number, Promise<ImageBitmap | null>>();
  private chunkLoads = new Map<number, Promise<void>>();
  private loaded = new Set<number>();
  private head = 0; // the frame on screen; eviction keeps a window around it
  loadedChunks = 0;

  constructor(
    readonly base: string,
    readonly m: Manifest,
    private readonly limit: number,
    private readonly decodeWidth: number,
    private readonly onChange: () => void,
  ) {
    this.blobs = new Array(m.count).fill(null);
  }

  static async open(base: string, limit: number, decodeWidth: number, onChange: () => void) {
    const res = await fetchOk(base + "manifest.json");
    return new FrameStore(base, (await res.json()) as Manifest, limit, decodeWidth, onChange);
  }

  get chunkCount() {
    return this.m.chunks.length;
  }

  chunkOf(frame: number) {
    return this.m.frames[frame][0];
  }

  loadChunk(c: number): Promise<void> {
    let p = this.chunkLoads.get(c);
    if (p) return p;
    p = fetchOk(this.base + this.m.chunks[c])
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        this.m.frames.forEach(([ci, off, len], i) => {
          if (ci === c) this.blobs[i] = new Blob([buf.slice(off, off + len)], { type: "image/webp" });
        });
        this.loaded.add(c);
        this.loadedChunks++;
        this.onChange();
      })
      .catch((e: unknown) => {
        this.chunkLoads.delete(c); // so a later call can try again
        throw e;
      });
    this.chunkLoads.set(c, p);
    return p;
  }

  /** load every chunk, starting with the ones the visitor needs first; one more pass picks up failures */
  async loadAll(first: number[], concurrency = 2) {
    for (let pass = 0; pass < 2; pass++) {
      const order = [...new Set([...first, ...this.m.chunks.map((_, i) => i)])].filter((c) => !this.loaded.has(c));
      if (!order.length) return;
      if (pass) await new Promise((r) => setTimeout(r, 3000));
      let next = 0;
      const worker = async () => {
        while (next < order.length && !this.disposed) {
          await this.loadChunk(order[next++]).catch(() => undefined);
        }
      };
      await Promise.all(Array.from({ length: concurrency }, worker));
    }
  }

  /** decoded frame if ready; otherwise starts decoding it */
  get(i: number): ImageBitmap | null {
    this.head = i;
    const bmp = this.decoded.get(i);
    if (bmp) return bmp;
    void this.decode(i);
    return null;
  }

  /** decoded frame if ready, without starting a decode */
  peek(i: number): ImageBitmap | null {
    return this.decoded.get(i) ?? null;
  }

  /** closest decoded frame, preferring the side we are coming from */
  nearest(i: number, dir: number, range = 40): ImageBitmap | null {
    for (let d = 1; d <= range; d++) {
      const a = this.decoded.get(i - d * Math.sign(dir || 1));
      if (a) return a;
      const b = this.decoded.get(i + d * Math.sign(dir || 1));
      if (b) return b;
    }
    return null;
  }

  decode(i: number): Promise<ImageBitmap | null> {
    if (i < 0 || i >= this.m.count) return Promise.resolve(null);
    const have = this.decoded.get(i);
    if (have) return Promise.resolve(have);
    const blob = this.blobs[i];
    if (!blob) return Promise.resolve(null);
    let p = this.pending.get(i);
    if (p) return p;
    const opts: ImageBitmapOptions =
      this.decodeWidth < this.m.width
        ? { resizeWidth: this.decodeWidth, resizeHeight: Math.round((this.m.height * this.decodeWidth) / this.m.width), resizeQuality: "high" }
        : {};
    p = createImageBitmap(blob, opts)
      .then((bmp) => {
        this.pending.delete(i);
        if (this.disposed) {
          bmp.close();
          return null;
        }
        this.decoded.set(i, bmp);
        this.evict();
        this.onChange();
        return bmp;
      })
      .catch(() => {
        this.pending.delete(i);
        return null;
      });
    this.pending.set(i, p);
    return p;
  }

  /** decode a window ahead of the playhead in the direction of travel */
  prefetch(i: number, dir: number, ahead = 10) {
    const s = dir < 0 ? -1 : 1;
    for (let d = 0; d <= ahead; d++) void this.decode(i + d * s);
    for (let d = 1; d <= 3; d++) void this.decode(i - d * s);
  }

  /** drop the frames farthest from the playhead, never the ones about to play */
  private evict() {
    if (this.decoded.size <= this.limit) return;
    const h = this.head;
    const far = [...this.decoded.keys()].sort((a, b) => Math.abs(b - h) - Math.abs(a - h));
    for (const k of far) {
      if (this.decoded.size <= this.limit || Math.abs(k - h) <= 10) break;
      this.decoded.get(k)?.close();
      this.decoded.delete(k);
    }
  }

  /** let go of every decoded picture (the compressed ones stay); they decode again when needed */
  release() {
    this.decoded.forEach((b) => b.close());
    this.decoded.clear();
  }

  /** move the playhead without drawing, so eviction protects the frames about to play */
  aim(i: number) {
    this.head = i;
  }

  private disposed = false;
  dispose() {
    this.disposed = true;
    this.decoded.forEach((b) => b.close());
    this.decoded.clear();
  }
}
