/** A line Andrew (or counsel) still has to approve before launch. Subtle on purpose; hover says why. */
export function Flag({ note = "Placeholder: Andrew to confirm before launch" }: { note?: string }) {
  return (
    <sup className="sc-flag" title={note} aria-label={note}>
      ⚑
    </sup>
  );
}
