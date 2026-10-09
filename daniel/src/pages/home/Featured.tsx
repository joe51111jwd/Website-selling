import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { featured, heroMedia, pad, type Project } from "../../content/work";
import { stage, type Plane } from "../../lib/gl/stage";
import { useCompact } from "../../lib/hooks";
import { clamp, ease, easeInOut, lenis, onTick } from "../../lib/ticker";
import { go } from "../../lib/transition";
import { Arrow } from "../../components/Footer";
import { GLMedia } from "../../components/GLMedia";
import { Link } from "../../components/Link";
import { Magnetic } from "../../components/Magnetic";
import { Label, Roll } from "../../components/Text";

const ZOOM = 1.04;

export function Featured() {
  return useCompact() ? <FeaturedStack /> : <FeaturedPinned />;
}

/**
 * Desktop: the section pins and scrolling scrubs through the three projects.
 * One WebGL frame holds them all; between projects a noise wipe pulls the
 * next film up through the last one.
 */
function FeaturedPinned() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLAnchorElement>(null);
  const plane = useRef<Plane | null>(null);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const dir = useRef(1);
  const n = featured.length;

  useEffect(() => {
    const el = frame.current;
    if (!el || !stage.enabled) return;
    const p = stage.free({ hover: true, reveal: true, zoom: ZOOM, radius: 4 }).track(el);
    p.show(heroMedia(featured[0]));
    plane.current = p;
    return () => {
      p.dispose();
      plane.current = null;
    };
  }, []);

  useEffect(() => {
    let pair = -1;
    let current = 0;
    return onTick(() => {
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      const raw = clamp(-r.top / travel) * (n - 1);
      const i = Math.min(Math.floor(raw), n - 2);
      const f = raw - i;
      // hold, wipe, hold
      const mix = easeInOut(clamp((f - 0.28) / 0.5));
      const p = plane.current;
      if (p) {
        if (i !== pair) {
          pair = i;
          p.show(heroMedia(featured[i]), heroMedia(featured[i + 1]), mix);
        } else p.set("uMix", mix);
      }
      const a = mix > 0.5 ? i + 1 : i;
      if (a !== current) {
        dir.current = a > current ? 1 : -1;
        current = a;
        setActive(a);
      }
      fills.current.forEach((bar, k) => {
        if (bar) bar.style.transform = `scaleX(${k === 0 ? 1 : clamp(raw - k + 1).toFixed(4)})`;
      });
    });
  }, [n]);

  const jump = (k: number) => {
    const el = section.current;
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY + (travel * k) / (n - 1);
    lenis.scrollTo(top, { duration: 1.6 });
  };

  const project = featured[active];
  const open = () => ({ el: frame.current ?? undefined, media: heroMedia(project), zoom: ZOOM });

  return (
    <section className="featured" id="work" ref={section} style={{ height: `${n * 95 + 100}vh` }} data-theme="paper" data-x={`section#work — ${n * 95 + 100}vh, sticky`}>
      <div className="featured-pin">
        <div className="wrap featured-head">
          <Label index="02">Selected work</Label>
          <ol className="featured-tabs" data-x="ol.tabs">
            {featured.map((p, k) => (
              <li key={p.slug}>
                <button type="button" onClick={() => jump(k)} aria-current={k === active ? "true" : undefined}>
                  <span className="featured-tab-text">
                    {pad(k + 1)} <Roll>{p.name}</Roll>
                  </span>
                  <span className="featured-tab-bar">
                    <span ref={(b) => void (fills.current[k] = b)} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="featured-count" aria-hidden>
            <Counter value={active + 1} dir={dir.current} /> / {pad(n)}
          </p>
        </div>

        <div className="wrap featured-stage">
          <Link
            ref={frame}
            to={`/work/${project.slug}`}
            className="featured-frame"
            data-cursor="view"
            data-cursor-label="Open"
            aria-label={`Open the ${project.name} case study`}
            expand={open}
            data-x="a.frame — WebGL"
          >
            <div className="featured-fallback">
              <img src={project.reel?.poster ?? project.cover.src} alt="" />
            </div>
          </Link>
        </div>

        <div className="wrap featured-foot">
          <h3 className="featured-title" aria-live="polite">
            <span className="sr-only">{project.name}</span>
            <AnimatePresence initial={false} custom={dir.current}>
              <motion.span
                key={project.slug}
                className="featured-title-word"
                aria-hidden
                custom={dir.current}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {[...project.name].map((ch, k) => (
                  <motion.span
                    key={k}
                    custom={dir.current}
                    variants={{
                      enter: (d: number) => ({ y: d > 0 ? "105%" : "-105%" }),
                      center: { y: "0%", transition: { duration: 0.9, ease, delay: k * 0.022 } },
                      exit: (d: number) => ({ y: d > 0 ? "-105%" : "105%", transition: { duration: 0.6, ease, delay: k * 0.012 } }),
                    }}
                  >
                    {ch === " " ? " " : ch}
                  </motion.span>
                ))}
              </motion.span>
            </AnimatePresence>
          </h3>
          <div className="featured-meta">
            <AnimatePresence mode="wait" initial={false}>
              <motion.dl
                key={project.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease }}
              >
                <div>
                  <dt className="label">Category</dt>
                  <dd>{project.category}</dd>
                </div>
                <div>
                  <dt className="label">Year</dt>
                  <dd>{project.year}</dd>
                </div>
                <div>
                  <dt className="label">Role</dt>
                  <dd>{project.role}</dd>
                </div>
              </motion.dl>
            </AnimatePresence>
            <Magnetic strength={0.3}>
              <button type="button" className="btn" onClick={() => go(`/work/${project.slug}`, { from: open() })}>
                <Roll>View case study</Roll>
                <Arrow />
              </button>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Two digits that roll like an odometer. */
function Counter({ value, dir }: { value: number; dir: number }) {
  return (
    <span className="counter mask">
      <AnimatePresence initial={false} custom={dir}>
        <motion.span
          key={value}
          custom={dir}
          initial={{ y: dir > 0 ? "100%" : "-100%" }}
          animate={{ y: "0%" }}
          exit={{ y: dir > 0 ? "-100%" : "100%" }}
          transition={{ duration: 0.6, ease }}
        >
          {pad(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Phones: the three projects as a simple stack of cards. */
function FeaturedStack() {
  return (
    <section className="featured featured--stack wrap" id="work" data-theme="paper" data-x="section#work">
      <Label index="02">Selected work</Label>
      {featured.map((p, i) => (
        <FeaturedCard key={p.slug} project={p} index={i} />
      ))}
    </section>
  );
}

function FeaturedCard({ project, index }: { project: Project; index: number }) {
  const media = heroMedia(project);
  return (
    <article className="fcard">
      <Link
        to={`/work/${project.slug}`}
        className="fcard-link"
        aria-label={`Open the ${project.name} case study`}
        expand={(a) => ({ el: a.querySelector<HTMLElement>(".media") ?? undefined, media, zoom: 1.06 })}
      >
        <GLMedia media={media} className="fcard-media" options={{ reveal: true, parallax: 0.06, radius: 4 }} />
      </Link>
      <div className="fcard-info">
        <span className="label">{pad(index + 1)}</span>
        <h3>{project.name}</h3>
        <p>
          {project.category} · {project.year}
        </p>
      </div>
    </article>
  );
}
