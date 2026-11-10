import type { Day } from "@/lib/detect";

/** 30 days as plain bars. Days that sent an alert are in the platform colour; the newest day is dark. */
export function Bars({ days, usual, color, alerts, label }: { days: Day[]; usual: number; color: string; alerts: string[]; label: string }) {
  if (days.length < 2) return <p className="muted">Not enough history yet. It fills in after a few daily checks.</p>;
  const W = 760, H = 150, gap = 3;
  const max = Math.max(...days.map((d) => d.rate), usual) * 1.08 || 1;
  const bw = (W - gap * (days.length - 1)) / days.length;
  const y = (v: number) => H - (v / max) * H;
  const fmt = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return (
    <figure style={{ margin: 0 }}>
      <svg className="bars" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
        {days.map((d, i) => {
          const h = Math.max(2, H - y(d.rate));
          const last = i === days.length - 1;
          const fill = alerts.includes(d.date) ? color : last ? "#2a2a28" : "#e6e6e2";
          return <rect key={d.date} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={2} fill={fill} />;
        })}
        <line x1="0" x2={W} y1={y(usual)} y2={y(usual)} stroke="#8c8c84" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="bars__axis">
        <span>{fmt(days[0].date)}</span>
        <span>Dashed line: the usual ({Math.round(usual).toLocaleString("en-US")} a day)</span>
        <span>{fmt(days[days.length - 1].date)}</span>
      </figcaption>
    </figure>
  );
}
