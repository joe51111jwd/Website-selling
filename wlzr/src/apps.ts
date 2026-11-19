// Pop-up windows that work with the heads: video player, playlist, equalizer, visuals, merch, tour.

import { PRODUCTS, RECORD, SHOWS, STORE_URL, TRACKS, VIDEOS, productsIn, type Category, type Product } from "./data";
import { EQ_BANDS, radio } from "./radio";
import { isWindowOpen, openWindow } from "./win";

const el = (html: string) => {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.firstElementChild as HTMLElement;
};

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const phone = () => innerWidth < 760;

let vIndex = 0;
let vEl: HTMLVideoElement | null = null;
const watchers = new Set<() => void>();

export function onVideo(fn: () => void) {
  watchers.add(fn);
  return () => watchers.delete(fn);
}
export function videoIndex() {
  return vIndex;
}
export function videoTime() {
  if (!vEl) return { now: 0, dur: 0, on: false };
  return { now: vEl.currentTime || 0, dur: Number.isFinite(vEl.duration) ? vEl.duration : 0, on: !vEl.paused };
}

function poke() {
  watchers.forEach((f) => f());
}

export function videoCmd(cmd: "play" | "stop" | "back" | "fwd" | "mute" | "prev" | "next" | "open") {
  const n = VIDEOS.length || 1;
  if (cmd === "prev" || cmd === "next") {
    vIndex = (vIndex + (cmd === "next" ? 1 : n - 1)) % n;
    poke();
    if (isWindowOpen("video")) openVideo(vIndex, phone());
    return;
  }
  if (cmd === "open" || (cmd === "play" && !isWindowOpen("video"))) {
    openVideo(vIndex, phone());
    return;
  }
  if (!vEl) return;
  if (cmd === "play") vEl.paused ? void vEl.play() : vEl.pause();
  if (cmd === "stop") {
    vEl.pause();
    vEl.currentTime = 0;
  }
  if (cmd === "back") vEl.currentTime = Math.max(0, vEl.currentTime - 5);
  if (cmd === "fwd") vEl.currentTime = Math.min(vEl.duration || 0, vEl.currentTime + 5);
  if (cmd === "mute") vEl.muted = !vEl.muted;
  poke();
}

