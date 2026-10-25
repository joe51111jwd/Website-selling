import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { SITE } from "../content";
import { BroilerFire } from "../ui/BroilerFire";
import { reducedMotion } from "../lib/media";
import "./Hero.css";

const BASE = import.meta.env.BASE_URL;

/** Under the broiler: live flames roll across the top of the screen (the pointer fans them), the
 * name hangs in the heat, and the five signatures wait on the pass below (one Blender render). */
export function Hero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const heat = useRef(0);
  const pointer = useRef({ x: 0.5, y: 0.2, stir: 0 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const passY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const passS = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // the broiler lights once the page is ready, then breathes
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    const t0 = performance.now();
    const calm = reducedMotion();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      const ignite = Math.min(1, t / 1.6);
      const breathe = calm ? 0 : 0.05 * Math.sin(t * 0.9) + 0.03 * Math.sin(t * 2.3);
      heat.current = (0.42 + breathe) * (1 - Math.pow(1 - ignite, 3));
      const p = pointer.current;
      p.stir *= 0.94;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  // the preloader holds until the pass render is in
  const img = useRef<HTMLImageElement>(null);
  const loaded = () => window.dispatchEvent(new Event("hero:ready"));
  useEffect(() => {
    if (img.current?.complete) loaded();
  }, []);

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const p = pointer.current;
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / window.innerHeight;
    const speed = Math.hypot(x - p.x, y - p.y);
    p.x = x;
    p.y = y;
    p.stir = Math.min(1, p.stir + speed * 6 + 0.02);
  };

  return (
    <section id="top" ref={ref} className={`hero ${ready ? "in" : ""}`} onPointerMove={onMove}>
      <div className="hero-stick">
        <motion.div className="hero-fire" style={{ opacity: fade }}>
          <BroilerFire heat={heat} pointer={pointer} />
        </motion.div>
        <motion.div className="hero-copy wrap" style={{ y: titleY, opacity: fade }}>
          <p className="eyebrow hero-eyebrow">Executive Chef · {SITE.restaurant} · Miami Beach</p>
          <h1 className="hero-name display" aria-label="James Taylor">
            {["James", "Taylor"].map((word, wi) => (
              <span className="hero-word" key={word} aria-hidden>
                {word.split("").map((ch, i) => (
                  <span className="hero-ch" key={i} style={{ ["--i" as string]: wi * 5 + i }}>
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p className="hero-line serif">{SITE.line}</p>
        </motion.div>
        <motion.div className="hero-pass" style={{ y: passY, scale: passS }}>
          <img
            ref={img}
            onLoad={loaded}
            onError={loaded}
            src={`${BASE}media/lineup.webp`}
            alt="The five signatures on the pass: sour orange pie, caviar and latkes, the Chicago cut ribeye, the Joyce burger and Shanghai firecracker chicken."
            fetchPriority="high"
          />
        </motion.div>
        <div className="hero-foot wrap">
          <span className="hero-temp">
            <i /> Broiler 900°F
          </span>
          <span className="hero-hint">Move to fan the flames</span>
          <span className="hero-scroll">Scroll</span>
        </div>
      </div>
    </section>
  );
}
