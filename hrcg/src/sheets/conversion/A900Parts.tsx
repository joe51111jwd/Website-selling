// A-900 parts (brief 3.12): Notes, ImageryNotes, RollCall, Contact (the email), Close (the end line
// and the two CTA cells), FooterBlock. Owner: A6. Text only, on paper. No motion except the
// roll-call ink-in (400 ms, once each sheet has been in view).
// Director decisions (FIXLIST-1 §8): H-7, the general notes print open like drawing notes (headings
// and paragraphs, no accordion), two ruled columns at >= 1024 px; H-6, the end line at statement
// size with the strip's two CTA cells beside it (under it on phones), and the email at
// clamp(28px, 4vw, 56px).

import { Fragment, useRef, type MouseEvent } from 'react';
import { LabelText } from '../../chrome/LabelText';
import { HoldCloud } from '../../marks/HoldCloud';
import { InPageIndex, hasTheSet } from '../../chrome/SheetIndex';
import { overlays } from '../../chrome/overlays';
import { navClick } from '../../chrome/nav';
import { INDEX, STRIP } from '../../content/copy/chrome';
import { HASNT_HAPPENED } from '../../content/viewTitles';
import { CHALLENGES } from '../../content/challenges';
import { CONTACT_EMAIL } from '../../content/config';
import { NOTES } from '../../content/copy/conversion';
import { media, isMockManifest } from '../../media/manifest';
import { useSheet } from '../../system/sheetStore';
import { buildMailto } from '../../lib/mailto';
import { CopyButton } from './FormParts';

/** The six general notes, printed open (H-7): a numbered heading and its answer, no disclosure. */
export function Notes() {
  return (
    <ol className="notes">
      {NOTES.notes.map((n, i) => (
        <li key={n.q} className="note">
          <h3 className="note-q">
            <span className="note-num num">{`${i + 1}.`}</span>
            <span className="note-q-text">{n.q}</span>
          </h3>
          <p className="note-a t-body">{n.a}</p>
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
  // The link says "(0:30)": show it only for the real 30-second film, never for a placeholder clip.
  const realSet = hasTheSet() && !isMockManifest && (set?.dur ?? 0) >= 25;
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
      {realSet && setSrc ? (
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

/**
 * The close (H-6, F-094): THIS HASN'T HAPPENED YET. at statement size on its own ruled row,
 * directly above the title block and on its left edge, with the strip's two CTA cells (same copy,
 * same targets) beside it at >= 1024 px and under it below.
 */
export function Close() {
  return (
    <div className="a900-close">
      <p className="end-line">{HASNT_HAPPENED}</p>
      <ul className="close-ctas">
        <li>
          <a className="close-cta" href="#a-300" onClick={navClick(true)}>
            <span className="close-cta-label">{STRIP.teamsLabel}</span>
            <span className="close-cta-value">{STRIP.teamsValue}</span>
          </a>
        </li>
        <li>
          <a className="close-cta" href="#a-301" onClick={navClick(true)}>
            <span className="close-cta-label">{STRIP.sponsorsLabel}</span>
            <span className="close-cta-value">{STRIP.sponsorsValue}</span>
          </a>
        </li>
      </ul>
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
  // The block brings its own paper ground and margins, so it reads the same inside A-900 or as the
  // page's <footer> after </main> (F-066 / F-100).
  return (
    <footer className="title-block" data-ground="gypsum">
      <div className="sheet-inner">
        <dl className="tb" data-lint-group="">
          {cells.map(([label, v]) => (
            <div key={label} className={`tb-cell tb-cell--${label.toLowerCase()}`}>
              <dt className="tb-label">{label}</dt>
              <dd className="tb-value">{value(label, v)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </footer>
  );
}
