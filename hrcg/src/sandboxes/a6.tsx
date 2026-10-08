// A6 temporary sandbox (CONTRACT §2): A-300, A-301 and A-900 in App's own section markup, so they
// can be checked while other sheets are mid-edit. Dev server only. Delete before hand-off.
// http://127.0.0.1:5300/?sandbox=a6&chrome=1

import type { CSSProperties } from 'react';
import { sheetById, type SheetId } from '../content/sheets';
import A300Teams from '../sheets/A300Teams';
import A301Sponsors from '../sheets/A301Sponsors';
import A900Notes from '../sheets/A900Notes';

const SHEETS: Array<[SheetId, () => React.JSX.Element]> = [
  ['A-300', A300Teams],
  ['A-301', A301Sponsors],
  ['A-900', A900Notes],
];

export default function A6Sandbox() {
  return (
    <div className="set-body" style={{ paddingTop: 'var(--s-11)' }}>
      {SHEETS.map(([id, C]) => {
        const s = sheetById(id)!;
        return (
          <section
            key={id}
            id={s.anchor}
            className={`sheet sheet--${s.anchor}`}
            data-sheet={id}
            data-ground={s.ground}
            style={{ ['--sheet-vh' as string]: s.scrollVh } as CSSProperties}
          >
            <C />
          </section>
        );
      })}
    </div>
  );
}
