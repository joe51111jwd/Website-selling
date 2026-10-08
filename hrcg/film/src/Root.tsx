import React from 'react';
import { Composition, Folder, Still } from 'remotion';
import './fonts';
import { TheSet } from './TheSet';
import { Context } from './scenes/Context';
import { Cover } from './scenes/Cover';
import { EndCard } from './scenes/EndCard';
import { PlanCut } from './scenes/PlanCut';
import { Sheet } from './scenes/Sheet';
import { SocialCard } from './stills/SocialCard';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="THE-SET">
        <Composition
          id="TheSet169"
          component={TheSet}
          durationInFrames={900}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ format: '169' as const, withAudio: true, siteUrl: null as string | null }}
        />
        <Composition
          id="TheSet916"
          component={TheSet}
          durationInFrames={900}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ format: '916' as const, withAudio: true, siteUrl: null as string | null }}
        />
        <Composition
          id="TheSet11"
          component={TheSet}
          durationInFrames={600}
          fps={30}
          width={1080}
          height={1080}
          defaultProps={{ format: '11' as const, withAudio: true, siteUrl: null as string | null }}
        />
      </Folder>
      <Folder name="R5-stills">
        <Still id="OgImage" component={SocialCard} width={1200} height={630} defaultProps={{ kind: 'og' as const }} />
        <Still id="XCard" component={SocialCard} width={1600} height={900} defaultProps={{ kind: 'x' as const }} />
      </Folder>
      <Folder name="Scenes">
        <Composition id="Cover169" component={Cover} durationInFrames={216} fps={30} width={1920} height={1080} defaultProps={{ format: '169' as const }} />
        <Composition id="PlanCut169" component={PlanCut} durationInFrames={54} fps={30} width={1920} height={1080} defaultProps={{ format: '169' as const }} />
        <Composition id="Sheet169" component={Sheet} durationInFrames={90} fps={30} width={1920} height={1080} defaultProps={{ format: '169' as const, index: 0 }} />
        <Composition id="Context169" component={Context} durationInFrames={90} fps={30} width={1920} height={1080} defaultProps={{ format: '169' as const }} />
        <Composition id="EndCard169" component={EndCard} durationInFrames={90} fps={30} width={1920} height={1080} defaultProps={{ format: '169' as const, siteUrl: null as string | null }} />
      </Folder>
    </>
  );
};
