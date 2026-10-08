// A4's temporary sandbox (CONTRACT §2): A-104, A-105 and A-200 mounted exactly as App mounts them
// (section wrapper with data-sheet, data-ground and --sheet-vh), with spacers around them.
// http://127.0.0.1:5300/?sandbox=a4&chrome=1   (&only=a-200 to mount one sheet). Owner: A4.

import type { CSSProperties, ComponentType } from 'react';
import { sheetById, type SheetId } from '../content/sheets';
const mods = import.meta.glob<{ default: ComponentType }>(
  ['../sheets/A104Pipe.tsx', '../sheets/A105Layout.tsx', '../sheets/A200Context.tsx'],
  { eager: true },
);
const SHEETS = (
  [
    ['A-104', '../sheets/A104Pipe.tsx'],
    ['A-105', '../sheets/A105Layout.tsx'],
    ['A-200', '../sheets/A200Context.tsx'],
  ] as Array<[SheetId, string]>
)
  .filter(([, f]) => mods[f])
  .map(([id, f]) => [id, mods[f]!.default] as [SheetId, ComponentType]);

export default function A4Sandbox() {
  const only = new URLSearchParams(window.location.search).get('only');
  return (
    <div className="set-body">
      <div style={{ height: '60vh' }} />
      {SHEETS.filter(([id]) => !only || sheetById(id)!.anchor === only).map(([id, C]) => {
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
      <div style={{ height: '100vh' }} />
    </div>
  );
}
