// Shared click handlers for chrome links: progressive enhancement over plain anchors. Owner: A1.

import type { MouseEvent } from 'react';
import { lenisScrollTo } from '../system/lenis';

/** onClick for an <a href="#a-300"> that should Lenis-scroll, focus the H2 and announce. */
export function navClick(announce = true) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = e.currentTarget.getAttribute('href') ?? '';
    if (!href.startsWith('#') || href.length < 2) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    lenisScrollTo(target, { announce });
  };
}
