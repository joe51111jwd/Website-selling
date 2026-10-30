import type { CSSProperties, MutableRefObject } from 'react';
import { COPY } from '../copy';

// The cycle under the hero correction: two laps of UP (rising, green), SIDE (flat, ochre),
// DOWN (short dip, red). Each lap ends higher than it began. viewBox 640 × 64.
// One rule for the labels: UP and SIDE sit above their legs, DOWN below, each centred on its
// leg's midpoint and pushed off the stroke along the leg's normal (o = offset in design px,
// scaled by --lo so the larger phone labels keep their clearance).
type Leg = { kind: 0 | 1 | 2; a: [number, number]; b: [number, number]; o: number };

const LEGS: Leg[] = [
  { kind: 0, a: [24, 56], b: [134, 24], o: 15 },
  { kind: 1, a: [134, 24], b: [252, 24], o: 13 },
  { kind: 2, a: [252, 24], b: [292, 40], o: 17 },
  { kind: 0, a: [292, 40], b: [402, 8], o: 15 },
  { kind: 1, a: [402, 8], b: [520, 8], o: 13 },
  { kind: 2, a: [520, 8], b: [560, 24], o: 17 },
];

const KIND = ['up', 'side', 'down'] as const;

function labelStyle(l: Leg): CSSProperties {
  const [x0, y0] = l.a;
  const [x1, y1] = l.b;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const len = Math.hypot(x1 - x0, y1 - y0);
  // Unit normal pointing up (for UP / SIDE) or down (for DOWN).
  let nx = -(y1 - y0) / len;
  let ny = (x1 - x0) / len;
  const wantDown = l.kind === 2;
  if ((ny > 0) !== wantDown) {
    nx = -nx;
    ny = -ny;
  }
  const dx = (nx * l.o).toFixed(2);
  const dy = (ny * l.o).toFixed(2);
  return {
    left: `calc(${((mx / 640) * 100).toFixed(3)}% + ${dx} * var(--lo))`,
    top: `calc(${((my / 64) * 100).toFixed(3)}% + ${dy} * var(--lo))`,
  };
}

export function CycleRule({
  legRefs,
  labelRefs,
  tailRef,
}: {
  legRefs?: MutableRefObject<(SVGPathElement | null)[]>;
  labelRefs?: MutableRefObject<(HTMLElement | null)[]>;
  tailRef?: MutableRefObject<SVGPathElement | null>;
}) {
  return (
    <div className="cycle" aria-hidden="true">
      <svg viewBox="0 0 640 64" focusable="false" overflow="visible">
        {/* faint guides: where each lap started (they stop short of the DOWN labels) */}
        <path className="cycle__guide" d="M24 56 H236" />
        <path className="cycle__guide" d="M292 40 H506" />
        {LEGS.map((l, i) => (
          <path
            key={i}
            className={`cycle__leg cycle__leg--${KIND[l.kind]}`}
            d={`M${l.a[0]} ${l.a[1]} L${l.b[0]} ${l.b[1]}`}
            ref={(el) => {
              if (legRefs) legRefs.current[i] = el;
            }}
          />
        ))}
        <path
          className="cycle__tail"
          d="M560 24 L604 11"
          ref={(el) => {
            if (tailRef) tailRef.current = el;
          }}
        />
        <circle className="cycle__dot" cx="24" cy="56" r="3.2" />
      </svg>
      {LEGS.map((l, i) => (
        <span
          key={i}
          className={`cycle__label sc cycle__label--${KIND[l.kind]}`}
          style={labelStyle(l)}
          ref={(el) => {
            if (labelRefs) labelRefs.current[i] = el;
          }}
        >
          {COPY.sheet01.legs[l.kind]}
        </span>
      ))}
    </div>
  );
}
