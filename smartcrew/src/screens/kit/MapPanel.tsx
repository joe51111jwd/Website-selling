import { useId, type CSSProperties, type ReactNode } from "react";
import { Icon } from "./Icon";

/*
 * A light, Google-Maps-2024-style regional map drawn in SVG (NOT a screenshot): mint land,
 * beige farm sections, grey towns with street grids, a river with creeks and lakes, blue-grey
 * highways with route shields, white county/section roads, labels with white halos, and
 * round white crew pins with initials.
 *
 * The world is a fictional county, 1600 × 1100 units. Places (use these for `center`):
 *   Cedar Ridge (town)   ≈ (725, 440)     Hwy 9 runs N–S through it, Hwy 30 E–W
 *   Millbrook (town)     ≈ (1255, 760)    on the Cedar River
 *   Hollis (village)     ≈ (275, 760)     County Rd 6 to Cedar Ridge
 *   Fairview (village)   ≈ (1343, 216)    end of County Rd 14
 *   Oak Grove Lake       ≈ (1192, 358)
 *   Willow Creek × Hwy 9 ≈ (748, 190)     (the Hwy 9 culvert job)
 * Project coordinates in data.ts (`project.map`) are in the same units.
 */

export const MAP_WORLD = { w: 1600, h: 1100 } as const;

export type MapPin = {
  x: number;
  y: number;
  /** initials shown in the pin */
  label?: string;
  /** neutral photo disc instead of initials */
  photo?: boolean;
  /** "dark" = black pin with white text (selected) */
  tone?: "white" | "dark";
};

