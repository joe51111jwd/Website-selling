// The jobsite map by day: after the intro (or straight away without one) the intro's topo map
// (#topo in index.html) stays as the hero's faint ground, under the 3D, veiled away from the copy.
// It drifts a few px against the cursor (fine pointers) and with the scroll, and fades out as the
// hero scrolls away: it belongs to the first screen only.

import { coarse, reducedMotion } from "../../three/stage/store";

let running = false;

export function startTopo() {
  const el = document.getElementById("topo");
  if (!el || running) return;
  running = true;
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  let raf = 0;
  let shown = true;

  const apply = () => {
    const H = window.innerHeight;
    const sy = window.scrollY;
    const o = Math.min(1, Math.max(0, 1 - sy / (H * 0.55)));
    if (o <= 0) {
      if (shown) {
        el.style.visibility = "hidden";
        shown = false;
      }
      return false;
    }
    if (!shown) {
      el.style.visibility = "";
      shown = true;
    }
    el.style.opacity = o.toFixed(3);
    const k = reducedMotion ? 0 : 1;
    cur.x += (target.x - cur.x) * 0.08;
    cur.y += (target.y - cur.y) * 0.08;
    el.style.setProperty("--dx", `${(cur.x * k).toFixed(2)}px`);
    el.style.setProperty("--dy", `${(cur.y * k - sy * 0.12 * k).toFixed(2)}px`);
    return Math.abs(target.x - cur.x) > 0.05 || Math.abs(target.y - cur.y) > 0.05;
  };
  const loop = () => {
    raf = 0;
    if (apply()) raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    target.x = -((e.clientX / window.innerWidth) * 2 - 1) * 9;
    target.y = -((e.clientY / window.innerHeight) * 2 - 1) * 6;
    kick();
  };
  apply();
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
  if (!coarse && !reducedMotion) window.addEventListener("pointermove", onPointer, { passive: true });
  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", kick);
    window.removeEventListener("resize", kick);
    window.removeEventListener("pointermove", onPointer);
  };
}
