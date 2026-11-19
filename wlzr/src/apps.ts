// Pop-up windows the heads open: video player, playlist, equalizer, visuals, merch, tour.

import { RECORD, SHOWS, VIDEOS, productsIn, type Category, type Product } from "./data";
import { EQ_BANDS, radio } from "./radio";
import { openWindow } from "./win";

const el = (html: string) => {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.firstElementChild as HTMLElement;
};

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export function openVideo(start = 0, showList = false) {
  let i = start;
  const body = el(`<div class="vp">
    <div class="vp__screen"><video playsinline preload="metadata"></video></div>
    <div class="vp__seek"><input type="range" min="0" max="1000" value="0" aria-label="Seek"></div>
    <div class="vp__row"><span class="vp__t">0:00</span><span class="vp__d">0:00</span></div>
    <div class="vp__ctl">
      <button data-a="first" aria-label="Previous"><i class="g-first"></i></button>
      <button data-a="back" aria-label="Back"><i class="g-back"></i></button>
      <button data-a="play" aria-label="Play"><i class="g-play"></i></button>
      <button data-a="stop" aria-label="Stop"><i class="g-stop"></i></button>
      <button data-a="fwd" aria-label="Forward"><i class="g-fwd"></i></button>
      <button data-a="last" aria-label="Next"><i class="g-last"></i></button>
      <button data-a="list" aria-label="Playlist"><i class="g-list"></i></button>
      <span class="vp__vol"><i class="g-vol"></i><input type="range" min="0" max="100" value="80" aria-label="Volume"></span>
    </div>
    <ol class="vp__pl"${showList ? "" : " hidden"}></ol></div>`);
  const v = body.querySelector("video")!;
  const seek = body.querySelector<HTMLInputElement>(".vp__seek input")!;
  const t = body.querySelector(".vp__t")!, d = body.querySelector(".vp__d")!;
  const pl = body.querySelector<HTMLOListElement>(".vp__pl")!;
  const playIcon = body.querySelector('[data-a="play"] i')!;
  pl.innerHTML = VIDEOS.map((x, k) => `<li><button data-k="${k}"><img src="${x.poster}" alt=""><span>${x.label}</span></button></li>`).join("");
  const load = (autoplay = true) => {
    const x = VIDEOS[i];
    pl.querySelectorAll("li").forEach((li, k) => li.classList.toggle("on", k === i));
    v.src = x.loop;
    v.poster = x.poster;
    v.loop = true;
    if (autoplay) void v.play().catch(() => {});
  };
  v.addEventListener("timeupdate", () => {
    seek.value = String((v.currentTime / (v.duration || 1)) * 1000);
    t.textContent = fmt(v.currentTime);
    d.textContent = fmt(v.duration || 0);
  });
  v.addEventListener("loadedmetadata", () => (d.textContent = fmt(v.duration || 0)));
  v.addEventListener("play", () => (playIcon.className = "g-pause"));
  v.addEventListener("pause", () => (playIcon.className = "g-play"));
  v.addEventListener("click", () => (v.paused ? void v.play() : v.pause()));
  seek.addEventListener("input", () => (v.currentTime = (Number(seek.value) / 1000) * (v.duration || 0)));
  body.querySelector<HTMLInputElement>(".vp__vol input")!.addEventListener("input", (e) => (v.volume = Number((e.target as HTMLInputElement).value) / 100));
  const act: Record<string, () => void> = {
    play: () => (v.paused ? void v.play() : v.pause()),
    stop: () => { v.pause(); v.currentTime = 0; },
    back: () => (v.currentTime = Math.max(0, v.currentTime - 5)),
    fwd: () => (v.currentTime = Math.min(v.duration || 0, v.currentTime + 5)),
    first: () => { i = (i - 1 + VIDEOS.length) % VIDEOS.length; load(); },
    last: () => { i = (i + 1) % VIDEOS.length; load(); },
    list: () => (pl.hidden = !pl.hidden),
  };
  body.querySelectorAll<HTMLElement>("[data-a]").forEach((b) => b.addEventListener("click", () => act[b.dataset.a!]()));
  pl.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-k]");
    if (b) { i = Number(b.dataset.k); load(); }
  });
  const narrow = innerWidth < 760;
  openWindow({
    id: "video",
    title: "Video Player",
    body,
    width: narrow ? innerWidth : 640,
    x: narrow ? 0 : innerWidth * 0.34,
    y: narrow ? 0 : innerHeight * 0.08,
    onClose: () => v.pause(),
  });
  load();
}

export function openPlaylist() {
  const body = el(`<div class="pl"><p class="pl__rec">${RECORD.title}</p><p class="pl__who">${RECORD.artist}</p>
    <ol>${TRACKS_ROWS()}</ol></div>`);
  body.querySelector("button")!.addEventListener("click", () => radio.play());
  const sync = () => body.querySelector("li")!.classList.toggle("on", radio.playing);
  sync();
  const off = radio.on(sync);
  openWindow({ id: "playlist", title: "Playlist", body, width: 320, x: innerWidth * 0.18, y: innerHeight * 0.2, onClose: () => off() });
}

