import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import Lenis from 'lenis';
import { Hero } from '../Hero';
import { Permit, CONTACT_EMAIL } from '../permit-entry';

/**
 * The scroll story: one idea per screen. Each part is a tall section whose inner screen is pinned
 * (position: sticky) while its content rises in, holds, and lifts away as the next part takes over.
 */

const EXPO = [0.16, 1, 0.3, 1] as const;

// the five tasks' copy, as on the main page (App.tsx)
const TASKS = [
  { num: '01', name: 'Bricklaying', line: 'Lay up a section of wall in straight courses with even joints, and make sure it’s solid.', film: 'plan-b40' },
  { num: '02', name: 'Drywall installation', line: 'Hang a sheet of drywall square on the framing and fasten it off clean.', film: 'plan-b41' },
  { num: '03', name: 'Bolted assembly', line: 'Get the holes lined up and bolt the connection tight.', film: 'plan-b42' },
  { num: '04', name: 'Pipe assembly', line: 'Make up a run of pipe and fittings to the drawing, without a loose joint anywhere.', film: 'plan-b43' },
  {
    num: '05',
    name: 'Layout and marking',
    line: 'Lay out the plan on the floor with every mark where the drawing puts it, and reference lines clear enough to work from.',
    film: 'plan-b44',
  },
] as const;

type Tone = 'ink' | 'chalk';
const TONE_RGB: Record<Tone, [number, number, number]> = { ink: [40, 48, 47], chalk: [243, 244, 241] };

/**
 * A pinned scene's scroll progress. `at(s)` turns "s screen-heights x 100 scrolled since the scene's top
 * met the bottom of the screen" into progress: the screen pins at s = 100 and lets go at s = h.
 */
function useScene(h: number) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const at = (s: number) => Math.min(1, Math.max(0, s / (h + 100)));
  return { ref, p: scrollYProgress, at };
}

function Scene({
  tone,
  h,
  sceneRef,
  className = '',
  label,
  id,
  children,
}: {
  tone: Tone;
  h: number;
  sceneRef: React.RefObject<HTMLElement | null>;
  className?: string;
  label: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      ref={sceneRef}
      id={id}
      className={`sc tone-${tone} ${className}`}
      data-tone={tone}
      style={{ '--h': h } as CSSProperties}
      aria-label={label}
    >
      <div className="sc-pin">{children}</div>
    </section>
  );
}

/** Lifts the scene's content up and away at the end (s from h - 40 to h + 40). */
function useExit(p: MotionValue<number>, at: (s: number) => number, h: number) {
  const y = useTransform(p, [at(h - 40), at(h + 40)], ['0%', '-22%']);
  const opacity = useTransform(p, [at(h - 40), at(h + 30)], [1, 0]);
  return { y, opacity };
}

/** One word that rises and sharpens in between `from` and `to`. */
function RiseWord({ p, from, to, still, children }: { p: MotionValue<number>; from: number; to: number; still: boolean; children: string }) {
  const opacity = useTransform(p, [from, to], [0, 1]);
  const y = useTransform(p, [from, to], ['0.45em', '0em']);
  const blur = useTransform(p, [from, to], [14, 0]);
  const filter = useMotionTemplate`blur(${blur}px)`;
  return (
    <motion.span className="w" aria-hidden="true" style={still ? undefined : { opacity, y, filter }}>
      {children}
    </motion.span>
  );
}

