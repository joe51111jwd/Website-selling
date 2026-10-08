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
  mask?: string; // a custom CSS mask (e.g. a top feather), used instead of the 6 % edge feather
  children: React.ReactNode;
}> = ({ rect, feather = false, frame = true, frameOpacity = 1, opacity = 1, mask, children }) => (
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
        ...(mask
          ? { maskImage: mask, WebkitMaskImage: mask }
          : feather
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
