// The four supplied heads are the players. Each screen is a hole in the art; live HTML sits in
// that hole. Buttons painted on the art are invisible hotspots.

import heads from "../public/heads/heads.json";
import { CATS, RECORD, SHOWS, productsIn, type Category } from "./data";
import { openEq, openMerch, openOptions, openPlaylist, openTour, openVideo, openVisuals } from "./apps";
import { quadMatrix, quadSize } from "./quad";
import { radio } from "./radio";
import { raise } from "./z";

export type HeadId = "video" | "music" | "merch" | "tour";

type Hot = { id: string; x: number; y: number; w: number; h: number; label: string };
type ScreenSpec = { quad: number[][]; radius?: string };
type HeadData = {
  src: string;
  srcSm: string;
  aspect: number;
  screens: Record<string, ScreenSpec>;
  hot: Hot[];
};

const DATA = heads as Record<HeadId, HeadData>;

const SLOT: Record<HeadId, { d: [number, number]; m: [number, number] }> = {
  tour: { d: [0.26, 0.48], m: [0.5, 0.42] },
  music: { d: [0.5, 0.38], m: [0.5, 0.4] },
  merch: { d: [0.72, 0.5], m: [0.5, 0.46] },
  video: { d: [0.3, 0.5], m: [0.5, 0.55] },
};

const live = new Map<HeadId, Head>();
const listeners = new Set<() => void>();
export const onHeads = (f: () => void) => listeners.add(f);
const changed = () => listeners.forEach((f) => f());
export const isOpen = (id: HeadId) => live.has(id);
const mobile = () => innerWidth < 760;

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

class Head {
  el: HTMLElement;
  data: HeadData;
  w = 0;
  h = 0;
  x = 0;
  y = 0;
  mask: { w: number; h: number; a: Uint8ClampedArray } | null = null;
  cleanups: (() => void)[] = [];
  docked = false;

  constructor(public id: HeadId, from?: DOMRect) {
    this.data = DATA[id];
    const el = (this.el = document.createElement("div"));
    el.className = `head head--${id}`;
    el.dataset.id = id;
    el.innerHTML = `<div class="head__bob"><div class="head__screens"></div><img class="head__img" alt="" draggable="false" decoding="async"><div class="head__over"></div><div class="head__hot"></div></div>`;
    const img = el.querySelector<HTMLImageElement>(".head__img")!;
    img.src = (mobile() ? this.data.srcSm : this.data.src).replace(/^/, "heads/");
    img.addEventListener("load", () => this.buildMask(img), { once: true });
    document.getElementById("layer")!.append(el);
    this.layout(true);
    this.screens();
    this.hotspots();
    raise(el);
    this.spawn(from);
  }

  layout(initial = false) {
    if (this.docked) return;
    const vw = innerWidth, vh = innerHeight;
    const m = mobile();
    const cap = m ? Math.min(vw * 0.94 / this.data.aspect, vh * 0.58) : Math.min(vh * 0.64, 680);
    this.h = cap;
    this.w = this.h * this.data.aspect;
    if (initial) {
      const [fx, fy] = m ? SLOT[this.id].m : SLOT[this.id].d;
      this.x = fx * vw - this.w / 2;
      this.y = fy * vh - this.h / 2;
    }
    this.x = Math.max(-this.w * 0.25, Math.min(vw - this.w * 0.55, this.x));
    this.y = Math.max(8, Math.min(vh - this.h * 0.45, this.y));
    Object.assign(this.el.style, { width: `${this.w}px`, height: `${this.h}px` });
    this.place();
    this.el.querySelectorAll<HTMLElement>(".scr").forEach((s) => this.fit(s));
  }

