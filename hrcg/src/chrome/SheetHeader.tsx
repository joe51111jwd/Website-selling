// Sheet header (brief 3.1): top line inside the border, transparent over media.
// Left: COURSE mark lockup -> #a-000. Right: INDEX, a real <a href="#index"> that JS upgrades to
// open the dialog. Text inverts to slab-black while a gypsum sheet is under it. Owner: A1.

import { useEffect, useRef, useState } from 'react';
import { CourseMark } from './CourseMark';
import { HEADER } from '../content/copy/chrome';
import { navClick } from './nav';
import { openIndex } from './overlays';
import { onLayout } from '../system/scroll';

export function SheetHeader() {
  const ref = useRef<HTMLElement>(null);
  const [onPaper, setOnPaper] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    // a thin band through the header's text line: which ground is under the header?
    const papers = new Set<Element>();
    let io: IntersectionObserver | null = null;
    const build = () => {
      io?.disconnect();
      papers.clear();
      const header = ref.current?.getBoundingClientRect();
      const mid = header ? header.top + header.height / 2 : 48;
      const vh = window.innerHeight;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.intersectionRect.height > 0) papers.add(e.target);
            else papers.delete(e.target);
          }
          setOnPaper(papers.size > 0);
        },
        { rootMargin: `-${Math.round(mid - 4)}px 0px -${Math.max(0, Math.round(vh - mid - 4))}px 0px` },
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
        <span className="header-name">{HEADER.name}</span>
        <span className="header-rule" aria-hidden="true" />
        <span className="header-lines">
          <span>{HEADER.line1}</span>
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
