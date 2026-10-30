import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COPY } from '../copy';
import { DEBUG_DONE } from '../debug';
import { useFontsReady } from '../hooks/fonts';
import { isCalm, useCompact, useReducedMotion } from '../hooks/media';
import { useResizeKey } from '../hooks/resize';
import { designUnit } from '../marks/measure';
import { caretFor, drawStrikes, measureStrike, Strikes, type StrikeLine } from '../marks/strikes';
import { Clock, EASES, RGB, struckRGB } from '../motion/clock';
import { goToBook, goToFile } from '../nav';
import { CycleRule } from './CycleRule';
import { DeleMark, Sheet, Words } from './shared';

type Phase = 'pending' | 'play' | 'done';

// Cycle labels keep their CSS centring transform while they fade in.
const labelBase = () => 'translate(-50%, -50%)';

export function Hero() {
  const reduced = useReducedMotion();
  const compact = useCompact();
  const fonts = useFontsReady();
  const rk = useResizeKey();

  const inner = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const del = useRef<HTMLModElement>(null);
  const delWords = useRef<HTMLElement[]>([]);
  const h1Words = useRef<HTMLElement[]>([]);
  const strikes = useRef<SVGPathElement[][]>([]);
  const dele = useRef<SVGPathElement>(null);
  const caret = useRef<SVGPathElement>(null);
  const legs = useRef<(SVGPathElement | null)[]>([]);
  const labels = useRef<(HTMLElement | null)[]>([]);
  const tail = useRef<SVGPathElement | null>(null);
  const support = useRef<HTMLParagraphElement>(null);
  const who = useRef<HTMLDivElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const tl = useRef<Clock | null>(null);

  const [lines, setLines] = useState<StrikeLine[]>([]);
  const [caretPath, setCaretPath] = useState('');
  const [phase, setPhase] = useState<Phase>(() => (isCalm() || DEBUG_DONE ? 'done' : 'pending'));

  // Measure the struck line and the caret (after fonts, on resize, on layout switch).
  useLayoutEffect(() => {
    if (!fonts || !inner.current || !delWords.current.length) return;
    setLines(measureStrike(delWords.current, inner.current, compact ? 2 : 6));
    setCaretPath(caretFor(h1Words.current, inner.current, designUnit(), compact));
    tl.current?.finish();
  }, [fonts, rk, compact]);

  // The intro (§4.1). t = 0 at fonts ready; any input skips to the end state.
  useLayoutEffect(() => {
    if (phase !== 'pending' || !lines.length) return;
    if (isCalm()) {
      setPhase('done');
      return;
    }
    const t = new Clock();
    tl.current = t;
    const E = EASES;
    const words = delWords.current;
    const hw = h1Words.current;

    // The whole sheet rises on the compositor (one layer), so the paper is rastered once.
    wrap.current?.animate(
      [
        { transform: 'translateY(24px)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 400, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
    );

    // Print the inherited line word by word: letterpress.
    words.forEach((w, i) => t.enter(w, 250 + i * 60, 90, E.outCubic, { scale: 1.02, blur: 1 }));
    // The red pencil.
    drawStrikes(t, strikes.current, 1000, 450);
    t.draw(dele.current, 1250, 200, E.outCubic);
    t.color(del.current, 1000, 300, E.outCubic, RGB.ink, struckRGB(del.current));
    t.draw(caret.current, 1450, 120);

    // The correction rises out of the paper, the emboss highlight coming up with it.
    hw.forEach((w, i) => {
      t.enter(w, 1550 + i * 40, 450, E.outQuint, { y: 18 });
      t.tween(1550 + i * 40, 450, E.outQuint, (p) => {
        w.style.textShadow = p >= 1 ? '' : `0 1px 0 rgb(255 255 255 / ${(0.55 * p).toFixed(3)}), 0 -0.5px 0 rgb(0 0 0 / ${(0.12 * p).toFixed(3)})`;
      });
    });
    // The cycle draws leg by leg; each label arrives as its leg completes.
    legs.current.forEach((p, i) => {
      t.draw(p, 1900 + i * 150, 150);
      t.enter(labels.current[i], 2050 + i * 150, 220, E.outCubic, { base: labelBase() });
    });
    inner.current?.querySelectorAll<SVGElement>('.cycle__guide, .cycle__dot').forEach((el) => t.enter(el, 1900, 300, E.outCubic, {}));
    t.enter(tail.current, 2780, 260, E.outCubic, {});

    t.enter(support.current, 2200, 300, E.outCubic, { y: 8 });
    [who.current, actions.current, caption.current, inner.current?.querySelector<HTMLElement>('.galley')].forEach((el, i) =>
      t.enter(el, 2400 + i * 60, 300, E.outCubic, { y: 6 }),
    );

    setPhase('play');
    t.onDone(() => setPhase('done'));
  }, [phase, lines]);

  // Once the CSS shows the resting state, drop the animations.
  useEffect(() => {
    if (phase === 'done') tl.current?.release();
  }, [phase]);

  // Any input skips the intro.
  useEffect(() => {
    if (phase !== 'play') return;
    const skip = () => tl.current?.finish();
    const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    evs.forEach((e) => window.addEventListener(e, skip, { passive: true }));
    return () => evs.forEach((e) => window.removeEventListener(e, skip));
  }, [phase]);

  return (
    <Sheet
      as="header"
      id="top"
      n={1}
      rot={compact ? 0 : -0.35}
      labelledBy="hero-h"
      center="title"
      next="growth"
      className={`hero is-${phase}${reduced ? ' is-reduced' : ''}`}
      innerRef={inner}
      wrapRef={wrap}
      shadowRef={shadow}
    >
      <div className="hero__body">
        <p className="inherited inherited--hero">
          <span className="margin" aria-hidden="true">
            <span className="margin__no">01</span>
            <DeleMark pathRef={dele} />
          </span>
          <del ref={del}>
            <Words text={COPY.sheet01.inherited} refs={delWords} />
          </del>
        </p>
        <span className="caret-space" aria-hidden="true" />
        <h1 id="hero-h" className="correction correction--hero">
          <ins>
            <Words
              text={COPY.sheet01.corrected}
              refs={h1Words}
              className="w wi"
              tone={(w) => (w === 'higher' ? 'up' : undefined)}
              brD={[2]}
              brM={[1, 3]}
            />
          </ins>
        </h1>
        <CycleRule legRefs={legs} labelRefs={labels} tailRef={tail} />
        <p className="support support--hero" ref={support}>
          {COPY.sheet01.support}
        </p>
        <div className="who" ref={who}>
          <p className="who__book">
            <cite className="who__title">{COPY.who.title}</cite>
            <span className="who__sep" aria-hidden="true">
              ·
            </span>
            <span className="who__by sc">{COPY.who.by}</span>
          </p>
          <p className="who__for">
            {COPY.who.forWhom.map((part, i) => (
              <span key={i} className="who__part sc">
                {part}
              </span>
            ))}
          </p>
        </div>
        <div className="actions" ref={actions}>
          <a className="btn btn--red sc" href="#file" onClick={goToFile}>
            {COPY.sheet01.getBtn}
          </a>
          <a className="btn btn--line btn--split sc" href="#book" onClick={goToBook}>
            <span>{COPY.sheet01.bookBtn[0]}</span>
            <span className="btn__rule" aria-hidden="true" />
            <span>{COPY.sheet01.bookBtn[1]}</span>
          </a>
        </div>
        <p className="file-caption" ref={caption}>
          <span>{COPY.fileCaption[0]}</span>
          <span className="file-caption__sep" aria-hidden="true">
            ·
          </span>
          <span>{COPY.fileCaption[1]}</span>
        </p>
      </div>
      <svg className="marks" aria-hidden="true" focusable="false">
        <Strikes lines={lines} seed={1439} refs={strikes} />
        <path className="mk mk--caret" d={caretPath} ref={caret} />
      </svg>
    </Sheet>
  );
}
