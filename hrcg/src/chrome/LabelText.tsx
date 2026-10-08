// Label typography helper (brief 5.2): numerals and IDs inside labels set in JetBrains Mono.
// <LabelText text="A-103 · CHALLENGE 03 · BOLTED ASSEMBLY" /> wraps A-103 and 03 in <span class="num">.
// FIXLIST F-061: the disclosure keywords AI-GENERATED, NOT A VENUE PLAN and NOT SPONSOR PRODUCTS are
// wrapped in <span class="nowrap">, so a label never breaks at their hyphen or between their words.
// textContent is unchanged, so copy checks and screen readers see the plain string. Owner: A1.

import { Fragment, type ReactNode } from 'react';

const TOKEN = /(A-\d{3}|RFI-\d{3}|HRCG-\d{4}|\bT7\b|\b\d+:\d{2}\b|\b\d+(?:[–-]\d+)?(?:-A)?\b)/g;
/** Disclosure keywords that must stay on one line (F-061). */
const NOWRAP = /(AI-GENERATED|NOT A VENUE PLAN|NOT SPONSOR PRODUCTS)/g;

export type LabelPart = { t: string; num: boolean; nowrap?: boolean };

function numParts(text: string, nowrap: boolean): LabelPart[] {
  const out: LabelPart[] = [];
  let last = 0;
  const push = (t: string, num: boolean) => out.push(nowrap ? { t, num, nowrap } : { t, num });
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) push(text.slice(last, i), false);
    push(m[0], true);
    last = i + m[0].length;
  }
  if (last < text.length) push(text.slice(last), false);
  return out;
}

/** Split a label into runs: `num` (mono numerals / IDs) and `nowrap` (disclosure keywords). */
export function labelParts(text: string): LabelPart[] {
  const out: LabelPart[] = [];
  let last = 0;
  for (const m of text.matchAll(NOWRAP)) {
    const i = m.index ?? 0;
    if (i > last) out.push(...numParts(text.slice(last, i), false));
    out.push(...numParts(m[0], true));
    last = i + m[0].length;
  }
  if (last < text.length) out.push(...numParts(text.slice(last), false));
  return out;
}

export function LabelText({ text }: { text: string }) {
  const parts = labelParts(text);
  const nodes: ReactNode[] = [];
  for (let i = 0; i < parts.length; ) {
    if (parts[i]!.nowrap) {
      // one <span class="nowrap"> per keyword run (its numerals, if any, keep their .num span)
      const run: LabelPart[] = [];
      const start = i;
      while (i < parts.length && parts[i]!.nowrap) run.push(parts[i++]!);
      nodes.push(
        <span key={`w${start}`} className="nowrap">
          {run.map((p, j) => (p.num ? <span key={j} className="num">{p.t}</span> : <Fragment key={j}>{p.t}</Fragment>))}
        </span>,
      );
      continue;
    }
    const p = parts[i]!;
    nodes.push(
      p.num ? (
        <span key={i} className="num">
          {p.t}
        </span>
      ) : (
        <Fragment key={i}>{p.t}</Fragment>
      ),
    );
    i++;
  }
  return <>{nodes}</>;
}

export default LabelText;
