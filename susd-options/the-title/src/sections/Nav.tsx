import { useEffect, useState } from 'react';
import { COPY } from '../copy';
import { goTo, goToPath } from '../scroll';
import { Lockup } from './Repeat';

interface Props {
  narrow: boolean;
}

/** The top rail (in the hero), the desktop bar after the hero, and the phone bottom bar. */
export function Nav({ narrow }: Props) {
  const [past, setPast] = useState(false);
  const [inSkip, setInSkip] = useState(false);
  const [atPaths, setAtPaths] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('top');
    const skip = document.getElementById('skip');
    const paths = document.getElementById('paths');
    const ios: IntersectionObserver[] = [];
    if (hero) {
      const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting), { threshold: 0, rootMargin: '-64px 0px' });
      io.observe(hero);
      ios.push(io);
    }
    if (skip) {
      // ratio > 0, with a second threshold: at load #skip's top sits exactly on the viewport's bottom edge,
      // and an edge-touching first callback must not leave the bar showing over the hold control
      const io = new IntersectionObserver(([e]) => setInSkip(e.intersectionRatio > 0), { threshold: [0, 0.01] });
      io.observe(skip);
      ios.push(io);
    }
    if (paths) {
      const io = new IntersectionObserver(([e]) => setAtPaths(e.isIntersecting), { threshold: 0.25 });
      io.observe(paths);
      ios.push(io);
    }
    return () => ios.forEach((io) => io.disconnect());
  }, []);

  const to = (ev: React.MouseEvent) => {
    ev.preventDefault();
    goToPath('file');
  };
  const toBook = (ev: React.MouseEvent) => {
    ev.preventDefault();
    goToPath('book');
  };
  const top = (ev: React.MouseEvent) => {
    ev.preventDefault();
    goTo('#top');
  };

  const barOn = past && !narrow;
  const bottomOn = past && narrow && !inSkip && !atPaths;

  return (
    <header className="site-header">
      <div className="rail">
        <span className="rail-author caps">{COPY.rail.author}</span>
        <nav className="rail-nav" aria-label="Primary">
          {!narrow && (
            <a className="rail-link" href="#paths" onClick={toBook}>
              {COPY.rail.book}
            </a>
          )}
          {/* a text link, like "The book": the hero's own button is the one solid "Get the Bootloader" on this screen */}
          <a className={narrow ? 'rail-link rail-link--caps caps' : 'rail-link rail-link--get'} href="#paths" onClick={to}>
            {COPY.rail.get}
          </a>
        </nav>
      </div>
      {!narrow && (
        <div className={`bar ${barOn ? 'on' : ''}`} aria-hidden={!barOn}>
          <a className="bar-home" href="#top" onClick={top} tabIndex={barOn ? 0 : -1} aria-label={COPY.paths.bookTitle}>
            <Lockup className="lockup--bar" />
          </a>
          <span className="bar-nav">
            <a className="rail-link" href="#paths" onClick={toBook} tabIndex={barOn ? 0 : -1}>
              {COPY.rail.book}
            </a>
            <a className="pill pill--ink pill--sm" href="#paths" onClick={to} tabIndex={barOn ? 0 : -1}>
              {COPY.rail.get}
            </a>
          </span>
        </div>
      )}
      {narrow && (
        <div className={`bottom-bar ${bottomOn ? 'on' : ''}`} aria-hidden={!bottomOn}>
          <a className="pill pill--ink" href="#paths" onClick={to} tabIndex={bottomOn ? 0 : -1}>
            {COPY.rail.get}
          </a>
          <a className="pill pill--line" href="#paths" onClick={toBook} tabIndex={bottomOn ? 0 : -1}>
            {COPY.rail.book}
          </a>
        </div>
      )}
    </header>
  );
}
