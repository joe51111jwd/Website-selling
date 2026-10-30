import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { COPY } from '../copy';
import { DEBUG_DONE } from '../debug';
import { useFontsReady } from '../hooks/fonts';
import { useInViewOnce } from '../hooks/inview';
import { isCalm, isReduced, useCompact } from '../hooks/media';
import { useResizeKey } from '../hooks/resize';
import { boxWithin, designUnit } from '../marks/measure';
import { glyphBand, strikeOffset } from '../marks/metrics';
import { caretD, strikeD, transposeD } from '../marks/paths';
import { caretFor, drawStrikes, measureStrike, Strikes, type StrikeLine } from '../marks/strikes';
import { Clock, EASES, RGB, struckRGB } from '../motion/clock';
import { hidePath, showPath } from '../motion/draw';
import { EASE } from '../motion/easing';
import { flipAll, settled, snapshot } from '../motion/flip';
import { wait } from '../motion/timeline';
import { DeleMark, Sheet, Words } from './shared';

// The equation (§4.3): a transpose loop, the nouns trade places along arcs (FLIP),
// "Redline." is struck, "Oxygen." rises in above it and drops into the line.
const BEFORE = COPY.sheet04.before.split(' '); // Complexity > Capacity = Redline.
const AFTER = COPY.sheet04.after.split(' '); // Capacity > Complexity = Oxygen.

type End = 'red' | 'struck' | 'above' | 'oxy';

function draw(p: SVGGeometryElement | null, duration: number, easing = 'linear', reverse = false) {
  if (!p) return null;
  p.getAnimations().forEach((a) => a.cancel());
  const len = hidePath(p);
  const from = len + 12;
  const a = p.animate(
    reverse ? [{ strokeDashoffset: 0 }, { strokeDashoffset: from }] : [{ strokeDashoffset: from }, { strokeDashoffset: 0 }],
    { duration, easing, fill: 'forwards' },
  );
  return a;
}