export type MapPanelProps = {
  /** panel size in CSS px (also sets the map's aspect) */
  width: number;
  height: number;
  /** world point at the panel centre */
  center?: { x: number; y: number };
  /** CSS px per world unit (0.5 shows ~1000 × 700 units in a 500 × 350 panel) */
  zoom?: number;
  pins?: MapPin[];
  /** a red location marker (project detail) */
  marker?: { x: number; y: number };
  /** bottom-right move control (as in the app) and/or a +/- zoom stack */
  controls?: "move" | "zoom" | "both" | "none";
  radius?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

// ── palette (sampled from the app's embedded Google map) ────────────────────
const C = {
  land: "#d2f3e0",
  wood: "#bde9d0",
  farm: "#f4f0e4",
  farm2: "#efe9da",
  town: "#efeff1",
  townEdge: "#e2e2e6",
  street: "#d6d8de",
  water: "#86d3ea",
  waterLabel: "#2d7fa3",
  hwy: "#a8b3c8",
  hwyCase: "#97a3ba",
  road: "#ffffff",
  roadCase: "#c9d2cd",
  label: "#3b3f45",
  minor: "#6b7178",
  county: "#9aa3ab",
};

// ── geometry ────────────────────────────────────────────────────────────────
const RIVER =
  "M -40 168 C 60 180 140 214 220 206 S 330 176 390 228 S 470 330 540 400 S 600 492 660 522 S 790 550 880 532 S 980 572 1040 622 S 1130 712 1210 728 S 1330 760 1400 812 S 1530 880 1660 884";
const NORTH_FORK = "M 330 -40 C 340 40 300 110 352 160 S 380 210 392 230";
const WILLOW = "M 1010 -40 C 960 30 900 60 850 110 S 770 170 748 190 S 700 230 640 250 S 520 268 470 322";
const SPRING = "M 1480 300 C 1430 380 1380 470 1330 540 S 1260 650 1225 722";
const DITCH = "M 120 980 C 200 930 260 900 300 820";

const HWY9 = "M 772 -60 L 766 60 C 762 120 752 160 748 190 C 742 240 730 320 724 380 L 718 470 C 712 560 700 640 692 720 L 676 1160";
const HWY30 = "M -60 470 C 120 476 300 470 450 458 S 640 444 720 444 S 860 448 940 466 S 1080 540 1140 600 S 1220 690 1280 700 S 1420 720 1660 730";
const CR14 = "M 760 404 C 820 380 900 352 1010 326 S 1180 280 1250 252 S 1320 222 1400 210 L 1660 196";
const CR6 = "M 270 760 C 360 700 450 640 520 560 S 600 470 640 446";
const LAKE_RD = "M 1010 326 C 1040 380 1070 400 1110 410 S 1200 420 1260 400";

const CEDAR_RIDGE = "M 592 392 L 640 360 L 700 352 L 760 340 L 812 356 L 858 400 L 872 468 L 840 512 L 760 524 L 690 520 L 630 500 L 600 452 Z";
const MILLBROOK = "M 1170 730 L 1215 700 L 1290 696 L 1335 724 L 1340 790 L 1300 820 L 1220 822 L 1176 790 Z";
const HOLLIS = "M 225 735 L 270 715 L 320 730 L 330 780 L 290 805 L 235 795 Z";
const FAIRVIEW = "M 1305 195 L 1345 182 L 1382 198 L 1380 240 L 1340 252 L 1308 236 Z";
const OAK_LAKE = "M 1135 355 C 1140 325 1185 315 1220 325 S 1267 355 1253 377 S 1205 397 1175 391 S 1131 377 1135 355 Z";
const MILL_POND = "M 1300 650 C 1310 636 1336 634 1346 646 S 1340 668 1322 668 S 1294 662 1300 650 Z";
const PONDS: [number, number, number, number][] = [
  [980, 180, 11, 6],
  [1460, 430, 15, 8],
  [298, 384, 9, 6],
  [560, 706, 13, 7],
  [1082, 862, 10, 6],
  [880, 760, 8, 5],
  [160, 560, 10, 6],
  [1530, 980, 12, 7],
];

// deterministic PRNG for the farm sections
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const SECTION = 160;
const FARMS: { x: number; y: number; w: number; h: number; c: string }[] = (() => {
  const r = rng(7);
  const out: { x: number; y: number; w: number; h: number; c: string }[] = [];
  for (let gy = -1; gy < 8; gy++) {
    for (let gx = -1; gx < 11; gx++) {
      const x0 = gx * SECTION + 80;
      const y0 = gy * SECTION + 100;
      const roll = r();
      const split = r();
      const inset = 5;
      if (roll < 0.28) continue; // pasture / woods stays green
      if (split < 0.35) {
        out.push({ x: x0 + inset, y: y0 + inset, w: SECTION - inset * 2, h: SECTION - inset * 2, c: r() < 0.5 ? C.farm : C.farm2 });
      } else if (split < 0.7) {
        const half = (SECTION - inset * 3) / 2;
        if (r() < 0.8) out.push({ x: x0 + inset, y: y0 + inset, w: SECTION - inset * 2, h: half, c: C.farm });
        if (r() < 0.8) out.push({ x: x0 + inset, y: y0 + inset * 2 + half, w: SECTION - inset * 2, h: half, c: C.farm2 });
      } else {
        const q = (SECTION - inset * 3) / 2;
        for (let k = 0; k < 4; k++) {
          if (r() < 0.62) out.push({ x: x0 + inset + (k % 2) * (q + inset), y: y0 + inset + Math.floor(k / 2) * (q + inset), w: q, h: q, c: r() < 0.5 ? C.farm : C.farm2 });
        }
      }
    }
  }
  return out;
})();

const SECTION_X = [80, 240, 400, 560, 880, 1040, 1200, 1360, 1520];
const SECTION_Y = [100, 260, 620, 780, 940];

function townStreets(bx0: number, by0: number, bx1: number, by1: number, step: number) {
  let d = "";
  for (let x = bx0; x <= bx1; x += step) d += `M ${x} ${by0} L ${x + 6} ${by1} `;
  for (let y = by0; y <= by1; y += step) d += `M ${bx0} ${y} L ${bx1} ${y - 4} `;
  return d;
}

const CR_STREETS = townStreets(586, 334, 880, 530, 17);
const MB_STREETS = townStreets(1166, 692, 1344, 826, 16);
const HO_STREETS = townStreets(222, 712, 334, 808, 18);
const FV_STREETS = townStreets(1302, 180, 1386, 254, 18);

export function MapPanel({ width, height, center = { x: 900, y: 460 }, zoom = 0.5, pins = [], marker, controls = "move", radius, className, style, children }: MapPanelProps) {
  const uid = useId().replace(/:/g, "");
  const k = 1 / zoom; // world units per CSS px
  const s = Math.pow(zoom / 0.5, 0.55); // road widths grow gently with zoom
  const vw = width * k;
  const vh = height * k;
  const vx = center.x - vw / 2;
  const vy = center.y - vh / 2;
  const px = (n: number) => n * k; // CSS px → world units
  const rw = (n: number) => n * s * k; // road width
  const showStreets = zoom >= 0.45;

  const label = (x: number, y: number, text: string, size: number, opts: { weight?: number; color?: string; italic?: boolean; spacing?: number; anchor?: "middle" | "start" } = {}) => (
    <text
      x={x}
      y={y}
      fontSize={px(size)}
      fontWeight={opts.weight ?? 600}
      fill={opts.color ?? C.label}
      fontStyle={opts.italic ? "italic" : undefined}
      letterSpacing={opts.spacing ? px(opts.spacing) : undefined}
      textAnchor={opts.anchor ?? "middle"}
      stroke="#fff"
      strokeWidth={px(3)}
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ fontFamily: "var(--sc-font)" }}
    >
      {text}
    </text>
  );

  const shield = (x: number, y: number, n: string, kind: "us" | "county" = "us") => {
    const w = px(n.length > 1 ? 20 : 16);
    const h = px(15);
    return (
      <g>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={px(kind === "us" ? 4 : 2.5)} fill="#fff" stroke={kind === "us" ? "#8f99aa" : "#9aa6b2"} strokeWidth={px(1)} />
        <text x={x} y={y + px(3.6)} fontSize={px(9.5)} fontWeight={700} fill="#4a4f57" textAnchor="middle" style={{ fontFamily: "var(--sc-font)" }}>
          {n}
        </text>
      </g>
    );
  };

  return (
    <div className={`sc-map${className ? ` ${className}` : ""}`} style={{ width, height, ...(radius !== undefined ? { borderRadius: radius } : null), ...style }}>
      <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <clipPath id={`cr${uid}`}>
            <path d={CEDAR_RIDGE} />
          </clipPath>
          <clipPath id={`mb${uid}`}>
            <path d={MILLBROOK} />
          </clipPath>
          <clipPath id={`ho${uid}`}>
            <path d={HOLLIS} />
          </clipPath>
          <clipPath id={`fv${uid}`}>
            <path d={FAIRVIEW} />
          </clipPath>
          <filter id={`sh${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy={px(1)} stdDeviation={px(1.6)} floodColor="#000" floodOpacity="0.22" />
          </filter>
          <path id={`rv${uid}`} d="M 880 532 C 930 541 980 572 1040 622" />
          <path id={`wc${uid}`} d="M 548 254 C 610 247 660 236 708 212" />
        </defs>

        {/* land */}
        <rect x={-200} y={-200} width={2000} height={1500} fill={C.land} />
        {FARMS.map((f, i) => (
          <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} rx={2} fill={f.c} />
        ))}

        {/* riparian woods */}
        <g fill="none" stroke={C.wood} strokeLinecap="round" strokeLinejoin="round">
          <path d={RIVER} strokeWidth={40} />
          <path d={NORTH_FORK} strokeWidth={30} />
          <path d={WILLOW} strokeWidth={26} />
          <path d={SPRING} strokeWidth={22} />
        </g>
        <path d="M 1110 300 C 1150 280 1240 290 1290 330 S 1300 420 1240 430 S 1110 420 1100 380 Z" fill={C.wood} />

        {/* county line */}
        <path d="M 1560 -40 L 1556 400 L 1600 404 L 1596 1140" fill="none" stroke={C.county} strokeWidth={px(1)} strokeDasharray={`${px(5)} ${px(4)}`} />

        {/* towns */}
        <g fill={C.town} stroke={C.townEdge} strokeWidth={px(0.8)}>
          <path d={CEDAR_RIDGE} />
          <path d={MILLBROOK} />
          <path d={HOLLIS} />
          <path d={FAIRVIEW} />
        </g>
        {showStreets && (
          <g fill="none" stroke={C.street} strokeWidth={rw(0.9)}>
            <path d={CR_STREETS} clipPath={`url(#cr${uid})`} />
            <path d={MB_STREETS} clipPath={`url(#mb${uid})`} />
            <path d={HO_STREETS} clipPath={`url(#ho${uid})`} />
            <path d={FV_STREETS} clipPath={`url(#fv${uid})`} />
          </g>
        )}
        {/* parks in town */}
        <rect x={676} y={404} width={26} height={20} rx={2} fill="#c3ebd2" />
        <rect x={1244} y={744} width={22} height={18} rx={2} fill="#c3ebd2" />

        {/* section roads */}
        <g fill="none" stroke={C.road} strokeWidth={rw(1.3)} strokeLinecap="round" opacity={0.95}>
          {SECTION_X.map((x) => (
            <path key={`sx${x}`} d={`M ${x} -60 L ${x + 4} 1160`} />
          ))}
          {SECTION_Y.map((y) => (
            <path key={`sy${y}`} d={`M -60 ${y} L 1660 ${y + 6}`} />
          ))}
        </g>

        {/* water */}
        <g fill="none" stroke={C.water} strokeLinecap="round" strokeLinejoin="round">
          <path d={RIVER} strokeWidth={Math.max(px(3.4), 9)} />
          <path d={NORTH_FORK} strokeWidth={Math.max(px(1.8), 4)} />
          <path d={WILLOW} strokeWidth={Math.max(px(1.6), 3.5)} />
          <path d={SPRING} strokeWidth={Math.max(px(1.3), 3)} />
          <path d={DITCH} strokeWidth={Math.max(px(1.1), 2.5)} />
        </g>
        <g fill={C.water}>
          <path d={OAK_LAKE} />
          <path d={MILL_POND} />
          {PONDS.map(([x, y, rx, ry], i) => (
            <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} />
          ))}
        </g>

        {/* county roads */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g stroke={C.roadCase} strokeWidth={rw(3.6)}>
            <path d={CR14} />
            <path d={CR6} />
            <path d={LAKE_RD} />
          </g>
          <g stroke={C.road} strokeWidth={rw(2.4)}>
            <path d={CR14} />
            <path d={CR6} />
            <path d={LAKE_RD} />
          </g>
        </g>

        {/* highways */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g stroke={C.hwyCase} strokeWidth={rw(4.6)}>
            <path d={HWY9} />
            <path d={HWY30} />
          </g>
          <g stroke={C.hwy} strokeWidth={rw(3.4)}>
            <path d={HWY9} />
            <path d={HWY30} />
          </g>
        </g>

        {/* labels */}
        {label(1192, 364, "Oak Grove Lake", 10, { weight: 500, color: C.waterLabel, italic: true })}
        <text fontSize={px(10)} fontWeight={500} fontStyle="italic" fill={C.waterLabel} stroke="#fff" strokeWidth={px(2.5)} paintOrder="stroke" style={{ fontFamily: "var(--sc-font)" }}>
          <textPath href={`#rv${uid}`} startOffset="8%">
            Cedar River
          </textPath>
        </text>
        <text fontSize={px(9)} fontWeight={500} fontStyle="italic" fill={C.waterLabel} stroke="#fff" strokeWidth={px(2.5)} paintOrder="stroke" style={{ fontFamily: "var(--sc-font)" }}>
          <textPath href={`#wc${uid}`} startOffset="50%" textAnchor="middle">
            Willow Creek
          </textPath>
        </text>
        {label(725, 446, "Cedar Ridge", 13, { weight: 600 })}
        {label(1258, 774, "Millbrook", 12)}
        {label(276, 770, "Hollis", 11.5)}
        {label(1344, 222, "Fairview", 11)}
        {label(420, 120, "HOLLIS TWP", 9, { weight: 500, color: C.minor, spacing: 1.2 })}
        {label(1420, 560, "GROVE TWP", 9, { weight: 500, color: C.minor, spacing: 1.2 })}

        {/* route shields */}
        {shield(763, 96, "9")}
        {shield(700, 680, "9")}
        {shield(300, 470, "30")}
        {shield(1010, 506, "30")}
        {shield(1500, 724, "30")}
        {shield(962, 337, "14", "county")}
        {shield(1280, 240, "14", "county")}
        {shield(452, 638, "6", "county")}

        {/* marker */}
        {marker && (
          <g transform={`translate(${marker.x} ${marker.y}) scale(${k})`} filter={`url(#sh${uid})`}>
            <path d="M0 0 C -2 -6 -10 -11 -10 -19 A 10 10 0 1 1 10 -19 C 10 -11 2 -6 0 0 Z" fill="#ea4335" stroke="#b3261e" strokeWidth={0.8} />
            <circle cx={0} cy={-19} r={3.6} fill="#7a1b14" />
          </g>
        )}

        {/* crew pins */}
        {pins.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y}) scale(${k})`}>
            <circle r={16} fill={p.tone === "dark" ? "#111" : "#fff"} stroke={p.tone === "dark" ? "#111" : "#d4d4d4"} strokeWidth={1} filter={`url(#sh${uid})`} />
            {p.photo ? (
              <g>
                <clipPath id={`ph${uid}${i}`}>
                  <circle r={14} />
                </clipPath>
                <g clipPath={`url(#ph${uid}${i})`}>
                  <rect x={-14} y={-14} width={28} height={28} fill="#9a8f84" />
                  <circle cy={-3} r={5.4} fill="#4a413a" />
                  <path d="M -12 14 C -10 6 -5 3 0 3 S 10 6 12 14 Z" fill="#3a332d" />
                </g>
              </g>
            ) : (
              <text y={4.2} fontSize={11.5} fontWeight={600} fill={p.tone === "dark" ? "#fff" : "#1a1a1a"} textAnchor="middle" style={{ fontFamily: "var(--sc-font)" }}>
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      {(controls === "zoom" || controls === "both") && (
        <div className="sc-map-zoom">
          <span>
            <Icon name="plus" size={16} stroke={1.8} />
          </span>
          <i />
          <span>
            <Icon name="minus" size={16} stroke={1.8} />
          </span>
        </div>
      )}
      {(controls === "move" || controls === "both") && (
        <div className="sc-map-ctrl">
          <MoveGlyph />
        </div>
      )}
      {children}
    </div>
  );
}

/** The four-chevron "move" control from the app's map. */
function MoveGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5.5 12 2.6l3 2.9M9 18.5l3 2.9 3-2.9M5.5 9 2.6 12l2.9 3M18.5 9l2.9 3-2.9 3" />
    </svg>
  );
}
