import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useScroll, useTransform, type MotionValue } from 'motion/react';
import Lenis from 'lenis';
import { Permit, CONTACT_EMAIL } from './Permit';

const EXPO = [0.16, 1, 0.3, 1] as const;

const TASKS = [
  {
    num: '01',
    name: 'Bricklaying',
    line: 'Build a wall segment with straight courses, consistent joints and a stable finish.',
    judged: 'Judged on line, level and joints.',
    film: 'el-c30',
    ratio: '1920 / 804',
  },
  {
    num: '02',
    name: 'Drywall',
    line: 'Position and fasten a panel on a prepared frame, aligned and cleanly finished.',
    judged: 'Judged on alignment and finish.',
    film: 'el-c31',
    ratio: '1080 / 1350',
  },
  {
    num: '03',
    name: 'Bolted assembly',
    line: 'Align the components and complete a secure bolted connection.',
    judged: 'Judged on fit and a secure joint.',
    film: 'el-c32',
    ratio: '1920 / 1076',
  },
  {
    num: '04',
    name: 'Pipe assembly',
    line: 'Connect pipes and fittings to a task drawing, with correct geometry and secure joints.',
    judged: 'Judged against the drawing.',
    film: 'el-c33',
    ratio: '1920 / 804',
  },
  {
    num: '05',
    name: 'Layout and marking',
    line: 'Transfer a plan onto the floor with accurate positions and clear reference lines.',
    judged: 'Judged on position and clarity.',
    film: 'plan-b44',
    ratio: '1 / 1',
  },
] as const;

/** Muted looping film that only plays while on screen. AV1 first, H.264 fallback. */
function Film({ id, ratio, label, className = '' }: { id: string; ratio: string; label: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: '10% 0px' },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <div className={`film ${className}`} style={{ aspectRatio: ratio }}>
      <video ref={ref} muted loop playsInline preload="metadata" poster={`/media/${id}.poster.jpg`} aria-label={label}>
        <source src={`/media/${id}.av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
        <source src={`/media/${id}.h264.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}

/** Words blur in one by one. */
function Words({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="w"
          initial={{ opacity: 0, y: '0.35em', filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: EXPO, delay: delay + i * 0.08 }}
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  );
}

/** The highlighted word: a strip of marking tape slapped on. */
function Tape({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.span
      className="tape"
      initial={{ opacity: 0, scale: 1.5, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: -3 }}
      transition={{ type: 'spring', stiffness: 380, damping: 20, delay }}
    >
      {children}
    </motion.span>
  );
}

/** A blue chalk line snapped under a word when it scrolls into view. */
function Chalk({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '-20% 0px' });
  return (
    <span className="chalk" ref={ref}>
      {children}
      <svg viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true">
        <motion.path
          d="M2 9 C 60 4, 140 12, 298 6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: seen ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EXPO, delay: 0.25 }}
        />
      </svg>
    </span>
  );
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 1, ease: EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Statement whose words darken one by one as you scroll past (from the portfolio's Statement). */
function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] });
  const words = text.split(' ');
  return (
    <p className="statement" ref={ref}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <Word key={i} p={scrollYProgress} from={i / words.length} to={(i + 1) / words.length}>
          {w}
        </Word>
      ))}
    </p>
  );
}
function Word({ p, from, to, children }: { p: MotionValue<number>; from: number; to: number; children: string }) {
  const opacity = useTransform(p, [from, to], [0.16, 1]);
  return (
    <motion.span aria-hidden="true" style={{ opacity }}>
      {children}{' '}
    </motion.span>
  );
}

function Mark() {
  // five bricks in one course: the HRCG mark
  return (
    <svg className="mark" viewBox="0 0 54 8" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={i * 11} y="0" width="10" height="8" />
      ))}
    </svg>
  );
}