export function openVideo(start = 0, showList = false) {
  vIndex = start;
  const body = el(`<div class="vp">
    <div class="vp__screen"><video playsinline preload="metadata"></video><p class="vp__miss" hidden>PLACEHOLDER. No video file yet.</p></div>
    <div class="vp__seek"><input type="range" min="0" max="1000" value="0" aria-label="Seek"></div>
    <div class="vp__row"><span class="vp__t">0:00</span><span class="vp__d">0:00</span></div>
    <div class="vp__ctl">
      <button data-a="first" aria-label="Previous"><i class="g-first"></i></button>
      <button data-a="back" aria-label="Back"><i class="g-back"></i></button>
      <button data-a="play" aria-label="Play"><i class="g-play"></i></button>
      <button data-a="stop" aria-label="Stop"><i class="g-stop"></i></button>
      <button data-a="fwd" aria-label="Forward"><i class="g-fwd"></i></button>
      <button data-a="last" aria-label="Next"><i class="g-last"></i></button>
      <button data-a="list" aria-label="Video list"><i class="g-list"></i></button>
      <span class="vp__vol"><i class="g-vol"></i><input type="range" min="0" max="100" value="80" aria-label="Volume"></span>
    </div>
    <div class="vp__pl"${showList ? "" : " hidden"}></div></div>`);
  const v = body.querySelector("video")!;
  vEl = v;
  const seek = body.querySelector<HTMLInputElement>(".vp__seek input")!;
  const t = body.querySelector(".vp__t")!;
  const d = body.querySelector(".vp__d")!;
  const pl = body.querySelector<HTMLElement>(".vp__pl")!;
  const miss = body.querySelector<HTMLElement>(".vp__miss")!;
  const playIcon = body.querySelector('[data-a="play"] i')!;
  const group = (shelf: "current" | "archive", label: string) => {
    const rows = VIDEOS.map((item, k) => ({ item, k })).filter((x) => x.item.shelf === shelf);
    if (!rows.length) return "";
    return `<p class="vp__shelf">${label}</p><ol>${rows
      .map(({ item, k }) => `<li class="${k === vIndex ? "on" : ""}"><button data-k="${k}">${
        item.poster ? `<img src="${item.poster}" alt="">` : `<i class="vp__ph"></i>`
      }<span>${item.title}${item.placeholder ? `<em>PLACEHOLDER</em>` : ""}</span></button></li>`)
      .join("")}</ol>`;
  };
  pl.innerHTML = group("current", "Videos") + group("archive", "Older videos");
  const load = (autoplay = true) => {
    const x = VIDEOS[vIndex];
    pl.querySelectorAll("li").forEach((li) => {
      const b = li.querySelector<HTMLElement>("[data-k]");
      li.classList.toggle("on", Number(b?.dataset.k) === vIndex);
    });
    miss.hidden = !!x?.src;
    const screen = body.querySelector<HTMLElement>(".vp__screen")!;
    screen.style.backgroundImage = x?.poster ? `url("${x.poster}")` : "none";
    if (x?.poster) v.poster = x.poster;
    else v.removeAttribute("poster");
    if (x?.src) {
      v.src = x.src;
      if (autoplay) void v.play().catch(() => {});
    } else {
      v.removeAttribute("src");
      v.load();
    }
    poke();
  };
  v.addEventListener("timeupdate", () => {
    seek.value = String((v.currentTime / (v.duration || 1)) * 1000);
    t.textContent = fmt(v.currentTime);
    d.textContent = fmt(v.duration || 0);
    poke();
  });
  v.addEventListener("loadedmetadata", () => (d.textContent = fmt(v.duration || 0)));
  v.addEventListener("play", () => {
    playIcon.className = "g-pause";
    poke();
  });
  v.addEventListener("pause", () => {
    playIcon.className = "g-play";
    poke();
  });
  v.addEventListener("click", () => (v.paused ? void v.play() : v.pause()));
  seek.addEventListener("input", () => {
    if (v.duration) v.currentTime = (Number(seek.value) / 1000) * v.duration;
  });
  body.querySelector<HTMLInputElement>(".vp__vol input")!.addEventListener("input", (e) => {
    v.volume = Number((e.target as HTMLInputElement).value) / 100;
  });
  const act: Record<string, () => void> = {
    play: () => (v.paused ? void v.play() : v.pause()),
    stop: () => {
      v.pause();
      v.currentTime = 0;
    },
    back: () => (v.currentTime = Math.max(0, v.currentTime - 5)),
    fwd: () => (v.currentTime = Math.min(v.duration || 0, v.currentTime + 5)),
    first: () => {
      vIndex = (vIndex - 1 + VIDEOS.length) % VIDEOS.length;
      load();
    },
    last: () => {
      vIndex = (vIndex + 1) % VIDEOS.length;
      load();
    },
    list: () => (pl.hidden = !pl.hidden),
  };
  body.querySelectorAll<HTMLElement>("[data-a]").forEach((b) => b.addEventListener("click", () => act[b.dataset.a!]()));
  pl.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-k]");
    if (!b) return;
    vIndex = Number(b.dataset.k);
    load();
  });
  const narrow = phone();
  openWindow({
    id: "video",
    title: "Video Player",
    body,
    width: narrow ? innerWidth : 620,
    x: narrow ? 0 : innerWidth * 0.46,
    y: narrow ? 0 : innerHeight * 0.1,
    onClose: () => {
      v.pause();
      if (vEl === v) vEl = null;
      poke();
    },
  });
  load();
}

export function openPlaylist() {
  const rows = TRACKS.map((t, i) => `<li data-i="${i}"><button type="button">${t.title}${
    t.placeholder ? `<em>PLACEHOLDER</em>` : ""
  }${t.audio ? "" : `<em>NO AUDIO</em>`}</button></li>`).join("");
  const body = el(`<div class="pl"><p class="pl__rec">${RECORD.title}</p><p class="pl__who">${RECORD.artist}</p><ol>${rows}</ol></div>`);
  const paint = () => body.querySelectorAll("li").forEach((li) => li.classList.toggle("on", Number((li as HTMLElement).dataset.i) === radio.index));
  body.addEventListener("click", (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>("li");
    if (!li) return;
    const jump = Number(li.dataset.i) - radio.index;
    if (jump) radio.skip(jump);
    radio.play();
    paint();
  });
  paint();
  const off = radio.on(paint);
  openWindow({ id: "playlist", title: "Playlist", body, width: 320, x: innerWidth * 0.16, y: innerHeight * 0.22, onClose: () => off() });
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
  const body = el(`<div class="vis"><canvas width="640" height="280"></canvas><p class="vis__note"></p></div>`);
  const note = body.querySelector(".vis__note")!;
  note.textContent = radio.hasFile ? "" : "PLACEHOLDER. No audio file. Bars are display motion only.";
  const cv = body.querySelector("canvas")!;
  const g = cv.getContext("2d")!;
  let alive = true;
  const lv = new Float32Array(48);
  const draw = () => {
    if (!alive) return;
    requestAnimationFrame(draw);
    const w = cv.width, h = cv.height;
    g.fillStyle = "#07010a";
    g.fillRect(0, 0, w, h);
    radio.levels(lv.length, lv);
    const bw = w / lv.length;
    for (let i = 0; i < lv.length; i++) {
      const bh = Math.max(2, lv[i] * (h - 16));
      g.fillStyle = i % 6 === 0 ? "#ff2a1a" : "#ff5a28";
      g.fillRect(i * bw + 1, h - bh - 6, bw - 2, bh);
    }
  };
  draw();
  openWindow({ id: "visuals", title: "Visuals", body, width: 520, x: innerWidth * 0.28, y: innerHeight * 0.16, onClose: () => (alive = false) });
}

