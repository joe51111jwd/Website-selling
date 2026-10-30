import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COPY, EXTRA } from '../copy';
import { DEBUG_DONE } from '../debug';
import { useFontsReady } from '../hooks/fonts';
import { useInViewOnce } from '../hooks/inview';
import { isCalm, useCompact } from '../hooks/media';
import { useResizeKey } from '../hooks/resize';
import { drawStrikes, measureStrike, Strikes, type StrikeLine } from '../marks/strikes';
import { Clock, EASES, RGB, struckRGB } from '../motion/clock';
import { Sheet } from './shared';

type Phase = 'pending' | 'play' | 'done';

/** One struck row's segments; refs land in store.current[i]. */
function RowStrikes({ lines, seed, store, i }: { lines: StrikeLine[]; seed: number; store: { current: SVGPathElement[][][] }; i: number }) {
  const refs = { current: [] as SVGPathElement[][] };
  store.current[i] = refs.current;
  return <Strikes lines={lines} seed={seed} refs={refs} className="mk mk--strike mk--thin" />;
}

// Is this you: the stet rows stand (green dots), the del rows are struck. A visitor sees at
// once which side of the pencil they are on.
export function Fit() {
  const fonts = useFontsReady();
  const rk = useResizeKey();
  const compact = useCompact();
  const section = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const stetText = useRef<(HTMLElement | null)[]>([]);
  const delText = useRef<(HTMLElement | null)[]>([]);
  const dots = useRef<(HTMLElement | null)[]>([]);
  const stetNotes = useRef<(HTMLElement | null)[]>([]);
  const delNotes = useRef<(HTMLElement | null)[]>([]);
  const strikes = useRef<SVGPathElement[][][]>([]);
  const tl = useRef<Clock | null>(null);
  const [lines, setLines] = useState<StrikeLine[][]>([]);
  const [phase, setPhase] = useState<Phase>(() => (isCalm() || DEBUG_DONE ? 'done' : 'pending'));
  const [seen, setSeen] = useState(false);

  useLayoutEffect(() => {
    const root = inner.current;
    if (!fonts || !root) return;
    setLines(
      delText.current.map((el) => {
        if (!el) return [];
        return measureStrike(Array.from(el.querySelectorAll<HTMLElement>('.w')), root, compact ? 3 : 4);
      }),
    );
    tl.current?.finish();
  }, [fonts, rk, compact]);

  useInViewOnce(section, 0.55, () => setSeen(true), { enabled: phase === 'pending' });

  useLayoutEffect(() => {
    if (phase !== 'pending' || !seen || !lines.length) return;
    if (isCalm()) {
      setPhase('done');
      return;
    }
    const t = new Clock();
    tl.current = t;
    const E = EASES;
    let at = 120;
    dots.current.forEach((d, i) => {
      if (d) {
        const ds = d.style;
        t.tween(at, 300, E.linear, (p) => {
          ds.clipPath = p >= 1 ? 'inset(0 0 0 0)' : `inset(0 ${(100 * (1 - p)).toFixed(2)}% 0 0)`;
        });
      }
      t.enter(stetNotes.current[i], at + 160, 240, E.outCubic, { x: -4, base: 'translate(0, -50%)' });
      at += 120;
    });
    at += 220;
    lines.forEach((ls, i) => {
      const w = ls.reduce((s, l) => s + (l.x1 - l.x0), 0);
      drawStrikes(t, strikes.current[i] ?? [], at, Math.min(300, Math.max(160, w * 0.7)));
      t.color(delText.current[i], at, 260, E.outCubic, RGB.ink, struckRGB(delText.current[i]));
      t.enter(delNotes.current[i], at + 140, 240, E.outCubic, { x: -4, base: 'translate(0, -50%)' });
      at += 120;
    });
    setPhase('play');
    t.onDone(() => setPhase('done'));
  }, [phase, seen, lines]);

  useEffect(() => {
    if (phase === 'done') tl.current?.release();
  }, [phase]);

  return (
    <Sheet
      id="fit"
      n={5}
      rot={compact ? 0 : -0.15}
      labelledBy="fit-h"
      next="paths"
      className={`proof proof--fit is-${phase}`}
      sectionRef={section}
      innerRef={inner}
    >
      <div className="sheet-body">
        <h2 id="fit-h" className="fit__h">
          <span className="margin" aria-hidden="true">
            <span className="margin__no">05</span>
          </span>
          {COPY.sheet05.headline}
        </h2>
        <div className="fit__cols">
          <ul className="fit__list fit__list--stet" aria-label={EXTRA.isFor}>
            {COPY.sheet05.stet.map((s, i) => (
              <li key={s} className="fit__row">
                <span
                  className="fit__text"
                  ref={(el) => {
                    stetText.current[i] = el;
                  }}
                >
                  {s}
                  <span
                    className="stet-dots"
                    aria-hidden="true"
                    ref={(el) => {
                      dots.current[i] = el;
                    }}
                  />
                </span>
                <span
                  className="fit__note fit__note--stet"
                  aria-hidden="true"
                  ref={(el) => {
                    stetNotes.current[i] = el;
                  }}
                >
                  {COPY.marks.stet}
                </span>
              </li>
            ))}
          </ul>
          <hr className="fit__rule" />
          <ul className="fit__list fit__list--del" aria-label={EXTRA.isNotFor}>
            {COPY.sheet05.del.map((s, i) => (
              <li key={s} className="fit__row">
                <del
                  className="fit__text"
                  ref={(el) => {
                    delText.current[i] = el;
                  }}
                >
                  {s.split(' ').map((w, j, a) => (
                    <span key={j}>
                      <span className="w">{w}</span>
                      {j < a.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </del>
                <span
                  className="fit__note fit__note--del"
                  aria-hidden="true"
                  ref={(el) => {
                    delNotes.current[i] = el;
                  }}
                >
                  {COPY.marks.del}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <svg className="marks" aria-hidden="true" focusable="false">
        {lines.map((ls, i) => (
          <RowStrikes key={i} lines={ls} seed={4787 + i * 7} store={strikes} i={i} />
        ))}
      </svg>
    </Sheet>
  );
}