export function App() {
  const [ctaHidden, setCtaHidden] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.1 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
  useEffect(() => {
    const el = document.getElementById('permit');
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCtaHidden(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const go = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (lenis) lenis.scrollTo(el, { offset: -24, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className="top">
        <a className="brand" href="#top" aria-label="HRCG, Humanoid Robot Construction Games, back to top">
          <Mark />
          <span>HRCG</span>
        </a>
        <a className="top-link" href="#permit" onClick={go('permit')}>
          Sponsors
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.1 }}>
              The Humanoid Robot Construction Games
            </motion.p>
            <h1>
              <Words text="Can a robot actually" delay={0.2} />{' '}
              <Tape delay={0.75}>build?</Tape>
            </h1>
            <motion.p className="sub" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EXPO, delay: 1.05 }}>
              Five real construction tasks. One site in New York City. 2027.
            </motion.p>
          </div>
          <motion.div className="hero-film" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, ease: EXPO, delay: 0.5 }}>
            <Film id="arena-0104" ratio="1890 / 350" label="Concept film from above: five work bays in a row, one robot working in each." className="only-wide" />
            <Film id="el-c30" ratio="4 / 5" label="Concept film: a robot lays a course of brick." className="only-narrow hero-crop" />
          </motion.div>
        </section>

        <section className="why">
          <Statement text="Humanoid robots are getting very good at demos. This is the other test: real trade work, on a real slab, judged on what is left standing." />
        </section>

        <section className="tasks" aria-labelledby="tasks-h">
          <Reveal className="tasks-head">
            <h2 id="tasks-h">
              Five tasks. <Chalk>Real jobs.</Chalk>
            </h2>
          </Reveal>
          <ol className="task-list">
            {TASKS.map((t, i) => (
              <li key={t.num} className={`task ${i % 2 ? 'flip' : ''}`}>
                <Reveal className="task-copy">
                  <span className="task-num">{t.num}</span>
                  <h3>{t.name}</h3>
                  <p>{t.line}</p>
                  <p className="judged">{t.judged}</p>
                </Reveal>
                <Reveal className="task-film" delay={0.1}>
                  <Film id={t.film} ratio={t.ratio} label={`Concept film: a robot doing ${t.name.toLowerCase()}.`} />
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section className="who" aria-labelledby="who-h">
          <Reveal>
            <h2 id="who-h">Who it&rsquo;s for</h2>
          </Reveal>
          <div className="who-grid">
            <Reveal className="who-card">
              <h3>Robot teams</h3>
              <p>Bring your humanoid. Show the people who build, specify and buy what it can really do.</p>
            </Reveal>
            <Reveal className="who-card" delay={0.08}>
              <h3>Construction companies</h3>
              <p>Sponsor a bay, supply the materials, and meet the teams making robots useful on site.</p>
            </Reveal>
          </div>
        </section>

        <section className="permit-section" id="permit" aria-labelledby="permit-h">
          <Reveal className="permit-head">
            <h2 id="permit-h">
              Get on <Tape>site.</Tape>
            </h2>
            <p>Fill in the permit, tear off the stub, and your email opens ready to send.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <Permit />
          </Reveal>
        </section>
      </main>

      <footer className="foot">
        <p className="foot-big">New York City, 2027.</p>
        <p className="foot-small">Date and venue to be announced.</p>
        <a className="foot-mail" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        <p className="disclosure">
          The robot and the films on this site are AI-generated concept visuals. No robot shown here has competed yet.
        </p>
      </footer>

      <motion.a
        href="#permit"
        onClick={go('permit')}
        className="pill"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: ctaHidden ? 0 : 1, y: ctaHidden ? 20 : 0 }}
        transition={{ duration: 0.5, ease: EXPO, delay: ctaHidden ? 0 : 1.4 }}
        style={{ pointerEvents: ctaHidden ? 'none' : 'auto' }}
        tabIndex={ctaHidden ? -1 : 0}
      >
        Enter your robot <span aria-hidden="true">→</span>
      </motion.a>
    </>
  );
}
