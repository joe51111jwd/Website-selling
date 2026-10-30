import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COPY } from '../copy';
import { Title } from '../components/Title';
import type { TitleConfig, TitleEngine, WordKey } from '../components/titleEngine';
import { Timeline } from '../motion/timeline';
import { INK, mixInk } from '../motion/color';
import { easeInCubic } from '../motion/ease';
import { goTo, scrollToInstant } from '../scroll';
import { fontsReady } from '../hooks/fonts';
import { DashLine, setDashText } from '../components/Lines';

interface Props {
  narrow: boolean;
  reduced: boolean;
  debugCollapsed: boolean;
}

type State = 'beat' | 'pushing' | 'collapsed' | 'recovering';
/** four forced UP strikes, each sooner than the last (700, 600, 500 ms apart) */
const STRIKES = [0, 700, 1300, 1800];
/** the 4th caption ("But inside, nothing ever settled.") is read before the line gives way */
const SETTLE_HOLD = 900;
const COLLAPSE_AT = STRIKES[3] + SETTLE_HOLD;
const PUSH_TOTAL = COLLAPSE_AT; // the ring fills exactly at the collapse
const DEMO_HOLD = 1800; // the auto-demo holds the collapsed state this long
const INK_STEPS = [0.4, 0.7, 1, 1]; // SIDE and DOWN: 100% -> 60% -> 30% -> 0% ink (blind relief)
/** the job lines under SIDE and DOWN (desktop) fade one step behind their words, so each is read before it goes */
const JOB_INK = [1, 0.55, 0.28, 0.14];
/** a press shorter than this is a click or a tap: it plays the whole sequence for the visitor */
const TAP_MS = 250;
/** desktop: the control fades once its top is this close to the viewport top (the 48 px bar, plus its shadow) */
const UNDER_BAR = 72;
const HY_STEPS = [0.27, 0.19, 0.12, 0.12]; // the hyphen blocks shrink (both axes, and fade: titleEngine)
const ORDER: WordKey[] = ['up', 'side', 'down'];
const LEAN = 3; // clockwise about the left foot: the right end drops (falling, never jaunty)
/** the caption key for M L1993, which builds up one sentence per forced strike */
const WEEK = '\u0000week';

type Tone = 'rest' | 'story' | 'collapsed' | 'job';
const toneOf = (key: string): Tone =>
  key === COPY.skip.rest ? 'rest' : key === COPY.skip.collapsed ? 'collapsed' : COPY.hero.jobs.includes(key) ? 'job' : 'story';

/**
 * The caption under the title. A new line swaps in (old text up and out in 160 ms, new text in over 220 ms),
 * except M L1993, which is built up in place: "Always launching." then "Always hiring." then "Always adding."
 * join the same line one per strike, and the earlier sentences stay put, so all three are read.
 * The latest request always lands, however fast they come.
 */
