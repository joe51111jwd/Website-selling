import type { CSSProperties } from "react";

/**
 * The weekly loop at a glance: Sunday, Zack reads your week. Overnight, Cora reads the pool.
 * Monday, three bricks land. One SVG, animated in CSS; still under reduced motion.
 */
const COLS = 14;
const ROWS = 5;
const STEP = 32;
const POOL_Y = 200;
const TRAY_Y = 436;
const picks = [
  { col: 6, row: 2, level: 1 },
  { col: 3, row: 3, level: 2 },
  { col: 11, row: 4, level: 3 },
];
const slotX = (n: number) => n * 114;
// Fixed activity marks per day, so the server and the browser draw the same week.
const week = [3, 2, 3, 1, 3, 2, 1];

export function HeroLoop({ labels }: { labels: { when: string; what: string }[] }) {
  return (
    <svg className="loop" viewBox="0 0 452 540" role="img" aria-label={labels.map((l) => `${l.when}: ${l.what}.`).join(" ")}>
      {/* Sunday */}
      <text className="lab-when" x="0" y="12">{labels[0].when}</text>
      <text className="lab-what" x="0" y="34">{labels[0].what}</text>
      {week.map((n, d) => (
        <g key={d} transform={`translate(${d * 52} 52)`}>
          <rect className="day" width="44" height="42" rx="8" />
          {Array.from({ length: n }, (_, i) => (
            <rect key={i} className="act" x="8" y={10 + i * 9} width={[28, 18, 23][i]} height="3" rx="1.5" />
          ))}
          <rect className="mote" x="19" y="46" width="6" height="6" rx="1.5" style={{ "--k": d } as CSSProperties} />
        </g>
      ))}
      <g className="lens">
        <circle cx="22" cy="73" r="19" />
        <line x1="36" y1="87" x2="47" y2="98" />
      </g>

      {/* Overnight */}
      <text className="lab-when" x="0" y="160">{labels[1].when}</text>
      <text className="lab-what" x="0" y="182">{labels[1].what}</text>
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const c = i % COLS;
        const r = Math.floor(i / COLS);
        return <rect key={i} className="cell" x={c * STEP} y={POOL_Y + r * STEP} width="22" height="22" rx="5" style={{ "--k": c + r * 3 } as CSSProperties} />;
      })}
      {picks.map((p, n) => (
        <rect
          key={n}
          className="pick"
          x={p.col * STEP - 4}
          y={POOL_Y + p.row * STEP - 4}
          width="30"
          height="30"
          rx="8"
          stroke={`var(--color-level-${p.level})`}
          style={{ "--n": n } as CSSProperties}
        />
      ))}
      <g className="lens lens-cora">
        <circle cx="43" cy="211" r="19" />
        <line x1="57" y1="225" x2="68" y2="236" />
      </g>

      {/* Monday */}
      <text className="lab-when" x="0" y="396">{labels[2].when}</text>
      <text className="lab-what" x="0" y="418">{labels[2].what}</text>
      {picks.map((p, n) => (
        <g key={n}>
          <rect className="slot" x={slotX(n) + 2} y={TRAY_Y + 2} width="92" height="92" rx="19" />
          <g
            className="b"
            style={
              {
                "--n": n,
                "--fx": `${p.col * STEP - slotX(n)}px`,
                "--fy": `${POOL_Y + p.row * STEP - TRAY_Y}px`,
              } as CSSProperties
            }
          >
            <rect x={slotX(n)} y={TRAY_Y} width="96" height="96" rx="21" fill={`var(--color-level-${p.level})`} />
          </g>
        </g>
      ))}
      <g className="tick">
        <text x="352" y="492" style={{ fontSize: 54, fontWeight: 650, letterSpacing: "-0.04em", fill: "var(--color-night-ink)" }}>+3</text>
        <text x="354" y="516" style={{ fontSize: 13 }}>every Monday</text>
      </g>
    </svg>
  );
}
