// titleStrip.getCellRect(cell) / titleStrip.pulse(cell) (brief 4.3, 4.4: the A-200 HOLD cloud
// flies by FLIP into the VENUE cell, which pulses once). Owner: A1.
// 'venue' and 'hold' are the same cell (DATE · VENUE). On phones (<768 px) the strip is hidden;
// getCellRect returns the phone bar's status button rect for 'venue'/'status'/'sheet'
// (A-200 does not fly on phones, but the rect is always a real on-screen box).

import { isBrowser } from '../system/store';

export type StripCell = 'mark' | 'project' | 'status' | 'venue' | 'hold' | 'imagery' | 'sheet' | 'motion' | 'teams' | 'sponsors';

function cellEl(cell: StripCell): HTMLElement | null {
  if (!isBrowser) return null;
  const key = cell === 'hold' ? 'venue' : cell;
  const strip = document.querySelector<HTMLElement>(`.title-strip [data-strip-cell="${key}"]`);
  if (strip && strip.offsetParent !== null) return strip;
  const phone = document.querySelector<HTMLElement>(`.phone-bar [data-strip-cell="${key}"]`) ??
    document.querySelector<HTMLElement>('.phone-bar [data-strip-cell="status"]');
  return phone && phone.offsetParent !== null ? phone : strip;
}

export const titleStrip = {
  /** Viewport rect of a strip cell (DOMRect of zeros during SSR or when absent). */
  getCellRect(cell: StripCell): DOMRect {
    const el = cellEl(cell);
    if (!el) return isBrowser ? new DOMRect(0, 0, 0, 0) : ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON() {} } as DOMRect);
    // the value area (where the HOLD cloud mark sits), else the whole cell
    const target = el.querySelector<HTMLElement>('[data-strip-target]') ?? el;
    return target.getBoundingClientRect();
  },
  /** Pulse a cell once (SETTLE, 600 ms). No-op under reduced motion. */
  pulse(cell: StripCell) {
    const el = cellEl(cell);
    if (!el) return;
    if (document.documentElement.classList.contains('rm')) return;
    el.classList.remove('is-pulse');
    // restart the animation
    void el.offsetWidth;
    el.classList.add('is-pulse');
    window.setTimeout(() => el.classList.remove('is-pulse'), 700);
  },
  /** The element itself, for owners that need to append a docked mark. */
  getCell(cell: StripCell): HTMLElement | null {
    return cellEl(cell);
  },
};

export default titleStrip;
