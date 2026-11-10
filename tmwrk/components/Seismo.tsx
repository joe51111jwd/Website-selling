import type { Row } from "@/lib/view";

/**
 * The seismograph: every watched track's activity as a ratio of its own baseline, over 30 days, both
 * platforms. Quiet tracks hug the line; the ones that take off stand out without anyone reading a table.
 */
export function Seismo({ rows }: { rows: Row[] }) {
  const W = 1200, H = 150, mid = H * 0.72;
  const paths: { d: string; color: string; hot: boolean; key: string }[] = [];
  for (const r of rows) {
    for (const pl of ["spotify", "tiktok"] as const) {
      const days = r.signals[pl].days;
      if (days.length < 8) continue;
      const pts = days.map((d, i) => {
        const prior = days.slice(Math.max(0, i - 7), i);
        const b = Math.max(1, prior.length ? prior.reduce((a, c) => a + c.rate, 0) / prior.length : d.rate);
        const ratio = Math.log2(Math.max(0.25, d.rate / b));
        return [(i / (days.length - 1)) * W, mid - Math.max(-1.2, Math.min(4.6, ratio)) * 26] as const;
      });
      const st = r.signals[pl].status;
      const hot = st === "spike" || st === "rising" || st === "cooling";
      paths.push({ key: r.track.id + pl, hot, color: pl === "tiktok" ? "var(--tiktok)" : "var(--spotify)", d: pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("") });
    }
  }
  paths.sort((a, b) => Number(a.hot) - Number(b.hot));
  return (
    <svg className="seismo" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" x2={W} y1={mid} y2={mid} stroke="currentColor" strokeOpacity=".25" />
      {paths.map((p) => (
        <path key={p.key} d={p.d} fill="none" stroke={p.hot ? p.color : "currentColor"} strokeOpacity={p.hot ? 1 : 0.18} strokeWidth={p.hot ? 2 : 1} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
