// The headline is backfilled: the letters start empty (nothing on screen), dirt pours down from
// the top of the screen into them, and the soil rises in each letter until the words are made of
// dirt (fence.css: the soil layer inside the letters, one CSS animation per line).
//
// This file is the falling dirt: a canvas over the hero, grains dropped above the letters of the
// line that is filling, falling under gravity and vanishing as they land on that line's soil
// surface. It follows each line's own CSS animation (its eased progress), so the grains and the
// rising soil never drift apart. It runs only while something is pouring, then removes itself.

type Grain = { x: number; y: number; vy: number; s: number; c: string; line: number };
type LineInfo = { el: HTMLElement; anim: Animation | null; top: number; bottom: number; chars: DOMRect[] };

const SHADES = ["#2a1f16", "#3b2c20", "#1c1510", "#4a3726", "#241b14", "#5a4430"];
const CLAY = ["#b84f00", "#d76b22", "#9c4200", "#c25a12"];

export function startPour(root: HTMLElement, opts: { phone: boolean }) {
  const lines = [...root.querySelectorAll<HTMLElement>(".hf-line-in")];
  if (!lines.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const cv = document.createElement("canvas");
  cv.className = "hf-pour";
  cv.setAttribute("aria-hidden", "true");
  root.appendChild(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) {
    cv.remove();
    return () => {};
  }

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 0;
  let H = 0;
  let info: LineInfo[] = [];

  const measure = () => {
    const rr = root.getBoundingClientRect();
    W = rr.width;
    H = rr.height;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    info = lines.map((el) => {
      const r = el.getBoundingClientRect();
      const chars: DOMRect[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = n.textContent ?? "";
        for (let i = 0; i < t.length; i++) {
          if (!t[i].trim()) continue;
          range.setStart(n, i);
          range.setEnd(n, i + 1);
          const b = range.getBoundingClientRect();
          if (b.width > 0) chars.push(new DOMRect(b.left - rr.left, b.top - rr.top, b.width, b.height));
        }
      }
      const anim = el.getAnimations().find((a) => (a as CSSAnimation).animationName === "hf-backfill") ?? null;
      // the soil fills the glyph box (ascender line to the baseline area)
      return { el, anim, top: r.top - rr.top + r.height * 0.12, bottom: r.top - rr.top + r.height * 0.86, chars };
    });
  };
  measure();

  const grains: Grain[] = [];
  const perFrame = opts.phone ? 3 : 7;
  const cap = opts.phone ? 160 : 420;
  const fenced = (el: HTMLElement, x: number, y: number) => {
    const f = el.querySelector(".hf-fenced");
    if (!f) return false;
    const r = f.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    return x >= r.left - rr.left && x <= r.right - rr.left && y >= r.top - rr.top - 400;
  };

  let raf = 0;
  let last = performance.now();
  let started = false;
  let measuredAt = 0;
  const tick = (now: number) => {
    // the headline sizes itself to the screen once the fonts are in: keep the letters' boxes fresh
    if (now - measuredAt > 350) {
      measuredAt = now;
      measure();
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let active = false;

    info.forEach((li, idx) => {
      const p = li.anim?.effect?.getComputedTiming().progress;
      const prog = typeof p === "number" ? p : null;
      const playing = li.anim && li.anim.playState === "running" && prog !== null && prog < 0.995;
      // pour slightly ahead of the fill (grains take time to fall), stop just before it's full
      const t = li.anim?.currentTime;
      const delay = (li.anim?.effect?.getTiming().delay as number) ?? 0;
      const lead = typeof t === "number" && t > delay - 700 && (prog === null || prog < 0.93);
      if (playing || lead) active = true;
      if (!lead || grains.length > cap || !li.chars.length) return;
      for (let k = 0; k < perFrame; k++) {
        const c = li.chars[(Math.random() * li.chars.length) | 0];
        const x = c.x + c.width * (0.15 + Math.random() * 0.7);
        const clay = fenced(li.el, x, li.top);
        const pal = clay ? CLAY : SHADES;
        grains.push({
          x,
          y: -10 - Math.random() * 60,
          vy: 260 + Math.random() * 160,
          s: (opts.phone ? 1.4 : 1.8) + Math.random() * 2.2,
          c: pal[(Math.random() * pal.length) | 0],
          line: idx,
        });
      }
    });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let i = grains.length - 1; i >= 0; i--) {
      const g = grains[i];
      g.vy += 1900 * dt;
      g.y += g.vy * dt;
      g.x += (Math.random() - 0.5) * 0.6;
      const li = info[g.line];
      const p = li.anim?.effect?.getComputedTiming().progress;
      const prog = typeof p === "number" ? p : 0;
      const surface = li.bottom - (li.bottom - li.top) * prog;
      if (g.y >= surface) {
        grains.splice(i, 1);
        continue;
      }
      ctx.fillStyle = g.c;
      ctx.fillRect(g.x, g.y, g.s, g.s * (1 + Math.min(2.5, g.vy / 900)));
    }
    if (grains.length) active = true;

    if (active || !started) {
      started = true;
      raf = requestAnimationFrame(tick);
    } else stop();
  };

  const onResize = () => measure();
  window.addEventListener("resize", onResize);
  const stop = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    cv.remove();
  };
  // wait a frame so the line animations exist and the fonts have set the glyph boxes
  raf = requestAnimationFrame(() => {
    measure();
    last = performance.now();
    raf = requestAnimationFrame(tick);
  });
  return stop;
}
