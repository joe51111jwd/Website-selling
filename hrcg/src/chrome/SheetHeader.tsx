// Sheet header (brief 3.1 + FIXLIST F-001 override): top line inside the border.
// Left: COURSE mark lockup -> #a-000. Right: INDEX, a real <a href="#index"> that JS upgrades to
// open the dialog.
// Ground (F-001): transparent only while A-000 is the current sheet (html[data-sheet], set here from
// sheetStore); everywhere else an opaque rail that takes the ground under the LOCKUP: slab, or gypsum
// (data-on="gypsum", slab-black ink) when a [data-ground="gypsum"] element crosses the header line
// within the lockup's x-range. INDEX sits on the same rail, so its ink always matches it. Owner: A1.

import { useEffect, useRef, useState } from 'react';
import { CourseMark } from './CourseMark';
import { HEADER } from '../content/copy/chrome';
import { navClick } from './nav';
import { openIndex } from './overlays';
import { onLayout } from '../system/scroll';
import { sheetStore } from '../system/sheetStore';

export function SheetHeader() {
  const ref = useRef<HTMLElement>(null);
  const [onPaper, setOnPaper] = useState(false);

  // the current sheet on <html data-sheet>: the header is transparent over A-000 only (chrome.css)
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const cur = sheetStore.get().current;
      if (root.dataset.sheet !== cur) root.dataset.sheet = cur;
    };
    sync();
    const unsub = sheetStore.subscribe(sync);
    return () => {
      unsub();
      delete root.dataset.sheet;
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    // a thin band through the header's text line, as wide as the lockup: which ground is under the logo?
    const papers = new Set<Element>();
    let io: IntersectionObserver | null = null;
    const build = () => {
      io?.disconnect();
      papers.clear();
      const header = ref.current?.getBoundingClientRect();
      const home = ref.current?.querySelector('.header-home')?.getBoundingClientRect();
      const mid = header ? header.top + header.height / 2 : 48;
      const vh = window.innerHeight;
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const left = home ? Math.max(0, Math.round(home.left)) : 0;
      const right = home ? Math.max(0, Math.round(vw - home.right)) : 0;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.intersectionRect.height > 0) papers.add(e.target);
            else papers.delete(e.target);
          }
          setOnPaper(papers.size > 0);
        },
        {
          rootMargin: `-${Math.round(mid - 4)}px -${right}px -${Math.max(0, Math.round(vh - mid - 4))}px -${left}px`,
        },
      );
      scan();
    };
    const scan = () => document.querySelectorAll('[data-ground="gypsum"]').forEach((el) => io?.observe(el));
    build();
    const offLayout = onLayout(build);
    const mo = new MutationObserver(scan);
    mo.observe(document.getElementById('main') ?? document.body, { childList: true, subtree: true });
    return () => {
      io?.disconnect();
      offLayout();
      mo.disconnect();
    };
  }, []);

  return (
    <header ref={ref} className="sheet-header" data-on={onPaper ? 'gypsum' : 'slab'}>
      <a className="header-home" href="#a-000" aria-label={HEADER.homeLabel} onClick={navClick(false)}>
        <CourseMark width={72} className="header-mark" />
        {/* spaces between the spans keep the visible text "HRCG HUMANOID ROBOT CONSTRUCTION GAMES" a
            substring of the accessible name (WCAG 2.5.3); the layout is flex, so they render nothing */}
        <span className="header-name">{HEADER.name}</span>{' '}
        <span className="header-rule" aria-hidden="true" />
        <span className="header-lines">
          <span>{HEADER.line1}</span>{' '}
          <span>{HEADER.line2}</span>
        </span>
      </a>
      <a
        className="header-index cell-button"
        href="#index"
        aria-label={HEADER.indexLabel}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.preventDefault();
          openIndex(e.currentTarget);
        }}
      >
        {HEADER.index}
      </a>
    </header>
  );
}

export default SheetHeader;
