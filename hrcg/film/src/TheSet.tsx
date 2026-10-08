// THE SET · PASS B (footage cut; no site captures, see README). The master timeline: cover → plan cut → five sheets → A-200 → end card,
// under the burned-in sheet border and labels. The same scenes lay themselves out natively per format.
import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Series, staticFile, useVideoConfig } from 'remotion';
import { Burnins } from './components/Burnins';
import { CHROME } from './layout';
import { Context } from './scenes/Context';
import { Cover } from './scenes/Cover';
import { EndCard } from './scenes/EndCard';
import { PlanCut } from './scenes/PlanCut';
import { Sheet } from './scenes/Sheet';
import { C } from './theme';
import { TL, sheetSchedule, type Format } from './timeline';

// siteUrl: the deploy's own address when it resolves at render time (scripts/deliver.sh, the site's
// resolveSiteUrl order); null → the end card prints DATE · VENUE: HOLD instead (F-102).
export type TheSetProps = { format: Format; withAudio: boolean; siteUrl?: string | null };

export const TheSet: React.FC<TheSetProps> = ({ format, withAudio, siteUrl = null }) => {
  const { fps } = useVideoConfig();
  const f = TL[format];
  const len = (a: number, b: number) => Math.round((b - a) * fps);
  const each = Math.round(f.sheets.each * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: C.slabBlack }}>
      <Series>
        <Series.Sequence name="A-000 cover" durationInFrames={len(f.cover.start, f.cover.end)} premountFor={fps}>
          <Cover format={format} />
        </Series.Sequence>
        <Series.Sequence name="Plan cut → A-100" durationInFrames={len(f.plancut.start, f.plancut.end)} premountFor={fps}>
          <PlanCut format={format} />
        </Series.Sequence>
        <Series.Sequence name="A-101 LAY BRICK." durationInFrames={each} premountFor={fps}>
          <Sheet format={format} index={0} />
        </Series.Sequence>
        <Series.Sequence name="A-102 HANG DRYWALL." durationInFrames={each} premountFor={fps}>
          <Sheet format={format} index={1} />
        </Series.Sequence>
        <Series.Sequence name="A-103 BOLT IT." durationInFrames={each} premountFor={fps}>
          <Sheet format={format} index={2} />
        </Series.Sequence>
        <Series.Sequence name="A-104 RUN THE PIPE." durationInFrames={each} premountFor={fps}>
          <Sheet format={format} index={3} />
        </Series.Sequence>
        <Series.Sequence name="A-105 MARK IT OUT." durationInFrames={each} premountFor={fps}>
          <Sheet format={format} index={4} />
        </Series.Sequence>
        {f.context ? (
          <Series.Sequence name="A-200 context" durationInFrames={len(f.context.start, f.context.end)} premountFor={fps}>
            <Context format={format} />
          </Series.Sequence>
        ) : null}
        <Series.Sequence name="End card" durationInFrames={len(f.end.start, f.end.end)} premountFor={fps}>
          <EndCard format={format} siteUrl={siteUrl} />
        </Series.Sequence>
      </Series>
      <Burnins format={format} chrome={CHROME[format]} schedule={sheetSchedule(f)} />
      {withAudio ? <Audio name="Foley mix" src={staticFile(`audio/the-set-${format}.wav`)} premountFor={fps} /> : null}
    </AbsoluteFill>
  );
};
