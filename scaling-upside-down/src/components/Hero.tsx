import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { hero, media } from "../content";
import { Chevron } from "./ui";

/*
  The opening. The lake shows up mirrored, so a lit skyscraper seems to stand on the water: "Every growth
  playbook sells you the tower." Then the picture folds shut at the waterline and opens the right way
  up. The real thing is a small stone house; the tower was its reflection. The headline lands in the sky.
  On scroll the full-bleed frame tightens into a rounded card and the white page takes over.
*/

type Phase = 0 | 1 | 2 | 3;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Hero({ onReady }: { onReady: () => void }) {
  const [phase, setPhase] = useState<Phase>(() => (reduced() ? 3 : 0));
  const [instant, setInstant] = useState(reduced);
  const img = useRef<HTMLImageElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (phase === 3) onReady();
  }, [phase, onReady]);

  useEffect(() => {
    if (reduced()) return;
    const list = timers.current;
    const start = () => {
      list.push(window.setTimeout(() => setPhase(1), 80));
      list.push(window.setTimeout(() => setPhase(2), 2900));
      list.push(window.setTimeout(() => setPhase(3), 4150));
    };
    const el = img.current;
    if (!el || el.complete) start();
    else {
      el.addEventListener("load", start, { once: true });
      el.addEventListener("error", start, { once: true });
    }
    return () => list.forEach(clearTimeout);
  }, []);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    setInstant(true);
    setPhase(3);
  };

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const clipPath = useTransform(scrollYProgress, (p) => {
    const k = Math.min(1, p * 1.15);
    return `inset(${k * 7}vh ${k * 4}vw ${k * 7}vh ${k * 4}vw round ${k * 30}px)`;
  });
  const artScale = useTransform(scrollYProgress, [0, 1], [1, 1.07]);
  const copyY = useTransform(scrollYProgress, [0, 0.6], ["0vh", "-9vh"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.42], [1, 0]);

  return (
    <section className={`hero p${phase}${instant ? " instant" : ""}`} ref={ref} id="top" aria-label="Scaling Upside Down">
      <div className="hero-sticky">
        <motion.div className="hero-frame" style={{ clipPath }}>
          <div className="hero-stage">
            <motion.div className="hero-art" style={{ scale: artScale }}>
              <img
                ref={img}
                src={media("lake")}
                srcSet={`${media("lake", true)} 1200w, ${media("lake")} 2400w`}
                sizes="100vw"
                alt="A small stone house on a still lake at night. Its reflection in the water is a skyscraper."
                fetchPriority="high"
                draggable={false}
              />
            </motion.div>
          </div>
          <div className="hero-grain" aria-hidden="true" />

          <p className="hero-cap" aria-hidden="true">
            {hero.intro}
          </p>

          <motion.div className="hero-copy" style={{ y: copyY, opacity: copyOpacity }}>
            <p className="hero-eyebrow">{hero.eyebrow}</p>
            <h1 className="hero-title">{hero.headline}</h1>
            <p className="hero-sub">{hero.sub}</p>
            <div className="hero-ctas">
              <a className="btn btn-blue" href="#buy">
                Pre-order
              </a>
              <a className="link link-light" href="#bootloader">
                Get the free bootloader <Chevron />
              </a>
            </div>
          </motion.div>

          <p className="hero-note">{hero.note}</p>
          {phase < 3 ? (
            <button className="hero-skip" type="button" onClick={skip}>
              Skip intro
            </button>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
