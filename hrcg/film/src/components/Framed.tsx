// A media window: hairline frame, optional 6 % feathered edge (brief §5.4), children in local coords.
import React from 'react';
import { C } from '../theme';
import type { Rect } from './Clip';

const FEATHER =
  'linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 6%, #000 94%, transparent 100%)';

export const Framed: React.FC<{
  rect: Rect;
  feather?: boolean;
  frame?: boolean;
  frameOpacity?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({ rect, feather = false, frame = true, frameOpacity = 1, opacity = 1, children }) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: rect[0],
        top: rect[1],
        width: rect[2],
        height: rect[3],
        overflow: 'hidden',
        opacity,
        ...(feather
          ? { maskImage: FEATHER, WebkitMaskImage: FEATHER, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }
          : {}),
      }}
    >
      {children}
    </div>
    {frame ? (
      <div
        style={{
          position: 'absolute',
          left: rect[0] - 1,
          top: rect[1] - 1,
          width: rect[2] + 2,
          height: rect[3] + 2,
          border: `1px solid ${C.pencil}`,
          boxSizing: 'border-box',
          opacity: frameOpacity * opacity,
        }}
      />
    ) : null}
  </>
);
