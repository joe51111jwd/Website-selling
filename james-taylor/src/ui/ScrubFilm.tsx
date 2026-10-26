import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { bump, drawFit, loadFrames, manifest, nearest, type Fit, type Manifest } from "../lib/frames";

/** A rendered film scrubbed by scroll: progress 0..1 picks the frame. */
export function ScrubFilm({
  name,
  progress,
  fit = "contain",
  portrait,
  className,
  label,
}: {
  name: string;
  progress: MotionValue<number>;
  fit?: Fit;
  /** framing for canvases taller than wide (phones), where a landscape film would crop hard */
  portrait?: { fit: Fit; x: number; y: number };
  className?: string;
  label: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const frames = useRef<(ImageBitmap | HTMLImageElement | undefined)[]>([]);
  const meta = useRef<Manifest | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "1200px 0px" });
    io.observe(el);
    // on screen: its frames jump the download queue
    const onScreen = new IntersectionObserver(([e]) => e.isIntersecting && bump(name));
    onScreen.observe(el);
    return () => {
      io.disconnect();
      onScreen.disconnect();
    };
  }, []);

  const draw = () => {
    const c = canvas.current;
    const m = meta.current;
    if (!c || !m) return;
    const i = Math.max(0, Math.min(m.count - 1, Math.round(progress.get() * (m.count - 1))));
    const img = nearest(frames.current, i);
    if (!img) return;
    const tall = portrait && c.clientWidth < c.clientHeight;
    if (tall) drawFit(c, img, portrait.fit, portrait.x, portrait.y);
    else drawFit(c, img, fit);
  };

  useEffect(() => {
    if (!near) return;
    const ac = new AbortController();
    // the manifest arrives before the frames; keep it so the first frames can draw
    manifest(name)
      .then((m) => (meta.current = m))
      .catch(() => {});
    let n = 0;
    void loadFrames(
      name,
      (i, img) => {
        frames.current[i] = img;
        n++;
        if (n <= 2 || n % 6 === 0) draw();
      },
      ac.signal,
    )
      .then((m) => {
        meta.current = m;
        draw();
      })
      .catch(() => {});
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => {
      ac.abort();
      window.removeEventListener("resize", onResize);
    };
  }, [near, name]);

  useMotionValueEvent(progress, "change", draw);

  return <canvas ref={canvas} className={className} role="img" aria-label={label} />;
}
