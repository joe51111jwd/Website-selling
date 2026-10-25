import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { drawFit, loadFrames, manifest, nearest, seqUrl, type Manifest } from "../lib/media";

export type Anchor = { x: number; cx: number; y: number };
export type Anchors = { frames: number; parts: Record<string, Anchor[]> };

/** A Blender film scrubbed by scroll: progress 0..1 picks the frame. Calls back with the frame
 * index and the rectangle the image is drawn into, so overlays can follow the render. */
export function ScrubFilm({
  name,
  progress,
  fit = "contain",
  onFrame,
  className,
  label,
}: {
  name: string;
  progress: MotionValue<number>;
  fit?: "contain" | "cover";
  onFrame?: (i: number, rect: { x: number; y: number; w: number; h: number }, anchors: Anchors | null) => void;
  className?: string;
  label: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const frames = useRef<(ImageBitmap | HTMLImageElement | undefined)[]>([]);
  const meta = useRef<Manifest | null>(null);
  const anchors = useRef<Anchors | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "1200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const draw = () => {
    const c = canvas.current;
    const m = meta.current;
    if (!c || !m) return;
    const i = Math.max(0, Math.min(m.count - 1, Math.round(progress.get() * (m.count - 1))));
    const img = nearest(frames.current, i);
    if (!img) return;
    drawFit(c, img, fit);
    if (onFrame) {
      const w = c.clientWidth;
      const h = c.clientHeight;
      const s = fit === "contain" ? Math.min(w / m.width, h / m.height) : Math.max(w / m.width, h / m.height);
      onFrame(i, { x: (w - m.width * s) / 2, y: (h - m.height * s) / 2, w: m.width * s, h: m.height * s }, anchors.current);
    }
  };

  useEffect(() => {
    if (!near) return;
    const ac = new AbortController();
    fetch(seqUrl(name, "anchors.json"))
      .then((r) => (r.ok ? (r.json() as Promise<Anchors>) : null))
      .then((a) => (anchors.current = a))
      .catch(() => {});
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
