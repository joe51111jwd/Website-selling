// The focus film's picture on any screen (src/components/FocusPage.tsx).
// The film is 1600x1000. On a screen narrower than it (an upright phone) it covers the height, its subject
// on the centre line, and is made smaller only where the subject is wider than the screen (the rubble).
// On a screen wider than it, it is enlarged to the full width wherever its subject still fits between the
// menu and the foot. The zoom is eased (never more than 1.5% a frame), and wherever the picture does not
// reach an edge, the wall and floor round it are painted in its own edge colours.
import film from "./lpfilm.json";

const XS = film.x as number[];
const SPANS = film.y as [number, number][];
const WIDTHS = film.w as [number, number][];
export const FILM_FRAMES = XS.length;

const N = 24; // colours sampled along an edge
type Edge = { exact: string[]; flat: string[] };

// how far a picture that covers the screen may be moved down off its top, by how far below the picture's top the
// subject starts (t, 0-1 down the picture): all the way from 4% down, none once it reaches the top. A subject cut
// by the picture's top cannot be brought into view by it, so it runs off the screen's top instead
const room = (t: number) => Math.min(1, Math.max(0, t / 0.04));

export class FilmPainter {
  private probe = document.createElement("canvas");
  private pctx: CanvasRenderingContext2D;
  private edge = document.createElement("canvas");
  private ectx: CanvasRenderingContext2D;
  private rows = new WeakMap<ImageBitmap, Record<string, Edge>>();
  private zoomKey = "";
  private zooms: number[] = [];

  constructor(private ctx: CanvasRenderingContext2D) {
    this.probe.width = N;
    this.probe.height = N;
    this.pctx = this.probe.getContext("2d", { willReadFrequently: true })!;
    this.ectx = this.edge.getContext("2d")!;
  }

  /** where frame i's picture sits on a cw x ch canvas (device px; scale is the device pixel ratio) */
  rect(i: number, cw: number, ch: number, aspect: number, scale: number) {
    const k = Math.max(0, Math.min(FILM_FRAMES - 1, Math.round(i)));
    const [t, b] = SPANS[k];
    const wide = cw > ch * aspect;
    const { mt, mb } = this.margins(cw > ch, ch, scale);
    const z = this.zoomsFor(cw, ch, aspect, scale)[k];
    const dh = ch * z;
    const c = (t + b) / 2;
    const top = Math.max(0, t); // (a subject climbing out of the picture's top is cut by the picture, not the screen)
    let oy: number;
    if (wide) {
      oy = c * ch - c * dh; // enlarged about the subject's middle
      oy = Math.min(ch - mb - b * dh, Math.max(mt - t * dh, oy));
      oy = Math.min(0, Math.max(ch - dh, oy));
    } else if (z >= 1) {
      // the picture covers the screen's height, moved down only as far as keeps the subject clear of the menu
      oy = Math.max(0, Math.min(ch * 0.12, mt - top * dh, ch - mb - b * dh)) * room(t);
    } else {
      // smaller: between the menu and the foot
      oy = Math.max(0, Math.min(ch - dh, Math.max(mt - top * dh, (mt + ch - mb) / 2 - c * dh)));
    }
    const dw = dh * aspect;
    const want = cw / 2 - XS[k] * dw;
    const ox = dw >= cw ? Math.min(0, Math.max(cw - dw, want)) : Math.min(cw - dw, Math.max(0, want));
    return { ox, oy, dw, dh };
  }

  draw(bmp: ImageBitmap, i: number, cw: number, ch: number, scale: number) {
    const r = this.rect(i, cw, ch, bmp.width / bmp.height, scale);
    this.paint(bmp, r.ox, r.oy, r.dw, r.dh, cw, ch, scale);
  }

  // how close to the top and the foot the subject may come. On a landscape screen the menu sits in its corners and
  // the subject is centred, so it may come close; on an upright one the menu spans the top
  private margins(landscape: boolean, ch: number, scale: number) {
    return landscape ? { mt: Math.max(ch * 0.035, 14 * scale), mb: ch * 0.025 } : { mt: Math.max(ch * 0.1, 64 * scale) + 12 * scale, mb: ch * 0.05 };
  }

