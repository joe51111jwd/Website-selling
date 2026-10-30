import { useRef } from 'react';
import { COPY } from '../copy';
import { Strikes } from '../marks/strikes';
import { EASES } from '../motion/clock';
import { DeleMark, Sheet, Words } from './shared';
import { useProof } from './useProof';

// The stair (desktop and tablet): viewBox 960 × 180. A base, a green rising leg, an ochre flat
// leg, a short red dip, and a landing that ends higher than the base.
const STAIR = {
  base: 'M0 170 L270 170',
  up: 'M270 170 L400 60',
  side: 'M400 60 L640 60',
  down: 'M640 60 L700 106',
  land: 'M700 106 L970 106',
  guide: 'M270 170 H970',
};
// Each sentence sits on its own leg, read left to right: centred above the base, right-aligned
// above-left of the rising leg, centred above the flat, left-aligned above-right of the dip.
// x / y are the anchor in the viewBox; the class sets which edge of the text is anchored.
const SENT = [
  { x: 135, y: 152, cls: 'base' },
  { x: 330, y: 85, cls: 'up' },
  { x: 520, y: 42, cls: 'side' },
  { x: 704, y: 74, cls: 'down' },
];
const LEAD = ['Up', 'Side', 'Down'];

function Sentence({ s, i }: { s: string; i: number }) {
  const [first, ...rest] = s.split(' ');
  const tone = i > 0 && LEAD.includes(first) ? ['', 'up', 'side', 'down'][i] : '';
  if (!tone) return <>{s}</>;
  return (
    <>
      <span className={`lead tone-${tone}`}>{first}</span> {rest.join(' ')}
    </>
  );
}

export function Growth() {
  const legRefs = useRef<(SVGPathElement | null)[]>([]);
  const sentRefs = useRef<(HTMLElement | null)[]>([]);
  const p = useProof({
    extra: (t, at) => {
      // Base, then each leg in 300 ms (ruled); each sentence appears as its leg finishes.
      const [base, up, side, down, land, guide] = legRefs.current;
      const steps: [SVGPathElement | null, number][] = [
        [base, 300],
        [up, 300],
        [side, 300],
        [down, 220],
      ];
      let s = at;
      steps.forEach(([path, d], i) => {
        t.draw(path, s, d);
        s += d;
        t.enter(sentRefs.current[i], s - 40, 240, EASES.outCubic, { y: 6 });
      });
      t.draw(land, s, 200);
      t.enter(guide, at, 400, EASES.outCubic, {});
    },
  });

  return (
    <Sheet
      id="growth"
      n={2}
      rot={p.compact ? 0 : 0.25}
      labelledBy="growth-h"
      next="people"
      className={`proof proof--growth is-${p.phase}`}
      sectionRef={p.section}
      innerRef={p.inner}
    >
      <div className="sheet-body">
        <p className="inherited">
          <span className="margin" aria-hidden="true">
            <span className="margin__no">02</span>
            <DeleMark pathRef={p.dele} />
          </span>
          <del ref={p.del}>
            <Words text={COPY.sheet02.inherited} refs={p.delWords} />
          </del>
        </p>
        <span className="caret-space" aria-hidden="true" />
        <h2 id="growth-h" className="correction correction--growth">
          <ins>
            <Words text={COPY.sheet02.corrected} refs={p.corrWords} className="w wi" brD={[2]} />
          </ins>
        </h2>

        <div className="stair">
          <svg className="stair__svg" viewBox="0 0 960 180" aria-hidden="true" focusable="false" overflow="visible">
            {(['base', 'up', 'side', 'down', 'land', 'guide'] as const).map((k, i) => (
              <path
                key={k}
                className={`stair__leg stair__leg--${k}`}
                d={STAIR[k]}
                ref={(el) => {
                  legRefs.current[i] = el;
                }}
              />
            ))}
          </svg>
          <ol className="stair__list">
            {COPY.sheet02.stair.map((s, i) => (
              <li
                key={i}
                className={`stair__s stair__s--${SENT[i].cls}`}
                style={{ left: `${(SENT[i].x / 960) * 100}%`, top: `${(SENT[i].y / 180) * 100}%` }}
              >
                <span
                  className="stair__in"
                  ref={(el) => {
                    sentRefs.current[i] = el;
                  }}
                >
                <span className={`stair__glyph stair__glyph--${SENT[i].cls}`} aria-hidden="true">
                  <svg viewBox="0 0 24 14" focusable="false">
                    <path d={['M1 7 H23', 'M2 13 L22 1', 'M1 7 H23', 'M2,3L12,3L20,11H23'][i]} />
                  </svg>
                </span>
                <span className="stair__text">
                  <Sentence s={s} i={i} />
                </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <svg className="marks" aria-hidden="true" focusable="false">
        <Strikes lines={p.lines} seed={1426} refs={p.strikes} />
        <path className="mk mk--caret" d={p.caretPath} ref={p.caret} />
      </svg>
    </Sheet>
  );
}
