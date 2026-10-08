// A-102 · DRYWALL INSTALLATION: the hung panel (brief 3.5). Owner: A3.
// PERSPECTIVE 02-A (c31, 4:5, head out of frame) on the spine with PLAN 02 (b41) under it; beside them
// a 1:2 gypsum panel, the material itself (the first value flip). The panel is drawn as a 4 x 8 board:
// stud lines behind it as hidden (dashed) lines at 16 in. centres, screws on the studs at 12 in. rows,
// and the type set on the board's own grid: H2 and spec in the top courses, the four beats sitting on
// the screw rows between two screws ("• POSITIONED •"). Prints in; no pin, no entrance.
// Decoders (manifest A-102): el-c31, plan-b41.

import { useRef, type CSSProperties } from 'react';
import { SheetTag } from '../chrome/SheetTag';
import { ViewTitle } from '../chrome/ViewTitle';
import { LoopVideo } from '../system/LoopVideo';
import { challengeBySheet } from '../content/challenges';
import { A102 } from '../content/copy/a100-a103';
import { usePrintIn } from '../marks/useInView';
import '../marks/marks.css';
import '../marks/sheets/a102.css';

const CH = challengeBySheet('A-102')!;

// Board geometry in inches: 48 x 96, studs at 0 / 16 / 32 / 48, screw rows every 12 in.
const W = 48;
const H = 96;
const STUDS = [0, 16, 32, 48];
const EDGE = 0.375; // perimeter screws 3/8 in. in from the edge
const ROWS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
/** Beat placement: [row, bay] (bays 1..3 between stud lines) */
const BEAT_AT: Array<[number, number]> = [
  [4, 1],
  [5, 2],
  [6, 3],
  [7, 2],
];
/** Field screws hidden behind the H2's two lines */
const UNDER_TYPE = new Set(['1:16', '1:32']);

function screwX(stud: number) {
  return stud === 0 ? EDGE : stud === W ? W - EDGE : stud;
}
function rowY(row: number) {
  return row === 0 ? EDGE : row === 8 ? H - EDGE : row * 12;
}

function Board() {
  const screws: Array<[number, number, number]> = [];
  for (const row of ROWS) {
    for (const stud of STUDS) {
      if (UNDER_TYPE.has(`${row}:${stud}`)) continue;
      screws.push([screwX(stud), rowY(row), row]);
    }
  }
  return (
    <svg className="a102-board" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      {/* tapered long edges */}
      <line className="a102-taper" x1="2" y1="0" x2="2" y2={H} />
      <line className="a102-taper" x1={W - 2} y1="0" x2={W - 2} y2={H} />
      {/* studs behind the board: hidden lines */}
      {STUDS.slice(1, -1).map((x) => (
        <line key={x} className="a102-stud" x1={x} y1="0" x2={x} y2={H} />
      ))}
      <g className="a102-screws">
        {screws.map(([x, y, row]) => (
          <circle
            key={`${x}-${y}`}
            className="a102-screw print-in"
            data-row={row}
            data-field={x > EDGE && x < W - EDGE ? '' : undefined}
            cx={x}
            cy={y}
            r="0.19"
            style={{ ['--d' as string]: `${120 + row * 40}ms` } as CSSProperties}
          />
        ))}
      </g>
    </svg>
  );
}

export function A102Drywall() {
  const rootRef = useRef<HTMLDivElement>(null);
  const printed = usePrintIn(rootRef);

  return (
    <div ref={rootRef} className="a102" data-printed={printed || undefined}>
      <div className="sheet-inner a102-inner">
        <SheetTag id="A-102" className="a102-tag print-in" />

        <div className="a102-grid">
          <div className="a102-views">
            <ViewTitle id="a102-perspective" className="a102-persp">
              <LoopVideo id="el-c31" label={A102.alt.perspective} phoneId={null} />
            </ViewTitle>
            <ViewTitle id="a102-plan" className="a102-plan">
              <LoopVideo id="plan-b41" label={A102.alt.plan} />
            </ViewTitle>
          </div>

          <div className="a102-panel print-in" data-ground="gypsum">
            <Board />
            <div className="a102-type">
              <h2 className="t-h2-challenge a102-h2">{A102.h2}</h2>
              <p className="t-spec a102-spec">{CH.spec}</p>
            </div>
            <ul className="a102-beats">
              {A102.beats.map((b, i) => {
                const [row, bay] = BEAT_AT[i]!;
                return (
                  <li
                    key={b}
                    className="a102-beat t-beat print-in"
                    style={
                      {
                        '--row': row,
                        '--bay': bay,
                        '--d': `${360 + i * 120}ms`,
                      } as CSSProperties
                    }
                  >
                    {b}
                  </li>
                );
              })}
            </ul>
            <span className="a102-num t-stencil t-bay-numeral" aria-hidden="true">
              {CH.num}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default A102Drywall;
