/** Placeholder mark, not a logo. A magnifying glass over one brick, on the site's copper.
    Peter has not signed off on a mark; replace this file when he does. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#9A5226" />
      <circle cx="14.5" cy="14.5" r="7.25" fill="none" stroke="#fff" strokeWidth="2.2" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.6" fill="#fff" />
      <path d="M20 20l5 5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
