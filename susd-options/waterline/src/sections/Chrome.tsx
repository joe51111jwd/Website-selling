import { useEffect, useRef, type MouseEvent } from 'react';
import { COPY, UI } from '../copy';
import { LINKS } from '../links';
import { engine } from '../engine/engine';

/** "Scaling Up-Side-Down" with the first hyphen in Up green and the second in Side ochre. */
export function Title() {
  const [a, b, c] = COPY.rail.title.split('-');
  return (
    <>
      {a}
      <span className="hy-up">-</span>
      {b}
      <span className="hy-side">-</span>
      {c}
    </>
  );
}

export function toPaths(e: MouseEvent<HTMLAnchorElement>) {
  const el = document.getElementById('paths');
  if (!el) return;
  e.preventDefault();
  engine.scrollTo(el, engine.reduced);
  history.replaceState(null, '', '#paths');
}

function Actions() {
  return (
    <>
      <a className="link-book" href="#paths" onClick={toPaths}>
        {COPY.rail.book}
      </a>
      <a className="btn btn-ink btn-nav" href="#paths" onClick={toPaths}>
        <span className="nav-get">{COPY.rail.get}</span>
        <span className="nav-sub">{COPY.rail.getSub}</span>
      </a>
    </>
  );
}

/**
 * The rail: fixed for the whole page, so both paths are always one click away. It reads the water:
 * paper behind it while the water is low (anything scrolling under it is hidden), clear when the
 * surface reaches it, cream type once it is under water. A hairline appears where normal-flow
 * content starts to scroll beneath it.
 */
export function Rail() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let solidFrom = 0;
    let last = '';
    const measure = () => {
      const y = window.scrollY;
      const cycle = document.getElementById('cycle');
      if (cycle && !engine.reduced) {
        const r = cycle.getBoundingClientRect();
        solidFrom = r.bottom + y - window.innerHeight - 8;
      } else solidFrom = 8;
    };
    /** The topmost water surface under the rail, in viewport px (Infinity when there is none). */
    const waterTop = () => {
      if (!engine.reduced) return engine.started ? engine.model.level.value - 6 : Infinity;
      let top = Infinity;
      document.querySelectorAll<HTMLElement>('[data-block]').forEach((b) => {
        if (!b.dataset.level || b.querySelector(':scope > .block-water') === null) return;
        const r = b.getBoundingClientRect();
        if (r.bottom < 60 || r.top > 60) return;
        top = Math.min(top, r.top + Number(b.dataset.level));
      });
      return top;
    };
    const apply = () => {
      const y = window.scrollY;
      const w = waterTop();
      const clear = w < 64;
      const wet = w < 30;
      const solid = !clear && y > solidFrom;
      const sig = `${clear ? 1 : 0}${wet ? 1 : 0}${solid ? 1 : 0}`;
      if (sig === last) return;
      last = sig;
      el.dataset.clear = clear ? '1' : '0';
      el.dataset.wet = wet ? '1' : '0';
      el.dataset.solid = solid ? '1' : '0';
    };
    measure();
    apply();
    const ro = new ResizeObserver(() => {
      measure();
      apply();
    });
    ro.observe(document.body);
    window.addEventListener('scroll', apply, { passive: true });
    const off = engine.onFrame(apply);
    return () => {
      ro.disconnect();
      off();
      window.removeEventListener('scroll', apply);
    };
  }, []);
  return (
    <header className="rail" ref={ref} data-clear="0" data-wet="0" data-solid="0">
      <a className="rail-title" href="#thesis" aria-label={COPY.rail.title}>
        <Title />
      </a>
      <nav className="rail-actions" aria-label={UI.pathsLabel}>
        <Actions />
      </nav>
    </header>
  );
}

export function Footer() {
  const words = COPY.footer.line.split(' ');
  return (
    <footer className="footer">
      <p className="footer-line">
        {words.map((w, i) => (
          <span key={i} className={['c-up', 'c-side', 'c-down', 'c-ink'][i]}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
      <p className="footer-meta">
        <span className="footer-title">
          <Title />
        </span>
        <span className="footer-dot">·</span>
        <span>{COPY.rail.author}</span>
        <span className="footer-dot">·</span>
        <a href={LINKS.appendix}>{COPY.paths.appendix}</a>
      </p>
    </footer>
  );
}
