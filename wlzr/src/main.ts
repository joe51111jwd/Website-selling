import "./style.css";
import { RECORD } from "./data";
import { ALL, initDrag, isOpen, onHeads, relayout, toggleAll, toggleHead, type HeadId } from "./heads";
import { calendar, cursor, film, folder, globe, speaker } from "./pixel";
import { radio } from "./radio";
import { wordmark } from "./wordmark";

const ICONS: { id: HeadId; label: string; svg: string; key: string }[] = [
  { id: "tour", label: "Tour", svg: calendar(), key: "1" },
  { id: "video", label: "Videos", svg: film(), key: "2" },
  { id: "music", label: "Music", svg: speaker(), key: "3" },
  { id: "merch", label: "Merch", svg: folder(), key: "4" },
];

const app = document.getElementById("app")!;
document.documentElement.style.setProperty("--cursor", cursor());
document.documentElement.style.setProperty("--cursor-dark", cursor("#1414ff"));

app.innerHTML = `
  <div class="tray tray--l" aria-live="off">
    <span class="onair"><i></i>ON AIR</span><span class="freq">${RECORD.station} <b>${RECORD.frequency}</b></span><span class="clock"></span>
  </div>
  <button class="tray tray--r globe" aria-label="Open or close every player" title="All players (A)">${globe()}</button>
  <h1 class="ml" aria-label="${RECORD.artist}"><span data-text="MAJOR LAZER">MAJOR LAZER</span></h1>
  <div class="wlzr"><canvas aria-hidden="true"></canvas><span class="sr">WLZR.TV, pirate television</span></div>
  <nav class="icons" aria-label="Players">${ICONS.map(
    (i) => `<button class="icon" data-id="${i.id}" aria-pressed="false" title="${i.label} (${i.key})">${i.svg}<span>${i.label}</span></button>`,
  ).join("")}</nav>
  <p class="hint">Click an icon. Drag the heads around.</p>
  <footer class="shock">
    <div class="ticker" aria-hidden="true"><div>${("◉ NOW BROADCASTING ON " + RECORD.station + " — " + RECORD.title.toUpperCase() + " — THE NEW RECORD FROM " + RECORD.artist.toUpperCase() + " — PIRATE SIGNAL " + RECORD.frequency + " — DON'T TOUCH THAT DIAL ").repeat(3)}</div></div>
    <a class="shock__logo" href="${RECORD.listenUrl}" aria-label="${RECORD.title}: listen">${shockLogo()}</a>
  </footer>
  <div id="layer"></div>`;

// icons
app.querySelectorAll<HTMLElement>(".icon").forEach((b) =>
  b.addEventListener("click", () => toggleHead(b.dataset.id as HeadId, b.getBoundingClientRect())),
);
const globeBtn = app.querySelector<HTMLElement>(".globe")!;
globeBtn.addEventListener("click", () => toggleAll(globeBtn.getBoundingClientRect()));
onHeads(() => {
  app.querySelectorAll<HTMLElement>(".icon").forEach((b) => {
    const on = isOpen(b.dataset.id as HeadId);
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  const any = ALL.some(isOpen);
  globeBtn.classList.toggle("on", ALL.every(isOpen));
  document.body.classList.toggle("has-heads", any);
});

addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea")) return;
  const i = ICONS.find((x) => x.key === e.key);
  if (i) toggleHead(i.id, app.querySelector(`.icon[data-id="${i.id}"]`)!.getBoundingClientRect());
  if (e.key === "a" || e.key === "A") toggleAll(globeBtn.getBoundingClientRect());
  if (e.key === " " && isOpen("music") && !(e.target as HTMLElement).closest("button")) { e.preventDefault(); radio.toggle(); }
});

// clock
const clock = app.querySelector(".clock")!;
const tick = () => (clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
tick();
setInterval(tick, 15000);

// on air light follows the radio
radio.on(() => document.body.classList.toggle("live", radio.playing));

initDrag();
let rz = 0;
addEventListener("resize", () => {
  cancelAnimationFrame(rz);
  rz = requestAnimationFrame(() => { relayout(); wm.resize(); });
});

const wm = wordmark(app.querySelector(".wlzr canvas")!);
boot();

function shockLogo() {
  // SH(globe)CK / THE SYSTEM. Stand-in for the record's lockup until the art file lands.
  return `<svg viewBox="0 0 330 110" xmlns="http://www.w3.org/2000/svg">
    <g font-family="Archivo, sans-serif" font-weight="900" font-style="italic" font-stretch="125%" fill="#fff" stroke="#0b0b0f" stroke-width="3" paint-order="stroke">
      <text x="6" y="64" font-size="66" letter-spacing="-4">SH</text><text x="218" y="64" font-size="66" letter-spacing="-4">CK</text>
    </g>
    <g transform="translate(176 40)" fill="none" stroke="#fff" stroke-width="5">
      <circle r="31" fill="#0b0b0f" stroke="#0b0b0f" stroke-width="7"/><circle r="27"/><ellipse rx="11" ry="27"/>
      <line x1="-27" x2="27"/><line y1="-27" y2="27"/>
      <path d="M-8 -40 L5 -3 L-5 3 L8 40" stroke="#fff" stroke-width="6" stroke-linejoin="bevel"/>
    </g>
    <text x="165" y="100" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-stretch="125%" font-size="27" letter-spacing="2" fill="#fff" stroke="#0b0b0f" stroke-width="2" paint-order="stroke">THE SYSTEM</text>
  </svg>`;
}

function boot() {
  let seen = false;
  try { seen = sessionStorage.getItem("wlzr-boot") === "1"; sessionStorage.setItem("wlzr-boot", "1"); } catch { /* private mode */ }
  if (seen || matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("noboot")) {
    document.body.classList.add("ready");
    return;
  }
  const b = document.createElement("div");
  b.className = "boot";
  b.innerHTML = `<pre></pre><div class="boot__bar"><i></i></div><p>click to skip</p>`;
  document.body.append(b);
  const lines = [
    "WLZR.TV PIRATE SIGNAL v2.0",
    "(c) LAZER BROADCASTING SYSTEMS. NO RIGHTS RESERVED.",
    "",
    `SCANNING ............ ${RECORD.frequency} MHz`,
    "SIGNAL ................. LOCKED",
    "LOADING HEADS ........ 4 FOUND",
    `NOW PLAYING .......... ${RECORD.title.toUpperCase()}`,
    "",
    "> SHOCK THE SYSTEM_",
  ];
  const pre = b.querySelector("pre")!, bar = b.querySelector<HTMLElement>(".boot__bar i")!;
  let k = 0;
  const done = () => {
    if (b.classList.contains("boot--out")) return;
    b.classList.add("boot--out");
    document.body.classList.add("ready");
    setTimeout(() => b.remove(), 650);
  };
  const step = setInterval(() => {
    pre.textContent += (lines[k] ?? "") + "\n";
    bar.style.width = `${((k + 1) / lines.length) * 100}%`;
    if (++k >= lines.length) { clearInterval(step); setTimeout(done, 380); }
  }, 150);
  b.addEventListener("click", () => { clearInterval(step); done(); });
}
