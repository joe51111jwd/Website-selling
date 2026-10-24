import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { media } from "../content";

export const ease = [0.22, 1, 0.36, 1] as const;

/** Fade up once when it scrolls in, the way Apple's section heads arrive. */
export function Reveal({ children, delay = 0, className, y = 28 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Responsive photo from public/media: 1200w and 2400w. */
export function Photo({
  name,
  alt,
  className,
  position,
  eager,
  sizes = "(max-width: 900px) 100vw, 1260px",
}: {
  name: string;
  alt: string;
  className?: string;
  position?: string;
  eager?: boolean;
  sizes?: string;
}) {
  return (
    <img
      className={className}
      src={media(name)}
      srcSet={`${media(name, true)} 1200w, ${media(name)} 2400w`}
      sizes={sizes}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      style={position ? { objectPosition: position } : undefined}
    />
  );
}

/** A wide rounded photo that grows to full size as it scrolls to the middle of the screen. */
export function ScaleMedia({ name, alt, position }: { name: string; alt: string; position?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.84, 1]);
  const inner = useTransform(scrollYProgress, [0, 1], [1.16, 1]);
  return (
    <div className="scale-media" ref={ref}>
      <motion.div className="scale-media-frame" style={{ scale }}>
        <motion.div className="scale-media-img" style={{ scale: inner }}>
          <Photo name={name} alt={alt} position={position} />
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Body copy in Apple's two-tone style: grey text, key phrases in full ink. Odd entries are bold. */
export function Rich({ parts }: { parts: readonly string[] }) {
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

export function Chevron() {
  return (
    <svg className="chev" viewBox="0 0 8 14" aria-hidden="true">
      <path d="M1 1l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PyramidMark({ className = "" }: { className?: string }) {
  return (
    <svg className={`pyramid-mark ${className}`} viewBox="0 0 50 34" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const w = 50 * (1 - i * 0.19);
        return <rect key={i} x={(50 - w) / 2} y={i * 7} width={w} height={4.6} fill="currentColor" />;
      })}
    </svg>
  );
}
