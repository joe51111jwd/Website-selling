// A label (Archivo 600 wdth 68, +0.06em, caps) whose numerals and IDs are set in JetBrains Mono,
// as the brief's type table asks ("Numerals and IDs inside labels").
import React from 'react';
import { C, label, mono } from '../theme';

const TOKEN = /(A-\d{3}|\d{2}-[A-Z](?![A-Za-z])|\d{2}–\d{2}|(?<![A-Za-z0-9])\d+°?(?![A-Za-z]))/g;

export const Lbl: React.FC<{
  text: string;
  size: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ text, size, color = C.chalk, style }) => {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  let k = 0;
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    parts.push(
      <span key={k++} style={{ ...mono(size * 0.94, color), letterSpacing: 0 }}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return <span style={{ ...label(size, color), ...style }}>{parts}</span>;
};
