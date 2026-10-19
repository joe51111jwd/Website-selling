import type { CSSProperties } from "react";

// A jobsite photo thumbnail for the recreated screens (daily reports, files): no real photos in
// the demo, so each is a small drawn scene in a photo's colours (sky, tree line, dirt) with one
// thing of the job in it: a pipe in the trench, a stockpile, a machine, a silt fence, a graded
// pad, a manhole. `n` picks the scene.

const SCENES = 6;

export function SitePhoto({ n, className, style }: { n: number; className?: string; style?: CSSProperties }) {
  const k = ((n % SCENES) + SCENES) % SCENES;
  const id = `scph-${k}`;
  return (
    <svg className={className} style={style} viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={k % 2 ? "#aebfcc" : "#c4d3de"} />
          <stop offset="1" stopColor="#e9edef" />
        </linearGradient>
        <linearGradient id={`${id}-dirt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={k === 3 ? "#7f9a5a" : "#9a7a58"} />
          <stop offset="1" stopColor={k === 3 ? "#5f7a42" : "#6e5238"} />
        </linearGradient>
      </defs>
      <rect width="120" height="90" fill={`url(#${id}-sky)`} />
      <path d={`M0 ${30 + k} q15 -6 30 -2 t32 -3 t30 2 t28 -1 V44 H0z`} fill="#4b5d3f" opacity="0.9" />
      <rect y={40 + (k % 3)} width="120" height="50" fill={`url(#${id}-dirt)`} />
      {k === 0 && (
        <>
          <path d="M0 62 L120 54 L120 72 L0 82z" fill="#4a3624" />
          <ellipse cx="62" cy="67" rx="11" ry="8" fill="#9ea3a6" />
          <ellipse cx="62" cy="67" rx="7" ry="5" fill="#3d3f40" />
          <rect x="62" y="59" width="58" height="16" fill="#a9adaf" transform="rotate(-4 62 67)" />
        </>
      )}
      {k === 1 && (
        <>
          <path d="M18 72 L52 38 L90 72z" fill="#8c8e90" />
          <path d="M30 72 L52 50 L74 72z" fill="#767879" />
          {[24, 40, 58, 70, 46, 34].map((x, i) => (
            <circle key={x} cx={x} cy={66 - (i % 3) * 5} r="1.6" fill="#a7a9ab" />
          ))}
        </>
      )}
      {k === 2 && (
        <>
          <rect x="34" y="50" width="34" height="16" rx="2" fill="#e3a019" />
          <rect x="52" y="40" width="14" height="12" rx="1.5" fill="#d7951a" />
          <rect x="54" y="42" width="9" height="7" fill="#3c4247" opacity="0.8" />
          <path d="M66 50 L92 36 L100 52" stroke="#c98b16" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M96 52 l8 6 l-9 3z" fill="#57524a" />
          <rect x="30" y="66" width="42" height="7" rx="3.5" fill="#2f2f2f" />
        </>
      )}
      {k === 3 && (
        <>
          <path d="M0 64 L120 58" stroke="#1f1f1f" strokeWidth="5" />
          {[8, 30, 52, 74, 96, 116].map((x) => (
            <rect key={x} x={x} y={52 - x * 0.05} width="2.4" height="16" fill="#6b4a2c" />
          ))}
        </>
      )}
      {k === 4 && (
        <>
          <path d="M0 58 L120 52 L120 90 L0 90z" fill="#b08d66" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${10 + i * 26} 90 L${40 + i * 18} 54`} stroke="#977453" strokeWidth="3" />
          ))}
          <rect x="88" y="44" width="2" height="16" fill="#e8611a" />
        </>
      )}
      {k === 5 && (
        <>
          <ellipse cx="60" cy="72" rx="26" ry="9" fill="#4a3624" />
          <rect x="44" y="50" width="32" height="22" fill="#bdbbb6" />
          <ellipse cx="60" cy="50" rx="16" ry="5" fill="#d3d1cc" />
          <ellipse cx="60" cy="50" rx="8" ry="2.6" fill="#55534f" />
        </>
      )}
    </svg>
  );
}