function makeCaption(el: HTMLElement, reduced: boolean) {
  const box = el.parentElement as HTMLElement;
  let shown = el.textContent ?? '';
  let want = { key: shown, level: 1 };
  let phase: 'idle' | 'out' = 'idle';
  let anim: Animation | null = null;
  let spans: HTMLElement[] = [];
  let revealed = 0;

  // Each new sentence joins the line; the line stays centred, so the sentences already there slide over
  // smoothly (FLIP) instead of jumping, and the new one rises in.
  const reveal = (instant: boolean) => {
    while (revealed < want.level && revealed < spans.length) {
      const prev = spans.slice(0, revealed);
      const first = instant ? [] : prev.map((p) => p.getBoundingClientRect());
      const sp = spans[revealed++];
      sp.style.display = '';
      if (instant) continue;
      let gx = 0;
      let gy = 0;
      prev.forEach((p, i) => {
        const last = p.getBoundingClientRect();
        const dx = first[i].left - last.left;
        const dy = first[i].top - last.top;
        if (i === prev.length - 1) {
          gx = dx;
          gy = dy;
        }
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)
          p.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
      });
      // The new sentence travels with the group: it starts where the line's old end was heading from, so
      // it never lands on top of the sentence before it while that one slides over.
      const sameLine = Math.abs(gy) < 1;
      sp.animate(
        [
          { opacity: 0, transform: `translate(${sameLine ? gx : 0}px, 0.4em)`, offset: 0 },
          { opacity: 0, offset: 0.3 },
          { opacity: 1, transform: 'translate(0, 0)', offset: 1 },
        ],
        { duration: 380, delay: sameLine ? 0 : 120, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
      );
    }
  };
  const build = (instant: boolean) => {
    anim?.cancel(); // drop the exit's held fill
    anim = null;
    shown = want.key;
    box.dataset.tone = toneOf(want.key);
    if (want.key === WEEK) {
      // one line, M L1993 in order; sentences not yet struck are not laid out
      el.textContent = '';
      spans = COPY.skip.week.map((t) => {
        const sp = document.createElement('span');
        sp.className = 'cap-s';
        sp.textContent = t;
        sp.style.display = 'none';
        return sp;
      });
      spans.forEach((sp, i) => (i ? el.append(' ', sp) : el.append(sp)));
      revealed = 0;
      reveal(instant);
      return;
    }
    spans = [];
    setDashText(el, want.key);
    if (!instant)
      anim = el.animate(
        [
          { transform: 'translateY(0.45em)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' },
      );
  };
  const goOut = () => {
    anim?.cancel();
    phase = 'out';
    anim = el.animate(
      [
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(-0.45em)', opacity: 0 },
      ],
      { duration: 160, easing: 'cubic-bezier(.32,0,.67,0)', fill: 'forwards' },
    );
    anim.onfinish = () => {
      phase = 'idle';
      build(false);
    };
  };
  return (key: string, opts: { level?: number; instant?: boolean } = {}) => {
    want = { key, level: opts.level ?? 1 };
    if (reduced || opts.instant) {
      phase = 'idle';
      build(true);
      return;
    }
    if (phase === 'out') return; // the running exit builds whatever is wanted when it ends
    if (shown === key) {
      if (key === WEEK) reveal(false);
      return;
    }
    goOut();
  };
}

export function SkipALeg({ narrow, reduced, debugCollapsed }: Props) {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const captionEl = useRef<HTMLSpanElement>(null); // the caption's text (one element, so flex centring never splits it)
  const captionBox = useRef<HTMLParagraphElement>(null);
  const liveEl = useRef<HTMLParagraphElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const control = useRef<HTMLDivElement>(null);
  const engineRef = useRef<TitleEngine | null>(null);
  const [held, setHeld] = useState(false); // a real hold by the visitor
  const [demo, setDemo] = useState(false); // the auto-demo is pressing for them
  const [toggled, setToggled] = useState(debugCollapsed);

  // the machine lives in refs: it runs at frame rate and must not re-render React
  const m = useRef({
    state: 'beat' as State,
    pressed: false,
    tl: new Timeline(),
    beatTimer: 0,
    beatIdx: 0,
    near: false,
    inView: false,
    seenAt: 0,
    demoDone: false,
    demoRuns: 0,
    demoRunning: false,
    ringStart: 0,
    ringRaf: 0,
    lastAnnounce: 0,
    pressAt: 0,
    pushAt: 0,
    scripted: false,
    caption: (_k: string, _o?: { level?: number; instant?: boolean }) => {},
  });

  // No job lines at rest: the hero has just taught them, so the title reads as a new state of the object.
  // On a wide screen they appear while UP is pushed and fade with SIDE and DOWN, so the visitor sees which
  // jobs are being skipped. Phones keep the stacked title compact (the caption carries the story there).
  const config: TitleConfig = useMemo(
    () =>
      narrow
        ? {
            layout: 'stack',
            restWdth: 105,
            size: () => Math.min(window.innerWidth * 0.2, window.innerHeight * 0.09),
            maxWidth: () => Math.min(window.innerWidth - 32, 480),
            jobs: false,
            centerTrap: true,
            ulRest: 2,
            ulActive: 4,
          }
        : {
            layout: 'line',
            restWdth: 112,
            size: () => window.innerWidth * (window.innerWidth <= 1040 ? 0.84 : 0.7),
            maxWidth: () => Math.min(window.innerWidth * (window.innerWidth <= 1040 ? 0.84 : 0.7), (window.innerHeight - 120) * 1.5, 1300),
            // hidden at rest (the hero has just taught them); while UP is pushed they show which jobs are skipped
            jobs: true,
            ulRest: 3,
            ulActive: 5,
          },
    [narrow],
  );

  const announce = useCallback((text: string) => {
    const s = m.current;
    const el = liveEl.current;
    if (!el) return;
    const wait = Math.max(0, 600 - (performance.now() - s.lastAnnounce));
    window.setTimeout(() => {
      el.textContent = text;
      s.lastAnnounce = performance.now();
    }, wait);
  }, []);

  /** the job lines go back to hidden at full ink (rest state) */
  const resetJobs = (e: TitleEngine) => {
    if (!e.cfg.jobs) return;
    e.hideJobs();
    e.jobsOp = 1;
    e.jobInk = [1, 1, 1];
    e.touch();
  };

  /** collapsed look: the class lives on the caption only (a small subtree to restyle) */
  const markCollapsed = (on: boolean) => captionBox.current?.classList.toggle('is-collapsed', on);

  // ---------- the live beat ----------
  const stopBeat = useCallback(() => {
    window.clearTimeout(m.current.beatTimer);
    m.current.beatTimer = 0;
  }, []);
  const startBeat = useCallback(() => {
    const s = m.current;
    stopBeat();
    if (reduced || debugCollapsed) return;
    const tick = () => {
      const e = engineRef.current;
      if (e && s.state === 'beat' && s.inView && !document.hidden) {
        const k = ORDER[s.beatIdx % 3];
        e.strike(k, k === 'up' ? { scale: 0.13 } : { amp: 0.75 });
        s.beatIdx++;
      }
      s.beatTimer = window.setTimeout(tick, 1400);
    };
    s.beatTimer = window.setTimeout(tick, 500);
  }, [reduced, debugCollapsed, stopBeat]);

  // ---------- progress ring ----------
  const ringTo = useCallback((on: boolean) => {
    const s = m.current;
    const c = ring.current;
    cancelAnimationFrame(s.ringRaf);
    if (!c) return;
    if (!on) {
      c.style.strokeDashoffset = '100';
      return;
    }
    s.ringStart = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - s.ringStart) / PUSH_TOTAL);
      c.style.strokeDashoffset = String(100 - p * 100);
      if (p < 1 && (s.state === 'pushing' || s.state === 'collapsed')) s.ringRaf = requestAnimationFrame(step);
    };
    s.ringRaf = requestAnimationFrame(step);
  }, []);

  // ---------- transitions ----------
  const toBeat = useCallback(() => {
    const s = m.current;
    s.state = 'beat';
    startBeat();
  }, [startBeat]);

  const recover = useCallback(() => {
    const s = m.current;
    const e = engineRef.current;
    if (!e) return;
    s.state = 'recovering';
    s.tl.cancel();
    ringTo(false);
    markCollapsed(false);
    const t = s.tl;
    // +0 SIDE beat: SIDE re-inks and strikes wide, hyphen 1 regrows, the lean eases
    e.inkTo('side', INK.side, 260);
    e.strike('side');
    e.hyW[0].to(0.36, 300, 26);
    e.hyVisTo(0, 1, 260, easeInCubic);
    e.o1.to(1, 300, 26);
    e.lean.to(LEAN / 2, 260, 24);
    e.touch();
    s.caption(COPY.hero.jobs[1]);
    t.at(700, () => {
      // DOWN beat: DOWN strikes, hyphen 2 regrows, the line levels
      e.inkTo('down', INK.down, 200);
      e.strike('down');
      e.hyW[1].to(0.36, 300, 26);
      e.hyVisTo(1, 1, 260, easeInCubic);
      e.o2.to(1, 300, 26);
      e.lean.to(0, 300, 26);
      e.touch();
      s.caption(COPY.hero.jobs[2]);
    });
    t.at(1400, () => {
      e.inkTo('up', INK.up, 300);
      e.activate(-1);
      resetJobs(e);
      e.touch();
      s.caption(COPY.skip.rest);
      announce(COPY.skip.rest);
      toBeat();
    });
  }, [announce, ringTo, toBeat]);

  const collapse = useCallback(() => {
    const s = m.current;
    const e = engineRef.current;
    if (!e) return;
    s.state = 'collapsed';
    // the hyphen blocks snap shut
    e.hyVisTo(0, 0, 120, easeInCubic);
    e.hyVisTo(1, 0, 120, easeInCubic);
    // the words slide together on a heavy spring
    e.o1.to(0, 600, 40);
    e.o2.to(0, 600, 40);
    // the inks flood to Down red, left to right
    e.inkTo('up', INK.down, 220, 0);
    e.inkTo('side', INK.down, 220, 60);
    e.inkTo('down', INK.down, 220, 120);
    e.lean.to(LEAN, 260, 20);
    e.activate(-1);
    if (e.cfg.jobs) e.jobsOpTo(0, 140);
    e.touch();
    s.caption(COPY.skip.collapsed);
    announce(COPY.skip.collapsed);
    markCollapsed(true);
    // 1 px shake on impact
    stage.current?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(1px)' },
        { transform: 'translateX(-1px)' },
        { transform: 'translateX(1px)' },
        { transform: 'translateX(-1px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 120, delay: 90 },
    );
    if (!s.pressed) s.tl.at(400, () => recover());
  }, [announce, recover]);

  const push = useCallback(() => {
    const s = m.current;
    const e = engineRef.current;
    if (!e) return;
    s.state = 'pushing';
    s.pushAt = performance.now();
    stopBeat();
    s.tl.cancel();
    ringTo(true);
    const t = s.tl;
    if (e.cfg.jobs) {
      e.jobsOp = 1;
      e.jobInk = [1, 1, 1];
      [0, 1, 2].forEach((n) => e.jobIn(n, n * 60));
    }
    STRIKES.forEach((at, i) => {
      t.at(at, () => {
        e.strike('up', { scale: 0.16 + 0.03 * i, a: 70, h: 0, r: 300 });
        e.activate(0);
        const ink = INK_STEPS[i];
        e.inkTo('side', mixInk(INK.side, INK.blind, ink), 180);
        e.inkTo('down', mixInk(INK.down, INK.blind, ink), 180);
        if (e.cfg.jobs && i > 0) {
          e.jobInkTo(1, JOB_INK[i], 260);
          e.jobInkTo(2, JOB_INK[i], 260);
        }
        e.hyW[0].to(HY_STEPS[i], 420, 30);
        e.hyW[1].to(HY_STEPS[i], 420, 30);
        e.touch();
        if (i < 3) s.caption(WEEK, { level: i + 1 });
        else s.caption(COPY.skip.settled);
      });
    });
    t.at(COLLAPSE_AT, () => collapse());
  }, [collapse, ringTo, stopBeat]);

  const abort = useCallback(() => {
    const s = m.current;
    const e = engineRef.current;
    if (!e) return;
    s.tl.cancel();
    ringTo(false);
    e.inkTo('side', INK.side, 400);
    e.inkTo('down', INK.down, 400);
    e.hyW[0].to(0.36, 300, 26);
    e.hyW[1].to(0.36, 300, 26);
    e.activate(-1);
    if (e.cfg.jobs) e.jobsOpTo(0, 280);
    e.touch();
    s.caption(COPY.skip.rest);
    s.state = 'recovering';
    s.tl.at(400, () => {
      resetJobs(e);
      toBeat();
    });
  }, [ringTo, toBeat]);

  // ---------- input ----------
  const press = useCallback(() => {
    const s = m.current;
    s.demoDone = true; // any interaction cancels the auto-demo
    s.scripted = true;
    if (s.demoRunning) {
      s.demoRunning = false; // the visitor takes over the hold
      s.pressAt = performance.now();
      setDemo(false);
      setHeld(true);
      return;
    }
    if (s.pressed) return;
    s.pressed = true;
    s.pressAt = performance.now();
    setHeld(true);
    if (s.state === 'beat') push();
  }, [push]);

  /** let the sequence finish by itself: hold the collapse for DEMO_HOLD, then recover (auto-demo, Enter, a tap) */
  const finishScripted = useCallback(() => {
    const s = m.current;
    s.demoRunning = true;
    s.pressed = true;
    setDemo(true);
    const left = Math.max(0, COLLAPSE_AT + DEMO_HOLD - (performance.now() - s.pushAt));
    s.tl.at(left, () => {
      if (!s.demoRunning) return;
      s.demoRunning = false;
      s.demoDone = true;
      s.pressed = false;
      setDemo(false);
      recover();
    });
  }, [recover]);

  const release = useCallback(() => {
    const s = m.current;
    if (!s.pressed || s.demoRunning) return;
    s.pressed = false;
    setHeld(false);
    // a click or a quick tap is not a hold: play the whole sequence instead of snapping straight back
    if (s.state === 'pushing' && performance.now() - s.pressAt < TAP_MS) {
      s.scripted = true;
      finishScripted();
      return;
    }
    if (s.state === 'pushing') abort();
    else if (s.state === 'collapsed') recover();
  }, [abort, recover, finishScripted]);

  /** Enter (the usual key for a button) plays the sequence through */
  const runScripted = useCallback(() => {
    const s = m.current;
    if (s.state !== 'beat' || s.pressed || s.demoRunning) return;
    s.demoDone = true;
    s.scripted = true;
    push();
    finishScripted();
  }, [push, finishScripted]);

  const runDemo = useCallback(() => {
    const s = m.current;
    if (s.demoDone || s.demoRunning || s.state !== 'beat') return;
    s.demoRuns++;
    push();
    finishScripted();
  }, [push, finishScripted]);

  /** the visitor scrolled away mid-demo: stop it and put the title back, so it can play again when they return */
  const cancelDemo = useCallback(() => {
    const s = m.current;
    const e = engineRef.current;
    if (!s.demoRunning || !e) return;
    s.demoRunning = false;
    s.pressed = false;
    s.demoDone = s.scripted || s.demoRuns >= 2;
    s.tl.cancel();
    ringTo(false);
    setDemo(false);
    e.cancelAll();
    e.setLevel();
    resetJobs(e);
    e.activate(-1);
    s.caption(COPY.skip.rest, { instant: true });
    markCollapsed(false);
    toBeat();
  }, [ringTo, toBeat]);

  // ---------- engine ready ----------
  const onEngine = useCallback(
    (e: TitleEngine) => {
      engineRef.current = e;
      e.activate(-1);
      resetJobs(e);
      if (debugCollapsed) {
        e.setCollapsed(LEAN);
        e.touch();
        markCollapsed(true);
        m.current.state = 'collapsed';
      }
    },
    [debugCollapsed],
  );

  useEffect(() => {
    const s = m.current;
    if (captionEl.current) s.caption = makeCaption(captionEl.current, reduced);
  }, [reduced]);

  // In view: the live beat runs at 50% coverage or more. The auto-demo starts as soon as the section has
  // arrived (60% of the screen with the headline on it, for 250 ms; no waiting for the scroll to go idle),
  // so a visitor who scrolls in sees the story play; it stops and resets if they leave (under 40%).
  // It plays once (twice if the first run was interrupted).
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || debugCollapsed) return;
    const s = m.current;
    const poll = window.setInterval(() => {
      if (!s.near) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const vis = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      const c = vis / Math.max(1, Math.min(vh, r.height));
      const now = performance.now();
      s.inView = c >= 0.5;
      if (s.demoRunning && c < 0.4) cancelDemo();
      const arrived = c >= 0.6 && r.top > -0.12 * vh;
      if (arrived) {
        if (!s.seenAt) s.seenAt = now;
        if (!s.demoDone && !s.demoRunning && s.state === 'beat' && now - s.seenAt >= 250) runDemo();
      } else s.seenAt = 0;
    }, 100);
    const io = new IntersectionObserver(([en]) => {
      s.near = en.isIntersecting;
      if (!s.near) {
        s.inView = false;
        s.seenAt = 0;
        cancelDemo();
      }
    });
    io.observe(el);
    startBeat();
    return () => {
      window.clearInterval(poll);
      io.disconnect();
      stopBeat();
    };
  }, [reduced, debugCollapsed, runDemo, cancelDemo, startBeat, stopBeat]);

  // Desktop: the control fades out as it reaches the sticky bar, so its drop shadow never hangs below the
  // bar as a smudge with no button.
  useEffect(() => {
    const el = control.current;
    if (!el || narrow) return;
    const io = new IntersectionObserver(
      ([en]) => el.classList.toggle('is-under', en.intersectionRatio < 1 && en.boundingClientRect.top < UNDER_BAR),
      { rootMargin: `-${UNDER_BAR}px 0px 0px 0px`, threshold: [0, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [narrow]);

  // ?debug exposes the state machine for automated checks (harmless in production)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('debug')) (window as unknown as Record<string, unknown>).__skip = { m: m.current, engine: () => engineRef.current };
  }, []);

  // debug: ?state=collapsed scrolls here
  useEffect(() => {
    if (!debugCollapsed || !ref.current) return;
    const el = ref.current;
    let id = 0;
    fontsReady().then(() => {
      id = window.setTimeout(() => scrollToInstant(el), 80);
    });
    return () => window.clearTimeout(id);
  }, [debugCollapsed]);

  useEffect(() => {
    const s = m.current;
    return () => {
      s.tl.cancel();
      cancelAnimationFrame(s.ringRaf);
    };
  }, []);

  // ---------- reduced motion: a toggle ----------
  const toggle = () => {
    const e = engineRef.current;
    const next = !toggled;
    setToggled(next);
    if (!e) return;
    const swap = () => {
      if (next) e.setCollapsed(LEAN);
      else e.setLevel();
      resetJobs(e);
      e.activate(-1);
      e.touch();
      markCollapsed(next);
    };
    stage.current?.animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], { duration: 150 });
    window.setTimeout(swap, 75);
    const text = next ? COPY.skip.collapsed : COPY.skip.rest;
    m.current.caption(text, { instant: true });
    announce(text);
  };

  // Keyboard focus brings the whole section (headline included) into view, not just the control, but only
  // when it is not already on screen, and instantly: an animated scroll here would fight the browser's own
  // scroll to whatever gets focus next, and could leave that element off screen.
  const focusRaf = useRef(0);
  const onFocus = (ev: React.FocusEvent<HTMLButtonElement>) => {
    const btn = ev.currentTarget;
    let kb = false;
    try {
      kb = btn.matches(':focus-visible');
    } catch {
      kb = false;
    }
    if (!kb) return;
    cancelAnimationFrame(focusRaf.current);
    focusRaf.current = requestAnimationFrame(() => {
      focusRaf.current = requestAnimationFrame(() => {
        focusRaf.current = 0;
        const sec = ref.current;
        const head = sec?.querySelector('.skip-headline');
        if (!sec || !head || document.activeElement !== btn) return;
        const h = head.getBoundingClientRect();
        const b = btn.getBoundingClientRect();
        if (h.top >= (narrow ? 8 : 56) && b.bottom <= window.innerHeight - 8) return;
        goTo(sec, { instant: true });
      });
    });
  };
  const onBlur = () => {
    cancelAnimationFrame(focusRaf.current);
    focusRaf.current = 0;
    release();
  };

  // Touch: the control and the big UP word scroll the page like any other surface (touch-action: pan-y).
  // A finger that stays still for 140 ms holds; one that moves first is a scroll, and the browser takes it
  // (pointercancel releases). A quick tap plays the whole sequence. Mouse presses hold at once.
  const touchRef = useRef<{ id: number; x: number; y: number; timer: number; started: boolean } | null>(null);
  const clearTouch = () => {
    const t = touchRef.current;
    if (t) window.clearTimeout(t.timer);
    touchRef.current = null;
  };
  const pointerHandlers = reduced
    ? {}
    : {
        onPointerDown: (ev: React.PointerEvent<HTMLElement>) => {
          if (ev.button !== 0) return;
          if (ev.pointerType === 'touch') {
            clearTouch();
            const t = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, timer: 0, started: false };
            t.timer = window.setTimeout(() => {
              t.timer = 0;
              t.started = true;
              press();
            }, 140);
            touchRef.current = t;
            return;
          }
          ev.preventDefault();
          try {
            ev.currentTarget.setPointerCapture(ev.pointerId);
          } catch {
            /* ignore */
          }
          press();
        },
        onPointerMove: (ev: React.PointerEvent<HTMLElement>) => {
          const t = touchRef.current;
          if (!t || t.id !== ev.pointerId || t.started) return;
          if (Math.abs(ev.clientX - t.x) > 10 || Math.abs(ev.clientY - t.y) > 10) clearTouch();
        },
        onPointerUp: (ev: React.PointerEvent<HTMLElement>) => {
          const t = touchRef.current;
          if (t && t.id === ev.pointerId && !t.started) {
            clearTouch();
            runScripted();
            return;
          }
          clearTouch();
          release();
        },
        onPointerCancel: () => {
          clearTouch();
          release();
        },
        onLostPointerCapture: (ev: React.PointerEvent<HTMLElement>) => {
          if (ev.pointerType !== 'touch') release();
        },
        onContextMenu: (ev: React.MouseEvent) => ev.preventDefault(),
      };

  // Space and ArrowUp hold the control only while it has focus (brief §4.3): Space still pages down
  // everywhere else on the page.
  const isHoldKey = (ev: React.KeyboardEvent) => ev.key === ' ' || ev.key === 'ArrowUp' || ev.key === 'Spacebar';

  const pressedLook = held || demo;
  const startCaption = debugCollapsed ? COPY.skip.collapsed : COPY.skip.rest;
  return (
    <section id="skip" className={`skip ${pressedLook ? 'is-held' : ''}`} ref={ref} aria-labelledby="skip-h">
      <div className="skip-inner" ref={stage}>
        <h2 id="skip-h" className="skip-headline">
          <DashLine text={COPY.skip.headline} />
        </h2>
        <div className="skip-title-wrap">
          <Title key={config.layout} config={config} onEngine={onEngine} className="skip-title" upHandlers={pointerHandlers} />
        </div>
        <p className={`skip-caption ${debugCollapsed ? 'is-collapsed' : ''}`} aria-hidden="true" ref={captionBox} data-tone={toneOf(startCaption)}>
          <span className="skip-caption-t" ref={captionEl}>
            <DashLine text={startCaption} />
          </span>
        </p>
        <p className="sr-only" aria-live="polite" ref={liveEl}>
          {startCaption}
        </p>
        <div className="skip-control" ref={control}>
          {reduced ? (
            <button type="button" className="hold hold--toggle" aria-pressed={toggled} aria-describedby="skip-h" onClick={toggle}>
              <span className="hold-label">{toggled ? COPY.skip.toggleOff : COPY.skip.toggleOn}</span>
            </button>
          ) : (
            <button
              type="button"
              className={`hold ${pressedLook ? 'is-held' : ''}`}
              aria-describedby="skip-h hold-hint"
              {...pointerHandlers}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault();
                  if (!ev.repeat) runScripted();
                  return;
                }
                if (!isHoldKey(ev)) return;
                ev.preventDefault();
                if (!ev.repeat) press();
              }}
              onKeyUp={(ev) => {
                if (!isHoldKey(ev)) return;
                ev.preventDefault();
                release();
              }}
              onFocus={onFocus}
              onBlur={onBlur}
              onClick={(ev) => ev.preventDefault()}
            >
              <span className="hold-glyph" aria-hidden="true">
                <svg viewBox="0 0 36 36" className="hold-ring">
                  <circle cx="18" cy="18" r="16" pathLength={100} className="hold-ring-track" />
                  <circle cx="18" cy="18" r="16" pathLength={100} className="hold-ring-fill" ref={ring} />
                </svg>
                <span className="hold-arrow">↑</span>
              </span>
              <span className="hold-label">{held ? COPY.skip.controlHeld : COPY.skip.control}</span>
            </button>
          )}
          {!reduced && (
            <p className="hold-hint caps" id="hold-hint">
              {COPY.skip.controlHint}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