  place() {
    if (this.docked) {
      this.el.style.transform = "";
      return;
    }
    this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  setDock(on: boolean) {
    this.docked = on;
    this.el.classList.toggle("head--dock", on);
    if (on) {
      this.w = innerWidth * 1.12;
      this.h = this.w / this.data.aspect;
      this.el.style.width = `${this.w}px`;
      this.el.style.height = `${this.h}px`;
      this.el.querySelectorAll<HTMLElement>(".scr").forEach((s) => this.fit(s));
    } else this.layout();
    this.place();
  }

  spawn(from?: DOMRect) {
    const bob = this.el.querySelector(".head__bob")!;
    const dx = from ? from.left + from.width / 2 - (this.x + this.w / 2) : 0;
    const dy = from ? from.top + from.height / 2 - (this.y + this.h / 2) : 24;
    bob.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(.4)`, opacity: 0 },
        { transform: "translate(0,0) scale(1)", opacity: 1 },
      ],
      { duration: 280, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }

  close() {
    const bob = this.el.querySelector(".head__bob")!;
    const a = bob.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.92)" }], { duration: 160 });
    a.onfinish = () => this.el.remove();
    this.cleanups.forEach((f) => f());
  }

  buildMask(img: HTMLImageElement) {
    const w = 100, h = Math.round(100 / this.data.aspect);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    g.drawImage(img, 0, 0, w, h);
    this.mask = { w, h, a: g.getImageData(0, 0, w, h).data };
  }

  hit(px: number, py: number) {
    const r = this.el.getBoundingClientRect();
    const u = (px - r.left) / r.width, v = (py - r.top) / r.height;
    if (u < 0 || v < 0 || u > 1 || v > 1) return false;
    if (!this.mask) return true;
    const x = Math.min(this.mask.w - 1, Math.floor(u * this.mask.w));
    const y = Math.min(this.mask.h - 1, Math.floor(v * this.mask.h));
    return this.mask.a[(y * this.mask.w + x) * 4 + 3] > 24 || inQuads(this.data, u, v);
  }

  fit(s: HTMLElement) {
    const spec = this.data.screens[s.dataset.screen!];
    const q = spec.quad.map(([u, v]) => [u * this.w, v * this.h] as [number, number]);
    const { w, h } = quadSize(q);
    const base = Number(s.dataset.base);
    s.style.width = `${base}px`;
    s.style.height = `${(base * h) / w}px`;
    s.style.transform = quadMatrix(base, (base * h) / w, q);
    if (spec.radius) s.style.borderRadius = spec.radius;
  }

  screen(name: string, base: number, html: string, cls: string) {
    const s = document.createElement("div");
    s.className = `scr ${cls}`;
    s.dataset.screen = name;
    s.dataset.base = String(base);
    s.innerHTML = html;
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

  hotspots() {
    const box = this.el.querySelector(".head__hot")!;
    for (const hot of this.data.hot) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hot";
      b.dataset.hot = hot.id;
      b.setAttribute("aria-label", hot.label);
      b.style.left = `${hot.x * 100}%`;
      b.style.top = `${hot.y * 100}%`;
      b.style.width = `${hot.w * 100}%`;
      b.style.height = `${hot.h * 100}%`;
      b.addEventListener("click", () => hotAction(this, hot.id));
      box.append(b);
    }
  }
}

function inQuads(d: HeadData, u: number, v: number) {
  return Object.values(d.screens).some(({ quad }) => {
    let inside = false;
    for (let i = 0, j = 3; i < 4; j = i++) {
      const [xi, yi] = quad[i], [xj, yj] = quad[j];
      if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / ((yj - yi) || 1e-6) + xi) inside = !inside;
    }
    return inside;
  });
}

let visor: HTMLVideoElement | null = null;

function videoScreen(h: Head) {
  const s = h.screen("video", 320, `<video muted loop playsinline autoplay preload="metadata"></video>`, "scr--video");
  const v = s.querySelector("video")!;
  visor = v;
  v.src = "v/clip1.mp4";
  v.poster = "v/clip1.jpg";
  void v.play().catch(() => {});
  v.addEventListener("click", () => openVideo(0));
  const over = document.createElement("div");
  over.className = "vread";
  over.innerHTML = `<span class="vread__bar"><i></i></span><span class="vread__time">00:00 / 00:00</span>`;
  h.el.querySelector(".head__over")!.append(over);
  const bar = over.querySelector<HTMLElement>(".vread__bar i")!;
  const time = over.querySelector(".vread__time")!;
  const tick = () => {
    const dur = v.duration || 0;
    bar.style.width = `${dur ? (v.currentTime / dur) * 100 : 0}%`;
    time.textContent = `${fmt(v.currentTime)} / ${fmt(dur)}`;
  };
  v.addEventListener("timeupdate", tick);
  v.addEventListener("loadedmetadata", tick);
  h.cleanups.push(() => { if (visor === v) visor = null; });
}

function hotAction(h: Head, id: string) {
  if (h.id === "video" && visor) {
    const v = visor;
    if (id === "play") { v.paused ? void v.play() : v.pause(); return; }
    if (id === "left") { v.currentTime = Math.max(0, v.currentTime - 5); return; }
    if (id === "right") { v.currentTime = Math.min(v.duration || 0, v.currentTime + 5); return; }
    if (id === "up") { v.currentTime = 0; return; }
    if (id === "down") { openVideo(0); return; }
    if (id === "view") { openVideo(0); return; }
    if (id === "files") { openVideo(0, true); return; }
    if (id === "opt") { v.muted = !v.muted; return; }
  }
  if (h.id === "music") {
    if (id === "playlist") openPlaylist();
    if (id === "equalizer") openEq();
    if (id === "visuals") openVisuals();
    if (id === "options") openOptions();
  }
}

const ICON = {
  rep: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 4l3 3-3 3M20 7H8a4 4 0 0 0-4 4M7 20l-3-3 3-3M4 17h12a4 4 0 0 0 4-4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 5L8 12l10 7z" fill="currentColor"/></svg>`,
  next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M6 5l10 7L6 19z" fill="currentColor"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l12 7-12 7z" fill="currentColor"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg>`,
  shuf: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 4h4v4M4 16c4 0 6-8 12-8M16 20h4v-4M4 8c4 0 6 8 12 8" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
};

function musicScreen(h: Head) {
  const s = h.screen("lcd", 280, `<div class="lcd">
      <div class="lcd__win"><button type="button" data-a="min" aria-label="Minimise"><i></i></button><button type="button" data-a="close" aria-label="Close"><i></i></button></div>
      <div class="lcd__main">
        <div class="lcd__meta"><b class="lcd__time">00:00</b><b class="lcd__track"></b><span>${RECORD.title}</span><span>${RECORD.artist}</span></div>
        <canvas class="lcd__eq" width="120" height="64"></canvas>
      </div>
      <div class="lcd__ctl">
        <button type="button" data-a="rep" aria-label="Repeat" class="${radio.repeat ? "on" : ""}">${ICON.rep}</button>
        <button type="button" data-a="prev" aria-label="Previous">${ICON.prev}</button>
        <button type="button" data-a="play" class="lcd__play" aria-label="Play">${ICON.play}</button>
        <button type="button" data-a="next" aria-label="Next">${ICON.next}</button>
        <button type="button" data-a="shuf" aria-label="Shuffle">${ICON.shuf}</button>
      </div>
      <button type="button" class="lcd__seek" aria-label="Seek"><i></i></button>
    </div>`, "scr--lcd");
  const time = s.querySelector(".lcd__time")!;
  const track = s.querySelector(".lcd__track")!;
  const play = s.querySelector<HTMLElement>("[data-a=play]")!;
  const seek = s.querySelector<HTMLElement>(".lcd__seek")!;
  const seekI = seek.querySelector<HTMLElement>("i")!;
  const sync = () => {
    track.textContent = radio.track.title;
    play.innerHTML = radio.playing ? ICON.pause : ICON.play;
    play.setAttribute("aria-label", radio.playing ? "Pause" : "Play");
    s.classList.toggle("lcd--on", radio.playing);
  };
  sync();
  h.cleanups.push(radio.on(sync));
  s.querySelector("[data-a=play]")!.addEventListener("click", () => radio.toggle());
  s.querySelector("[data-a=prev]")!.addEventListener("click", () => radio.skip(-1));
  s.querySelector("[data-a=next]")!.addEventListener("click", () => radio.skip(1));
  s.querySelector("[data-a=rep]")!.addEventListener("click", (e) => {
    radio.repeat = !radio.repeat;
    (e.currentTarget as HTMLElement).classList.toggle("on", radio.repeat);
  });
  s.querySelector("[data-a=shuf]")!.addEventListener("click", (e) => (e.currentTarget as HTMLElement).classList.toggle("on"));
  s.querySelector("[data-a=min]")!.addEventListener("click", () => closeHead(h.id));
  s.querySelector("[data-a=close]")!.addEventListener("click", () => closeHead(h.id));
  const setSeek = (clientX: number) => {
    const r = seek.getBoundingClientRect();
    radio.seek((clientX - r.left) / r.width);
  };
  seek.addEventListener("pointerdown", (e) => {
    setSeek(e.clientX);
    const move = (ev: PointerEvent) => setSeek(ev.clientX);
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  });

  const cv = s.querySelector<HTMLCanvasElement>(".lcd__eq")!;
  const g = cv.getContext("2d")!;
  const lv = new Float32Array(12);
  let raf = 0;
  const draw = () => {
    raf = requestAnimationFrame(draw);
    radio.levels(12, lv);
    g.clearRect(0, 0, 120, 64);
    for (let i = 0; i < 12; i++) {
      const v = radio.playing ? lv[i] : 0.12 + 0.08 * Math.sin(performance.now() / 320 + i);
      const n = Math.round(Math.min(1, v) * 10);
      for (let k = 0; k < 10; k++) {
        g.fillStyle = k < n ? (k > 7 ? "#ffb0a4" : "#ff2418") : "rgba(255,36,24,.18)";
        g.fillRect(i * 10, 60 - k * 6, 7, 4);
      }
    }
    time.textContent = fmt(radio.time);
    seekI.style.width = `${(radio.time / radio.length) * 100}%`;
  };
  draw();
  h.cleanups.push(() => cancelAnimationFrame(raf));
}

function merchScreen(h: Head) {
  let cat: Category = "T-Shirts";
  let i = 0;
  const L = h.screen("lensL", 168, `<div class="lens lens--menu">
      <button type="button" class="lens__cart" aria-label="Open merch"> </button>
      <div class="lens__title"><b>MERCH</b><span>›</span></div>
      ${CATS.map((c) => `<button type="button" data-c="${c}">${c}<span>›</span></button>`).join("")}
    </div>`, "scr--lens");
  const R = h.screen("lensR", 168, `<div class="lens lens--shop">
      <button type="button" class="lens__nav" data-d="-1" aria-label="Previous">‹</button>
      <button type="button" class="lens__art" aria-label="Open merch"></button>
      <button type="button" class="lens__nav" data-d="1" aria-label="Next">›</button>
      <div class="lens__dots"></div>
    </div>`, "scr--lens");
  const art = R.querySelector<HTMLElement>(".lens__art")!;
  const dots = R.querySelector(".lens__dots")!;
  const list = () => productsIn(cat);
  const show = () => {
    const ps = list();
    L.querySelectorAll<HTMLElement>("[data-c]").forEach((b) => b.classList.toggle("on", b.dataset.c === cat));
    if (!ps.length) {
      art.innerHTML = `<span class="lens__none">${cat}</span>`;
      dots.innerHTML = "";
      return;
    }
    i = (i + ps.length) % ps.length;
    art.innerHTML = `<img src="${ps[i].image}" alt="${ps[i].label}">`;
    dots.innerHTML = ps.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
  };
  show();
  const open = () => {
    const ps = list();
    if (ps[i]) openMerch(ps[i]);
  };
  art.addEventListener("click", open);
  L.querySelector(".lens__cart")!.addEventListener("click", open);
  R.querySelectorAll<HTMLElement>(".lens__nav").forEach((b) => b.addEventListener("click", () => {
    const ps = list();
    if (ps.length < 2) return;
    i += Number(b.dataset.d);
    show();
  }));
  L.querySelectorAll<HTMLElement>("[data-c]").forEach((b) => b.addEventListener("click", () => {
    cat = b.dataset.c as Category;
    i = 0;
    show();
  }));
}

function tourScreen(h: Head) {
  const rows = SHOWS.map((s, n) => `<button type="button" class="tour__row" data-n="${n}"><span>${s.date}</span><span><b>${s.city}</b>${s.venue}</span></button>`).join("");
  const s = h.screen("tour", 300, `<div class="tour">
      <header><b>TOUR</b><span class="tour__win"><button type="button" data-a="min" aria-label="Minimise"><i></i></button><button type="button" data-a="max" aria-label="Open tour"><i></i></button><button type="button" data-a="close" aria-label="Close"><i></i></button></span></header>
      <div class="tour__list">${rows}</div>
      <div class="tour__seek"><i></i></div>
      <footer>
        <button type="button" data-a="prev" aria-label="Previous">${ICON.prev}</button>
        <button type="button" data-a="play" aria-label="Play">${ICON.play}</button>
        <button type="button" data-a="next" aria-label="Next">${ICON.next}</button>
        <button type="button" class="tour__tix" data-a="tix">TICKETS</button>
      </footer>
    </div>`, "scr--tour");
  let row = 0;
  const mark = () => s.querySelectorAll(".tour__row").forEach((el, n) => el.classList.toggle("on", n === row));
  mark();
  s.querySelectorAll<HTMLElement>(".tour__row").forEach((b) => b.addEventListener("click", () => { row = Number(b.dataset.n); mark(); openTour(); }));
  s.querySelector("[data-a=tix]")!.addEventListener("click", () => openTour());
  s.querySelector("[data-a=close]")!.addEventListener("click", () => closeHead(h.id));
  s.querySelector("[data-a=min]")!.addEventListener("click", () => closeHead(h.id));
  s.querySelector("[data-a=max]")!.addEventListener("click", () => openTour());
  s.querySelector("[data-a=prev]")!.addEventListener("click", () => { row = (row + SHOWS.length - 1) % SHOWS.length; mark(); });
  s.querySelector("[data-a=next]")!.addEventListener("click", () => { row = (row + 1) % SHOWS.length; mark(); });
  s.querySelector("[data-a=play]")!.addEventListener("click", () => openTour());
  const bar = s.querySelector<HTMLElement>(".tour__seek i")!;
  bar.style.width = "42%";
}

export function openHead(id: HeadId, from?: DOMRect) {
  const had = live.get(id);
  if (had) {
    raise(had.el);
    return had;
  }
  const h = new Head(id, from);
  live.set(id, h);
  changed();
  return h;
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
  if (live.has(id)) closeHead(id);
  else openHead(id, from);
}

export function setDock(id: HeadId, on: boolean) {
  const h = live.get(id);
  if (!h) return;
  h.setDock(on);
  if (on) raise(h.el);
}

export const ALL: HeadId[] = ["tour", "music", "merch", "video"];

export function toggleAll(from?: DOMRect) {
  if (ALL.every((id) => live.has(id))) ALL.forEach((id, k) => setTimeout(() => closeHead(id), k * 60));
  else ALL.filter((id) => !live.has(id)).forEach((id, k) => setTimeout(() => openHead(id, from), k * 90));
}

export function relayout() {
  live.forEach((h) => h.layout());
}

export function initDrag() {
  let drag: { h: Head; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null = null;
  document.addEventListener("pointerdown", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest(".win, .icon, .globe, button, a, input, .scr")) return;
    const order = [...live.values()].filter((h) => !h.docked).sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex));
    const h = order.find((x) => x.hit(e.clientX, e.clientY));
    if (!h) return;
    e.stopPropagation();
    raise(h.el);
    drag = { h, sx: e.clientX, sy: e.clientY, ox: h.x, oy: h.y, moved: false };
  }, true);
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    drag.h.el.classList.add("head--drag");
    drag.h.x = drag.ox + dx;
    drag.h.y = drag.oy + dy;
    drag.h.place();
  });
  const end = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.h.el.classList.remove("head--drag");
    if (!d.moved) return;
    const swallow = (c: Event) => { c.stopPropagation(); c.preventDefault(); };
    addEventListener("click", swallow, { capture: true, once: true });
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
}
