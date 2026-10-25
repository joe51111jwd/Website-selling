import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { BURGER_LAYERS } from "../content";
import { ScrubFilm, type Anchors } from "../ui/ScrubFilm";
import { Counter } from "../ui/Counter";
import "./Burgerability.css";

/** The Joyce Burger, pulled apart by the scroll. Labels ride on the layers (their screen positions
 * are exported from the Blender scene frame by frame). */
export function Burgerability() {
  const ref = useRef<HTMLElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const film = useTransform(scrollYProgress, [0.04, 0.82], [0, 1], { clamp: true });
  const introO = useTransform(scrollYProgress, [0, 0.08, 0.5, 0.62], [0.4, 1, 1, 0.15]);

  const place = (i: number, rect: { x: number; y: number; w: number; h: number }, a: Anchors | null) => {
    if (!a) return;
    const show = Math.max(0, Math.min(1, (i - 38) / 14));
    const stage = ref.current?.querySelector<HTMLElement>(".bur-stage");
    const sw = stage?.clientWidth ?? window.innerWidth;
    const col = Math.min(rect.x + rect.w * 0.86, sw - 190);
    BURGER_LAYERS.forEach((L, k) => {
      const el = labels.current[k];
      const p = a.parts[L.key]?.[Math.min(i, a.frames - 1)];
      if (!el || !p) return;
      const ax = rect.x + p.x * rect.w;
      const ay = rect.y + p.y * rect.h;
      const lead = Math.max(12, col - ax);
      el.style.transform = `translate(${ax}px, ${ay}px)`;
      el.style.setProperty("--lead", `${lead}px`);
      el.style.opacity = String(show);
    });
  };

  return (
    <section id="burger" ref={ref} className="bur">
      <div className="bur-stick">
        <motion.div className="bur-intro wrap" style={{ opacity: introO }}>
          <p className="eyebrow">No. 02 · Taken apart</p>
          <h2 className="display">
            Burger<span className="bur-dot">·</span>ability
          </h2>
          <p className="bur-def">
            <span className="serif">noun.</span> “…what I call ‘burgerability’, meaning a burger that holds together…”
            <cite>James Taylor</cite>
          </p>
        </motion.div>
        <div className="bur-stage">
          <ScrubFilm
            name="film-burger"
            progress={film}
            onFrame={place}
            className="bur-film"
            label="The Joyce Burger coming apart into its layers: brioche crown, Joyce sauce, American cheese, two 75:25 beef patties, brioche heel."
          />
          <div className="bur-labels" aria-hidden>
            {BURGER_LAYERS.map((L, k) => (
              <div key={L.key + k} className="bur-label" ref={(el) => void (labels.current[k] = el)}>
                <i className="bur-lead" />
                <div className="bur-tag">
                  <b>{L.label}</b>
                  <span>{L.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bur-foot wrap">
          <blockquote className="bur-q">
            <p className="serif">
              “We use a brioche bun, American cheese because it melts the best, and all-beef patties with a 75:25 ratio.”
            </p>
            <cite>James Taylor, World Red Eye</cite>
          </blockquote>
          <dl className="bur-stats">
            <div>
              <dt>
                <Counter to={3} />
              </dt>
              <dd>years to get it right</dd>
            </div>
            <div>
              <dt>100s</dt>
              <dd>of iterations</dd>
            </div>
            <div>
              <dt>
                <Counter to={20} suffix="+" />
              </dt>
              <dd>buns tried</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
