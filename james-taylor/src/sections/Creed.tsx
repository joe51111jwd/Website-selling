import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { PHILOSOPHY } from "../content";
import { Clip, Doodle, Note } from "../ui/collage";
import "./Creed.css";

const MARK = new Set(["memorable", "meals"]);

/** His own description of his food, typed out. The words ink in as it scrolls past; the ones that
 * matter get the highlighter. */
export function Creed() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const words = `“${PHILOSOPHY.quote.charAt(0).toUpperCase()}${PHILOSOPHY.quote.slice(1)}.”`.split(" ");
  return (
    <section ref={ref} className="creed" aria-label="Philosophy">
      <div className="wrap">
        <p className="eyebrow">The food, in his words</p>
        <blockquote className="creed-q">
          {words.map((w, i) => (
            <Word key={i} p={scrollYProgress} at={i / words.length} span={1 / words.length} mark={MARK.has(w.replace(/\W/g, ""))}>
              {w}
            </Word>
          ))}
        </blockquote>
        <p className="creed-by type">{PHILOSOPHY.by}</p>
        <motion.div
          className="creed-clip"
          initial={{ opacity: 0, scale: 1.25, rotate: 10 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <Clip id="dinner-1950" caption="dinner, 1950 (archive film)" tape="top" />
        </motion.div>
        <div className="creed-magic">
          <Note color="marker">{PHILOSOPHY.magic}</Note>
          <Doodle kind="underline" className="creed-line" />
        </div>
      </div>
    </section>
  );
}

function Word({ p, at, span, mark, children }: { p: MotionValue<number>; at: number; span: number; mark: boolean; children: string }) {
  const k = useTransform(p, [at, at + span * 2.5], [0, 1], { clamp: true });
  const color = useTransform(k, [0, 1], ["rgba(23,18,14,0.14)", "rgba(23,18,14,1)"]);
  const swipe = useTransform(k, [0.4, 1], ["0% 100%", "100% 100%"]);
  return (
    <motion.span className={`creed-w ${mark ? "mark" : ""}`} style={mark ? { color, backgroundSize: swipe } : { color }}>
      {children}{" "}
    </motion.span>
  );
}
