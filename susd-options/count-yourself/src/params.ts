// Debug and share params: ?team=n, ?section=meter|cycle|paths, ?nonav=1.
const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const team = Number(q.get('team'));
export const PARAMS = {
  team: Number.isFinite(team) && team >= 1 ? Math.min(40, Math.round(team)) : null,
  section: (['meter', 'cycle', 'paths'] as const).find((s) => s === q.get('section')) ?? null,
  nonav: q.get('nonav') === '1',
};

let t = 0;
/** Keeps ?team=n in the URL (history.replaceState, debounced 300 ms), preserving other params. */
export function syncTeamParam(n: number) {
  window.clearTimeout(t);
  t = window.setTimeout(() => {
    const u = new URL(window.location.href);
    u.searchParams.set('team', String(n));
    history.replaceState(history.state, '', u.toString());
  }, 300);
}
