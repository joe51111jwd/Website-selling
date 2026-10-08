// A-200 CONTEXT · THE 1811 GRID. The venue is parked as a HOLD first: the row poster fades to its
// pencil outline, the outline morphs into an orange HOLD cloud and docks in the VENUE cell. Only then
// does a separate history diagram draw: the grid module at about 29° east of true north.
// The bays, the outline and the cloud never touch the grid (brief §3.9, rule 2).
// Pass B (director note 3): the HOLD part is quicker, the grid is denser (a smaller module, firmer lines) and is
// complete with its arrows and the H2 by 1.85 s, then holds, with a slow push, to the end of the 3.0 s beat.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Lbl } from '../components/Lbl';
import { cloudPath } from '../components/Marks';
import { ViewTitle } from '../components/ViewTitle';
import { STILLS } from '../clips';
import { DRAW, SETTLE, mix, printIn, prog } from '../lib/ease';
import { C, display } from '../theme';
import { CHROME } from '../layout';
import type { Format } from '../timeline';
import { ROW, bayRect } from './rowLayout';

type CtxL = {
  grid: { cx: number; cy: number; r: number; ave: number; st: number };
  arrows: { ox: number; oy: number; len: number; arc: number };
  h2: { x: number; size: number; baselines: number[] };
  vt: [number, number, number];
  dock: [number, number, number, number];
  tag: [number, number];
};

const CTX: Record<'169' | '916', CtxL> = {
  // grid below the top-right disclosure (16:9) / the two-line one (9:16); H2 and dock clear of the bottom one
  '169': {
    grid: { cx: 1330, cy: 540, r: 372, ave: 70, st: 20 },
    arrows: { ox: 420, oy: 600, len: 300, arc: 132 },
    h2: { x: 96, size: 108, baselines: [760, 853, 946] },
    vt: [926, 926, 808],
    dock: [1544, 978, 280, 50],
    tag: [96, 120],
  },
  '916': {
    grid: { cx: 540, cy: 790, r: 410, ave: 70, st: 20 },
    arrows: { ox: 250, oy: 1090, len: 300, arc: 120 },
    h2: { x: 64, size: 124, baselines: [1420, 1527, 1634] },
    vt: [64, 1236, 952],
    dock: [736, 1660, 280, 56],
    tag: [64, 344],
  },
};

const H2_LINES = ['NEW YORK’S GRID', 'STARTED AS A', 'LAYOUT.'];
const ANGLE = 29; // degrees east of true north (fact-gated with A-200's body; "about 29°" in both variants)

