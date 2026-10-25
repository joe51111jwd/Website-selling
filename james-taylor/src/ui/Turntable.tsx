import { useEffect, useRef, useState } from "react";
import { drawFit, loadFrames, nearest, reducedMotion } from "../lib/media";
import "./Turntable.css";

/** A dish rendered as a full turn in Blender. It idles round slowly; drag (or arrow keys) to turn it. */
export function Turntable({ name, label }: { name: string; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frames = useRef<(ImageBitmap | HTMLImageElement | undefined)[]>([]);
  const pos = useRef(0); // fractional frame
  const vel = useRef(0);
  const count = useRef(0);
  const [loaded, setLoaded] = useState(0);
  const [near, setNear] = useState(false);
  const [touched, setTouched] = useState(false);
  const calm = useRef(reducedMotion());
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastT = useRef(0);

  // start loading a little before it scrolls into view
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const ac = new AbortController();
    let n = 0;
    void loadFrames(
      name,
      (i, img) => {
        frames.current[i] = img;
        n++;
        if (n % 4 === 0 || n === 1) setLoaded(n);
        if (n === 1) draw();
      },
      ac.signal,
    )
      .then((m) => {
        count.current = m.count;
        setLoaded(m.count);
      })
      .catch(() => {
        /* no frames (not rendered yet, or offline): the glow stays, the dish doesn't */
      });
    return () => ac.abort();
  }, [near, name]);

  const draw = () => {
    const c = canvas.current;
    const n = count.current || frames.current.length;
    if (!c || !n) return;
    // scrolling past turns the dish too: half a turn across one screen of travel
    const r = box.current?.getBoundingClientRect();
    const scrollTurn = r && !calm.current ? (-(r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight) * n * 0.5 : 0;
    const i = ((Math.round(pos.current + scrollTurn) % n) + n) % n;
    const img = nearest(frames.current, i);
    if (img) drawFit(c, img, "contain");
    const deg = Math.round((i / n) * 360);
    box.current?.setAttribute("aria-valuenow", String(deg));
    box.current?.setAttribute("aria-valuetext", `${label}, turned ${deg} degrees`);
  };

  // idle spin + inertia, only while on screen
  useEffect(() => {
    const el = box.current;
    if (!el || !near) return;
    let raf = 0;
    let visible = false;
    let last = performance.now();
    const idle = calm.current ? 0 : 5; // frames per second
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging.current) {
        if (Math.abs(vel.current) > 0.05) {
          pos.current += vel.current * dt;
          vel.current *= Math.pow(0.04, dt);
        } else {
          pos.current += idle * dt;
        }
      }
      draw();
      if (visible) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(el);
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [near]);

  const perPx = () => {
    const w = box.current?.clientWidth || 600;
    return (count.current || 48) / (w * 1.4);
  };
  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    setTouched(true);
    lastX.current = e.clientX;
    lastT.current = performance.now();
    vel.current = 0;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    const now = performance.now();
    const df = -dx * perPx();
    pos.current += df;
    vel.current = (df / Math.max(1, now - lastT.current)) * 1000;
    lastX.current = e.clientX;
    lastT.current = now;
  };
  const onUp = () => {
    dragging.current = false;
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      setTouched(true);
      vel.current = (e.key === "ArrowLeft" ? 1 : -1) * 30;
    }
  };

  const pct = count.current ? loaded / count.current : 0;
  return (
    <div
      ref={box}
      className={`turn ${touched ? "touched" : ""}`}
      role="slider"
      aria-label={`Turn the ${label}`}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={0}
      aria-valuetext={`${label}, turned 0 degrees`}
      tabIndex={0}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={onKey}
    >
      <div className="turn-glow" aria-hidden />
      <canvas ref={canvas} />
      <div className="turn-hint" aria-hidden>
        <svg viewBox="0 0 40 16" width="40" height="16">
          <path d="M4 8h32M30 3l6 5-6 5M10 3L4 8l6 5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        Drag to turn
      </div>
      {pct < 1 && near && (
        <div className="turn-load" aria-hidden>
          <i style={{ transform: `scaleX(${pct})` }} />
        </div>
      )}
    </div>
  );
}
