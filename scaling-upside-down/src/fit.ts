// The focus film's picture on any screen (src/components/FocusPage.tsx).
// The film is 1600x1000. On a screen narrower than it (an upright phone) it covers the height, its subject
// on the centre line, and is made smaller only where the subject is wider than the screen (the rubble).
// On a screen wider than it, it is centred, and enlarged to the full width wherever its subject still fits
// between the menu and the foot. The zoom is eased (never more than 1.5% a frame), and so is how far the picture
// sits down the screen (never more than 1.5% of the screen's height a frame); through the film's still beats
// (src/lpkeys.ts) both hold. Wherever the picture does not reach an edge, the wall and floor round it are painted
// in its own edge colours.
import film from "./lpfilm.json";
import { STILLS } from "./lpkeys";

const XS = film.x as number[];
const SPANS = film.y as [number, number][];
const WIDTHS = film.w as [number, number][];
export const FILM_FRAMES = XS.length;

const NR = 24; // colours sampled along the top and bottom edges
const NC = 96; // and down the sides (closer, so the board's and the floor's edges stay sharp in a side band)
const STEP = 0.015; // the most the zoom, and the picture's place down the screen (of its height), change in a frame
// Act I's build-up starts at this frame (the opening still before it is not made smaller for what comes after it)
const BUILD = 13;
type Edge = { exact: string[]; flat: string[]; even: string };

// how far a picture that covers the screen may be moved down off its top, by how far below the picture's top the
// subject starts (t, 0-1 down the picture): all the way from 4% down, none once it reaches the top. A subject cut
// by the picture's top cannot be brought into view by it, so it runs off the screen's top instead
const room = (t: number) => Math.min(1, Math.max(0, t / 0.04));

// eases a per-frame series in place, only ever lowering it: no frame ends up more than `d` (added, or a factor of
// 1 + d with `mul`) past the frames either side of it. Through a still beat every frame takes the lowest of them, so
// the picture holds still there, and it glides into the beat over the 8 frames before it (evenly, not in a step)
const ease = (v: number[], d: number, mul = false) => {
  const up = (x: number) => (mul ? x * (1 + d) : x + d);
  for (let pass = 0; pass < 6; pass++) {
    for (let n = 1; n < v.length; n++) v[n] = Math.min(v[n], up(v[n - 1]));
    for (let n = v.length - 2; n >= 0; n--) v[n] = Math.min(v[n], up(v[n + 1]));
    let held = true;
    for (const [a, b] of STILLS) {
      const m = Math.min(...v.slice(a, b + 1));
      for (let n = a; n <= b; n++) if (v[n] > m) (v[n] = m), (held = false);
    }
    if (held) break;
  }
  const R = 8;
  for (const [a] of STILLS) {
    if (a < R) continue;
    const h = v[a];
    const s0 = v[a - R];
    for (let n = a - R + 1; n < a; n++) {
      const f = (a - n) / R;
      v[n] = Math.min(v[n], mul && h > 0 && s0 > 0 ? h * (s0 / h) ** f : h + (s0 - h) * f);
    }
  }
};

export class FilmPainter {
  private probe = document.createElement("canvas");
  private pctx: CanvasRenderingContext2D;
  private edge = document.createElement("canvas");
  private ectx: CanvasRenderingContext2D;
  private tall = document.createElement("canvas"); // (a side column, row by row)
  private tctx: CanvasRenderingContext2D;
  private rows = new WeakMap<ImageBitmap, Record<string, Edge>>();
  private zoomKey = "";
  private zooms: number[] = [];
  private oyKey = "";
  private oys: number[] = [];

  constructor(private ctx: CanvasRenderingContext2D) {
    this.probe.width = NC;
    this.probe.height = NC;
    this.pctx = this.probe.getContext("2d", { willReadFrequently: true })!;
    this.ectx = this.edge.getContext("2d")!;
    this.tctx = this.tall.getContext("2d", { willReadFrequently: true })!;
  }

  /** where frame i's picture sits on a cw x ch canvas (device px; scale is the device pixel ratio) */
  rect(i: number, cw: number, ch: number, aspect: number, scale: number) {
    const k = Math.max(0, Math.min(FILM_FRAMES - 1, Math.round(i)));
    return { ...this.place(k, cw, ch, aspect, scale), oy: this.oysFor(cw, ch, aspect, scale)[k] };
  }