function Rise({
  text,
  p,
  from,
  step = 0.012,
  span = 0.08,
  still,
}: {
  text: string;
  p: MotionValue<number>;
  from: number;
  step?: number;
  span?: number;
  still: boolean;
}) {
  const words = text.split(' ');
  return (
    <>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <Fragment key={i}>
          <RiseWord p={p} from={from + i * step} to={from + i * step + span} still={still}>
            {w}
          </RiseWord>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}

/** A block that rises and sharpens in between `from` and `to`. */
function RiseBlock({
  p,
  from,
  to,
  still,
  className,
  children,
}: {
  p: MotionValue<number>;
  from: number;
  to: number;
  still: boolean;
  className?: string;
  children: ReactNode;
}) {
  const opacity = useTransform(p, [from, to], [0, 1]);
  const y = useTransform(p, [from, to], [36, 0]);
  const blur = useTransform(p, [from, to], [10, 0]);
  const filter = useMotionTemplate`blur(${blur}px)`;
  return (
    <motion.div className={className} style={still ? undefined : { opacity, y, filter }}>
      {children}
    </motion.div>
  );
}

/** Muted looping film that only plays while its screen is on. AV1 first, H.264 fallback. */
function Film({ id, label }: { id: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <div className="film st-film">
      <video ref={ref} muted loop playsInline preload="metadata" poster={`/media/${id}.poster.jpg`} aria-label={label}>
        <source src={`/media/${id}.av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
        <source src={`/media/${id}.h264.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}

/* ---------- 2. the statement ---------- */

const STATEMENT = 'The idea is to have humanoid robots do trade work in front of people who build for a living.';

function LitWord({ p, from, to, still, children }: { p: MotionValue<number>; from: number; to: number; still: boolean; children: string }) {
  const opacity = useTransform(p, [from, to], [0.14, 1]);
  return (
    <motion.span aria-hidden="true" style={still ? undefined : { opacity }}>
      {children}
    </motion.span>
  );
}

function StatementScene({ still }: { still: boolean }) {
  const H = 260;
  const { ref, p, at } = useScene(H);
  const exit = useExit(p, at, H);
  const enterY = useTransform(p, [at(10), at(100)], [80, 0]);
  const words = STATEMENT.split(' ');
  // the words light up one by one while the screen is pinned
  const a = at(70);
  const b = at(H - 70);
  const n = words.length;
  return (
    <Scene tone="chalk" h={H} sceneRef={ref} className="sc-statement" label="The idea">
      <motion.div className="st-wrap" style={still ? undefined : exit}>
        <motion.p className="st-statement" style={still ? undefined : { y: enterY }}>
          <span className="sr-only">{STATEMENT}</span>
          {words.map((w, i) => (
            <Fragment key={i}>
              <LitWord p={p} from={a + ((b - a) * i) / n} to={a + ((b - a) * (i + 1.4)) / n} still={still}>
                {w}
              </LitWord>
              {i < n - 1 ? ' ' : null}
            </Fragment>
          ))}
        </motion.p>
      </motion.div>
    </Scene>
  );
}

/* ---------- 3–7. one screen per task ---------- */

function TaskScene({ task, index, still }: { task: (typeof TASKS)[number]; index: number; still: boolean }) {
  const H = 240;
  const { ref, p, at } = useScene(H);
  const exit = useExit(p, at, H);
  // the film slides up through the whole stay and settles from 0.9 to full size while the words hold
  const filmY = useTransform(p, [at(0), at(H)], ['20%', '-12%']);
  const filmScale = useTransform(p, [at(20), at(150)], [0.9, 1]);
  const filmOpacity = useTransform(p, [at(0), at(60)], [0, 1]);
  const tone: Tone = index % 2 === 0 ? 'ink' : 'chalk';
  return (
    <Scene tone={tone} h={H} sceneRef={ref} id={`task-${task.num}`} className="sc-task" label={`Task ${task.num}: ${task.name}`}>
      <motion.div className={`tk ${index % 2 ? 'flip' : ''}`} style={still ? undefined : exit}>
        <motion.div className="tk-film" style={still ? undefined : { y: filmY, scale: filmScale, opacity: filmOpacity }}>
          <Film id={task.film} label={`Concept film from above: a robot at the ${task.name.toLowerCase()} bay.`} />
        </motion.div>
        <div className="tk-copy">
          <RiseBlock p={p} from={at(25)} to={at(95)} still={still} className="tk-num">
            <span aria-hidden="true">{task.num}</span>
            <span className="sr-only">Task {task.num}</span>
          </RiseBlock>
          <h2 className="tk-name">
            <Rise text={task.name} p={p} from={at(40)} step={at(6)} span={at(55)} still={still} />
          </h2>
          <RiseBlock p={p} from={at(65)} to={at(125)} still={still} className="tk-line">
            <p>{task.line}</p>
          </RiseBlock>
        </div>
      </motion.div>
    </Scene>
  );
}

/* ---------- 8. who we'd like to hear from ---------- */

function WhoScene({ still }: { still: boolean }) {
  const H = 230;
  const { ref, p, at } = useScene(H);
  const exit = useExit(p, at, H);
  return (
    <Scene tone="chalk" h={H} sceneRef={ref} className="sc-who" label="Who we’d like to hear from">
      <motion.div className="who-s" style={still ? undefined : exit}>
        <h2 className="who-s-h">
          <Rise text="Who we’d like to hear from" p={p} from={at(25)} step={at(6)} span={at(55)} still={still} />
        </h2>
        <div className="who-s-grid">
          <RiseBlock p={p} from={at(70)} to={at(130)} still={still} className="who-s-card">
            <h3>Robot teams</h3>
            <p>If your company, lab or university team is building a humanoid, tell us which tasks suit it and what you&rsquo;d need.</p>
          </RiseBlock>
          <RiseBlock p={p} from={at(85)} to={at(145)} still={still} className="who-s-card">
            <h3>Construction companies</h3>
            <p>You could supply materials, tools or fixtures for one of the tasks, or lend us someone who knows the trade.</p>
          </RiseBlock>
        </div>
      </motion.div>
    </Scene>
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

/**
 * The page colour sits on one fixed layer behind everything, and blends from one part's tone to the
 * next's over the screen-height of scroll where one part hands over to the next.
 */
function useToneBackground(bgRef: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = bgRef.current;
    if (!el || !enabled) return;
    let stops: { y: number; c: [number, number, number] }[] = [];
    const paint = () => {
      if (!stops.length) return;
      const y = window.scrollY;
      let c = stops[0].c;
      if (y >= stops[stops.length - 1].y) c = stops[stops.length - 1].c;
      else
        for (let k = 0; k < stops.length - 1; k++) {
          const a = stops[k];
          const b = stops[k + 1];
          if (y >= a.y && y <= b.y) {
            // the blend happens in the middle of the handover, so no screen sits long in a muddy in-between
            const t0 = b.y > a.y ? Math.min(1, Math.max(0, ((y - a.y) / (b.y - a.y) - 0.2) / 0.6)) : 1;
            const t = t0 * t0 * (3 - 2 * t0);
            c = [0, 1, 2].map((j) => Math.round(a.c[j] + (b.c[j] - a.c[j]) * t)) as [number, number, number];
            break;
          }
        }
      el.style.backgroundColor = `rgb(${c[0]} ${c[1]} ${c[2]})`;
    };
    const measure = () => {
      const vh = window.innerHeight;
      const next: typeof stops = [];
      document.querySelectorAll<HTMLElement>('[data-tone]').forEach((s) => {
        const top = s.getBoundingClientRect().top + window.scrollY;
        const c = TONE_RGB[(s.dataset.tone as Tone) ?? 'chalk'];
        // the tone holds fully while the part fills the screen
        next.push({ y: top, c }, { y: Math.max(top, top + s.offsetHeight - vh), c });
      });
      stops = next;
      paint();
    };
    measure();
    window.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      window.removeEventListener('scroll', paint);
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [bgRef, enabled]);
}

export function Story() {
  const still = !!useReducedMotion();
  const [introDone, setIntroDone] = useState(false);
  const [ctaHidden, setCtaHidden] = useState(false);
  const [headHidden, setHeadHidden] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);
  useToneBackground(bgRef, !still);

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
    // the pill steps aside while the permit or the footer is on screen
    const els = ['permit', 'foot'].map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const on = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? on.add(e.target) : on.delete(e.target)));
        setCtaHidden(on.size > 0);
      },
      { threshold: 0.12 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (lenis) lenis.scrollTo(el, { offset: -24, duration: 1.8 });
    else el.scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
  };

  return (
    <div className={`story ${still ? 'is-still' : ''}`}>
      <div className="st-bg" ref={bgRef} aria-hidden="true" />

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
        <div className="st-hero" data-tone="ink">
          <Hero onReady={() => setIntroDone(true)} />
        </div>

        <StatementScene still={still} />

        {TASKS.map((t, i) => (
          <TaskScene key={t.num} task={t} index={i} still={still} />
        ))}

        <WhoScene still={still} />

        <section className="st-permit tone-chalk" id="permit" data-tone="chalk" aria-labelledby="permit-h">
          <motion.div
            className="st-permit-head"
            initial={still ? false : { opacity: 0, y: 32, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 1, ease: EXPO }}
          >
            <h2 id="permit-h">
              Pull a{' '}
              <motion.span
                className="tape"
                initial={still ? false : { opacity: 0, scale: 1.5, rotate: -14 }}
                whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.2 }}
              >
                permit
              </motion.span>
            </h2>
            <p>Tear off the stub and your email opens with the message already written. Nothing&rsquo;s confirmed until we write back.</p>
          </motion.div>
          <Permit />
        </section>
      </main>

      <footer className="foot" id="foot" data-tone="ink">
        <p className="foot-big">We&rsquo;re aiming for New York in 2027</p>
        <p className="foot-small">We&rsquo;ll post the date and venue here once they&rsquo;re settled.</p>
        <a className="foot-mail" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        <p className="disclosure">The robot and the footage are AI-generated, and the Games haven&rsquo;t happened yet.</p>
      </footer>

      <motion.a
        href="#permit"
        onClick={go('permit')}
        className="pill st-pill"
        initial={{ opacity: 0, y: 20 }}
        animate={introDone ? { opacity: ctaHidden ? 0 : 1, y: ctaHidden ? 20 : 0 } : undefined}
        transition={{ duration: 0.5, ease: EXPO, delay: ctaHidden ? 0 : 0.6 }}
        style={{ pointerEvents: ctaHidden ? 'none' : 'auto' }}
        tabIndex={ctaHidden ? -1 : 0}
      >
        Enter or sponsor <span aria-hidden="true">→</span>
      </motion.a>
    </div>
  );
}
