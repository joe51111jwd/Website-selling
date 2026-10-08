// Label typography helper (brief 5.2): numerals and IDs inside labels set in JetBrains Mono.
// <LabelText text="A-103 · CHALLENGE 03 · BOLTED ASSEMBLY" /> wraps A-103 and 03 in <span class="num">.
// textContent is unchanged, so copy checks and screen readers see the plain string. Owner: A1.

import { Fragment } from 'react';

const TOKEN = /(A-\d{3}|RFI-\d{3}|HRCG-\d{4}|\bT7\b|\b\d+:\d{2}\b|\b\d+(?:[–-]\d+)?(?:-A)?\b)/g;

export function labelParts(text: string): Array<{ t: string; num: boolean }> {
  const out: Array<{ t: string; num: boolean }> = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ t: text.slice(last, i), num: false });
    out.push({ t: m[0], num: true });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), num: false });
  return out;
}

export function LabelText({ text }: { text: string }) {
  return (
    <>
      {labelParts(text).map((p, i) =>
        p.num ? (
          <span key={i} className="num">
            {p.t}
          </span>
        ) : (
          <Fragment key={i}>{p.t}</Fragment>
        ),
      )}
    </>
  );
}

export default LabelText;
