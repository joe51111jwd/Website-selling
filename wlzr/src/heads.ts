// The players: one head per app, each wearing the device that is its interface. The device screens are
// live HTML laid onto the render's screen with a projective transform (quad.ts); the render's screen is a
// transparent hole, so the bezel frames the HTML. Heads are dragged anywhere on their visible pixels
// (an alpha test, not a box), tossed a little when let go, raised when touched, closed from their bar.

import heads from "../public/heads/heads.json";
import { PRODUCTS, RECORD, SHOWS, TRACKS, VIDEOS } from "./data";
import { productArt } from "./merch-art";
import { quadMatrix, quadSize } from "./quad";
import { radio } from "./radio";
import { raise } from "./z";
import { openMerch, openTour, openVideo } from "./apps";

export type HeadId = "video" | "music" | "merch" | "tour";
type HeadData = (typeof heads)[HeadId];

const LABEL: Record<HeadId, string> = { video: "VIDEOS.EXE", music: "RADIO.EXE", merch: "MERCH.EXE", tour: "TOUR.EXE" };
// where each head lands (centre, as a fraction of the desktop), and its lean
const SLOT: Record<HeadId, { d: [number, number]; m: [number, number]; r: number }> = {
  tour: { d: [0.23, 0.46], m: [0.46, 0.36], r: -4 },
  music: { d: [0.46, 0.38], m: [0.52, 0.32], r: 3 },
  merch: { d: [0.68, 0.5], m: [0.5, 0.52], r: 5 },
  video: { d: [0.33, 0.68], m: [0.5, 0.64], r: -3 },
};

const live = new Map<HeadId, Head>();
const listeners = new Set<() => void>();
export const onHeads = (f: () => void) => listeners.add(f);
const changed = () => listeners.forEach((f) => f());
export const isOpen = (id: HeadId) => live.has(id);

const mobile = () => innerWidth < 760;

class Head {
  el: HTMLElement;
  bob: HTMLElement;
  data: HeadData;
  w = 0;
  h = 0;
  x = 0;
  y = 0;
  mask: { w: number; h: number; a: Uint8ClampedArray } | null = null;
  cleanups: (() => void)[] = [];

  constructor(public id: HeadId, from?: DOMRect) {
    this.data = heads[id];
    const el = (this.el = document.createElement("div"));
    el.className = `head head--${id}`;
    el.dataset.id = id;
    el.innerHTML = `<div class="head__bob"><div class="head__screens"></div>
      <img class="head__img" alt="" draggable="false" decoding="async">
      <div class="head__marks"></div>
      <div class="head__bar"><span class="head__grip" aria-hidden="true"></span><span>${LABEL[id]}</span>
        <button class="head__x" aria-label="Close ${LABEL[id]}">×</button></div></div>`;
    this.bob = el.querySelector(".head__bob")!;
    const img = el.querySelector<HTMLImageElement>(".head__img")!;
    img.src = (mobile() ? this.data.srcSm : this.data.src).replace(/^/, "heads/");
    img.addEventListener("load", () => this.buildMask(img), { once: true });
    el.querySelector(".head__x")!.addEventListener("click", () => closeHead(id));
    el.style.setProperty("--lean", `${SLOT[id].r}deg`);
    el.style.setProperty("--bob-dur", `${4.2 + Object.keys(SLOT).indexOf(id) * 0.7}s`);
    document.getElementById("layer")!.append(el);
    this.layout(true);
    this.screens();
    raise(el);
    this.spawn(from);
  }

  layout(initial = false) {
    const vw = innerWidth, vh = innerHeight;
    const m = mobile();
    this.h = m ? Math.min(vw * 0.86 / this.data.aspect, vh * 0.44) : Math.min(vh * 0.5, 560, vw * 0.3 / this.data.aspect);
    this.w = this.h * this.data.aspect;
    if (initial) {
      const [fx, fy] = m ? SLOT[this.id].m : SLOT[this.id].d;
      this.x = fx * vw - this.w / 2;
      this.y = fy * vh - this.h / 2;
    }
    this.x = Math.max(-this.w * 0.35, Math.min(vw - this.w * 0.65, this.x));
    this.y = Math.max(-this.h * 0.2, Math.min(vh - this.h * 0.6, this.y));
    Object.assign(this.el.style, { width: `${this.w}px`, height: `${this.h}px` });
    this.place();
    this.el.querySelectorAll<HTMLElement>(".scr").forEach((s) => this.fit(s));
  }