  // how far down the screen each frame's picture sits, eased like the zoom: it moves by at most 1.5% of the screen's
  // height a frame. Where it covers the screen's height it is only ever eased up the screen (never further down than
  // its own frame wants, so it cannot open a band over a subject running off the top); where it is enlarged past the
  // screen's width, only down it (never further up, so the subject stays clear of the menu)
  private oysFor(cw: number, ch: number, aspect: number, scale: number) {
    const key = `${cw}x${ch}x${aspect.toFixed(4)}x${scale}`;
    if (key === this.oyKey) return this.oys;
    this.oyKey = key;
    const s = cw > ch * aspect ? -1 : 1; // (the wide picture's place is eased the other way)
    const o = Array.from({ length: FILM_FRAMES }, (_, n) => s * this.place(n, cw, ch, aspect, scale).oy);
    ease(o, ch * STEP);
    // (on a landscape screen not wider than the picture, a place only one frame wants, past both its neighbours,
    // is not taken: the picture would bob for that frame)
    if (cw > ch && s > 0) for (let n = 1; n < o.length - 1; n++) o[n] = Math.min(o[n], Math.max(o[n - 1], o[n + 1]));
    this.oys = o.map((v) => s * v);
    return this.oys;
  }

  // frame k's picture before its place down the screen is eased
  private place(k: number, cw: number, ch: number, aspect: number, scale: number) {
    const [t, b] = SPANS[k];
    const wide = cw > ch * aspect;
    const { mt, mb } = this.margins(cw > ch, ch, scale);
    const z = this.zoomsFor(cw, ch, aspect, scale)[k];
    const dh = ch * z;
    const c = (t + b) / 2;
    const top = Math.max(0, t); // (a subject climbing out of the picture's top is cut by the picture, not the screen)
    // moved down only as far as keeps the subject clear of the menu (on a landscape screen only the margin is
    // ramped in as the subject's top comes into the picture, as on a wide one, so the picture does not dip and rise
    // for the frames where it does)
    const clear =
      cw > ch
        ? Math.max(0, Math.min(ch * 0.12, mt * room(t) - top * dh, ch - mb - b * dh))
        : Math.max(0, Math.min(ch * 0.12, mt - top * dh, ch - mb - b * dh)) * room(t);
    let oy: number;
    if (wide) {
      oy = c * ch - c * dh; // enlarged about the subject's middle
      oy = Math.min(ch - mb - b * dh, Math.max(mt * room(t) - top * dh, oy));
      oy = Math.min(0, Math.max(ch - dh, oy));
    } else if (z >= 1) {
      oy = clear; // the picture covers the screen's height
    } else {
      // smaller. On a landscape screen it sits flush with the top, moved down only to clear the menu: it is smaller
      // for the pieces still to come or for a subject running off its top, so it is not centred and then pulled
      // back up as the zoom pushes in, and a block dropping in enters from the screen's edge. On an upright one it
      // sits between the menu and the foot, and flush with the top while the subject runs off it (a core climbing
      // out of the picture's top runs off the screen's top). Never higher than `clear`, which it meets at a zoom of
      // 1, so the picture does not hop where the zoom crosses it
      const mid = Math.max(0, Math.min(ch - dh, Math.max(mt - top * dh, (mt + ch - mb) / 2 - c * dh)));
      oy = cw > ch ? clear : Math.max(t < 0 ? 0 : mid, clear);
    }
    const dw = dh * aspect;
    const want = cw / 2 - XS[k] * dw;
    // (a wide screen shows the whole picture, so it stays centred: following the subject there only sways it)
    const ox = wide ? (cw - dw) / 2 : dw >= cw ? Math.min(0, Math.max(cw - dw, want)) : Math.min(cw - dw, Math.max(0, want));
    return { ox, oy, dw, dh };
  }

  draw(bmp: ImageBitmap, i: number, cw: number, ch: number, scale: number) {
    const r = this.rect(i, cw, ch, bmp.width / bmp.height, scale);
    const k = Math.max(0, Math.min(FILM_FRAMES - 1, Math.round(i)));
    // a core coming back into view after running off the picture's top: the top fade stops short of it
    const back = SPANS[k][0] > 0 && SPANS.slice(Math.max(0, k - 6), k).some(([t]) => t < 0);
    this.paint(bmp, r.ox, r.oy, r.dw, r.dh, cw, ch, scale, back ? SPANS[k][0] * r.dh : Infinity);
  }

