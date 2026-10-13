// The hero's hook, readable: two live cards on the laptop, the clock-in toast ("Marcus Bell
// clocked in · 6:42 AM") and the job's profit ticking up by the day's take. They're crisp DOM in
// the app's own toast style (the same classes as the intro's notifications in index.html, so the
// intro can hand its notifications over pixel for pixel), placed on the laptop's screen on every
// frame the Stage draws (onStageFrame → project), so they ride the float and the cursor's
// look-around with it. Without 3D (poster still, WebGL off, the stage still loading) they sit
// where the still's laptop is.

import { HERO2 } from "../../content/copy";
import { anchorRect, onStageFrame, onStatus, phone, pulse, reducedMotion, status, type Rect } from "../../three/stage/store";

export type CardId = "toast" | "profit";

/** The hero frame (device units) the poses and the poster use: keep in one place. */
export const HERO_FRAME: [number, number] = phone ? [4.6, 3.05] : [4.5, 3.2];

/** Spots on the laptop's web screen (native px, 1440 × 900): the app's toast corner (top right,
 * under its top bar) and the profit number on web-project-detail ("$57,731.75"). */
const SPOT: Record<CardId, [number, number]> = { toast: [1424, 74], profit: [690, 428] };

/** Each card's top-left corner relative to its spot, CSS px. The toast hangs off the screen's
 * top-right corner; the profit card sits under the number, a short leader up to it. */
const PLACE: Record<CardId, { x: number; y: number }> = phone
  ? { toast: { x: -262, y: -40 }, profit: { x: -150, y: 64 } }
  : { toast: { x: -262, y: -30 }, profit: { x: -250, y: 92 } };

/** Where the spots are on the poster still, in frame units from the anchor's centre (measured
 * from the Stage at rest with reduced motion; scratchpad design/v2/r2-intro2/spots.cjs, `__heroSpots()` in dev). */
const STILL: Record<CardId, [number, number]> = phone
  ? { toast: [1.371, -1.094], profit: [-0.081, -0.501] }
  : { toast: [1.344, -1.063], profit: [-0.132, -0.514] };

type Els = {
  layer: HTMLElement;
  toast: HTMLElement;
  profit: HTMLElement;
  value: HTMLElement;
  leader: SVGSVGElement | null;
};

let els: Els | null = null;
const shown: Record<CardId, boolean> = { toast: false, profit: false };
const anchor: Rect = { x: 0, y: 0, w: 0, h: 0 };
let lastTracked = 0;
/** 0 = the still's layout, 1 = following the 3D laptop (ramps up once the devices have settled). */
let follow = 0;
let readySince = 0;
let onProfit: ((v: number, flash: number) => void) | null = null;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// one formatter (toLocaleString builds a new one per call: costly at 60 fps on a phone)
const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money = (n: number) => "$" + fmt.format(n);

/** The in-screen profit number (screenLife) follows the card's. */
export function onProfitValue(fn: ((v: number, flash: number) => void) | null) {
  onProfit = fn;
}

/** Place the cards for spots given in viewport px (or null: use the still's spots). */
function place(spots: Record<CardId, { x: number; y: number }> | null, sy: number) {
  if (!els) return;
  if (!anchorRect("hero", sy, anchor) || !anchor.w) return;
  const k = Math.min(anchor.w / HERO_FRAME[0], anchor.h / HERO_FRAME[1]);
  const cx = anchor.x + anchor.w / 2;
  const cy = anchor.y + anchor.h / 2;
  const pts: Record<CardId, { x: number; y: number }> = {
    toast: { x: cx + STILL.toast[0] * k, y: cy + STILL.toast[1] * k },
    profit: { x: cx + STILL.profit[0] * k, y: cy + STILL.profit[1] * k },
  };
  // the 3D takes over from the still gradually (never a jump when it arrives)
  if (spots && follow > 0)
    for (const id of ["toast", "profit"] as const) {
      pts[id].x += (spots[id].x - pts[id].x) * follow;
      pts[id].y += (spots[id].y - pts[id].y) * follow;
    }
  for (const id of ["toast", "profit"] as const) {
    const el = els[id];
    const x = pts[id].x - anchor.x + PLACE[id].x;
    const y = pts[id].y - anchor.y + PLACE[id].y;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }
  // the leader: from the number on the screen to the card's top edge
  if (els.leader) {
    const sx = pts.profit.x - anchor.x;
    const syy = pts.profit.y - anchor.y;
    const line = els.leader.querySelector("line");
    const dot = els.leader.querySelector("circle");
    line?.setAttribute("x1", sx.toFixed(1));
    line?.setAttribute("y1", syy.toFixed(1));
    line?.setAttribute("x2", sx.toFixed(1));
    line?.setAttribute("y2", (syy + PLACE.profit.y).toFixed(1));
    dot?.setAttribute("cx", sx.toFixed(1));
    dot?.setAttribute("cy", syy.toFixed(1));
  }
  // the cards belong to the hero's moment: they fade as the page starts to scroll
  els.layer.style.opacity = String(clamp01(1 - (sy - 24) / 150));
}

