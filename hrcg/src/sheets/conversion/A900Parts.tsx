// A-900 parts (brief 3.12): Notes, ImageryNotes, RollCall, Contact (the email), FooterBlock.
// Owner: A6. Text only, on paper. No motion except the native <details> opening and the roll-call
// ink-in (400 ms, once each sheet has been in view).

import { Fragment, useRef, type MouseEvent } from 'react';
import { LabelText } from '../../chrome/LabelText';
import { HoldCloud } from '../../marks/HoldCloud';
import { InPageIndex, hasTheSet } from '../../chrome/SheetIndex';
import { overlays } from '../../chrome/overlays';
import { navClick } from '../../chrome/nav';
import { INDEX } from '../../content/copy/chrome';
import { CHALLENGES } from '../../content/challenges';
import { CONTACT_EMAIL } from '../../content/config';
import { NOTES } from '../../content/copy/conversion';
import { media } from '../../media/manifest';
import { useSheet } from '../../system/sheetStore';
import { buildMailto } from '../../lib/mailto';
import { CopyButton } from './FormParts';

export function Notes() {
  return (
    <ol className="notes">
      {NOTES.notes.map((n, i) => (
        <li key={n.q} className="note">
          <details className="note-details">
            <summary className="note-summary">
              <span className="note-num num">{`${i + 1}.`}</span>
              <span className="note-q">{n.q}</span>
              <span className="note-arrow" aria-hidden="true">
                →
              </span>
            </summary>
            <p className="note-a t-body">{n.a}</p>
          </details>
        </li>
      ))}
    </ol>
  );
}

export function ImageryNotes() {
  return (
    <div className="imagery">
      <p className="imagery-title t-label">{NOTES.imageryTitle}</p>
      <dl className="imagery-list">
        {NOTES.imagery.map((r) => (
          <div key={r.k} className="imagery-row">
            <dt className="imagery-k t-label">
              <LabelText text={r.k} />
            </dt>
            <dd className="imagery-v">{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** LAY BRICK. HANG DRYWALL. BOLT IT. RUN THE PIPE. MARK IT OUT. Inked per visited sheet. */
export function RollCall() {
  const { visited } = useSheet();
  return (
    <ol className="rollcall" aria-label={NOTES.rollCallLabel}>
      {CHALLENGES.map((c) => {
        const inked = visited.has(c.sheet);
        return (
          <li key={c.no} className={`rollcall-row${inked ? ' is-inked' : ''}`}>
            <a className="rollcall-link" href={`#${c.sheet.toLowerCase()}`} onClick={navClick(true)}>
              <span className="rollcall-num num" aria-hidden="true">
                {c.sheet}
              </span>
              <span className="rollcall-verb t-rollcall">{c.verb}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

const PLAIN = buildMailto('plain');

export function Contact() {
  const addr = useRef<HTMLAnchorElement>(null);
  const set = media['the-set-169'];
  const setSrc = set?.sources?.[set.sources.length - 1]?.src;
  return (
    <div className="contact">
      <p className="contact-closing t-lead">{NOTES.closing}</p>
      <p className="contact-email-line">
        <a ref={addr} className="contact-email t-email" href={PLAIN}>
          {CONTACT_EMAIL}
        </a>
      </p>
      <p className="contact-copy">
        <CopyButton target={() => addr.current} />
      </p>
      {hasTheSet() && setSrc ? (
        <p className="contact-film">
          <a
            className="cell-button contact-film-link"
            href={setSrc}
            onClick={(e: MouseEvent<HTMLAnchorElement>) => {
              if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              overlays.open('the-set', e.currentTarget);
            }}
          >
            <span>
              <LabelText text={INDEX.watchTheSet} />
            </span>
          </a>
        </p>
      ) : null}
    </div>
  );
}

function rows(): Array<[string, string]> {
  return NOTES.block.split('\n').map((line) => {
    const i = line.indexOf('|');
    return [line.slice(0, i), line.slice(i + 1)];
  });
}

/** The full-width title block (footer), with the in-page drawing index (brief 3.12, 3.1). */
export function FooterBlock() {
  const cells = rows();
  const value = (label: string, v: string) => {
    switch (label) {
      case 'CHALLENGES':
        return (
          <span className="tb-challenges">
            {CHALLENGES.map((c, i) => (
              <Fragment key={c.no}>
                <span className="tb-challenge">
                  <span className="num">{c.num}</span> {c.name}
                </span>
                {i < CHALLENGES.length - 1 ? <span className="tb-sep">{NOTES.challengeSep}</span> : null}
              </Fragment>
            ))}
          </span>
        );
      case 'CONTACT':
        return <a href={PLAIN}>{CONTACT_EMAIL}</a>;
      case 'INDEX':
        return <InPageIndex className="tb-index" title={false} />;
      case 'DATE':
      case 'VENUE': {
        // "Hold." inside a revision cloud (A3's HoldCloud, brief 5.5), then the rest of the sentence
        const i = v.indexOf('. ');
        const head = i > 0 ? v.slice(0, i + 1) : v;
        const tail = i > 0 ? v.slice(i + 2) : '';
        return (
          <span className="tb-holdline">
            <HoldCloud width={58} height={30} tag={null} flat className="tb-cloud">
              {head}
            </HoldCloud>{' '}
            <span>{tail}</span>
          </span>
        );
      }
      case 'YEAR':
      case 'SHEET':
        return (
          <span>
            <LabelText text={v} />
          </span>
        );
      default:
        return v;
    }
  };
  return (
    <footer className="title-block">
      <dl className="tb" data-lint-group="">
        {cells.map(([label, v]) => (
          <div key={label} className={`tb-cell tb-cell--${label.toLowerCase()}`}>
            <dt className="tb-label">{label}</dt>
            <dd className="tb-value">{value(label, v)}</dd>
          </div>
        ))}
      </dl>
    </footer>
  );
}
