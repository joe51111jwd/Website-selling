import { useEffect, useRef, useState } from 'react';
import { COPY, UI } from '../copy';
import { useStore } from '../state/store';
import { MAX, zoneOf } from '../zones';
import { goPaths, scrollToId } from '../nav';

const zoneName = (n: number) => zoneOf(n).tag.split(' · ')[0];

/** "8 · TEAM": appears once the hero's window has left the viewport; returns you to the dial. */
export function Chip({ inBar = false }: { inBar?: boolean }) {
  const n = useStore((s) => s.n);
  const gone = useStore((s) => s.heroGone);
  const back = () => scrollToId('top', 'dial-window');
  return (
    <button type="button" className={`chip${inBar ? ' in-bar' : ''}${gone ? ' on' : ''}`} onClick={back} tabIndex={gone ? 0 : -1} aria-hidden={gone ? undefined : true} title={UI.chipTitle}>
      {/* Phone: "YOU" over the number, so a bare numeral never has to explain itself. */}
      {inBar && (
        <span className="chip-you" aria-hidden="true">
          {UI.youChip}
        </span>
      )}
      <span className="chip-n">
        {n}
        {n === MAX && (
          <svg className="chip-plus" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M5 1v8M1 5h8" />
          </svg>
        )}
      </span>
      {n === MAX && <span className="sr-only">+</span>}
      <i className={`dot${inBar ? ' sr-only' : ''}`} aria-hidden="true">·</i>
      <span className={inBar ? 'sr-only' : ''}>{zoneName(n)}</span>
    </button>
  );
}

/** Phone: a sticky bar with the two paths (and the chip once the hero is gone). Hidden over #paths. */
export function BottomBar() {
  const [hide, setHide] = useState(false);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = document.getElementById('paths');
    if (!el) return;
    // Hidden from #paths to the end of the page (the footer included).
    const io = new IntersectionObserver(([e]) => setHide(e.isIntersecting || e.boundingClientRect.top < 0), {
      rootMargin: '0px 0px -30% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // A hidden bar is out of the tab order too (visibility: hidden after the slide, and inert at once).
  useEffect(() => {
    nav.current?.toggleAttribute('inert', hide);
  }, [hide]);
  return (
    <nav ref={nav} className={`bbar${hide ? ' off' : ''}`} aria-label={UI.pathsKicker}>
      <Chip inBar />
      <a href="#paths" className="pill pill-solid bb-get" onClick={goPaths}>
        <span>{COPY.rail.get}</span>
        <span className="bb-sub">{UI.getSub}</span>
      </a>
      <a href="#paths" className="pill pill-line bb-book" onClick={goPaths}>
        <span>{COPY.rail.book}</span>
        <span className="bb-sub">{COPY.paths.preorder}</span>
      </a>
    </nav>
  );
}

/** Screen readers hear the zone when it changes, final states only, at least 600 ms apart. */
export function Announcer() {
  const n = useStore((s) => s.n);
  const phase = useStore((s) => s.phase);
  const [text, setText] = useState('');
  const last = useRef('');
  useEffect(() => {
    if (phase !== 'ready') return;
    const z = zoneOf(n);
    const t = window.setTimeout(() => {
      if (z.id === last.current) return;
      last.current = z.id;
      setText(`${z.tag}. ${z.line}`);
    }, 600);
    return () => window.clearTimeout(t);
  }, [n, phase]);
  useEffect(() => {
    if (phase === 'ready' && !last.current) last.current = zoneOf(n).id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  return (
    <p className="sr-only" aria-live="polite">
      {text}
    </p>
  );
}