  // the zoom each frame may take on this screen, limited to 1.5% a frame either way
  private zoomsFor(cw: number, ch: number, aspect: number, scale: number) {
    const key = `${cw}x${ch}x${aspect.toFixed(4)}x${scale}`;
    if (key === this.zoomKey) return this.zooms;
    this.zoomKey = key;
    const cover = cw / (ch * aspect);
    const { mt, mb } = this.margins(cw > ch, ch, scale);
    const z =
      cover > 1
        ? SPANS.map(([t, b]) => Math.min(cover, Math.max(1, (ch - mt - mb) / (Math.max(0.01, b - t) * ch))))
        : WIDTHS.map(([l, r], k) => {
            const [t, b] = SPANS[k];
            const across = (cw * 0.92) / (Math.max(0.01, r - l) * ch * aspect);
            const up = (ch - mt * room(t) - mb) / (Math.max(0.01, b - Math.max(0, t)) * ch); // (no room is kept for the menu over a subject cut by the top)
            return Math.min(1, Math.max(0.5, Math.min(across, up)));
          });
    for (let n = 1; n < z.length; n++) z[n] = Math.min(z[n], z[n - 1] * 1.015);
    for (let n = z.length - 2; n >= 0; n--) z[n] = Math.min(z[n], z[n + 1] * 1.015);
    this.zooms = z;
    return z;
  }

