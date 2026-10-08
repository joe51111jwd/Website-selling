import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import './hero.css';

const EXPO = [0.16, 1, 0.3, 1] as const;
type Phase = 'ghost' | 'pull' | 'snap' | 'freeze';

/**
 * The opening: the slab is dark, a chalk line is pulled taut across it and let go. The snap plays
 * the film (07 slamming the line, chalk dust going up), and it freezes on the last frame with the
 * headline set into the picture: the first words behind the robot, the taped words in front.
 */
export function Hero({ onReady }: { onReady: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>('ghost');
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
  const readyRef = useRef(false);
  const timers = useRef<number[]>([]);

  // chalk line: sag in px, springs flat on release
  const sag = useMotionValue(0);
  const d = useTransform(sag, (v) => `M 0 40 Q 500 ${40 + v} 1000 40`);

  // pointer parallax: the picture and the words move at different depths
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 20 });
  const sy = useSpring(py, { stiffness: 60, damping: 20 });
  const mediaX = useTransform(sx, (v) => v * -14);
  const mediaY = useTransform(sy, (v) => v * -10);
  const farX = useTransform(sx, (v) => v * -6);
  const farY = useTransform(sy, (v) => v * -4);
  const nearX = useTransform(sx, (v) => v * 22);
  const nearY = useTransform(sy, (v) => v * 14);

  // scroll: the picture pushes in a little and the words lift away
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const zoom = useTransform(scrollYProgress, [0, 1], [1.06, 1.18]);
  const lift = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const ready = () => {
    if (readyRef.current) return;
    readyRef.current = true;
    onReady();
  };

  const freeze = () => {
    setPhase('freeze');
    ready();
  };

  const snap = () => {
    setPhase('snap');
    animate(sag, 0, { type: 'spring', stiffness: 700, damping: 7 });
    const v = filmRef.current;
    if (v) {
      v.currentTime = 0;
      const p = v.play();
      if (p) p.catch(() => freeze());
      // the film is one second long; hold its last frame as the still
      timers.current.push(window.setTimeout(freeze, 1100));
    } else freeze();
    window.setTimeout(ready, 450);
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setPhase('freeze');
      ready();
      return () => mq.removeEventListener('change', on);
    }
    const t = timers.current;
    t.push(window.setTimeout(() => setPhase('pull'), 700));
    t.push(window.setTimeout(() => animate(sag, narrow ? 26 : 46, { duration: 0.7, ease: [0.4, 0, 0.2, 1] }), 900));
    t.push(window.setTimeout(snap, 1750));
    t.push(window.setTimeout(freeze, 4200)); // never hold the page hostage
    const skip = () => {
      if (phase === 'freeze') return;
      t.forEach(clearTimeout);
      setPhase('freeze');
      ready();
    };
    window.addEventListener('wheel', skip, { passive: true, once: true });
    window.addEventListener('touchmove', skip, { passive: true, once: true });
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      t.forEach(clearTimeout);
      mq.removeEventListener('change', on);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchmove', skip);
      window.removeEventListener('keydown', skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    py.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  const o = narrow ? '916' : '169';
  const lit = phase === 'snap' || phase === 'freeze';
  const still = phase === 'freeze';

  return (
    <section className={`hx is-${phase}`} ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} aria-labelledby="hx-h">
      <motion.div className="hx-media" style={{ x: mediaX, y: mediaY, scale: zoom }}>
        <img className="hx-ground" src={`/media/hero-ground-${o}.jpg`} alt="" />
        <video
          ref={filmRef}
          key={o}
          className="hx-film"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onEnded={freeze}
        >
          <source src={`/media/hero-snap-${o}.av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
          <source src={`/media/hero-snap-${o}.h264.mp4`} type="video/mp4" />
        </video>
        <img
          className="hx-still"
          src={`/media/hero-still-${o}-av1.jpg`}
          alt="Concept film still: a humanoid robot, number 07, crouched on a concrete slab in a cloud of blue chalk dust."
        />
      </motion.div>

      {/* the first words sit in the picture, behind the robot */}
      <motion.div className="hx-far-wrap" style={{ y: lift, opacity: fade }}>
        <motion.h1 id="hx-h" className={`hx-far ${lit ? 'is-lit' : ''}`} style={{ x: farX, y: farY }}>
          <span className="sr-only">We want to see a robot lay brick</span>
          <span aria-hidden="true">
            We want to see
            <br />a robot
          </span>
        </motion.h1>
      </motion.div>
      {!narrow && (
        <motion.div className="hx-cut-wrap" style={{ x: mediaX, y: mediaY, scale: zoom }} aria-hidden="true">
          <img
            className={`hx-cut ${still ? 'is-on' : ''}`}
            src={`/media/hero-still-169-av1.jpg`}
            alt=""
            style={{ WebkitMaskImage: 'url(/media/hero-matte-169.webp)', maskImage: 'url(/media/hero-matte-169.webp)' }}
          />
        </motion.div>
      )}

      {/* the taped words, in front */}
      <motion.div className="hx-near" style={{ y: lift, opacity: fade }} aria-hidden="true">
        <motion.div style={{ x: nearX, y: nearY }}>
        <motion.span
          className="tape hx-tape"
          initial={{ opacity: 0, scale: 1.6, rotate: -16 }}
          animate={lit ? { opacity: 1, scale: 1, rotate: -4 } : undefined}
          transition={{ type: 'spring', stiffness: 360, damping: 18, delay: 0.18 }}
        >
          lay brick
        </motion.span>
        </motion.div>
      </motion.div>

      <motion.div className="hx-sub-wrap" style={{ opacity: fade }}>
      <motion.p
        className="hx-sub"
        initial={{ opacity: 0, y: 12 }}
        animate={lit ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.9, ease: EXPO, delay: 0.6 }}
      >
        That&rsquo;s one of five tasks at the first Humanoid Robot Construction Games, which we&rsquo;re planning for New York City in&nbsp;2027.
      </motion.p>
      </motion.div>

      {/* the chalk line, pulled taut and let go */}
      <motion.svg
        className="hx-line"
        viewBox="0 0 1000 80"
        preserveAspectRatio="none"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'ghost' ? 0 : phase === 'pull' ? 1 : 0 }}
        transition={{ duration: phase === 'snap' ? 0.35 : 0.4, delay: phase === 'snap' ? 0.12 : 0 }}
      >
        <defs>
          <filter id="hx-chalk" x="-2%" y="-50%" width="104%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="2.4" />
          </filter>
        </defs>
        <motion.path
          d={d}
          filter="url(#hx-chalk)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: phase === 'ghost' ? 0 : 1 }}
          transition={{ duration: 0.5, ease: EXPO }}
        />
      </motion.svg>
    </section>
  );
}
