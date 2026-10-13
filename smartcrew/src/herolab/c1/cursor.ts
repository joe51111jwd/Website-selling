// Herolab c1 · the desktop cursor (fine pointers only).
//   over the drawing: a surveyor's reticle (crosshair + stadia hairs). Over a job it snaps onto
//     that job's fence and reads one ink tag: "Riverside Storm Sewer · 2 on site · 19.9 h · −$860".
//   elsewhere: the crew dot in its dashed geofence (the site's cursor), which snaps into a solid
//     ring round the orange CTA ("clocked in").
// One rAF loop, running only while something is still moving.

import { JOBS, type JobId, type Pt } from "./geometry";
import { toScreen, type Layout } from "./layout";

type Spring = { v: number; x: number; t: number };
const spring = (x: number): Spring => ({ v: 0, x, t: x });
/** Semi-implicit Euler in fixed 4 ms substeps: stable for any frame time (a stalled frame, a
 * throttled tab) and any stiffness used here. Returns whether it is still moving. */
function stepSpring(s: Spring, dt: number, k = 520, c = 46) {
  const H = 1 / 250;
  for (let t = 0; t < dt - 1e-6; t += H) {
    const h = Math.min(H, dt - t);
    s.v += (k * (s.t - s.x) - c * s.v) * h;
    s.x += s.v * h;
  }
  if (!Number.isFinite(s.x)) {
    s.x = s.t;
    s.v = 0;
  }
  return Math.abs(s.t - s.x) > 0.05 || Math.abs(s.v) > 0.05;
}

const MINUS = "−";

function inside(p: Pt, poly: Pt[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function distToPoly(p: Pt, poly: Pt[]) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [bx, by] = poly[i];
    const vx = bx - ax;
    const vy = by - ay;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * vx + (p[1] - ay) * vy) / (vx * vx + vy * vy || 1)));
    d = Math.min(d, Math.hypot(p[0] - (ax + vx * t), p[1] - (ay + vy * t)));
  }
  return d;
}

