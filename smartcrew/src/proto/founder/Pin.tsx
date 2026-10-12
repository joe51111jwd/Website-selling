// A plan-sheet callout on a product render: a stake on the real figure, a leader, and a label on
// a shoulder line, the way a civil drawing calls out a station. Used only where it points at
// real data (AISMELL V14, place a).

export type PinDir = "ne" | "nw" | "se" | "sw";

export function Pin({ left, top, label, dir = "ne", len = 44, className = "" }: { left: string; top: string; label: string; dir?: PinDir; len?: number; className?: string }) {
  const up = dir[0] === "n";
  const right = dir[1] === "e";
  return (
    <span className={`f-pin f-pin-${dir} ${className}`} style={{ left, top, ["--len" as string]: `${len}px` }} aria-hidden="true">
      <span className="f-pin-stake" />
      <svg className="f-pin-leader" width={len} height={len} viewBox={`0 0 ${len} ${len}`} style={{ [up ? "bottom" : "top"]: 0, [right ? "left" : "right"]: 0 }}>
        <line x1={right ? 0 : len} y1={up ? len : 0} x2={right ? len : 0} y2={up ? 0 : len} />
      </svg>
      <span className="f-pin-label">{label}</span>
    </span>
  );
}
