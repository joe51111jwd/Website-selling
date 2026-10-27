import { APPENDIX_URL } from "../optin";

/** the way to the Bootloader from anywhere on the page: its own page, where it can be had by email or downloaded */
export function GetLink({ size = "lg", label = "Get the Bootloader" }: { size?: "sm" | "md" | "lg"; label?: string }) {
  return (
    <a className={`copy copy-${size}`} href={`${APPENDIX_URL}#get`}>
      <span className="copy-icon" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <path d="M8 2.5v8.2M4.6 7.4 8 10.8l3.4-3.4M3 13.5h10" />
        </svg>
      </span>
      <span className="copy-label">{label}</span>
    </a>
  );
}
