// A-100 · THE FIVE BAYS (brief 3.3). Owner: A3.
//
//   <A100Bays />                                        // App fallback (= static)
//   <A100Bays mode="stage" arenaRef={arenaRef} />       // A2's cover stage (requests/A2-1.md)
//
// Renders the sheet's content only (no section / anchor: App or CoverStage owns #a-100). One <h2>.
// Sheet tag on the spine, the row of five (ArenaPlan), the plan's legend directly under it (the legend
// teaches the drawing language once), then the statement H2 with the body set against its last line.
// Stage mode: A2 prints the text in through [data-print] on its `.cv-a100` ancestor (every `.a100-print`).
// Static mode draws its own spine segment (A-100 sits outside .set-body, which draws the rest).

import type { Ref } from 'react';
import { SheetTag } from '../chrome/SheetTag';
import { A100 } from '../content/copy/a100-a103';
import { ControlX } from '../marks/ControlX';
import { cloudPath, pointerPath } from '../marks/geometry';
import { ArenaPlan, type ArenaPlanHandle } from './ArenaPlan';
import '../marks/marks.css';
import '../marks/sheets/a100.css';

export interface A100BaysProps {
  mode?: 'static' | 'stage';
  arenaRef?: Ref<ArenaPlanHandle>;
}

/** The seven legend symbols, drawn at legend size (aria-hidden; the label is the content). */
function LegendSymbol({ k }: { k: number }) {
  const common = { className: 'mk a100-sym', 'aria-hidden': true as const, focusable: 'false' as const };
  switch (k) {
    case 0: // BAY
      return (
        <svg {...common} viewBox="0 0 28 18" width={28} height={18}>
          <rect x="6.5" y="1.5" width="15" height="15" fill="none" stroke="var(--bay-yellow)" strokeWidth="1.25" />
        </svg>
      );
    case 1: // CONTROL POINT
      return (
        <span className="a100-sym a100-sym--x">
          <ControlX size={15} seed={21} />
        </span>
      );
    case 2: // CHALK LINE
      return (
        <svg {...common} viewBox="0 0 28 18" width={28} height={18}>
          <line x1="0" y1="9" x2="28" y2="9" stroke="var(--chalk-blue)" strokeWidth="1.5" />
        </svg>
      );
    case 3: // VIEW MARKER
      return (
        <svg {...common} viewBox="0 0 28 22" width={28} height={22}>
          <path className="mk-fill" d={pointerPath(14, 9, 7, 12, 180)} />
          <circle className="mk-face" cx="14" cy="9" r="7" />
          <circle className="mk-line" cx="14" cy="9" r="7" />
          <line className="mk-line" x1="7" y1="9" x2="21" y2="9" />
        </svg>
      );
    case 4: // DETAIL
      return (
        <svg {...common} viewBox="0 0 28 18" width={28} height={18}>
          <circle className="mk-line" cx="14" cy="9" r="7.5" />
          <line className="mk-line" x1="6.5" y1="9.5" x2="21.5" y2="9.5" />
        </svg>
      );
    case 5: // SECTION CUT
      return (
        <svg {...common} viewBox="0 0 44 18" width={44} height={18}>
          <line x1="10" y1="9" x2="34" y2="9" stroke="var(--chalk-blue)" strokeWidth="1.25" strokeDasharray="6 2 1.5 2" />
          <path className="mk-fill" d={pointerPath(8, 9, 4, 7.5, 270)} />
          <path className="mk-fill" d={pointerPath(36, 9, 4, 7.5, 90)} />
          <circle className="mk-face" cx="8" cy="9" r="4" />
          <circle className="mk-line" cx="8" cy="9" r="4" />
          <circle className="mk-face" cx="36" cy="9" r="4" />
          <circle className="mk-line" cx="36" cy="9" r="4" />
        </svg>
      );
    default: // HOLD
      return (
        <svg {...common} viewBox="-3 -3 34 20" width={34} height={20}>
          <path d={cloudPath(28, 14, 8, { seed: 5, bulge: 0.38 })} fill="none" stroke="var(--marking-orange)" strokeWidth="1.25" />
        </svg>
      );
  }
}

export function A100Bays({ mode = 'static', arenaRef }: A100BaysProps) {
  return (
    <div className="a100" data-mode={mode}>
      {mode === 'static' ? <span className="spine-line a100-spine" aria-hidden="true" /> : null}
      <div className="sheet-inner a100-inner">
        <SheetTag id="A-100" className="a100-tag a100-print" />
        <ArenaPlan ref={arenaRef} mode={mode} />

        <div className="a100-legend a100-print">
          <p className="a100-legend-title t-label">{A100.legendTitle}</p>
          <ul className="a100-legend-items">
            {A100.legend.map((label, k) => (
              <li key={label} className="a100-legend-item t-label">
                <LegendSymbol k={k} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="a100-text">
          <h2 className="t-h2-statement a100-h2 a100-print">{A100.h2}</h2>
          <p className="t-body a100-body a100-print">{A100.body}</p>
        </div>
      </div>
    </div>
  );
}

export default A100Bays;