  // how close to the top and the foot the subject may come. On a landscape screen the menu sits in its corners and
  // the subject is centred, so it may come close; on an upright one the menu spans the top
  private margins(landscape: boolean, ch: number, scale: number) {
    return landscape ? { mt: Math.max(ch * 0.035, 14 * scale), mb: ch * 0.025 } : { mt: Math.max(ch * 0.1, 64 * scale) + 12 * scale, mb: ch * 0.05 };
  }

  // the zoom each frame may take on this screen, limited to 1.5% a frame either way (and held through a still beat).
  // A subject cut by the picture's top keeps no room for the menu and is measured from the picture's top (it cannot
  // be brought into view). On a screen not wider than the picture each frame takes the smallest zoom within 15
  // frames of it, so the picture eases out once for the pieces flying in and holds, instead of following each one
  // in and out
  private zoomsFor(cw: number, ch: number, aspect: number, scale: number) {
    const key = `${cw}x${ch}x${aspect.toFixed(4)}x${scale}`;
    if (key === this.zoomKey) return this.zooms;
    this.zoomKey = key;
    const cover = cw / (ch * aspect);
    const { mt, mb } = this.margins(cw > ch, ch, scale);
    const z =
      cover > 1
        ? SPANS.map(([t, b]) => Math.min(cover, Math.max(1, (ch - mt * room(t) - mb) / (Math.max(0.01, b - Math.max(0, t)) * ch))))
        : WIDTHS.map(([l, r], k) => {
            const [t, b] = SPANS[k];
            const across = (cw * 0.92) / (Math.max(0.01, r - l) * ch * aspect);
            const up = (ch - mt * room(t) - mb) / (Math.max(0.01, b - Math.max(0, t)) * ch); // (no room is kept for the menu over a subject cut by the top)
            return Math.min(1, Math.max(0.5, Math.min(across, up)));
          });
    if (cover <= 1) {
      const raw = z.slice();
      for (let n = 0; n < z.length; n++) {
        const lo = n < BUILD ? 0 : BUILD;
        const hi = n < BUILD ? BUILD - 1 : z.length - 1;
        for (let j = Math.max(lo, n - 15); j <= Math.min(hi, n + 15); j++) z[n] = Math.min(z[n], raw[j]);
      }
    }
    ease(z, STEP, true);
    this.zooms = z;
    return z;
  }

