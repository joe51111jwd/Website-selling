// The 3D phone's running timer. Once the visitor clocks in, the phone shows "phone-working"
// (a still of the app); these two small canvases sit on it in the app's own type and replace its
// frozen "02h 14m 36s" / "02h 32m 05s" with a timer that starts at the tap.
// Positions are the screen's native CSS px (402 × 874), measured on ?screen=phone-working.

import interUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { setOverlay, updateOverlay } from "../../three/stage/store";
import type { Box } from "../../three/stage/types";
import { timer } from "../../screens/kit/format";

const SCALE = 3; // phone screens are shot at 3x
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

// .pc-timer: dot at x 56.3 (6.5 px), text from x 71.8, 21px/600, -0.315px tracking, centred on
// y 345.8, on the task card's white
const TASK: Box = [52, 330, 300, 32];
// .pc-total-v: x 56.3, y 650.1, 13.5px/500, -0.135px tracking, line box 16 px, on white
const TOTAL: Box = [52, 646, 120, 24];

type Pad = { c: HTMLCanvasElement; g: CanvasRenderingContext2D; r: Box };
function pad(r: Box): Pad {
  const c = document.createElement("canvas");
  c.width = Math.round(r[2] * SCALE);
  c.height = Math.round(r[3] * SCALE);
  const g = c.getContext("2d")!;
  g.scale(SCALE, SCALE);
  return { c, g, r };
}

type G = CanvasRenderingContext2D & { letterSpacing?: string };

function drawTask(p: Pad, secs: number) {
  const g = p.g as G;
  const [x0, y0, w, h] = p.r;
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#fff";
  g.fillRect(0, 0, w, h);
  // the green "on the clock" dot
  g.fillStyle = "#24c56f";
  g.beginPath();
  g.arc(56.3 + 3.25 - x0, 345.8 - y0, 3.25, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#0a0a0a";
  g.font = `600 21px ${FONT}`;
  g.letterSpacing = "-0.315px";
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.fillText(timer(secs), 71.8 - x0, 345.8 + 0.6 - y0);
}

function drawTotal(p: Pad, secs: number) {
  const g = p.g as G;
  const [x0, y0, w, h] = p.r;
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#fff";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#111";
  g.font = `500 13.5px ${FONT}`;
  g.letterSpacing = "-0.135px";
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.fillText(timer(secs), 56.3 - x0, 650.1 + 8.4 - y0);
}

/** Put the running timer on the phone (scene "try", screen "phone-working"). Returns update + clear. */
export function startScreenTimer() {
  const task = pad(TASK);
  const total = pad(TOTAL);
  let alive = true;
  let last = -1;
  const draw = (secs: number) => {
    if (!alive || secs === last) return;
    last = secs;
    drawTask(task, secs);
    drawTotal(total, secs);
    updateOverlay("iphone", 0, { redraw: true });
    updateOverlay("iphone", 1, { redraw: true });
  };
  drawTask(task, 0);
  drawTotal(total, 0);
  setOverlay("iphone", 0, { canvas: task.c, rect: TASK, screen: "phone-working", scene: "try" });
  setOverlay("iphone", 1, { canvas: total.c, rect: TOTAL, screen: "phone-working", scene: "try" });
  loadInter().then(() => {
    if (!alive) return;
    const s = Math.max(0, last);
    last = -1;
    draw(s);
  });
  return {
    draw,
    clear() {
      alive = false;
      setOverlay("iphone", 0, null);
      setOverlay("iphone", 1, null);
    },
  };
}
