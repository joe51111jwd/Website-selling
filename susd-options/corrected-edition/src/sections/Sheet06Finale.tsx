import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type MutableRefObject, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { BOOTLOADER } from '../bootloader';
import { COPY, EXTRA } from '../copy';
import { DEBUG } from '../debug';
import { useFontsReady } from '../hooks/fonts';
import { useInViewOnce, useInViewState } from '../hooks/inview';
import { isCalm, isCompact, isReduced, useCompact, useReducedMotion } from '../hooks/media';
import { useResizeKey } from '../hooks/resize';
import { LINKS } from '../links';
import { measureStrike, Strikes, type StrikeLine } from '../marks/strikes';
import { diagonalD } from '../marks/paths';
import { Clock, EASES, RGB, struckRGB } from '../motion/clock';
import { hidePath } from '../motion/draw';
import { EASE } from '../motion/easing';
import { tick } from '../motion/ticker';
import { wait } from '../motion/timeline';
import { goToBook, registerStrike } from '../nav';
import { RunningHead } from './shared';

const STORE_KEY = 'susd-ce-struck';
const HOLD_MS = 700;

function readStruck() {
  try {
    return window.sessionStorage.getItem(STORE_KEY) === '1';
  } catch {
    return false;
  }
}
function writeStruck() {
  try {
    window.sessionStorage.setItem(STORE_KEY, '1');
  } catch {
    /* storage blocked: the sheet may return on reload, which is fine */
  }
}

/** Splits a multi-sentence line into its sentences (kept whole and in order), for line breaks. */
const sentences = (s: string) => s.match(/[^.]+\.\s*/g)?.map((x) => x.trim()) ?? [s];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Draws a group of strike segments to progress q (0 = hidden, 1 = fully ruled), in order. */
function setGroup(paths: SVGPathElement[], q: number) {
  const segs = paths.filter(Boolean);
  const lens = segs.map((p) => p.getTotalLength());
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  let cum = 0;
  segs.forEach((p, i) => {
    const len = lens[i];
    const local = clamp01((q * total - cum) / (len || 1));
    cum += len;
    p.style.strokeDasharray = `${len} ${len + 24}`;
    p.style.strokeDashoffset = String((len + 12) * (1 - local));
  });
}

/** One playbook line's strike; its segment paths land in store.current[i]. */
function LineStrikes({ lines, seed, store, i }: { lines: StrikeLine[]; seed: number; store: MutableRefObject<SVGPathElement[][]>; i: number }) {
  const refs = { current: [] as SVGPathElement[][] };
  const flat: SVGPathElement[] = [];
  store.current[i] = flat;
  return (
    <>
      <Strikes lines={lines} seed={seed} refs={refs} className="mk mk--strike mk--thin" />
      {/* collect the segments of every wrapped line of this item, in reading order */}
      <FlatRefs from={refs} into={flat} />
    </>
  );
}
function FlatRefs({ from, into }: { from: { current: SVGPathElement[][] }; into: SVGPathElement[] }) {
  useLayoutEffect(() => {
    into.length = 0;
    from.current.forEach((g) => g?.forEach((p) => p && into.push(p)));
  });
  return null;
}

