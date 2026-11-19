// Crew-photo heads are the players. Each PSD render is one flattened picture, so the
// screen graphics are baked in. Live controls sit in those screen rectangles.
// public/heads merch.* is the red goggles (ape_*.webp). tour.* is the orange visor (walshy_*.webp).

import heads from "../public/heads/heads.json";
import { openEq, openMerch, openOptions, openPlaylist, openTour, openVisuals, videoCmd, videoIndex, videoTime, onVideo } from "./apps";
import { CATS, SHOWS, TRACKS, VIDEOS, productsIn, type Category } from "./data";
import { radio } from "./radio";
import { raise } from "./z";

export type HeadId = "video" | "music" | "merch" | "tour";

type Hot = { id: string; x: number; y: number; w: number; h: number; label: string };
type Rect = { x: number; y: number; w: number; h: number; radius?: string };
type HeadData = {
  src: string;
  srcSm: string;
  aspect: number;
  crop: { y: number; h: number };
  screens: Record<string, Rect>;
  hot: Hot[];
};

const DATA = heads as Record<HeadId, HeadData>;

const HERO: Record<HeadId, [number, number]> = {
  video: [0.3, 0.48],
  music: [0.46, 0.36],
  merch: [0.34, 0.5],
  tour: [0.28, 0.5],
};
const WITH: Record<HeadId, [number, number]> = {
  video: [0.26, 0.52],
  music: [0.48, 0.32],
  merch: [0.7, 0.54],
  tour: [0.24, 0.52],
};

const NAMES: Record<HeadId, string> = {
  video: "Video, Diplo",
  music: "Music, America",
  merch: "Merch, Walshy",
  tour: "Tour, Ape",
};

const live = new Map<HeadId, Head>();
const listeners = new Set<() => void>();
export const onHeads = (fn: () => void) => listeners.add(fn);
const changed = () => listeners.forEach((fn) => fn());
export const isOpen = (id: HeadId) => live.has(id);
const mobile = () => innerWidth < 760;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const ICON = {
  rep: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 4l3 3-3 3M20 7H8a4 4 0 0 0-4 4M7 20l-3-3 3-3M4 17h12a4 4 0 0 0 4-4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 5L8 12l10 7z" fill="currentColor"/></svg>`,
  next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M6 5l10 7L6 19z" fill="currentColor"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l12 7-12 7z" fill="currentColor"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg>`,
  stop: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z" fill="currentColor"/></svg>`,
  shuf: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 4h4v4M4 16c4 0 6-8 12-8M16 20h4v-4M4 8c4 0 6 8 12 8" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
};

class Head {
  el: HTMLElement;
  data: HeadData;
  w = 0;
  h = 0;
  x = 0;
  y = 0;
  mask: { w: number; h: number; a: Uint8ClampedArray } | null = null;
  cleanups: (() => void)[] = [];
  cropped = false;
  edge: "top" | "bottom" = "top";

  constructor(public id: HeadId, from?: DOMRect, crop?: "top" | "bottom") {
    this.data = DATA[id];
    const el = (this.el = document.createElement("section"));
    el.className = `head head--${id}`;
    el.dataset.id = id;
    el.setAttribute("aria-label", NAMES[id]);
    el.innerHTML = `<div class="head__bob"><img class="head__img" alt="" draggable="false" decoding="async"><div class="head__screens"></div><div class="head__hot"></div></div>`;
    const img = el.querySelector<HTMLImageElement>(".head__img")!;
    img.src = "heads/" + (mobile() ? this.data.srcSm : this.data.src);
    img.addEventListener("load", () => this.buildMask(img), { once: true });
    document.getElementById("layer")!.append(el);
    this.screens();
    this.hotspots();
    if (crop) this.setCrop(true, crop);
    else {
      this.layout(true);
      this.spawn(from);
    }
    raise(el);
  }

