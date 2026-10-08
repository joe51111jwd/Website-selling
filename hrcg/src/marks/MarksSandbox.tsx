// Sandbox: every drafting mark, on the slab and on gypsum (dev only): ?sandbox=marks/MarksSandbox
// Owner: A3. Not part of the shipped page (the sandbox router lazy-loads it on the dev server only).

import { useEffect, useState, type ReactNode } from 'react';
import { ControlX } from './ControlX';
import { ViewMarker } from './ViewMarker';
import { DetailBubble } from './DetailBubble';
import { SectionCut } from './SectionCut';
import { GridBubble } from './GridBubble';
import { HoldCloud } from './HoldCloud';
import { NorthArrow } from './NorthArrow';
import { AngleArc } from './AngleArc';
import { ChalkBox } from './ChalkBox';
import { ViewTitle } from '../chrome/ViewTitle';
import { LoopVideo } from '../system/LoopVideo';
import { videoManager } from '../system/VideoManager';

function Row({ name, use, children }: { name: string; use: string; children: ReactNode }) {
  return (
    <div className="mks-row">
      <div className="mks-name">
        <p className="t-label">{name}</p>
        <p className="mks-use">{use}</p>
      </div>
      <div className="mks-cells">{children}</div>
    </div>
  );
}

const CSS = `
.mks { padding: 48px 72px 160px; display: grid; gap: 0; overflow-x: clip; }
.mks-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid var(--rule); padding-bottom: 8px; margin-bottom: 8px; }
.mks-row { display: grid; grid-template-columns: 300px 1fr; gap: 24px; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--line); }
.mks-use { font: 400 13px/18px var(--font-text); color: var(--fg-2); margin-top: 6px; max-width: 36ch; }
.mks-cells { display: flex; flex-wrap: wrap; gap: 40px; align-items: center; }
.mks-paper { background: var(--gypsum); color: var(--gypsum-ink); padding: 12px 20px; display: flex; gap: 28px; align-items: center; }
.mks-target { margin-top: 120px; }
.mks-btn { margin-left: 12px; }
.mks-stack { position: relative; width: 380px; height: 380px; }
.mks-stack > svg { position: absolute; left: 0; top: 0; }
@media (max-width: 767px) { .mks { padding: 24px 16px 120px; } .mks-row { grid-template-columns: 1fr; } .mks-stack { transform: scale(.8); transform-origin: 0 0; height: 304px; } }
`;

export default function MarksSandbox() {
  const [drawn, setDrawn] = useState(false);
  const [lift, setLift] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setDrawn(true), 400);
    return () => window.clearTimeout(t);
  }, []);
  const replay = () => {
    setDrawn(false);
    window.setTimeout(() => setDrawn(true), 60);
  };

  return (
    <div className="mks" data-ground="slab">
      <style>{CSS}</style>
      <div className="mks-head">
        <p className="t-label">MARKS · DRAFTING SYMBOLS · 1.25 PX · NTS</p>
        <button type="button" className="cell-button" onClick={replay}>
          Replay draw-on
        </button>
      </div>

      <Row name="ControlX" use="Sprayed control point at a line end. stamp + stamped animate it in.">
        <ControlX size={18} />
        <ControlX size={28} seed={3} />
        <ControlX size={44} seed={9} title="Control point" />
        <ControlX size={28} seed={5} stamp stamped={drawn} delay={120} />
        <span className="mks-paper" data-ground="gypsum">
          <ControlX size={28} seed={4} />
        </span>
      </Row>

      <Row name="ViewMarker" use="Link to a view on this sheet; scrolls, then focuses the view title.">
        <ViewMarker view="01-A" sheet="A-101" target="mks-view" focusId="mks-view-title" label="go to perspective, concept film of bricklaying" />
        <ViewMarker view="03-A" sheet="A-103" target="mks-view" label="Go to the sample view" angle={90} />
        <span className="mks-paper" data-ground="gypsum">
          <ViewMarker view="02-A" sheet="A-102" target="mks-view" label="Go to the sample view" angle={180} />
        </span>
      </Row>

      <Row name="DetailBubble" use="Button that opens its detail in a circle (clip-path), Esc or a second click closes it.">
        <DetailBubble
          n={1}
          sheet="A-101"
          label="concept film of a robot hand pressing a brick into mortar"
          panelStyle={{ left: 64, top: -120, width: 'min(36vw, 420px)' }}
          onOpenChange={(open) => (open ? videoManager.userPlay('det-v0') : videoManager.pause('det-v0'))}
        >
          <ViewTitle id="a101-detail">
            <LoopVideo id="det-v0" autoPlay={false} phoneId={null} />
          </ViewTitle>
        </DetailBubble>
        <DetailBubble n={3} sheet="A-103" static title="Detail 3 on sheet A-103" />
        <span className="mks-paper" data-ground="gypsum">
          <DetailBubble n={5} sheet="A-105" static />
        </span>
      </Row>

      <Row name="GridBubble" use="Gridline bubble, 28 px, stencil numeral. Draws on (DRAW 400 ms, stagger 120 ms).">
        {['01', '02', '03', '04', '05'].map((n, i) => (
          <GridBubble key={n} n={n} leader={18} drawn={drawn} delay={i * 120} />
        ))}
        <GridBubble n="03" href="#mks-view" label="Go to the sample view" />
      </Row>

      <Row name="SectionCut" use="Section A–A symbol for the A-105 slider (A4 adds role=slider).">
        <SectionCut length={220} />
        <SectionCut length={160} arrows="view" look="down" />
        <span className="mks-paper" data-ground="gypsum">
          <SectionCut length={140} />
        </span>
      </Row>

      <Row name="HoldCloud" use="Scalloped cloud plus tag: the status of date and venue. lift drives the one allowed shadow.">
        <HoldCloud width={340} height={64} lift={lift}>
          <span className="t-label" style={{ display: 'block', padding: '24px 22px' }}>
            VENUE: HOLD — Venue to be announced on this site.
          </span>
        </HoldCloud>
        <HoldCloud width={120} height={44} flat title="Hold" />
        <label className="t-label" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          LIFT
          <input type="range" min={0} max={1} step={0.05} value={lift} onChange={(e) => setLift(+e.target.value)} />
        </label>
        <span className="mks-paper" data-ground="gypsum">
          <HoldCloud width={160} height={48} flat />
        </span>
      </Row>

      <Row name="NorthArrow + AngleArc" use="A-200 only. Two arrows on one origin, the arc between them.">
        <div className="mks-stack">
          <NorthArrow angle={0} length={120} label="TRUE NORTH" drawn={drawn} />
          <NorthArrow angle={29} length={120} label="THE 1811 GRID" drawn={drawn} delay={300} />
          <AngleArc from={0} to={29} radius={86} extent={190} label="ABOUT 29°" drawn={drawn} delay={700} />
        </div>
      </Row>

      <Row name="ChalkBox" use="The hero string's anchor; A2 wraps it in the 44 px phone handle.">
        <ChalkBox size={20} />
        <ChalkBox size={32} side="right" />
        <ChalkBox size={44} title="Chalk box" />
        <span className="mks-paper" data-ground="gypsum">
          <ChalkBox size={28} />
        </span>
      </Row>

      <div id="mks-view" className="mks-target">
        <ViewTitle view="PERSPECTIVE 01-A" kind="film" captionId="mks-view-title">
          <div style={{ aspectRatio: '2.39 / 1', background: 'var(--slab)' }} />
        </ViewTitle>
      </div>
    </div>
  );
}
