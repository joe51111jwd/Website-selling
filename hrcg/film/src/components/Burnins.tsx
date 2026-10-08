// The sheet border and the burn-ins that stay on for the whole film. Only the sheet number moves:
// a 4-step TICK (brief §6) whenever the sheet changes. No timecode, no LIVE, no lower-thirds.
// F-058: the AI disclosure is burned in at >= 3.2 % of the frame height, bottom left AND in the top safe
// area (layout.ts DISCLOSURE), with a soft slab shadow so it reads over footage.
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { C, F, mono } from '../theme';
import { BURN, DISCLOSURE, type Chrome } from '../layout';
import type { Format } from '../timeline';
import { Lbl } from './Lbl';

const ASC = 0.878; // Archivo ascent (em); line box = 1.088 em, so the baseline sits ASC below the box top

const DisclosureLines: React.FC<{
  lines: string[];
  size: number;
  pitch: number;
  x: number;
  firstBaseline: number;
  anchor: 'start' | 'end';
  W: number;
}> = ({ lines, size, pitch, x, firstBaseline, anchor, W }) => (
  <>
    {lines.map((ln, i) => (
      <div
        key={ln}
        style={{
          position: 'absolute',
          ...(anchor === 'start' ? { left: x } : { right: W - x }),
          top: firstBaseline + i * pitch - ASC * size,
          fontFamily: F.archivo,
          fontWeight: 600,
          fontVariationSettings: "'wdth' 68",
          fontSize: size,
          lineHeight: `${1.088 * size}px`,
          letterSpacing: '0.06em',
          // the tracking after the last glyph would push a right-aligned line off its edge
          marginRight: anchor === 'end' ? -0.06 * size : 0,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: C.chalk,
          textShadow: '0 0 10px rgba(11,11,10,0.85), 0 0 3px rgba(11,11,10,0.9)',
        }}
      >
        {ln}
      </div>
    ))}
  </>
);

export const Burnins: React.FC<{
  format: Format;
  chrome: Chrome;
  schedule: { t: number; id: string }[];
}> = ({ format, chrome, schedule }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { W, H, border, inset, lbl } = chrome;
  const D = DISCLOSURE[format];

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
      {/* the disclosure: top safe area (repeat) and bottom left */}
      <DisclosureLines lines={D.lines} size={D.size} pitch={D.pitch} x={D.top.x} firstBaseline={D.top.baseline} anchor={D.top.anchor} W={W} />
      <DisclosureLines
        lines={D.lines}
        size={D.size}
        pitch={D.pitch}
        x={D.bottom.x}
        firstBaseline={D.bottom.baseline - (D.lines.length - 1) * D.pitch}
        anchor="start"
        W={W}
      />
    </>
  );
};
