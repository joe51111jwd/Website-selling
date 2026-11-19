import "./style.css";
import { openVideo } from "./apps";
import { ALL, initDrag, isOpen, onHeads, openHead, relayout, setDock, toggleAll, toggleHead, type HeadId } from "./heads";
import { radio } from "./radio";
import { closeWindow, isWindowOpen, onWindow } from "./win";

const ICONS: { id: HeadId; label: string; src: string; key: string }[] = [
  { id: "tour", label: "Tour", src: "brand/icon-tour.png", key: "1" },
  { id: "video", label: "Videos", src: "brand/icon-video.png", key: "2" },
  { id: "music", label: "Music", src: "brand/icon-music.png", key: "3" },
  { id: "merch", label: "Merch", src: "brand/icon-merch.png", key: "4" },
];

const phone = () => innerWidth < 760;

const app = document.getElementById("app")!;
app.innerHTML = `
  <button class="globe" type="button" aria-label="Open or close every player">${globeImg()}</button>
  <h1 class="ml"><img src="brand/major-lazer.png" alt="Major Lazer"></h1>
  <div class="wlzr"><img src="brand/wlzr.png" alt="WLZR.TV"></div>
  <nav class="icons" aria-label="Players">${ICONS.map(
    (i) => `<button class="icon" type="button" data-id="${i.id}" aria-pressed="false" aria-label="${i.label}"><img src="${i.src}" alt=""></button>`,
  ).join("")}</nav>
  <footer class="shock"><img src="brand/shock.png" alt="Shock The System"></footer>
  <div id="layer"></div>`;

const globeBtn = app.querySelector<HTMLButtonElement>(".globe")!;

function sync() {
  app.querySelectorAll<HTMLElement>(".icon").forEach((b) => {
    const id = b.dataset.id as HeadId;
    const on = id === "video" && phone() ? isWindowOpen("video") : isOpen(id);
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  globeBtn.classList.toggle("on", ALL.every(isOpen));
}

app.querySelectorAll<HTMLElement>(".icon").forEach((b) => {
  b.addEventListener("click", () => {
    const id = b.dataset.id as HeadId;
    const from = b.getBoundingClientRect();
    if (id === "video" && phone()) {
      if (isWindowOpen("video")) closeWindow("video");
      else openVideo(0);
      return;
    }
    toggleHead(id, from);
  });
});

globeBtn.addEventListener("click", () => {
  if (isWindowOpen("video")) closeWindow("video");
  toggleAll(globeBtn.getBoundingClientRect());
});

onHeads(sync);
onWindow((id, open) => {
  if (id !== "video") return;
  const dock = open && phone();
  document.body.classList.toggle("m-video", dock);
  if (dock) {
    openHead("music");
    setDock("music", true);
  } else setDock("music", false);
  sync();
});

addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea")) return;
  const hit = ICONS.find((x) => x.key === e.key);
  if (hit) app.querySelector<HTMLElement>(`.icon[data-id="${hit.id}"]`)!.click();
  if (e.key === "a" || e.key === "A") globeBtn.click();
  if (e.key === " " && isOpen("music")) { e.preventDefault(); radio.toggle(); }
  if (e.key === "Escape" && isWindowOpen("video")) closeWindow("video");
});

initDrag();
let rz = 0;
addEventListener("resize", () => {
  cancelAnimationFrame(rz);
  rz = requestAnimationFrame(() => {
    relayout();
    if (!phone() && document.body.classList.contains("m-video")) {
      document.body.classList.remove("m-video");
      setDock("music", false);
    }
  });
});

function globeImg() {
  return `<img src="brand/globe.png" alt="">`;
}
