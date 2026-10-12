// Two beats of One Day that the recreated screens don't have on their own, drawn in the app's
// own type (Inter) on top of the real screen images and handed to the Stage as live screens:
//  · 5:30 PM: Monday's job arrives on the crew's phone as a sheet over the home screen (the
//    same sheet the app uses for "Select task and project").
//  · Friday: the office's timecards get a toast, "Payroll hours ready for QuickBooks".
// Each is drawn once (no per-frame redraw); the Stage crossfades to it like any other screen.
// Live screens rather than overlays, so the hero's (macbook) and Try it's overlay slots stay free.

import interUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { DAY_UI } from "../../content/copy";
import { phone, registerLiveScreen, updateLiveScreen } from "../../three/stage/store";
import type { Box } from "../../three/stage/types";

export const PLAN_SCREEN = "live:day-plan";
export const PAYROLL_SCREEN = "live:day-payroll";

// native px (phone 402×874, web 1440×900)
const SHEET_TOP = 470;
const CARD: Box = [16, 556, 370, 184];
export const PLAN_SHEET_RING: Box = CARD;
const TOAST: Box = [1036, 84, 368, 66];
export const PAYROLL_TOAST_RING: Box = TOAST;

const FONT = '"SC Inter", "Inter Variable", Inter, system-ui, sans-serif';

let fontReady: Promise<void> | null = null;
function loadInter() {
  if (!fontReady) {
    const f = new FontFace("SC Inter", `url(${interUrl}) format("woff2")`, { weight: "100 900" });
    fontReady = f
      .load()
      .then((ff) => void document.fonts.add(ff))
      .catch(() => {});
  }
  return fontReady;
}

async function loadImage(url: string): Promise<CanvasImageSource> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const blob = await res.blob();
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob);
    } catch {
      /* fall through */
    }
  }
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  await img.decode();
  return img;
}

const screenUrl = (id: string) => `${import.meta.env.BASE_URL}screens/${id}.webp`;

/** The image the cursor's loupe shows for a live screen (a blob of the drawn canvas). */
const liveSrc = new Map<string, string>();
export const loupeSrcFor = (screen: string | null) =>
  !screen ? "" : screen.startsWith("live:") ? (liveSrc.get(screen) ?? "") : `${import.meta.env.BASE_URL}screens/${screen}.webp`;

type G = CanvasRenderingContext2D & { letterSpacing?: string };

function rr(g: G, x: number, y: number, w: number, h: number, r: number | number[]) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

