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

/* ---------- the deck: scroll deals one card at a time ---------- */
const CO = [
  ["jasper", "Jasper", "One of the fastest growing startups ever to go from $1M to $100M ARR. I advise the team."],
  ["proof", "Proof", "Bootstrapped to $1M ARR in nine months, then became Jasper after Y Combinator."],
  ["powur", "Powur", "From nothing to $350M a year, and on the Inc. 5000 four years running."],
  ["rising-woman", "Rising Woman", "We scaled the brand with paid media: $10M+ in sales and a following in the millions."],
  ["art-of-love", "The Art of Love", "Started with my wife. Helps ambitious couples build healthy, high-functioning relationships."],
  ["mystic", "Mystic", "The only astrology app that bridges Eastern and Western astrology."],
  ["smartcrew", "SmartCrew", "All-in-one software that runs heavy equipment construction companies."],
  ["legacy-lake", "Legacy Lake", "150 acres and a 50-acre lake in Rochester, becoming a home for festivals and retreats."]
];
const deckEl = $("#deck"), table = $("#table"), cap = $("#deck-cap"), count = $("#deck-count");
table.innerHTML = CO.map(([k, n], i) => `<div class="dcard" id="dcard-${i}" role="button" tabindex="-1" aria-label="${n}"><div class="lift"><div class="in">
  <div class="face front"><img src="/cards/card-${k}.webp" alt="${n} card" loading="lazy" decoding="async"></div>
  <div class="face back"><img src="/cards/card-back.webp" alt="" loading="lazy" decoding="async"></div></div></div></div>`).join("");
