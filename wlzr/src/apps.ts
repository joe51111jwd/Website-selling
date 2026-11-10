// The windows the heads open: the video player, a product page, the tour list.

import { RECORD, SHOWS, VIDEOS, type Product } from "./data";
import { productArt } from "./merch-art";
import { openWindow } from "./win";

const el = (html: string) => {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d;
};
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function openVideo(start = 0) {
  let i = start;
  const body = el(`<div class="vp">
    <div class="vp__screen"><video playsinline preload="auto"></video><iframe class="vp__yt" hidden allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video"></iframe></div>
    <div class="vp__seek"><input type="range" min="0" max="1000" value="0" aria-label="Seek"></div>
    <div class="vp__row"><span class="vp__t">0:00</span><span class="vp__d">0:00</span></div>
    <div class="vp__ctl">
      <button data-a="first" aria-label="First"><i class="g-first"></i></button><button data-a="back" aria-label="Back"><i class="g-back"></i></button>
      <button data-a="play" aria-label="Play"><i class="g-play"></i></button><button data-a="stop" aria-label="Stop"><i class="g-stop"></i></button>
      <button data-a="fwd" aria-label="Forward"><i class="g-fwd"></i></button><button data-a="last" aria-label="Last"><i class="g-last"></i></button>
      <button data-a="list" aria-label="Playlist"><i class="g-list"></i></button>
      <span class="vp__vol"><i class="g-vol"></i><input type="range" min="0" max="100" value="80" aria-label="Volume"></span>
    </div>
    <ol class="vp__pl" hidden></ol></div>`);
  const v = body.querySelector("video")!, yt = body.querySelector<HTMLIFrameElement>(".vp__yt")!;
  const seek = body.querySelector<HTMLInputElement>(".vp__seek input")!;
  const t = body.querySelector(".vp__t")!, d = body.querySelector(".vp__d")!;
  const pl = body.querySelector<HTMLOListElement>(".vp__pl")!;
  const playIcon = body.querySelector('[data-a="play"] i')!;
  pl.innerHTML = VIDEOS.map((x, k) => `<li><button data-k="${k}"><img src="${x.poster}" alt=""><span>${x.title}</span><em>${x.length}</em></button></li>`).join("");
  const load = (autoplay = true) => {
    const x = VIDEOS[i];
    win.querySelector(".win__title")!.textContent = `Video Player — ${x.title}`;
    pl.querySelectorAll("li").forEach((li, k) => li.classList.toggle("on", k === i));
    if (x.youtube) {
      v.pause(); v.hidden = true; yt.hidden = false;
      yt.src = `https://www.youtube-nocookie.com/embed/${x.youtube}?autoplay=1&rel=0`;
      return;
    }
    yt.hidden = true; yt.src = "about:blank"; v.hidden = false;
    v.src = x.loop; v.poster = x.poster; v.loop = true;
    if (autoplay) void v.play().catch(() => {});
  };
  v.addEventListener("timeupdate", () => {
    seek.value = String((v.currentTime / (v.duration || 1)) * 1000);
    t.textContent = fmt(v.currentTime);
    d.textContent = fmt(v.duration || 0);
  });
  v.addEventListener("play", () => (playIcon.className = "g-pause"));
  v.addEventListener("pause", () => (playIcon.className = "g-play"));
  v.addEventListener("click", () => (v.paused ? v.play() : v.pause()));
  seek.addEventListener("input", () => (v.currentTime = (Number(seek.value) / 1000) * (v.duration || 0)));
  body.querySelector<HTMLInputElement>(".vp__vol input")!.addEventListener("input", (e) => (v.volume = Number((e.target as HTMLInputElement).value) / 100));
  const act: Record<string, () => void> = {
    play: () => (v.paused ? void v.play() : v.pause()),
    stop: () => { v.pause(); v.currentTime = 0; },
    back: () => (v.currentTime = Math.max(0, v.currentTime - 5)),
    fwd: () => (v.currentTime = Math.min(v.duration, v.currentTime + 5)),
    first: () => { i = (i - 1 + VIDEOS.length) % VIDEOS.length; load(); },
    last: () => { i = (i + 1) % VIDEOS.length; load(); },
    list: () => (pl.hidden = !pl.hidden),
  };
  body.querySelectorAll<HTMLElement>("[data-a]").forEach((b) => b.addEventListener("click", () => act[b.dataset.a!]()));
  pl.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-k]");
    if (b) { i = Number(b.dataset.k); load(); }
  });
  const win = openWindow({ id: "video", title: "Video Player", body, width: 560, x: innerWidth * 0.36, y: innerHeight * 0.12, onClose: () => { v.pause(); yt.src = "about:blank"; } });
  load();
}

export function openMerch(p: Product) {
  const body = el(`<div class="mw"><div class="mw__art">${productArt(p)}</div>
    <div class="mw__info"><h3>${p.name}</h3><p class="mw__price">${p.price}</p>
      <div class="mw__sizes" role="radiogroup" aria-label="Size">${["S", "M", "L", "XL", "2XL"].map((s, k) => `<button role="radio" aria-checked="${k === 2}" class="${k === 2 ? "on" : ""}">${s}</button>`).join("")}</div>
      <a class="mw__buy" href="${p.url}" target="_blank" rel="noopener">ADD TO CART</a>
      <p class="mw__note">Ships from the ${RECORD.title} store.</p></div></div>`);
  body.querySelectorAll<HTMLElement>(".mw__sizes button").forEach((b) =>
    b.addEventListener("click", () => body.querySelectorAll(".mw__sizes button").forEach((x) => {
      x.classList.toggle("on", x === b);
      x.setAttribute("aria-checked", String(x === b));
    })),
  );
  const w = openWindow({ id: "merch", title: p.name, body, width: 520, theme: "blue", x: innerWidth * 0.52, y: innerHeight * 0.14 });
  w.querySelector(".win__title")!.textContent = p.name;
  w.querySelector(".win__body")!.replaceChildren(body);
}

export function openTour() {
  const body = el(`<div class="tw"><p class="tw__lede">${RECORD.artist} — ${RECORD.title} World Tour</p><ol>${SHOWS.map(
    (s) => `<li><span class="tw__date">${s.date}</span><span class="tw__where"><b>${s.city}</b>${s.venue}</span>
      <a href="${s.tickets}" target="_blank" rel="noopener">Tickets</a></li>`,
  ).join("")}</ol><p class="tw__more">More dates soon. Tune in.</p></div>`);
  openWindow({ id: "tour", title: "TOUR.EXE — Dates", body, width: 560, theme: "blue", x: innerWidth * 0.1, y: innerHeight * 0.18 });
}
