// INDEX overlay (brief 3.1, 4.3): a full-screen <dialog> on slab-black; Esc closes; Lenis stopped.
// Rows ink (pencil outline -> chalk fill, 400 ms) once their sheet has been in view.
// Plus <InPageIndex/>: the no-JS target <nav id="index"> that A-900's footer title block renders.
// Owner: A1.

import type { MouseEvent } from 'react';
import { Dialog } from './Dialog';
import { overlays } from './overlays';
import { INDEX } from '../content/copy/chrome';
import { SHEETS } from '../content/sheets';
import { useSheet } from '../system/sheetStore';
import { lenisScrollTo } from '../system/lenis';
import { media } from '../media/manifest';
import { LabelText } from './LabelText';
import { navClick } from './nav';

/** THE SET ships only if the manifest has it (brief 3.13). */
export function hasTheSet(): boolean {
  return Boolean(media['the-set-169']);
}

export function SheetIndex() {
  const { visited, current } = useSheet();
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href') ?? '';
    overlays.close({ restoreFocus: false });
    lenisScrollTo(href, { announce: true });
  };
  return (
    <Dialog id="index" className="index-dialog" labelledBy="index-dialog-title">
      <div className="index-panel">
        <p id="index-dialog-title" className="index-title t-label">
          <LabelText text={INDEX.title} />
        </p>
        <ol className="index-rows">
          {SHEETS.map((s) => (
            <li key={s.id}>
              <a
                className={`index-row${visited.has(s.id) ? ' is-inked' : ''}`}
                href={`#${s.anchor}`}
                aria-current={current === s.id ? 'location' : undefined}
                onClick={go}
              >
                <span className="index-num num">{s.id}</span>
                <span className="index-name">{s.indexTitle}</span>
                {s.indexSub ? <span className="index-sub t-label">{s.indexSub}</span> : null}
              </a>
            </li>
          ))}
        </ol>
        <div className="index-foot">
          {hasTheSet() ? (
            <button
              type="button"
              className="cell-button index-set"
              onClick={(e) => overlays.open('the-set', e.currentTarget)}
            >
              {INDEX.watchTheSet}
            </button>
          ) : null}
          <button type="button" className="cell-button index-close" onClick={() => overlays.close()}>
            {INDEX.close}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export interface InPageIndexProps {
  className?: string;
  /** Print the DRAWING INDEX title line above the list (default true) */
  title?: boolean;
}

/**
 * The in-page drawing index: <nav id="index">. A6 renders it inside A-900's footer title block
 * (the INDEX cell). Exactly one per page. Links Lenis-scroll with JS, plain anchors without.
 */
export function InPageIndex({ className, title = true }: InPageIndexProps) {
  const { visited } = useSheet();
  return (
    <nav id="index" className={`in-page-index ${className ?? ''}`} aria-label={INDEX.inPageLabel}>
      {title ? (
        <p className="t-label in-page-index-title">
          <LabelText text={INDEX.title} />
        </p>
      ) : null}
      <ol className="in-page-index-rows">
        {SHEETS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.anchor}`}
              className={visited.has(s.id) ? 'is-inked' : undefined}
              onClick={navClick(true)}
            >
              <span className="num">{s.id}</span> {s.indexTitle}
              {s.indexSub ? <span className="in-page-index-sub"> · {s.indexSub}</span> : null}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default SheetIndex;
