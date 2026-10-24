/*
  The placeholder jacket, drawn to canvas with real fonts so the type stays crisp on the 3D book and the
  product tile. Michael's final cover art replaces drawCover/drawSpine/drawBack once we have it.
*/

export const COVER = {
  ink: "#13286b",
  paper: "#f3efe6",
  amber: "#ffb54d",
  endpaper: "#d9801a",
};

const SERIF = '"Newsreader", "Iowan Old Style", Georgia, serif';
const SANS = '"Inter", -apple-system, "Helvetica Neue", Arial, sans-serif';

export async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load(`500 120px ${SERIF}`),
      document.fonts.load(`italic 500 120px ${SERIF}`),
      document.fonts.load(`600 40px ${SANS}`),
    ]);
  } catch {
    /* draw with fallbacks */
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

/** Fine paper grain so flat color reads as printed stock under the 3D lights. */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount = 10) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** The inverted stepped pyramid: five bars, each narrower than the one above. */
function pyramid(ctx: CanvasRenderingContext2D, cx: number, top: number, width: number, bar: number, gap: number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const w = width * (1 - i * 0.19);
    ctx.fillRect(cx - w / 2, top + i * (bar + gap), w, bar);
  }
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number) {
  // canvas letterSpacing where supported, manual fallback elsewhere
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in c) {
    c.letterSpacing = `${tracking}px`;
    ctx.fillText(text, x, y);
    c.letterSpacing = "0px";
    return;
  }
  ctx.fillText(text.split("").join(" "), x, y);
}

export function drawCover(w = 1200, h = 1800) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = COVER.ink;
  ctx.fillRect(0, 0, w, h);
  const m = w * 0.09;

  ctx.fillStyle = COVER.paper;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 ${w * 0.026}px ${SANS}`;
  spaced(ctx, "MICHAEL", m, m + w * 0.03, w * 0.009);

  ctx.font = `500 ${w * 0.15}px ${SERIF}`;
  const lh = w * 0.15;
  const y0 = h * 0.2;
  ctx.fillText("Scaling", m - w * 0.006, y0 + lh * 0.8);
  ctx.fillText("Upside", m - w * 0.006, y0 + lh * 1.75);
  ctx.font = `italic 500 ${w * 0.15}px ${SERIF}`;
  ctx.fillText("Down", m - w * 0.006, y0 + lh * 2.7);

  pyramid(ctx, w / 2, h * 0.64, w * 0.5, w * 0.032, w * 0.014, COVER.amber);

  ctx.fillStyle = "rgba(243,239,230,0.35)";
  ctx.fillRect(m, h - m - w * 0.07, w - m * 2, 2);
  ctx.fillStyle = COVER.paper;
  ctx.font = `500 ${w * 0.024}px ${SANS}`;
  ctx.fillText("A book and its AI bootloader", m, h - m - w * 0.012);

  grain(ctx, w, h, 9);
  return c;
}

export function drawSpine(w = 272, h = 1800) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = COVER.ink;
  ctx.fillRect(0, 0, w, h);
  pyramid(ctx, w / 2, w * 0.4, w * 0.42, w * 0.03, w * 0.022, COVER.amber);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = COVER.paper;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${w * 0.3}px ${SERIF}`;
  ctx.fillText("Scaling Upside Down", -h * 0.04, 0);
  ctx.font = `600 ${w * 0.11}px ${SANS}`;
  spaced(ctx, "MICHAEL", h * 0.36, 0, w * 0.03);
  ctx.restore();
  grain(ctx, w, h, 9);
  return c;
}

export function drawBack(w = 1200, h = 1800) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = COVER.ink;
  ctx.fillRect(0, 0, w, h);
  const m = w * 0.1;
  ctx.textAlign = "left";
  ctx.fillStyle = COVER.paper;
  ctx.font = `500 ${w * 0.058}px ${SERIF}`;
  const lines = ["Most growth advice was", "written for the 3% of", "companies built to scale."];
  lines.forEach((l, i) => ctx.fillText(l, m, h * 0.2 + i * w * 0.072));
  ctx.fillStyle = COVER.amber;
  ctx.font = `italic 500 ${w * 0.058}px ${SERIF}`;
  ctx.fillText("This book is for the other 97%.", m, h * 0.2 + 3.4 * w * 0.072);

  ctx.fillStyle = "rgba(243,239,230,0.72)";
  ctx.font = `400 ${w * 0.026}px ${SANS}`;
  ["Michael bootstrapped companies for twelve years,", "after nine years in equity research on Wall Street."].forEach((l, i) =>
    ctx.fillText(l, m, h * 0.62 + i * w * 0.042),
  );

  // barcode block
  const bw = w * 0.3;
  const bh = w * 0.17;
  const bx = w - m - bw;
  const by = h - m - bh;
  ctx.fillStyle = "#fbfaf6";
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = "#111";
  let x = bx + bw * 0.08;
  let seed = 7;
  while (x < bx + bw * 0.92) {
    seed = (seed * 9301 + 49297) % 233280;
    const t = 1 + (seed % 4);
    ctx.fillRect(x, by + bh * 0.12, t * 1.6, bh * 0.62);
    x += t * 1.6 + 2 + (seed % 3) * 1.4;
  }
  pyramid(ctx, m + w * 0.06, h - m - w * 0.1, w * 0.12, w * 0.012, w * 0.006, COVER.amber);
  grain(ctx, w, h, 9);
  return c;
}

export function drawTitlePage(w = 1000, h = 1500) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = "#f7f3ea";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1d1d1f";
  ctx.textAlign = "center";
  ctx.font = `500 ${w * 0.085}px ${SERIF}`;
  ctx.fillText("Scaling", w / 2, h * 0.36);
  ctx.font = `italic 500 ${w * 0.085}px ${SERIF}`;
  ctx.fillText("Upside Down", w / 2, h * 0.36 + w * 0.1);
  ctx.fillRect(w / 2 - w * 0.04, h * 0.5, w * 0.08, 2);
  ctx.font = `600 ${w * 0.022}px ${SANS}`;
  spaced(ctx, "MICHAEL", w / 2, h * 0.56, w * 0.008);
  grain(ctx, w, h, 6);
  return c;
}

/** Page edges: hundreds of fine lines, so the block reads as paper, not a white box. */
export function drawPageEdge(w = 1024, h = 128) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = "#efe9dc";
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = `rgba(120,105,80,${0.05 + Math.random() * 0.08})`;
    ctx.fillRect(0, y, w, 1);
  }
  return c;
}

export function drawEndpaper(w = 512, h = 768) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = COVER.endpaper;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, 12);
  return c;
}
