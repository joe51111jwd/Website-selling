import "./style.css";
import { openMerch, openTour, openVideo, videoCmd } from "./apps";
import { productsIn } from "./data";
import { ALL, closeHead, initDrag, isOpen, onHeads, openHead, relayout, setCrop, type HeadId } from "./heads";
import { radio } from "./radio";
import { closeEveryWindow, closeWindow, isWindowOpen, onWindow } from "./win";

const ICONS: { id: HeadId; label: string; src: string; key: string }[] = [
  { id: "tour", label: "Tour", src: "brand/icon-tour.png", key: "1" },
  { id: "video", label: "Videos", src: "brand/icon-video.png", key: "2" },
  { id: "music", label: "Music", src: "brand/icon-music.png", key: "3" },
  { id: "merch", label: "Merch", src: "brand/icon-merch.png", key: "4" },
];

const phone = () => innerWidth < 760;
type Section = HeadId | "stack" | null;

const app = document.getElementById("app")!;
app.innerHTML = `
  <img class="lockup" src="brand/lockup.png" alt="Major Lazer">
  <button class="globe" type="button" aria-label="Open or close the players"><img src="brand/globe.png" alt=""></button>
  <h1 class="ml"><img src="brand/major-lazer.png" alt="Major Lazer"></h1>
  <div class="wlzr"><img src="brand/wlzr.png" alt="WLZR.TV"></div>
  <nav class="icons" aria-label="Players">${ICONS.map(
    (i) => `<button class="icon" type="button" data-id="${i.id}" aria-pressed="false" aria-label="${i.label}"><img src="${i.src}" alt=""></button>`,
  ).join("")}</nav>
  <footer class="shock"><img src="brand/shock.png" alt="Shock The System"></footer>
  <div id="layer"></div>`;

if (new URLSearchParams(location.search).has("boxes")) document.body.classList.add("boxes");

const globeBtn = app.querySelector<HTMLButtonElement>(".globe")!;

function sectionFromHash(): Section {
  const id = location.hash.replace("#", "");
  if (id === "stack") return "stack";
  if (ICONS.some((i) => i.id === id)) return id as HeadId;
  return null;
}

function sync() {
  const section = sectionFromHash();
  app.querySelectorAll<HTMLElement>(".icon").forEach((b) => {
    const id = b.dataset.id as HeadId;
    const on = section === id;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  globeBtn.classList.toggle("on", ALL.every(isOpen) || (phone() && section === "stack"));
}

function show(section: Section) {
  closeEveryWindow();
  ALL.forEach((id) => closeHead(id));
  document.body.classList.remove("m-video", "m-sheet");
  if (!section) {
    sync();
    return;
  }
  const m = phone();
  if (section === "stack") {
    openHead("music");
    openHead("video");
    relayout();
    sync();
    return;
  }
  if (section === "music") {
    openHead("music");
    sync();
    return;
  }
  if (section === "video") {
    if (m) {
      document.body.classList.add("m-video");
      openHead("music", undefined, { crop: "bottom" });
      openVideo(0, true);
    } else {
      openHead("video");
      openVideo(0, false);
    }
    sync();
    return;
  }
  if (section === "merch") {
    if (m) {
      document.body.classList.add("m-sheet");
      openHead("merch", undefined, { crop: "top" });
    } else openHead("merch");
    openMerch(productsIn("T-Shirts")[0] ?? null);
    sync();
    return;
  }
  if (m) {
    document.body.classList.add("m-sheet");
    openHead("tour", undefined, { crop: "top" });
    openTour(0);
  } else openHead("tour");
  sync();
}

function setHash(hash: string) {
  history.replaceState(null, "", `${location.pathname}${location.search}${hash}`);
}

function go(id: HeadId) {
  const next = location.hash === `#${id}` ? "" : `#${id}`;
  setHash(next);
  show(next ? id : null);
}

app.querySelectorAll<HTMLElement>(".icon").forEach((b) => {
  b.addEventListener("click", () => go(b.dataset.id as HeadId));
});

globeBtn.addEventListener("click", () => {
  const allUp = phone() ? sectionFromHash() === "stack" : ALL.every(isOpen);
  if (allUp) {
    setHash("");
    show(null);
    return;
  }
  if (phone()) {
    setHash("#stack");
    show("stack");
    return;
  }
  setHash("");
  show(null);
  ALL.forEach((id, k) => setTimeout(() => openHead(id), k * 80));
});

onHeads(sync);
onWindow((id, open) => {
  if (phone() && id === "video" && !open) {
    document.body.classList.remove("m-video");
    setCrop("music", false);
  }
  if (phone() && (id === "merch" || id === "tour") && !open) document.body.classList.remove("m-sheet");
  sync();
});

addEventListener("hashchange", () => show(sectionFromHash()));

addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea")) return;
  const hit = ICONS.find((x) => x.key === e.key);
  if (hit) app.querySelector<HTMLElement>(`.icon[data-id="${hit.id}"]`)!.click();
  if (e.key === "a" || e.key === "A") globeBtn.click();
  if (e.key === " " && isOpen("music")) {
    e.preventDefault();
    radio.toggle();
  }
  if (e.key === "Escape") {
    if (isWindowOpen("video")) closeWindow("video");
    else if (location.hash) {
      setHash("");
      show(null);
    }
  }
  if (e.key === "ArrowRight" && isOpen("video")) videoCmd("next");
  if (e.key === "ArrowLeft" && isOpen("video")) videoCmd("prev");
});

initDrag();
let rz = 0;
addEventListener("resize", () => {
  cancelAnimationFrame(rz);
  rz = requestAnimationFrame(() => {
    const section = sectionFromHash();
    if (!phone() && document.body.classList.contains("m-video")) document.body.classList.remove("m-video");
    if (section && section !== "stack") show(section);
    else relayout();
  });
});

show(sectionFromHash());
