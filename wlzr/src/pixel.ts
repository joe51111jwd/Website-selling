// Pixel art, drawn in code: a tiny raster (rects, lines, circles, polygons) that prints itself as crisp SVG.
// The desktop icons and the globe are made here, so they stay sharp at any size.

const K = "#0b0b0f";

class Grid {
  px: (string | null)[];
  constructor(public w: number, public h: number) {
    this.px = new Array(w * h).fill(null);
  }
  set(x: number, y: number, c: string) {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c;
  }
  get(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : null;
  }
  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    return this;
  }
  box(x: number, y: number, w: number, h: number, fill: string, line = K, t = 2) {
    this.rect(x, y, w, h, line);
    this.rect(x + t, y + t, w - 2 * t, h - 2 * t, fill);
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string, t = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      this.rect(Math.round(x - (t - 1) / 2), Math.round(y - (t - 1) / 2), t, t, c);
    }
    return this;
  }
  poly(pts: [number, number][], c: string) {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        let inside = false;
        const px = x + 0.5, py = y + 0.5;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, c);
      }
    return this;
  }
  disc(cx: number, cy: number, r: number, c: string) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.set(cx + x, cy + y, c);
    return this;
  }
  ring(cx: number, cy: number, rx: number, ry: number, c: string, from = 0, to = Math.PI * 2) {
    const n = Math.ceil((rx + ry) * 6);
    for (let i = 0; i <= n; i++) {
      const a = from + ((to - from) * i) / n;
      this.set(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, c);
    }
    return this;
  }
  text(s: string, x: number, y: number, c: string, scale = 1) {
    for (const ch of s) {
      const g = FONT[ch];
      if (g) g.forEach((row, j) => [...row].forEach((b, i) => b === "1" && this.rect(x + i * scale, y + j * scale, scale, scale, c)));
      x += 4 * scale;
    }
    return this;
  }
  /** a hard drop shadow under everything drawn so far */
  shadow(dx = 2, dy = 2, c = "rgba(0,0,0,.28)") {
    const was = this.px.slice();
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) if (!was[y * this.w + x] && was[(y - dy) * this.w + (x - dx)] && y - dy >= 0 && x - dx >= 0) this.set(x, y, c);
    return this;
  }
  svg(label = "") {
    let r = "";
    for (let y = 0; y < this.h; y++) {
      let x = 0;
      while (x < this.w) {
        const c = this.px[y * this.w + x];
        if (!c) { x++; continue; }
        let e = x;
        while (e + 1 < this.w && this.px[y * this.w + e + 1] === c) e++;
        r += `<rect x="${x}" y="${y}" width="${e - x + 1}" height="1" fill="${c}"/>`;
        x = e + 1;
      }
    }
    return `<svg viewBox="0 0 ${this.w} ${this.h}" shape-rendering="crispEdges" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${r}</svg>`;
  }
}

const FONT: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"], "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"], "3": ["111", "001", "011", "001", "111"],
};

export function calendar() {
  const g = new Grid(34, 34);
  g.box(3, 6, 27, 25, "#ffffff");
  g.rect(5, 8, 23, 6, "#a9bde6").rect(5, 14, 23, 2, K);
  g.text("31", 9, 17, K, 2);
  g.poly([[30, 23], [30, 31], [22, 31]], "#ffffff");
  g.poly([[22, 31], [30, 23], [22, 23]], "#c9c9d4");
  g.line(22, 23, 30, 23, K).line(22, 23, 22, 31, K).line(22, 31, 30, 23, K, 2);
  for (const x of [8, 22]) g.box(x, 2, 4, 9, "#d6d6de");
  return g.shadow().svg("Tour");
}

export function film() {
  const g = new Grid(34, 34);
  g.box(3, 3, 28, 28, K, K);
  g.rect(9, 5, 16, 24, "#a9bde6");
  for (let y = 6; y < 29; y += 4) { g.rect(5, y, 2, 2, "#ffffff"); g.rect(27, y, 2, 2, "#ffffff"); }
  g.poly([[13, 10], [13, 24], [23, 17]], K);
  return g.shadow().svg("Videos");
}

export function speaker() {
  const g = new Grid(34, 34);
  g.box(3, 11, 8, 12, "#2ec27e");
  g.poly([[9, 11], [19, 3], [19, 31], [9, 23]], K);
  g.poly([[11, 12], [17, 7], [17, 27], [11, 22]], "#2ec27e");
  g.rect(12, 13, 2, 8, "#8ff0b8");
  g.ring(19, 17, 5, 6, K, -1.0, 1.0).ring(19, 17, 9, 10, K, -1.05, 1.05).ring(19, 17, 13, 14, K, -1.05, 1.05);
  g.ring(19, 17, 9.8, 10.8, K, -1.0, 1.0);
  return g.shadow().svg("Music");
}

export function folder() {
  const g = new Grid(34, 34);
  g.poly([[3, 8], [13, 8], [16, 11], [29, 11], [29, 29], [3, 29]], K);
  g.poly([[5, 10], [12, 10], [15, 13], [27, 13], [27, 27], [5, 27]], "#f6c445");
  g.poly([[3, 15], [31, 15], [28, 29], [3, 29]], K);
  g.poly([[5, 17], [29, 17], [26.6, 27], [5, 27]], "#ffd95a");
  g.rect(6, 18, 18, 2, "#fff1b0");
  return g.shadow().svg("Merch");
}

export function globe() {
  const g = new Grid(30, 30);
  g.disc(15, 15, 12, K).disc(15, 15, 10, "#ffffff");
  g.ring(15, 15, 10, 10, K).ring(15, 15, 4, 10, K).ring(15, 15, 10, 4, K, Math.PI, Math.PI * 2);
  g.line(5, 15, 25, 15, K).line(15, 5, 15, 25, K);
  g.line(8, 8, 22, 22, K).line(22, 8, 8, 22, K);
  return g.svg("All players");
}

/** the pixel arrow cursor, as a data URL */
export function cursor(fill = "#ffffff") {
  const rows = [
    "1", "11", "121", "1221", "12221", "122221", "1222221", "12222221", "122222221", "1222222221",
    "12222211111", "1221221", "121 1221", "11  1221", "1    1221", "     1221", "      11",
  ];
  const g = new Grid(12, 18);
  rows.forEach((r, y) => [...r].forEach((c, x) => c === "1" ? g.set(x, y, K) : c === "2" ? g.set(x, y, fill) : 0));
  const svg = g.svg().replace("<svg ", '<svg width="24" height="36" ');
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 1 1, auto`;
}
