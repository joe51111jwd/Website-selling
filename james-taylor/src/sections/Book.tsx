import { motion } from "motion/react";
import { SITE } from "../content";
import { Clip, Torn } from "../ui/collage";
import "./Book.css";

/** Before The Joyce he cooked privately; the dining room hosts private events, menus built by him. */
export function Book() {
  return (
    <section id="book" className="book">
      <Torn edge="top" color="var(--char)" seed={31} depth={34} />
      <div className="book-neon">
        <Clip id="neon-1955" frame="border" caption="Miami Beach after dark, 1955" tape="top" />
      </div>
      <div className="wrap book-in">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow">Private dining &amp; events</p>
          <h2 className="display">
            Your table.
            <br />
            <span className="book-fire">His fire.</span>
          </h2>
          <p className="book-copy">
            Before The Joyce, James cooked in Miami as a private chef. Today the
            art-filled dining room on Española Way takes private events.
          </p>
          <div className="book-cta">
            <a className="btn" href={SITE.privateEvents} target="_blank" rel="noreferrer">
              Plan a private event <span className="arrow">↗</span>
            </a>
            <a className="btn ghost" href={SITE.reserve} target="_blank" rel="noreferrer">
              Reserve a table
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
