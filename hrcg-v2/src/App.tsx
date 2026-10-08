import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useScroll, useTransform, type MotionValue } from 'motion/react';
import Lenis from 'lenis';
import { Permit, CONTACT_EMAIL } from './permit-entry';
import { Hero } from './Hero';

const EXPO = [0.16, 1, 0.3, 1] as const;

const TASKS = [
  {
    num: '01',
    name: 'Bricklaying',
    line: 'Lay up a section of wall in straight courses with even joints, and make sure it’s solid.',
    judged: '',
    film: 'plan-b40',
    ratio: '1 / 1',
  },
  {
    num: '02',
    name: 'Drywall installation',
    line: 'Hang a sheet of drywall square on the framing and fasten it off clean.',
    judged: '',
    film: 'plan-b41',
    ratio: '1 / 1',
  },
  {
    num: '03',
    name: 'Bolted assembly',
    line: 'Get the holes lined up and bolt the connection tight.',
    judged: '',
    film: 'plan-b42',
    ratio: '1 / 1',
  },
  {
    num: '04',
    name: 'Pipe assembly',
    line: 'Make up a run of pipe and fittings to the drawing, without a loose joint anywhere.',
    judged: '',
    film: 'plan-b43',
    ratio: '1 / 1',
  },
  {
    num: '05',
    name: 'Layout and marking',
    line: 'Lay out the plan on the floor with every mark where the drawing puts it, and reference lines clear enough to work from.',
    judged: '',
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

/** Words blur in one by one (when `play` turns true). */
function Words({ text, delay = 0, play = true, className = '' }: { text: string; delay?: number; play?: boolean; className?: string }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="w"
          initial={{ opacity: 0, y: '0.35em', filter: 'blur(10px)' }}
          animate={play ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
          transition={{ duration: 0.9, ease: EXPO, delay: delay + i * 0.08 }}
        >
          {w}
          {i < words.length - 1 ? '\u00a0' : ''}
        </motion.span>
      ))}
    </span>
  );
}

