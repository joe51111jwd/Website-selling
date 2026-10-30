import { COPY } from './copy';
import { Nav } from './sections/Nav';
import { Hero } from './sections/Hero';
import { SkipALeg } from './sections/SkipALeg';
import { Repeat } from './sections/Repeat';
import { LINKS } from './links';
import { Usd } from './sections/Usd';
import { Fit } from './sections/Fit';
import { Paths } from './sections/Paths';
import { STACK_QUERY, useMedia, useNarrow, useReducedMotion } from './hooks/useReducedMotion';
import { goToPath } from './scroll';

const params = new URLSearchParams(window.location.search);
const DEBUG_COLLAPSED = params.get('state') === 'collapsed';
const DEBUG_USD = params.get('section') === 'usd';
const START_HASH = window.location.hash.length > 1;

// The order a stranger needs: the claim (hero) → what goes wrong (02) → is this you (fit) →
// how the cycle works (repeat) → the margin proof (USD) → get it (paths).
export function App() {
  const reduced = useReducedMotion();
  const narrow = useNarrow();
  const stack = useMedia(STACK_QUERY);
  const skipIntro = reduced || params.has('skipintro') || DEBUG_COLLAPSED || DEBUG_USD || START_HASH;
  const sticky = !reduced && !narrow;
  return (
    <>
      {/* the first Tab stop: lands on the email field, like every other "Get the Bootloader" link */}
      <a
        className="skip-link"
        href="#paths"
        onClick={(ev) => {
          ev.preventDefault();
          goToPath('file');
          document.getElementById('email')?.focus({ preventScroll: true });
        }}
      >
        {COPY.rail.get}
      </a>
      <Nav narrow={narrow} />
      <main>
        <Hero narrow={narrow} stack={stack} reduced={reduced} skipIntro={skipIntro} />
        <SkipALeg narrow={narrow} reduced={reduced} debugCollapsed={DEBUG_COLLAPSED} />
        <Fit />
        <Repeat sticky={sticky} />
        <Usd sticky={sticky} reduced={reduced} debug={DEBUG_USD} />
        <Paths />
      </main>
      {/* a quiet sign-off: the cycle in one small line, then who wrote it and where to read on */}
      <footer className="footer">
        <p className="footer-line">{COPY.footer.line}</p>
        <p className="footer-meta">
          <span>{COPY.footer.author}</span>
          <span aria-hidden="true"> · </span>
          <a className="footer-link" href={LINKS.appendix}>
            {COPY.footer.appendix}
          </a>
        </p>
      </footer>
    </>
  );
}
