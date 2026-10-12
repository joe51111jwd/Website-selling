// The page's signature move, reused in the popup: when a step is saved, an orange pulse travels
// from the button to the row of the live preview it just filled in, and that row lights up, the
// same way field actions travel from the phone to the office laptop in the One Day scene.

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function flash(el: Element | null) {
  if (!el) return;
  el.classList.remove("su-flash");
  void (el as HTMLElement).offsetWidth; // restart the animation
  el.classList.add("su-flash");
  window.setTimeout(() => el.classList.remove("su-flash"), 1000);
}

export function fly(from: Element | null, to: Element | null) {
  if (!to) return;
  if (!from || reduced() || typeof (from as HTMLElement).animate !== "function") {
    flash(to);
    return;
  }
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (!a.width || !b.width) {
    flash(to);
    return;
  }
  const x0 = a.left + a.width * 0.72;
  const y0 = a.top + a.height / 2;
  const x1 = b.left + Math.min(28, b.width / 2);
  const y1 = b.top + Math.min(b.height / 2, 22);
  // one arc, bowed upward like the pulse on the page
  const cx = (x0 + x1) / 2;
  const cy = Math.min(y0, y1) - Math.max(70, Math.abs(x1 - x0) * 0.28);
  const at = (t: number) => {
    const u = 1 - t;
    return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
  };
  const frames: Keyframe[] = [];
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x, y] = at(t);
    const s = t < 0.15 ? 0.4 + t * 4 : t > 0.85 ? 1 + (t - 0.85) * 2 : 1;
    frames.push({ transform: `translate(${x - 6}px, ${y - 6}px) scale(${s})`, opacity: t > 0.94 ? 0 : 1 });
  }
  const make = (cls: string) => {
    const d = document.createElement("div");
    d.className = cls;
    d.setAttribute("aria-hidden", "true");
    document.body.appendChild(d);
    return d;
  };
  const dot = make("su-pulse");
  const trail = make("su-pulse su-pulse--trail");
  const easing = "cubic-bezier(0.55, 0, 0.25, 1)";
  const run = dot.animate(frames, { duration: 640, easing, fill: "forwards" });
  trail.animate(frames, { duration: 640, delay: 70, easing, fill: "forwards" }).onfinish = () => trail.remove();
  run.onfinish = () => {
    dot.remove();
    flash(to);
  };
}
