// Polite live region (brief 3.1): announces ONLY navigation landings (INDEX row, strip CTA)
// and "Address copied." Never plain scroll. The region itself is <AriaLive/> (src/chrome/AriaLive.tsx).
// Owner: A1.

import { isBrowser } from './store';

export const LIVE_REGION_ID = 'hrcg-live';

let timer: ReturnType<typeof setTimeout> | undefined;

export function announce(text: string): void {
  if (!isBrowser) return;
  const region = document.getElementById(LIVE_REGION_ID);
  if (!region) return;
  // clear first so repeating the same text is announced again
  region.textContent = '';
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    region.textContent = text;
  }, 60);
}
