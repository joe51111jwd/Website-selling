// One Day's live layer on the screens, on the ride's clock: the cause → effect you see on the
// real UI, drawn into the device screens (Stage overlays) on the Stage's own frames.
//
//  · THE PRESS. When the finger lands (./ride.ts `tap`), the button on the phone's screen
//    depresses (a dark press drawn on the screen itself, iphone overlay slot 2); a beat later the
//    poses swap the screen to its "after" state (./states).
//  · THE UPDATE. When the pulse lands, the office screen changes in place: the rows under the
//    new one slide down a row and the new row fades in (insert), the number ticks up (tick), the
//    calendar block drops in (block), "Review" flips to "Approved" row by row and a toast slides
//    in (approve). Each is two small canvases over the screen (macbook overlay slots 2–3 for
//    even moments, 4–5 for odd ones, so the next moment's "before" is in place before its screen
//    fades in). The screen texture itself is the "after" state; the overlays hide the change
//    until it lands, play it, then step aside.
//  · Every frame is a pure function of the clock: pause and the press stays half pressed, seek
//    and the row is exactly where it is at that millisecond. Reduced motion: states jump.

import interUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { MOMENTS } from "../../content/moments";
import { onStageFrame, setOverlay, updateOverlay, type OverlaySlot } from "../../three/stage/store";
import { screenUrl } from "../../three/stage/urls";
import type { Box } from "../../three/stage/types";
import { RIDE, momentAt, type Ride } from "./ride";
import { SCRIPT, type Script } from "./script";
import { DAY_DATA } from "./states/data";

// ─── drawing helpers ─────────────────────────────────────────────────────────
const SCALE = 2; // canvas px per native px (the web screens are shot at 2x)
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