/** The card's box in the viewport (the intro glides its notification onto it). */
export function cardTarget(id: CardId): DOMRect | null {
  const el = els?.[id];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width ? r : null;
}

function show(id: CardId, how: "land" | "pop" | "still") {
  const el = els?.[id];
  if (!el || shown[id]) return;
  shown[id] = true;
  el.classList.add("is-in", `is-${how}`);
  if (id === "profit") tick(how === "still" ? -1 : how === "land" ? 120 : 160);
}

/** The intro landed its notification here: show the card in the same frame. */
export function landCard(id: CardId) {
  show(id, "land");
}

let tickRaf = 0;
function tick(delay: number) {
  const { from, to } = HERO2.profit;
  const set = (v: number, flash: number) => {
    if (els) els.value.textContent = money(v);
    onProfit?.(v, flash);
  };
  cancelAnimationFrame(tickRaf);
  if (delay < 0 || reducedMotion) return set(to, 0);
  set(from, 0);
  const t0 = performance.now() + delay;
  const D = 1500;
  let flashed = false;
  const step = () => {
    const t = clamp01((performance.now() - t0) / D);
    const e = 1 - Math.pow(1 - t, 3);
    set(Math.round((from + (to - from) * e) * 100) / 100, t > 0 && t < 1 ? 1 : 0);
    if (t >= 1 && !flashed) {
      flashed = true;
      els?.profit.classList.add("is-up");
      window.setTimeout(() => els?.profit.classList.remove("is-up"), 1400);
    }
    if (t < 1) tickRaf = requestAnimationFrame(step);
  };
  tickRaf = requestAnimationFrame(step);
}

const timers: number[] = [];
const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

/**
 * The cards' own entrance (no intro, or the intro was skipped before its notifications were up):
 * the phone sends the clock-in to the laptop (the orange pulse), the toast lands, then the
 * profit card comes in and ticks. Within ~1 s of the devices arriving (BRIEF flow 2).
 */
function entrance(quick: boolean) {
  if (reducedMotion) {
    show("toast", "still");
    show("profit", "still");
    return;
  }
  const run = () => {
    const wait = quick ? 0 : Math.max(0, status.revealAt + 420 - performance.now());
    if (!shown.toast) {
      if (status.webgl) later(wait, () => pulse("iphone", "macbook", { duration: 640, fromPx: [201, 600], toPx: [SPOT.toast[0] - 120, SPOT.toast[1] + 40] }));
      later(wait + 600, () => show("toast", "pop"));
    }
    if (!shown.profit) later(wait + (shown.toast ? 150 : 900), () => show("profit", "pop"));
  };
  if (status.revealed || quick) run();
  else {
    const off = onStatus(() => {
      if (status.revealed) {
        off();
        run();
      }
    });
    stops.push(off);
  }
}
const stops: (() => void)[] = [];

/** The intro is over: any card it didn't hand over comes in on its own. */
export function introFinished() {
  entrance(true);
}

/**
 * Mount the cards (Hero calls this with its elements). `fromIntro`: the intro will hand its
 * notifications over (landCard), then call introFinished(). Returns a cleanup.
 */
