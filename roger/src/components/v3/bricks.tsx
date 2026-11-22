import type { CSSProperties } from "react";

/** A brick is a small rounded square. Empty slot: outlined. Set up: filled in its level colour. */
export function Brick({ level = 1, empty, style }: { level?: number; empty?: boolean; style?: CSSProperties }) {
  return <span className="brick" data-level={level} data-empty={empty ? "" : undefined} style={style} />;
}

/** Level a brick reaches by a given week: later weeks hold more upgrades. */
export const levelFor = (week: number, row: number) => Math.min(5, 1 + Math.floor((week + row * 2) / 6));

/**
 * The recurring visual. Three bricks a week, one column per week.
 * `weeks` is how many Mondays have arrived; `level` caps the level colour.
 */
export function BrickStack({
  weeks,
  level = 5,
  empty = 0,
  size = 14,
  gap = 4,
  label,
}: {
  weeks: number;
  level?: number;
  empty?: number;
  size?: number;
  gap?: number;
  label?: string;
}) {
  const count = weeks * 3;
  return (
    <span
      className="brick-stack"
      role="img"
      aria-label={label ?? `${count} bricks set up after ${weeks} ${weeks === 1 ? "Monday" : "Mondays"}`}
      style={{ "--size": `${size}px`, "--gap": `${gap}px` } as CSSProperties}
    >
      {Array.from({ length: (weeks + empty) * 3 }, (_, i) => {
        const week = Math.floor(i / 3);
        return <Brick key={i} empty={week >= weeks} level={Math.min(level, levelFor(week, i % 3))} />;
      })}
    </span>
  );
}
