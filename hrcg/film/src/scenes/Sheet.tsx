// One challenge sheet, 3.0 s: PLAN (0.8 s, the bay loop under its view title) → hard cut →
// PERSPECTIVE (2.2 s) with the roll-call verb as the super.
import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { Clip } from '../components/Clip';
import { Framed } from '../components/Framed';
import { Ground } from '../components/Ground';
import { Lbl } from '../components/Lbl';
import { ViewTitle } from '../components/ViewTitle';
import { C, display, stencil } from '../theme';
import { SHEETS, TL, type Format } from '../timeline';
import { CHROME } from '../layout';
import { PERSP, PERSP_TITLES, PLAN_L } from './sheetLayout';

export const Super: React.FC<{ lines: string[]; x: number; baselines: number[]; anchor: 'start' | 'end'; size: number }> = ({
  lines,
  x,
  baselines,
  anchor,
  size,
}) => (
  <>
    {lines.map((ln, i) => (
      <div
        key={ln}
        style={{
          position: 'absolute',
          ...(anchor === 'start' ? { left: x } : { right: -x }),
          top: baselines[i] - size * 0.986, // ascent → baseline
          ...display(size, 900, C.chalk),
          lineHeight: `${size * 1.2}px`,
          height: size * 1.2,
        }}
      >
        {ln}
      </div>
    ))}
  </>
);

export const Sheet: React.FC<{ format: Format; index: number }> = ({ format, index }) => {
  const { fps, width } = useVideoConfig();
  const tl = TL[format].sheets;
  const sh = SHEETS[index];
  const planF = Math.round(tl.plan * fps);
  const P = PLAN_L[format](sh.nameLines.length);
  const Q = PERSP[format][index];
  const lbl = CHROME[format].lbl;
  const right = (x: number) => x - width; // for right-anchored supers

  return (
    <AbsoluteFill style={{ backgroundColor: C.slabBlack }}>
      <Sequence name={`PLAN ${sh.n}`} durationInFrames={planF} premountFor={fps}>
          <Ground pool={[30, 50]} exposure={0.1} />
          <Framed rect={P.dest}>
            <Clip id={sh.plan} dest={[0, 0, P.dest[2], P.dest[3]]} trimBefore={0} />
          </Framed>
          <ViewTitle x={P.vt[0]} y={P.vt[1]} w={P.vt[2]} size={lbl} text={`PLAN ${sh.n} · CONCEPT FILM · AI-GENERATED`} />
          <div style={{ position: 'absolute', left: P.tag[0], top: P.tag[1] }}>
            <Lbl text={sh.tag} size={lbl} color={C.pencil} style={format === '169' ? { whiteSpace: 'normal', display: 'block', width: width - P.tag[0] - 96 } : undefined} />
          </div>
          <div
            style={{
              position: 'absolute',
              ...(P.numeral.anchor === 'start' ? { left: P.numeral.x } : { right: width - P.numeral.x }),
              top: P.numeral.baseline - P.numeral.size * 0.986,
              ...stencil(P.numeral.size, C.chalk),
              lineHeight: `${P.numeral.size * 1.2}px`,
            }}
          >
            {sh.n}
          </div>
          {(P.name.oneLine ? [sh.name] : sh.nameLines).map((ln, i) => (
            <div
              key={ln}
              style={{
                position: 'absolute',
                left: P.name.x,
                top: P.name.baselines[i] - P.name.size * 0.986,
                ...display(P.name.size, 800, C.chalk),
                lineHeight: `${P.name.size * 1.2}px`,
              }}
            >
              {ln}
            </div>
          ))}
      </Sequence>
      <Sequence name={PERSP_TITLES[index]} from={planF} premountFor={fps}>
          {Q.framed ? <Ground pool={[50, 50]} exposure={0.1} /> : null}
          <Framed rect={Q.dest} frame={Q.framed} feather={Q.framed}>
            <Clip id={Q.clip} crop={Q.crop} dest={[0, 0, Q.dest[2], Q.dest[3]]} trimBefore={Math.round(Q.inAt * fps)} />
          </Framed>
          <ViewTitle x={Q.vt[0]} y={Q.vt[1]} w={Q.vt[2]} size={lbl} wrap={Q.vt[2] < 700} text={`${PERSP_TITLES[index]} · CONCEPT FILM · AI-GENERATED`} />
          <Super
            lines={Q.sup.lines}
            x={Q.sup.anchor === 'start' ? Q.sup.x : right(Q.sup.x)}
            baselines={Q.sup.baselines}
            anchor={Q.sup.anchor}
            size={Q.sup.size}
          />
      </Sequence>
    </AbsoluteFill>
  );
};
