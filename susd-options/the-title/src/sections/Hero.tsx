import { useCallback, useEffect, useMemo, useRef } from 'react';
import { COPY } from '../copy';
import { Title } from '../components/Title';
import type { TitleConfig, TitleEngine } from '../components/titleEngine';
import { Timeline } from '../motion/timeline';
import { easeOutCubic, lerp } from '../motion/ease';
import { INK } from '../motion/color';
import { observeRatio } from '../hooks/useInView';
import { pointerListeners } from '../hooks/light';
import { goToPath } from '../scroll';

interface Props {
  narrow: boolean;
  /** tablets and portrait screens: the title stacks like the cover */
  stack: boolean;
  reduced: boolean;
  skipIntro: boolean;
}

/** The diagnosis sentence, with the second sentence in Down red. Split into words for the rise. */
function Diagnosis() {
  const full = COPY.hero.diagnosis;
  const red = COPY.hero.diagnosisRed;
  const i = full.indexOf(red);
  const first = (i >= 0 ? full.slice(0, i) : full).trim().split(' ');
  const second = i >= 0 ? red.split(' ') : [];
  return (
    <p className="diagnosis">
      {first.map((w, n) => (
        <span key={`a${n}`}>
          <span className="dw">{w}</span>{' '}
        </span>
      ))}
      <span className="diagnosis-red">
        {second.map((w, n) => (
          <span key={`b${n}`}>
            <span className="dw">{w}</span>
            {n < second.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </p>
  );
}

export function Hero({ narrow, stack, reduced, skipIntro }: Props) {
  const ref = useRef<HTMLElement>(null);
  const engineRef = useRef<TitleEngine | null>(null);
  const tl = useRef(new Timeline());
  const phase = useRef<'pre' | 'intro' | 'rest'>('pre');

  const mode = narrow ? 'phone' : stack ? 'tablet' : 'line';
  const config: TitleConfig = useMemo(
    () =>
      narrow
        ? {
            layout: 'stack',
            restWdth: 105,
            size: () => Math.min(window.innerWidth * 0.25, window.innerHeight * (window.innerHeight < 720 ? 0.098 : 0.108)),
            maxWidth: () => Math.min(window.innerWidth - 32, 520),
            jobs: true,
            ulRest: 2,
            ulActive: 4,
          }
        : stack
        ? {
            layout: 'stack',
            restWdth: 105,
            size: () => Math.min(window.innerWidth * 0.2, window.innerHeight * 0.135),
            maxWidth: () => Math.min(window.innerWidth * 0.86, 900),
            jobs: true,
            ulRest: 3,
            ulActive: 5,
          }
        : {
            layout: 'line',
            restWdth: 112,
            size: () => window.innerWidth * 0.86,
            maxWidth: () => Math.min(window.innerWidth * 0.86, (window.innerHeight - 64) * 1.62, 1600),
            jobs: true,
            ulRest: 3,
            ulActive: 5,
          },
    [narrow, stack],
  );

  /** show everything that the intro reveals, optionally with a short crossfade */
  const showAll = useCallback((fade: number) => {
    const root = ref.current;
    if (!root) return;
    root.classList.add('is-in');
    root.classList.remove('is-trap');
    const sc = root.querySelector<HTMLElement>('.hero-scaling');
    if (sc) sc.style.rotate = '';
    const revealed = ['[data-rise]', '.dw', '.hero-scaling', '.hero-cyc'].join(',');
    const els = [...root.querySelectorAll<HTMLElement>(revealed), ...document.querySelectorAll<HTMLElement>('.rail')];
    document.documentElement.classList.remove('intro');
    els.forEach((el) => {
      el.getAnimations().forEach((a) => a.cancel());
      if (fade > 0) el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 1 }], { duration: fade, easing: 'linear' });
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }, []);

  const finishIntro = useCallback(
    (fade: number) => {
      tl.current.cancel();
      const e = engineRef.current;
      if (e) {
        e.cancelAll();
        e.setLevel();
        e.activate(-1);
        if (fade > 0) {
          const inkEl = e.els.ink;
          inkEl.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: fade });
        }
      }
      showAll(fade);
      phase.current = 'rest';
    },
    [showAll],
  );

  const runIntro = useCallback(
    (e: TitleEngine) => {
      const root = ref.current;
      if (!root) return;
      phase.current = 'intro';
      const t = tl.current;
      t.cancel();
      e.companion = root.querySelector('.hero-scaling');
      e.fit();
      root.classList.add('is-trap');
      e.setTrap(2.5);
      e.master = { op: 0, sc: 0.985 };
      e.hideJobs();
      e.flush();
      const rise = (el: Element, delay: number, dur: number, y: number, easing: string) =>
        (el as HTMLElement).animate(
          [
            { opacity: 0, transform: `translateY(${y}px)` },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: dur, delay, easing, fill: 'both' },
        );
      // 0–300 rail
      const rail = document.querySelector('.rail');
      if (rail) rise(rail, 0, 300, 0, 'cubic-bezier(.33,1,.68,1)');
      // 80–560 diagnosis words
      root.querySelectorAll('.dw').forEach((w, i) => rise(w, 80 + i * 35, 380, 12, 'cubic-bezier(.22,1,.36,1)'));
      // 250–500 SCALING + trap line
      const scaling = root.querySelector('.hero-scaling');
      if (scaling) rise(scaling, 250, 250, 0, 'cubic-bezier(.33,1,.68,1)');
      t.tween(
        250,
        (v) => {
          e.master = { op: v, sc: lerp(0.985, 1, v) };
          e.touch();
        },
        { delay: 250, ease: easeOutCubic },
      );
      // hyphen drops: from above the viewport into the gaps
      const fall = (n: 0 | 1) => {
        const top = e.els.root.getBoundingClientRect().top;
        const slot = n === 1 && e.cfg.layout === 'stack' ? e.pitch() : 0;
        return Math.max(240, top + slot + e.cap() + 60);
      };
      t.at(700, () =>
        e.dropHyphen(0, fall(0), () => {
          e.o1.to(1, 520, 34);
          e.lean.to(1.2, 300, 26);
          e.touch();
        }),
      );
      t.at(880, () =>
        e.dropHyphen(1, fall(1), () => {
          e.o2.to(1, 520, 34);
          e.lean.to(0, 300, 26);
          e.touch();
        }),
      );
      // 1150–1450 the inks split, and the line that names what just happened rises in
      const cyc = root.querySelector('.hero-cyc');
      if (cyc) rise(cyc, 1150, 420, 10, 'cubic-bezier(.22,1,.36,1)');
      t.at(1150, () => {
        root.classList.remove('is-trap');
        e.inkTo('up', INK.up, 300);
        e.inkTo('side', INK.side, 300);
      });
      // the three beats
      t.at(1300, () => {
        e.strike('up');
        e.jobIn(0);
      });
      t.at(1750, () => {
        e.strike('side');
        e.jobIn(1);
      });
      t.at(2200, () => {
        e.strike('down');
        e.jobIn(2);
      });
      // 2500–2800 who-for, actions, cue
      t.at(2500, () => {
        root.querySelectorAll('[data-rise]').forEach((el, i) => rise(el, i * 60, 300, 8, 'cubic-bezier(.33,1,.68,1)'));
      });
      t.at(2900, () => {
        e.activate(-1);
        phase.current = 'rest';
        root.classList.add('is-in');
        document.documentElement.classList.remove('intro');
      });
    },
    [],
  );

  const onEngine = useCallback(
    (e: TitleEngine) => {
      engineRef.current = e;
      if (skipIntro || phase.current === 'rest') {
        finishIntro(0);
        e.activate(-1);
        return;
      }
      runIntro(e);
    },
    [finishIntro, runIntro, skipIntro],
  );

  // skip the intro on any input
  useEffect(() => {
    if (skipIntro) {
      showAll(0);
      phase.current = 'rest';
      return;
    }
    const jump = () => {
      if (phase.current === 'intro') finishIntro(200);
      else if (phase.current === 'pre') phase.current = 'rest';
    };
    const evs = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;
    evs.forEach((ev) => window.addEventListener(ev, jump, { passive: true }));
    return () => evs.forEach((ev) => window.removeEventListener(ev, jump));
  }, [finishIntro, showAll, skipIntro]);

  // idle life: a soft bar every 12 s while the hero is >= 50% visible; 4 bars, then wait for the pointer
  useEffect(() => {
    if (reduced || !ref.current) return;
    let visible = false;
    let bars = 0;
    let timer = 0;
    const bar = () => {
      const e = engineRef.current;
      if (!e || phase.current !== 'rest' || !visible || document.hidden || bars >= 4) return;
      bars++;
      const t = new Timeline();
      t.at(0, () => e.strike('up', { scale: 0.16 * 0.4 }));
      t.at(450, () => e.strike('side', { amp: 0.4 }));
      t.at(900, () => e.strike('down', { amp: 0.4 }));
      t.at(1500, () => e.activate(-1));
    };
    const loop = () => {
      bar();
      timer = window.setTimeout(loop, 12000);
    };
    timer = window.setTimeout(loop, 6000);
    const un = observeRatio(ref.current, (r) => (visible = r >= 0.5));
    const wakeUp = () => {
      if (bars >= 4) bars = 0;
    };
    pointerListeners.add(wakeUp);
    return () => {
      window.clearTimeout(timer);
      un();
      pointerListeners.delete(wakeUp);
    };
  }, [reduced]);

  useEffect(() => () => tl.current.cancel(), []);

  // the scroll cue belongs to the first screen only: it fades as soon as the page moves
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const on = () => root.classList.toggle('is-scrolled', window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const toFile = (ev: React.MouseEvent) => {
    ev.preventDefault();
    goToPath('file');
  };
  const toBook = (ev: React.MouseEvent) => {
    ev.preventDefault();
    goToPath('book');
  };
  const who = COPY.hero.who.split(' · ');

  return (
    <section id="top" className={`hero ${skipIntro ? 'is-in' : ''}`} ref={ref} aria-labelledby="hero-title">
      <div className="hero-inner">
        <Diagnosis />
        <p className="hero-cyc">{COPY.hero.cyclical}</p>
        <h1 id="hero-title" className="hero-h1">
          <span className="sr-only">{COPY.paths.bookTitle}</span>
          <span className="hero-scaling caps" aria-hidden="true">
            {COPY.hero.scaling}
          </span>
          <Title key={mode} config={config} onEngine={onEngine} className="hero-title" />
        </h1>
        <p className="sr-only">{COPY.hero.jobs.join(' ')}</p>
        <p className="who" data-rise>
          {narrow ? (
            <>
              <span className="who-line">{who[0]}</span>{' '}
              <span className="who-line">{who.slice(1).join(' · ')}</span>
            </>
          ) : (
            COPY.hero.who
          )}
        </p>
        <div className="hero-actions">
          <a className="pill pill--ink pill--lg" href="#paths" onClick={toFile} data-rise>
            <span className="pill-label">{COPY.hero.getBtn}</span>
            <span className="pill-meta tnum">{COPY.hero.getMeta}</span>
          </a>
          {/* the second path, quieter: one unambiguous action (the file), and the book's status said plainly */}
          <a className="hero-book" href="#paths" onClick={toBook} data-rise>
            {COPY.hero.bookBtn}
          </a>
        </div>
      </div>
      <span className="cue" aria-hidden="true" data-rise>
        <svg width="14" height="9" viewBox="0 0 14 9">
          <path d="M1 1.5l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </section>
  );
}
