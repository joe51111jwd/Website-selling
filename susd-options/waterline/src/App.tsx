import { useEffect, useRef } from 'react';
import { UI } from './copy';
import { engine } from './engine/engine';
import { useReducedMotion } from './hooks/useReducedMotion';
import { Tide } from './sections/Tide';
import { Turn } from './sections/Turn';
import { Cycle } from './sections/Cycle';
import { Paths } from './sections/Paths';
import { StaticStory } from './sections/StaticStory';
import { Footer, Rail } from './sections/Chrome';

export function App() {
  const reduced = useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const css = useRef<HTMLDivElement>(null);
  const booted = useRef(reduced);

  useEffect(() => {
    engine.boot({ canvas: canvas.current, css: css.current, reduced });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Switching motion preference mid-visit: start clean in the other mode.
    if (reduced !== booted.current) window.location.reload();
  }, [reduced]);

  return (
    <>
      <a className="skip" href="#paths">
        {UI.skip}
      </a>
      {!reduced && (
        <div className="water" aria-hidden="true">
          <canvas className="water-gl" ref={canvas} />
          <div className="water-css" ref={css}>
            <svg preserveAspectRatio="none" focusable="false">
              <path className="wave-fill" />
              <path className="wave-edge" />
            </svg>
            <div className="water-body" />
          </div>
        </div>
      )}
      <Rail />
      <main className={reduced ? 'is-static' : ''}>
        {reduced ? (
          <StaticStory />
        ) : (
          <>
            <Tide />
            <Turn />
            <Cycle />
          </>
        )}
        <Paths reduced={reduced} />
      </main>
      <Footer />
    </>
  );
}
