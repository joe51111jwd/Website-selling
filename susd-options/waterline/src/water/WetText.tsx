import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { engine } from '../engine/engine';

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'div';

/**
 * Renders its children twice in one grid cell: `.wt-dry` (the real text) and `.wt-wet`
 * (aria-hidden). The engine clips the dry copy to the air and the wet copy to the water
 * with the same surface function the shader draws, so they line up by construction.
 */
export function WetText({
  as: T = 'div',
  id,
  className = '',
  wobble = false,
  style,
  children,
}: {
  as?: Tag;
  id?: string;
  className?: string;
  wobble?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => engine.addWet(root.current!, wobble), [wobble]);
  return (
    <div ref={root} className={`wt ${className}`} style={style}>
      <T id={id} className="wt-dry">
        {children}
      </T>
      <div className="wt-wet" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/** Splits a sentence into word spans (for the intro rise and the per-line wobble). */
export function Words({
  text,
  breaks = [],
  phoneBreaks = [],
  cls,
  start = 0,
}: {
  text: string;
  breaks?: number[]; // word indices that start a new line on desktop
  phoneBreaks?: number[]; // word indices that start a new line on phones
  cls?: (word: string, i: number) => string | undefined;
  start?: number;
}) {
  const words = text.split(' ');
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          {i > 0 && breaks.includes(i) ? <br className="br-d" /> : null}
          {i > 0 && phoneBreaks.includes(i) ? <br className="br-p" /> : null}
          {i > 0 && ' '}
          <span className={`w ${cls?.(w, i) ?? ''}`} style={{ '--i': start + i } as CSSProperties}>
            {w}
          </span>
        </Fragment>
      ))}
    </>
  );
}
