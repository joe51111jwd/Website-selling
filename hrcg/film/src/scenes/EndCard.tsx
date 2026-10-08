// End card on slab black: the COURSE mark lays its five bricks in ONE course (0.4 s), then the type.
// F-102: the second cell says where to get in touch only when the deploy's own address (SITE_URL) resolves at
// render time (scripts/deliver.sh passes it as the siteUrl prop); otherwise it prints DATE · VENUE: HOLD.
// Never an email address, never an invented host.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { CourseMark } from '../components/Marks';
import { SETTLE, printIn, prog } from '../lib/ease';
import { C, F, display, status } from '../theme';
import type { Format } from '../timeline';

export const BRICK_TIMES = [0.1, 0.18, 0.26, 0.34, 0.42]; // seconds into the card; one soft clack each

type EndL = {
  x: number;
  w: number;
  mark: { y: number; u: number };
  name: { size: number; lines: string[]; baselines: number[] };
  row: { y: number; h: number; stacked: boolean };
  status: number;
  cta: number;
  line: { baselines: number[]; size: number; lines: string[] };
};

const END: Record<Format, EndL> = {
  '169': {
    x: 96,
    w: 1728,
    mark: { y: 214, u: 30 },
    name: { size: 168, lines: ['HUMANOID ROBOT', 'CONSTRUCTION GAMES'], baselines: [452, 597] },
    row: { y: 668, h: 92, stacked: false },
    status: 28,
    cta: 28,
    line: { baselines: [912], size: 100, lines: ['THIS HASN’T HAPPENED YET.'] },
  },
  '916': {
    x: 64,
    w: 952,
    mark: { y: 480, u: 28 },
    name: { size: 148, lines: ['HUMANOID ROBOT', 'CONSTRUCTION', 'GAMES'], baselines: [700, 827, 954] },
    row: { y: 1020, h: 92, stacked: true },
    status: 28,
    cta: 28,
    line: { baselines: [1330, 1440], size: 128, lines: ['THIS HASN’T', 'HAPPENED YET.'] },
  },
  '11': {
    x: 64,
    w: 952,
    mark: { y: 176, u: 24 },
    name: { size: 112, lines: ['HUMANOID ROBOT', 'CONSTRUCTION GAMES'], baselines: [372, 468] },
    row: { y: 520, h: 76, stacked: true },
    status: 24,
    cta: 24,
    line: { baselines: [822], size: 76, lines: ['THIS HASN’T HAPPENED YET.'] },
  },
};

export const EndCard: React.FC<{ format: Format; siteUrl?: string | null }> = ({ format, siteUrl = null }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const L = END[format];
  const ctaStyle: React.CSSProperties = {
    fontFamily: F.archivo,
    fontWeight: 600,
    fontVariationSettings: "'wdth' 100",
    fontSize: L.cta,
    letterSpacing: '0.04em',
    color: C.chalk,
    whiteSpace: 'nowrap',
  };
  // each brick prints in over 2 frames with a short settle down onto the course
  let laid = 0;
  BRICK_TIMES.forEach((bt) => {
    laid += SETTLE(prog(t, bt, bt + 2 / fps));
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.slabBlack }}>
      <CourseMark x={L.x} y={L.mark.y} u={L.mark.u} laid={laid} />
      {L.name.lines.map((ln, i) => (
        <div
          key={ln}
          style={{
            position: 'absolute',
            left: L.x - L.name.size * 0.02,
            top: L.name.baselines[i] - L.name.size * 0.986,
            ...display(L.name.size, 800, C.chalk),
            lineHeight: `${L.name.size * 1.2}px`,
            opacity: printIn(t, 0.55),
          }}
        >
          {ln}
        </div>
      ))}
      {/* a ruled title-block row: status | call to action (stacked on narrow formats) */}
      {(() => {
        const rows = L.row.stacked ? 2 : 1;
        const cellW = L.row.stacked ? L.w : L.w / 2;
        const rule = (top: number, key: string) => (
          <div key={key} style={{ position: 'absolute', left: L.x, top, width: L.w, height: 1, backgroundColor: 'rgba(154,149,140,0.6)' }} />
        );
        const cell = (i: number, content: React.ReactNode, at: number) => {
          const left = L.row.stacked ? L.x : L.x + i * cellW;
          const top = L.row.stacked ? L.row.y + i * L.row.h : L.row.y;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left,
                top,
                width: cellW,
                height: L.row.h,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: i > 0 && !L.row.stacked ? 28 : 0,
                boxSizing: 'border-box',
                borderLeft: i > 0 && !L.row.stacked ? '1px solid rgba(154,149,140,0.6)' : undefined,
                opacity: printIn(t, at),
              }}
            >
              {content}
            </div>
          );
        };
        return (
          <>
            <div style={{ opacity: printIn(t, 0.75) }}>
              {Array.from({ length: rows + 1 }, (_, r) => rule(L.row.y + r * L.row.h, `r${r}`))}
            </div>
            {cell(
              0,
              <span style={status(L.status)}>
                PLANNED FOR NEW YORK CITY · <span style={{ fontFamily: F.mono, fontWeight: 500, letterSpacing: 0 }}>2027</span>
              </span>,
              0.75,
            )}
            {cell(
              1,
              siteUrl ? (
                <span style={{ display: 'flex', flexDirection: 'column', gap: L.cta * 0.25 }}>
                  <span style={ctaStyle}>TEAMS AND SPONSORS: GET IN TOUCH.</span>
                  <span style={{ ...ctaStyle, textTransform: 'none', letterSpacing: '0.02em' }}>{siteUrl.replace(/^https?:\/\//, '')}</span>
                </span>
              ) : (
                <span style={status(L.status)}>DATE · VENUE: HOLD</span>
              ),
              0.95,
            )}
          </>
        );
      })()}
      {L.line.lines.map((ln, i) => (
        <div
          key={ln}
          style={{
            position: 'absolute',
            left: L.x - L.line.size * 0.01,
            top: L.line.baselines[i] - L.line.size * 0.986,
            ...display(L.line.size, 900, C.chalk),
            lineHeight: `${L.line.size * 1.2}px`,
            opacity: printIn(t, 1.2),
          }}
        >
          {ln}
        </div>
      ))}
    </AbsoluteFill>
  );
};