  layout(initial = false) {
    if (this.cropped) return;
    const vw = innerWidth;
    const vh = innerHeight;
    const m = mobile();
    const cap = m ? Math.min((vw * 0.92) / this.data.aspect, vh * 0.62) : Math.min(vh * 0.7, 720);
    this.h = cap;
    this.w = this.h * this.data.aspect;
    if (initial || m) {
      const others = [...live.keys()].filter((k) => k !== this.id);
      const slot = !m && others.length ? WITH[this.id] : HERO[this.id];
      const [fx, fy] = m ? [0.5, this.id === "music" ? 0.46 : 0.5] : slot;
      this.x = fx * vw - this.w / 2;
      this.y = fy * vh - this.h / 2;
      if (m && isOpen("music") && isOpen("video") && !document.body.classList.contains("m-video")) {
        if (this.id === "music") this.y = -this.h * 0.34;
        if (this.id === "video") this.y = vh * 0.42;
      }
    }
    this.x = Math.max(-this.w * 0.35, Math.min(vw - this.w * 0.45, this.x));
    this.y = Math.max(-this.h * 0.45, Math.min(vh - this.h * 0.35, this.y));
    this.el.style.width = `${this.w}px`;
    this.el.style.height = `${this.h}px`;
    this.place();
  }

  place() {
    if (this.cropped) return;
    this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  setCrop(on: boolean, edge: "top" | "bottom" = "top") {
    this.cropped = on;
    this.edge = edge;
    this.el.classList.toggle("head--crop", on);
    this.el.classList.toggle("head--bottom", on && edge === "bottom");
    this.el.classList.toggle("head--top", on && edge === "top");
    const bob = this.el.querySelector<HTMLElement>(".head__bob")!;
    if (!on) {
      bob.style.cssText = "";
      this.el.style.bottom = "";
      this.layout(true);
      return;
    }
    const band = this.data.crop;
    // Wide heads (the music dome) can bleed off the sides. Narrow heads
    // (merch goggles, tour visor) stay full-width so the controls are not cropped.
    const bleed = this.id === "music";
    let strip = Math.round(innerHeight * (edge === "bottom" ? 0.34 : bleed ? 0.36 : 0.4));
    let fullH = strip / band.h;
    let fullW = fullH * this.data.aspect;
    if (!bleed && fullW > innerWidth) {
      fullW = innerWidth;
      fullH = fullW / this.data.aspect;
      strip = Math.round(band.h * fullH);
    }
    this.w = fullW;
    this.h = fullH;
    this.el.style.width = "100%";
    this.el.style.height = `${strip}px`;
    this.el.style.transform = "none";
    this.el.style.left = "0";
    this.el.style.right = "0";
    this.el.style.top = edge === "top" ? "0" : "auto";
    this.el.style.bottom = edge === "bottom" ? "0" : "auto";
    bob.style.width = `${fullW}px`;
    bob.style.height = `${fullH}px`;
    bob.style.transform = `translate(${-fullW / 2}px, ${-band.y * fullH}px)`;
    document.documentElement.style.setProperty("--dock", `${strip}px`);
  }

  spawn(from?: DOMRect) {
    const bob = this.el.querySelector(".head__bob")!;
    const dx = from ? from.left + from.width / 2 - (this.x + this.w / 2) : 0;
    const dy = from ? from.top + from.height / 2 - (this.y + this.h / 2) : 24;
    bob.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(.4)`, opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 280, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }

  close() {
    const bob = this.el.querySelector(".head__bob")!;
    const a = bob.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.96)" }], { duration: 160 });
    a.onfinish = () => this.el.remove();
    this.cleanups.forEach((fn) => fn());
  }

  buildMask(img: HTMLImageElement) {
    const w = 80;
    const h = Math.max(1, Math.round(80 / this.data.aspect));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    g.drawImage(img, 0, 0, w, h);
    this.mask = { w, h, a: g.getImageData(0, 0, w, h).data };
  }

  hit(px: number, py: number) {
    const r = this.el.getBoundingClientRect();
    const u = (px - r.left) / r.width;
    const v = (py - r.top) / r.height;
    if (u < 0 || v < 0 || u > 1 || v > 1) return false;
    if (this.cropped) return true;
    if (!this.mask) return true;
    const x = Math.min(this.mask.w - 1, Math.floor(u * this.mask.w));
    const y = Math.min(this.mask.h - 1, Math.floor(v * this.mask.h));
    return this.mask.a[(y * this.mask.w + x) * 4 + 3] > 24;
  }

  screen(name: string, html: string) {
    const spec = this.data.screens[name];
    const s = document.createElement("div");
    s.className = `scr scr--${name}`;
    s.dataset.screen = name;
    s.innerHTML = html;
    s.style.left = `${spec.x * 100}%`;
    s.style.top = `${spec.y * 100}%`;
    s.style.width = `${spec.w * 100}%`;
    s.style.height = `${spec.h * 100}%`;
    if (spec.radius) s.style.borderRadius = spec.radius;
    this.el.querySelector(".head__screens")!.append(s);
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
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        hotAction(this, hot.id);
      });
      box.append(b);
    }
  }
}

function hotAction(h: Head, id: string) {
  if (h.id === "video") {
    if (id === "files") h.el.querySelector(".vpick__list")?.querySelector(".vpick__h--old")?.scrollIntoView({ block: "nearest" });
    if (id === "view" || id === "play") videoCmd("play");
    if (id === "up") videoCmd("prev");
    if (id === "down") videoCmd("next");
    if (id === "left") videoCmd(videoTime().dur ? "back" : "prev");
    if (id === "right") videoCmd(videoTime().dur ? "fwd" : "next");
    if (id === "opt") videoCmd("mute");
  }
  if (h.id === "music") {
    if (id === "playlist") openPlaylist();
    if (id === "equalizer") openEq();
    if (id === "visuals") openVisuals();
    if (id === "options") openOptions();
  }
  if (h.id === "merch" && id === "cart") openMerch(productsIn(h.el.dataset.cat as Category)[0] ?? null);
  if (h.id === "tour" && (id === "list" || id === "merch")) openTour(Number(h.el.dataset.row || 0));
}

function videoScreen(h: Head) {
  const s = h.screen("video", `<div class="vpick"><img class="vpick__bg" alt=""><div class="vpick__list"></div><div class="vpick__bar"><i></i></div><b class="vpick__time">--:--</b></div>`);
  const list = s.querySelector<HTMLElement>(".vpick__list")!;
  const bg = s.querySelector<HTMLImageElement>(".vpick__bg")!;
  const bar = s.querySelector<HTMLElement>(".vpick__bar i")!;
  const time = s.querySelector(".vpick__time")!;
  const render = () => {
    list.innerHTML = drawVideoList(videoIndex());
    const on = list.querySelector<HTMLElement>("button.on");
    const poster = on?.dataset.poster || "";
    if (poster) {
      bg.src = poster;
      bg.hidden = false;
    } else bg.hidden = true;
    const t = videoTime();
    bar.style.width = `${t.dur ? (t.now / t.dur) * 100 : 0}%`;
    time.textContent = t.dur ? `${fmt(t.now)} / ${fmt(t.dur)}` : "NO FILE";
  };
  render();
  list.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-i]");
    if (!b) return;
    const n = Number(b.dataset.i);
    const hops = n - videoIndex();
    if (hops > 0) for (let k = 0; k < hops; k++) videoCmd("next");
    else if (hops < 0) for (let k = 0; k < -hops; k++) videoCmd("prev");
    videoCmd("open");
  });
  h.cleanups.push(onVideo(render));
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const t = videoTime();
    bar.style.width = `${t.dur ? (t.now / t.dur) * 100 : 0}%`;
    if (t.dur) time.textContent = `${fmt(t.now)} / ${fmt(t.dur)}`;
  };
  tick();
  h.cleanups.push(() => cancelAnimationFrame(raf));
}

function drawVideoList(active: number) {
  const block = (shelf: "current" | "archive", label: string) => {
    const rows = VIDEOS.map((v, i) => ({ v, i })).filter((x) => x.v.shelf === shelf);
    if (!rows.length) return "";
    return `<p class="vpick__h${shelf === "archive" ? " vpick__h--old" : ""}">${label}</p>${rows
      .map(({ v, i }) => `<button type="button" data-i="${i}" data-poster="${v.poster ?? ""}" class="${i === active ? "on" : ""}"><span>${v.title}</span>${
        v.placeholder ? "<em>PLACEHOLDER</em>" : ""
      }</button>`)
      .join("")}`;
  };
  return block("current", "VIDEOS") + block("archive", "OLDER");
}

function musicScreen(h: Head) {
  const s = h.screen(
    "lcd",
    `<div class="lcd">
      <div class="lcd__win"><button type="button" data-a="min" aria-label="Minimise"><i></i></button><button type="button" data-a="close" aria-label="Close"><i></i></button></div>
      <div class="lcd__main">
        <ol class="lcd__list"></ol>
        <canvas class="lcd__eq" width="72" height="64"></canvas>
      </div>
      <div class="lcd__ctl">
        <button type="button" data-a="rep" aria-label="Repeat">${ICON.rep}</button>
        <button type="button" data-a="prev" aria-label="Previous">${ICON.prev}</button>
        <button type="button" data-a="play" class="lcd__play" aria-label="Play">${ICON.play}</button>
        <button type="button" data-a="stop" aria-label="Stop">${ICON.stop}</button>
        <button type="button" data-a="next" aria-label="Next">${ICON.next}</button>
        <button type="button" data-a="shuf" aria-label="Shuffle">${ICON.shuf}</button>
      </div>
      <button type="button" class="lcd__seek" aria-label="Seek"><i></i></button>
    </div>`,
  );
  const list = s.querySelector<HTMLOListElement>(".lcd__list")!;
  const play = s.querySelector<HTMLElement>("[data-a=play]")!;
  const seek = s.querySelector<HTMLElement>(".lcd__seek")!;
  const seekI = seek.querySelector<HTMLElement>("i")!;
  const rep = s.querySelector<HTMLElement>("[data-a=rep]")!;
  const shuf = s.querySelector<HTMLElement>("[data-a=shuf]")!;
  const fill = () => {
    list.innerHTML = TRACKS.map((t, i) => `<li class="${i === radio.index ? "on" : ""}"><button type="button" data-i="${i}"><b>${i === radio.index ? fmt(radio.time) : ""}</b><span>${t.title}</span>${
      t.audio ? "" : "<em>NO AUDIO</em>"
    }</button></li>`).join("");
  };
  const sync = () => {
    play.innerHTML = radio.playing ? ICON.pause : ICON.play;
    play.setAttribute("aria-label", radio.playing ? "Pause" : "Play");
    s.classList.toggle("lcd--on", radio.playing);
    rep.classList.toggle("on", radio.repeat);
    shuf.classList.toggle("on", radio.shuffle);
    fill();
  };
  sync();
  h.cleanups.push(radio.on(sync));
  list.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-i]");
    if (!b) return;
    const jump = Number(b.dataset.i) - radio.index;
    if (jump) radio.skip(jump);
    radio.play();
  });
  s.querySelector("[data-a=play]")!.addEventListener("click", () => radio.toggle());
  s.querySelector("[data-a=stop]")!.addEventListener("click", () => radio.stop());
  s.querySelector("[data-a=prev]")!.addEventListener("click", () => radio.skip(-1));
  s.querySelector("[data-a=next]")!.addEventListener("click", () => radio.skip(1));
  rep.addEventListener("click", () => (radio.repeat = !radio.repeat));
  shuf.addEventListener("click", () => (radio.shuffle = !radio.shuffle));
  s.querySelector("[data-a=min]")!.addEventListener("click", () => closeHead(h.id));
  s.querySelector("[data-a=close]")!.addEventListener("click", () => closeHead(h.id));
  const setSeek = (clientX: number) => {
    const r = seek.getBoundingClientRect();
    radio.seek((clientX - r.left) / r.width);
  };
  seek.addEventListener("pointerdown", (e) => {
    setSeek(e.clientX);
    const move = (ev: PointerEvent) => setSeek(ev.clientX);
    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  });
  const cv = s.querySelector<HTMLCanvasElement>(".lcd__eq")!;
  const g = cv.getContext("2d")!;
  const lv = new Float32Array(8);
  let raf = 0;
  const draw = () => {
    raf = requestAnimationFrame(draw);
    radio.levels(8, lv);
    g.clearRect(0, 0, 72, 64);
    for (let i = 0; i < 8; i++) {
      const n = Math.round(Math.min(1, lv[i]) * 10);
      for (let k = 0; k < 10; k++) {
        g.fillStyle = k < n ? (k > 7 ? "#ffb0a4" : "#ff2418") : "rgba(255,36,24,.2)";
        g.fillRect(i * 9, 60 - k * 6, 6, 4);
      }
    }
    seekI.style.width = `${(radio.time / radio.length) * 100}%`;
    const cur = list.querySelector<HTMLElement>("li.on b");
    if (cur) cur.textContent = fmt(radio.time);
  };
  draw();
  h.cleanups.push(() => cancelAnimationFrame(raf));
}

function merchScreen(h: Head) {
  let cat: Category = "T-Shirts";
  let i = 0;
  const L = h.screen(
    "lensL",
    `<div class="lens lens--menu"><div class="lens__title"><b>MERCH</b><span>›</span></div>${CATS.map((c) => `<button type="button" data-c="${c}">${c}<span>›</span></button>`).join("")}</div>`,
  );
  const R = h.screen(
    "lensR",
    `<div class="lens lens--shop"><button type="button" class="lens__nav" data-d="-1" aria-label="Previous">‹</button><button type="button" class="lens__art" aria-label="Open merch"></button><button type="button" class="lens__nav" data-d="1" aria-label="Next">›</button><div class="lens__dots"></div></div>`,
  );
  const art = R.querySelector<HTMLElement>(".lens__art")!;
  const dots = R.querySelector(".lens__dots")!;
  const list = () => productsIn(cat);
  const show = () => {
    h.el.dataset.cat = cat;
    const ps = list();
    L.querySelectorAll<HTMLElement>("[data-c]").forEach((b) => b.classList.toggle("on", b.dataset.c === cat));
    if (!ps.length) {
      art.innerHTML = `<span class="lens__none">${cat}</span>`;
      dots.innerHTML = "";
      return;
    }
    i = (i + ps.length) % ps.length;
    const p = ps[i];
    art.innerHTML = `${p.image ? `<img src="${p.image}" alt="">` : `<span class="lens__none">PHOTO</span>`}<em>${p.placeholder ? "PLACEHOLDER" : p.title}</em>`;
    dots.innerHTML = ps.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
  };
  show();
  const open = () => openMerch(list()[i] ?? null);
  art.addEventListener("click", open);
  R.querySelectorAll<HTMLElement>(".lens__nav").forEach((b) =>
    b.addEventListener("click", () => {
      i += Number(b.dataset.d);
      show();
    }),
  );
  L.querySelectorAll<HTMLElement>("[data-c]").forEach((b) =>
    b.addEventListener("click", () => {
      cat = b.dataset.c as Category;
      i = 0;
      show();
      open();
    }),
  );
  const timer = window.setInterval(() => {
    if (list().length < 2) return;
    i += 1;
    show();
  }, 2400);
  h.cleanups.push(() => clearInterval(timer));
}

function tourScreen(h: Head) {
  let row = 0;
  const s = h.screen(
    "tour",
    `<div class="tour">
      <header><b>TOUR</b><em>SAMPLE</em><span class="tour__win"><button type="button" data-a="min" aria-label="Minimise"><i></i></button><button type="button" data-a="max" aria-label="Open tour"><i></i></button><button type="button" data-a="close" aria-label="Close"><i></i></button></span></header>
      <div class="tour__list"></div>
      <div class="tour__seek"><i></i></div>
      <footer>
        <button type="button" data-a="prev" aria-label="Previous">${ICON.prev}</button>
        <button type="button" data-a="play" aria-label="Open date">${ICON.play}</button>
        <button type="button" data-a="next" aria-label="Next">${ICON.next}</button>
        <button type="button" class="tour__tix" data-a="tix">TICKETS</button>
      </footer>
    </div>`,
  );
  const list = s.querySelector(".tour__list")!;
  const bar = s.querySelector<HTMLElement>(".tour__seek i")!;
  const paint = () => {
    h.el.dataset.row = String(row);
    list.innerHTML = SHOWS.map((show, n) => `<button type="button" class="tour__row${n === row ? " on" : ""}" data-n="${n}"><span>${show.date}</span><span><b>${show.city}</b>${show.venue}</span></button>`).join("");
    bar.style.width = `${((row + 1) / SHOWS.length) * 100}%`;
  };
  paint();
  list.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-n]");
    if (!b) return;
    row = Number(b.dataset.n);
    paint();
    openTour(row);
  });
  s.querySelector("[data-a=tix]")!.addEventListener("click", () => openTour(row));
  s.querySelector("[data-a=close]")!.addEventListener("click", () => closeHead(h.id));
  s.querySelector("[data-a=min]")!.addEventListener("click", () => closeHead(h.id));
  s.querySelector("[data-a=max]")!.addEventListener("click", () => openTour(row));
  s.querySelector("[data-a=prev]")!.addEventListener("click", () => {
    row = (row + SHOWS.length - 1) % SHOWS.length;
    paint();
  });
  s.querySelector("[data-a=next]")!.addEventListener("click", () => {
    row = (row + 1) % SHOWS.length;
    paint();
  });
  s.querySelector("[data-a=play]")!.addEventListener("click", () => openTour(row));
}

export function openHead(id: HeadId, from?: DOMRect, opts?: { crop?: "top" | "bottom" }) {
  const had = live.get(id);
  if (had) {
    if (opts?.crop) had.setCrop(true, opts.crop);
    else if (had.cropped) had.setCrop(false);
    raise(had.el);
    return had;
  }
  const h = new Head(id, from, opts?.crop);
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

export function setCrop(id: HeadId, on: boolean, edge: "top" | "bottom" = "top") {
  const h = live.get(id);
  if (!h) return;
  h.setCrop(on, edge);
  if (on) raise(h.el);
}

export const ALL: HeadId[] = ["tour", "music", "merch", "video"];

export function relayout() {
  const m = mobile();
  live.forEach((h) => {
    const img = h.el.querySelector<HTMLImageElement>(".head__img");
    if (img) {
      const next = "heads/" + (m ? h.data.srcSm : h.data.src);
      if (!img.src.endsWith(next)) img.src = next;
    }
    if (h.cropped) h.setCrop(true, h.edge);
    else h.layout();
  });
}

export function initDrag() {
  let drag: { h: Head; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null = null;
  document.addEventListener(
    "pointerdown",
    (e) => {
      const t = e.target as HTMLElement;
      if (t.closest(".win, .icon, .globe, button, a, input, .scr")) return;
      const order = [...live.values()].filter((h) => !h.cropped).sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex));
      const h = order.find((x) => x.hit(e.clientX, e.clientY));
      if (!h) return;
      raise(h.el);
      drag = { h, sx: e.clientX, sy: e.clientY, ox: h.x, oy: h.y, moved: false };
    },
    true,
  );
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
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
    addEventListener("click", (c) => {
      c.stopPropagation();
      c.preventDefault();
    }, { capture: true, once: true });
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
}
