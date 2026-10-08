// A-101 · BRICKLAYING: plan stacked over perspective, on the spine (brief 3.4). Owner: A3.
// PLAN 01 (b40, 1:1) on the spine; the view marker 01-A / A-101 points down the sheet; the detail
// bubble opens DETAIL 1 (v0) in a circle; H2 (one line, the client's word unbroken: F-038), spec and
// the three bond words laid as two courses of running bond: solid bricks on 2 px joints, closed with
// half-bats, like the favicon's wall (F-080). Then the slide: PERSPECTIVE 01-A slides out from under
// the plan's caption and grows to the site's one letterboxed 2.39:1 hold (PerspectiveStage).
// DOM order: the text column (with the detail bubble) comes before the plan (with the view marker), so
// Tab reaches DETAIL 1 before 01-A (F-036); the grid places the plan left.
// Decoders (manifest A-101): el-c30, plan-b40, det-v0; at most two play.

import { useRef, type CSSProperties } from 'react';
import { SheetTag } from '../chrome/SheetTag';
import { ViewTitle } from '../chrome/ViewTitle';
import { LoopVideo } from '../system/LoopVideo';
import { videoManager } from '../system/VideoManager';
import { usePrefs } from '../system/prefs';
import { challengeBySheet } from '../content/challenges';
import { A101 } from '../content/copy/a100-a103';
import { ViewMarker } from '../marks/ViewMarker';
import { DetailBubble } from '../marks/DetailBubble';
import { usePrintIn } from '../marks/useInView';
import { PerspectiveStage } from './PerspectiveStage';
import '../marks/marks.css';
import '../marks/sheets/a101.css';

const CH = challengeBySheet('A-101')!;
const PERSP_ANCHOR = 'a101-persp';
const PERSP_TITLE = 'a101-persp-title';

export function A101Brick() {
  const rootRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<HTMLDivElement>(null);
  const printed = usePrintIn(rootRef);
  const { motion } = usePrefs();
  const [w1, w2, w3] = A101.bondWords;

  const composition = (
    <div className="sheet-inner a101-inner">
      <div className="a101-head">
        <SheetTag id="A-101" className="print-in" />
      </div>

      <div className="a101-grid">
        <div className="a101-side">
          <div className="a101-side-top">
            <DetailBubble
              className="a101-bubble"
              n={1}
              sheet="A-101"
              label={A101.detailLabel}
              phoneFlow
              panelClassName="a101-detail-panel"
              onOpenChange={(open) => {
                if (open && motion) videoManager.userPlay('det-v0');
                else if (!open) videoManager.pause('det-v0');
              }}
            >
              <ViewTitle id="a101-detail">
                <LoopVideo id="det-v0" label={A101.alt.detail} autoPlay={false} phoneId={null} />
              </ViewTitle>
            </DetailBubble>
            <span className="a101-bubble-label t-label print-in" aria-hidden="true">
              {A101.bubbleWord}
            </span>
            <span className="a101-num t-stencil t-bay-numeral print-in" aria-hidden="true">
              {CH.num}
            </span>
          </div>

          <div className="a101-h2-box">
            <h2 className="t-h2-challenge a101-h2 print-in">{A101.h2}</h2>
          </div>
          <p className="t-spec a101-spec print-in">{CH.spec}</p>

          {/* the bond words, laid as two courses of running bond: 2 / ½ · 1 · ½ */}
          <div className="a101-bond" role="list">
            <div className="a101-course" role="none">
              <span role="listitem" className="a101-brick t-beat print-in" style={{ ['--d' as string]: '0ms' } as CSSProperties}>
                {w1}
              </span>
              <span role="listitem" className="a101-brick t-beat print-in" style={{ ['--d' as string]: '120ms' } as CSSProperties}>
                {w2}
              </span>
            </div>
            <div className="a101-course a101-course--offset" role="none">
              <span className="a101-brick a101-brick--half print-in" aria-hidden="true" style={{ ['--d' as string]: '240ms' } as CSSProperties} />
              <span role="listitem" className="a101-brick t-beat print-in" style={{ ['--d' as string]: '240ms' } as CSSProperties}>
                {w3}
              </span>
              <span className="a101-brick a101-brick--half print-in" aria-hidden="true" style={{ ['--d' as string]: '240ms' } as CSSProperties} />
            </div>
          </div>
        </div>
        <div className="a101-plan">
          <ViewTitle id="a101-plan" className="a101-plan-view">
            <div ref={planRef}>
              <LoopVideo id="plan-b40" label={A101.alt.plan} />
            </div>
          </ViewTitle>
          <ViewMarker
            className="a101-marker"
            view={A101.viewMarker.view}
            sheet={A101.viewMarker.sheet}
            target={PERSP_ANCHOR}
            focusId={PERSP_TITLE}
            label={A101.viewMarker.label}
            angle={180}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="a101" data-printed={printed || undefined}>
      <PerspectiveStage
        preset="slide"
        originRef={planRef}
        videoKey="el-c30"
        bleed="full"
        anchorId={PERSP_ANCHOR}
        view={
          <ViewTitle id="a101-perspective" captionId={PERSP_TITLE} className="a101-persp">
            <LoopVideo id="el-c30" label={A101.alt.perspective} />
          </ViewTitle>
        }
      >
        {composition}
      </PerspectiveStage>
    </div>
  );
}

export default A101Brick;
