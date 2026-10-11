import { MARK_CUBE, MARK_VIEWBOX, MARK_WORD } from "../content/mark";

// The VAYN3D logo: wordmark plus the cube. pathLength lets CSS draw it as a line.
export default function Logo({ className = "", label = "VAYN3D" }: { className?: string; label?: string }) {
  return (
    <svg className={`logo ${className}`} viewBox={MARK_VIEWBOX} role="img" aria-label={label}>
      <path className="logo__word" d={MARK_WORD} fillRule="evenodd" pathLength={1} />
      <path className="logo__cube" d={MARK_CUBE} fillRule="evenodd" pathLength={1} />
    </svg>
  );
}
