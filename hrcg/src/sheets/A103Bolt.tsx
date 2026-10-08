// A-103 · BOLTED ASSEMBLY: the detail circle (brief 3.6). Owner: A3.
// The only round composition: DETAIL 3 (N03, the wrench runs the nut down) as a large circle, centred
// and radial, with the H2 beside it and only the tip of its last letter tucked behind the circle's rim
// (type behind a drawing frame, not behind a subject; DIR-1: a bite, never the words), its detail
// reference 3 / A-103 on a leader at the circle's shoulder, the spec and beats under the H2 and PLAN 03
// (b42) at the circle's foot, clear of it. Then the iris (PerspectiveStage): everything but the circle
// prints out, the circle swells, dissolves to PERSPECTIVE 03-A (c32) and opens to its native 16:9 on
// the spine, and holds. No copy or drawing names the components (brief 3.6 rule).
// Landing (F-007): data-land="0" while pinned; the stage holds the composed detail for 20vh after it.
// Decoders (manifest A-103): det-n03, el-c32, plan-b42.

import { useRef, type CSSProperties } from 'react';
import { SheetTag } from '../chrome/SheetTag';
import { ViewTitle } from '../chrome/ViewTitle';
import { LoopVideo } from '../system/LoopVideo';
import { challengeBySheet } from '../content/challenges';
import { A103 } from '../content/copy/a100-a103';
import { DetailBubble } from '../marks/DetailBubble';
import { usePrintIn } from '../marks/useInView';
import { PerspectiveStage } from './PerspectiveStage';
import '../marks/marks.css';
import '../marks/sheets/a103.css';

const CH = challengeBySheet('A-103')!;

export function A103Bolt() {
  const rootRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const printed = usePrintIn(rootRef);

  const composition = (
    <div className="sheet-inner a103-inner">
      <div className="a103-head" data-pst-fade="">
        <SheetTag id="A-103" className="print-in" />
      </div>

      <div className="a103-comp">
        {/* everything that prints out before the iris opens (under the circle in z) */}
        <div className="a103-fade" data-pst-fade="">
          <h2 className="t-h2-challenge a103-h2 print-in">
            {A103.h2.split(' ').map((w, i) => (
              <span key={w} className="a103-h2-line">
                {i ? ' ' : ''}
                {w}
              </span>
            ))}
          </h2>
          <span className="a103-num t-stencil t-bay-numeral print-in" aria-hidden="true">
            {CH.num}
          </span>

          <div className="a103-text">
            <p className="t-spec a103-spec print-in">{CH.spec}</p>
            <p className="a103-beats t-beat print-in" style={{ ['--d' as string]: '120ms' } as CSSProperties}>
              {A103.beats.map((b, i) => (
                <span key={b}>
                  {i ? <span className="a103-dot" aria-hidden="true"> · </span> : null}
                  {b}
                </span>
              ))}
            </p>
          </div>

          <ViewTitle id="a103-plan" className="a103-plan">
            <LoopVideo id="plan-b42" label={A103.alt.plan} />
          </ViewTitle>
        </div>

        <div className="a103-detail">
          <div className="a103-circle">
            <ViewTitle id="a103-detail" className="a103-circle-view">
              <div ref={circleRef}>
                <LoopVideo id="det-n03" label={A103.alt.detail} phoneId={null} />
              </div>
            </ViewTitle>
          </div>
          {/* detail reference on a leader at the circle's shoulder */}
          <div className="a103-callout" data-pst-fade="" aria-hidden="true">
            <svg className="a103-leader mk" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
              <line className="mk-line" x1="0" y1="100" x2="100" y2="0" />
            </svg>
            <DetailBubble className="a103-ref" n={3} sheet="A-103" static size={48} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="a103" data-printed={printed || undefined}>
      <PerspectiveStage
        preset="iris"
        originRef={circleRef}
        videoKey="el-c32"
        bleed="content"
        aspect={16 / 9}
        anchorId="a103-persp"
        pinMinWidth={1024}
        landVh={0}
        view={
          <ViewTitle id="a103-perspective" captionId="a103-persp-title" className="a103-persp">
            <LoopVideo id="el-c32" label={A103.alt.perspective} phoneId={null} />
          </ViewTitle>
        }
      >
        {composition}
      </PerspectiveStage>
    </div>
  );
}

export default A103Bolt;
