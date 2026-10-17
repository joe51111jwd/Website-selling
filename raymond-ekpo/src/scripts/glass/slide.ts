// The founder's slide that the lens rewrites: one traction slide, drawn twice into canvases (as
// it usually arrives, and after the rewrite) in the plain sans a startup deck is set in. The
// renderer shows one or the other line by line. The example is invented, and the page says so.
import type { Band } from './state';

export const W = 1600;
export const H = 1000;

type Tile = { big: string; small: string; chart: 'squiggle' | 'bars' | null };
type Slide = { headline: string; size: number; tiles: Tile[] };

export const BEFORE: Slide = {
  headline: 'Strong early traction',
  size: 84,
  tiles: [
    { big: '2,000+', small: 'users and growing fast', chart: 'squiggle' },
    { big: 'Press', small: 'featured in leading publications', chart: null },
    { big: 'Partners', small: 'leading clinics on board', chart: null },
  ],
};

export const AFTER: Slide = {
  headline: 'Paying clinics up 3× in six months',
  size: 84,
  tiles: [
    { big: '41', small: 'paying clinics, up from 13 in April', chart: 'bars' },
    { big: '88%', small: 'still active after 90 days, across the last three cohorts', chart: null },
    { big: '6 in 10', small: 'new clinics referred by an existing customer', chart: null },
  ],
};

const PAD = 96;
const HEAD = { y0: 170, y1: 420 };
const TILES = { y0: 486, y1: 902, gap: 32 };
const tileW = (W - PAD * 2 - TILES.gap * 2) / 3;
const tileX = (i: number) => PAD + i * (tileW + TILES.gap);

/** The line the lens travels along in each band (slide uv): the headline, then each tile's figure. */
export const ROWS = [(HEAD.y0 + HEAD.y1) / 2 / H, 0.655, 0.655, 0.655];

/** The four regions the lens rewrites, in slide uv (y down): the headline, then each tile. */
export const BANDS: Band[] = [
  [PAD / W, HEAD.y0 / H, (W - PAD) / W, HEAD.y1 / H],
  ...[0, 1, 2].map((i) => [(tileX(i) - 6) / W, TILES.y0 / H, (tileX(i) + tileW + 6) / W, TILES.y1 / H] as Band),
];

const SANS = '"Inter Variable", "Inter", system-ui, sans-serif';

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? line + ' ' + w : w;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function draw(s: Slide) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const ls = ctx as CanvasRenderingContext2D & { letterSpacing?: string };

  ctx.fillStyle = '#fcfbf9';
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.font = `600 22px ${SANS}`;
  if ('letterSpacing' in ls) ls.letterSpacing = '3.5px';
  ctx.fillStyle = '#8d8781';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('04 · TRACTION', PAD, 92);
  ctx.textAlign = 'right';
  ctx.fillText('SEED ROUND · 2026', W - PAD, 92);
  ctx.textAlign = 'left';
  if ('letterSpacing' in ls) ls.letterSpacing = '0px';
  ctx.fillStyle = '#e6e1da';
  ctx.fillRect(PAD, 118, W - PAD * 2, 2);

  // headline, centred in its band
  ctx.fillStyle = '#141414';
  if ('letterSpacing' in ls) ls.letterSpacing = `${-s.size * 0.025}px`;
  ctx.font = `640 ${s.size}px ${SANS}`;
  const mid = (HEAD.y0 + HEAD.y1) / 2;
  ctx.fillText(s.headline, PAD, mid + s.size * 0.36);

  // three metric tiles
  s.tiles.forEach((t, i) => {
    const x = tileX(i);
    const y = TILES.y0;
    const h = TILES.y1 - TILES.y0;
    ctx.fillStyle = '#f1eee9';
    round(ctx, x, y, tileW, h, 26);
    ctx.fill();

    const big = t.big.length > 4 ? 92 : 124;
    ctx.fillStyle = '#141414';
    if ('letterSpacing' in ls) ls.letterSpacing = `${-big * 0.03}px`;
    ctx.font = `640 ${big}px ${SANS}`;
    ctx.fillText(t.big, x + 40, y + 70 + big * 0.78);

    if ('letterSpacing' in ls) ls.letterSpacing = '0px';
    ctx.font = `420 31px ${SANS}`;
    ctx.fillStyle = '#625d57';
    wrap(ctx, t.small, tileW - 80).forEach((l, j) => ctx.fillText(l, x + 40, y + 70 + big * 0.78 + 58 + j * 42));

    // a little chart at the foot of the first tile
    const cx = x + 40;
    const cy = y + h - 44;
    const cw = tileW - 80;
    if (t.chart === 'squiggle') {
      ctx.strokeStyle = '#b8b2aa';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx + cw * 0.45, cy - 6, cx + cw * 0.7, cy - 18, cx + cw, cy - 92);
      ctx.stroke();
    } else if (t.chart === 'bars') {
      const vals = [13, 17, 22, 28, 34, 41];
      const bw = (cw - 5 * 14) / 6;
      vals.forEach((v, k) => {
        const bh = (v / 41) * 96;
        ctx.fillStyle = k === vals.length - 1 ? '#141414' : '#cfc8bf';
        round(ctx, cx + k * (bw + 14), cy - bh, bw, bh, 6);
        ctx.fill();
      });
      ctx.font = `500 20px ${SANS}`;
      ctx.fillStyle = '#8d8781';
      ctx.fillText('APR', cx, cy + 30);
      ctx.textAlign = 'right';
      ctx.fillText('SEP', cx + cw, cy + 30);
      ctx.textAlign = 'left';
    }
  });

  // footer
  ctx.font = `450 21px ${SANS}`;
  ctx.fillStyle = '#aaa49d';
  ctx.fillText('Illustrative example', PAD, H - 44);
  ctx.textAlign = 'right';
  ctx.fillText('4', W - PAD, H - 44);
  ctx.textAlign = 'left';
  return c;
}

export async function drawSlides() {
  await Promise.all(
    ['640 104px', '420 31px', '600 22px'].map((f) => document.fonts.load(`${f} "Inter Variable"`).catch(() => undefined)),
  );
  return { before: draw(BEFORE), after: draw(AFTER) };
}
