import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { JOYCE, SITE } from "../content";
import { Label, Print } from "../ui/collage";
import "./Joyce.css";

/** The Joyce sits behind dark green drapery off Española Way. The curtain parts as you scroll. */
export function Joyce() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const left = useTransform(p, [0.08, 0.55], ["0%", "-96%"]);
  const right = useTransform(p, [0.08, 0.55], ["0%", "96%"]);
  const squash = useTransform(p, [0.08, 0.55], [1, 0.6]);
  const quoteO = useTransform(p, [0, 0.06, 0.3, 0.42], [0, 1, 1, 0]);
  const roomO = useTransform(p, [0.35, 0.55], [0, 1]);
  const roomS = useTransform(p, [0.3, 0.7], [1.06, 1]);
  return (
    <section id="joyce" ref={ref} className="joyce">
      <div className="joyce-stick">
        <motion.div className="joyce-room" style={{ opacity: roomO, scale: roomS }}>
          <div className="wrap joyce-grid">
            <div>
              <p className="eyebrow">The restaurant</p>
              <h2 className="display">
                The <span className="serif">Joyce</span>
              </h2>
              <Label className="joyce-addr">{SITE.address}</Label>
              <p className="joyce-partners">{JOYCE.partners}</p>
              <div className="joyce-cta">
                <a className="btn" href={SITE.reserve} target="_blank" rel="noreferrer">
                  Reserve a table <span className="arrow">↗</span>
                </a>
                <a className="btn ghost" href={SITE.joyce} target="_blank" rel="noreferrer">
                  thejoycerestaurant.com
                </a>
              </div>
            </div>
            <div className="joyce-side">
              <Print id="espanola-corner" caption="Española Way" tape="top" className="joyce-print" />
              <dl className="joyce-facts">
                <p className="joyce-card-head">The Joyce · house notes</p>
                {JOYCE.facts.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </motion.div>
        <motion.div className="curtain l" style={{ x: left, scaleX: squash }} aria-hidden />
        <motion.div className="curtain r" style={{ x: right, scaleX: squash }} aria-hidden />
        <motion.blockquote className="joyce-secret" style={{ opacity: quoteO }}>
          <p className="serif">“{JOYCE.secret}”</p>
          <cite>{JOYCE.secretBy}</cite>
        </motion.blockquote>
      </div>
    </section>
  );
}
