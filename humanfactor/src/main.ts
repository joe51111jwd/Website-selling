// Enhancement only: without JavaScript every page reads in full.
document.documentElement.classList.add("js");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Header: hides on the way down, returns on the way up, and goes solid once off the top.
const bar = document.querySelector<HTMLElement>("[data-top]");
let lastY = scrollY;
const onScroll = () => {
  const y = scrollY;
  bar?.toggleAttribute("data-solid", y > 40);
  bar?.toggleAttribute("data-hide", y > 300 && y > lastY && !bar.hasAttribute("data-open"));
  lastY = y;
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Fullscreen menu.
const burger = document.querySelector<HTMLButtonElement>("[data-burger]");
const setMenu = (open: boolean) => {
  burger?.setAttribute("aria-expanded", String(open));
  bar?.toggleAttribute("data-open", open);
  document.documentElement.classList.toggle("lock", open);
};
burger?.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && bar?.hasAttribute("data-open")) {
    setMenu(false);
    burger?.focus();
  }
});

// The home story: three.js rings, loaded only where they are used.
const story = document.querySelector<HTMLElement>("[data-story]");
if (story) {
  const stage = story.querySelector<HTMLElement>(".stage")!;
  const canvas = story.querySelector<HTMLCanvasElement>("[data-rings]")!;
  const label = story.querySelector<HTMLElement>("[data-scene-label]");
  const names = ["Stakeholder Risk", "Alignment", "Strain", "Measured"];
  new MutationObserver(() => {
    const n = Number(stage.dataset.stage ?? 0);
    if (label) label.textContent = `0${n} / ${names[n]}`;
  }).observe(stage, { attributes: true, attributeFilter: ["data-stage"] });
  import("./rings").then(({ mountRings }) => mountRings(canvas, stage, story));
}

// Words of the definition darken as it scrolls through.
document.querySelectorAll<HTMLElement>("[data-say]").forEach((el) => {
  const words = (el.textContent ?? "").trim().split(/\s+/);
  el.textContent = "";
  const spans = words.map((w, i) => {
    const s = document.createElement("span");
    s.textContent = w;
    el.append(s);
    if (i < words.length - 1) el.append(" ");
    return s;
  });
  if (reduced) return spans.forEach((s) => s.classList.add("on"));
  const tick = () => {
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const n = Math.round(f * spans.length);
    spans.forEach((s, i) => s.classList.toggle("on", i < n));
  };
  addEventListener("scroll", tick, { passive: true });
  tick();
});

// Reveal, and count the record up once it is in view.
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      el.setAttribute("data-in", "");
      io.unobserve(el);
      const dd = el.querySelector<HTMLElement>("[data-count]");
      if (dd && !reduced) countUp(dd);
    }
  },
  { rootMargin: "0px 0px -8% 0px" },
);
document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
  const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal")) : [];
  el.style.setProperty("--r", String(Math.max(0, sibs.indexOf(el)) % 8));
  io.observe(el);
});

function countUp(el: HTMLElement) {
  const to = Number(el.dataset.count), dp = Number(el.dataset.dp ?? 0);
  const pre = el.dataset.pre ?? "", suf = el.dataset.suf ?? "";
  const t0 = performance.now(), dur = 1600;
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    const v = to * (1 - Math.pow(1 - k, 4));
    el.textContent = pre + v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }) + suf;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// The Index's sample question.
const quiz = document.querySelector<HTMLFormElement>("[data-quiz]");
const reads = [
  "Low exposure. Authority is documented and tested. Most companies only think they are here.",
  "Moderate exposure. It works until the first real disagreement, or the first new board seat.",
  "Elevated exposure. Every hard call re-opens the question of who decides.",
  "High exposure. Decisions stall at the top, and buyers will find it in diligence.",
];
quiz?.addEventListener("change", (e) => {
  const v = Number((e.target as HTMLInputElement).value);
  const out = quiz.querySelector<HTMLElement>("[data-quiz-out]");
  if (out) out.textContent = `${reads[v]} The full HumanFactor Index™ is scored in a briefing.`;
});

// The briefing form: composes an email to the advisory team (no data leaves the page otherwise).
const brief = document.querySelector<HTMLFormElement>("[data-brief]");
brief?.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(brief);
  const body = ["name", "email", "company", "role", "band", "note"].map((k) => `${k[0].toUpperCase()}${k.slice(1)}: ${d.get(k) ?? ""}`).join("\n");
  location.href = `mailto:advisory@stakeholderrisk.com?subject=${encodeURIComponent(`Briefing request: ${d.get("company") || d.get("name")}`)}&body=${encodeURIComponent(body)}`;
});

export {};
