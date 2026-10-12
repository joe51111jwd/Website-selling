// The primary CTA's one-time attention cue (BRIEF round 2 §9): the first time a button is fully on
// screen, a dashed orange geofence draws itself around it, closes in tight and goes solid ("clocked
// in"), pings once and fades. Once per button, never a loop. Nothing under reduced motion.
// Imperative (one small SVG appended to the button and removed at the end): no React state.

import { animate } from "motion/react";

const NS = "http://www.w3.org/2000/svg";
const OUT = 12; // px between the button and the fence as it draws
const IN = 5; // … once it has closed in

/** A rounded rect as a path, starting top-centre, clockwise (so the draw starts at the top). */
function rr(w: number, h: number, r: number, pad: number) {
  const x0 = -pad;
  const y0 = -pad;
  const x1 = w + pad;
  const y1 = h + pad;
  const R = Math.min(r + pad, (h + pad * 2) / 2, (w + pad * 2) / 2);
  const cx = w / 2;
  const f = (n: number) => n.toFixed(2);
  return (
    `M${f(cx)} ${f(y0)}H${f(x1 - R)}A${f(R)} ${f(R)} 0 0 1 ${f(x1)} ${f(y0 + R)}` +
    `V${f(y1 - R)}A${f(R)} ${f(R)} 0 0 1 ${f(x1 - R)} ${f(y1)}` +
    `H${f(x0 + R)}A${f(R)} ${f(R)} 0 0 1 ${f(x0)} ${f(y1 - R)}` +
    `V${f(y0 + R)}A${f(R)} ${f(R)} 0 0 1 ${f(x0 + R)} ${f(y0)}Z`
  );
}

/** Plays the cue on `el` (a .cta). Returns a cancel function. */
export function playCue(el: HTMLElement): () => void {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!w || !h) return () => {};
  const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "cta-cue");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
  svg.setAttribute("overflow", "visible");
  const line = document.createElementNS(NS, "path");
  line.setAttribute("class", "cta-cue-line");
  line.setAttribute("d", rr(w, h, r, OUT));
  line.setAttribute("pathLength", "100");
  svg.appendChild(line);
  el.appendChild(svg);

  let alive = true;
  const stops: { stop: () => void }[] = [];
  const run = <T,>(c: T & { stop: () => void }) => (stops.push(c), c);

  (async () => {
    // 1 · the fence draws itself round the button, dashed (pathLength 100: 1 dash ≈ 3.2 % of it)
    await run(
      animate(0, 1, {
        duration: 0.75,
        ease: [0.65, 0, 0.35, 1],
        onUpdate: (t) => {
          const drawn = 100 * t;
          // a dashed line, revealed along the path: dashes inside the drawn length, gap after it
          const dashes: number[] = [];
          for (let s = 0; s < drawn; s += 5.2) dashes.push(Math.min(3.2, drawn - s), Math.min(2, Math.max(0, drawn - s - 3.2)));
          line.setAttribute("stroke-dasharray", `${dashes.join(" ")} 0 200`);
        },
      }),
    );
    if (!alive) return;
    // 2 · it closes in tight and goes solid: clocked in
    line.setAttribute("stroke-dasharray", "3.2 2");
    await run(
      animate(0, 1, {
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (t) => {
          line.setAttribute("d", rr(w, h, r, OUT + (IN - OUT) * t));
          line.setAttribute("stroke-dasharray", `${(3.2 + 6.8 * t).toFixed(2)} ${(2 * (1 - t)).toFixed(2)}`);
        },
      }),
    );
    if (!alive) return;
    line.setAttribute("stroke-dasharray", "none");
    svg.classList.add("is-closed");
    // 3 · one ping, then it lets go
    await run(animate(svg, { opacity: [1, 1, 0] }, { duration: 1.1, times: [0, 0.45, 1], ease: "easeOut" }));
    if (alive) svg.remove();
  })();

  return () => {
    alive = false;
    stops.forEach((s) => s.stop());
    svg.remove();
  };
}
