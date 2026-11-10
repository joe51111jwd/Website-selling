import type { Day } from "@/lib/detect";

/** seven days as bars, the newest lit; baseline as a dashed line */
export function Spark({ days, baseline, color, hot }: { days: Day[]; baseline: number; color: string; hot: boolean }) {
  const d = days.slice(-7);
  const max = Math.max(...d.map((x) => x.rate), baseline * 1.3, 1);
  const W = 84, H = 28, bw = W / 7;
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      {d.map((x, i) => {
        const h = Math.max(1.5, (x.rate / max) * (H - 2));
        const last = i === d.length - 1;
        return <rect key={x.date} x={i * bw + 1} y={H - h} width={bw - 2.5} height={h} rx={1} fill={last ? color : "currentColor"} opacity={last ? 1 : hot ? 0.28 : 0.22} />;
      })}
      <line x1="0" x2={W} y1={H - (baseline / max) * (H - 2)} y2={H - (baseline / max) * (H - 2)} stroke="currentColor" strokeOpacity=".45" strokeDasharray="2 2" />
    </svg>
  );
}

/** a 30-day area chart with the rolling baseline, for the track page */
export function Area({ days, color, alerts, label }: { days: Day[]; color: string; alerts: string[]; label: string }) {
  const W = 720, H = 180, P = 6;
  if (days.length < 2) return <p className="muted">Not enough history yet.</p>;
  const max = Math.max(...days.map((d) => d.rate), 1) * 1.1;
  const x = (i: number) => P + (i / (days.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const line = days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.rate).toFixed(1)}`).join("");
  const base = days.map((_, i) => {
    const prior = days.slice(Math.max(0, i - 7), i);
    const b = prior.length ? prior.reduce((a, c) => a + c.rate, 0) / prior.length : days[0].rate;
    return `${i ? "L" : "M"}${x(i).toFixed(1)},${y(b).toFixed(1)}`;
  }).join("");
  return (
    <svg className="area" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color.slice(1)}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${x(days.length - 1)},${H - P}L${P},${H - P}Z`} fill={`url(#g-${color.slice(1)})`} />
      <path d={base} fill="none" stroke="currentColor" strokeOpacity=".4" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {days.map((d, i) => alerts.includes(d.date) && <circle key={d.date} cx={x(i)} cy={y(d.rate)} r="5" fill={color} stroke="#0d0d0f" strokeWidth="2" />)}
    </svg>
  );
}