export function mountCards(e: Els, fromIntro: boolean) {
  els = e;
  follow = reducedMotion ? 1 : 0;
  readySince = 0;
  if (import.meta.env.DEV) (window as unknown as { __heroSpots: typeof measureSpots }).__heroSpots = measureSpots;
  shown.toast = shown.profit = false;
  e.value.textContent = money(HERO2.profit.from);

  // every frame the Stage draws: put the cards on the laptop as it is drawn
  const offFrame = onStageFrame((f) => {
    if (document.documentElement.classList.contains("hero-hold")) return; // the still stands in
    const sy = window.scrollY;
    if (sy > f.h * 1.5) return;
    const t = f.project("macbook", SPOT.toast[0], SPOT.toast[1]);
    const p = f.project("macbook", SPOT.profit[0], SPOT.profit[1]);
    if (!t || !p) return;
    const now = performance.now();
    lastTracked = now;
    // follow the laptop only once its entrance has settled (a late 3D rises in behind the
    // still; the cards stay put until it's there), easing over from the still's spots
    if (status.ready && !readySince) readySince = now;
    const settled = status.ready && now - readySince > 900 && now - status.revealAt > 1000;
    let busy = false;
    if (settled && follow < 1) {
      follow = Math.min(1, follow + f.dt / 0.4);
      busy = true;
    }
    place({ toast: t, profit: p }, sy);
    return busy;
  });
  // no 3D frame lately (still loading, WebGL off, the still standing in): the still's layout
  let raf = 0;
  const still = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const hold = document.documentElement.classList.contains("hero-hold");
      if (hold || !status.ready || status.failed || !status.webgl || performance.now() - lastTracked > 400) place(null, window.scrollY);
    });
  };
  still();
  window.addEventListener("scroll", still, { passive: true });
  window.addEventListener("resize", still);
  const offStatus = onStatus(still);
  const poll = window.setInterval(still, 250);

  if (!fromIntro) entrance(false);

  return () => {
    offFrame();
    offStatus();
    window.removeEventListener("scroll", still);
    window.removeEventListener("resize", still);
    clearInterval(poll);
    cancelAnimationFrame(raf);
    cancelAnimationFrame(tickRaf);
    timers.forEach(clearTimeout);
    timers.length = 0;
    stops.forEach((f) => f());
    stops.length = 0;
    els = null;
  };
}

/**
 * PHONE MODE (no 3D): the cards sit on the hero's still (public/renders/phone-hero.webp), placed
 * by CSS (src/site/hero/hero-phone.css, from STILL_PCT); nothing tracks anything per frame. Same
 * entrance and intro hand-over (cardTarget / landCard / introFinished) as on desktop.
 */
export function mountStillCards(e: Omit<Els, "leader">, fromIntro: boolean) {
  els = { ...e, leader: null };
  shown.toast = shown.profit = false;
  e.value.textContent = money(HERO2.profit.from);
  if (!fromIntro) entrance(false);
  return () => {
    cancelAnimationFrame(tickRaf);
    timers.forEach(clearTimeout);
    timers.length = 0;
    stops.forEach((f) => f());
    stops.length = 0;
    els = null;
  };
}

/** Where the cards' spots are on the phone still, % of its box (from STILL, frame 4.6 × 3.05). */
export const STILL_PCT: Record<CardId, { x: number; y: number }> = {
  toast: { x: 50 + (1.371 / 4.6) * 100, y: 50 + (-1.093 / 3.05) * 100 },
  profit: { x: 50 + (-0.081 / 4.6) * 100, y: 50 + (-0.498 / 3.05) * 100 },
};

/** Dev: the spots relative to the anchor in frame units (to refresh STILL after a pose change). */
export function measureSpots(): Promise<Record<CardId, [number, number]> | null> {
  return new Promise((resolve) => {
    const off = onStageFrame((f) => {
      const t = f.project("macbook", SPOT.toast[0], SPOT.toast[1]);
      const p = f.project("macbook", SPOT.profit[0], SPOT.profit[1]);
      if (!t || !p || !anchorRect("hero", window.scrollY, anchor)) return true;
      off();
      const k = Math.min(anchor.w / HERO_FRAME[0], anchor.h / HERO_FRAME[1]);
      const cx = anchor.x + anchor.w / 2;
      const cy = anchor.y + anchor.h / 2;
      const r = (v: number) => Math.round(v * 1000) / 1000;
      resolve({ toast: [r((t.x - cx) / k), r((t.y - cy) / k)], profit: [r((p.x - cx) / k), r((p.y - cy) / k)] });
    });
  });
}
