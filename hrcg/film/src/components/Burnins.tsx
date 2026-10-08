// The sheet border and the three burn-ins that stay on for the whole film. Only the sheet number moves:
// a 4-step TICK (brief §6) whenever the sheet changes. No timecode, no LIVE, no lower-thirds.
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { C, mono } from '../theme';
import { BURN, type Chrome } from '../layout';
import { Lbl } from './Lbl';

export const Burnins: React.FC<{
  chrome: Chrome;
  schedule: { t: number; id: string }[];
  captures?: boolean;
}> = ({ chrome, schedule, captures = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { W, H, border, inset, lbl } = chrome;

  let i = 0;
  for (let k = 0; k < schedule.length; k++) if (t >= schedule[k].t) i = k;
  const cur = schedule[i];
  const prev = schedule[Math.max(0, i - 1)];
  // TICK: steps(4) over 120 ms → one step per frame at 30 fps
  const stepsDone = Math.min(4, Math.floor((t - cur.t) * fps) + 1);
  const ticking = i > 0 && stepsDone < 4;
  const lineH = Math.round(lbl * 1.3);
  const shift = ticking ? (stepsDone / 4) * lineH : lineH;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: border,
          top: border,
          width: W - border * 2,
          height: H - border * 2,
          border: `1px solid rgba(154,149,140,0.4)`,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ position: 'absolute', left: inset, top: inset - lbl * 0.15 }}>
        <Lbl text={BURN.topLeft} size={lbl} color={C.chalk} />
      </div>
      <div
        style={{
          position: 'absolute',
          right: inset,
          top: inset - lbl * 0.15,
          display: 'flex',
          alignItems: 'baseline',
          gap: lbl * 0.6,
        }}
      >
        <Lbl text="SHEET" size={lbl} color={C.pencil} />
        <div style={{ height: lineH, overflow: 'hidden', position: 'relative', top: lbl * 0.18 }}>
          <div style={{ translate: `0px ${-shift}px` }}>
            <div style={{ ...mono(lbl, C.chalk), height: lineH, lineHeight: `${lineH}px` }}>{ticking ? prev.id : ''}</div>
            <div style={{ ...mono(lbl, C.chalk), height: lineH, lineHeight: `${lineH}px` }}>{cur.id}</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: inset, bottom: inset - lbl * 0.3 }}>
        <Lbl text={captures ? BURN.bottomLeftCaptures : BURN.bottomLeft} size={lbl} color={C.chalk} />
      </div>
    </>
  );
};
