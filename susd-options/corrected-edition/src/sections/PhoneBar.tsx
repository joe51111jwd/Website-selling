import { useEffect, useState } from 'react';
import { COPY, EXTRA } from '../copy';
import { useCompact } from '../hooks/media';
import { goToBook, goToFile } from '../nav';

// Phone and tablet: a slim bar on the desk colour once the hero's own buttons have scrolled away;
// it hides on sheet 06, where both paths are on screen.
export function PhoneBar() {
  const compact = useCompact();
  const [pastHero, setPastHero] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    if (!compact) return;
    const acts = document.querySelector('#top .actions');
    const end = document.getElementById('paths');
    const ios: IntersectionObserver[] = [];
    if (acts) {
      const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
      io.observe(acts);
      ios.push(io);
    }
    if (end) {
      const io = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting || e.boundingClientRect.top < 0), { threshold: 0, rootMargin: '0px 0px -20% 0px' });
      io.observe(end);
      ios.push(io);
    }
    return () => ios.forEach((io) => io.disconnect());
  }, [compact]);
  if (!compact) return null;
  const on = pastHero && !atEnd;
  return (
    <nav className={`phonebar${on ? ' is-on' : ''}`} aria-label={COPY.head.title}>
      <a className="phonebar__get sc" href="#file" onClick={goToFile} tabIndex={on ? 0 : -1}>
        {COPY.head.get}
      </a>
      <a className="phonebar__book sc" href="#book" onClick={goToBook} tabIndex={on ? 0 : -1}>
        {EXTRA.bookShort}
      </a>
    </nav>
  );
}
