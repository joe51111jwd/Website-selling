import { motion } from "motion/react";
import { SITE } from "../content";
import "./Book.css";

/** Before The Joyce he cooked privately; the dining room hosts private events, menus built by him. */
export function Book() {
  return (
    <section id="book" className="book">
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
            Before The Joyce, James cooked for private clients across the country. Today the art-filled dining room on
            Española Way takes private events, with a menu he builds for each one.
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