function canvas(w: number, h: number, scale = SCALE) {
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

function rr(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

const ease = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── the office update of one moment ─────────────────────────────────────────
type Anim = {
  /** draw the state at progress t (0 = before, 1 = after); returns false once nothing is left to draw */
  set: (t: number) => void;
  duration: number;
};

const slotsFor = (i: number): [OverlaySlot, OverlaySlot] => (i % 2 ? [4, 5] : [2, 3]);

async function buildUpdate(i: number, s: Script): Promise<Anim | null> {
  await loadInter();
  const u = s.laptop.update;
  const screen = s.laptop.after;
  const img = await image(screen);
  const [a, b] = slotsFor(i);
  const W = 1440;
  const H = 900;
  const common = { screen, scene: "day" } as const;

  if (u.kind === "insert") {
    const [x, y, w, h] = u.row;
    const rowH = u.next - y;
    // the rows under the new one, pulled up into its place (and a blank row at the bottom)
    const strip = canvas(w, H - y);
    strip.g.fillStyle = "#ffffff";
    strip.g.fillRect(0, 0, w, H - y);
    blit(strip.g, img, [x, u.next, w, H - u.next], 0, 0, W);
    // the new row on its own
    const row = canvas(w, h);
    blit(row.g, img, [x, y, w, h], 0, 0, W);
    setOverlay("macbook", a, { canvas: strip.c, rect: [x, y, w, H - y], ...common, alpha: 1 });
    setOverlay("macbook", b, { canvas: row.c, rect: [x, y, w, h], ...common, alpha: 0 });
    return {
      duration: 720,
      set(t) {
        const e = ease(t / 0.75);
        const r = ease((t - 0.3) / 0.7);
        updateOverlay("macbook", a, { alpha: t >= 1 ? 0 : 1, dy: rowH * e });
        updateOverlay("macbook", b, { alpha: t >= 1 ? 0 : r, dy: -rowH * 0.4 * (1 - r) });
      },
    };
  }

  if (u.kind === "tick") {
    const [, , w, h] = u.rect;
    const num = canvas(w, h);
    let last = "";
    const draw = (v: number, flash: number) => {
      const key = `${v.toFixed(2)}|${flash.toFixed(2)}`;
      if (key === last) return false;
      last = key;
      const g = num.g;
      g.clearRect(0, 0, w, h);
      g.fillStyle = u.bg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = flash > 0 ? `rgb(${Math.round(31 * flash)}, ${Math.round(157 * flash)}, ${Math.round(85 * flash)})` : "#000";
      g.font = `570 16px ${FONT}`;
      g.letterSpacing = "-0.08px";
      g.textBaseline = "alphabetic";
      g.fillText(money(v), u.text[0] - u.rect[0], u.text[1] - u.rect[1]);
      return true;
    };
    draw(u.from, 0);
    setOverlay("macbook", a, { canvas: num.c, rect: u.rect, ...common, alpha: 1 });
    setOverlay("macbook", b, null);
    return {
      duration: 1500,
      set(t) {
        const v = Math.round((u.from + (u.to - u.from) * ease(t / 0.8)) * 100) / 100;
        const flash = t <= 0 ? 0 : t < 0.8 ? 1 : Math.max(0, 1 - (t - 0.8) / 0.2);
        if (draw(t >= 1 ? u.to : v, t >= 1 ? 0 : flash)) updateOverlay("macbook", a, { redraw: true });
      },
    };
  }

  if (u.kind === "block") {
    const [x, y, w, h] = u.rect;
    const cover = canvas(w + 8, h + 8);
    cover.g.fillStyle = u.bg;
    cover.g.fillRect(0, 0, w + 8, h + 8);
    const block = canvas(w, h);
    blit(block.g, img, u.rect, 0, 0, W);
    setOverlay("macbook", a, { canvas: cover.c, rect: [x - 4, y - 4, w + 8, h + 8], ...common, alpha: 1 });
    setOverlay("macbook", b, { canvas: block.c, rect: u.rect, ...common, alpha: 0 });
    return {
      duration: 520,
      set(t) {
        const e = ease(t);
        updateOverlay("macbook", a, { alpha: t >= 1 ? 0 : 1 });
        updateOverlay("macbook", b, { alpha: t >= 1 ? 0 : e, dy: -14 * (1 - e) });
      },
    };
  }

  // approve: "Review" → "Approved ✓", row by row, then the toast
  const cells = u.cells;
  const top = cells[0][1];
  const bottom = cells[cells.length - 1][1] + cells[cells.length - 1][3];
  const cx = cells[0][0];
  const cw = cells[0][2];
  const col = canvas(cw, bottom - top);
  const toast = canvas(u.toast[2], u.toast[3]);
  drawToast(toast.g, u.toast);
  let lastKey = "";
  const drawCol = (t: number) => {
    const per = cells.map((_, k) => Math.max(0, Math.min(1, (t * 1.6 - k * 0.09) / 0.32)));
    const key = per.map((v) => v.toFixed(2)).join(",");
    if (key === lastKey) return false;
    lastKey = key;
    const g = col.g;
    g.clearRect(0, 0, cw, bottom - top);
    cells.forEach(([, cy, , ch], k) => {
      const p = per[k];
      const y0 = cy - top;
      g.fillStyle = "#ffffff";
      g.fillRect(0, y0 + 1, cw, ch - 2);
      const mid = y0 + ch / 2;
      const flip = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
      g.save();
      g.translate(0, mid);
      g.scale(1, Math.max(0.001, flip));
      if (p < 0.5) {
        g.font = `650 13px ${FONT}`;
        g.fillStyle = "#000";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("Review", cw / 2 + 0.5, 1);
      } else {
        const pw = 92;
        rr(g, (cw - pw) / 2, -13, pw, 26, 13);
        g.fillStyle = "#e7f9ef";
        g.fill();
        g.font = `600 12.5px ${FONT}`;
        g.fillStyle = "#148a49";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("✓ Approved", cw / 2, 1);
      }
      g.restore();
    });
    return true;
  };
  drawCol(0);
  setOverlay("macbook", a, { canvas: col.c, rect: [cx, top, cw, bottom - top], ...common, alpha: 0 });
  setOverlay("macbook", b, { canvas: toast.c, rect: u.toast, ...common, alpha: 0, dy: -18 });
  return {
    duration: 1900,
    set(t) {
      if (drawCol(t)) updateOverlay("macbook", a, { redraw: true });
      updateOverlay("macbook", a, { alpha: t > 0 ? 1 : 0 });
      const tt = ease((t - 0.62) / 0.38);
      updateOverlay("macbook", b, { alpha: tt, dy: -18 * (1 - tt) });
    },
  };
}

/** The payroll toast, in the app's toast style (top right, like the hero's clock-in toast). */
function drawToast(g: G, rect: Box) {
  const [, , W, H] = rect;
  const t = DAY_DATA.payroll;
  const x = 18,
    y = 14,
    w = W - 36,
    h = 66;
  g.clearRect(0, 0, W, H);
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

// ─── the press on the acting button ─────────────────────────────────────────
function buildPress(s: Script): Anim | null {
  if (s.dir !== "up" || !s.phone.tap) return null;
  const [x, y, w, h] = s.phone.tap;
  const pad = 2;
  const press = canvas(w + pad * 2, h + pad * 2, 3);
  press.g.fillStyle = "rgba(0, 0, 0, 0.32)";
  rr(press.g, pad, pad, w, h, Math.min(w, h) / 2);
  press.g.fill();
  setOverlay("iphone", 2, { canvas: press.c, rect: [x - pad, y - pad, w + pad * 2, h + pad * 2], screen: s.phone.before, scene: "day", alpha: 0 });
  return {
    duration: 420,
    set(t) {
      // down fast, back up slower; gone by the time the screen changes state
      const a = t < 0.25 ? t / 0.25 : Math.max(0, 1 - (t - 0.25) / 0.75);
      updateOverlay("iphone", 2, { alpha: t >= 1 ? 0 : a });
    },
  };
}

// ─── the controller ─────────────────────────────────────────────────────────

/**
 * Start the live layer: on every Stage frame, the current moment's and the next one's overlays are
 * set to where the clock (`time()`, ms of the film) has them. Returns a stop function.
 */
let building = 0;
/** Office updates still being built (captures wait for none). */
export const rideLifePending = () => building;

export function startRideLife(time: () => number, R: Ride = RIDE): () => void {
  let gone = false;
  type Track = { anim: Anim | null; last: number };
  const updates = new Map<number, Track>();
  let press: { i: number; anim: Anim | null; last: number } | null = null;

  const ensure = (i: number) => {
    if (i < 0 || i >= R.moments.length || updates.has(i)) return;
    const tr: Track = { anim: null, last: -1 };
    updates.set(i, tr);
    building++;
    buildUpdate(i, SCRIPT[i])
      .finally(() => building--)
      .then((a) => {
        if (gone || updates.get(i) !== tr) return;
        tr.anim = a;
      })
      .catch((e) => console.warn("[day] update overlay failed", MOMENTS[i].id, e));
  };
  // the current moment and the next one hold the two slot pairs; a moment that is past shows its
  // "after" state, which is the screen texture itself (no overlay), one that comes back is rebuilt
  const prune = (i: number) => {
    updates.forEach((_, k) => {
      if (k < i || k > i + 1) updates.delete(k);
    });
  };

  const off = onStageFrame(() => {
    const t = time();
    const i = momentAt(t, R);
    prune(i);
    ensure(i);
    ensure(i + 1);
    updates.forEach((tr, k) => {
      if (!tr.anim) return;
      const m = R.moments[k];
      const u = k > i ? 0 : Math.max(0, Math.min(1, (t - m.update[0]) / (m.update[1] - m.update[0])));
      if (u !== tr.last) {
        tr.last = u;
        tr.anim.set(u);
      }
    });
    // the press on the phone's button (field → office moments)
    const m = R.moments[i];
    if (m.up) {
      if (!press || press.i !== i) press = { i, anim: buildPress(SCRIPT[i]), last: -1 };
      const p = Math.max(0, Math.min(1, (t - m.tap) / 420));
      if (press.anim && p !== press.last) {
        press.last = p;
        press.anim.set(p);
      }
    } else if (press) {
      setOverlay("iphone", 2, null);
      press = null;
    }
    return false;
  });

  return () => {
    gone = true;
    off();
    for (const s of [2, 3, 4, 5] as const) setOverlay("macbook", s, null);
    setOverlay("iphone", 2, null);
  };
}
