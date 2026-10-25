const $ = s => document.querySelector(s);
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- hero: scroll-scrubbed Blender frames ---------- */
const N = 48, frames = [], hero = $(".hero"), cv = $("#lake"), ctx = cv.getContext("2d");
let loaded = 0, cur = 0, target = 0;
for (let i = 1; i <= N; i++) {
  const im = new Image();
  im.decoding = "async";
  im.src = `/frames/f${String(i).padStart(3, "0")}.webp`;
  im.onload = () => { if (++loaded === N) { cv.classList.add("on"); draw(); } };
  frames.push(im);
}
function size() {
  const d = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * d; cv.height = innerHeight * d;
  draw();
}
function blit(im, a) {
  if (!im.complete || !im.naturalWidth) return;
  const s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
  const w = im.naturalWidth * s, h = im.naturalHeight * s;
  ctx.globalAlpha = a;
  ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
}
function draw() {
  const f = cur * (N - 1), i = Math.floor(f), t = f - i;
  ctx.globalAlpha = 1;
  blit(frames[i], 1);
  if (t > 0.01 && frames[i + 1]) blit(frames[i + 1], t);
}
function heroProgress() {
  const r = hero.getBoundingClientRect();
  return Math.min(Math.max(-r.top / (r.height - innerHeight), 0), 1);
}
const reveal = [...document.querySelectorAll("[data-at]")];
const nav = $(".nav"), scrollHint = $(".hero-scroll"), name = $(".hero-name");
function onScroll() {
  target = heroProgress();
  reveal.forEach(el => el.classList.toggle("in", target >= +el.dataset.at));
  scrollHint.style.opacity = target > 0.05 ? 0 : 1;
  name.style.setProperty("--p", target);
  nav.classList.toggle("dark", hero.getBoundingClientRect().bottom < 80);
}
(function tick() {
  const next = still ? target : cur + (target - cur) * 0.12;
  if (Math.abs(next - cur) > 0.0004) { cur = next; draw(); }
  requestAnimationFrame(tick);
})();
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", size);
size(); onScroll();

