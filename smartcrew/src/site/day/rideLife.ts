// One Day's live layer on the screens, v2: the real UI doing its thing, drawn into the device
// screens (Stage overlays) on the Stage's own frames, on the ride's clock. Per moment:
//
//   6:42   the press on Clock In, then on Start; the timer runs (00h 00m 03s, 04s, 05s …: a 1 Hz
//          redraw of the seconds only); the Clock Ins row slides in on the office dashboard
//   6:55   the DOT form fills itself, field by field (covers cut from the empty form fade away,
//          an orange tick lands after each); Submit; the inspection slides in
//   9:20   Submit on the hauling log; the ticket's row slides in; the KPIs tick one by one
//   4:12   the request types itself (a cover steps right, character by character, a caret with
//          it); Urgency → High; Submit; the work order slides into the shop queue
//   5:00   Clock Out; the profit card shows the morning's figure until the count has run
//   5:30   the Monday block drops into its slot
//   Friday Submit Timecard; Review → Approved, row by row; the payroll toast slides in
//
// Each overlay is a small canvas drawn once (or a handful of times) and then only moved or faded
// (uniforms), never re-drawn per frame. Every frame is a pure function of the clock: pause, seek,
// jump, and the screens are exactly where they are at that millisecond. Only the current moment's
// overlays are set (slots 2–5 of each device); the next one's are built ahead.

import interUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { onStageFrame, setOverlay, updateOverlay, type OverlaySlot } from "../../three/stage/store";
import { screenUrl } from "../../three/stage/urls";
import type { Box, DeviceId } from "../../three/stage/types";
import { RIDE, momentAt, type Ride } from "./ride";
import { SCRIPT } from "./script";
import { stateScreen } from "./states/registry";
import { DAY_DATA } from "./states/data";
import { PX } from "./poses";

// ─── drawing helpers ─────────────────────────────────────────────────────────
const FONT = '"SC Inter", "Inter Variable", Inter, system-ui, sans-serif';
type G = CanvasRenderingContext2D & { letterSpacing?: string };

let fontReady: Promise<void> | null = null;
function loadInter() {
  if (!fontReady) {
    const ff = new FontFace("SC Inter", `url(${interUrl}) format("woff2")`, { weight: "100 900" });
    fontReady = ff
      .load()
      .then((x) => void document.fonts.add(x))
      .catch(() => {});
  }
  return fontReady;
}

const images = new Map<string, Promise<ImageBitmap | HTMLImageElement>>();
function image(id: string) {
  let p = images.get(id);
  if (!p) {
    p = fetch(screenUrl(id))
      .then((r) => r.blob())
      .then((b) => ("createImageBitmap" in window ? createImageBitmap(b) : Promise.reject(new Error("no createImageBitmap"))))
      .catch(async () => {
        const img = new Image();
        img.src = screenUrl(id);
        await img.decode();
        return img;
      });
    images.set(id, p);
  }
  return p;
}

function canvas(w: number, h: number, scale: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.round(w * scale));
  c.height = Math.max(2, Math.round(h * scale));
  const g = c.getContext("2d") as G;
  g.scale(scale, scale);
  g.imageSmoothingQuality = "high";
  return { c, g };
}

/** Draw a region of a screen image (native px) at (dx, dy) of a canvas (native px). */
function blit(g: G, img: ImageBitmap | HTMLImageElement, src: Box, dx: number, dy: number, nativeW: number) {
  const k = img.width / nativeW;
  g.drawImage(img, src[0] * k, src[1] * k, src[2] * k, src[3] * k, dx, dy, src[2], src[3]);
}
/** A crop of a screen image as its own canvas. */
function crop(img: ImageBitmap | HTMLImageElement, src: Box, nativeW: number, scale: number) {
  const c = canvas(src[2], src[3], scale);
  blit(c.g, img, src, 0, 0, nativeW);
  return c.c;
}
function solid(color: string) {
  const c = canvas(4, 4, 1);
  c.g.fillStyle = color;
  c.g.fillRect(0, 0, 4, 4);
  return c.c;
}