export function Equation() {
  const fonts = useFontsReady();
  const rk = useResizeKey();
  const compact = useCompact();
  const startDone = isCalm() || DEBUG_DONE;

  const section = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const eq = useRef<HTMLHeadingElement>(null);
  const loop = useRef<SVGPathElement>(null);
  const loopHit = useRef<SVGPathElement>(null);
  const caret = useRef<SVGPathElement>(null);
  const support = useRef<HTMLParagraphElement>(null);
  const tr = useRef<HTMLSpanElement>(null);
  // The record of the edit (at rest): the old line, struck, above the corrected one.
  const rec = useRef<HTMLParagraphElement>(null);
  const recDel = useRef<HTMLModElement>(null);
  const recWords = useRef<HTMLElement[]>([]);
  const recStrikes = useRef<SVGPathElement[][]>([]);
  const recDele = useRef<SVGPathElement>(null);
  const recCaret = useRef<SVGPathElement>(null);
  const [recLines, setRecLines] = useState<StrikeLine[]>([]);
  const [recCaretD, setRecCaretD] = useState('');

  const [swapped, setSwapped] = useState(startDone);
  const [end, setEnd] = useState<End>(startDone ? 'oxy' : 'red');
  const [loopD, setLoopD] = useState('');
  const [loopOn, setLoopOn] = useState(false);
  const [supportOn, setSupportOn] = useState(startDone);
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');
  const announced = useRef(false);
  const done = useRef(startDone);
  const ran = useRef(startDone);

  const nouns = swapped ? [AFTER[0], AFTER[2]] : [BEFORE[0], BEFORE[2]];

  // Measure the loop around the two nouns.
  const measureLoop = useCallback(() => {
    const root = inner.current;
    const line = eq.current;
    if (!root || !line) return;
    const a = line.querySelector<HTMLElement>(`[data-w="${BEFORE[0]}"]`);
    const b = line.querySelector<HTMLElement>(`[data-w="${BEFORE[2]}"]`);
    if (!a || !b) return;
    const first = swapped ? b : a;
    const second = swapped ? a : b;
    const fb = boxWithin(first, root);
    const sb = boxWithin(second, root);
    const g1 = glyphBand(first);
    const g2 = glyphBand(second);
    const band = { top: Math.min(fb.y + g1.top, sb.y + g2.top), bot: Math.max(fb.y + g1.bottom, sb.y + g2.bottom), pad: g1.em * 0.14 };
    setLoopD(transposeD(fb, sb, band));
  }, [swapped]);

  useLayoutEffect(() => {
    if (fonts) measureLoop();
  }, [fonts, rk, compact, measureLoop]);

  // The record line and its caret (pointing at the corrected line's first word boundary).
  const measureRecord = useCallback(() => {
    const root = inner.current;
    const line = eq.current;
    if (!root || !line || !recWords.current.length) return;
    setRecLines(measureStrike(recWords.current, root, compact ? 2 : 6));
    const toks = Array.from(line.querySelectorAll<HTMLElement>('.eq__t'));
    setRecCaretD(caretFor(toks, root, designUnit(), compact));
  }, [compact]);
  useLayoutEffect(() => {
    if (fonts) measureRecord();
  }, [fonts, rk, compact, measureRecord]);

  // The loop is controlled imperatively: hidden, drawn on, or faded out.
  const loopDraw = useCallback((duration: number) => {
    const p = loop.current;
    if (!p) return null;
    p.getAnimations().forEach((a) => a.cancel());
    p.style.opacity = '1';
    setLoopOn(true);
    const a = draw(p, duration, EASE.outCubic);
    a?.finished.then(() => showPath(p)).catch(() => {});
    return a;
  }, []);
  const loopHide = useCallback((fade: boolean) => {
    const p = loop.current;
    setLoopOn(false);
    if (!p) return;
    if (!fade) {
      p.style.opacity = '0';
      return;
    }
    const a = p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: 160, easing: EASE.outCubic, fill: 'forwards' });
    a.finished.then(() => {
      p.style.opacity = '0';
      a.cancel();
    }).catch(() => {});
  }, []);

  // When the sheet comes into view, the loop draws (the instruction); after 1.2 s, it runs.
  const [inView, setInView] = useState(false);
  useInViewOnce(section, 0.6, () => setInView(true), { enabled: !startDone });
  useLayoutEffect(() => {
    if (!inView || !loopD || loopOn || ran.current) return;
    loopDraw(700);
    if (tr.current) tr.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 500, fill: 'backwards' });
  }, [inView, loopD, loopOn, loopDraw]);

  // The record writes in: the old line prints faintly, is struck, the dele and the caret follow.
  const writeRecord = useCallback(() => {
    const t = new Clock();
    const r = rec.current;
    if (r) t.enter(r, 0, 220, EASES.outCubic, {});
    t.color(recDel.current, 0, 260, EASES.outCubic, RGB.ink, struckRGB(recDel.current));
    const at = drawStrikes(t, recStrikes.current, 60, 300);
    t.draw(recDele.current, at - 80, 180, EASES.outCubic);
    t.draw(recCaret.current, at + 20, 120);
    t.onDone(() => t.release());
    return at + 160;
  }, []);

  const forward = useCallback(async () => {
    const line = eq.current;
    const root = inner.current;
    if (!line || !root || done.current) return;
    setBusy(true);
    ran.current = true;
    // 0 to 700: the loop (if not already drawn).
    if (!loopOn) {
      loopDraw(700);
      await wait(720);
    }
    // 700 to 1400: the nouns trade places along arcs.
    const lineH = line.querySelector<HTMLElement>('[data-w]')?.offsetHeight ?? 80;
    let snap = snapshot(line);
    flushSync(() => setSwapped(true));
    loopHide(true);
    await settled(
      flipAll(line, snap, { duration: 700, easing: EASE.slide, arcs: { [BEFORE[0]]: -lineH * 0.62, [BEFORE[2]]: lineH * 0.62 } }),
    );
    // 1400 to 1750: "Redline." is struck in red.
    const red = line.querySelector<HTMLElement>('[data-w="red"]');
    const strikeSvg = red?.querySelector<SVGSVGElement>('svg');
    const strikePath = strikeSvg?.querySelector<SVGPathElement>('path');
    if (red && strikeSvg && strikePath) {
      const w = red.offsetWidth;
      const h = red.offsetHeight;
      strikeSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      strikeSvg.style.width = `${w}px`;
      strikeSvg.style.height = `${h}px`;
      strikePath.setAttribute('d', strikeD(0, w, strikeOffset(red, 0.5), 2997, compact ? 3 : 6));
      flushSync(() => setEnd('struck'));
      await draw(strikePath, 350)?.finished;
    }
    // 1750 to 1870: the caret.
    if (red && caret.current) {
      const b = boxWithin(red, root);
      caret.current.setAttribute('d', caretD(b.x + b.w / 2, b.y + b.h * 0.94, compact ? 12 : 16, compact ? 10 : 13));
      caret.current.style.opacity = '1';
      await draw(caret.current, 120)?.finished;
    }
    // 1870 to 2170: "Oxygen." rises in above the struck word at 60% size.
    flushSync(() => setEnd('above'));
    const above = line.querySelector<HTMLElement>('.eq__above');
    await above?.animate([{ opacity: 0, transform: 'translate(-50%, 10px) scale(.6)' }, { opacity: 1, transform: 'translate(-50%, 0) scale(.6)' }], { duration: 300, easing: EASE.outCubic, fill: 'backwards' }).finished;
    // 2170 to 2470: the struck word collapses; "Oxygen." drops into the line at full size.
    const ar = above?.getBoundingClientRect();
    const redBox = red ? boxWithin(red, line) : null;
    const ghost = red?.cloneNode(true) as HTMLElement | undefined;
    snap = snapshot(line);
    flushSync(() => setEnd('oxy'));
    const anims: (Animation | null)[] = [];
    if (ghost && redBox) {
      ghost.removeAttribute('data-w');
      ghost.classList.add('eq__ghost');
      ghost.setAttribute('aria-hidden', 'true');
      Object.assign(ghost.style, { left: `${redBox.x}px`, top: `${redBox.y}px` });
      line.appendChild(ghost);
      const g = ghost.animate([{ transform: 'scaleX(1)', opacity: 1 }, { transform: 'scaleX(0)', opacity: 0 }], { duration: 300, easing: EASE.slide, fill: 'forwards' });
      g.finished.then(() => ghost.remove()).catch(() => ghost.remove());
      anims.push(g);
    }
    if (caret.current) anims.push(caret.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }));
    const oxy = line.querySelector<HTMLElement>('[data-w="oxy"]');
    if (oxy && ar) {
      const or = oxy.getBoundingClientRect();
      const s = ar.width / or.width;
      oxy.style.transformOrigin = '0 0';
      anims.push(
        oxy.animate(
          [
            { transform: `translate(${ar.left - or.left}px, ${ar.top - or.top}px) scale(${s})` },
            { transform: 'none' },
          ],
          { duration: 300, easing: EASE.slide, fill: 'backwards' },
        ),
      );
    }
    anims.push(...flipAll(line, snap, { duration: 300, easing: EASE.slide }));
    await settled(anims);
    if (caret.current) caret.current.style.opacity = '0';
    // 2500: the record of the edit writes in above, then the support line.
    flushSync(() => setSupportOn(true));
    await wait(writeRecord());
    done.current = true;
    if (!announced.current) {
      announced.current = true;
      setAnnounce(COPY.sheet04.after);
    }
    setBusy(false);
  }, [compact, loopOn, loopDraw, loopHide, writeRecord]);

  const reverse = useCallback(async () => {
    const line = eq.current;
    if (!line || !done.current) return;
    setBusy(true);
    // "Oxygen." lifts out, "Redline." returns (60% of the time).
    let snap = snapshot(line);
    const oxyBox = line.querySelector<HTMLElement>('[data-w="oxy"]')?.getBoundingClientRect();
    flushSync(() => {
      setSupportOn(false);
      setEnd('red');
    });
    const red = line.querySelector<HTMLElement>('[data-w="red"]');
    const anims = flipAll(line, snap, { duration: 260, easing: EASE.slide });
    if (red && oxyBox) anims.push(red.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE.outCubic, fill: 'backwards' }));
    await settled(anims);
    // The nouns trade back along arcs.
    const lineH = line.querySelector<HTMLElement>('[data-w]')?.offsetHeight ?? 80;
    snap = snapshot(line);
    flushSync(() => setSwapped(false));
    await settled(flipAll(line, snap, { duration: 460, easing: EASE.slide, arcs: { [BEFORE[0]]: -lineH * 0.62, [BEFORE[2]]: lineH * 0.62 } }));
    // The loop returns: the instruction is pending again.
    loopDraw(420);
    done.current = false;
    setBusy(false);
  }, [loopDraw]);

  // Re-measure the loop after a swap settles (it encloses the current pair).
  useLayoutEffect(() => {
    if (fonts) measureLoop();
  }, [swapped, fonts, measureLoop]);

  // Auto-run once: at least 60% visible for 1.2 s.
  useInViewOnce(
    section,
    0.6,
    () => {
      if (!ran.current) void forward();
    },
    { enabled: !startDone, holdMs: 1200 },
  );

  const toggle = () => {
    if (busy) return;
    if (isReduced()) {
      // Reduced motion: instant swap, no arcs.
      const next = !done.current;
      done.current = next;
      ran.current = true;
      setSwapped(next);
      setEnd(next ? 'oxy' : 'red');
      setSupportOn(next);
      if (next) loopHide(false);
      else if (loop.current) {
        showPath(loop.current);
        loop.current.style.opacity = '1';
        setLoopOn(true);
      }
      if (next && !announced.current) {
        announced.current = true;
        setAnnounce(COPY.sheet04.after);
      }
      return;
    }
    void (done.current ? reverse() : forward());
  };

  return (
    <Sheet
      id="equation"
      n={4}
      rot={compact ? 0 : 0.3}
      labelledBy="equation-h"
      next="fit"
      className={`proof proof--equation${supportOn ? ' is-solved' : ''}`}
      sectionRef={section}
      innerRef={inner}
    >
      <div className="sheet-body">
        <p className="inherited eq-record" ref={rec}>
          <span className="margin" aria-hidden="true">
            <span className="margin__no">04</span>
            <DeleMark pathRef={recDele} />
          </span>
          <del ref={recDel} aria-hidden={!supportOn}>
            <Words text={COPY.sheet04.before} refs={recWords} />
          </del>
        </p>
        <span className="caret-space" aria-hidden="true" />
        <div className="eq-row">
          <div className="eq-margin">
            <span className="margin__note" aria-hidden="true" ref={tr} style={{ opacity: loopOn || ran.current || startDone ? undefined : 0 }}>
              {COPY.marks.tr}
            </span>
            <button
              type="button"
              className="tr-btn sc"
              onClick={toggle}
              aria-describedby="equation-h"
              aria-pressed={swapped && end === 'oxy'}
            >
              {COPY.sheet04.transposeBtn}
            </button>
          </div>
          <h2 id="equation-h" className="eq" ref={eq}>
            <span className="eq__t eq__noun" data-w={nouns[0]}>
              {nouns[0]}
            </span>{' '}
            <span className="eq__t eq__op" data-w=">">
              {BEFORE[1]}
            </span>{' '}
            <span className="eq__t eq__noun" data-w={nouns[1]}>
              {nouns[1]}
            </span>
            <br /> <span className="eq__t eq__op" data-w="=">
              {BEFORE[3]}
            </span>{' '}
            <span className="eq__end">
              {end === 'oxy' ? (
                <span className="eq__t eq__oxy up" data-w="oxy">
                  {AFTER[4]}
                </span>
              ) : (
                <span className="eq__t eq__red" data-w="red">
                  {BEFORE[4]}
                  <svg className="eq__strike" aria-hidden="true" focusable="false" style={{ opacity: end === 'red' ? 0 : 1 }}>
                    <path className="mk mk--strike" />
                  </svg>
                </span>
              )}
              {end === 'above' && (
                <span className="eq__above up" aria-hidden="true">
                  {AFTER[4]}
                </span>
              )}
            </span>
          </h2>
        </div>
        <p className={`support support--eq${supportOn ? ' is-on' : ''}`} ref={support}>
          {COPY.sheet04.support}
        </p>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
      <svg className="marks" aria-hidden="true" focusable="false">
        <path className="mk mk--loop" d={loopD} ref={loop} style={{ opacity: 0 }} />
        <path className={`mk-hit${loopOn ? ' is-on' : ''}`} d={loopD} ref={loopHit} onClick={toggle} />
        <path className="mk mk--caret" ref={caret} style={{ opacity: 0 }} />
        <g className="eq-record__marks">
          <Strikes lines={recLines} seed={2997} refs={recStrikes} />
          <path className="mk mk--caret" d={recCaretD} ref={recCaret} />
        </g>
      </svg>
    </Sheet>
  );
}
