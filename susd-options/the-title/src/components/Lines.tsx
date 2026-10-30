// Typesetting helpers for verbatim sentences. They never change a word: they only decide where a
// line may break, so the copy in copy.ts stays exactly as Michael wrote it.

/** Split a verbatim string into its sentences, in order. */
export function sentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+(?=\S)/g, '$1\u0000')
    .split('\u0000')
    .filter(Boolean);
}

/** Keeps an em dash at the end of a line, never the start of one: "word—" is unbreakable, the break comes after it. */
export function DashLine({ text }: { text: string }) {
  const i = text.indexOf('—');
  if (i < 0) return <>{text}</>;
  const head = text.slice(0, i);
  const sp = head.lastIndexOf(' ');
  return (
    <>
      {head.slice(0, sp + 1)}
      <span className="nowrap">{head.slice(sp + 1)}—</span>
      <wbr />
      {text.slice(i + 1)}
    </>
  );
}

/** The same rule for text set imperatively (the section 02 caption). */
export function setDashText(el: HTMLElement, text: string) {
  const i = text.indexOf('—');
  if (i < 0) {
    el.textContent = text;
    return;
  }
  const head = text.slice(0, i);
  const sp = head.lastIndexOf(' ');
  const nw = document.createElement('span');
  nw.className = 'nowrap';
  nw.textContent = `${head.slice(sp + 1)}—`;
  el.textContent = '';
  el.append(head.slice(0, sp + 1), nw, document.createElement('wbr'), text.slice(i + 1));
}

/** Each sentence of a verbatim string on its own line, in order (brief S2 allows this). */
export function Sentences({ text, className = '' }: { text: string; className?: string }) {
  const parts = sentences(text);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          <span className={`sent ${className}`}>
            <DashLine text={p} />
          </span>
          {i < parts.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}

/** Keep each comma clause of a sentence together ("Four for Scaling Up," never splits). Breaks fall between clauses. */
export function Clauses({ text }: { text: string }) {
  const parts = splitClauses(text);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          <span className="clause">{p}</span>
          {i < parts.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}

function splitClauses(text: string): string[] {
  // split after ", " and after ". " so every clause (and the closing "Twelve.") is its own unbreakable unit
  return text
    .replace(/([,.])\s+(?=\S)/g, '$1\u0000')
    .split('\u0000')
    .filter(Boolean);
}
