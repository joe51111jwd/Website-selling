// Debug URL params (harmless in production): ?n=13|15|39, ?section=turn|cycle|oxygen, ?lap=1..3,
// ?fallback=1 (CSS water), ?gl=1 (live water, no frame-time probe), ?nonav=1 (stay after the drain), ?reduced=1 (force reduced motion).
const q = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
const num = (k: string) => (q.has(k) && q.get(k) !== '' && !Number.isNaN(Number(q.get(k))) ? Number(q.get(k)) : null);
const n = num('n');
const lap = num('lap');

export const PARAMS = {
  n: n === null ? null : Math.min(39, Math.max(1, Math.round(n))),
  section: q.get('section') as 'turn' | 'cycle' | 'oxygen' | null,
  lap: lap === null ? null : Math.min(3, Math.max(1, Math.round(lap))),
  fallback: q.get('fallback') === '1',
  gl: q.get('gl') === '1',
  nonav: q.get('nonav') === '1',
  reduced: q.get('reduced') === '1',
  debug: q.has('debug'),
};
