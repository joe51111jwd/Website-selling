const P: Record<string, string> = {
  home: "M3 10.5 10 4l7 6.5M5 9v7h4v-4h2v4h4V9",
  tracks: "M8 15.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm0 0V5l9-1.5v10M17 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  bell: "M5.5 13.5V9a4.5 4.5 0 0 1 9 0v4.5l1.5 2h-12l1.5-2ZM8.5 17.5h3",
  rules: "M4 6h7M14 6h2M4 14h2M9 14h7M11 4v4M6 12v4",
  mail: "M3.5 5.5h13v9h-13zM3.5 6l6.5 5 6.5-5",
  out: "M8 4H4.5v12H8M12 6.5 15.5 10 12 13.5M15.5 10H8",
  ext: "M8 5H5v10h10v-3M11 4h5v5M16 4l-7 7",
  back: "M12 4.5 6.5 10l5.5 5.5",
  check: "M4.5 10.5 8 14l7.5-8",
  plus: "M10 4.5v11M4.5 10h11",
};

export function Icon({ name, size = 18 }: { name: keyof typeof P | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

/** the TMWRK mark: four level bars, like a meter */
export function Mark() {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true">
      <rect x="0" y="9" width="3" height="7" rx="1" fill="currentColor" />
      <rect x="5" y="5" width="3" height="11" rx="1" fill="currentColor" />
      <rect x="10" y="0" width="3" height="16" rx="1" fill="currentColor" />
      <rect x="15" y="7" width="3" height="9" rx="1" fill="currentColor" />
    </svg>
  );
}
