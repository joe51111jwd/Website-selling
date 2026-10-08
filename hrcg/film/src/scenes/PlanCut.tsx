// A-000 → A-100: the frozen frame flattens into PLAN 05 (b44 at 2.60 s) with the visitor's deposit
// lying exactly on 07's freshly snapped line, then pulls out into bay 05 of one row of five.
import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Clip } from '../components/Clip';
import { Framed } from '../components/Framed';
import { HeroType } from '../components/HeroType';
import { Lbl } from '../components/Lbl';
import { Bubble } from '../components/Marks';
import { ViewTitle } from '../components/ViewTitle';
import { B44_FRESH, BAY_PHASE, STILLS } from '../clips';
import { SETTLE, mix, printIn, prog } from '../lib/ease';
import { C } from '../theme';
import type { Format } from '../timeline';
import { COVER, VT_STILL } from './coverLayout';
import { BAY_LABELS, ROW, bayRect } from './rowLayout';
import { ChalkDeposit } from '../components/Deposit';

const BAYS = ['b40', 'b41', 'b42', 'b43'] as const;

export const PlanCut: React.FC<{ format: Format }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const L = COVER[format];
  const R = ROW[format];

  // beats (seconds into the scene)
  const T = {
    h1Out: [0, 0.2],
    plan: [0.06, 0.36],
    depositIn: [0.12, 0.28],
    pull: [0.45, 1.25],
    baysIn: [0.8, 1.25],
    bubbles: 1.0,
    print: 1.32,
  } as const;
  // frozen frame (pushed to its rest scale), as the cover left it
  const s = L.dest[2] / L.crop[2];
  const frameScale = 1 + L.push.frame;
  const lp: [number, number] = [L.pivot[0] - L.dest[0], L.pivot[1] - L.dest[1]];
  const planOpacity = prog(t, T.plan[0], T.plan[1]);

  // registration: deposit (cover line) on b44's fresh line
  const s0 = (L.line.bx - L.line.ax) / (B44_FRESH.x1 - B44_FRESH.x0);
  const left0 = L.line.ax - B44_FRESH.x0 * s0;
  const top0 = L.line.y - B44_FRESH.y * s0;
  const slot = bayRect(R, 4);
  const s1 = slot[2] / 1440;
  const k = SETTLE(prog(t, T.pull[0], T.pull[1]));
  const sc = Math.exp(mix(Math.log(s0), Math.log(s1), k));
  const c0: [number, number] = [left0 + 720 * s0, top0 + 720 * s0];
  const c1: [number, number] = [slot[0] + slot[2] / 2, slot[1] + slot[3] / 2];
  const cx = mix(c0[0], c1[0], k);
  const cy = mix(c0[1], c1[1], k);
  const planRect: [number, number, number, number] = [cx - 720 * sc, cy - 720 * sc, 1440 * sc, 1440 * sc];
  const landed = t >= T.pull[1];
  const depOpacity = prog(t, T.depositIn[0], T.depositIn[1]) * (1 - prog(t, T.pull[0] + 0.16, T.pull[0] + 0.48));
  // deposit endpoints ride along with the plan
  const map = (px: number, py: number): [number, number] => [planRect[0] + px * sc, planRect[1] + py * sc];
  const dA = map(B44_FRESH.x0, B44_FRESH.y);
  const dB = map(B44_FRESH.x1, B44_FRESH.y);

  return (
    <AbsoluteFill style={{ backgroundColor: C.slabBlack }}>
      {/* the frozen perspective, under the plan */}
      <Framed rect={L.dest} frame={L.window} feather={L.window} opacity={1 - planOpacity}>
        <div style={{ position: 'absolute', inset: 0, scale: String(frameScale), transformOrigin: `${lp[0]}px ${lp[1]}px` }}>
          <Img
            src={staticFile(L.still)}
            style={{ position: 'absolute', left: -L.crop[0] * s, top: -L.crop[1] * s, width: L.src[0] * s, height: L.src[1] * s }}
          />
        </div>
      </Framed>
      <HeroType
        t={10}
        inkAt={0}
        lines={L.h1.lines}
        size={L.h1.size}
        width={width}
        height={height}
        pivot={L.pivot}
        farScale={1 + L.push.far}
        nearScale={1 + L.push.near}
        opacity={1 - prog(t, T.h1Out[0], T.h1Out[1])}
      />

      {/* bays 01–04 fade in to the left of the landing slot */}
      {BAYS.map((id, i) => {
        const r = bayRect(R, i);
        return (
          <Framed key={id} rect={r} frame opacity={prog(t, T.baysIn[0] + i * 0.04, T.baysIn[1])}>
            <Sequence name={`bay ${i + 1}`} from={Math.round(T.baysIn[0] * fps)} premountFor={fps}>
              <Clip id={id} dest={[0, 0, r[2], r[3]]} trimBefore={Math.round(BAY_PHASE[i] * fps)} />
            </Sequence>
          </Framed>
        );
      })}

      {/* PLAN 05: the still while it moves, then b44 from 2.60 s once it lands */}
      <Framed rect={planRect} frame={landed} opacity={planOpacity}>
        <Sequence name="plan-cut still" durationInFrames={Math.round(T.pull[1] * fps)} premountFor={fps}>
          <Img src={staticFile(STILLS.b44at260)} style={{ position: 'absolute', left: 0, top: 0, width: planRect[2], height: planRect[3] }} />
        </Sequence>
        <Sequence name="b44 from 2.60 s" from={Math.round(T.pull[1] * fps)} premountFor={fps}>
          <Clip id="b44" dest={[0, 0, planRect[2], planRect[3]]} trimBefore={Math.round(2.6 * fps)} />
        </Sequence>
      </Framed>
      <ChalkDeposit ax={dA[0]} bx={dB[0]} y={dA[1]} width={width} height={height} w={Math.max(2, L.depositW * (sc / s0))} opacity={depOpacity} id="pc" />

      {/* gridline bubbles 01–05 and labels */}
      {[0, 1, 2, 3, 4].map((i) => {
        const r = bayRect(R, i);
        return (
          <Bubble
            key={i}
            cx={r[0] + r[2] / 2}
            cy={R.bubbleY}
            r={R.bubbleR}
            n={`0${i + 1}`}
            t={t}
            at={T.bubbles + i * 0.12}
            numeral={R.numeral}
            stem={R.y0 - R.bubbleY - R.bubbleR - 10}
          />
        );
      })}
      {R.labels === 'under'
        ? BAY_LABELS.map((lb, i) => {
            const r = bayRect(R, i);
            return (
              <div key={lb} style={{ position: 'absolute', left: r[0], top: r[1] + r[3] + 16, opacity: printIn(t, T.print + i * 0.05) }}>
                <Lbl text={lb} size={R.labelSize} color={C.chalk} />
              </div>
            );
          })
        : BAY_LABELS.map((lb, i) => (
            <div
              key={lb}
              style={{
                position: 'absolute',
                left: R.x0,
                top: R.listY + i * R.listPitch,
                width: R.viewTitleW,
                paddingBottom: R.listPitch * 0.25,
                borderBottom: `1px solid rgba(154,149,140,0.5)`,
                opacity: printIn(t, T.print + i * 0.05),
              }}
            >
              <Lbl text={lb} size={R.labelSize} color={C.chalk} />
            </div>
          ))}

      {/* sheet tag + view titles */}
      <div style={{ position: 'absolute', left: R.x0, top: R.tagY, opacity: printIn(t, T.print) }}>
        <Lbl text="A-100 · THE FIVE BAYS (ILLUSTRATIVE) · NOT A VENUE PLAN · NTS" size={R.labelSize} color={C.pencil} />
      </div>
      {t < T.plan[0] ? (
        <ViewTitle x={L.viewTitle.x} y={L.viewTitle.y} w={L.viewTitle.w} size={L.viewTitle.size} wrap={L.viewTitle.wrap} text={VT_STILL} />
      ) : !landed ? (
        <ViewTitle x={L.viewTitle.x} y={L.viewTitle.y} w={L.viewTitle.w} size={L.viewTitle.size} text="PLAN 05 · CONCEPT FILM STILL · AI-GENERATED" />
      ) : (
        <ViewTitle x={R.x0} y={R.viewTitleY} w={R.viewTitleW} size={R.labelSize} text="PLAN VIEWS 01–05 · CONCEPT FILM · AI-GENERATED" />
      )}
    </AbsoluteFill>
  );
};
