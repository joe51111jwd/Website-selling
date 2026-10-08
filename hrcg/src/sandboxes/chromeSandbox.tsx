// A1's own sandbox: ?sandbox=chrome&chrome=1 — chrome over a tall test page with every system
// primitive (view titles, sheet tags, course marks, a stage progress readout). Owner: A1.

import { useRef } from 'react';
import { useTransform, motion } from 'motion/react';
import { ViewTitle } from '../chrome/ViewTitle';
import { SheetTag } from '../chrome/SheetTag';
import { CourseMark } from '../chrome/CourseMark';
import { useStageProgress } from '../system/useStageProgress';
import { usePrefs } from '../system/prefs';
import { useTier } from '../system/tier';
import { SHEETS } from '../content/sheets';

function StageDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const p = useStageProgress(ref);
  const width = useTransform(p, (v) => `${(v * 100).toFixed(1)}%`);
  return (
    <div ref={ref} style={{ height: '220vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100svh', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: '60%', borderBottom: '1px solid var(--pencil)' }}>
          <motion.div style={{ height: 2, background: 'var(--chalk-blue)', width }} />
          <p className="t-label">STAGE PROGRESS</p>
        </div>
      </div>
    </div>
  );
}

export default function ChromeSandbox() {
  const { motion: m } = usePrefs();
  const tier = useTier();
  return (
    <div className="sandbox-chrome">
      {SHEETS.map((s) => (
        <section key={s.id} id={s.anchor} data-sheet={s.id} data-ground={s.ground} className="sheet" style={{ minHeight: '90vh' }}>
          <div className="sheet-inner">
            <SheetTag id={s.id} />
            <h2 className="t-h2-statement" tabIndex={-1}>
              {s.strip.split(' · ')[1]}
            </h2>
            <p className="t-body">
              motion {String(m)} · gl {String(tier.gl)} · lite {String(tier.lite)}
            </p>
            {s.challenge ? <CourseMark current={s.challenge} width={210} /> : null}
            {s.id === 'A-101' ? (
              <ViewTitle id="a101-plan">
                <div style={{ aspectRatio: '16 / 9', background: 'var(--slab)' }} />
              </ViewTitle>
            ) : null}
            {s.id === 'A-105' ? <ViewTitle id="a105-section" /> : null}
            {s.id === 'A-100' ? <StageDemo /> : null}
          </div>
        </section>
      ))}
    </div>
  );
}