function TRACKS_ROWS() {
  return `<li class="on"><button type="button">Rotate</button></li>`;
}

export function openEq() {
  const bands = EQ_BANDS.map((hz, i) => {
    const label = hz >= 1000 ? `${hz / 1000}K` : String(hz);
    return `<label class="eq__band"><input type="range" min="-12" max="12" step="1" value="${radio.eqAt(i)}" data-i="${i}" aria-label="${label} Hz"><span>${label}</span></label>`;
  }).join("");
  const body = el(`<div class="eq">
    <label class="eq__pre">Preamp<input type="range" min="0" max="100" value="${Math.round(radio.volume * 100)}" aria-label="Preamp"></label>
    <div class="eq__bands">${bands}</div>
    <button type="button" class="eq__flat" data-a="flat">Flat</button>
  </div>`);
  body.querySelector<HTMLInputElement>(".eq__pre input")!.addEventListener("input", (e) => radio.setVolume(Number((e.target as HTMLInputElement).value) / 100));
  body.querySelectorAll<HTMLInputElement>(".eq__band input").forEach((input) => {
    input.addEventListener("input", () => radio.setEq(Number(input.dataset.i), Number(input.value)));
  });
  body.querySelector("[data-a=flat]")!.addEventListener("click", () => {
    body.querySelectorAll<HTMLInputElement>(".eq__band input").forEach((input) => {
      input.value = "0";
      radio.setEq(Number(input.dataset.i), 0);
    });
  });
  openWindow({ id: "eq", title: "Equalizer", body, width: 460, x: innerWidth * 0.22, y: innerHeight * 0.18 });
}

export function openVisuals() {
  const body = el(`<div class="vis"><canvas width="640" height="280"></canvas></div>`);
  const cv = body.querySelector("canvas")!;
  const g = cv.getContext("2d")!;
  let raf = 0;
  let alive = true;
  const lv = new Float32Array(48);
  const draw = () => {
    if (!alive) return;
    raf = requestAnimationFrame(draw);
    const w = cv.width, h = cv.height;
    g.fillStyle = "#07010a";
    g.fillRect(0, 0, w, h);
    radio.levels(lv.length, lv);
    const bw = w / lv.length;
    for (let i = 0; i < lv.length; i++) {
      const v = radio.playing ? lv[i] : 0.08 + 0.06 * Math.sin(performance.now() / 280 + i * 0.4);
      const bh = Math.max(2, v * (h - 16));
      g.fillStyle = i % 6 === 0 ? "#ff2a1a" : "#ff5a28";
      g.fillRect(i * bw + 1, h - bh - 6, bw - 2, bh);
    }
  };
  draw();
  openWindow({ id: "visuals", title: "Visuals", body, width: 520, x: innerWidth * 0.28, y: innerHeight * 0.16, onClose: () => { alive = false; cancelAnimationFrame(raf); } });
}

export function openOptions() {
  const body = el(`<div class="op">
    <label>Volume <input type="range" min="0" max="100" value="${Math.round(radio.volume * 100)}" aria-label="Volume"></label>
    <label class="op__chk"><input type="checkbox" ${radio.repeat ? "checked" : ""}> Repeat</label>
  </div>`);
  body.querySelector<HTMLInputElement>("input[type=range]")!.addEventListener("input", (e) => radio.setVolume(Number((e.target as HTMLInputElement).value) / 100));
  body.querySelector<HTMLInputElement>("input[type=checkbox]")!.addEventListener("change", (e) => (radio.repeat = (e.target as HTMLInputElement).checked));
  openWindow({ id: "options", title: "Options", body, width: 280, x: innerWidth * 0.4, y: innerHeight * 0.28 });
}

export function openMerch(p: Product | null) {
  const shot = p?.image;
  const body = el(`<div class="mw">${shot ? `<img src="${shot}" alt="${p!.label}">` : `<p class="mw__empty">${p?.label ?? "Merch"}</p>`}</div>`);
  openWindow({ id: "merch", title: "Merch", body, width: 520, theme: "blue", x: innerWidth * 0.46, y: innerHeight * 0.12 });
}

export function openTour() {
  const rows = SHOWS.map((s) => `<li><span class="tw__date">${s.date}</span><span class="tw__where"><b>${s.city}</b>${s.venue}</span></li>`).join("");
  const body = el(`<div class="tw"><p class="tw__lede">${RECORD.artist}</p><ol>${rows}</ol></div>`);
  openWindow({ id: "tour", title: "Tour", body, width: 520, theme: "blue", x: innerWidth * 0.12, y: innerHeight * 0.16 });
}

export function firstProduct(cat: Category | null) {
  return productsIn(cat)[0] ?? null;
}