export const Context: React.FC<{ format: Format }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const f = format === '916' ? '916' : '169';
  const L = CTX[f];
  const R = ROW[format];
  const lbl = CHROME[format].lbl;

  // beats (seconds into the 3.0 s scene; scripts/captions.mjs mirrors them in CTX_T)
  const posterOut = prog(t, 0.06, 0.3);
  const morph = SETTLE(prog(t, 0.3, 0.62));
  const lift = SETTLE(prog(t, 0.68, 1.02));
  const gridP = DRAW(prog(t, 1.05, 1.75));
  const arrowP = DRAW(prog(t, 1.2, 1.65));
  const arcP = DRAW(prog(t, 1.5, 1.85));
  const gridPush = 1 + 0.035 * SETTLE(prog(t, 1.05, 3.0)); // the slow push while the diagram holds

  // the row outline (and its cloud)
  const r0 = bayRect(R, 0);
  const r4 = bayRect(R, 4);
  const pad = R.b * 0.07;
  const ox = r0[0] - pad;
  const oy = r0[1] - pad;
  const ow = r4[0] + r4[2] - r0[0] + 2 * pad;
  const oh = R.b + 2 * pad;
  // fly to the dock
  const d = L.dock;
  const cloudW = d[3] * 1.5;
  const cloudH = d[3] * 0.62;
  const tx = d[0] + d[2] - 18 - cloudW - 70; // cloud mark sits before the word HOLD
  const ty = d[1] + d[3] / 2 - cloudH / 2;
  const cw = mix(ow, cloudW, lift);
  const ch = mix(oh, cloudH, lift);
  const cx = mix(ox, tx, lift);
  const cy = mix(oy, ty, lift) - Math.sin(Math.PI * lift) * 24; // the lift arc
  const bulge = mix(R.b * 0.11, cloudH * 0.22, lift);
  const stroke = morph < 0.02 ? C.pencil : C.orange;
  const shadow = lift > 0 && lift < 1 ? mix(2, 6, Math.sin(Math.PI * lift)) : morph > 0 ? 2 : 0;
  const docked = lift >= 1;
  const outlineVisible = posterOut > 0;

  // grid lines in the grid's own frame (rotated by ANGLE)
  const G = L.grid;
  const ext = G.r * 1.5;
  const aves: number[] = [];
  for (let x = -Math.ceil(ext / G.ave) * G.ave; x <= ext; x += G.ave) aves.push(x);
  const sts: number[] = [];
  for (let y = -Math.ceil(ext / G.st) * G.st; y <= ext; y += G.st) sts.push(y);
  const maskR = G.r * gridP;

  const A = L.arrows;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const tipN: [number, number] = [A.ox, A.oy - A.len * arrowP];
  const tipG: [number, number] = [A.ox + Math.sin(rad(ANGLE)) * A.len * arrowP, A.oy - Math.cos(rad(ANGLE)) * A.len * arrowP];
  const arcEnd = rad(ANGLE * arcP);
  const arcPath = `M${A.ox},${A.oy - A.arc} A${A.arc},${A.arc} 0 0 1 ${A.ox + Math.sin(arcEnd) * A.arc},${A.oy - Math.cos(arcEnd) * A.arc}`;
  const head = (x: number, y: number, deg: number) => {
    const a = rad(deg);
    const s = 14;
    const l: [number, number] = [x - Math.sin(a) * s + Math.cos(a) * s * 0.42, y + Math.cos(a) * s + Math.sin(a) * s * 0.42];
    const rr: [number, number] = [x - Math.sin(a) * s - Math.cos(a) * s * 0.42, y + Math.cos(a) * s - Math.sin(a) * s * 0.42];
    return `M${x},${y} L${l[0]},${l[1]} L${rr[0]},${rr[1]} Z`;
  };

  const stills = [STILLS.b40hold, STILLS.b41f0, STILLS.b42f0, STILLS.b43f0, STILLS.b44last];

  return (
    <AbsoluteFill style={{ backgroundColor: C.slabBlack }}>
      <div style={{ position: 'absolute', left: L.tag[0], top: L.tag[1] }}>
        <Lbl text="A-200 · CONTEXT · THE 1811 GRID (HISTORY) · NOT A MAP · NTS" size={lbl} color={C.pencil} />
      </div>

      {/* the row poster, fading to its pencil outline */}
      {posterOut < 1
        ? stills.map((src, i) => {
            const r = bayRect(R, i);
            return (
              <Img
                key={src}
                src={staticFile(src)}
                style={{ position: 'absolute', left: r[0], top: r[1], width: r[2], height: r[3], opacity: 1 - posterOut }}
              />
            );
          })
        : null}
      <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <defs>
          <filter id="lift" x="-20%" y="-50%" width="140%" height="200%">
            <feDropShadow dx="0" dy={shadow} stdDeviation={shadow * 0.8} floodColor="#000" floodOpacity="0.7" />
          </filter>
          <radialGradient id="gridMaskG">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="86%" stopColor="#fff" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <mask id="gridMask" maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
            <circle cx={G.cx} cy={G.cy} r={Math.max(0.1, maskR)} fill="url(#gridMaskG)" />
          </mask>
        </defs>
        {/* inner bay squares of the outline */}
        {outlineVisible && morph < 1
          ? [0, 1, 2, 3, 4].map((i) => {
              const r = bayRect(R, i);
              return (
                <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} fill="none" stroke={C.pencil} strokeWidth={1.25} opacity={posterOut * (1 - morph)} />
              );
            })
          : null}
        {outlineVisible ? (
          <path
            d={cloudPath(cx, cy, cw, ch, morph, bulge)}
            fill="none"
            stroke={stroke}
            strokeWidth={docked ? 1.5 : 2}
            opacity={posterOut}
            filter={shadow > 0 && !docked ? 'url(#lift)' : undefined}
          />
        ) : null}

        {/* the grid: a separate history diagram, drawn only after the cloud has docked */}
        {docked && maskR > 0 ? (
          <g mask="url(#gridMask)">
            <g transform={`translate(${G.cx} ${G.cy}) scale(${gridPush}) rotate(${ANGLE})`}>
              {sts.map((y) => (
                <line key={`s${y}`} x1={-ext} y1={y} x2={ext} y2={y} stroke={C.pencil} strokeWidth={1} opacity={0.72} />
              ))}
              {aves.map((x) => (
                <line key={`a${x}`} x1={x} y1={-ext} x2={x} y2={ext} stroke={C.pencil} strokeWidth={2} opacity={1} />
              ))}
            </g>
          </g>
        ) : null}
        {docked && arrowP > 0 ? (
          <g>
            <line x1={A.ox} y1={A.oy} x2={tipN[0]} y2={tipN[1]} stroke={C.chalk} strokeWidth={1.5} />
            <path d={head(tipN[0], tipN[1], 0)} fill={C.chalk} opacity={prog(t, 1.6, 1.7)} />
            <line x1={A.ox} y1={A.oy} x2={tipG[0]} y2={tipG[1]} stroke={C.chalk} strokeWidth={1.5} />
            <path d={head(tipG[0], tipG[1], ANGLE)} fill={C.chalk} opacity={prog(t, 1.6, 1.7)} />
            {arcP > 0 ? <path d={arcPath} fill="none" stroke={C.chalkBlue} strokeWidth={1.5} /> : null}
          </g>
        ) : null}
      </svg>

      {/* labels */}
      <div style={{ position: 'absolute', left: ox, top: oy + oh + 14, opacity: 1 - prog(t, 0.3, 0.4) }}>
        <Lbl text="THE FIVE BAYS · ILLUSTRATIVE" size={lbl} color={C.chalk} />
      </div>
      <div style={{ position: 'absolute', left: ox, top: oy + oh + 14, opacity: printIn(t, 0.4) * (1 - prog(t, 1.2, 1.35)) }}>
        <Lbl text="VENUE: HOLD — Venue to be announced on this site." size={lbl} color={C.chalk} />
      </div>
      {docked || lift > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: d[0],
            top: d[1],
            width: d[2],
            height: d[3],
            border: `1px solid ${C.pencil}`,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `0 18px`,
            opacity: printIn(t, 0.68),
          }}
        >
          <Lbl text="DATE · VENUE" size={lbl * 0.8} color={C.pencil} />
          <Lbl text="HOLD" size={lbl} color={C.chalk} />
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: A.ox - 60, top: A.oy - A.len - 52, opacity: printIn(t, 1.6) }}>
        <Lbl text="TRUE NORTH" size={lbl} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: A.ox + Math.sin(rad(ANGLE)) * A.len + 12,
          top: A.oy - Math.cos(rad(ANGLE)) * A.len - 20,
          opacity: printIn(t, 1.6),
        }}
      >
        <Lbl text="THE 1811 GRID" size={lbl} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: A.ox + Math.sin(rad(ANGLE)) * A.arc + 18,
          top: A.oy - Math.cos(rad(ANGLE)) * A.arc - lbl * 0.2,
          opacity: printIn(t, 1.85),
        }}
      >
        <Lbl text="ABOUT 29°" size={lbl} color={C.chalk} />
      </div>
      {t >= 0.3 ? (
        <ViewTitle x={L.vt[0]} y={L.vt[1]} w={L.vt[2]} size={lbl} text="CONTEXT · THE 1811 GRID (HISTORY) · DRAWING · NOT A MAP" opacity={printIn(t, 1.05)} />
      ) : (
        <ViewTitle x={R.x0} y={R.viewTitleY} w={R.viewTitleW} size={lbl} text="PLAN VIEWS 01–05 · CONCEPT FILM STILL · AI-GENERATED" />
      )}

      {/* H2 */}
      {H2_LINES.map((ln, i) => (
        <div
          key={ln}
          style={{
            position: 'absolute',
            left: L.h2.x,
            top: L.h2.baselines[i] - L.h2.size * 0.986,
            ...display(L.h2.size, 800, C.chalk),
            lineHeight: `${L.h2.size * 1.2}px`,
            opacity: printIn(t, 1.4),
          }}
        >
          {ln}
        </div>
      ))}
    </AbsoluteFill>
  );
};