function text(g: G, s: string, x: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = "left") {
  g.font = `${weight} ${size}px ${FONT}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = "alphabetic";
  g.letterSpacing = size >= 17 ? "-0.2px" : "0px";
  g.fillText(s, x, y);
}

/** 5:30 PM: the phone's home screen, dimmed, with Monday's job in a bottom sheet. */
function drawPlan(g: G, base: CanvasImageSource) {
  const W = 402,
    H = 874;
  g.drawImage(base, 0, 0, W, H);
  g.fillStyle = "rgba(0, 0, 0, 0.4)";
  g.fillRect(0, 0, W, H);
  // the sheet
  g.save();
  g.shadowColor = "rgba(0, 0, 0, 0.18)";
  g.shadowBlur = 30;
  g.fillStyle = "#fff";
  rr(g, 0, SHEET_TOP, W, H - SHEET_TOP + 40, [26, 26, 0, 0]);
  g.fill();
  g.restore();
  const s = DAY_UI.planSheet;
  // calendar glyph, drawn like the app's line icons
  g.strokeStyle = "#111";
  g.lineWidth = 1.7;
  g.lineJoin = "round";
  rr(g, 22, 497, 18, 17, 3.5);
  g.stroke();
  g.beginPath();
  g.moveTo(22, 503);
  g.lineTo(40, 503);
  g.moveTo(27, 494);
  g.lineTo(27, 499);
  g.moveTo(35, 494);
  g.lineTo(35, 499);
  g.stroke();
  text(g, s.title, 50, 513, 19, 650, "#111");
  text(g, s.sub, 22, 538, 14, 450, "#6b6b6b");
  // close (×), like the task sheet
  g.strokeStyle = "#6b6b6b";
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(371, 500);
  g.lineTo(381, 510);
  g.moveTo(381, 500);
  g.lineTo(371, 510);
  g.stroke();
  // the job, as label / value rows on a grey card
  const [cx, cy, cw, ch] = CARD;
  g.fillStyle = "#f5f5f5";
  rr(g, cx, cy, cw, ch, 16);
  g.fill();
  const rowH = ch / s.rows.length;
  s.rows.forEach(([k, v], r) => {
    const y = cy + rowH * r;
    if (r > 0) {
      g.fillStyle = "#e6e6e6";
      g.fillRect(cx + 14, y, cw - 28, 1);
    }
    text(g, k, cx + 16, y + rowH / 2 + 5, 13.5, 450, "#6b6b6b");
    text(g, v, cx + cw - 16, y + rowH / 2 + 5, 14.5, 560, "#111", "right");
  });
  // the button, like "Start"
  g.fillStyle = "#1a1a1a";
  rr(g, 16, 768, 370, 50, 25);
  g.fill();
  text(g, s.done, W / 2, 799, 16, 600, "#fff", "center");
  // home indicator
  g.fillStyle = "#111";
  rr(g, W / 2 - 67, 858, 134, 5, 3);
  g.fill();
}

/** Friday: the timecards screen with a toast top right, like the hero's clock-in toast. */
function drawPayroll(g: G, base: CanvasImageSource) {
  g.drawImage(base, 0, 0, 1440, 900);
  const [x, y, w, h] = TOAST;
  const t = DAY_UI.payrollToast;
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
  // a green check in a soft disc
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
  text(g, t.title, x + 64, y + 29, 15, 600, "#111");
  text(g, t.meta, x + 64, y + 49, 13, 450, "#6b6b6b");
  text(g, t.time, x + w - 16, y + 29, 12, 450, "#9a9a9a", "right");
}

type Job = { name: string; screen: string; base: string; w: number; h: number; scale: number; draw: (g: G, img: CanvasImageSource) => void };

const JOBS: Job[] = [
  // the phone screen is shown large on phones too, but never larger than ~2x there
  { name: "day-plan", screen: PLAN_SCREEN, base: "phone-home", w: 402, h: 874, scale: phone ? 2 : 3, draw: drawPlan },
  // web screens on phones are kept at 1920 wide by the Stage; match it
  { name: "day-payroll", screen: PAYROLL_SCREEN, base: "web-timecards", w: 1440, h: 900, scale: phone ? 4 / 3 : 2, draw: drawPayroll },
];

let started = false;
/** Draw both live screens once and hand them to the Stage. Safe to call more than once. */
export function startDayLife() {
  if (started) return () => {};
  started = true;
  const offs: (() => void)[] = [];
  let gone = false;
  (async () => {
    await loadInter();
    for (const j of JOBS) {
      if (gone) return;
      try {
        const img = await loadImage(screenUrl(j.base));
        const c = document.createElement("canvas");
        c.width = Math.round(j.w * j.scale);
        c.height = Math.round(j.h * j.scale);
        const g = c.getContext("2d") as G;
        g.scale(j.scale, j.scale);
        g.imageSmoothingQuality = "high";
        j.draw(g, img);
        if (gone) return;
        offs.push(registerLiveScreen(j.name, c, j.w, j.h));
        updateLiveScreen(j.name);
        c.toBlob((b) => b && liveSrc.set(j.screen, URL.createObjectURL(b)), "image/webp", 0.9);
      } catch (e) {
        console.warn("[day] live screen failed", j.name, e);
      }
    }
  })();
  return () => {
    gone = true;
    started = false;
    offs.forEach((f) => f());
    liveSrc.forEach((u) => URL.revokeObjectURL(u));
    liveSrc.clear();
  };
}
