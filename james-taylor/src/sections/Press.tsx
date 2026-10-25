import { motion } from "motion/react";
import { AWARDS, PRESS } from "../content";
import "./Press.css";

/** What the critics wrote, set big. */
export function Press() {
  return (
    <section className="press" aria-label="Press">
      <div className="wrap">
        <h2 className="eyebrow">Word from the dining room</h2>
        <ul className="press-list">
          {PRESS.map((q, i) => (
            <motion.li
              key={i}
              className={`press-q ${i % 2 ? "alt" : ""}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <blockquote className="serif">“{q.text}”</blockquote>
              <p className="press-by">
                <b>{q.outlet}</b>
                {q.rating && <span className="press-rate">{q.rating}</span>}
                <span>{q.when}</span>
              </p>
            </motion.li>
          ))}
        </ul>
        <ul className="press-awards">
          {AWARDS.map((a) => (
            <li key={a}>
              <span aria-hidden>✦</span> {a}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
