import { site } from "../content/site";
import { moreWork, featured, pad, work } from "../content/work";
import { Arrow } from "../components/Footer";
import { Link } from "../components/Link";
import { Marquee } from "../components/Marquee";
import { ProjectList } from "../components/ProjectList";
import { Label, Reveal, Roll } from "../components/Text";
import { motion } from "motion/react";
import { ease } from "../lib/ticker";
import { Hero } from "./home/Hero";
import { Featured } from "./home/Featured";

export function Home() {
  return (
    <>
      <Hero />
      <Featured />
      <MoreWork />
      <About />
    </>
  );
}

function MoreWork() {
  return (
    <section className="more wrap" data-theme="paper" data-x="section.more">
      <div className="section-head">
        <Label index="03">More work</Label>
        <Reveal as="h2" className="section-title" text="Smaller builds, *same care.*" />
      </div>
      <ProjectList items={moreWork} offset={featured.length} />
      <div className="more-foot">
        <Link to="/work" className="btn btn--ghost">
          <Roll>{`All work (${pad(work.length)})`}</Roll>
          <Arrow />
        </Link>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="about" id="about" data-theme="ink" data-x="section#about">
      <div className="wrap">
        <Label index="04">About</Label>
        <Reveal as="h2" className="about-statement" text={site.about.statement} stagger={0.014} />
        <div className="about-cols">
          <div className="about-paras">
            {site.about.paragraphs.map((p, i) => (
              <Reveal key={i} text={p} className="about-p" stagger={0.01} />
            ))}
          </div>
          <div className="about-caps">
            {site.capabilities.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 0.9, ease, delay: i * 0.08 }}
              >
                <h3>
                  <span className="label">{pad(i + 1)}</span>
                  {c.title}
                </h3>
                <ul>
                  {c.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="process-head">
          <Label>How a project runs</Label>
        </div>
        <ol className="process" data-x="ol.process">
          {site.process.map((step, i) => (
            <motion.li
              key={step.title}
              initial="hidden"
              whileInView="shown"
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ staggerChildren: 0.08, delayChildren: i * 0.12 }}
            >
              <motion.span
                className="process-line"
                variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1, transition: { duration: 1.2, ease } } }}
              />
              <motion.span className="label" variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}>
                {pad(i + 1)}
              </motion.span>
              <motion.h3 variants={{ hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }}>
                {step.title}
              </motion.h3>
              <motion.p variants={{ hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }}>
                {step.body}
              </motion.p>
            </motion.li>
          ))}
        </ol>
      </div>
      <Marquee items={site.marquee} />
    </section>
  );
}
