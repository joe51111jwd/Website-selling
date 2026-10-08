// Small HOLD cloud mark for the strip's DATE · VENUE cell (brief 3.1). A scalloped outline in
// marking orange; decorative (the cell carries screen-reader text). The full drafting HoldCloud
// symbol is A3's (src/marks/HoldCloud). Owner: A1.

export function HoldMark({ className }: { className?: string }) {
  return (
    <svg
      className={`hold-mark ${className ?? ''}`}
      viewBox="0 0 30 14"
      width="30"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 11.5c-2.2 0-3.3-2.4-1.9-4 .2-2 2.4-3 4-2C6.6 3.2 9.4 2.3 11 3.6 12 1.6 15.2 1.3 16.6 3c1.4-1.5 4.3-1.2 5 .9 1.9-.6 4 .7 4 2.6 1.9.5 2.6 2.8 1.2 4.1-.4 1.6-2.4 2.3-3.8 1.4-1.1 1.5-3.6 1.6-4.7.2-1.3 1.3-3.8 1.2-4.8-.3-1.3 1.2-3.6 1.1-4.6-.3C8 12.3 5.6 12.5 4 11.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default HoldMark;
