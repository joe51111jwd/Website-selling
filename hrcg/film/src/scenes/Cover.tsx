// A-000 COVER, PASS A: the line pays out and snaps, a small matte puff, the H1 inks, c34 frames 60→84
// rise through the dust, and time stops on frame 84 with a slow push (SETTLE).
import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ChalkLine } from '../components/ChalkLine';
import { Clip } from '../components/Clip';
import { Framed } from '../components/Framed';
import { Ground } from '../components/Ground';
import { HeroType } from '../components/HeroType';
import { Lbl } from '../components/Lbl';
import { Puff } from '../components/Puff';
import { ViewTitle } from '../components/ViewTitle';
import { SETTLE, mix, prog } from '../lib/ease';
import { C, status as statusStyle } from '../theme';
import { FILM_DELAY_FRAMES, FILM_FADE, FILM_FRAMES, TL, type Format } from '../timeline';
import { SNAP, SRC_FPS } from '../clips';
import { COVER, STATUS, VT_FILM, VT_STILL } from './coverLayout';

export type CoverProps = { format: Format };

/** Frozen-state numbers shared with the plan cut (which starts on the cover's last frame). */
export const coverFreeze = (format: Format, fps: number) => {
  const tl = TL[format].cover;
  const impactF = Math.round(tl.impact * fps);
  const filmF = impactF + FILM_DELAY_FRAMES;
  const freezeF = filmF + FILM_FRAMES - 1; // the frame on which c34 frame 84 first shows
  return { impactF, filmF, freezeF, freezeT: freezeF / fps, endT: tl.end };
};

export const pushAt = (format: Format, t: number, fps: number) => {
  const { freezeT, endT } = coverFreeze(format, fps);
  return SETTLE(prog(t, freezeT, endT));
};

export const Cover: React.FC<CoverProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const L = COVER[format];
  const tl = TL[format].cover;
  const { impactF, filmF, freezeF } = coverFreeze(format, fps);
  const S = impactF / fps;
  const filmT = filmF / fps;

  const k = pushAt(format, t, fps);
  const frameScale = 1 + L.push.frame * k;
  const farScale = 1 + L.push.far * k;
  const nearScale = 1 + L.push.near * k;
  // pivot in the window's local coordinates
  const lp: [number, number] = [L.pivot[0] - L.dest[0], L.pivot[1] - L.dest[1]];

  const filmOpacity = prog(t, filmT, filmT + FILM_FADE);
  const depositOpacity = 1 - prog(t, S + 0.25, S + 0.8);
  const frozen = frame >= freezeF;
  const s = L.dest[2] / L.crop[2];
  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    left: -L.crop[0] * s,
    top: -L.crop[1] * s,
    width: L.src[0] * s,
    height: L.src[1] * s,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: C.slabBlack }}>
      <Ground pool={L.pool} />

      {/* film, then the frozen frame 84, with the slow push */}
      <Framed rect={L.dest} frame={L.window} feather={L.window} opacity={filmOpacity}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            scale: String(frameScale),
            transformOrigin: `${lp[0]}px ${lp[1]}px`,
          }}
        >
           <Sequence name="snap film, frames 60→84" from={filmF} durationInFrames={FILM_FRAMES - 1} premountFor={fps}>
            <Clip
              id={L.clip}
              dest={[-L.crop[0] * s, -L.crop[1] * s, L.src[0] * s, L.src[1] * s]}
              trimBefore={Math.round((SNAP[L.clip as 'c34' | 'n01b'].first / SRC_FPS) * fps)}
            />
          </Sequence>
          {frozen ? <Img src={staticFile(L.still)} style={imgStyle} /> : null}
        </div>
      </Framed>

      {/* phone layout: the empty window waits on the slab as a hairline viewport until the film rises */}
      {L.window ? (
        <div
          style={{
            position: 'absolute',
            left: L.dest[0] - 1,
            top: L.dest[1] - 1,
            width: L.dest[2] + 2,
            height: L.dest[3] + 2,
            border: `1px solid ${C.pencil}`,
            boxSizing: 'border-box',
            opacity: 0.45 * (1 - filmOpacity),
          }}
        />
      ) : null}

      {/* status line */}
      <div style={{ position: 'absolute', left: L.status.x, top: L.status.cy - L.status.size * 0.5, opacity: 0.8 }}>
        <span style={statusStyle(L.status.size)}>{STATUS}</span>
      </div>

      {/* the line, its deposit, the puff */}
      <ChalkLine
        t={t}
        timing={{ payout: tl.payout, pull: tl.pull, impact: tl.impact }}
        geom={L.line}
        shutter={0.75 / fps}
        width={width}
        height={height}
        stroke={L.stroke}
        depositWidth={L.depositW}
        xSize={L.xSize}
        shadowMax={L.shadowMax}
        depositOpacity={depositOpacity}
        xOpacity={1 - prog(t, S + 0.25, S + 0.8)}
      />
      <Puff
        tau={t - S}
        ax={L.line.ax}
        bx={L.line.bx}
        y={L.line.y}
        scale={L.puffScale}
        strength={Math.min(1, L.line.depth / L.line.maxDepth)}
        width={width}
        height={height}
      />

      {/* H1 */}
      <HeroType
        t={t}
        inkAt={S}
        lines={L.h1.lines}
        size={L.h1.size}
        width={width}
        height={height}
        pivot={L.pivot}
        farScale={farScale}
        nearScale={nearScale}
      />

      {/* view title: the film's, then the still's (both the hero's own, §2.3 / §2.6) */}
      {t >= filmT ? (
        <ViewTitle
          x={L.viewTitle.x}
          y={L.viewTitle.y}
          w={L.viewTitle.w}
          size={L.viewTitle.size}
          wrap={L.viewTitle.wrap}
          text={frozen ? VT_STILL : VT_FILM}
          opacity={mix(0, 1, prog(t, filmT, filmT + 0.2))}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const CoverLabel: React.FC<{ size: number }> = ({ size }) => <Lbl text="A-000" size={size} />;
