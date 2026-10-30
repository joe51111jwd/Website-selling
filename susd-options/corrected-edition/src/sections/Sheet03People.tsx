import { useLayoutEffect, useRef, useState } from 'react';
import { COPY } from '../copy';
import { boxWithin, designUnit } from '../marks/measure';
import { Strikes } from '../marks/strikes';
import { EASES } from '../motion/clock';
import { DeleMark, Sheet, Words } from './shared';
import { useProof } from './useProof';

// COULD: the first sheet to cut. More people = more coordination cost. The editor glosses
// "absorbed" in the margin (a ruled leader runs to the word), and the pathway arithmetic
// (n(n-1)/2) sits under the support line, where a reader actually reads it.
export function People() {
  const support = useRef<HTMLParagraphElement>(null);
  const calc = useRef<HTMLDivElement>(null);
  const underline = useRef<SVGPathElement>(null);
  const gloss = useRef<HTMLParagraphElement>(null);
  const leader = useRef<SVGPathElement>(null);
  const [lead, setLead] = useState<{ y: number; x0: number; x1: number } | null>(null);
  const p = useProof({
    extra: (t, at) => {
      t.enter(gloss.current, at - 120, 300, EASES.outCubic, { x: -4 });
      t.draw(leader.current, at - 160, 200);
      t.enter(support.current, at, 360, EASES.outCubic, { y: 8 });
      calc.current?.querySelectorAll<HTMLElement>('.calc__row').forEach((row, i) => t.enter(row, at + 200 + i * 140, 260, EASES.outCubic, { y: 4 }));
      t.draw(underline.current, at + 640, 220);
    },
  });

  // The gloss sits in the right margin column, level with "(unless absorbed)".
  useLayoutEffect(() => {
    const root = p.inner.current;
    const words = p.corrWords.current;
    if (!p.fonts || !root || !words.length || p.compact) {
      setLead(null);
      return;
    }
    const w = words[words.length - 1];
    const b = boxWithin(w, root);
    const u = designUnit();
    const col = 1000 * u;
    setLead({ y: b.y + b.h * 0.58, x0: b.x + b.w + 16 * u, x1: col - 12 * u });
  }, [p.fonts, p.rk, p.compact, p.inner, p.corrWords]);

  return (
    <Sheet
      id="people"
      n={3}
      rot={p.compact ? 0 : -0.2}
      labelledBy="people-h"
      next="equation"
      className={`proof proof--people is-${p.phase}`}
      sectionRef={p.section}
      innerRef={p.inner}
    >
      <div className="sheet-body">
        <p className="inherited">
          <span className="margin" aria-hidden="true">
            <span className="margin__no">03</span>
            <DeleMark pathRef={p.dele} />
          </span>
          <del ref={p.del}>
            <Words text={COPY.sheet03.inherited} refs={p.delWords} />
          </del>
        </p>
        <span className="caret-space" aria-hidden="true" />
        <h2 id="people-h" className="correction correction--people">
          <ins>
            <Words text={COPY.sheet03.corrected} refs={p.corrWords} className="w wi" brD={[3, 5]} />
          </ins>
        </h2>
        <p className="gloss" ref={gloss} style={lead ? { top: `${lead.y}px` } : undefined}>
          {COPY.sheet03.gloss}
        </p>
        <p className="support" ref={support}>
          {COPY.sheet03.support}
        </p>
        <div className="calc" ref={calc} aria-label={COPY.sheet03.margin.join(', ')} role="note">
          {COPY.sheet03.margin.map((m, i) => (
            <div key={i} className={`calc__row${i === 1 ? ' calc__row--key' : ''}`} aria-hidden="true">
              {m}
              {i === 1 && (
                <svg className="calc__ul" viewBox="0 0 100 6" preserveAspectRatio="none" focusable="false">
                  <path ref={underline} d="M1 3.2 L52 2.7 L99 3.3" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
      <svg className="marks" aria-hidden="true" focusable="false">
        <Strikes lines={p.lines} seed={692} refs={p.strikes} />
        <path className="mk mk--caret" d={p.caretPath} ref={p.caret} />
        {lead && <path className="mk mk--leader" d={`M${lead.x0.toFixed(1)},${lead.y.toFixed(1)} L${lead.x1.toFixed(1)},${(lead.y - 0.6).toFixed(1)}`} ref={leader} />}
      </svg>
    </Sheet>
  );
}