export function openOptions() {
  const body = el(`<div class="op">
    <label>Volume <input type="range" min="0" max="100" value="${Math.round(radio.volume * 100)}" aria-label="Volume"></label>
    <label class="op__chk"><input type="checkbox" ${radio.repeat ? "checked" : ""}> Repeat</label>
    <p class="op__note">${radio.hasFile ? "Audio file connected." : "PLACEHOLDER. No audio file on this track."}</p>
  </div>`);
  body.querySelector<HTMLInputElement>("input[type=range]")!.addEventListener("input", (e) => radio.setVolume(Number((e.target as HTMLInputElement).value) / 100));
  body.querySelector<HTMLInputElement>("input[type=checkbox]")!.addEventListener("change", (e) => (radio.repeat = (e.target as HTMLInputElement).checked));
  openWindow({ id: "options", title: "Options", body, width: 300, x: innerWidth * 0.4, y: innerHeight * 0.28 });
}

function storeHref(url: string | null) {
  return url || STORE_URL;
}

export function openMerch(p: Product | null) {
  const href = storeHref(p?.url ?? null);
  const shot = p?.image ? `<img src="${p.image}" alt="">` : `<p class="mw__empty">PHOTO NEEDED</p>`;
  const link = href
    ? `<a class="mw__go" href="${href}" target="_blank" rel="noopener">Open store</a>`
    : `<p class="mw__go mw__go--off">Store link not supplied</p>`;
  const body = el(`<div class="mw">
    <p class="mw__tag">${p?.placeholder ? "PLACEHOLDER" : p?.category ?? "Merch"}</p>
    ${shot}
    <div class="mw__meta"><b>${p?.title ?? "Merch"}</b><span>${p?.detail ?? ""}</span>${link}</div>
  </div>`);
  openWindow({
    id: "merch",
    title: p?.category ?? "Merch",
    body,
    width: phone() ? innerWidth : 520,
    theme: "blue",
    x: phone() ? 0 : innerWidth * 0.48,
    y: phone() ? 0 : innerHeight * 0.12,
  });
}

export function openTour(focus = 0) {
  const rows = SHOWS.map((s, n) => {
    const tix = s.tickets
      ? `<a href="${s.tickets}" target="_blank" rel="noopener">Buy tickets</a>`
      : `<span class="tw__off">Ticket link not supplied</span>`;
    const merchUrl = storeHref(s.merch);
    const merch = merchUrl
      ? `<a href="${merchUrl}" target="_blank" rel="noopener">Add-on merch</a>`
      : `<span class="tw__off">Merch link not supplied</span>`;
    return `<li class="${n === focus ? "on" : ""}"><span class="tw__date">${s.date}</span><span class="tw__where"><b>${s.city}</b>${s.venue}</span><span class="tw__acts">${tix}${merch}</span></li>`;
  }).join("");
  const body = el(`<div class="tw"><p class="tw__tag">PLACEHOLDER dates from the design deck. Not a confirmed tour.</p><p class="tw__lede">${RECORD.artist}</p><ol>${rows}</ol></div>`);
  openWindow({
    id: "tour",
    title: "Tour",
    body,
    width: phone() ? innerWidth : 520,
    theme: "blue",
    x: phone() ? 0 : innerWidth * 0.42,
    y: phone() ? 0 : innerHeight * 0.16,
  });
}

export function firstProduct(cat: Category | null) {
  return productsIn(cat)[0] ?? PRODUCTS[0] ?? null;
}
