import { motion } from "motion/react";
import { DISHES, type Dish } from "../content";
import { Turntable } from "../ui/Turntable";
import "./Menu.css";

/** The signatures: each dish modelled and rendered in Blender, turning on the pass. */
export function Menu() {
  return (
    <section id="menu" className="menu">
      <div className="menu-head wrap">
        <p className="eyebrow">Signatures</p>
        <h2 className="display">
          On the <span className="serif">pass</span>
        </h2>
        <p className="menu-sub">Five plates from The Joyce, built in 3D. Grab one and turn it.</p>
      </div>
      {DISHES.map((d, i) => (
        <DishRow key={d.id} d={d} flip={i % 2 === 1} />
      ))}
    </section>
  );
}

function DishRow({ d, flip }: { d: Dish; flip: boolean }) {
  return (
    <article className={`dish ${flip ? "flip" : ""}`} id={`dish-${d.id}`}>
      <span className="dish-bg display" aria-hidden>
        {d.no}
      </span>
      <div className="dish-stage">
        <Turntable name={`turn-${d.id}`} label={d.name} />
      </div>
      <motion.div
        className="dish-copy"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="eyebrow">
          No. {d.no} · {d.sub}
        </p>
        <h3 className="display">{d.name}</h3>
        <p className="dish-blurb">{d.blurb}</p>
        <dl className="dish-specs">
          {d.specs.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {d.quote && (
          <blockquote className="dish-quote">
            <p className="serif">“{d.quote.text}”</p>
            <cite>{d.quote.by}</cite>
          </blockquote>
        )}
        {d.id === "burger" && (
          <a className="btn ghost" href="#burger">
            Take it apart <span className="arrow">↓</span>
          </a>
        )}
        {d.id === "ribeye" && (
          <a className="btn ghost" href="#heat">
            Cut into it <span className="arrow">↓</span>
          </a>
        )}
      </motion.div>
    </article>
  );
}