export function attachCursor(root: HTMLElement, L: Layout): () => void {
  const field = root.querySelector<HTMLElement>("[data-field]")!;
  const reticle = root.querySelector<HTMLElement>("[data-reticle]")!;
  const tag = root.querySelector<HTMLElement>("[data-tag]")!;
  const ringSvg = root.querySelector<SVGSVGElement>("[data-cur-ring]")!;
  const rect = root.querySelector<SVGRectElement>("[data-cur-rect]")!;
  const dot = root.querySelector<HTMLElement>("[data-cur-dot]")!;
  const cta = root.querySelector<HTMLElement>(".hl1-cta")!;
  if (!field || !reticle || !ringSvg || !dot) return () => {};
  // state lives in data-* attributes: React owns the root's className and rewrites it on render
  const flag = (k: string, on: boolean) => {
    if (on) root.dataset[k] = "1";
    else delete root.dataset[k];
  };
  root.dataset.hascur = "1";
  const hours = root.dataset.angle === "timecards" || root.dataset.angle === "payroll";

  const F = L.field;
  const fo: Pt = [F.x, F.y];
  const jobs = L.scene.jobs.map((j) => {
    const fence = j.fence.map((p) => {
      const s = toScreen(L, p);
      return [s[0] - fo[0], s[1] - fo[1]] as Pt;
    });
    const c: Pt = [fence.reduce((a, p) => a + p[0], 0) / fence.length, fence.reduce((a, p) => a + p[1], 0) / fence.length];
    const xs = fence.map((p) => p[0]);
    const ys = fence.map((p) => p[1]);
    const r = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2;
    const spot = root.querySelector<HTMLElement>(`[data-spot=${j.id}]`);
    const svg = j.id === "hwy9" ? root.querySelector(`[data-fence=hwy9]`) : root.querySelector(`[data-job=${j.id}]`);
    return { id: j.id as JobId, fence, c, r, spot, svg, right: Math.max(...xs), top: Math.min(...ys) };
  });

  // pointer in section px
  let px = -100;
  let py = -100;
  let mode: "none" | "field" | "cta" | "dot" = "none";
  let hot: (typeof jobs)[number] | null = null;
  const rx = spring(-100);
  const ry = spring(-100);
  const rs = spring(1); // reticle circle scale
  const ox = spring(-100); // ring box
  const oy = spring(-100);
  const ow = spring(28);
  const oh = spring(28);
  const orr = spring(14);
  const dx = spring(-100);
  const dy = spring(-100);
  let raf = 0;
  let last = 0;

  const fieldBox = () => {
    const r = root.getBoundingClientRect();
    return { left: r.left, top: r.top };
  };

  function retarget() {
    const fb = fieldBox();
    void fb;
    if (mode === "field") {
      const fpx = px - F.x;
      const fpy = py - F.y;
      let best: (typeof jobs)[number] | null = null;
      for (const j of jobs) {
        const sb = j.spot?.querySelector(".hl1-stack")?.getBoundingClientRect();
        const rb = root.getBoundingClientRect();
        const overSpot = sb && px >= sb.left - rb.left - 8 && px <= sb.right - rb.left + 8 && py >= sb.top - rb.top - 8 && py <= sb.bottom - rb.top + 8;
        if (overSpot || inside([fpx, fpy], j.fence) || distToPoly([fpx, fpy], j.fence) < 16) best = j;
      }
      if (best !== hot) {
        hot?.svg?.classList.remove("is-hot");
        hot?.spot?.classList.remove("is-hot");
        hot = best;
        if (hot) {
          hot.svg?.classList.add("is-hot");
          hot.spot?.classList.add("is-hot");
          const job = JOBS[hot.id];
          const money = (job.profit < 0 ? MINUS : "+") + "$" + Math.abs(job.profit).toLocaleString("en-US");
          tag.textContent = `${job.name} · ${job.crew.length} on site · ${job.hours.toFixed(1)} h${hours ? "" : ` · ${money}`}`;
          tag.classList.toggle("is-red", !hours && job.profit < 0);
        }
        flag("snap", !!hot);
      }
      if (hot) {
        rx.t = hot.c[0];
        ry.t = hot.c[1];
        rs.t = Math.max(1, (hot.r + 10) / 17);
      } else {
        rx.t = fpx;
        ry.t = fpy;
        rs.t = 1;
      }
    }
    if (mode === "cta") {
      const rb = root.getBoundingClientRect();
      const b = cta.getBoundingClientRect();
      const pad = 7;
      ox.t = b.left - rb.left - pad;
      oy.t = b.top - rb.top - pad;
      ow.t = b.width + pad * 2;
      oh.t = b.height + pad * 2;
      orr.t = 16 + pad;
    } else {
      ow.t = 28;
      oh.t = 28;
      orr.t = 14;
      ox.t = px - 14;
      oy.t = py - 14;
    }
    dx.t = px;
    dy.t = py;
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - (last || now)) / 1000 || 0.016);
    last = now;
    let moving = false;
    moving = stepSpring(rx, dt, hot ? 300 : 900, hot ? 30 : 60) || moving;
    moving = stepSpring(ry, dt, hot ? 300 : 900, hot ? 30 : 60) || moving;
    moving = stepSpring(rs, dt, 260, 26) || moving;
    const follow = mode === "cta" ? [300, 30] : [760, 56];
    moving = stepSpring(ox, dt, follow[0], follow[1]) || moving;
    moving = stepSpring(oy, dt, follow[0], follow[1]) || moving;
    moving = stepSpring(ow, dt, 300, 30) || moving;
    moving = stepSpring(oh, dt, 300, 30) || moving;
    moving = stepSpring(orr, dt, 300, 30) || moving;
    moving = stepSpring(dx, dt, 2400, 98) || moving;
    moving = stepSpring(dy, dt, 2400, 98) || moving;

    reticle.style.transform = `translate(${rx.x.toFixed(2)}px, ${ry.x.toFixed(2)}px)`;
    reticle.style.setProperty("--rs", rs.x.toFixed(3));
    if (hot) {
      const right = rx.x + 17 * rs.x + 12;
      const flip = right + tag.offsetWidth > F.w - 12;
      const tx = flip ? rx.x - 17 * rs.x - 12 - tag.offsetWidth : right;
      tag.style.transform = `translate(${tx.toFixed(1)}px, ${(ry.x - 13).toFixed(1)}px)`;
    }
    ringSvg.style.transform = `translate(${ox.x.toFixed(2)}px, ${oy.x.toFixed(2)}px)`;
    ringSvg.setAttribute("width", ow.x.toFixed(1));
    ringSvg.setAttribute("height", oh.x.toFixed(1));
    rect.setAttribute("x", "1");
    rect.setAttribute("y", "1");
    rect.setAttribute("width", Math.max(0, ow.x - 2).toFixed(1));
    rect.setAttribute("height", Math.max(0, oh.x - 2).toFixed(1));
    rect.setAttribute("rx", Math.max(0, orr.x - 1).toFixed(1));
    dot.style.transform = `translate(${dx.x.toFixed(2)}px, ${dy.x.toFixed(2)}px)`;
    raf = moving ? requestAnimationFrame(frame) : 0;
    if (!moving) last = 0;
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const rb = root.getBoundingClientRect();
    px = e.clientX - rb.left;
    py = e.clientY - rb.top;
    const t = e.target as Element;
    const prev = mode;
    const overCta = !!t.closest?.(".hl1-cta");
    const inF = px >= F.x && px <= F.x + F.w && py >= F.y && py <= F.y + F.h;
    mode = overCta ? "cta" : inF ? "field" : "dot";
    if (prev === "none") {
      // first move: jump, don't fly in from the corner
      for (const s of [rx, ox, dx]) s.x = s.t = px - (s === ox ? 14 : 0) - (s === rx ? F.x : 0);
      for (const s of [ry, oy, dy]) s.x = s.t = py - (s === oy ? 14 : 0) - (s === ry ? F.y : 0);
    }
    if (prev !== mode) {
      root.dataset.cur = mode;
      if (mode !== "field" && hot) {
        hot.svg?.classList.remove("is-hot");
        hot.spot?.classList.remove("is-hot");
        hot = null;
        flag("snap", false);
      }
    }
    flag("link", !overCta && !!t.closest?.("a, button"));
    retarget();
    kick();
  };
  const onLeave = (e: PointerEvent) => {
    // only a real exit (removing a hovered child can fire boundary events)
    const rb = root.getBoundingClientRect();
    if (e.clientX > rb.left && e.clientX < rb.right && e.clientY > rb.top && e.clientY < rb.bottom) return;
    mode = "none";
    root.dataset.cur = "none";
    hot?.svg?.classList.remove("is-hot");
    hot?.spot?.classList.remove("is-hot");
    hot = null;
    flag("snap", false);
  };
  const onDown = () => flag("down", true);
  const onUp = () => flag("down", false);
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  root.dataset.cur = "none";
  return () => {
    cancelAnimationFrame(raf);
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
    root.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    for (const k of ["hascur", "snap", "link", "down", "cur"]) delete root.dataset[k];
  };
}
