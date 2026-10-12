// The laptop's own profit number keeps step with the hero's profit card (cards.ts): a small
// canvas drawn in the app's type (Inter) over "$57,731.75" on web-project-detail, so the number
// the card's leader points at is the number the card shows. (The clock-in toast is DOM now, in
// cards.ts: on the screen texture it was too small to read.)

import interUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { reducedMotion, setOverlay, updateOverlay } from "../../three/stage/store";
import type { Box } from "../../three/stage/types";
import { HERO2 } from "../../content/copy";
import { money, onProfitValue } from "./cards";

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

// Profit card on web-project-detail: "$57,731.75" sits at x 627.3, y 416.5 (22 px line box),
// Inter 16/570, -0.08px tracking, on the card's #f5f5f5.
const PROFIT_RECT: Box = [622, 411, 150, 32];

function drawProfit(g: CanvasRenderingContext2D, v: number, flash: number) {
  const [, , W, H] = PROFIT_RECT;
  g.clearRect(0, 0, W, H);
  g.fillStyle = "#f5f5f5";
  g.fillRect(0, 0, W, H);
  g.fillStyle = flash > 0 ? "#1f9d55" : "#000";
  g.font = `570 16px ${FONT}`;
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "-0.08px";
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  g.fillText(money(v), 627.3 - PROFIT_RECT[0], 416.5 + 16.8 - PROFIT_RECT[1]);
}

/** Run the in-screen profit number for the hero's laptop screen; returns a cleanup. */
export function runHeroLife(laptop: string) {
  if (laptop !== "web-project-detail") return () => {};
  let gone = false;
  const c = document.createElement("canvas");
  c.width = PROFIT_RECT[2] * SCALE;
  c.height = PROFIT_RECT[3] * SCALE;
  const g = c.getContext("2d")!;
  g.scale(SCALE, SCALE);
  let last = "";
  const draw = (v: number, flash: number) => {
    const key = `${v.toFixed(2)}:${flash ? 1 : 0}`;
    if (gone || key === last) return;
    last = key;
    drawProfit(g, v, flash);
    updateOverlay("macbook", 1, { redraw: true });
  };
  loadInter().then(() => {
    if (gone) return;
    drawProfit(g, reducedMotion ? HERO2.profit.to : HERO2.profit.from, 0);
    setOverlay("macbook", 1, { canvas: c, rect: PROFIT_RECT, screen: laptop, scene: "top", alpha: 1 });
    onProfitValue(draw);
  });
  return () => {
    gone = true;
    onProfitValue(null);
    setOverlay("macbook", 1, null);
  };
}
