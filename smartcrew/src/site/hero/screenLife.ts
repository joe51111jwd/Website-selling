// The hero laptop's live moment: a phone → laptop pulse, then a toast slides in on the office
// screen ("Marcus Bell clocked in · 6:42 AM · Hwy 9 Culvert") and the job's profit ticks up.
// Both are small canvases drawn in the app's own type (Inter) and placed on the screen texture
// in its native px, so they read as part of the UI, not a sticker on top.

import interUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { HERO } from "../../content/copy";
import { onStatus, pulse, reducedMotion, setOverlay, status, updateOverlay } from "../../three/stage/store";
import type { Box } from "../../three/stage/types";

const SCALE = 2; // canvas px per native px (the web screens are shot at 2x)
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

function canvasFor(rect: Box) {
  const c = document.createElement("canvas");
  c.width = Math.round(rect[2] * SCALE);
  c.height = Math.round(rect[3] * SCALE);
  const g = c.getContext("2d")!;
  g.scale(SCALE, SCALE);
  return { c, g };
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

// Toast: top right of the web app, under its top bar.
const TOAST_RECT: Box = [1018, 70, 404, 100];

function drawToast(g: CanvasRenderingContext2D) {
  const [, , W, H] = TOAST_RECT;
  g.clearRect(0, 0, W, H);
  const x = 18,
    y = 14,
    w = W - 36,
    h = 66;
  g.save();
  g.shadowColor = "rgba(17, 17, 17, 0.16)";
  g.shadowBlur = 22;
  g.shadowOffsetY = 8;
  g.fillStyle = "#fff";
  roundRect(g, x, y, w, h, 14);
  g.fill();
  g.restore();
  g.strokeStyle = "#e6e6e6";
  g.lineWidth = 1;
  roundRect(g, x + 0.5, y + 0.5, w - 1, h - 1, 14);
  g.stroke();
  // avatar with initials, like the dashboard's rows
  const cx = x + 34,
    cy = y + h / 2;
  g.fillStyle = "#f2f2f2";
  g.beginPath();
  g.arc(cx, cy, 18, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#3b3b3b";
  g.font = `600 13px ${FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("MB", cx, cy + 0.5);
  // the green "clocked in" dot
  g.fillStyle = "#fff";
  g.beginPath();
  g.arc(cx + 13, cy + 13, 6.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#22a559";
  g.beginPath();
  g.arc(cx + 13, cy + 13, 4.5, 0, Math.PI * 2);
  g.fill();
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  g.fillStyle = "#111";
  g.font = `600 15px ${FONT}`;
  g.fillText(HERO.toast.title, x + 64, y + 29);
  g.fillStyle = "#6b6b6b";
  g.font = `450 13px ${FONT}`;
  g.fillText(HERO.toast.meta, x + 64, y + 49);
  g.fillStyle = "#9a9a9a";
  g.font = `450 12px ${FONT}`;
  g.textAlign = "right";
  g.fillText("now", x + w - 16, y + 29);
}

// Profit card on web-project-detail: "$57,731.75" sits at x 627.3, y 416.5 (22 px line box),
// Inter 16/570, -0.08px tracking, on the card's #f5f5f5.
const PROFIT_RECT: Box = [622, 411, 150, 32];
const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function drawProfit(g: CanvasRenderingContext2D, v: number, flash: number) {
  const [, , W, H] = PROFIT_RECT;
  g.clearRect(0, 0, W, H);
  g.fillStyle = "#f5f5f5";
  g.fillRect(0, 0, W, H);
  g.fillStyle = flash > 0 ? `rgb(${Math.round(0 + 31 * flash)}, ${Math.round(0 + 157 * flash)}, ${Math.round(0 + 85 * flash)})` : "#000";
  g.font = `570 16px ${FONT}`;
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "-0.08px";
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  g.fillText(money(v), 627.3 - PROFIT_RECT[0], 416.5 + 16.8 - PROFIT_RECT[1]);
}

/**
 * Run the hero's live moment on the laptop (screen id = the laptop's hero screen). Starts when the
 * Stage reveals the devices; returns a cleanup.
 */
export function runHeroLife(laptop: string) {
  let raf = 0;
  let gone = false;
  const toast = canvasFor(TOAST_RECT);
  const profit = canvasFor(PROFIT_RECT);
  const withProfit = laptop === "web-project-detail";

  const start = async () => {
    await loadInter();
    if (gone) return;
    drawToast(toast.g);
    setOverlay("macbook", 0, { canvas: toast.c, rect: TOAST_RECT, screen: laptop, scene: "top", alpha: reducedMotion ? 1 : 0, dy: reducedMotion ? 0 : -18 });
    if (withProfit) {
      drawProfit(profit.g, HERO.profitFrom, 0);
      setOverlay("macbook", 1, { canvas: profit.c, rect: PROFIT_RECT, screen: laptop, scene: "top", alpha: 1 });
    }
    if (reducedMotion) {
      if (withProfit) {
        drawProfit(profit.g, HERO.profitTo, 0);
        updateOverlay("macbook", 1, { redraw: true });
      }
      return;
    }
    const t0 = Math.max(performance.now(), status.revealAt + 700);
    let pulsed = false;
    let lastV = -1;
    const tick = () => {
      if (gone) return;
      const t = performance.now() - t0;
      if (!pulsed && t >= 0) {
        pulsed = true;
        pulse("iphone", "macbook", { duration: 950, fromPx: [201, 480], toPx: [TOAST_RECT[0] + 90, TOAST_RECT[1] + 47] });
      }
      // toast slides down as the pulse lands
      const tt = Math.min(1, Math.max(0, (t - 820) / 420));
      const e = 1 - Math.pow(1 - tt, 3);
      updateOverlay("macbook", 0, { alpha: e, dy: -18 * (1 - e) });
      // then the job's profit counts up
      if (withProfit) {
        const tp = Math.min(1, Math.max(0, (t - 1250) / 1700));
        const ep = 1 - Math.pow(1 - tp, 3);
        const v = Math.round((HERO.profitFrom + (HERO.profitTo - HERO.profitFrom) * ep) * 100) / 100;
        const flash = tp >= 1 ? Math.max(0, 1 - (t - 2950) / 900) : tp > 0 ? 1 : 0;
        const key = v * 10 + Math.round(flash * 8);
        if (key !== lastV) {
          lastV = key;
          drawProfit(profit.g, v, flash);
          updateOverlay("macbook", 1, { redraw: true });
        }
      }
      if (t < 4200) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  let off = () => {};
  if (status.revealed || reducedMotion) start();
  else
    off = onStatus(() => {
      if (status.revealed) {
        off();
        start();
      }
    });

  return () => {
    gone = true;
    off();
    cancelAnimationFrame(raf);
    setOverlay("macbook", 0, null);
    setOverlay("macbook", 1, null);
  };
}
