import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import './intro.css';

const EXPO = [0.16, 1, 0.3, 1] as const;
const KEY = 'hrcg-intro-seen';

type Stage = 'snap' | 'course' | 'exit' | 'done';

function shouldSkip(): boolean {
  try {
    if (new URLSearchParams(location.search).has('intro')) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

type LenisLike = { stop?: () => void; start?: () => void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

/**
 * The site lays its first course: a chalk line snaps across the slab, five bricks drop onto it,
 * and the course flies up to become the logo while the slab lifts away.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const [skip] = useState(shouldSkip);
  const [stage, setStage] = useState<Stage>('snap');
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  const doneRef = useRef(false);
  const exitRef = useRef(false);
  const courseRef = useRef<HTMLDivElement>(null);
  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const cs = useMotionValue(1);
  const sag = useMotionValue(30);
  const clip = useMotionValue(0);
  const clipPath = useTransform(clip, (v) => `inset(0 0 ${v}% 0)`);

  const narrow = vw < 700;
  const lineW = Math.round(vw * (narrow ? 0.86 : 0.6));
  const courseW = narrow ? 210 : 300;
  const d = useTransform(sag, (v) => `M 0 40 Q ${lineW / 2} ${40 + v} ${lineW} 40`);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* private mode */
    }
    onDone();
  };

  const exit = () => {
    if (exitRef.current) return;
    exitRef.current = true;
    setStage('exit');
    // fly the course onto the header logo
    try {
      const from = courseRef.current?.getBoundingClientRect();
      const to = document.querySelector('.top .brand .mark')?.getBoundingClientRect();
      if (from && to && from.width > 0) {
        const s = to.width / from.width;
        animate(cs, s, { duration: 0.8, ease: EXPO });
        animate(cx, to.left - from.left, { duration: 0.8, ease: EXPO });
        animate(cy, to.top - from.top, { duration: 0.8, ease: EXPO });
      }
    } catch {
      /* no logo: the slab still lifts */
    }
    window.setTimeout(() => {
      finish();
      animate(clip, 100, { duration: 0.9, ease: EXPO }).then(() => setStage('done'));
    }, 260);
  };

  useLayoutEffect(() => {
    if (skip) return;
    document.documentElement.classList.add('intro-on');
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.classList.remove('intro-on');
      document.documentElement.style.overflow = '';
    };
  }, [skip]);

  useEffect(() => {
    if (skip) {
      onDone();
      return;
    }
    lenis()?.stop?.();
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    const timers = [
      window.setTimeout(() => animate(sag, 0, { type: 'spring', stiffness: 600, damping: 9 }), 260),
      window.setTimeout(() => setStage('course'), 520),
      window.setTimeout(exit, 2050),
      window.setTimeout(finish, 3200), // never hold the page hostage
    ];
    const skipNow = () => exit();
    const opts = { passive: true } as const;
    window.addEventListener('pointerdown', skipNow, opts);
    window.addEventListener('keydown', skipNow);
    window.addEventListener('wheel', skipNow, opts);
    window.addEventListener('touchmove', skipNow, opts);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerdown', skipNow);
      window.removeEventListener('keydown', skipNow);
      window.removeEventListener('wheel', skipNow);
      window.removeEventListener('touchmove', skipNow);
      lenis()?.start?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage === 'done') {
      document.documentElement.classList.remove('intro-on');
      document.documentElement.style.overflow = '';
      lenis()?.start?.();
    }
  }, [stage]);

  if (skip || stage === 'done') return null;

  const specks = Array.from({ length: 16 }, (_, i) => i);
  return (
    <motion.div className="intro" aria-hidden="true" style={{ clipPath }}>
      <div className="intro-stage" style={{ width: lineW }}>
        {/* the course sits on the line */}
        <motion.div className="intro-course" ref={courseRef} style={{ width: courseW, x: cx, y: cy, scale: cs }}>
          <svg viewBox="0 0 54 8" width={courseW} height={(courseW * 8) / 54}>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.rect
                key={i}
                x={i * 11}
                y={0}
                width={10}
                height={8}
                initial={{ y: -14, opacity: 0, scaleY: 1 }}
                animate={stage === 'snap' ? undefined : { y: 0, opacity: 1, scaleY: [1, 0.9, 1] }}
                transition={{
                  y: { type: 'spring', stiffness: 520, damping: 30, delay: i * 0.11 },
                  opacity: { duration: 0.12, delay: i * 0.11 },
                  scaleY: { duration: 0.28, delay: i * 0.11 + 0.16, times: [0, 0.4, 1] },
                }}
                style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              />
            ))}
          </svg>
        </motion.div>

        <motion.svg
          className="intro-line"
          width={lineW}
          height={80}
          viewBox={`0 0 ${lineW} 80`}
          animate={{ opacity: stage === 'exit' ? 0 : 1 }}
          transition={{ duration: 0.35 }}
        >
          <defs>
            <filter id="chalk" x="-5%" y="-50%" width="110%" height="200%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="2.2" />
            </filter>
          </defs>
          <motion.path
            d={d}
            filter="url(#chalk)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut', delay: 0.05 }}
          />
        </motion.svg>

        <div className="intro-dust">
          {specks.map((i) => {
            const x = ((i * 37) % 100) / 100;
            return (
              <motion.span
                key={i}
                style={{ left: `${x * 100}%` }}
                initial={{ opacity: 0, y: 0, scale: 1 }}
                animate={stage === 'snap' ? undefined : { opacity: [0, 0.85, 0], y: -18 - ((i * 13) % 34), x: ((i % 5) - 2) * 4, scale: 0.6 + ((i * 7) % 5) / 6 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: (i % 4) * 0.025 }}
              />
            );
          })}
        </div>

        <motion.div
          className="intro-words"
          initial={{ opacity: 0, y: 8 }}
          animate={stage === 'course' ? { opacity: 1, y: 0 } : stage === 'exit' ? { opacity: 0, y: 0 } : undefined}
          transition={{ duration: 0.5, ease: EXPO, delay: stage === 'course' ? 0.55 : 0 }}
        >
          <p>Humanoid Robot Construction Games</p>
          <p className="dim">New York City, 2027</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
