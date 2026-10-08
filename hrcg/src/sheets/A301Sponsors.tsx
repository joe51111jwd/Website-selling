// A-301 · FOR SPONSORS (brief 3.11), on gypsum paper: five material crops with keynote numerals,
// the keynotes, and the kit composer. Materials replace the robot as the hero. Owner: A6.

import { useMemo, useState } from 'react';
import './conversion/conversion.css';
import { SheetTag } from '../chrome/SheetTag';
import { SPONSORS } from '../content/copy/conversion';
import { Keynotes, KitComposer, Materials } from './conversion/A301Parts';
import { usePrintIn } from './conversion/usePrintIn';

export function A301Sponsors() {
  const [active, setActive] = useState<number | null>(null);
  const lit = useMemo(
    () => new Set<number>(active === null ? [] : SPONSORS.materials[active]!.keynotes),
    [active],
  );
  const printIn = usePrintIn('A-301');
  return (
    <div className="conv conv--a301">
      <div className="sheet-inner conv-head">
        <SheetTag id="A-301" />
      </div>
      <div className="sheet-inner">
        <Materials active={active} setActive={setActive} />
        <div className="a301-grid">
          <div className="a301-main">
            <h2 className="conv-h2 t-h2-statement t-upper" id="a301-h2">
              {SPONSORS.h2}
            </h2>
            <p className={`a301-body t-lead ${printIn}`}>{SPONSORS.body}</p>
          </div>
          <div className="a301-keys">
            <Keynotes lit={lit} />
          </div>
          <div className="a301-form">
            <KitComposer labelledBy="a301-h2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default A301Sponsors;
