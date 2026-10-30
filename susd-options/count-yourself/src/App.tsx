import { useEffect } from 'react';
import { COPY, UI } from './copy';
import { sentencesOf } from './components/Text';
import { LINKS } from './links';
import { PARAMS, syncTeamParam } from './params';
import { Field } from './components/Field';
import { Chip, BottomBar, Announcer } from './components/Chrome';
import { Hero } from './sections/Hero';
import { MeterSection } from './sections/MeterSection';
import { Cycle } from './sections/Cycle';
import { Paths } from './sections/Paths';
import { getState, setN, setState, subscribe } from './state/store';
import { drum } from './state/drum';
import { playIntro } from './intro';
import { fontsReady } from './motion/timeline';
import { goPaths } from './nav';
import { useMedia, PHONE } from './hooks/useMedia';
import { prefersReducedMotion } from './hooks/useReducedMotion';

/** One sentence of the provenance paragraph (BL 51), with the book's title set in italics. */
function Titled({ text }: { text: string }) {
  const title = COPY.rail.title;
  const at = text.indexOf(title);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em>{title}</em>
      {text.slice(at + title.length)}
    </>
  );
}

/**
 * Who wrote it, before the two paths: the credential (BL 51, first sentence) large, then where the book
 * came from (second sentence), quieter. Same words, same order.
 */
function About() {
  const [cred, ...more] = sentencesOf(COPY.footer.bio);
  return (
    <section id="about" className="about" aria-labelledby="about-h">
      <h2 id="about-h" className="about-kick">
        {COPY.footer.authorLabel}
      </h2>
      <p className="about-cred">
        <Titled text={cred} />
      </p>
      <p className="about-more">
        <Titled text={more.join(' ')} />
      </p>
    </section>
  );
}

let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  const final = PARAMS.team ?? 8;
  if ('scrollRestoration' in history) history.scrollRestoration = PARAMS.section ? 'auto' : 'manual';
  const skip = prefersReducedMotion() || PARAMS.team !== null || PARAMS.section !== null;
  if (skip) {
    drum.n.jump(final);
    setN(final, 'init');
    // A shared ?team= link is the visitor's own number.
    setState({ phase: 'ready', touched: PARAMS.team !== null });
    if (PARAMS.section) {
      const id = PARAMS.section;
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' }));
    }
  } else {
    window.scrollTo(0, 0);
    void playIntro(final);
  }
  // Let offscreen sections skip rendering, once each has been laid out at its real size (see base.css).
  void fontsReady(1200).then(() =>
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('cv'))),
  );
  // Keep ?team=n in the URL once the visitor sets it.
  subscribe(() => {
    const s = getState();
    if (s.phase === 'ready' && ['user', 'bar', 'button'].includes(s.change.from)) syncTeamParam(s.n);
  });
  // Android only: one 10 ms tick when the visitor crosses into the Graveyard.
  subscribe(() => {
    const { change } = getState();
    if (change.from === 'user' && change.n === 15 && change.prev === 14 && /Android/i.test(navigator.userAgent)) navigator.vibrate?.(10);
  });
}

export function App() {
  const phone = useMedia(PHONE);
  useEffect(boot, []);
  return (
    <>
      <Field />
      <header className="rail">
        <a className="rail-title hit44" href="#top">
          <svg className="mark" viewBox="0 0 20 18" aria-hidden="true">
            <rect x="0" y="0" width="17" height="4.6" rx="0.8" fill="#2B5A37" />
            <rect x="2.6" y="6.7" width="17" height="4.6" rx="0.8" fill="#D49B2C" />
            <rect x="0" y="13.4" width="17" height="4.6" rx="0.8" fill="#B2322A" />
          </svg>
          <span className="rail-book">{COPY.rail.title}</span>
        </a>
        {!phone && (
          <nav className="rail-nav" aria-label={COPY.rail.title}>
            <a href="#paths" className="rail-link" onClick={goPaths}>
              {COPY.rail.book}
            </a>
            <a href="#paths" className="pill pill-solid pill-sm" onClick={goPaths}>
              {COPY.rail.get}
            </a>
          </nav>
        )}
      </header>
      {/* Phone: the sticky bar comes straight after the header in the DOM, so it is reachable in order
          while it shows (it is position: fixed, so nothing moves). */}
      {phone && <BottomBar />}
      <main>
        <Hero phone={phone} />
        <MeterSection phone={phone} />
        <Cycle phone={phone} />
        <About />
        <Paths />
      </main>
      <footer className="foot">
        <p className="foot-meta">
          <a className="hit44" href={LINKS.appendix}>
            {COPY.paths.appendix}
            <span className="appx-note">
              <i className="dot" aria-hidden="true">
                ·
              </i>
              {UI.appendixNote}
            </span>
          </a>
          <span className="foot-sig">
            {COPY.rail.title}{' '}
            <i className="dot" aria-hidden="true">
              ·
            </i>{' '}
            {COPY.rail.author}
          </span>
        </p>
      </footer>
      {/* The desktop chip comes last in the DOM, so it is the last tab stop whenever it shows. */}
      {!phone && <Chip />}
      <Announcer />
    </>
  );
}