function rr(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const prog = (t: number, w: [number, number]) => clamp01((t - w[0]) / Math.max(1, w[1] - w[0]));
const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Draw text with every figure in a fixed-width cell (the app's tabular figures). */
function tabular(g: G, s: string, x: number, y: number, cell: number) {
  let cx = x;
  for (const ch of s) {
    if (/\d/.test(ch)) {
      const w = g.measureText(ch).width;
      g.fillText(ch, cx + (cell - w) / 2, y);
      cx += cell;
    } else {
      g.fillText(ch, cx, y);
      cx += g.measureText(ch).width;
    }
  }
}

// ─── the pieces ──────────────────────────────────────────────────────────────

type Slot = { dev: DeviceId; slot: OverlaySlot };
/** One overlay: what to set on apply, and how it moves with the clock. */
type Piece = { slots: Slot[]; apply: () => void; set: (t: number) => void };

const W = 1440;
const PW = 402;

/** A finger's press on a phone button: a dark press drawn on the screen itself. */
function press(slot: OverlaySlot, screen: string, box: Box, at: number): Piece {
  const [x, y, w, h] = box;
  const pad = 2;
  const c = canvas(w + pad * 2, h + pad * 2, 3);
  c.g.fillStyle = "rgba(0, 0, 0, 0.3)";
  rr(c.g, pad, pad, w, h, Math.min(w, h) / 2);
  c.g.fill();
  let last = -1;
  return {
    slots: [{ dev: "iphone", slot }],
    apply: () => setOverlay("iphone", slot, { canvas: c.c, rect: [x - pad, y - pad, w + pad * 2, h + pad * 2], screen, scene: "day", alpha: 0 }),
    set(t) {
      const p = (t - at) / 420;
      // down fast, back up slower; gone by the time the screen changes state
      const a = p <= 0 || p >= 1 ? 0 : p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75;
      if (a !== last) updateOverlay("iphone", slot, { alpha: a });
      last = a;
    },
  };
}

/** A new top row on an office screen: the rows under it slide down a row, the new one fades in. */
async function insert(slots: [OverlaySlot, OverlaySlot], screen: string, row: Box, next: number, win: [number, number]): Promise<Piece> {
  const img = await image(screen);
  const [x, y, w, h] = row;
  const rowH = next - y;
  const strip = canvas(w, 900 - y, 2);
  strip.g.fillStyle = "#ffffff";
  strip.g.fillRect(0, 0, w, 900 - y);
  blit(strip.g, img, [x, next, w, 900 - next], 0, 0, W);
  const nr = canvas(w, h, 2);
  blit(nr.g, img, [x, y, w, h], 0, 0, W);
  const [a, b] = slots;
  let last = -1;
  return {
    slots: [{ dev: "macbook", slot: a }, { dev: "macbook", slot: b }],
    apply() {
      setOverlay("macbook", a, { canvas: strip.c, rect: [x, y, w, 900 - y], screen, scene: "day", alpha: 1 });
      setOverlay("macbook", b, { canvas: nr.c, rect: [x, y, w, h], screen, scene: "day", alpha: 0 });
      last = -1;
    },
    set(t) {
      const u = prog(t, win);
      if (u === last) return;
      last = u;
      const e = ease(u / 0.75);
      const r = ease((u - 0.3) / 0.7);
      updateOverlay("macbook", a, { alpha: u >= 1 ? 0 : 1, dy: rowH * e });
      updateOverlay("macbook", b, { alpha: u >= 1 ? 0 : r, dy: -rowH * 0.4 * (1 - r) });
    },
  };
}

/** A few stills of one overlay, switched by the clock (each drawn once). */
function stills(dev: DeviceId, slot: OverlaySlot, screen: string, rect: Box, frames: HTMLCanvasElement[], which: (t: number) => number): Piece {
  let cur = -2;
  return {
    slots: [{ dev, slot }],
    apply() {
      cur = -2;
    },
    set(t) {
      const k = which(t);
      if (k === cur) return;
      cur = k;
      if (k < 0 || !frames[k]) setOverlay(dev, slot, null);
      else setOverlay(dev, slot, { canvas: frames[k], rect, screen, scene: "day", alpha: 1 });
    },
  };
}

// ─── the moments ─────────────────────────────────────────────────────────────

async function clockin(R: Ride): Promise<Piece[]> {
  const m = R.moments[0];
  const S = SCRIPT[0];
  const after = S.phone.after;
  // the timer: the seconds of "00h 00m 03s" (21 px, 600) and of the total (13.5 px, 500)
  const secs = (big: boolean, s: number) => {
    const c = canvas(big ? 27 : 18, big ? 26 : 17, 3);
    c.g.fillStyle = "#ffffff";
    if (!big) c.g.fillStyle = "#ffffff";
    c.g.fillRect(0, 0, 40, 40);
    c.g.font = big ? `600 21px ${FONT}` : `500 13.5px ${FONT}`;
    c.g.fillStyle = big ? "#0a0a0a" : "#111111";
    c.g.textBaseline = "alphabetic";
    tabular(c.g, String(s).padStart(2, "0"), 0, big ? 20.3 : 13.1, big ? 13.25 : 8.6);
    return c.c;
  };
  const N = 40;
  const big = Array.from({ length: N }, (_, s) => secs(true, s));
  const small = Array.from({ length: N }, (_, s) => secs(false, s));
  const clocked = m.at.clocked[0];
  const sec = (t: number) => (t < clocked ? -1 : Math.min(N - 1, 3 + Math.floor((t - clocked) / 1000)));
  return [
    press(2, "phone-home", PX.clockIn, m.at.tap1[0]),
    press(5, "phone-select-task", PX.start, m.at.tap2[0]),
    stills("iphone", 3, after, [166.7, 333.1, 27, 26], big, sec),
    stills("iphone", 4, after, [117.6, 650, 18, 17], small, sec),
    await insert([2, 3], S.laptop.after, PX.clockRow, 760, m.at.insert),
  ];
}

async function pretrip(R: Ride): Promise<Piece[]> {
  const m = R.moments[1];
  const S = SCRIPT[1];
  const form = S.phone.before;
  const empty = await image(stateScreen("phone-d-dot-empty"));
  // the four fields (native px) and where each one's tick lands
  const F: Box[] = [
    [21, 152.1, 360, 45],
    [21, 244.8, 360, 45],
    [21, 337.5, 360, 45],
    [21, 436.5, 360, 32.5],
  ];
  const sc = 2;
  const fieldCover = F.map((f) => crop(empty, [f[0] - 1, f[1] - 1, f[2] + 2, f[3] + 2], PW, sc));
  const bottom = F[3][1] + F[3][3] + 1;
  const rest = F.map((_, k) => (k < 3 ? crop(empty, [20, F[k + 1][1] - 1, 362, bottom - F[k + 1][1] + 1], PW, sc) : null));
  // the ticks (orange, at the right of each filled field), one still per count
  const tickBox: Box = [300, 150, 70, 240];
  const ticks = [0, 1, 2, 3].map((n) => {
    const c = canvas(tickBox[2], tickBox[3], 3);
    for (let k = 0; k < n; k++) {
      const f = F[k];
      const cx = (k === 1 ? 356 : 326) - tickBox[0];
      const cy = f[1] + f[3] / 2 - tickBox[1];
      c.g.strokeStyle = "#ff7a01";
      c.g.lineWidth = 2.4;
      c.g.lineCap = "round";
      c.g.lineJoin = "round";
      c.g.beginPath();
      c.g.moveTo(cx - 6, cy + 0.5);
      c.g.lineTo(cx - 1.5, cy + 5);
      c.g.lineTo(cx + 7, cy - 5);
      c.g.stroke();
    }
    return c.c;
  });
  const [f0, f1] = m.at.fill;
  const per = (f1 - f0) / 4;
  const stepAt = (t: number) => (t < f0 ? 0 : Math.min(4, Math.floor((t - f0) / per)));
  let lastA = -1;
  let lastK = -2;
  const fade: Piece = {
    slots: [{ dev: "iphone", slot: 3 }],
    apply() {
      lastK = -2;
      lastA = -1;
    },
    set(t) {
      const k = stepAt(t);
      if (k >= 4) {
        if (lastK !== 4) setOverlay("iphone", 3, null);
        lastK = 4;
        return;
      }
      if (k !== lastK) {
        const f = F[k];
        setOverlay("iphone", 3, { canvas: fieldCover[k], rect: [f[0] - 1, f[1] - 1, f[2] + 2, f[3] + 2], screen: form, scene: "day", alpha: 1 });
        lastK = k;
        lastA = -1;
      }
      const a = t < f0 ? 1 : 1 - ease((t - (f0 + k * per)) / 180);
      if (a !== lastA) updateOverlay("iphone", 3, { alpha: a });
      lastA = a;
    },
  };
  const restRect = (k: number): Box => [20, F[k + 1][1] - 1, 362, bottom - F[k + 1][1] + 1];
  let lastR = -2;
  const remaining: Piece = {
    slots: [{ dev: "iphone", slot: 4 }],
    apply() {
      lastR = -2;
    },
    set(t) {
      const k = stepAt(t);
      if (k === lastR) return;
      lastR = k;
      const c = rest[k];
      if (!c) setOverlay("iphone", 4, null);
      else setOverlay("iphone", 4, { canvas: c, rect: restRect(k), screen: form, scene: "day", alpha: 1 });
    },
  };
  // a tick lands 180 ms after its field's value (the choice's own ✓ is the fourth one's)
  const tickN = (t: number) => (t < f0 ? 0 : Math.min(3, Math.floor((t - f0 - 180) / per) + 1));
  return [
    fade,
    remaining,
    stills("iphone", 5, form, tickBox, ticks, (t) => tickN(t)),
    press(2, form, PX.submit, m.at.tap[0]),
    await insert([2, 3], S.laptop.after, PX.inspRow, 568.8, m.at.insert),
  ];
}

async function load(R: Ride): Promise<Piece[]> {
  const m = R.moments[2];
  const S = SCRIPT[2];
  const screen = S.laptop.after;
  const img = await image(screen);
  await loadInter();
  // the KPIs: Loads today, Yards hauled, Imported, before (13, 156 yd³, 8 loads) and after
  const region: Box = [398, 183, 640, 28];
  const KPI: { box: Box; before: string }[] = [
    { box: [403, 186, 66, 22], before: "13" },
    { box: [670.8, 186, 69.9, 22], before: "156 yd³" },
    { box: [938.5, 186, 61.2, 22], before: "8 loads" },
  ];
  const state = (n: number) => {
    const c = canvas(region[2], region[3], 2);
    blit(c.g, img, region, 0, 0, W);
    KPI.forEach((k, i) => {
      if (i < n) return;
      c.g.fillStyle = "#f6f6f6";
      c.g.fillRect(k.box[0] - region[0] - 1, k.box[1] - region[1], k.box[2] + 4, k.box[3]);
      c.g.font = `570 17.5px ${FONT}`;
      c.g.letterSpacing = "-0.09px";
      c.g.fillStyle = "#000";
      c.g.textBaseline = "alphabetic";
      c.g.fillText(k.before, k.box[0] - region[0], 203.4 - region[1]);
    });
    return c.c;
  };
  const frames = [0, 1, 2, 3].map(state);
  const [k0] = m.at.kpis;
  const n = (t: number) => (t < k0 ? 0 : Math.min(3, Math.floor((t - k0) / 300) + 1));
  return [
    press(2, S.phone.before, PX.submit, m.at.tap[0]),
    await insert([2, 3], screen, PX.haulRow, 407.5, m.at.merge),
    stills("macbook", 4, screen, region, frames, (t) => (n(t) >= 3 ? -1 : n(t))),
  ];
}

async function leak(R: Ride): Promise<Piece[]> {
  const m = R.moments[3];
  const S = SCRIPT[3];
  const form = S.phone.before;
  const empty = await image(stateScreen("phone-d-service-empty"));
  // the text's characters' right edges (native px), measured on the rendered form
  const RIGHTS = [41.9, 50.1, 54.8, 59.4, 63.3, 67.9, 73.2, 81, 89, 96.7, 100.6, 105.1, 113.3, 121.5, 128.9, 132.3, 140.7, 149, 152.9, 156.3, 164.4, 174.9, 178.9, 182.8, 186.2, 194.8, 198.2, 206.3, 211.6, 215.5, 222.9, 231.1, 239.3, 247.8, 251.2, 259.5, 268.1, 272, 280.4, 283.8, 287.2, 291.2];
  const X0 = 33.5;
  const [ty0, ty1] = m.at.type;
  const nAt = (t: number) => (t < ty0 ? 0 : Math.min(RIGHTS.length, Math.floor(((t - ty0) / (ty1 - ty0)) * RIGHTS.length)));
  const cover = solid("rgb(244, 244, 244)");
  const caret = solid("#111111");
  let lastN = -1;
  const typing: Piece = {
    slots: [{ dev: "iphone", slot: 3 }, { dev: "iphone", slot: 4 }],
    apply() {
      lastN = -1;
      setOverlay("iphone", 3, { canvas: cover, rect: [X0, 433, 300, 25], screen: form, scene: "day", alpha: 1 });
      setOverlay("iphone", 4, { canvas: caret, rect: [X0, 437, 1.6, 17], screen: form, scene: "day", alpha: 0 });
    },
    set(t) {
      const n = nAt(t);
      const on = t >= ty0 - 300 && t < ty1 + 500;
      const key = n * 2 + (on ? 1 : 0);
      if (key === lastN) return;
      lastN = key;
      const x = n ? RIGHTS[n - 1] + 0.4 : X0;
      updateOverlay("iphone", 3, { rect: [x, 433, Math.max(0.01, 300 - (x - X0)), 25], alpha: n >= RIGHTS.length ? 0 : 1 });
      updateOverlay("iphone", 4, { rect: [x + 0.6, 437, 1.6, 17], alpha: on ? 1 : 0 });
    },
  };
  const urg: Box = [20, 342.9, 362, 34.5];
  const urgCover = crop(empty, urg, PW, 2);
  let lastU = -1;
  const urgency: Piece = {
    slots: [{ dev: "iphone", slot: 5 }],
    apply() {
      lastU = -1;
      setOverlay("iphone", 5, { canvas: urgCover, rect: urg, screen: form, scene: "day", alpha: 1 });
    },
    set(t) {
      const a = 1 - ease(prog(t, m.at.urgency));
      if (a !== lastU) updateOverlay("iphone", 5, { alpha: a });
      lastU = a;
    },
  };
  return [typing, urgency, press(2, form, PX.submit, m.at.tap[0]), await insert([2, 3], S.laptop.after, PX.queueRow, 340.5, m.at.land)];
}

async function profit(R: Ride): Promise<Piece[]> {
  const m = R.moments[4];
  const S = SCRIPT[4];
  await loadInter();
  // the morning's figure, until the count (on the big card, ./fx.ts) has run
  const rect: Box = [622, 411, 150, 32];
  const c = canvas(rect[2], rect[3], 2);
  c.g.fillStyle = "#f6f6f6";
  c.g.fillRect(0, 0, rect[2], rect[3]);
  c.g.fillStyle = "#000";
  c.g.font = `570 16px ${FONT}`;
  c.g.letterSpacing = "-0.08px";
  c.g.textBaseline = "alphabetic";
  c.g.fillText(money(DAY_DATA.profit.from), 627.3 - rect[0], 433.3 - rect[1]);
  return [press(2, S.phone.before, PX.clockOut, m.at.tap[0]), stills("macbook", 2, S.laptop.after, rect, [c.c], (t) => (t < m.at.count[1] ? 0 : -1))];
}

async function plan(R: Ride): Promise<Piece[]> {
  const m = R.moments[5];
  const S = SCRIPT[5];
  const screen = S.laptop.after;
  const img = await image(screen);
  const [x, y, w, h] = PX.block;
  const cover = canvas(w + 8, h + 8, 2);
  cover.g.fillStyle = "#ffffff";
  cover.g.fillRect(0, 0, w + 8, h + 8);
  const block = canvas(w, h, 2);
  blit(block.g, img, PX.block, 0, 0, W);
  let last = -1;
  return [
    {
      slots: [{ dev: "macbook", slot: 2 }, { dev: "macbook", slot: 3 }],
      apply() {
        last = -1;
        setOverlay("macbook", 2, { canvas: cover.c, rect: [x - 4, y - 4, w + 8, h + 8], screen, scene: "day", alpha: 1 });
        setOverlay("macbook", 3, { canvas: block.c, rect: PX.block, screen, scene: "day", alpha: 0 });
      },
      set(t) {
        const u = prog(t, m.at.block);
        if (u === last) return;
        last = u;
        const e = ease(u);
        updateOverlay("macbook", 2, { alpha: u >= 1 ? 0 : 1 });
        updateOverlay("macbook", 3, { alpha: u >= 1 ? 0 : e, dy: -14 * (1 - e) });
      },
    },
  ];
}

async function payroll(R: Ride): Promise<Piece[]> {
  const m = R.moments[6];
  const S = SCRIPT[6];
  const screen = S.laptop.after;
  await loadInter();
  const cells = Array.from({ length: 8 }, (_, i) => [1250, 294.3 + i * 60.75, 110, 60.75] as Box);
  const top = cells[0][1];
  const bottom = cells[7][1] + cells[7][3];
  const cx = cells[0][0];
  const cw = cells[0][2];
  // one still per number of rows flipped (a discrete flip per row; no per-frame redraws)
  const col = (n: number) => {
    const c = canvas(cw, bottom - top, 2);
    cells.forEach(([, cy, , ch], k) => {
      const y0 = cy - top;
      const g = c.g;
      g.fillStyle = "#ffffff";
      g.fillRect(0, y0 + 1, cw, ch - 2);
      const mid = y0 + ch / 2;
      g.textAlign = "center";
      g.textBaseline = "middle";
      if (k >= n) {
        g.font = `650 13px ${FONT}`;
        g.fillStyle = "#000";
        g.fillText("Review", cw / 2 + 0.5, mid + 1);
      } else {
        const pw = 92;
        rr(g, (cw - pw) / 2, mid - 13, pw, 26, 13);
        g.fillStyle = "#e7f9ef";
        g.fill();
        g.font = `600 12.5px ${FONT}`;
        g.fillStyle = "#148a49";
        g.fillText("✓ Approved", cw / 2, mid + 1);
      }
    });
    return c.c;
  };
  const cols = Array.from({ length: 9 }, (_, n) => col(n));
  const [c0, c1] = m.at.cascade;
  const flipped = (t: number) => (t < c0 ? 0 : Math.min(8, Math.floor(((t - c0) / (c1 - c0)) * 8) + 1));
  const toastC = canvas(PX.toast[2], PX.toast[3], 2);
  drawToast(toastC.g, PX.toast);
  let lastT = -1;
  const toast: Piece = {
    slots: [{ dev: "macbook", slot: 3 }],
    apply() {
      lastT = -1;
      setOverlay("macbook", 3, { canvas: toastC.c, rect: PX.toast, screen, scene: "day", alpha: 0, dy: -18 });
    },
    set(t) {
      const u = ease(prog(t, m.at.toast));
      if (u === lastT) return;
      lastT = u;
      updateOverlay("macbook", 3, { alpha: u, dy: -18 * (1 - u) });
    },
  };
  return [
    press(2, S.phone.before, PX.submitTimecard, m.at.tap[0]),
    stills("macbook", 2, screen, [cx, top, cw, bottom - top], cols, (t) => (t < m.start ? -1 : flipped(t) >= 8 && t > c1 + 400 ? -1 : flipped(t))),
    toast,
  ];
}

/** The payroll toast, in the app's toast style (top right). */
function drawToast(g: G, rect: Box) {
  const [, , Wd] = rect;
  const t = DAY_DATA.payroll;
  const x = 18,
    y = 14,
    w = Wd - 36,
    h = 66;
  g.save();
  g.shadowColor = "rgba(17, 17, 17, 0.16)";
  g.shadowBlur = 22;
  g.shadowOffsetY = 8;
  g.fillStyle = "#fff";
  rr(g, x, y, w, h, 14);
  g.fill();
  g.restore();
  g.strokeStyle = "#e6e6e6";
  g.lineWidth = 1;
  rr(g, x + 0.5, y + 0.5, w - 1, h - 1, 14);
  g.stroke();
  const cx = x + 34,
    cy = y + h / 2;
  g.fillStyle = "#e8f6ee";
  g.beginPath();
  g.arc(cx, cy, 18, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#1f9d55";
  g.lineWidth = 2.2;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(cx - 7, cy + 0.5);
  g.lineTo(cx - 2, cy + 5.5);
  g.lineTo(cx + 7.5, cy - 5);
  g.stroke();
  const text = (s: string, tx: number, ty: number, size: number, weight: number, color: string, align: CanvasTextAlign = "left") => {
    g.font = `${weight} ${size}px ${FONT}`;
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = "alphabetic";
    g.fillText(s, tx, ty);
  };
  text(t.title, x + 64, y + 29, 15, 600, "#111");
  text(t.meta, x + 64, y + 49, 13, 450, "#6b6b6b");
  text(t.time, x + w - 16, y + 29, 12, 450, "#9a9a9a", "right");
}

const BUILD = [clockin, pretrip, load, leak, profit, plan, payroll];

// ─── the controller ─────────────────────────────────────────────────────────

let building = 0;
/** Moments' overlays still being built (captures wait for none). */
export const rideLifePending = () => building;

/**
 * Start the live layer: on every Stage frame the current moment's overlays are set to where the
 * clock (`time()`, ms of the film) has them; the next moment's are built ahead. Returns a stop.
 */
export function startRideLife(time: () => number, R: Ride = RIDE): () => void {
  let gone = false;
  const built = new Map<number, Piece[] | null>();
  const ensure = (i: number) => {
    if (i < 0 || i >= R.moments.length || built.has(i)) return;
    built.set(i, null);
    building++;
    loadInter()
      .then(() => BUILD[i](R))
      .then((p) => {
        if (!gone) built.set(i, p);
      })
      .catch((e) => {
        console.warn("[day] screen life failed", R.moments[i].id, e);
        built.delete(i);
      })
      .finally(() => building--);
  };
  let active = -1;
  let used: Slot[] = [];
  const clear = () => {
    used.forEach((s) => setOverlay(s.dev, s.slot, null));
    used = [];
  };

  const off = onStageFrame(() => {
    const t = time();
    const i = momentAt(t, R);
    ensure(i);
    ensure(i + 1);
    const pieces = built.get(i);
    if (i !== active || (pieces && !used.length)) {
      if (!pieces) {
        if (i !== active) clear();
        active = i;
        return false;
      }
      clear();
      active = i;
      pieces.forEach((p) => {
        p.apply();
        used.push(...p.slots);
      });
    }
    pieces?.forEach((p) => p.set(t));
    return false;
  });

  return () => {
    gone = true;
    off();
    clear();
  };
}
