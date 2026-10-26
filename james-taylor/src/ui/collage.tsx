import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { PHOTOS, type PhotoId } from "../photos";
import { CLIPS, type ClipId } from "../clips";
import { finePointer, reducedMotion } from "../lib/motion";
import "./collage.css";

const BASE = import.meta.env.BASE_URL;
export const photoUrl = (id: PhotoId) => `${BASE}${PHOTOS[id].file}`;

/** Where a piece sits on its spread, in % of the spread's box (x, y, w) and degrees (r). */
export type Place = { x: number; y: number; w: number; r?: number; z?: number };

const vars = (p: Place, prefix: string) => ({
  [`--${prefix}x`]: p.x,
  [`--${prefix}y`]: p.y,
  [`--${prefix}w`]: p.w,
  [`--${prefix}r`]: p.r ?? 0,
  [`--${prefix}z`]: p.z ?? 1,
});

const Scroll = createContext<MotionValue<number> | null>(null);

/** A page of the scrapbook. Pieces inside are placed in % of it and drift with its scroll. */
export function Spread({
  className = "",
  children,
  id,
  label,
  style,
}: {
  className?: string;
  children: ReactNode;
  id?: string;
  label?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  return (
    <section ref={ref} id={id} className={`spread ${className}`} aria-label={label} style={style}>
      <Scroll.Provider value={scrollYProgress}>{children}</Scroll.Provider>
    </section>
  );
}

/** One thing stuck to the page. It slaps down when it comes into view, drifts at its own depth as
 * the page scrolls (depth > 0 moves faster than the page, < 0 slower), and can be picked up. */
export function Piece({
  at,
  m,
  depth = 0,
  order = 0,
  drag = false,
  className = "",
  children,
  label,
}: {
  at: Place;
  /** placement on phones; falls back to `at` */
  m?: Place;
  depth?: number;
  order?: number;
  drag?: boolean;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const progress = useContext(Scroll);
  const fallback = useMemo(() => ({ get: () => 0.5 }), []);
  const y = useTransform((progress ?? fallback) as MotionValue<number>, [0, 1], [depth * 140, depth * -140]);
  const tilt = ((at.r ?? 0) >= 0 ? 1 : -1) * 9;
  const [canDrag] = useState(() => drag && finePointer());
  return (
    <div
      className={`piece ${canDrag ? "can-drag" : ""} ${className}`}
      style={{ ...vars(at, ""), ...vars(m ?? at, "m") } as CSSProperties}
      aria-label={label}
    >
      <motion.div style={{ y: progress ? y : 0 }}>
        <motion.div
          className="piece-in"
          initial={{ opacity: 0, scale: 1.28, rotate: tilt }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ type: "spring", stiffness: 300, damping: 22, mass: 0.9, delay: order * 0.09 }}
          drag={canDrag}
          dragMomentum
          dragElastic={0.2}
          whileDrag={{ scale: 1.05, rotate: -2, zIndex: 50 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

/** A photo print. `frame`: a white bordered print, a polaroid with a caption, or a bare photocopy. */
export function Print({
  id,
  frame = "border",
  caption,
  tape = "top",
  className = "",
}: {
  id: PhotoId;
  frame?: "border" | "polaroid" | "copy" | "bare";
  caption?: ReactNode;
  tape?: "top" | "corners" | "side" | "none";
  className?: string;
}) {
  const p = PHOTOS[id];
  return (
    <figure className={`print print-${frame} ${className}`}>
      <img src={photoUrl(id)} width={p.w} height={p.h} alt={p.alt} loading="lazy" decoding="async" />
      {caption && <figcaption className={frame === "polaroid" ? "hand" : "type"}>{caption}</figcaption>}
      <Tapes at={tape} />
    </figure>
  );
}

/** A moving print: a few silent seconds of archive film, looping while it's on screen. */
export function Clip({
  id,
  frame = "polaroid",
  caption,
  tape = "none",
  className = "",
}: {
  id: ClipId;
  frame?: "border" | "polaroid";
  caption?: ReactNode;
  tape?: "top" | "corners" | "side" | "none";
  className?: string;
}) {
  const c = CLIPS[id];
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || reducedMotion()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <figure className={`print print-${frame} print-clip ${className}`}>
      <video
        ref={ref}
        src={`${BASE}${c.file}`}
        poster={`${BASE}${c.poster}`}
        width={c.w}
        height={c.h}
        muted
        loop
        playsInline
        preload="none"
        aria-label={c.alt}
      />
      {caption && <figcaption className={frame === "polaroid" ? "hand" : "type"}>{caption}</figcaption>}
      <Tapes at={tape} />
    </figure>
  );
}

/** A cut-out with its white sticker edge (baked into the image). */
export function Cutout({
  id,
  className = "",
  eager = false,
  onLoad,
}: {
  id: PhotoId;
  className?: string;
  eager?: boolean;
  onLoad?: () => void;
}) {
  const p = PHOTOS[id];
  return (
    <img
      onLoad={onLoad}
      onError={onLoad}
      className={`cutout ${className}`}
      src={photoUrl(id)}
      width={p.w}
      height={p.h}
      alt={p.alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
    />
  );
}

export function Tapes({ at }: { at: "top" | "corners" | "side" | "none" }) {
  if (at === "none") return null;
  if (at === "corners")
    return (
      <>
        <i className="tape tape-tl" aria-hidden />
        <i className="tape tape-br" aria-hidden />
      </>
    );
  return <i className={`tape tape-${at}`} aria-hidden />;
}

/** Marker on paper. */
export function Note({
  children,
  color = "marker",
  className = "",
}: {
  children: ReactNode;
  color?: "marker" | "biro" | "ink" | "bone" | "flame";
  className?: string;
}) {
  return <p className={`note hand note-${color} ${className}`}>{children}</p>;
}

/** Embossed label-maker tape, for chapter titles. */
export function Label({ children, tone = "black", className = "" }: { children: ReactNode; tone?: "black" | "red"; className?: string }) {
  return <span className={`dymo dymo-${tone} ${className}`}>{children}</span>;
}

/** A torn scrap of paper with typing (or anything) on it. */
export function Scrap({
  children,
  tone = "newsprint",
  className = "",
}: {
  children: ReactNode;
  tone?: "newsprint" | "lined" | "kraft" | "grid" | "white";
  className?: string;
}) {
  return <div className={`scrap scrap-${tone} ${className}`}>{children}</div>;
}

/** A press quote cut out of the paper. */
export function Clipping({
  outlet,
  when,
  rating,
  children,
  className = "",
}: {
  outlet: string;
  when: string;
  rating?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={`clip ${className}`}>
      <header className="clip-head">
        <span>{outlet}</span>
        <span>{when}</span>
      </header>
      <blockquote className="clip-q">“{children}”</blockquote>
      {rating && (
        <p className="clip-rate hand" aria-label={`Rated ${rating}`}>
          {rating}
          <Doodle kind="circle" className="clip-ring" />
        </p>
      )}
    </figure>
  );
}

const DOODLES = {
  arrow: { box: "0 0 160 90", d: ["M8 70 C 40 20, 100 10, 146 34", "M128 20 L 148 35 L 126 46"] },
  arrowDown: { box: "0 0 80 140", d: ["M40 6 C 18 40, 62 80, 40 124", "M24 106 L 40 128 L 56 108"] },
  circle: { box: "0 0 200 90", d: ["M30 20 C 80 2, 190 8, 192 44 C 194 82, 60 92, 18 66 C -6 50, 20 22, 70 14"] },
  underline: { box: "0 0 300 24", d: ["M4 16 C 60 8, 120 20, 180 10 S 270 8, 296 14"] },
  star: { box: "0 0 100 100", d: ["M50 6 L 62 38 L 96 38 L 68 58 L 80 92 L 50 72 L 20 92 L 32 58 L 4 38 L 38 38 Z"] },
  cross: { box: "0 0 100 100", d: ["M10 12 L 90 88", "M88 10 L 12 90"] },
  tick: { box: "0 0 100 80", d: ["M8 44 L 38 72 L 94 8"] },
} as const;

/** A marker stroke that draws itself in when seen. */
export function Doodle({
  kind,
  className = "",
  color = "marker",
  width = 5,
}: {
  kind: keyof typeof DOODLES;
  className?: string;
  color?: "marker" | "biro" | "ink" | "bone" | "flame";
  width?: number;
}) {
  const { box, d } = DOODLES[kind];
  return (
    <svg className={`doodle doodle-${color} ${className}`} viewBox={box} fill="none" aria-hidden>
      {d.map((path, i) => (
        <motion.path
          key={i}
          d={path}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, delay: 0.35 + i * 0.35, ease: [0.5, 0, 0.3, 1] }}
        />
      ))}
    </svg>
  );
}

// deterministic jitter, so torn edges look the same on every load
function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** A torn paper edge along the top or bottom of a section, in the colour of the sheet it belongs to. */
export function Torn({ edge, color, seed = 1, depth = 26 }: { edge: "top" | "bottom"; color: string; seed?: number; depth?: number }) {
  const path = useMemo(() => {
    const r = rand(seed);
    const n = 90;
    const pts: string[] = [];
    let y = depth * 0.5;
    for (let i = 0; i <= n; i++) {
      y = Math.max(2, Math.min(depth - 2, y + (r() - 0.5) * depth * 0.55));
      const jag = r() < 0.18 ? (r() - 0.5) * depth * 0.6 : 0;
      pts.push(`${((i / n) * 1000).toFixed(1)},${(y + jag).toFixed(1)}`);
    }
    return pts;
  }, [seed, depth]);
  const top = edge === "top";
  // the sheet fills from the torn line to the section edge; a paler fibre line sits just inside it
  const fill = top ? `M0,${depth} L${path.join(" L")} L1000,${depth} Z` : `M0,0 L${path.join(" L")} L1000,0 Z`;
  const fibre = `M${path.join(" L")}`;
  return (
    <svg className={`torn torn-${edge}`} viewBox={`0 0 1000 ${depth}`} preserveAspectRatio="none" aria-hidden style={{ height: depth }}>
      <path d={fill} fill={color} />
      <path d={fibre} stroke="rgba(255,252,244,0.85)" strokeWidth="2.2" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
