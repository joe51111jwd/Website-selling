import { useEffect, useRef } from "react";
import { reducedMotion } from "../lib/media";

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number };

/** Sparks shed by the pointer: they lift, drift and cool from white-yellow to red. Mouse only. */
export function EmberCursor() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sparks: Spark[] = [];
    let raf = 0;
    let last = performance.now();
    let px = -100;
    let py = -100;
    let has = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    size();
    window.addEventListener("resize", size);

    const spawn = (x: number, y: number, n: number, speed: number) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const v = (0.3 + Math.random()) * speed;
        sparks.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 0,
          max: 0.5 + Math.random() * 0.9,
          size: 0.6 + Math.random() * 1.8,
        });
      }
      if (sparks.length > 400) sparks.splice(0, sparks.length - 400);
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      const d = has ? Math.hypot(dx, dy) : 0;
      px = e.clientX;
      py = e.clientY;
      has = true;
      spawn(px, py, Math.min(6, 1 + Math.floor(d / 14)), 40 + Math.min(d, 60));
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") spawn(e.clientX, e.clientY, 26, 160);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;
        if (s.life > s.max) {
          sparks.splice(i, 1);
          continue;
        }
        s.vx += (Math.random() - 0.5) * 120 * dt;
        s.vy -= 30 * dt; // heat rises
        s.vx *= 0.97;
        s.vy *= 0.985;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const k = s.life / s.max;
        const r = 255;
        const g = Math.round(235 - 170 * k);
        const b = Math.round(170 - 160 * k);
        const alpha = (1 - k) * 0.95;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (1 - k * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,${Math.round(120 - 60 * k)},30,${alpha * 0.18})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (sparks.length) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", size);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 95, pointerEvents: "none" }}
    />
  );
}
