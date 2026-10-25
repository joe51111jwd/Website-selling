import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { PHILOSOPHY } from "../content";
import "./Creed.css";

/** His own description of his food. The words catch, one after another, as it scrolls past. */
export function Creed() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const words = `“${PHILOSOPHY.quote.charAt(0).toUpperCase()}${PHILOSOPHY.quote.slice(1)}.”`.split(" ");
  return (
    <section ref={ref} className="creed" aria-label="Philosophy">
      <div className="wrap">
        <p className="eyebrow">The food</p>
        <blockquote className="creed-q">
          {words.map((w, i) => (
            <Word key={i} p={scrollYProgress} at={i / words.length} span={1 / words.length}>
              {w}
            </Word>
          ))}
        </blockquote>
        <div className="creed-foot">
          <span className="serif">{PHILOSOPHY.magic}</span>
          <span className="eyebrow">{PHILOSOPHY.by}</span>
        </div>
        <p className="creed-tag display">
          American <em className="serif">nostalgia</em>
        </p>
      </div>
    </section>
  );
}

function Word({ p, at, span, children }: { p: MotionValue<number>; at: number; span: number; children: string }) {
  const k = useTransform(p, [at, at + span * 2.5], [0, 1], { clamp: true });
  const color = useTransform(k, [0, 0.5, 1], ["rgba(141,130,120,0.28)", "#ff7a2c", "#f1e8da"]);
  const glow = useTransform(k, [0, 0.5, 1], ["0 0 0px rgba(255,90,31,0)", "0 0 28px rgba(255,90,31,0.9)", "0 0 0px rgba(255,90,31,0)"]);
  return (
    <motion.span className="creed-w" style={{ color, textShadow: glow }}>
      {children}{" "}
    </motion.span>
  );
}
