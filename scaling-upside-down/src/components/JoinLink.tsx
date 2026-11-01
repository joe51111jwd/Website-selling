/** the page's one call to action: the first-edition list, where the story ends (#join) */
export function JoinLink({ size = "lg", label = "Join the first-edition list" }: { size?: "sm" | "md" | "lg"; label?: string }) {
  return (
    <a className={`copy copy-${size}`} href="#join">
      <span className="copy-label">{label}</span>
      <span className="copy-icon" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <path d="M8 2.5v11M3.8 9.3 8 13.5l4.2-4.2" />
        </svg>
      </span>
    </a>
  );
}