/** The inherited playbook: four beliefs, set in ink. Holding Strike it rules through them. */
function Playbook({
  sheetRef,
  innerRef,
  delRefs,
  wordRefs,
  groups,
  store,
  diag,
  diagRef,
  delNoteRef,
  ring,
  mini,
}: {
  sheetRef?: React.Ref<HTMLDivElement>;
  innerRef?: React.Ref<HTMLDivElement>;
  delRefs?: MutableRefObject<(HTMLElement | null)[]>;
  wordRefs: MutableRefObject<HTMLElement[][]>;
  groups: StrikeLine[][];
  store?: MutableRefObject<SVGPathElement[][]>;
  diag: { w: number; h: number } | null;
  diagRef?: React.Ref<SVGPathElement>;
  delNoteRef?: React.Ref<HTMLSpanElement>;
  ring?: React.ReactNode;
  mini?: boolean;
}) {
  return (
    <div className={`sheet sheet--playbook${mini ? ' sheet--mini' : ''}`} ref={sheetRef}>
      <div className="sheet__shadow" aria-hidden="true" />
      <div className="sheet__paper" aria-hidden="true">
        <div className="sheet__light">
          <i />
        </div>
      </div>
      <div className="sheet__inner playbook__inner" ref={innerRef}>
        {!mini && <RunningHead center="sameGame" />}
        <div className="playbook__body">
          <p className="playbook__title sc" id={mini ? 'playbook-title-mini' : 'playbook-title'}>
            {COPY.sheet06.title}
          </p>
          <ol className="playbook__list">
            {COPY.sheet06.compiled.map((l, i) => (
              <li key={i}>
                <del
                  ref={(el) => {
                    if (delRefs) delRefs.current[i] = el;
                  }}
                >
                  {l.split(' ').map((w, j, a) => (
                    <span key={j}>
                      <span
                        className="w"
                        ref={(el) => {
                          if (!el) return;
                          (wordRefs.current[i] ??= [])[j] = el;
                        }}
                      >
                        {w}
                      </span>
                      {j < a.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </del>
              </li>
            ))}
          </ol>
          {ring}
        </div>
        <span className="playbook__del" aria-hidden="true" ref={delNoteRef}>
          {COPY.marks.del}
        </span>
        <svg className="marks" aria-hidden="true" focusable="false">
          {groups.map((g, i) =>
            store ? (
              <LineStrikes key={i} lines={g} seed={6000 + i * 11} store={store} i={i} />
            ) : (
              <Strikes key={i} lines={g} seed={6000 + i * 11} className="mk mk--strike mk--thin" />
            ),
          )}
          {diag && <path className="mk mk--diag" d={diagonalD(diag.w, diag.h, mini ? 10 : 18, 213)} ref={diagRef} />}
        </svg>
      </div>
    </div>
  );
}

export function Finale() {
  const fonts = useFontsReady();
  const rk = useResizeKey();
  const compact = useCompact();
  const reduced = useReducedMotion();

  const [struck, setStruck] = useState(() => DEBUG.finaleOpen || readStruck());
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(struck);
  const [hold, setHold] = useState(false);
  const [arming, setArming] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [inView, setInView] = useState(false);

  const section = useRef<HTMLElement>(null);
  const comp = useRef<HTMLDivElement>(null);
  const lift = useRef<HTMLDivElement>(null);
  const desk = useRef<HTMLDivElement>(null);
  const peek = useRef<HTMLDivElement>(null);
  const pbSheet = useRef<HTMLDivElement>(null);
  const pbInner = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<HTMLElement[][]>([]);
  const delRefs = useRef<(HTMLElement | null)[]>([]);
  const store = useRef<SVGPathElement[][]>([]);
  const miniInner = useRef<HTMLDivElement>(null);
  const miniWordRefs = useRef<HTMLElement[][]>([]);
  const diag = useRef<SVGPathElement>(null);
  const delNote = useRef<HTMLSpanElement>(null);
  const liftShadow = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLButtonElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const subhead = useRef<HTMLParagraphElement>(null);
  const fileEl = useRef<HTMLDivElement>(null);
  const bookEl = useRef<HTMLDivElement>(null);
  const email = useRef<HTMLInputElement>(null);
  const stamp = useRef<HTMLDivElement>(null);
  const stetNote = useRef<HTMLSpanElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [groups, setGroups] = useState<StrikeLine[][]>([]);
  const [miniGroups, setMiniGroups] = useState<StrikeLine[][]>([]);
  const [diagSize, setDiagSize] = useState<{ w: number; h: number } | null>(null);
  const [miniDiag, setMiniDiag] = useState<{ w: number; h: number } | null>(null);
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const progress = useRef(0);
  const holding = useRef(false);
  const looping = useRef(false);
  const runningRef = useRef(false);
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;

  // Measure the playbook's lines (one group per belief) and its diagonal.
  useLayoutEffect(() => {
    if (!fonts) return;
    const measure = (root: HTMLDivElement | null, refs: MutableRefObject<HTMLElement[][]>) =>
      root ? COPY.sheet06.compiled.map((_, i) => measureStrike((refs.current[i] ?? []).filter(Boolean), root, compact ? 2 : 5)) : [];
    if (pbInner.current) {
      setGroups(measure(pbInner.current, wordRefs));
      setDiagSize({ w: pbInner.current.offsetWidth, h: pbInner.current.offsetHeight });
    }
    if (miniInner.current) {
      setMiniGroups(measure(miniInner.current, miniWordRefs));
      setMiniDiag({ w: miniInner.current.offsetWidth, h: miniInner.current.offsetHeight });
    }
  }, [fonts, rk, compact, struck, reduced]);

  /** The hold's visible state: the ring fills, and the beliefs are ruled through one by one. */
  const ink = useRef<{ from: readonly number[]; to: readonly number[] } | null>(null);
  const apply = useCallback((p: number) => {
    ringRef.current?.style.setProperty('--p', p.toFixed(4));
    if (!ink.current) ink.current = { from: RGB.ink, to: struckRGB(delRefs.current[0]) };
    const { from, to } = ink.current;
    store.current.forEach((paths, i) => {
      const q = clamp01((p - i * 0.22) / 0.34);
      setGroup(paths, q);
      const el = delRefs.current[i];
      if (el) el.style.color = q <= 0 ? '' : `rgb(${from.map((v, k) => Math.round(v + (to[k] - v) * q)).join(', ')})`;
    });
  }, []);

  // Keep the drawn state in step with the measured strikes (fresh paths start hidden).
  useLayoutEffect(() => {
    ink.current = null;
    apply(progress.current);
  }, [groups, apply]);

  // The diagonal stays hidden until the strike.
  useLayoutEffect(() => {
    if (diag.current && !running) hidePath(diag.current);
  }, [diagSize, running]);

  // The composition under the playbook is inert until it is revealed.
  useEffect(() => {
    const c = comp.current as (HTMLDivElement & { inert?: boolean }) | null;
    if (c) c.inert = !revealed && !reduced;
  }, [revealed, reduced]);

  /** Animates the hold progress to 1 (the fast path, the keyboard, and the auto-run). */
  const fillTo1 = (ms: number) =>
    new Promise<void>((resolve) => {
      const from = progress.current;
      if (from >= 1) return resolve();
      const t0 = performance.now();
      const dur = Math.max(1, ms * (1 - from));
      tick((now) => {
        const k = clamp01((now - t0) / dur);
        progress.current = from + (1 - from) * EASES.outCubic(k);
        apply(progress.current);
        if (k >= 1) {
          resolve();
          return false;
        }
        return true;
      });
    });

  /** §4.2: the beliefs are struck, the rule runs corner to corner, the sheet lifts and slides away. */
  const runStrike = useCallback(
    async (opts: { fast: boolean; focus: boolean; fill?: number }) => {
      if (struck || revealedRef.current || reduced) {
        if (opts.focus) email.current?.focus({ preventScroll: true });
        return;
      }
      if (runningRef.current) return;
      runningRef.current = true;
      holding.current = false;
      flushSync(() => {
        setHold(false);
        setRunning(true);
      });
      const k = opts.fast ? 1 / 3 : 1;
      const phone = isCompact();
      // The four beliefs are ruled through (if the hold has not already done it).
      await fillTo1(opts.fill ?? (opts.fast ? 240 : 520));
      const t = new Clock();
      // 0–380: the red rule, corner to corner; the margin note writes in; the desk paths step back.
      t.draw(diag.current, 0, 380 * k);
      const dn = delNote.current;
      if (dn)
        t.tween(160 * k, 220 * k, EASES.linear, (p) => {
          dn.style.opacity = p > 0 ? '1' : '0';
          dn.style.clipPath = `inset(0 ${(100 * (1 - p)).toFixed(2)}% 0 0)`;
        });
      desk.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240 * k, delay: 300 * k, easing: EASE.outCubic, fill: 'forwards' });
      // The peeking corner hands over to the real file, which settles in its place on the desk.
      peek.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260 * k, delay: 420 * k, easing: EASE.outCubic, fill: 'forwards' });
      const l = lift.current;
      if (l) {
        // 380–630: the sheet lifts. 630–1530: it slides away (on phone: down, off screen).
        const away = phone ? 'translate3d(0,110vh,0) rotateX(0deg) rotate(0deg)' : 'translate3d(18vw,-115vh,40px) rotateX(-8deg) rotate(6deg)';
        const lifted = phone ? 'translate3d(0,-6px,0) rotateX(0deg) rotate(0deg)' : 'translate3d(0,0,40px) rotateX(-8deg) rotate(0deg)';
        l.animate(
          [
            { transform: 'translate3d(0,0,0) rotateX(0deg) rotate(0deg)', offset: 0 },
            { transform: lifted, offset: 1 },
          ],
          { duration: 250 * k, delay: 380 * k, easing: EASE.outCubic, fill: 'forwards' },
        );
        liftShadow.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 * k, delay: 380 * k, easing: EASE.outCubic, fill: 'forwards' });
        l.animate([{ transform: lifted }, { transform: away }], {
          duration: (phone ? 700 : 900) * k,
          delay: 630 * k,
          easing: EASE.slide,
          fill: 'forwards',
          composite: 'replace',
        });
      }
      // 900–1400: the headline rises in; the file and the book settle, 80 ms apart.
      await wait(phone ? 600 * k : 900 * k);
      flushSync(() => setRevealed(true));
      const r = new Clock();
      r.enter(headline.current, 0, 500 * k, EASES.outQuint, { y: 16 });
      r.enter(subhead.current, 60 * k, 500 * k, EASES.outQuint, { y: 12 });
      [fileEl.current, bookEl.current].forEach((el, i) =>
        r.enter(el, (120 + i * 80) * k, 420 * k, EASES.outQuint, phone ? { y: 16 } : { y: 4, opacity: 0 }),
      );
      r.onDone(() => r.release());
      if (opts.focus) email.current?.focus({ preventScroll: true });
      await wait((phone ? 760 : 1560) * k - (phone ? 600 : 900) * k);
      writeStruck();
      setStruck(true);
      setRunning(false);
      setArming(false);
      runningRef.current = false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [struck, reduced, apply],
  );

  useEffect(() => registerStrike((o) => runStrike(o)), [runStrike]);

  const showPlaybook = !struck && !reduced;

  // Nobody has to find the hold: once the sheet has been in view for a moment, the pencil does it.
  useInViewOnce(
    section,
    0.6,
    () => {
      if (!holding.current && !runningRef.current) void runStrike({ fast: false, focus: false, fill: HOLD_MS });
    },
    { enabled: showPlaybook, holdMs: 2200 },
  );
  // The idle cue only runs while the sheet is on screen.
  useInViewState(section, (v) => setInView(v));

  // Press and hold: the ring fills clockwise and the beliefs are struck; release early and it drains.
  const startLoop = () => {
    if (looping.current) return;
    looping.current = true;
    // rAF timestamps are frame start times and can precede performance.now(): the first frame
    // only sets the clock.
    let last = -1;
    tick((now) => {
      if (runningRef.current) {
        looping.current = false;
        return false;
      }
      const dt = last < 0 ? 0 : Math.max(0, Math.min(64, now - last));
      last = now;
      if (holding.current) progress.current = Math.min(1, progress.current + dt / HOLD_MS);
      else progress.current = Math.max(0, progress.current - dt / 260);
      apply(progress.current);
      if (progress.current >= 1) {
        holding.current = false;
        looping.current = false;
        void runStrike({ fast: false, focus: true });
        return false;
      }
      if (progress.current <= 0 && !holding.current) {
        looping.current = false;
        return false;
      }
      return true;
    });
  };
  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || runningRef.current) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    holding.current = true;
    setHold(true);
    setArming(true);
    startLoop();
  };
  const onUp = () => {
    if (!holding.current) return;
    holding.current = false;
    setHold(false);
    // A click, not a hold: show that the mark wants holding.
    if (progress.current < 0.3 && !runningRef.current) {
      setNudge(false);
      requestAnimationFrame(() => setNudge(true));
    }
  };
  useEffect(() => {
    if (!nudge) return;
    const t = setTimeout(() => setNudge(false), 900);
    return () => clearTimeout(t);
  }, [nudge]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void runStrike({ fast: false, focus: true, fill: 420 });
    }
  };

  // Back / forward cache: a page restored after the opt-in opened must be usable again.
  useEffect(() => {
    const on = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setSent(false);
      setMsg('');
      [stamp.current, stetNote.current].forEach((el) => el?.removeAttribute('style'));
    };
    window.addEventListener('pageshow', on);
    return () => window.removeEventListener('pageshow', on);
  }, []);

  // The opt-in (no backend): validate, stamp, then go to the live form.
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = email.current;
    if (!input || sent) return;
    if (!input.checkValidity()) {
      setMsg(input.validity.valueMissing ? COPY.file.badEmail : COPY.file.badFormat);
      input.focus();
      if (!isReduced())
        input.animate(
          [{ transform: 'none' }, { transform: 'translateX(2px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(-2px)' }, { transform: 'none' }],
          { duration: 150, easing: 'linear' },
        );
      return;
    }
    setMsg('');
    setSent(true);
    const go = () => {
      if (!DEBUG.nonav) window.location.assign(LINKS.get);
    };
    if (isReduced()) {
      setTimeout(go, 300);
      return;
    }
    const t = new Clock();
    const st = stamp.current;
    if (st) {
      t.tween(0, 160, EASES.outCubic, (p) => {
        st.style.opacity = String(p);
        st.style.transform = `rotate(-8deg) scale(${(1.4 - 0.4 * p).toFixed(4)})`;
      });
      t.tween(160, 200, EASES.outCubic, (p) => {
        st.style.filter = p >= 1 ? 'none' : `blur(${(1.5 * (1 - p)).toFixed(2)}px)`;
      });
    }
    const sn = stetNote.current;
    if (sn)
      t.tween(380, 300, EASES.linear, (p) => {
        sn.style.opacity = p > 0 ? '1' : '0';
        sn.style.clipPath = `inset(0 ${(100 * (1 - p)).toFixed(2)}% 0 0)`;
      });
    await wait(380 + 300 + 500);
    go();
  };

  const fileFace = COPY.file.fileFace;
  const idle = inView && !hold && !running && !isCalm();
  const fast = (e: React.MouseEvent) => {
    e.preventDefault();
    void runStrike({ fast: true, focus: true });
  };

  return (
    <section
      id="paths"
      ref={section}
      className={`finale${revealed || reduced ? ' is-revealed' : ''}${showPlaybook ? ' has-playbook' : ''}${running ? ' is-running' : ''}${arming ? ' is-arming' : ''}${sent ? ' is-sent' : ''}`}
      aria-labelledby="file-h"
      data-sheet={6}
    >
      <span id="file" className="anchor" aria-hidden="true" />
      {reduced && (
        <figure className="mini-playbook">
          <Playbook innerRef={miniInner} wordRefs={miniWordRefs} groups={miniGroups} diag={miniDiag} mini />
          <figcaption className="sc">{COPY.sheet06.title}</figcaption>
        </figure>
      )}
      <div className="finale__stage">
        <div className="comp" ref={comp} aria-hidden={!revealed && !reduced ? true : undefined}>
          <h2 id="file-h" className="comp__h" ref={headline}>
            {sentences(COPY.file.headline).map((s, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className="comp__line">{s}</span>
              </Fragment>
            ))}
          </h2>
          <p className="comp__sub" ref={subhead}>
            {COPY.file.subhead}
          </p>
          <div className="comp__row">
            <div className="filestack" ref={fileEl}>
              <div className="filestack__sheet filestack__sheet--3" aria-hidden="true" />
              <div className="filestack__sheet filestack__sheet--2" aria-hidden="true" />
              <div className="filestack__sheet filestack__sheet--1">
                <div className="file__head">
                  <p className="file__label sc">{COPY.file.label}</p>
                  <p className="file__name">
                    {BOOTLOADER.file}
                    <span className="file__stet" ref={stetNote} aria-hidden="true">
                      {COPY.marks.stet}
                    </span>
                  </p>
                  <p className="file__meta">{COPY.file.fileMeta}</p>
                  <p className="file__ai">{COPY.file.aiFor}</p>
                </div>
                <div className="file__face" aria-hidden="true">
                  {fileFace.map((f, i) => (
                    <p key={i}>{f}</p>
                  ))}
                  <div className="stamp" ref={stamp}>
                    <span>{COPY.file.stamp}</span>
                  </div>
                </div>
                <p className="file__ref">
                  {sentences(COPY.file.refLine).map((s, i) => (
                    <Fragment key={i}>
                      {i > 0 && ' '}
                      <span>{s}</span>
                    </Fragment>
                  ))}
                </p>
                <form className="file__form" noValidate onSubmit={onSubmit} ref={formRef}>
                  <label className="sr-only" htmlFor="email">
                    {COPY.file.email}
                  </label>
                  <div className="file__fields">
                    <input
                      ref={email}
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      placeholder={COPY.file.placeholder}
                      disabled={sent}
                      aria-describedby="form-msg"
                      onInput={() => msg && setMsg('')}
                    />
                    <button type="submit" className="btn btn--red btn--get sc" disabled={sent}>
                      {COPY.file.submit}
                    </button>
                  </div>
                  <p className="form-msg" id="form-msg" aria-live="polite">
                    {msg}
                  </p>
                </form>
                <p className="file__upload">{COPY.file.upload}</p>
              </div>
            </div>
            <div className="book" id="book" ref={bookEl}>
              <div className="cover-wrap">
                <div className="cover" role="img" aria-label={`${COPY.file.bookTitle}, ${COPY.file.bookAuthor}`}>
                  <span className="cover__top sc">{EXTRA.coverScaling}</span>
                  <span className="cover__title">
                    {EXTRA.coverLegs.map((w, i) => (
                      <span key={w} className={`cover__leg cover__leg--${i}`}>
                        {w}
                      </span>
                    ))}
                  </span>
                  <span className="cover__rule" />
                  <span className="cover__author sc">{COPY.file.bookAuthor}</span>
                </div>
              </div>
              <p className="book__line">
                {sentences(COPY.file.bookLine).map((s, i) => (
                  <Fragment key={i}>
                    {i > 0 && ' '}
                    <span>{s}</span>
                  </Fragment>
                ))}
              </p>
              {LINKS.preorder ? (
                <a className="btn btn--cream sc" href={LINKS.preorder}>
                  Pre-order the book {/* label */}
                </a>
              ) : (
                <button type="button" className="btn btn--cream btn--soon sc" aria-disabled="true">
                  {COPY.file.preorder}
                </button>
              )}
            </div>
          </div>
        </div>

        {showPlaybook && (
          <div className="playbook" aria-label={COPY.sheet06.title} role="group">
            <div className="playbook__stack">
              {/* The file underneath: its corner shows past the playbook. */}
              <div className="peek" ref={peek} aria-hidden="true" onClick={() => void runStrike({ fast: true, focus: true })}>
                <div className="peek__sheet peek__sheet--2" />
                <div className="peek__sheet peek__sheet--1">
                  <span className="peek__name">{BOOTLOADER.file}</span>
                  <span className="peek__meta">{`${BOOTLOADER.version} · ${BOOTLOADER.wordsLabel} words`}</span>
                </div>
              </div>
              <div className="playbook__lift" ref={lift}>
                <div className="playbook__liftshadow" ref={liftShadow} aria-hidden="true" />
                <Playbook
                  sheetRef={pbSheet}
                  innerRef={pbInner}
                  delRefs={delRefs}
                  wordRefs={wordRefs}
                  groups={groups}
                  store={store}
                  diag={diagSize}
                  diagRef={diag}
                  delNoteRef={delNote}
                  ring={
                    <div className={`strike-it${idle ? ' is-idle' : ''}${nudge ? ' is-nudge' : ''}`}>
                      <button
                        ref={ringRef}
                        type="button"
                        className={`strike-it__ring${hold ? ' is-holding' : ''}`}
                        aria-describedby="playbook-title strike-hint"
                        onPointerDown={onDown}
                        onPointerUp={onUp}
                        onPointerCancel={onUp}
                        onLostPointerCapture={onUp}
                        onKeyDown={onKey}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{ '--p': 0 } as CSSProperties}
                      >
                        <span className="strike-it__disc" aria-hidden="true">
                          <span className="strike-it__fill" />
                          <svg className="strike-it__mark" viewBox="0 0 64 32" aria-hidden="true" focusable="false">
                            <path pathLength={1} d="M4,22L33,22C43,22,49.5,13.5,46,7C42.6,0.8,33.6,4,35.6,11.6C37.6,19,47.5,24.5,60,20.5" />
                          </svg>
                        </span>
                        <span className="strike-it__label sc">{COPY.sheet06.strike}</span>
                      </button>
                      <span className="strike-it__hint sc" id="strike-hint">
                        {EXTRA.hold}
                      </span>
                    </div>
                  }
                />
              </div>
            </div>
            <div className="playbook__desk" ref={desk}>
              <a className="btn btn--red sc" href="#file" onClick={fast}>
                {COPY.head.get}
              </a>
              <a className="btn btn--cream btn--split sc" href="#book" onClick={goToBook}>
                <span>{COPY.sheet01.bookBtn[0]}</span>
                <span className="btn__rule" aria-hidden="true" />
                <span>{COPY.sheet01.bookBtn[1]}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
