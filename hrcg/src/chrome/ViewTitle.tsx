// <ViewTitle> (brief 3.2): the ONE way to print a view title. Owner: A1.
//
//   <ViewTitle id="a101-plan"><LoopVideo id="plan-b40" /></ViewTitle>
//   <ViewTitle view="PERSPECTIVE 03-A" kind="film"><LoopVideo id="el-c32" /></ViewTitle>
//   <ViewTitle id="hero-film" captionClassName="hero-vt" />          // caption only, positioned by you
//   <ViewTitle media="plan-b40"><LoopVideo id="plan-b40" /></ViewTitle> // title from the manifest entry
//
// With children it renders <figure class="view"> -> hairline frame (children) -> <figcaption> title
// underlined, NTS right-aligned. Without children it renders just the caption (position it yourself
// with captionClassName). Media inside report FILM UNAVAILABLE · POSTER SHOWN beside the title.

import { useCallback, useMemo, useState, type ReactNode, type ElementType, type CSSProperties } from 'react';
import {
  VIEW_TITLES,
  viewTitleText,
  isKnownViewTitle,
  NTS,
  type ViewKind,
  type ViewTitleId,
  type ViewTitleSpec,
} from '../content/viewTitles';
import { ViewContext, type ViewContextValue } from '../system/viewContext';
import { media } from '../media/manifest';
import { LabelText } from './LabelText';

type SpecProps =
  | { id: ViewTitleId; media?: never; view?: never; kind?: never; suffix?: never; hasntHappened?: never }
  /** take the title from the manifest entry's viewTitle (A5 sets viewTitle.id to a VIEW_TITLES key) */
  | { media: string; id?: never; view?: never; kind?: never; suffix?: never; hasntHappened?: never }
  | { id?: never; media?: never; view: string; kind: ViewKind; suffix?: string; hasntHappened?: boolean };

export type ViewTitleProps = SpecProps & {
  children?: ReactNode;
  /** Root element (default 'figure' with children, 'p' without) */
  as?: ElementType;
  className?: string;
  captionClassName?: string;
  /** Wrap children in the 1px hairline frame (default true) */
  frame?: boolean;
  /** Print NTS on the rule (default true) */
  nts?: boolean;
  /** id for the caption element (aria-describedby targets) */
  captionId?: string;
  style?: CSSProperties;
};

const warned = new Set<string>();

function specFor(props: SpecProps): ViewTitleSpec {
  if (props.id) return VIEW_TITLES[props.id] as ViewTitleSpec;
  if (props.media) {
    const vt = media[props.media]?.viewTitle;
    if (vt?.id && vt.id in VIEW_TITLES) return VIEW_TITLES[vt.id as ViewTitleId] as ViewTitleSpec;
    if (vt) return vt as ViewTitleSpec;
    if (import.meta.env.DEV) console.error(`[HRCG] <ViewTitle media="${props.media}">: no such manifest entry`);
    return { view: props.media.toUpperCase(), kind: 'film' };
  }
  return { view: props.view!, kind: props.kind!, suffix: props.suffix, hasntHappened: props.hasntHappened };
}

export function ViewTitle(props: ViewTitleProps) {
  const { children, as, className, captionClassName, frame = true, nts = true, captionId, style } = props;
  const spec: ViewTitleSpec = specFor(props);
  const text = viewTitleText(spec);

  if (import.meta.env.DEV && !props.id && !isKnownViewTitle(text) && !warned.has(text)) {
    warned.add(text);
    console.warn(`[HRCG] view title not in src/content/viewTitles.ts: "${text}". Add it to the table (A1).`);
  }

  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const setStatus = useCallback((key: string, status: string) => {
    setStatuses((prev) => {
      if ((prev[key] ?? '') === status) return prev;
      const next = { ...prev };
      if (status) next[key] = status;
      else delete next[key];
      return next;
    });
  }, []);
  const ctx = useMemo<ViewContextValue>(() => ({ kind: spec.kind, text, setStatus }), [spec.kind, text, setStatus]);
  const status = Object.values(statuses)[0] ?? '';

  const caption = (Tag: ElementType) => (
    <Tag className={`view-title ${captionClassName ?? ''}`} id={captionId} data-view-kind={spec.kind}>
      <span className="view-title-text">
        <LabelText text={text} />
      </span>
      {status ? <span className="view-title-status">{status}</span> : null}
      {nts ? (
        <span className="view-title-nts" aria-hidden="true">
          {NTS}
        </span>
      ) : null}
    </Tag>
  );

  if (children === undefined || children === null) {
    const Root = as ?? 'p';
    return (
      <ViewContext.Provider value={ctx}>
        {caption(Root)}
      </ViewContext.Provider>
    );
  }

  const Root = as ?? 'figure';
  const isFigure = Root === 'figure';
  return (
    <ViewContext.Provider value={ctx}>
      <Root className={`view ${className ?? ''}`} data-view-kind={spec.kind} style={style}>
        {frame ? <div className="view-frame">{children}</div> : children}
        {caption(isFigure ? 'figcaption' : 'p')}
      </Root>
    </ViewContext.Provider>
  );
}

export default ViewTitle;
