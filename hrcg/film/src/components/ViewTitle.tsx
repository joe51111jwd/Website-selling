// View title (brief §3.2): label-style title under the media, underlined by a chalk hairline,
// with NTS printed right-aligned on the rule. Never animated out; it cuts with its view.
import React from 'react';
import { C } from '../theme';
import { Lbl } from './Lbl';

export const ViewTitle: React.FC<{
  x: number;
  y: number; // top of the text line
  w: number;
  text: string;
  size: number;
  opacity?: number;
  nts?: boolean;
  wrap?: boolean;
}> = ({ x, y, w, text, size, opacity = 1, nts = true, wrap = false }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        opacity,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: size,
        paddingBottom: Math.round(size * 0.45),
        borderBottom: `1px solid ${C.chalk}`,
      }}
    >
      <Lbl text={text} size={size} style={wrap ? { whiteSpace: 'normal' } : undefined} />
      {nts ? <Lbl text="NTS" size={size} color={C.pencil} /> : null}
    </div>
  );
};