  // a frame's edge in 24 colours (96 down a side): blocks and shadows (strong colour, dark, or a dip below the wall
  // or floor on both sides: of more than 8% along the top and foot, 12% down a side, where the board's top is a
  // surface up to 11% darker than the wall above it and the lit board front below, two or more samples tall; on the
  // top edge, anything off the wall's tone) left out and filled from beside them. `exact` meets the picture, `flat`
  // (eased toward the edge's middle tone) settles a band far from it, `even` is that middle tone (the floor band)
  private edgeLine(bmp: ImageBitmap, axis: "row" | "col", at: number): Edge {
    const id = `${axis}${at}`;
    const seen = this.rows.get(bmp) ?? {};
    if (seen[id]) return seen[id];
    const N = axis === "row" ? NR : NC;
    const W = Math.round((5 * N) / NR); // how far either side a dip is compared with
    const p = this.pctx;
    const isPlain = (r: number, g: number, b: number) => {
      const hi = Math.max(r, g, b);
      return hi > 120 && (hi - Math.min(r, g, b)) / hi < 0.22;
    };
    let d: ArrayLike<number>;
    let rowsPlain: boolean[] | null = null; // (down a side: every row of the sample is plain wall or floor)
    let Lmin: number[] | null = null; // (down a side: the sample's darkest row)
    if (axis === "row") {
      p.clearRect(0, 0, NC, NC);
      p.drawImage(bmp, 0, at, bmp.width, 2, 0, 0, N, 1);
      d = p.getImageData(0, 0, N, 1).data;
    } else {
      // down a side each sample is the mean of all its rows, so an edge crossing it moves its tone smoothly (read
      // from a few rows only, the floor's line in the band would jump a whole sample at a time as the camera moves)
      const H = bmp.height;
      if (this.tall.width !== 1 || this.tall.height !== H) {
        this.tall.width = 1;
        this.tall.height = H;
      }
      this.tctx.clearRect(0, 0, 1, H);
      this.tctx.drawImage(bmp, at, 0, 2, H, 0, 0, 1, H);
      const c = this.tctx.getImageData(0, 0, 1, H).data;
      const sum = new Float64Array(N * 4);
      rowsPlain = [];
      Lmin = [];
      for (let k = 0; k < N; k++) {
        const y0 = Math.floor((k * H) / N);
        const y1 = Math.max(y0 + 1, Math.floor(((k + 1) * H) / N));
        let all = true;
        let lo = 999;
        for (let y = y0; y < y1; y++) {
          const [r, g, b] = [c[y * 4], c[y * 4 + 1], c[y * 4 + 2]];
          if (!isPlain(r, g, b)) all = false;
          lo = Math.min(lo, 0.3 * r + 0.59 * g + 0.11 * b);
          for (let n = 0; n < 3; n++) sum[k * 4 + n] += c[y * 4 + n] / (y1 - y0);
        }
        rowsPlain.push(all);
        Lmin.push(lo);
      }
      d = sum;
    }
    const px = Array.from({ length: N }, (_, k) => [d[k * 4], d[k * 4 + 1], d[k * 4 + 2]]);
    const L = px.map(([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b);
    // (down a side a sample is plain only if every one of its rows is, or a block's edge blends into a pale tint)
    const plain = px.map(([r, g, b], k) => isPlain(r, g, b) && (!rowsPlain || rowsPlain[k]));
    const Ld = Lmin ?? L; // (a dip is judged by the sample's darkest row: a shadow over part of it still counts)
    const near = (from: number, to: number) => {
      let m = -1;
      for (let j = Math.max(0, from); j <= Math.min(N - 1, to); j++) if (plain[j]) m = Math.max(m, L[j]);
      return m;
    };
    const dip = axis === "row" ? 0.92 : 0.88;
    const ref = (k: number) => {
      const l = near(k - W, k - 1);
      const r = near(k + 1, k + W);
      return l > 0 && r > 0 ? Math.min(l, r) : -1;
    };
    const ok = plain.map((pl, k) => pl && !(ref(k) > 0 && Ld[k] < dip * ref(k)));
    // down a side, a dip of 8-12% is kept only as a surface two or more samples tall (the board's top): a single
    // sample that dark is a shadow crossing the edge, and is left out like a deeper one (or it streaks the band)
    if (axis === "col") {
      const soft = ok.map((o, k) => o && ref(k) > 0 && L[k] < 0.92 * ref(k));
      soft.forEach((sf, k) => {
        if (sf && !soft[k - 1] && !soft[k + 1]) ok[k] = false;
      });
    }
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
    const res = { exact: out.map(css), flat: out.map((c) => css(avg ? c.map((v, n) => v + (avg[n] - v) * 0.4) : c)), even: css(avg ?? [241, 234, 223]) };
    seen[id] = res;
    this.rows.set(bmp, seen);
    return res;
  }

  private paint(bmp: ImageBitmap, ox: number, oy: number, dw: number, dh: number, cw: number, ch: number, scale: number, keep = Infinity) {
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
      // the floor below the picture is one tone, and the picture's foot fades into it: where an edge of the board,
      // or a block, crosses the foot, its tones would otherwise run down the band as a soft-edged ghost
      ctx.fillStyle = bot.even;
      ctx.fillRect(0, Math.floor(oy + dh) - 1, cw, ch - Math.floor(oy + dh) + 1);
    }
    ctx.drawImage(bmp, ox, oy, dw, dh);
    // the picture's own edges fade into the band beside them, over 8% of its height (5% of its width), or over
    // four times the band's own size where it is narrower (a band of a few px needs no long fade)
    const fade = (most: number, gap: number) => Math.min(most, 4 * gap);
    const fT = Math.min(fade(dh * 0.08, oy), Math.max(2 * scale, keep - 2 * scale));
    const fB = fade(dh * 0.08, ch - oy - dh);
    const fL = fade(dw * 0.05, ox);
    const fR = fade(dw * 0.05, cw - ox - dw);
    if (top) seam(top.exact, true, 0, Math.floor(oy) - 1, cw, Math.ceil(fT) + 2, "down");
    if (bot) {
      const y = Math.floor(oy + dh - fB);
      seam([bot.even, bot.even], true, 0, y, cw, Math.ceil(oy + dh) + 1 - y, "up");
    }
    if (left) seam(left, false, Math.floor(ox) - 1, oy, Math.ceil(fL) + 2, dh, "right");
    if (right) {
      const x = Math.floor(ox + dw - fR);
      seam(right, false, x, oy, Math.ceil(ox + dw) + 1 - x, dh, "left");
    }
  }
}
