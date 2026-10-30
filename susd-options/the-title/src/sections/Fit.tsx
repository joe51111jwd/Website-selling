import { COPY } from '../copy';
import { useInViewOnce } from '../hooks/useInView';

/** "Too big to be small, too small to be big", set with scale contrast. Built from the one verbatim string;
 *  trailing punctuation stays with its word ("small," is one small token, never a big comma). */
function FitHeadline() {
  const parts = COPY.fit.headline.split(/\b(big|small)([,.;]?)/);
  const out: React.ReactNode[] = [];
  let bigs = 0;
  let smalls = 0;
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) out.push(<span key={`m${i}`} className="fh-mid">{parts[i]}</span>);
    const w = parts[i + 1];
    if (!w) continue;
    const tail = parts[i + 2] ?? '';
    if (w === 'big')
      out.push(
        <span key={`w${i}`} className={`fh-big relief relief--ink ${bigs++ === 0 ? 'fh-first' : ''}`}>
          {w}
          {tail}
        </span>,
      );
    else
      out.push(
        // phones break after "small,": two mirrored lines, "Too big to be small," / "too small to be big"
        <span key={`w${i}`} className={`fh-small ${smalls++ === 0 ? 'fh-br' : ''}`}>
          {w}
          {tail}
        </span>,
      );
  }
  return (
    <h2 id="fit-h" className="fit-headline">
      {out}
    </h2>
  );
}

export function Fit() {
  const [ref, seen] = useInViewOnce<HTMLElement>(0.3);
  return (
    <section id="fit" className={`fit ${seen ? 'on' : ''}`} ref={ref} aria-labelledby="fit-h">
      <div className="fit-inner">
        <FitHeadline />
        <div className="fit-cols">
          <div className="fit-col fit-for">
            <h3 className="fit-head caps">{COPY.fit.forHead}</h3>
            <ul>
              {COPY.fit.isFor.map((t, i) => (
                <li key={t} style={{ transitionDelay: `${i * 40}ms` }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="fit-col fit-not">
            <h3 className="fit-head caps">{COPY.fit.notHead}</h3>
            <ul>
              {COPY.fit.notFor.map((t, i) => (
                <li key={t} style={{ transitionDelay: `${(i + 3) * 40}ms` }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
