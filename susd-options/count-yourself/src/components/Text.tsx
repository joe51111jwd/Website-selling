import { Fragment } from 'react';

// Ranges and terms that must never break across lines ("n-1", "15-16", "1-12", "40+"). The text itself
// is unchanged; only the matching runs are wrapped in a no-wrap span.
const KEEP = /(\b\d+-\d+\b|\bn-1\b|\b\d+\+)/g;

/** Typesetting only (the words never change): no-wrap ranges, and a no-break space before an em dash. */
export function T({ children }: { children: string }) {
  const parts = children.replace(/ —/g, ' —').split(KEEP);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} className="nw">
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

// A sentence ends at . ! or ? (optionally followed by a closing quote) and the next starts with a
// capital, a digit or an opening quote.
const SPLIT = /(?<=[.!?][”’"]?)\s+(?=[A-Z0-9“‘"])/;
export const sentencesOf = (text: string) => text.split(SPLIT);

/**
 * A multi-sentence line set one sentence per span (`.s`, inline-block), so a line never breaks
 * mid-sentence when the next sentence can start a fresh line. Same words, same order.
 */
export function S({ children }: { children: string }) {
  const parts = sentencesOf(children);
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          <span className="s">
            <T>{p}</T>
          </span>
          {i < parts.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </>
  );
}