/** The highlighted word: a strip of marking tape slapped on. Plays on `play`, or when scrolled into view. */
function Tape({ children, delay = 0, play }: { children: ReactNode; delay?: number; play?: boolean }) {
  const shown = { opacity: 1, scale: 1, rotate: -3 };
  return (
    <motion.span
      className="tape"
      initial={{ opacity: 0, scale: 1.5, rotate: -14 }}
      animate={play === undefined ? undefined : play ? shown : undefined}
      whileInView={play === undefined ? shown : undefined}
      viewport={{ once: true, margin: '-10% 0px' }}
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

/** The five bays from above. Each bay is a link to its task; hover or focus lights it. Phones swipe along the row. */
function HeroBays({ play, onGo }: { play: boolean; onGo: (id: string) => (e: React.MouseEvent) => void }) {
  const [hot, setHot] = useState<number | null>(null);
  return (
    <motion.div
      className="bays"
      initial={{ opacity: 0, y: 48 }}
      animate={play ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 1.4, ease: EXPO, delay: 0.35 }}
    >
      <div className="bays-scroll">
        <div className={`bays-row ${hot !== null ? 'has-hot' : ''}`}>
          <Film id="arena-0104" ratio="1890 / 350" label="Concept film from above: work bays one to four, one robot working in each." className="bays-film" />
          <Film id="plan-b44" ratio="1 / 1" label="Concept film from above: bay five, a robot marking out a plan on the floor." className="bays-five" />
          {TASKS.map((t, i) => (
            <a
              key={t.num}
              href={`#task-${t.num}`}
              className={`bay ${hot === i ? 'is-hot' : ''}`}
              style={{ left: `calc(100% * ${i * 1.1} / 5.4)` }}
              onMouseEnter={() => setHot(i)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(null)}
              onClick={onGo(`task-${t.num}`)}
            >
              <span className="bay-label">
                <span className="bay-num">{t.num}</span> {t.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </motion.div>
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
  const [introDone, setIntroDone] = useState(false);
  const [ctaHidden, setCtaHidden] = useState(false);
  const [headHidden, setHeadHidden] = useState(false);
  useEffect(() => {
    // the header steps out of the way while you read down, and comes back when you scroll up
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHeadHidden(y > last && y > 160);
      last = y;
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
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
      <header className={`top ${headHidden ? 'is-hidden' : ''}`}>
        <a className="brand" href="#top" aria-label="HRCG, Humanoid Robot Construction Games, back to top">
          <Mark />
          <span>HRCG</span>
        </a>
        <a className="top-link" href="#permit" onClick={go('permit')}>
          Sign up
        </a>
      </header>

      <main id="top">
        <Hero onReady={() => setIntroDone(true)} />
        <section className="bays-band" aria-label="The five bays">
          <HeroBays play={introDone} onGo={go} />
        </section>

        <section className="why">
          <Statement text="The idea is to have humanoid robots do trade work in front of people who build for a living." />
        </section>

        <section className="tasks" aria-labelledby="tasks-h">
          <Reveal className="tasks-head">
            <h2 id="tasks-h">
              What we&rsquo;ll ask the <Chalk>robots</Chalk> to do
            </h2>
          </Reveal>
          <ol className="task-list">
            {TASKS.map((t, i) => (
              <li key={t.num} id={`task-${t.num}`} className={`task ${i % 2 ? 'flip' : ''}`}>
                <Reveal className="task-copy">
                  <span className="task-num">{t.num}</span>
                  <h3>{t.name}</h3>
                  <p>{t.line}</p>
                  {t.judged ? <p className="judged">{t.judged}</p> : null}
                </Reveal>
                <Reveal className="task-film" delay={0.1}>
                  <Film id={t.film} ratio={t.ratio} label={`Concept film from above: a robot at the ${t.name.toLowerCase()} bay.`} />
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section className="who" aria-labelledby="who-h">
          <Reveal>
            <h2 id="who-h">Who we&rsquo;d like to hear from</h2>
          </Reveal>
          <div className="who-grid">
            <Reveal className="who-card">
              <h3>Robot teams</h3>
              <p>If your company, lab or university team is building a humanoid, tell us which tasks suit it and what you&rsquo;d need.</p>
            </Reveal>
            <Reveal className="who-card" delay={0.08}>
              <h3>Construction companies</h3>
              <p>You could supply materials, tools or fixtures for one of the tasks, or lend us someone who knows the trade.</p>
            </Reveal>
          </div>
        </section>

        <section className="permit-section" id="permit" aria-labelledby="permit-h">
          <Reveal className="permit-head">
            <h2 id="permit-h">
              Pull a <Tape>permit</Tape>
            </h2>
            <p>Tear off the stub and your email opens with the message already written. Nothing&rsquo;s confirmed until we write back.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <Permit />
          </Reveal>
        </section>
      </main>

      <footer className="foot">
        <p className="foot-big">We&rsquo;re aiming for New York in 2027</p>
        <p className="foot-small">We&rsquo;ll post the date and venue here once they&rsquo;re settled.</p>
        <a className="foot-mail" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        <p className="disclosure">
          The robot and the footage are AI-generated, and the Games haven&rsquo;t happened yet.
        </p>
      </footer>

      <motion.a
        href="#permit"
        onClick={go('permit')}
        className="pill"
        initial={{ opacity: 0, y: 20 }}
        animate={introDone ? { opacity: ctaHidden ? 0 : 1, y: ctaHidden ? 20 : 0 } : undefined}
        transition={{ duration: 0.5, ease: EXPO, delay: ctaHidden ? 0 : 1.4 }}
        style={{ pointerEvents: ctaHidden ? 'none' : 'auto' }}
        tabIndex={ctaHidden ? -1 : 0}
      >
        Enter or sponsor <span aria-hidden="true">→</span>
      </motion.a>
    </>
  );
}
