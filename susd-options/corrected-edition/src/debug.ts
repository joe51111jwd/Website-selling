// Debug URL params (§4.6). Harmless in production.
const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const sheet = Number(q.get('sheet') || 0);
export const DEBUG = {
  sheet: sheet >= 1 && sheet <= 6 ? sheet : 0,
  finaleOpen: q.get('finale') === 'open',
  nonav: q.get('nonav') === '1',
};
/** With ?sheet=N every sheet renders with its marks done. */
export const DEBUG_DONE = DEBUG.sheet > 0;
