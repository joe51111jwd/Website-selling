import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { site } from "../../content/site";
import { featured, work } from "../../content/work";
import { cursorCircle, cursorState } from "../../lib/cursor";
import { useFitText } from "../../lib/hooks";
import { clamp, ease, isTouch, lerp, onTick, reducedMotion } from "../../lib/ticker";
import { usePageReady } from "../../lib/transition";
import { Label, Reveal } from "../../components/Text";

/**
 * The hero is drawn twice: the finished surface, and underneath it the
 * structure (outlined type, guides, measurements). The cursor is a lens onto
 * whichever layer is hidden. In Structure mode the two swap places.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const size = useFitText(fitRef);
  const [width, setWidth] = useState(0);
  const ready = usePageReady();

  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.round(el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let r = 0;
    return onTick((time) => {
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      if (box.bottom < 0) return;
      el.style.setProperty("--p", clamp(-box.top / box.height).toFixed(4));

      let x: number;
      let y: number;
      let target: number;
      if (isTouch) {
        // no pointer: the lens drifts on its own (and stays away with reduced motion)
        const t = time;
        // drift along the name, where there's structure to see
        const name = fitRef.current?.getBoundingClientRect();
        const cy = name ? name.top - box.top + name.height * 0.45 : box.height * 0.8;
        x = box.width * (0.5 + 0.36 * Math.sin(t * 0.00027));
        y = cy + (name?.height ?? 80) * 0.25 * Math.sin(t * 0.00041 + 1.3);
        target = reducedMotion ? 0 : Math.min(box.width * 0.2, 110);
      } else {
        x = cursorCircle.x - box.left;
        y = cursorCircle.y - box.top;
        target = cursorState.get().kind === "lens" ? cursorCircle.r : 0;
      }
      r = lerp(r, target, 0.2);
      el.style.setProperty("--lx", `${x.toFixed(1)}px`);
      el.style.setProperty("--ly", `${y.toFixed(1)}px`);
      el.style.setProperty("--lr", `${Math.max(0, r).toFixed(1)}px`);
      if (readout.current) readout.current.textContent = `x ${Math.round(x)}  y ${Math.round(y)}`;
    });
  }, []);

  const layer = (variant: "surface" | "structure") => {
    const structure = variant === "structure";
    return (
      <div className={`hero-layer hero-${variant}`} aria-hidden={structure || undefined}>
        <div className="hero-inner wrap">
          <div className="hero-top">
            <Label index="01" className="hero-label">
              Portfolio ’{String(new Date().getFullYear()).slice(2)} — {site.role}
            </Label>
            <Reveal as="p" className="hero-intro" text={site.intro} delay={0.5} stagger={0.03} immediate />
          </div>
          <motion.ul
            className="hero-meta"
            initial={{ opacity: 0, y: 14 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 1, ease, delay: 0.9 }}
          >
            <li>
              <span className="label">Based in</span>
              {site.location}
            </li>
            <li>
              <span className="label">Selected work</span>
              {String(featured.length).padStart(2, "0")} / {String(work.length).padStart(2, "0")} projects
            </li>
            <li>
              <span className="label">Status</span>
              <span>
                <span className="dot" /> {site.availability}
              </span>
            </li>
            <li className="hero-scroll">
              <span className="label">Scroll</span>
              <span className="hero-scroll-line" />
            </li>
          </motion.ul>
          <div className="hero-name" ref={structure ? undefined : fitRef} style={{ fontSize: size || undefined }}>
            {!structure && (
              <span className="fit-probe hero-probe" data-fit-probe>
                {site.name}
              </span>
            )}
            <span className="hero-name-row">
              {[...site.name].map((ch, i) => (
                <span className="hero-letter" key={i} style={{ ["--k" as string]: 18 + i * 9 }}>
                  <span className="mask">
                    <motion.span
                      initial={{ y: "102%" }}
                      animate={ready ? { y: "0%" } : undefined}
                      transition={{ duration: 1.4, ease, delay: 0.1 + i * 0.07 }}
                    >
                      {ch}
                    </motion.span>
                  </span>
                  {structure && <span className="hero-glyph">U+{ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}</span>}
                </span>
              ))}
            </span>
            {structure && (
              <>
                <span className="guide guide-cap">
                  <i>cap height</i>
                </span>
                <span className="guide guide-base">
                  <i>baseline</i>
                </span>
                <span className="dim">
                  <i>
                    {width}px · Instrument Sans · {Math.round(size)}px · wght 600
                  </i>
                </span>
              </>
            )}
          </div>
        </div>
        {structure && (
          <span className="hero-readout" ref={readout}>
            x 0 y 0
          </span>
        )}
      </div>
    );
  };

  return (
    <section className="hero" ref={ref} data-cursor="lens" data-theme="paper" data-x="section.hero — 100svh">
      <h1 className="sr-only">
        {site.name}, {site.role}
      </h1>
      {layer("surface")}
      {layer("structure")}
    </section>
  );
}