/* ---------- proof: count up once ---------- */
new IntersectionObserver((es, o) => {
  if (!es[0].isIntersecting) return; o.disconnect();
  document.querySelectorAll("[data-count]").forEach(el => {
    const end = +el.dataset.count, dec = +(el.dataset.dec || 0), pre = el.dataset.pre || "", suf = el.dataset.suf || "";
    if (still) return;
    const t0 = performance.now(), dur = 1600;
    (function step(now) {
      const k = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = pre + (end * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  });
}, { threshold: 0.4 }).observe($(".stats"));

/* ---------- the deck ---------- */
const CO = [
  ["Jasper", "jasper", "AI", "Advisor", "$1.5B", "valuation", "One of the fastest growing startups ever to go from $1M to $100M ARR."],
  ["Proof", "proof", "SaaS", "Advisor", "9 mo", "to $1M ARR", "Bootstrapped, then became Jasper after Y Combinator (YC '18)."],
  ["Powur", "powur", "Solar", "Angel", "$350M", "a year", "Inc. 5000 four years running: #938, #61, #43, #130."],
  ["Rising Woman", "rising-woman", "Education", "Partner", "$10M+", "in sales", "Scaled with paid media to a following in the millions."],
  ["The Art of Love", "art-of-love", "Coaching", "Co-founder", "#1247", "Inc. 5000", "Started with my wife. Helping ambitious couples thrive together."],
  ["Mystic", "mystic", "App", "Co-founder", "East+West", "astrology", "The only app that bridges Eastern and Western astrology."],
  ["SmartCrew", "smartcrew", "SaaS", "Founder", "All-in-one", "heavy civil", "Software that runs heavy equipment construction companies."],
  ["Legacy Lake", "legacy-lake", "Real estate", "Co-founder", "150", "acres", "A 50-acre lake in Rochester, becoming a home for festivals and retreats."]
];
const stage = $("#stage");
stage.innerHTML = CO.map(([n, f, s, r, big, unit, d], i) => `<div class="card down" id="card-${i}" tabindex="0" role="button" aria-label="${n}, ${r}. Flip for details"><div class="in">
  <div class="face front"><img src="/img/logo-${f}.png" alt="${n}" loading="lazy"><div class="row"><span>${r}</span><span>${s}</span></div></div>
  <div class="face back"><div class="mono">AD</div><div class="det"><p class="eyebrow">${n} · ${r}</p><div><b>${big}</b> <span class="eyebrow">${unit}</span></div><p>${d}</p></div></div></div></div>`).join("");
const cards = [...stage.children], CN = cards.length, DUR = 1.25, GAP = 0.32;
let up = -1, dealt = false, busy = false;
function pos(i) {
  const narrow = innerWidth < 760, mid = (CN - 1) / 2;
  if (!dealt) return `translateY(${narrow ? 40 : 70}px) translateX(${(CN - i) * 0.7}px) rotate(${[-1.2, .6, -.3, 1, -.8, .4, -.5, 0][i]}deg)`;
  const lift = i === up ? (narrow ? -26 : -52) : 0;
  return `translateY(${lift}px) rotate(${(i - mid) * (narrow ? 6.5 : 8.5)}deg)${i === up ? " scale(1.07)" : ""}`;
}
function move(i, delay, dur) {
  const c = cards[i];
  c.style.transition = `transform ${dur}s cubic-bezier(.25,.75,.2,1) ${delay}s, filter .4s`;
  c.style.transform = pos(i);
}
function layout() { cards.forEach((c, i) => { c.style.zIndex = i === up ? 200 : 100 + i; move(i, 0, .8); }); }
function deal() {
  if (busy || dealt) return; busy = true; dealt = true;
  cards.forEach((c, i) => {
    const d = i * GAP;
    setTimeout(() => c.style.zIndex = 100 + i, d * 1000);
    move(i, d, DUR);
    setTimeout(() => c.classList.remove("down"), (d + DUR * .3) * 1000);
  });
  setTimeout(() => busy = false, ((CN - 1) * GAP + DUR) * 1000 + 100);
}
function collect() {
  if (busy) return; busy = true; up = -1; stage.classList.remove("hov"); dealt = false;
  cards.forEach((c, i) => { c.classList.remove("up", "flip"); c.classList.add("down"); c.style.zIndex = CN - i; move(i, (CN - 1 - i) * .07, .9); });
  setTimeout(() => { busy = false; deal(); }, 1700);
}
cards.forEach((c, i) => {
  c.style.zIndex = CN - i; c.style.transform = pos(i);
  c.addEventListener("pointerenter", e => { if (e.pointerType === "mouse" && dealt && !busy) { up = i; c.classList.add("up"); stage.classList.add("hov"); layout(); } });
  c.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && dealt && !busy) { up = -1; c.classList.remove("up", "flip"); stage.classList.remove("hov"); layout(); } });
  const flip = () => {
    if (!dealt) return deal(); if (busy) return;
    if (up !== i) { cards.forEach(x => x.classList.remove("up", "flip")); up = i; c.classList.add("up"); stage.classList.add("hov"); layout(); }
    c.classList.toggle("flip");
  };
  c.addEventListener("click", flip);
  c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
});
$("#redeal").onclick = collect;
if (still) { dealt = true; cards.forEach(c => c.classList.remove("down")); layout(); }
else new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { setTimeout(deal, 350); o.disconnect(); } }, { threshold: .5 }).observe(stage);
addEventListener("resize", () => { if (!busy) cards.forEach((c, i) => c.style.transform = pos(i)); });

/* ---------- phases ---------- */
const PH = [
  ["business", "Business", "Jasper, Powur, The Art of Love. Built, backed and advised some of America's fastest growing startups."],
  ["prepper", "Prepper", "Close-quarter battle, pistol, field medicine, survival under Tom Brown, and a jiu jitsu podium."],
  ["love", "Love", "Bali, and seven years of study with my wife. Fourteen years together."],
  ["teaching", "Teaching", "Rooms of 20 to 2,000+, from Estonia to Chile."],
  ["hermit", "Hermit", "Offline. 150 acres and a lake in Minnesota. This is now."]
];
$("#strip").innerHTML = PH.map(([k, t, p], i) => `<div class="ph${i === 4 ? " open" : ""}" tabindex="0"><img src="/img/${k}.jpg" alt="${t} phase" loading="lazy"><div class="t"><span class="eyebrow">${String(i + 1).padStart(2, "0")}</span><b>${t}</b><p>${p}</p></div></div>`).join("");
const phs = [...document.querySelectorAll(".ph")];
phs.forEach(el => {
  const open = () => phs.forEach(x => x.classList.toggle("open", x === el));
  el.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") open(); });
  el.addEventListener("focus", open); el.addEventListener("click", open);
});

/* ---------- pitch form ---------- */
$("#pitch").addEventListener("submit", async e => {
  e.preventDefault();
  const note = $("#pitch-note"), btn = e.target.querySelector("button");
  btn.disabled = true; note.textContent = "Sending…";
  try {
    const r = await fetch("/api/pitch", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    if (!r.ok) throw 0;
    note.textContent = "Got it. Andrew reads every one of these."; e.target.reset();
  } catch { note.textContent = "That didn't go through. Try again in a minute."; }
  btn.disabled = false;
});
