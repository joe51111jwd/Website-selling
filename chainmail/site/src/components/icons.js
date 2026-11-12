// Inline SVG icons. The self-hosted Geist subsets have no arrows, check or empty-set glyphs, so those
// fell back to the OS UI font (Inter / SF / Segoe) and changed weight per platform. These are drawn on a
// 16-unit grid with a 1.5 stroke so they sit with Geist Medium at any size (1em box, currentColor).
const svg = (name, body) =>
  `<svg class="icon icon--${name}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const icons = {
  arrowRight: svg('arrow-right', '<path d="M2.5 8h11M9 3.5 13.5 8 9 12.5"/>'),
  arrowLeft: svg('arrow-left', '<path d="M13.5 8h-11M7 3.5 2.5 8 7 12.5"/>'),
  check: svg('check', '<path d="M3 8.5 6.5 12 13 4.5"/>'),
  empty: svg('empty', '<circle cx="8" cy="8" r="5.5"/><path d="M3.5 12.5 12.5 3.5"/>'),
  pause: svg('pause', '<path d="M5.5 3.5v9M10.5 3.5v9"/>'),
  play: svg('play', '<path d="M5 3.2v9.6L12.6 8z"/>'),
};
