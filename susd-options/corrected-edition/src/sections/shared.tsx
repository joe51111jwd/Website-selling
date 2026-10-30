import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode, type Ref, type MutableRefObject } from 'react';
import { COPY } from '../copy';
import { registerLight } from '../motion/light';
import { goToFile } from '../nav';

const pad2 = (n: number) => String(n).padStart(2, '0');

export function RunningHead({ center }: { center: 'title' | 'sameGame' }) {
  return (
    <div className={`rhead rhead--${center}`}>
      <span className="rhead__l sc">{COPY.head.author}</span>
      <span className={`rhead__c${center === 'sameGame' ? ' rhead__c--same' : ''}`}>
        {center === 'title' ? COPY.head.title : COPY.head.sameGame}
      </span>
      <a className="rhead__r sc" href="#file" onClick={goToFile}>
        {COPY.head.get}
      </a>
    </div>
  );
}

export function DownArrow() {
  return (
    <svg className="down-arrow" viewBox="0 0 10 14" aria-hidden="true" focusable="false">
      <path d="M5,1V12.5M1.2,8.6L5,12.5L8.8,8.6" />
    </svg>
  );
}

export function GalleyLabel({ n, next }: { n: number; next?: string }) {
  const text = COPY.galley.replace('{n}', pad2(n));
  if (!next) return <span className="galley sc" aria-hidden="true">{text}</span>;
  return (
    <a className="galley sc" href={`#${next}`} aria-label={text}>
      {text} <DownArrow />
    </a>
  );
}

type SheetProps = {
  id: string;
  n: number;
  rot: number;
  labelledBy: string;
  as?: 'section' | 'header';
  center?: 'title' | 'sameGame';
  className?: string;
  next?: string;
  innerRef?: Ref<HTMLDivElement>;
  wrapRef?: Ref<HTMLDivElement>;
  sheetRef?: Ref<HTMLDivElement>;
  shadowRef?: Ref<HTMLDivElement>;
  sectionRef?: Ref<HTMLElement>;
  children: ReactNode;
  after?: ReactNode;
  noHead?: boolean;
};

/** A lit proof sheet lying on the desk. The outer .sheet is rotated; .sheet__inner is the unrotated measuring space. */
export function Sheet(p: SheetProps) {
  const light = useRef<HTMLElement>(null);
  useEffect(() => (light.current ? registerLight(light.current) : undefined), []);
  const Tag = (p.as ?? 'section') as 'section';
  return (
    <Tag
      id={p.id}
      ref={p.sectionRef as Ref<HTMLElement>}
      className={`sheet-section ${p.className ?? ''}`}
      aria-labelledby={p.labelledBy}
      data-sheet={p.n}
    >
      <div className="sheet-wrap" ref={p.wrapRef}>
        <div className="sheet" ref={p.sheetRef} style={{ '--rot': `${p.rot}deg` } as CSSProperties}>
          <div className="sheet__shadow" ref={p.shadowRef} aria-hidden="true" />
          <div className="sheet__paper" aria-hidden="true">
            <div className="sheet__light">
              <i ref={light} />
            </div>
          </div>
          <div className="sheet__inner" ref={p.innerRef}>
            {!p.noHead && <RunningHead center={p.center ?? 'sameGame'} />}
            {p.children}
            <GalleyLabel n={p.n} next={p.next} />
          </div>
        </div>
      </div>
      {p.after}
    </Tag>
  );
}

/**
 * Splits a sentence into word spans (for printing in, measuring and staggering).
 * brD / brM: word indexes after which a desktop / compact line break goes.
 */
export function Words({
  text,
  refs,
  className = 'w',
  tone,
  brD = [],
  brM = [],
}: {
  text: string;
  refs?: MutableRefObject<HTMLElement[]>;
  className?: string;
  tone?: (word: string, i: number) => string | undefined;
  brD?: number[];
  brM?: number[];
}) {
  const words = text.split(' ');
  if (refs) refs.current = [];
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span
            className={`${className}${tone?.(w, i) ? ` ${tone(w, i)}` : ''}`}
            ref={(el) => {
              if (el && refs) refs.current[i] = el;
            }}
          >
            {w}
          </span>
          {i < words.length - 1 && (brD.includes(i) || brM.includes(i)) ? (
            <>
              {' '}
              {brD.includes(i) && <br className="br-d" />}
              {brM.includes(i) && <br className="br-m" />}
            </>
          ) : i < words.length - 1 ? (
            ' '
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

/** Caret ‸ as a drawn mark. */
export function CaretMark({ pathRef, className = '' }: { pathRef?: Ref<SVGPathElement>; className?: string }) {
  return (
    <span className={`caret ${className}`} aria-hidden="true">
      <svg viewBox="0 0 18 15" focusable="false">
        <path ref={pathRef} d="M2 13.5 L9 1.5 L16 13.5" />
      </svg>
    </span>
  );
}

/** The dele mark (delete), drawn in the margin. */
export function DeleMark({ pathRef, className = '' }: { pathRef?: Ref<SVGPathElement>; className?: string }) {
  return (
    <svg className={`dele ${className}`} viewBox="0 0 24 26" aria-hidden="true" focusable="false">
      <path
        ref={pathRef}
        d="M15,1.5C15.5,8,14.5,14,11.5,18.5C8.5,23,2.5,22.5,2.8,17.6C3.1,12.8,10.8,12.4,13.6,17C15.4,20,17.4,23.4,21.5,23.2"
      />
    </svg>
  );
}
