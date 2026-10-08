// A1's VideoManager test page: ?sandbox=videoSandbox&chrome=1&debug=video
// Sheets with more videos than decoders, so the ≤2 rule and priority lists are visible. Owner: A1.

import { LoopVideo } from '../system/LoopVideo';
import { Picture } from '../system/Picture';
import { ViewTitle } from '../chrome/ViewTitle';
import { SheetTag } from '../chrome/SheetTag';

const ROWS: Array<{ sheet: 'A-101' | 'A-103' | 'A-105'; ids: string[] }> = [
  { sheet: 'A-101', ids: ['plan-b40', 'el-c30', 'det-v0'] },
  { sheet: 'A-103', ids: ['plan-b42', 'el-c32', 'det-n03'] },
  { sheet: 'A-105', ids: ['plan-b44', 'det-n04', 'plan-b43'] },
];

export default function VideoSandbox() {
  return (
    <div>
      {ROWS.map((r) => (
        <section key={r.sheet} id={r.sheet.toLowerCase()} data-sheet={r.sheet} className="sheet" style={{ minHeight: '100vh', paddingTop: 96 }}>
          <div className="sheet-inner" style={{ display: 'grid', gap: 24 }}>
            <SheetTag id={r.sheet} />
            <h2 className="t-h2-statement t-upper">{r.sheet}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24 }}>
              {r.ids.map((id) => (
                <ViewTitle key={id} media={id}>
                  <LoopVideo id={id} />
                </ViewTitle>
              ))}
            </div>
          </div>
        </section>
      ))}
      <section data-sheet="A-301" data-ground="gypsum" className="sheet" style={{ minHeight: '60vh', padding: '96px 0' }}>
        <div className="sheet-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24 }}>
          {['mat-1', 'mat-2', 'plan-b44-260'].map((id) => (
            <ViewTitle key={id} media={id}>
              <Picture id={id} />
            </ViewTitle>
          ))}
          <ViewTitle media="no-such-video">
            <LoopVideo id="no-such-video" />
          </ViewTitle>
        </div>
      </section>
    </div>
  );
}
