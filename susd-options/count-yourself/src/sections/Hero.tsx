import { Fragment, memo, useDeferredValue, useEffect, useId, useRef, useState, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { COPY, UI } from '../copy';
import { Wheel, type WheelApi } from '../components/Wheel';
import { Swap } from '../components/Swap';
import { getState, setN, setState, useStore } from '../state/store';
import { drum, jolt } from '../state/drum';
import { addTick, wake } from '../motion/loop';
import { clamp } from '../motion/ease';
import { MAX, MIN, coordWord, pathways, tagOf, valueText, zoneOf } from '../zones';
import { useMedia } from '../hooks/useMedia';
import { skipIntro } from '../intro';
import { goPaths, scrollToId } from '../nav';
import { S } from '../components/Text';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const tensFace = (i: number) => (i === 0 ? 'is-zero' : '');

function Words({ text, base = 0 }: { text: string; base?: number }) {
  return (
    <>
      {text.split(' ').map((w, i, a) => (
        <Fragment key={i}>
          <span className="rise" style={{ ['--i' as string]: base + i }}>
            {w}
          </span>
          {i < a.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </>
  );
}

/** Step n by d from user input; ends the intro first if it is still running. */
function bump(d: number) {
  skipIntro();
  const { n } = getState();
  const next = clamp(n + d, MIN, MAX);
  if (next !== n) setN(next, 'user');
}
function setUser(v: number) {
  skipIntro();
  setN(v, 'user');
}

function useHold(d: number) {
  const timer = useRef(0);
  const fromPointer = useRef(false);
  const stop = () => {
    window.clearTimeout(timer.current);
    timer.current = 0;
  };
  useEffect(() => stop, []);
  return {
    onPointerDown: (e: RPointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      fromPointer.current = true;
      bump(d);
      stop();
      const repeat = () => {
        bump(d);
        timer.current = window.setTimeout(repeat, 120);
      };
      timer.current = window.setTimeout(repeat, 400);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
    onClick: () => {
      // Keyboard activation (Enter/Space) arrives as a click with no pointer down before it.
      if (fromPointer.current) fromPointer.current = false;
      else bump(d);
    },
  };
}

function PlusMinus({ d }: { d: 1 | -1 }) {
  const hold = useHold(d);
  const atLimit = useStore((s) => (d > 0 ? s.n >= MAX : s.n <= MIN));
  return (
    <button
      type="button"
      className={`pm ${d > 0 ? 'pm-plus' : 'pm-minus'}${atLimit ? ' is-limit' : ''}`}
      aria-label={d > 0 ? COPY.hero.plus : COPY.hero.minus}
      aria-disabled={atLimit || undefined}
      {...hold}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14" />
        {d > 0 && <path d="M12 5v14" />}
      </svg>
    </button>
  );
}

type DialRefs = { path: React.RefObject<HTMLSpanElement>; mark: React.RefObject<HTMLSpanElement> };

function DialWindow({ labelledBy, describedBy, refs }: { labelledBy: string; describedBy: string; refs: DialRefs }) {
  const n = useStore((s) => s.n);
  const on = useStore((s) => s.phase !== 'boot');
  const caret = useStore((s) => s.caret);
  const tens = useRef<WheelApi>(null);
  const units = useRef<WheelApi>(null);
  const win = useRef<HTMLDivElement>(null);
  const kbd = useRef<HTMLInputElement>(null);
  const [blink, setBlink] = useState(0);
  const [first] = useState(() => getState().n);

  // Drive both wheels, the pathways count and the ruler mark from the shared spring, every frame while moving.
  useEffect(() => {
    let lastP = -1;
    let lastM = -1;
    let prevX = drum.n.x;
    let prevTens = Math.floor(drum.n.x / 10);
    return addTick((dt) => {
      // While the intro drives the drum, its position is already set for this frame.
      const a = drum.scripted ? true : drum.n.step(dt);
      const b = drum.jolt.step(dt);
      const x = drum.n.x;
      if (prevX < 14.5 && x >= 14.5 && drum.n.target >= 15) jolt();
      const tb = Math.floor(x / 10);
      const uu = x - tb * 10;
      const carry = clamp((uu - 9.7) / 0.3, 0, 1);
      const tensPos = tb + carry;
      const j = drum.jolt.x / 36;
      const speed = Math.abs(drum.n.v);
      const blurU = clamp((speed - 2.5) * 0.13, 0, 2);
      const dTens = Math.abs(tensPos - prevTens) / Math.max(dt, 1 / 240);
      const moving = a || b;
      units.current?.set(x + j, moving ? blurU : 0);
      tens.current?.set(tensPos + j, moving ? clamp((dTens - 2.5) * 0.13, 0, 2) : 0);
      prevX = x;
      prevTens = tensPos;
      // The label always names a real count: n(n−1)/2 of the integer the drum is showing.
      const p = pathways(clamp(Math.round(x), MIN, MAX));
      if (p !== lastP && refs.path.current) {
        lastP = p;
        refs.path.current.textContent = String(p);
      }
      const m = Math.round(clamp(x, MIN, MAX) * 100) / 100;
      if (m !== lastM && refs.mark.current) {
        lastM = m;
        refs.mark.current.style.transform = `translateX(${((m - 1) * 100).toFixed(1)}%)`;
      }
      return moving;
    });
  }, [refs]);

  useEffect(() => {
    if (caret) setBlink((b) => b + 1);
  }, [caret]);

  // Wheel: only while the pointer is over the window AND the window has focus (click or Tab into it),
  // so a visitor scrolling the page with the pointer resting mid-screen is never hijacked.
  useEffect(() => {
    const el = win.current!;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      const focused = document.activeElement === el || document.activeElement === kbd.current;
      if (!focused) return;
      e.preventDefault();
      acc += e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      while (Math.abs(acc) >= 60) {
        bump(acc > 0 ? 1 : -1);
        acc -= Math.sign(acc) * 60;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Typed digits collect in a 600 ms buffer ("1" then "5" sets 15).
  const buf = useRef({ s: '', t: 0 });
  const typeDigit = (d: string) => {
    const b = buf.current;
    window.clearTimeout(b.t);
    b.s = (b.s + d).slice(-2);
    const v = parseInt(b.s, 10);
    if (v >= 1) setUser(Math.min(MAX, v));
    b.t = window.setTimeout(() => (b.s = ''), 600);
  };

  const onKeyDown = (e: RKeyboardEvent<HTMLDivElement>) => {
    const { n: cur } = getState();
    const map: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 };
    if (e.key in map) {
      e.preventDefault();
      bump(map[e.key]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (cur !== MIN) setUser(MIN);
    } else if (e.key === 'End') {
      e.preventDefault();
      if (cur !== MAX) setUser(MAX);
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      typeDigit(e.key);
    }
  };

  // Drag (mouse/pen): vertical, 28 px per step, with momentum. Touch: horizontal swipe, 32 px per step.
  const drag = useRef({ id: -1, touch: false, start: 0, startN: 0, last: 0, lastT: 0, v: 0, moved: false, stopMomentum: () => {} });
  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const d = drag.current;
    d.stopMomentum();
    const touch = e.pointerType === 'touch';
    d.id = e.pointerId;
    d.touch = touch;
    d.start = touch ? e.clientX : e.clientY;
    d.last = d.start;
    d.lastT = performance.now();
    d.v = 0;
    d.moved = false;
    d.startN = getState().n;
    if (touch) {
      // Suppress the compatibility mousedown that would otherwise move focus onto the window and close
      // the keypad a tap opens. Page scroll is unaffected (touch-action: pan-y decides that).
      e.preventDefault();
    } else {
      win.current?.setPointerCapture(e.pointerId);
      win.current?.focus({ preventScroll: true });
    }
  };
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (e.pointerId !== d.id) return;
    const pos = d.touch ? e.clientX : e.clientY;
    const now = performance.now();
    const dtF = Math.max(1, (now - d.lastT) / 16.67);
    d.v = d.v * 0.4 + ((pos - d.last) / dtF) * 0.6;
    d.last = pos;
    d.lastT = now;
    const dist = d.touch ? pos - d.start : d.start - pos; // up (mouse) or right (touch) increases
    const per = d.touch ? 32 : 28;
    if (Math.abs(dist) > 6) d.moved = true;
    if (d.moved) {
      const v = clamp(d.startN + Math.trunc(dist / per), MIN, MAX);
      if (v !== getState().n) setUser(v);
    }
  };
  const onPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (e.pointerId !== d.id) return;
    d.id = -1;
    if (d.touch && !d.moved) {
      // A tap: open the numeric keypad.
      skipIntro();
      kbd.current?.focus();
      return;
    }
    if (!d.moved || d.touch) return;
    // Momentum: friction 0.92 per frame, stepping as the travel crosses each 28 px.
    let v = -d.v; // positive = upward drag = increasing
    let dist = d.start - d.last;
    if (Math.abs(v) < 2) return;
    let alive = true;
    const off = addTick(() => {
      if (!alive) return false;
      v *= 0.92;
      dist += v;
      const nv = clamp(d.startN + Math.trunc(dist / 28), MIN, MAX);
      if (nv !== getState().n) setN(nv, 'user');
      if (Math.abs(v) < 0.5 || nv === MIN || nv === MAX) {
        alive = false;
        off();
        return false;
      }
      return true;
    });
    d.stopMomentum = () => {
      alive = false;
      off();
    };
    wake();
  };

  const onKbdInput = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const digits = el.value.replace(/\D/g, '').slice(-2);
    el.value = '';
    for (const ch of digits) typeDigit(ch);
  };

  return (
    <div
      id="dial-window"
      ref={win}
      className={`window${on ? ' is-on' : ''}`}
      role="spinbutton"
      tabIndex={0}
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={n}
      aria-valuetext={valueText(n)}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current.id = -1)}
      onMouseDown={(e) => {
        // Belt and braces for the tap → keypad path: never let a mouse event steal focus from the keypad.
        if (document.activeElement === kbd.current) e.preventDefault();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="wheels">
        <Wheel ref={tens} faces={DIGITS} className="w-tens" faceClassName={tensFace} initial={Math.floor(first / 10)} />
        <Wheel ref={units} faces={DIGITS} className="w-units" initial={first} />
        <span className={`caret${blink ? ' blink' : ''}`} key={blink} aria-hidden="true" />
        <svg className={`plus40${n === MAX ? ' on' : ''}`} viewBox="0 0 40 40" aria-hidden="true">
          <path d="M20 4v32M4 20h32" />
        </svg>
      </div>
      <div className="shade" aria-hidden="true" />
      <input
        ref={kbd}
        className="kbd"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        aria-label={UI.spinLabel}
        onInput={onKbdInput}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </div>
  );
}

/**
 * The team-size ruler under the window: 1–40 in the zones' colours (1–12 in, 13–14 the edge,
 * 15–39 the Graveyard, 40+ out of scope), the line after 12 marked, and a mark at the visitor's number.
 * It carries "the line you don't cross" even in a still frame.
 */
const Ruler = memo(function Ruler({ markRef }: { markRef: React.RefObject<HTMLSpanElement> }) {
  const [first] = useState(() => getState().n);
  const seg = (a: number, b: number, cls: string) => (
    <span className={`seg ${cls}`} style={{ left: `${(a / 40) * 100}%`, width: `${((b - a) / 40) * 100}%` }} />
  );
  const num = (at: number, text: string, cls = '') => (
    <span className={`rnum ${cls}`} style={{ left: `${(at / 40) * 100}%` }}>
      {text}
    </span>
  );
  return (
    <div className="ruler" aria-hidden="true">
      <div className="ruler-marks">
        <span className="ruler-mark" ref={markRef} style={{ transform: `translateX(${(first - 1) * 100}%)` }}>
          <i />
        </span>
      </div>
      <div className="ruler-track">
        {seg(0, 12, 'seg-in')}
        {seg(12, 14, 'seg-th')}
        {seg(14, 39, 'seg-gy')}
        {seg(39, 40, 'seg-tot')}
        <span className="line12" style={{ left: `${(12 / 40) * 100}%` }} />
      </div>
      <div className="ruler-nums">
        {num(0, '1', 'is-start')}
        {num(12, '12', 'is-line')}
        {num(26.5, UI.rulerGraveyard, 'is-gy')}
        <span className="rnum is-end">40+</span>
      </div>
    </div>
  );
});

/** The who-for line: who wrote it, then the three criteria (COPY.hero). */
const WhoLine = memo(function WhoLine({ phone }: { phone: boolean }) {
  return (
    <p className="who">
      <span className="who-by">
        {phone ? (
          <span className="rise by" style={{ ['--i' as string]: 0 }}>
            {COPY.hero.byLabel}
          </span>
        ) : (
          <span className="rise by" style={{ ['--i' as string]: 0 }}>
            <cite className="who-title">{COPY.rail.title}</cite>, {COPY.hero.byLabelAfterTitle}
          </span>
        )}{' '}
        <span className="rise for" style={{ ['--i' as string]: 1 }}>
          {COPY.hero.forLabel}
        </span>
      </span>{' '}
      <span className="who-crit">
        <span className="rise who-item" style={{ ['--i' as string]: 2 }}>
          {COPY.hero.who[0]}
        </span>
        <span className="who-rest">
          {COPY.hero.who.slice(1).map((w, i) => (
            <span key={w} className="rise who-item" style={{ ['--i' as string]: i + 3 }}>
              <i className="dot" aria-hidden="true">
                ·
              </i>
              {w}
            </span>
          ))}
        </span>
      </span>
    </p>
  );
});

const Question = memo(function Question() {
  return (
    <h1 id="q" className="q">
      <Words text={COPY.hero.h1} base={1} />
    </h1>
  );
});

function WhoCounts({ phone }: { phone: boolean }) {
  const [open, setOpen] = useState(false);
  const subId = useId();
  // Short phones (375×667) keep it behind "Who counts?" so the claim stays on the first screen.
  const short = useMedia('(max-height: 760px)');
  if (!phone || !short)
    return (
      <p className="sub rise" style={{ ['--i' as string]: 10 }} id={subId}>
        <S>{COPY.hero.whoCounts}</S>
      </p>
    );
  return (
    <div className="who-counts">
      <button type="button" className="disclose rise" style={{ ['--i' as string]: 10 }} aria-expanded={open} aria-controls={subId} onClick={() => setOpen((o) => !o)}>
        {COPY.hero.whoCountsToggle}
      </button>
      <p id={subId} className={`sub sub-pop${open ? ' open' : ''}`} hidden={!open}>
        <S>{COPY.hero.whoCounts}</S>
      </p>
    </div>
  );
}

/**
 * The readout under the ruler, two centred rows: "28 COORDINATION PATHWAYS", then "— TEAM · 8–12 —".
 * The count rolls with the drum and links to the meter that explains it; the tag names the place, and
 * follows the drum through the intro too (Threshold at 13, The Graveyard at 15), cut, not animated.
 */
function Readout({ pathRef }: { pathRef: React.RefObject<HTMLSpanElement> }) {
  const word = useStore((s) => coordWord(s.n));
  const tag = useStore((s) => tagOf(s.n));
  const phase = useStore((s) => s.phase);
  const [initialP] = useState(() => pathways(getState().n));
  return (
    <div className={`readout${phase !== 'boot' ? ' on' : ''}`}>
      <p className="pathways" id="pathways">
        <a
          href="#meter"
          className="plink hit44"
          onClick={(e) => {
            e.preventDefault();
            scrollToId('meter');
          }}
        >
          <span className="pnum" ref={pathRef}>
            {initialP}
          </span>{' '}
          {word}
        </a>
      </p>
      <Swap className="tag" text={tag} outMs={120} inMs={180} as="p" instant={phase !== 'ready'} />
    </div>
  );
}

/** Michael's line for this place. Rendered at low priority, after the drum and colour have moved. */
function Verdict() {
  const lineNow = useStore((s) => zoneOf(s.n).line);
  const line = useDeferredValue(lineNow);
  const ready = useStore((s) => s.phase === 'ready');
  return (
    <div className={`verdict${ready ? ' on' : ''}`}>
      <Swap className="line" text={line} as="p" render={(t) => <S>{t}</S>} />
    </div>
  );
}

/** A pencilled margin note beside the dial, until the visitor sets their own number. */
function SetHint() {
  const show = useStore((s) => s.phase === 'ready' && !s.touched);
  return (
    <span className={`set-hint${show ? ' on' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 40 22" className="set-arrow">
        <path d="M38 6 C 28 2, 14 3, 4 12" />
        <path d="M10 13.5 L 3.5 12.5 L 6 6.5" />
      </svg>
      <span className="set-text">{COPY.hero.setHint}</span>
    </span>
  );
}

export function Hero({ phone }: { phone: boolean }) {
  const phase = useStore((s) => s.phase);
  const stamp = useStore((s) => s.stamp);
  const pathRef = useRef<HTMLSpanElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const [refs] = useState<DialRefs>(() => ({ path: pathRef, mark: markRef }));

  // The chip shows once the window has left the viewport.
  useEffect(() => {
    const el = document.getElementById('dial-window');
    if (!el) return;
    // Offscreen, the window's 3D wheels are flattened and hidden, so scrolling never re-composites them.
    const io = new IntersectionObserver(
      ([e]) => {
        el.toggleAttribute('data-off', !e.isIntersecting);
        setState({ heroGone: !e.isIntersecting });
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const ready = phase === 'ready';
  return (
    <section id="top" className={`hero phase-${phase}`} aria-labelledby="q">
      <WhoLine phone={phone} />
      <Question />
      <WhoCounts phone={phone} />

      <div className="dial">
        <PlusMinus d={-1} />
        <DialWindow labelledBy="q" describedBy="pathways" refs={refs} />
        <PlusMinus d={1} />
        <SetHint />
      </div>
      <Ruler markRef={markRef} />

      <Readout pathRef={pathRef} />

      {/* The verdict slot. During the intro it holds the stamp ("Past twelve, something breaks.") at 13+. */}
      <div className="verdict-slot">
        <Verdict />
        <p className={`stamp${stamp ? ' on' : ''}`} aria-hidden="true">
          <span>{COPY.hero.stamp}</span>
        </p>
      </div>

      {/* The book's standing claim: in from the start of the count, so the drum crosses the line under it. */}
      <div className="claim-wrap">
        <i className="claim-rule" aria-hidden="true" />
        <p className="claim">
          <S>{COPY.hero.claim}</S>
        </p>
      </div>

      {!phone && (
        <div className={`actions${ready ? ' on' : ''}`}>
          <a href="#paths" className="pill pill-solid" onClick={goPaths}>
            <span>{COPY.hero.getBtn}</span>
            <small>{COPY.hero.getMeta}</small>
          </a>
          <a href="#paths" className="pill pill-line" onClick={goPaths}>
            {COPY.hero.bookBtn}
          </a>
        </div>
      )}
    </section>
  );
}
