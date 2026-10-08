import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import './hero.css';

const EXPO = [0.16, 1, 0.3, 1] as const;
type Phase = 'dark' | 'play' | 'lit' | 'end';

/** When the line snaps in each take (seconds); the words light up on the snap. */
const SNAP_AT = { '169': 2.62, '916': 2.3 } as const;

/**
 * The opening: the whole take plays and loops seamlessly (its tail crossfades into its head). 07 holds
 * the chalk line, pulls it, lets it go, and the dust settles. The headline lights
 * up on the snap. Moving the pointer looks around the scene while it plays.
 */
/** Paint and wear for lettering, so type sits in the gritty world instead of floating over it. */
export function PaintDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {/* stencil spray on a wall: ragged edges, flecks of wear, a little bleed */}
        <filter id="paint" x="-4%" y="-12%" width="108%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="4" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="11" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -11 7.4" result="wear" />
          <feComposite in="rough" in2="wear" operator="in" result="worn" />
          <feGaussianBlur in="worn" stdDeviation="0.4" />
        </filter>
        {/* lighter version for headings on paper */}
        <filter id="paint-lite" x="-3%" y="-10%" width="106%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -14 9.9" result="wear" />
          <feComposite in="rough" in2="wear" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

export function Hero({ onReady }: { onReady: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>('dark');
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
  const readyRef = useRef(false);
  const o = narrow ? '916' : '169';

  // pointer: look around. The picture tilts and slides; the words sit at other depths.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 50, damping: 18 });
  const sy = useSpring(py, { stiffness: 50, damping: 18 });
  const mediaX = useTransform(sx, (v) => v * -42);
  const mediaY = useTransform(sy, (v) => v * -26);
  const rotY = useTransform(sx, (v) => v * 4);
  const rotX = useTransform(sy, (v) => v * -3);
  const farX = useTransform(sx, (v) => v * -18);
  const farY = useTransform(sy, (v) => v * -12);
  const nearX = useTransform(sx, (v) => v * 46);
  const nearY = useTransform(sy, (v) => v * 28);

  // scroll: the picture pushes in and the words lift away
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const zoom = useTransform(scrollYProgress, [0, 1], [1.12, 1.26]);
  const lift = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const ready = () => {
    if (readyRef.current) return;
    readyRef.current = true;
    onReady();
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const v = filmRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!v || reduce) {
      setPhase('end');
      ready();
      return;
    }
    let raf = 0;
    let lit = false;
    const watch = () => {
      if (!lit && v.currentTime >= SNAP_AT[o]) {
        lit = true;
        setPhase('lit');
        ready();
      }
      if (!lit && !v.ended) raf = requestAnimationFrame(watch);
    };
    const start = window.setTimeout(() => {
      setPhase('play');
      v.currentTime = 0;
      const p = v.play();
      if (p)
        p.catch(() => {
          // no autoplay: show the words on the first frame
          setPhase('end');
          ready();
        });
      raf = requestAnimationFrame(watch);
    }, 250);
    const safety = window.setTimeout(() => {
      if (!lit) {
        setPhase('lit');
        ready();
      }
    }, 4500);
    return () => {
      clearTimeout(start);
      clearTimeout(safety);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o]);

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

  const lit = phase === 'lit' || phase === 'end';

  return (
    <section className={`hx is-${phase}`} ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} aria-labelledby="hx-h">
      <div className="hx-stage">
        <motion.div className="hx-media" style={{ x: mediaX, y: mediaY, rotateX: rotX, rotateY: rotY, scale: zoom }}>
          <video
            ref={filmRef}
            key={o}
            className="hx-film"
            muted
            playsInline
            preload="auto"
            poster={`/media/hero-full-${o}.first.jpg`}
            aria-label="Concept film: robot 07 picks up a chalk line, pulls it taut, drives its hand into the slab, and blue chalk dust rolls out across the floor."
          >
            <source src={`/media/hero-full-${o}.av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
            <source src={`/media/hero-full-${o}.h264.mp4`} type="video/mp4" />
          </video>
          {/* the words live in the scene: stencilled on the back wall, marking-painted on the slab */}
          <h1 id="hx-h" className={`hx-wall ${lit ? 'is-lit' : ''}`}>
            <span className="sr-only">We want to see a robot lay brick</span>
            <span aria-hidden="true">
              We want to see
              <br />a robot
            </span>
          </h1>
          <div className={`hx-floor ${lit ? 'is-lit' : ''}`} aria-hidden="true">
            <span className="hx-paint">Lay brick</span>
          </div>
        </motion.div>
      </div>

      <motion.div className="hx-sub-wrap" style={{ opacity: fade }}>
        <motion.p
          className="hx-sub"
          initial={{ opacity: 0, y: 12 }}
          animate={lit ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.9, ease: EXPO, delay: 0.7 }}
        >
          That&rsquo;s one of five tasks at the first Humanoid Robot Construction Games, which we&rsquo;re planning for New York City in&nbsp;2027.
        </motion.p>
      </motion.div>
    </section>
  );
}