  place() {
    this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  spawn(from?: DOMRect) {
    const dx = from ? from.left + from.width / 2 - (this.x + this.w / 2) : 0;
    const dy = from ? from.top + from.height / 2 - (this.y + this.h / 2) : 40;
    this.bob.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(.12) rotate(-24deg)`, opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: "translate(0,0) scale(1.07) rotate(4deg)", offset: 0.62 },
        { transform: "translate(0,0) scale(.97) rotate(-1deg)", offset: 0.82 },
        { transform: "translate(0,0) scale(1) rotate(0)" },
      ],
      { duration: 720, easing: "cubic-bezier(.2,.8,.25,1)" },
    );
    this.el.classList.add("head--boot");
    setTimeout(() => this.el.classList.remove("head--boot"), 900);
  }

  close() {
    const a = this.bob.animate(
      [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.08) rotate(3deg)", opacity: 1, offset: 0.3 }, { transform: "scale(.1) rotate(-30deg)", opacity: 0 }],
      { duration: 360, easing: "cubic-bezier(.5,0,.75,0)" },
    );
    a.onfinish = () => this.el.remove();
    this.cleanups.forEach((f) => f());
  }

  buildMask(img: HTMLImageElement) {
    const w = 120, h = Math.round(120 / this.data.aspect);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    g.drawImage(img, 0, 0, w, h);
    this.mask = { w, h, a: g.getImageData(0, 0, w, h).data };
  }

  /** is a viewport point on this head's visible pixels (or its screens)? */
  hit(px: number, py: number) {
    const r = this.el.getBoundingClientRect();
    const u = (px - r.left) / r.width, v = (py - r.top) / r.height;
    if (u < 0 || v < 0 || u > 1 || v > 1) return false;
    if (!this.mask) return true;
    const x = Math.floor(u * this.mask.w), y = Math.floor(v * this.mask.h);
    return this.mask.a[(y * this.mask.w + x) * 4 + 3] > 40 || inQuads(this.data, u, v);
  }

  // ----- screens -----
  fit(s: HTMLElement) {
    const q = (this.data.screens as Record<string, { quad: number[][] }>)[s.dataset.screen!].quad.map(
      ([u, v]) => [u * this.w, v * this.h] as [number, number],
    );
    const { w, h } = quadSize(q);
    const base = Number(s.dataset.base); // design width of the screen in CSS px
    const bw = base, bh = (base * h) / w;
    s.style.width = `${bw}px`;
    s.style.height = `${bh}px`;
    s.style.transform = quadMatrix(bw, bh, q);
  }

  screen(name: string, base: number, html: string) {
    const s = document.createElement("div");
    s.className = `scr scr--${name}`;
    s.dataset.screen = name;
    s.dataset.base = String(base);
    s.innerHTML = `<div class="scr__in">${html}</div><i class="scr__glare"></i><i class="scr__static"></i>`;
    this.el.querySelector(".head__screens")!.append(s);
    this.fit(s);
    return s;
  }

  screens() {
    if (this.id === "video") videoScreen(this);
    if (this.id === "music") musicScreen(this);
    if (this.id === "merch") merchScreen(this);
    if (this.id === "tour") tourScreen(this);
  }
}

function inQuads(d: HeadData, u: number, v: number) {
  return Object.values(d.screens as Record<string, { quad: number[][] }>).some(({ quad }) => {
    let inside = false;
    for (let i = 0, j = 3; i < 4; j = i++) {
      const [xi, yi] = quad[i], [xj, yj] = quad[j];
      if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// ----- the four screens -----
function videoScreen(h: Head) {
  let i = 0;
  const s = h.screen("video", 460, `
    <nav class="vs__side"><button data-a="files"><i class="ic-files"></i>FILES</button><button data-a="view"><i class="ic-eye"></i>VIEW</button><button data-a="opt"><i class="ic-gear"></i>OPTIONS</button></nav>
    <button class="vs__frame" aria-label="Open the video player"><video muted loop playsinline autoplay preload="auto"></video><span class="vs__live">● REC</span><span class="vs__name"></span></button>
    <div class="vs__bar"><span class="vs__prog"><i></i></span><span class="vs__time">00:00 / 0:00</span></div>`);
  const v = s.querySelector("video")!;
  const load = () => {
    const x = VIDEOS[i];
    v.src = x.loop;
    v.poster = x.poster;
    s.querySelector(".vs__name")!.textContent = x.title;
    void v.play().catch(() => {});
  };
  load();
  const prog = s.querySelector<HTMLElement>(".vs__prog i")!, time = s.querySelector(".vs__time")!;
  v.addEventListener("timeupdate", () => {
    prog.style.width = `${(v.currentTime / (v.duration || 1)) * 100}%`;
    time.textContent = `${fmt(v.currentTime)} / ${VIDEOS[i].length}`;
  });
  s.querySelector('[data-a="files"]')!.addEventListener("click", () => { i = (i + 1) % VIDEOS.length; flick(s); load(); });
  s.querySelector('[data-a="view"]')!.addEventListener("click", () => openVideo(i));
  s.querySelector('[data-a="opt"]')!.addEventListener("click", () => s.classList.toggle("vs--tint"));
  s.querySelector(".vs__frame")!.addEventListener("click", () => openVideo(i));
}

function musicScreen(h: Head) {
  const s = h.screen("music", 300, `
    <div class="ms__top"><span class="ms__min">–</span><span class="ms__x">×</span></div>
    <div class="ms__row"><div><div class="ms__time">00:00</div><div class="ms__meta"><b class="ms__title"></b><span>${RECORD.title}</span><span>${RECORD.artist}</span></div></div>
    <canvas class="ms__eq" width="120" height="64"></canvas></div>
    <div class="ms__seek"><i></i></div>
    <div class="ms__ctl"><button data-a="shuf" aria-label="Shuffle">⤮</button><button data-a="prev" aria-label="Previous">⏮</button>
      <button data-a="play" class="ms__play" aria-label="Play">▶</button><button data-a="next" aria-label="Next">⏭</button><button data-a="rep" aria-label="Repeat">↻</button></div>
    <div class="ms__tap">TAP TO TUNE IN</div>`);
  const title = s.querySelector(".ms__title")!, time = s.querySelector(".ms__time")!, play = s.querySelector<HTMLElement>(".ms__play")!;
  const seek = s.querySelector<HTMLElement>(".ms__seek i")!;
  const sync = () => {
    title.textContent = radio.track.title;
    play.textContent = radio.playing ? "❚❚" : "▶";
    s.classList.toggle("ms--on", radio.playing);
  };
  sync();
  h.cleanups.push(radio.on(sync) as () => void);
  s.querySelector('[data-a="play"]')!.addEventListener("click", () => radio.toggle());
  s.querySelector(".ms__tap")!.addEventListener("click", () => radio.play());
  s.querySelector('[data-a="prev"]')!.addEventListener("click", () => { radio.skip(-1); flick(s); });
  s.querySelector('[data-a="next"]')!.addEventListener("click", () => { radio.skip(1); flick(s); });
  s.querySelector('[data-a="shuf"]')!.addEventListener("click", () => { radio.skip(1 + Math.floor(Math.random() * (TRACKS.length - 1))); flick(s); });
  s.querySelector('[data-a="rep"]')!.addEventListener("click", (e) => (e.currentTarget as HTMLElement).classList.toggle("on"));

  // spectrum + clock
  const cv = s.querySelector<HTMLCanvasElement>(".ms__eq")!, g = cv.getContext("2d")!;
  const lv = new Float32Array(12);
  let raf = 0;
  const draw = () => {
    raf = requestAnimationFrame(draw);
    radio.levels(12, lv);
    g.clearRect(0, 0, 120, 64);
    const idle = !radio.playing;
    for (let i = 0; i < 12; i++) {
      const v = idle ? 0.08 + 0.06 * Math.sin(performance.now() / 300 + i) : lv[i];
      const n = Math.round(v * 10);
      for (let k = 0; k < 10; k++) {
        g.fillStyle = k < n ? (k > 7 ? "#ffb3a8" : "#ff2a1a") : "rgba(255,42,26,.13)";
        g.fillRect(i * 10, 60 - k * 6, 8, 4);
      }
    }
    const t = radio.time;
    time.textContent = fmt(t);
    seek.style.width = `${((t % 200) / 200) * 100}%`;
  };
  draw();
  h.cleanups.push(() => cancelAnimationFrame(raf));

  // speakers thump on the beat, the head nods
  const marks = h.el.querySelector(".head__marks")!;
  (h.data.marks as Record<string, number[][]>).speakers?.forEach(([u, v], k) => {
    const m = document.createElement("i");
    m.className = "spk";
    m.style.left = `${u * 100}%`;
    m.style.top = `${v * 100}%`;
    m.style.setProperty("--s", k < 2 ? "1" : ".7");
    marks.append(m);
  });
  h.cleanups.push(
    radio.onBeat((_, strong) => {
      h.el.classList.remove("thump", "thump--hard");
      void h.el.offsetWidth;
      h.el.classList.add(strong ? "thump--hard" : "thump");
    }) as () => void,
  );
}

function merchScreen(h: Head) {
  const cats = ["T-Shirts", "Hats", "Sweats", "Accessories"] as const;
  let cat: string | null = null, i = 0;
  const list = () => PRODUCTS.filter((p) => !cat || p.category === cat);
  const L = h.screen("lensL", 220, `<div class="mr__menu"><b>MERCH <span>›</span></b>${cats
    .map((c) => `<button data-c="${c}">${c}<span>›</span></button>`).join("")}</div>`);
  const R = h.screen("lensR", 220, `<div class="mr__shop"><button class="mr__nav" data-d="-1" aria-label="Previous">‹</button>
    <button class="mr__art" aria-label="Open product"></button><button class="mr__nav" data-d="1" aria-label="Next">›</button>
    <div class="mr__dots"></div><div class="mr__price"></div></div>`);
  const art = R.querySelector<HTMLElement>(".mr__art")!, dots = R.querySelector(".mr__dots")!, price = R.querySelector(".mr__price")!;
  const show = () => {
    const ps = list();
    i = (i + ps.length) % ps.length;
    art.innerHTML = productArt(ps[i]);
    art.setAttribute("aria-label", `Open ${ps[i].name}`);
    price.textContent = ps[i].price;
    dots.innerHTML = ps.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
    L.querySelectorAll<HTMLElement>("[data-c]").forEach((b) => b.classList.toggle("on", b.dataset.c === cat));
  };
  show();
  R.querySelectorAll<HTMLElement>(".mr__nav").forEach((b) => b.addEventListener("click", () => { i += Number(b.dataset.d); flick(R); show(); }));
  art.addEventListener("click", () => openMerch(list()[i]));
  L.querySelectorAll<HTMLElement>("[data-c]").forEach((b) =>
    b.addEventListener("click", () => {
      const c = b.dataset.c!;
      cat = cat === c || !PRODUCTS.some((p) => p.category === c) ? null : c;
      i = 0; flick(R); show();
    }),
  );
  const auto = setInterval(() => { if (!h.el.matches(":hover")) { i++; show(); } }, 3800);
  h.cleanups.push(() => clearInterval(auto));
}

function tourScreen(h: Head) {
  const rows = SHOWS.map((s) => `<a class="ts__row" href="${s.tickets}" target="_blank" rel="noopener"><span class="ts__date">${s.date}</span>
    <span class="ts__where"><b>${s.city}</b>${s.venue}</span></a>`).join("");
  const s = h.screen("tour", 480, `<header class="ts__head"><span>TOUR</span><span class="ts__win">– □ ×</span></header>
    <div class="ts__list"><div class="ts__roll">${rows}${rows}</div></div>
    <footer class="ts__foot"><span class="ts__seek"><i></i></span><button class="ts__tix">TICKETS</button></footer>`);
  s.querySelector(".ts__tix")!.addEventListener("click", () => openTour());
}

/** a burst of static over a screen when its content changes */
function flick(s: HTMLElement) {
  s.classList.remove("scr--flick");
  void s.offsetWidth;
  s.classList.add("scr--flick");
}

// ----- open / close / drag -----
export function openHead(id: HeadId, from?: DOMRect) {
  const had = live.get(id);
  if (had) {
    raise(had.el);
    had.bob.animate([{ transform: "rotate(0)" }, { transform: "rotate(-6deg) scale(1.04)" }, { transform: "rotate(5deg)" }, { transform: "rotate(0)" }], { duration: 420 });
    return;
  }
  live.set(id, new Head(id, from));
  if (id === "music") radio.static(0.3);
  changed();
}

export function closeHead(id: HeadId) {
  const h = live.get(id);
  if (!h) return;
  live.delete(id);
  h.close();
  if (id === "music") radio.pause();
  changed();
}

export function toggleHead(id: HeadId, from?: DOMRect) {
  live.has(id) ? closeHead(id) : openHead(id, from);
}

export const ALL: HeadId[] = ["tour", "music", "merch", "video"];
export function toggleAll(from?: DOMRect) {
  if (ALL.every((id) => live.has(id))) ALL.forEach((id, k) => setTimeout(() => closeHead(id), k * 70));
  else ALL.filter((id) => !live.has(id)).forEach((id, k) => setTimeout(() => openHead(id, from), k * 120));
}

export function relayout() {
  live.forEach((h) => h.layout());
}

/** Heads are dragged from anywhere on their visible pixels. A drag that moves suppresses the click. */
export function initDrag() {
  let drag: { h: Head; sx: number; sy: number; ox: number; oy: number; moved: boolean; vx: number; vy: number; lt: number; lx: number; ly: number } | null = null;
  document.addEventListener(
    "pointerdown",
    (e) => {
      if ((e.target as HTMLElement).closest(".win, .icon, .tray, .head__x")) return;
      const order = [...live.values()].sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex));
      const h = order.find((x) => x.hit(e.clientX, e.clientY));
      if (!h) return;
      raise(h.el);
      drag = { h, sx: e.clientX, sy: e.clientY, ox: h.x, oy: h.y, moved: false, vx: 0, vy: 0, lt: performance.now(), lx: e.clientX, ly: e.clientY };
    },
    true,
  );
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.h.el.classList.add("head--drag");
      document.body.classList.add("dragging");
    }
    const t = performance.now(), dt = Math.max(1, t - drag.lt);
    drag.vx = (e.clientX - drag.lx) / dt; drag.vy = (e.clientY - drag.ly) / dt;
    drag.lt = t; drag.lx = e.clientX; drag.ly = e.clientY;
    drag.h.x = drag.ox + dx; drag.h.y = drag.oy + dy;
    drag.h.place();
    drag.h.bob.style.rotate = `${Math.max(-12, Math.min(12, drag.vx * 6))}deg`;
  });
  const end = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.h.el.classList.remove("head--drag");
    document.body.classList.remove("dragging");
    d.h.bob.style.rotate = "";
    if (!d.moved) return;
    // swallow the click that follows a drag
    const swallow = (c: Event) => { c.stopPropagation(); c.preventDefault(); };
    addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => removeEventListener("click", swallow, true), 0);
    // a little toss
    let vx = d.vx * 16, vy = d.vy * 16;
    const step = () => {
      vx *= 0.88; vy *= 0.88;
      d.h.x += vx; d.h.y += vy;
      d.h.layout();
      if (Math.hypot(vx, vy) > 0.4) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
}
