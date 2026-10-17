// The fold's layout and entrance, round 4 (Andrew's doc: "make it a big headline… maybe a one
// second animation where it lands there"). Much smaller than the old fence engine (./fence/engine.ts,
// kept for the lab): no fence, no crew, no tag. Once the fonts are in it fits the headline to the
// screen, lays the topographic ground round the copy (./fence/topo.ts, built in slices), and plays
// a short entrance: the line above the headline, the headline (plain type, no sand pour), the sub,
// the button and the logos come up within about half a second, so the button is clickable at once.
//
// PHONE MODE: the same, with the phone's line breaks; transform and opacity only, no rAF.

import { markFirstScreenDone, markPageReady } from "../ready";
import { contoursSliced, type Rect, type TopoInput } from "./fence/topo";

const EO = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Headline size limits, px. */
const FS_MAX = { desk: 84, phone: 46 };
const FS_MIN = { desk: 34, phone: 26 };
/** The button counts as landed (READY) this long after the entrance starts. */
const CTA_LANDED = 420;

export function mountLanding(root: HTMLElement, opts: { phone: boolean; reduced: boolean }) {
  const { phone, reduced } = opts;
  let alive = true;
  let topoJob: { cancel: () => void } | null = null;
  const timers: number[] = [];
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s);

  /** Fit the headline: its widest line fills the column, within the size limits and the height. */
  function fit() {
    const h1 = q(".hf-h1");
    const lines = [...root.querySelectorAll<HTMLElement>(".hf-line-in")];
    if (!h1 || !lines.length) return;
    h1.style.setProperty("--fs", "100px");
    const widest = Math.max(...lines.map((l) => l.scrollWidth));
    const g = parseFloat(getComputedStyle(root).getPropertyValue("--g")) || 20;
    const avail = Math.min(root.clientWidth - g * 2, phone ? 9999 : 1240);
    let fs = (avail / widest) * 100 * 0.98;
    // desktop: the headline never takes more than ~44% of the screen's height
    if (!phone) fs = Math.min(fs, (root.clientHeight * 0.44) / (lines.length * 0.98));
    const lim = phone ? 0 : 1;
    fs = Math.max(lim ? FS_MIN.desk : FS_MIN.phone, Math.min(lim ? FS_MAX.desk : FS_MAX.phone, fs));
    h1.style.setProperty("--fs", `${fs.toFixed(1)}px`);
  }

  /** The ground: contour lines that treat the copy as a landform (nothing in it is crossed). */
  function ground() {
    const svg = q<SVGSVGElement>(".hf-ground svg");
    if (!svg) return;
    const R = root.getBoundingClientRect();
    const W = Math.round(R.width);
    const H = Math.round(R.height);
    const rel = (r: DOMRect) => ({ x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height });
    const textRects = (el: Element | null, pad: number): Rect[] => {
      if (!el) return [];
      const rg = document.createRange();
      rg.selectNodeContents(el);
      return [...rg.getClientRects()].map((r) => {
        const b = rel(r);
        return { x: b.x - pad, y: b.y - pad / 2, w: b.w + pad * 2, h: b.h + pad, r: 8 };
      });
    };
    const boxOf = (el: Element | null, pad: number, r = 14): Rect[] => {
      if (!el || !(el as HTMLElement).offsetParent) return [];
      const b = rel(el.getBoundingClientRect());
      return [{ x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2, r }];
    };
    const rects: Rect[] = [
      ...boxOf(document.querySelector(".site-logo"), 8),
      ...(!phone ? [...document.querySelectorAll(".site-nav a")].flatMap((a) => textRects(a, 6)) : []),
      ...textRects(q(".hf-eyebrow"), 8),
      ...[...root.querySelectorAll(".hf-line-in")].flatMap((l) => textRects(l, phone ? 6 : 10)),
      ...textRects(q(".hf-sub"), 8),
      ...boxOf(q(".hf-cta-wrap"), 10, 22),
      ...textRects(q(".hf-demo"), 6),
      ...boxOf(q(".hf-logos"), 6),
    ];
    const input: TopoInput = {
      W,
      H,
      step: 8,
      rects,
      blend: phone ? 40 : 70,
      first: phone ? 14 : 18,
      falloff: phone ? 80 : 115,
      amp: phone ? 2.2 : 2.6,
      wobble: 0.12,
      scale: phone ? 210 : 320,
      seed: 11,
      major: 4,
      levels: phone ? 12 : 15,
      tilt: [1.2, -0.8],
      eps: phone ? 1.1 : 1.0,
    };
    svg.setAttribute("width", String(W));
    svg.setAttribute("height", String(H));
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    topoJob?.cancel();
    const job = contoursSliced(input);
    topoJob = job;
    void job.done.then((t) => {
      if (!alive || topoJob !== job) return;
      const first = svg.querySelector(".mi")!.getAttribute("d") === null;
      svg.querySelector(".mi")!.setAttribute("d", t.minor);
      svg.querySelector(".ma")!.setAttribute("d", t.major);
      if (first && !reduced) svg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: "ease-out" });
    });
  }

  function layout() {
    fit();
    ground();
  }

  /** The entrance: the fold comes up once, top to bottom. */
  function enter() {
    const up = (el: Element | null, at: number, dur = 520, dy = 10) => {
      if (!el || reduced) return;
      el.animate(
        [
          { opacity: 0, transform: `translateY(${dy}px)` },
          { opacity: 1, transform: "none" },
        ],
        { delay: at, duration: dur, easing: EO, fill: "backwards" },
      );
    };
    up(q(".hf-eyebrow"), 60, 520, 6);
    up(q(".hf-h1"), 100, 560, 8);
    up(q(".hf-sub"), 160);
    up(q(".hf-act"), 240);
    up(q(".hf-foot"), 380, 600, 6);
    timers.push(window.setTimeout(markPageReady, reduced ? 0 : CTA_LANDED));
    timers.push(window.setTimeout(markFirstScreenDone, reduced ? 0 : 900));
  }

  const start = async () => {
    try {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
    } catch {
      /* lay out anyway */
    }
    if (!alive) return;
    layout();
    root.classList.add("is-laid");
    root.querySelectorAll(".hf-line").forEach((l) => l.classList.add("is-set"));
    enter();
  };
  void start();

  // a resize re-fits the headline and re-lays the ground
  let rt = 0;
  let lastW = root.clientWidth;
  let lastH = root.clientHeight;
  const ro = new ResizeObserver(() => {
    const w = root.clientWidth;
    const h = root.clientHeight;
    // phones: the browser bar coming and going changes the height only; ignore that
    if (w === lastW && (phone || Math.abs(h - lastH) < 2)) return;
    lastW = w;
    lastH = h;
    clearTimeout(rt);
    rt = window.setTimeout(() => alive && root.classList.contains("is-laid") && layout(), 120);
  });
  ro.observe(root);

  return () => {
    alive = false;
    ro.disconnect();
    clearTimeout(rt);
    timers.forEach((t) => clearTimeout(t));
    topoJob?.cancel();
  };
}