const dcards = [...table.children], DN = dcards.length;
const tilt = [-2.2, 1.4, -0.8, 2.0, -1.6, 0.9, -1.2, 1.8], stackTilt = [0.6, -0.9, 1.1, -0.4, 0.8, -1.2, 0.3, -0.7];
const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b), lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
let G = {}, dp = 0, dpT = 0, capFor = -2;
// Desktop: deck and the card in your hand on the left, the table (2 x 4) on the right.
// Phone: card in hand on top, the table below (2 x 4 on tall screens, 4 x 2 on short ones).
function deckGeo() {
  // clientWidth/Height: on phones innerWidth can report a stretched layout viewport before first layout
  const de = document.documentElement, vw = de.clientWidth, vh = de.clientHeight, narrow = vw < 760;
  const top = $(".deck-head").getBoundingClientRect().height + Math.max(80, vh * .09) + (narrow ? 16 : 28), bottom = narrow ? 24 : 40, gap = narrow ? 10 : 16;
  let cols, rows, sw, fx, cy, cw, gx, gy;
  if (!narrow) {
    cols = 2; rows = 4;
    const availH = vh - top - bottom, rightW = vw * .46;
    sw = Math.min((rightW - gap) / 2, (availH - gap * 3) / 4 * 1.75, 300);
    gx = vw * .25; gy = (top + vh - bottom) / 2 - vh / 2;
    cw = Math.min(460, vw * .32, (vh - top - bottom - 120) * 1.75);
    fx = -vw * .2; cy = gy - 50;
  } else {
    cols = vh >= 760 ? 2 : 4; rows = 8 / cols;
    sw = (vw - 32 - gap * (cols - 1)) / cols;
    const gridH = rows * (sw / 1.75) + (rows - 1) * gap;
    gx = 0; gy = vh / 2 - bottom - gridH / 2;
    const room = vh - bottom - gridH - top - 96;
    cw = Math.max(160, Math.min(vw * .8, 340, room * 1.75));
    fx = 0; cy = top + (cw / 1.75) / 2 - vh / 2;
  }
  const sh = sw / 1.75;
  G = { cw, ch: cw / 1.75, cols, rows, gap, sw, sh, gx, gy, fx, cy, fs: 1, narrow };
  table.style.setProperty("--cw", cw + "px");
  const capTop = vh / 2 + cy + cw / 1.75 / 2 + 22;
  Object.assign(cap.style, narrow
    ? { top: capTop + "px", left: "0", right: "0", width: "auto", textAlign: "center" }
    : { top: capTop + "px", left: (vw / 2 + fx - cw / 2) + "px", right: "auto", width: cw + "px", textAlign: "left", padding: "0" });
}
function slot(k) {
  const c = k % G.cols, r = Math.floor(k / G.cols);
  return [G.gx + (c - (G.cols - 1) / 2) * (G.sw + G.gap), G.gy + (r - (G.rows - 1) / 2) * (G.sh + G.gap)];
}
function deckProgress() {
  const r = deckEl.getBoundingClientRect();
  return clamp(-r.top / (r.height - innerHeight));
}
function renderDeck() {
  const P = clamp(dp / .92) * DN;
  let active = -1;
  dcards.forEach((el, k) => {
    const t = clamp(P - k);
    let x = G.fx, y, s, ry, rz, z, sh;
    const sy = G.cy + 18 + k * 1.8;                       // undealt cards stack with visible thickness
    if (t <= 0) { y = sy; s = 1; ry = 180; rz = stackTilt[k]; z = 100 - k; sh = .25; }
    else if (t < .7) {                                    // lift, turn over, hold up to read
      const a = ease(clamp(t / .38));
      y = lerp(sy, G.cy, a) - Math.sin(a * Math.PI) * 40; s = lerp(1, G.fs, a); ry = 180 * (1 - a); rz = lerp(stackTilt[k], 0, a); z = 300; sh = lerp(.25, 1, a);
      active = k;
    } else {                                              // lay it on the table
      const c = ease((t - .7) / .3), [sx, sy2] = slot(k);
      x = lerp(G.fx, sx, c); y = lerp(G.cy, sy2, c); s = lerp(G.fs, G.sw / G.cw, c); ry = 0; rz = lerp(0, tilt[k], c); z = c < 1 ? 250 : 200 + k; sh = lerp(1, .35, c);
      if (c < .5) active = k;
    }
    el.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,0) rotate(${rz}deg) scale(${s})`;
    el.style.zIndex = z; el.style.setProperty("--sh", sh);
    el.querySelector(".in").style.transform = `rotateY(${ry}deg)`;
    el.classList.toggle("laid", t >= 1); el.tabIndex = t >= 1 ? 0 : -1;
  });
  const dealt = Math.min(DN, Math.floor(P + .3));
  count.textContent = `${String(dealt).padStart(2, "0")} / ${String(DN).padStart(2, "0")}`;
  const capKey = active >= 0 ? active : P >= DN ? "end" : "none";
  if (capKey !== capFor) {
    capFor = capKey;
    cap.style.opacity = 0;
    setTimeout(() => {
      cap.innerHTML = active >= 0 ? `<b>${CO[active][1]}</b>${CO[active][2]}` : (P >= DN ? "<b>All eight on the table</b>Tap a card to pick it back up." : "");
      cap.style.opacity = 1;
    }, 180);
  }
}
dcards.forEach((el, k) => {
  const go = () => {
    if (!el.classList.contains("laid")) return;
    const r = deckEl.getBoundingClientRect(), span = r.height - innerHeight;
    scrollTo({ top: scrollY + r.top + span * ((k + .5) / DN) * .92, behavior: still ? "auto" : "smooth" });
  };
  el.addEventListener("click", go);
  el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
});
addEventListener("scroll", () => { dpT = deckProgress(); }, { passive: true });
addEventListener("resize", () => { deckGeo(); renderDeck(); });
addEventListener("load", () => { deckGeo(); renderDeck(); });
deckGeo(); dpT = dp = deckProgress(); renderDeck();
(function deckTick() {
  const n = still ? dpT : dp + (dpT - dp) * .14;
  if (Math.abs(n - dp) > .00005) { dp = n; renderDeck(); }
  requestAnimationFrame(deckTick);
})();

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