  // a frame's edge in 24 colours: blocks and shadows (strong colour, dark, or a dip of more than 8% below
  // the wall or floor on both sides; on the top edge, anything off the wall's tone) left out and filled from
  // beside them; `exact` meets the picture,
  // `flat` (eased toward the edge's middle tone) settles a band far from it
  private edgeLine(bmp: ImageBitmap, axis: "row" | "col", at: number): Edge {
    const id = `${axis}${at}`;
    const seen = this.rows.get(bmp) ?? {};
    if (seen[id]) return seen[id];
    const p = this.pctx;
    p.clearRect(0, 0, N, N);
    if (axis === "row") p.drawImage(bmp, 0, at, bmp.width, 2, 0, 0, N, 1);
    else p.drawImage(bmp, at, 0, 2, bmp.height, 0, 0, 1, N);
    const d = p.getImageData(0, 0, axis === "row" ? N : 1, axis === "row" ? 1 : N).data;
    const px = Array.from({ length: N }, (_, k) => [d[k * 4], d[k * 4 + 1], d[k * 4 + 2]]);
    const L = px.map(([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b);
    const plain = px.map(([r, g, b]) => {
      const hi = Math.max(r, g, b);
      return hi > 120 && (hi - Math.min(r, g, b)) / hi < 0.22;
    });
    const near = (from: number, to: number) => {
      let m = -1;
      for (let j = Math.max(0, from); j <= Math.min(N - 1, to); j++) if (plain[j]) m = Math.max(m, L[j]);
      return m;
    };
    const ok = plain.map((isPlain, k) => {
      if (!isPlain) return false;
      const l = near(k - 5, k - 1);
      const r = near(k + 1, k + 5);
      return !(l > 0 && r > 0 && L[k] < 0.92 * Math.min(l, r));
    });
    // the picture's top edge is wall from end to end, as even as this to within a point or two: anything more than
    // 1.5% off its middle tone is something crossing the edge (the core climbing out, a block dropping in)
    if (axis === "row" && at === 0) {
      const ls = L.filter((_, k) => ok[k]).sort((a, b) => a - b);
      const med = ls.length ? ls[ls.length >> 1] : 0;
      ok.forEach((o, k) => (ok[k] = o && Math.abs(L[k] - med) <= 0.015 * med));
    }
    const out = px.map((c, k) => {
      if (ok[k]) return c;
      let l = k;
      let r = k;
      while (l >= 0 && !ok[l]) l--;
      while (r < N && !ok[r]) r++;
      if (l < 0 && r >= N) return [241, 234, 223]; // nothing but blocks: the page's paper
      if (l < 0) return px[r];
      if (r >= N) return px[l];
      const t = (k - l) / (r - l);
      return px[l].map((v, n) => v + (px[r][n] - v) * t);
    });
    const okPx = out.filter((_, k) => ok[k]);
    const avg = okPx.length ? [0, 1, 2].map((n) => okPx.reduce((t, c) => t + c[n], 0) / okPx.length) : null;
    const css = (c: number[]) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
    const res = { exact: out.map(css), flat: out.map((c) => css(avg ? c.map((v, n) => v + (avg[n] - v) * 0.4) : c)) };
    seen[id] = res;
    this.rows.set(bmp, seen);
    return res;
  }

  private paint(bmp: ImageBitmap, ox: number, oy: number, dw: number, dh: number, cw: number, ch: number, scale: number) {
    const ctx = this.ctx;
    const ectx = this.ectx;
    const edge = this.edge;
    const along = (c: CanvasRenderingContext2D, stops: string[], horiz: boolean, x = 0, y = 0) => {
      const g = horiz ? c.createLinearGradient(ox - x, 0, ox - x + dw, 0) : c.createLinearGradient(0, oy - y, 0, oy - y + dh);
      stops.forEach((st, k) => g.addColorStop(k / (stops.length - 1), st));
      return g;
    };
    const gapT = oy > 0.5;
    const gapB = oy + dh < ch - 0.5;
    const gapL = ox > 0.5;
    const gapR = ox + dw < cw - 0.5;
    const top = gapT ? this.edgeLine(bmp, "row", 0) : null;
    const bot = gapB ? this.edgeLine(bmp, "row", bmp.height - 2) : null;
    const left = gapL ? this.edgeLine(bmp, "col", 0).exact : null;
    const right = gapR ? this.edgeLine(bmp, "col", bmp.width - 2).exact : null;
    // the edge colours over a strip, opaque at the picture's edge and fading away from it
    const seam = (stops: string[], horiz: boolean, x: number, y: number, w: number, h: number, inward: "down" | "up" | "right" | "left") => {
      w = Math.max(1, Math.round(w));
      h = Math.max(1, Math.round(h));
      if (edge.width !== w || edge.height !== h) {
        edge.width = w;
        edge.height = h;
      }
      ectx.globalCompositeOperation = "source-over";
      ectx.fillStyle = along(ectx, stops, horiz, x, y);
      ectx.fillRect(0, 0, w, h);
      const m = inward === "down" || inward === "up" ? ectx.createLinearGradient(0, 0, 0, h) : ectx.createLinearGradient(0, 0, w, 0);
      const solidFirst = inward === "down" || inward === "right";
      m.addColorStop(0, solidFirst ? "#000" : "rgba(0,0,0,0)");
      m.addColorStop(1, solidFirst ? "rgba(0,0,0,0)" : "#000");
      ectx.globalCompositeOperation = "destination-in";
      ectx.fillStyle = m;
      ectx.fillRect(0, 0, w, h);
      ctx.drawImage(edge, Math.round(x), Math.round(y));
    };
    if (left) {
      ctx.fillStyle = along(ctx, left, false);
      ctx.fillRect(0, oy, Math.ceil(ox) + 1, dh);
    }
    if (right) {
      ctx.fillStyle = along(ctx, right, false);
      ctx.fillRect(Math.floor(ox + dw) - 1, oy, cw - Math.floor(ox + dw) + 1, dh);
    }
    const T = Math.max(48 * scale, dh * 0.12);
    if (top) {
      ctx.fillStyle = along(ctx, top.flat, true);
      ctx.fillRect(0, 0, cw, Math.ceil(oy) + 1);
      const h = Math.min(T, Math.ceil(oy) + 1);
      seam(top.exact, true, 0, Math.ceil(oy) + 1 - h, cw, h, "up");
    }
    if (bot) {
      ctx.fillStyle = along(ctx, bot.flat, true);
      ctx.fillRect(0, Math.floor(oy + dh) - 1, cw, ch - Math.floor(oy + dh) + 1);
      seam(bot.exact, true, 0, Math.floor(oy + dh) - 1, cw, Math.min(T, ch - Math.floor(oy + dh) + 1), "down");
    }
    ctx.drawImage(bmp, ox, oy, dw, dh);
    const fy = dh * 0.08;
    const fx = dw * 0.05;
    if (top) seam(top.exact, true, 0, Math.floor(oy) - 1, cw, Math.ceil(fy) + 2, "down");
    if (bot) {
      const y = Math.floor(oy + dh - fy);
      seam(bot.exact, true, 0, y, cw, Math.ceil(oy + dh) + 1 - y, "up");
    }
    if (left) seam(left, false, Math.floor(ox) - 1, oy, Math.ceil(fx) + 2, dh, "right");
    if (right) {
      const x = Math.floor(ox + dw - fx);
      seam(right, false, x, oy, Math.ceil(ox + dw) + 1 - x, dh, "left");
    }
  }
}
