// The jobsite's geofence around the 3D phone (the intro's "Hwy 9 Culvert" fence, now around the
// visitor's phone). It draws itself when the phone arrives, its dashes creep like the cursor's;
// on clock-in the dashes close into a solid orange line and ping once: clocked in.
// Drawn in the frame's px (k px per device unit), clear of the phone body (0.79 × 1.63 units).

import { useId } from "react";
import { TRY_FRAME } from "./poses";

/** Vertices in device units from the phone's centre (x right, y down): an irregular hexagon. */
const POLY: [number, number][] = [
  [-0.55, -0.9],
  [0.4, -0.97],
  [0.74, -0.4],
  [0.72, 0.88],
  [-0.14, 0.96],
  [-0.82, 0.8],
];

export function Fence({ k, drawn, on, label, stamp }: { k: number; drawn: boolean; on: boolean; label: string; stamp: string }) {
  const id = useId().replace(/:/g, "");
  // the frame (TRY_FRAME), centred on the phone
  const W = TRY_FRAME[0] * k;
  const H = TRY_FRAME[1] * k;
  const pts = POLY.map(([x, y]) => [W / 2 + x * k, H / 2 + y * k] as const);
  const d = `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
  const [tx, ty] = pts[0];
  return (
    <div className={`try-fence${drawn ? " is-drawn" : ""}${on ? " is-on" : ""}`} aria-hidden="true">
      <svg width={W} height={H} viewBox={`0 0 ${W.toFixed(1)} ${H.toFixed(1)}`}>
        <defs>
          <mask id={`fm-${id}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width={W + 40} height={H + 40}>
            <path className="try-fence-draw" d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={8} strokeLinejoin="round" />
          </mask>
        </defs>
        <path className="try-fence-ping" d={d} fill="none" />
        <path className="try-fence-line" d={d} fill="none" mask={`url(#fm-${id})`} />
        <circle className="try-fence-stake" cx={tx} cy={ty} r={3.5} />
      </svg>
      <div className="try-tag" style={{ left: tx, top: ty }}>
        <span className="try-tag-site">{label}</span>
        <span className="try-tag-stamp">{stamp || " "}</span>
      </div>
    </div>
  );
}
