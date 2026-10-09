import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { findProject, heroMedia, nextProject, pad, still, work, type Block, type Project as P } from "../content/work";
import { Arrow } from "../components/Footer";
import { GLMedia } from "../components/GLMedia";
import { Link } from "../components/Link";
import { Magnetic } from "../components/Magnetic";
import { Chars, Label, Reveal, Roll } from "../components/Text";
import { ease } from "../lib/ticker";
import { arrival, usePageReady } from "../lib/transition";
import { NotFound } from "./NotFound";

export function Project({ slug }: { slug: string }) {
  const project = findProject(slug);
  if (!project) return <NotFound />;
  return <CaseStudy project={project} />;
}

function CaseStudy({ project }: { project: P }) {
  const ready = usePageReady();
  const index = work.indexOf(project);
  // arriving by the expand transition, the picture is already in place
  const [flewIn] = useState(() => arrival.via === "expand");

  return (
    <article className="case" style={{ ["--accent" as string]: project.color }} data-theme="paper">
      <header className="case-hero" data-x="header.case-hero — 100svh">
        <GLMedia
          media={heroMedia(project)}
          className="case-hero-media"
          eager
          options={{ zoom: 1.12, parallax: 0.12, reveal: !flewIn, bend: false }}
          data-cursor="view"
          data-cursor-label="X-ray"
        />
        <div className="case-hero-shade" />
        <div className="case-hero-text wrap">
          <div className="case-hero-top">
            <Label index={pad(index + 1)}>{project.category}</Label>
            <Link to="/work" className="case-back">
              <Roll>All work</Roll>
            </Link>
          </div>
          <h1 className="case-title">
            <Chars text={project.name} play={ready} delay={flewIn ? 0.05 : 0.3} stagger={0.03} />
          </h1>
          <motion.dl
            className="case-facts"
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 1, ease, delay: 0.5 }}
          >
            <div>
              <dt className="label">Client</dt>
              <dd>{project.client}</dd>
            </div>
            <div>
              <dt className="label">Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt className="label">Year</dt>
              <dd>{project.year}</dd>
            </div>
            <div>
              <dt className="label">Live site</dt>
              <dd>
                {project.url ? (
                  <a href={project.url} target="_blank" rel="noreferrer">
                    <Roll>{project.urlLabel}</Roll> ↗
                  </a>
                ) : (
                  <span className="muted">Link coming soon</span>
                )}
              </dd>
            </div>
          </motion.dl>
        </div>
      </header>

      <section className="case-intro wrap" data-x="section.overview">
        <Label>Overview</Label>
        <div className="case-intro-body">
          <Reveal as="p" className="case-overview" text={project.overview} stagger={0.012} />
          <div className="case-lists">
            <div>
              <p className="label">Services</p>
              <ul>
                {project.services.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label">Stack</p>
              <ul>
                {project.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="case-blocks">
        {project.blocks.map((block, i) => (
          <CaseBlock key={i} block={block} />
        ))}
      </div>

      <NextProject current={project} />
    </article>
  );
}

function CaseBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "text":
      return (
        <section className="cb-text wrap" data-x="section.text">
          <Label>{block.label}</Label>
          <div>
            {block.title && <Reveal as="h2" className="cb-title" text={block.title} />}
            <Reveal as="p" className="cb-body" text={block.body} stagger={0.01} />
          </div>
        </section>
      );
    case "full":
      return (
        <figure className="cb-full wrap" data-x="figure.full — 16:10">
          <GLMedia media={block.media} className="cb-media" options={{ reveal: true, parallax: 0.08, hover: true, radius: 3 }} data-cursor="view" data-cursor-label="X-ray" />
          {block.caption && <figcaption className="label">{block.caption}</figcaption>}
        </figure>
      );
    case "pair":
      return (
        <div className="cb-pair wrap" data-x="div.pair">
          {block.media.map((m) => (
            <GLMedia key={m.src} media={m} className="cb-media" options={{ reveal: true, parallax: 0.06, hover: true, radius: 3 }} data-cursor="view" data-cursor-label="X-ray" />
          ))}
        </div>
      );
    case "phones":
      return (
        <figure className="cb-phones wrap" data-x="figure.phones">
          <div className="cb-phones-row">
            {block.media.map((m) => (
              <GLMedia key={m.src} media={m} className="cb-phone" options={{ reveal: true, radius: 22, hover: true }} data-cursor="view" data-cursor-label="X-ray" />
            ))}
          </div>
          {block.caption && <figcaption className="label">{block.caption}</figcaption>}
        </figure>
      );
    case "stats":
      return (
        <section className="cb-stats wrap" data-x="section.stats">
          {block.items.map((s, i) => (
            <Stat key={s.label} value={s.value} label={s.label} delay={i * 0.12} />
          ))}
        </section>
      );
    case "quote":
      return (
        <blockquote className="cb-quote wrap" data-x="blockquote">
          <Reveal as="p" text={`“${block.text}”`} />
          <footer className="label">— {block.by}</footer>
        </blockquote>
      );
  }
}

/** Numbers count up from zero the first time they're seen; units stay put. */
function Stat({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const out = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const match = value.match(/^([\d.]+)(.*)$/);

  useEffect(() => {
    if (!seen || !match || !out.current) return;
    const target = parseFloat(match[1]);
    const decimals = (match[1].split(".")[1] ?? "").length;
    const start = performance.now() + delay * 1000;
    let id = 0;
    const step = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - start) / 1400));
      const e = 1 - Math.pow(1 - k, 4);
      if (out.current) out.current.textContent = (target * e).toFixed(decimals);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  return (
    <div className="stat" ref={ref}>
      <p className="stat-value">
        {match ? (
          <>
            <span ref={out}>0</span>
            {match[2]}
          </>
        ) : (
          value
        )}
      </p>
      <p className="label">{label}</p>
    </div>
  );
}

function NextProject({ current }: { current: P }) {
  const next = nextProject(current.slug);
  const media = still(next);
  return (
    <section className="next" data-x="section.next">
      <Link
        to={`/work/${next.slug}`}
        className="next-link wrap"
        data-cursor="view"
        data-cursor-label="Next"
        expand={(a) => ({ el: a.querySelector<HTMLElement>(".media") ?? undefined, media, zoom: 1.02 })}
      >
        <Label>Next project</Label>
        <span className="next-name">{next.name}</span>
        <GLMedia media={media} className="next-media" options={{ reveal: true, hover: true, zoom: 1.02, radius: 3 }} />
        <span className="next-meta">
          {next.category} · {next.year}
          <Magnetic strength={0.4}>
            <span className="next-arrow">
              <Arrow />
            </span>
          </Magnetic>
        </span>
      </Link>
    </section>
  );
}
