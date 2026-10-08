import React from 'react';
import { Composition, Folder } from 'remotion';
import './fonts';
import { Cover } from './scenes/Cover';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Scenes">
        <Composition id="Cover169" component={Cover} durationInFrames={216} fps={30} width={1920} height={1080} defaultProps={{ format: '169' as const }} />
        <Composition id="Cover916" component={Cover} durationInFrames={216} fps={30} width={1080} height={1920} defaultProps={{ format: '916' as const }} />
        <Composition id="Cover11" component={Cover} durationInFrames={150} fps={30} width={1080} height={1080} defaultProps={{ format: '11' as const }} />
      </Folder>
    </>
  );
};
