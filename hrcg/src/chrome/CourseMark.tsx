// The COURSE mark (brief 5.5): five bricks laid in one course, 01 to 05 left to right.
// Unit u. Bricks 2u x 1u, head joints 0.125u, at x = 0, 2.125u, 4.25u, 6.375u, 8.5u -> 10.5u x 1u.
// Chalk on dark, slab-black on gypsum (currentColor). `current` brick fills marking orange.
// Always aria-hidden: it sits inside a labelled link. Minimum width 48 px. Owner: A1.

export interface CourseMarkProps {
  /** 1..5: the current challenge's brick fills orange (title strip on A-101..A-105) */
  current?: number | null;
  /** Rendered width in px (height = width / 10.5). Default 96. */
  width?: number;
  className?: string;
}

export const COURSE_BRICKS = [0, 2.125, 4.25, 6.375, 8.5] as const;

export function CourseMark({ current = null, width = 96, className }: CourseMarkProps) {
  const w = Math.max(48, width);
  return (
    <svg
      className={`course-mark ${className ?? ''}`}
      viewBox="0 0 10.5 1"
      width={w}
      height={w / 10.5}
      aria-hidden="true"
      focusable="false"
      data-current={current ?? undefined}
    >
      {COURSE_BRICKS.map((x, i) => (
        <rect
          key={x}
          x={x}
          y={0}
          width={2}
          height={1}
          className={current === i + 1 ? 'course-brick is-current' : 'course-brick'}
        />
      ))}
    </svg>
  );
}

export default CourseMark;
