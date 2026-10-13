// Herolab c1 · "Today's Sheet": the page is the company's plan sheet.
//
// The intro's night map prints to paper: the camera keeps pulling back off Hwy 9 Culvert until it
// is one of four fenced jobs on a civil site-plan sheet of the whole company today. A 5:00 PM line
// sweeps the drawing and sets each job's profit the way a surveyor sets a spot elevation
// (+4,120 · +2,310 · +910 · −860 in red). The sheet's title block is the copy block: PROJECT holds
// the H1, NOTES the sub, and the APPROVED cell holds the orange CTA, where the sweep ends.
//
// Standalone harness: ./dev.html. Phones (≤ 760 px): SVG + DOM only, every move transform/opacity
// (Web Animations, compositor), no filters, no blur, no per-frame JS.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Logo } from "../../brand/Logo";
import { HEX, JOBS, MB_AT, ROAD, type JobId, type JobPlace, type NoteId, type Pt } from "./geometry";
import { computeLayout, toIntro, toScreen, type Layout } from "./layout";
import { TOPO_EVEN, TOPO_EXTENT, TOPO_MAJOR, TOPO_ODD } from "./contours";
import { EASE, progressAt, timeAtProgress, timeline, type Timeline, type Track } from "./timeline";
import { attachCursor } from "./cursor";
import { offset, samplePath, smooth, toPoints } from "./paths";
import "./sheet.css";

// ─── copy (src/content/copy.ts ANGLES; line breaks set by hand for each layout) ──────────────

export type Angle = "profit" | "overbudget" | "timecards" | "payroll" | "replace";

type Copy = { h1: string[]; h1Phone: string[]; h1Scale?: number; h1PhoneScale?: number; sub: string; mode: "money" | "hours"; big?: JobId };

const SUB_GPS = "GPS fills in your crew’s timecards and tags every hour to the right job. You see each job’s profit daily, in time to fix it.";
const SUB_HOURS = "Hours log themselves when your crew gets to the job, tagged to the right cost code and ready for QuickBooks payroll.";

const COPY: Record<Angle, Copy> = {
  profit: { h1: ["See what every job", "is making, every day."], h1Phone: ["See what every", "job is making,", "every day."], sub: SUB_GPS, mode: "money" },
  overbudget: {
    h1: ["Know which jobs are losing", "money before it’s too late."],
    h1Phone: ["Know which jobs", "are losing money", "before it’s too late."],
    h1Scale: 0.8,
    h1PhoneScale: 0.84,
    sub: "SmartCrew rolls your crew’s hours, machine time and materials into a profit number for every job, updated daily.",
    mode: "money",
    big: "river",
  },
  timecards: { h1: ["Stop chasing", "timecards."], h1Phone: ["Stop chasing", "timecards."], h1PhoneScale: 1.1, sub: SUB_HOURS, mode: "hours" },
  payroll: { h1: ["Payroll without the", "Friday scramble."], h1Phone: ["Payroll without", "the Friday", "scramble."], sub: SUB_HOURS, mode: "hours" },
  replace: {
    h1: ["Replace your time app,", "your spreadsheets and", "the group texts."],
    h1Phone: ["Replace your", "time app, your", "spreadsheets and", "the group texts."],
    h1Scale: 0.64,
    h1PhoneScale: 0.8,
    sub: SUB_GPS,
    mode: "money",
  },
};

const EYEBROW = "For dirt work contractors with 5–100 employees";
const CTA = "Get my free trial";
const DEMO = "or book a demo with Andrew";
const MICRO = "Founding Member trial · starts with a 30-minute call with Andrew · no contract";
const DEMO_DATA = "Demo account. Names and numbers are made up.";
const CUE = "Watch a day at Cedar Ridge Earthworks";
const LOGOS = [
  { name: "Drish Construction", src: "/logos/drish.webp", aspect: 2.16 },
  { name: "Rieke Grading", src: "/logos/rieke.webp", aspect: 1.75 },
  { name: "JCR Excavating", src: "/logos/jcr.svg", aspect: 2.61 },
  { name: "Fireball Construction", src: "/logos/fireball.webp", aspect: 1.49 },
  { name: "DW Companies", src: "/logos/dw.svg", aspect: 1.63 },
  { name: "Midwest Erosion Specialists", src: "/logos/midwest.svg", aspect: 4.01 },
];

export function readAngle(): Angle {
  const a = typeof location !== "undefined" ? new URLSearchParams(location.search).get("angle") : null;
  return a && a in COPY ? (a as Angle) : "profit";
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const MINUS = "−";
const fmtMoney = (v: number) => (v < 0 ? MINUS : "+") + Math.abs(v).toLocaleString("en-US");
const fmtHours = (v: number) => `${v.toFixed(1)} h`;
const pts = (a: Pt[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const centroid = (a: Pt[]): Pt => [a.reduce((s, p) => s + p[0], 0) / a.length, a.reduce((s, p) => s + p[1], 0) / a.length];
const prefersReduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => typeof matchMedia !== "undefined" && matchMedia("(hover: hover) and (pointer: fine)").matches;

function useViewport() {
  const read = () => ({ W: window.innerWidth, H: window.innerHeight });
  const [v, setV] = useState(read);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const n = read();
        // phones: the URL bar showing/hiding changes innerHeight; keep the first height
        setV((o) => (n.W === o.W && (n.W <= 760 || n.H === o.H) ? o : n));
      });
    };
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return v;
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.5 9h10.2M9.6 4.6 14 9l-4.4 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** An odometer number: each digit is a column that rolls up to its value as the 5:00 PM line passes. */
function Odo({ text, red }: { text: string; red?: boolean }) {
  return (
    <span className={`hl1-num${red ? " is-red" : ""}`} aria-hidden="true">
      {[...text].map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i} className="hl1-ch" data-ch>{ch === " " ? " " : ch}</span>;
        const d = +ch;
        const strip = Array.from({ length: 7 }, (_, k) => (d - 6 + k + 20) % 10);
        return (
          <span key={i} className="hl1-col" data-col>
            <span className="hl1-roll" data-n={strip.length}>
              {strip.map((n, k) => (
                <span key={k}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Surveyor's north arrow + scale bar, for NOTES' corner. */
function NorthArrow() {
  return (
    <svg className="hl1-north" viewBox="0 0 22 30" aria-hidden="true">
      <circle cx="11" cy="19" r="9.5" />
      <path className="f" d="M11 7.5 14.6 22 11 19.4 7.4 22Z" />
      <path className="h" d="M11 7.5 7.4 22 11 19.4Z" />
      <text x="11" y="5.6" textAnchor="middle">N</text>
    </svg>
  );
}
function ScaleBar() {
  return (
    <svg className="hl1-scale" viewBox="0 0 64 16" aria-hidden="true">
      <rect x="0.5" y="1.5" width="16" height="3" className="f" />
      <rect x="16.5" y="1.5" width="16" height="3" />
      <rect x="32.5" y="1.5" width="31" height="3" className="f" />
      <text x="0.5" y="14">0</text>
      <text x="63.5" y="14" textAnchor="end">500 ft</text>
    </svg>
  );
}

// ─── the hero ─────────────────────────────────────────────────────────────────

export type HeroSheetProps = {
  angle?: Angle;
  /** start from the intro's last frame (the night map + its three notifications) */
  intro?: boolean;
  /** ms to hold on the intro's last frame before the hand-over (the real intro owns this) */
  hold?: number;
  /** don't start on its own (review: window.__hl1.seek) */
  paused?: boolean;
  onCta?: (intent: "trial" | "demo") => void;
};

export default function HeroSheet({ angle = "profit", intro = true, hold = 700, paused = false, onCta }: HeroSheetProps) {
  const { W, H } = useViewport();
  const L = computeLayout(W, H);
  const copy = COPY[angle];
  const root = useRef<HTMLElement>(null);
  const tl = useRef<Timeline | null>(null);
  const [phase, setPhase] = useState<"night" | "run" | "done">(() => (prefersReduced() ? "done" : intro ? "night" : "run"));
  const ran = useRef(false);

  // the first three seconds: built once the fonts are in (the numbers are measured), then played
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || ran.current || phase === "done") return;
    let cancelled = false;
    const go = () => {
      if (cancelled || !root.current) return;
      ran.current = true;
      const b0 = performance.now();
      const t = build(root.current, L, { intro, angle, lead: hold });
      (window as unknown as { __hl1BuildMs: number }).__hl1BuildMs = performance.now() - b0;
      tl.current = t;
      setPhase("run");
      expose(t, L);
      if (!paused) t.play();
      t.done.then(() => !cancelled && setPhase("done"));
    };
    if (document.fonts?.status === "loaded") go();
    else document.fonts.ready.then(go);
    return () => {
      cancelled = true;
      tl.current?.cancel();
      tl.current = null;
      ran.current = false;
    };
    // the sequence plays once; a resize later just shows the final frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a resize while it runs: settle on the final frame
  const first = useRef(`${W}x${H}`);
  useEffect(() => {
    if (`${W}x${H}` !== first.current && tl.current) {
      tl.current.cancel();
      tl.current = null;
      setPhase("done");
    }
  }, [W, H]);

  // desktop cursor: survey reticle over the drawing, the crew dot elsewhere
  useEffect(() => {
    const el = root.current;
    if (!el || L.phone || !finePointer()) return;
    return attachCursor(el, L);
  }, [L.W, L.H, L.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const F = L.field;
  const fo: Pt = [F.x, F.y];
  const inField = (p: Pt): Pt => sub(toScreen(L, p), fo);

  // ── the drawing, in field px ──
  const g0 = inField([0, 0]);
  const topoT = `translate(${g0[0].toFixed(2)} ${g0[1].toFixed(2)}) scale(${L.k.toFixed(5)})`;
  const hex = HEX.map(inField);
  const places = L.scene.jobs;
  // roads as two hairlines either side of the centreline (field px)
  const roads = [
    { kind: "hwy", half: L.phone ? 3 : 3.5, pts: samplePath(ROAD, 16).map(inField) },
    ...L.scene.lines.filter((l) => l.kind === "double").map((l) => ({ kind: "county", half: 2.5, pts: smooth(l.pts.map(inField), 10) })),
  ];
  const value = (id: JobId) => (copy.mode === "money" ? fmtMoney(JOBS[id].profit) : fmtHours(JOBS[id].hours));

  // ── the night map, in intro screen px ──
  const E = TOPO_EXTENT;
  const n0 = toIntro(L, [E.x0, E.y0]);
  const port = W / H <= 1;

  const style = {
    "--q": L.q.toFixed(4),
    "--inset": `${L.inset}px`,
    "--h1-scale": (L.phone ? copy.h1PhoneScale : copy.h1Scale) ?? 1,
    height: L.phone ? undefined : `${H}px`,
  } as CSSProperties;

  return (
    <section ref={root} className={`hl1 ${L.phone ? "is-phone" : "is-desk"} is-${phase}`} style={style} data-angle={angle} aria-label="SmartCrew">
      {/* ── night: the intro's last frame ── */}
      {intro && phase !== "done" && (
        <>
          <div className="hl1-ground" />
          <div className="hl1-night" data-a="night">
            <svg className="hl1-nmap" viewBox={`${E.x0} ${E.y0} ${E.x1 - E.x0} ${E.y1 - E.y0}`} style={{ left: n0[0], top: n0[1], width: (E.x1 - E.x0) * L.ki, height: (E.y1 - E.y0) * L.ki }} aria-hidden="true">
              <g className="hl1-ntopo">
                <path d={TOPO_EVEN} />
                <path d={TOPO_ODD} />
                <path className="mj" d={TOPO_MAJOR} />
              </g>
              <path className="hl1-nroad" d={ROAD} />
              <path className="hl1-nroad-c" d={ROAD} />
              {L.scene.haul && <path className="hl1-nhaul" d={L.scene.haul} />}
              {L.scene.pit && (
                <g className="hl1-npit" transform={`translate(${L.scene.pit[0]} ${L.scene.pit[1]})`}>
                  <g transform="rotate(-16)">
                    <ellipse rx="40" ry="25" />
                    <ellipse rx="27" ry="16" />
                    <ellipse rx="14" ry="8" />
                  </g>
                  <circle className="pin" r="5" />
                  {!port && (
                    <text x="48" y="5">
                      Hollis pit
                    </text>
                  )}
                </g>
              )}
              <polygon className="hl1-nzone" points={pts(HEX)} />
              <polygon className="hl1-nfence" points={pts(HEX)} />
              <text className="hl1-nlabel" x="962" y="404" textAnchor="end" style={port ? { fontSize: 17 } : undefined}>
                Hwy 9 Culvert
              </text>
              <g transform={`translate(${MB_AT[0]} ${MB_AT[1]}) scale(${port ? 1.35 : 1})`}>
                <circle className="hl1-ntruck-r" r="18" />
                <circle className="hl1-ntruck" r="14.5" />
                <text className="hl1-ntruck-t" y="4" textAnchor="middle">
                  MB
                </text>
              </g>
            </svg>
          </div>
          <div className="hl1-warm" data-a="warm" />
        </>
      )}
      <div className="hl1-paper" data-a="paper" />

      {/* ── the drawing field ── */}
      <div className="hl1-field" style={{ left: F.x, top: F.y, width: F.w, height: F.h }} data-field>
        <div className="hl1-cam" data-a="cam">
          <svg className="hl1-topo" width={F.w} height={F.h} aria-hidden="true">
            <g transform={topoT}>
              <path d={TOPO_ODD} />
              <path className="mj" d={TOPO_MAJOR} />
            </g>
          </svg>
          <svg className="hl1-plan" width={F.w} height={F.h} aria-hidden="true">
            <g transform={topoT}>
              {L.scene.lines
                .filter((l) => l.kind === "river")
                .map((l, i) => (
                  <polyline key={i} className="hl1-creek" points={pts(smooth(l.pts, 8))} />
                ))}
              {L.scene.haul && <path className="hl1-haul" d={L.scene.haul} />}
              {L.scene.pit && (
                <g className="hl1-pit" transform={`translate(${L.scene.pit[0]} ${L.scene.pit[1]}) rotate(-16)`}>
                  <ellipse rx="40" ry="25" />
                  <ellipse rx="27" ry="16" />
                  <ellipse rx="14" ry="8" />
                </g>
              )}
              {places
                .filter((p) => p.id === "hwy9")
                .map((p) => (
                  <g key={p.id}>
                    {p.detail.map((d, i) => (
                      <polyline key={i} className="hl1-culvert" points={pts(d)} />
                    ))}
                  </g>
                ))}
            </g>
            {roads.map((r, i) => (
              <g key={i} className={`hl1-road hl1-road--${r.kind}`}>
                <polyline points={toPoints(offset(r.pts, r.half))} />
                <polyline points={toPoints(offset(r.pts, -r.half))} />
              </g>
            ))}
            <polygon className="hl1-fence" points={pts(hex)} data-fence="hwy9" />
          </svg>
          {places
            .filter((p) => p.id !== "hwy9")
            .map((p) => (
              <JobSvg key={p.id} place={p} at={inField} F={F} />
            ))}
        </div>

        {/* marks: screen-space type and dots that ride the camera on their own */}
        <div className="hl1-marks">
          {places
            .find((p) => p.id === "hwy9")!
            .crew.map((c, i) => {
              const s = inField(c);
              return (
                <span key={i} className="hl1-rider" data-ride={`${c[0]},${c[1]}`} style={{ left: s[0], top: s[1] }}>
                  <i className="hl1-dot" data-crew={i} />
                </span>
              );
            })}
          {places.map((p) => (
            <Spot key={p.id} place={p} at={inField} label={value(p.id)} unit={copy.mode === "money" ? "profit today" : "on site today"} red={copy.mode === "money" && JOBS[p.id].profit < 0} big={copy.big === p.id} small={!!copy.big && copy.big !== p.id} />
          ))}
          {places
            .filter((p) => p.note && copy.mode === "money")
            .map((p) => (
              <Note key={p.id} place={p} at={inField} phone={L.phone} />
            ))}
          {places
            .filter((p) => JOBS[p.id].profit < 0 && copy.mode === "money")
            .map((p) => (
              <svg key={p.id} className="hl1-pulse" width={F.w} height={F.h} aria-hidden="true" style={{ transformOrigin: `${centroid(p.fence.map(inField))[0]}px ${centroid(p.fence.map(inField))[1]}px` }} data-pulse>
                <polygon points={pts(p.fence.map(inField))} />
              </svg>
            ))}
        </div>

        <div className="hl1-sweep" data-a="sweep">
          <i className="hl1-sweep-line" data-a="sweep-line" />
          <span className="hl1-sweep-tag" data-a="sweep-tag">5:00 PM</span>
        </div>
        <div className="hl1-reticle" data-reticle aria-hidden="true">
          <svg viewBox="-40 -40 80 80">
            <circle className="c" r="17" />
            <path d="M-34 0H-6M6 0H34M0 -34V-6M0 6V34" />
            <path className="st" d="M-5 -11H5M-5 11H5" />
          </svg>
        </div>
        <div className="hl1-tag" data-tag aria-hidden="true" />
      </div>

      {/* ── the sheet ── */}
      <Rules L={L} />
      <header className="hl1-top" style={{ left: L.strip.x, top: L.strip.y, width: L.strip.w, height: L.strip.h }}>
        <a className="hl1-firm" href="#" aria-label="SmartCrew home" data-p="logo">
          <Logo className="hl1-logo" decorative />
        </a>
        {!L.phone && (
          <nav className="hl1-nav" data-p="nav">
            <a href="#day">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
        )}
      </header>

      <TitleBlock L={L} copy={copy} onCta={onCta} />

      {/* ── the intro's notifications (screen px) ── */}
      {intro && phase !== "done" && <Notes L={L} />}

      {!L.phone && <CursorEls />}
    </section>
  );
}

// ─── pieces ───────────────────────────────────────────────────────────────────

function JobSvg({ place, at, F }: { place: JobPlace; at: (p: Pt) => Pt; F: { w: number; h: number } }) {
  const fence = place.fence.map(at);
  const c = centroid(fence);
  return (
    <svg className="hl1-job" width={F.w} height={F.h} data-job={place.id} style={{ transformOrigin: `${c[0].toFixed(1)}px ${c[1].toFixed(1)}px` }} aria-hidden="true">
      {place.detail.map((d, i) => (
        <polyline key={i} className="hl1-detail" points={pts(d.map(at))} />
      ))}
      {place.dots?.map((d, i) => {
        const s = at(d);
        return <circle key={i} className="hl1-mh" cx={s[0]} cy={s[1]} r="2.6" />;
      })}
      <polygon className="hl1-fence" points={pts(fence)} />
      {place.crew.map((d, i) => {
        const s = at(d);
        return <circle key={i} className="hl1-crew" cx={s[0]} cy={s[1]} r="3" />;
      })}
    </svg>
  );
}

function Spot({ place, at, label, unit, red, big, small }: { place: JobPlace; at: (p: Pt) => Pt; label: string; unit: string; red: boolean; big?: boolean; small?: boolean }) {
  const s = at(place.spot);
  const job = JOBS[place.id];
  return (
    <span className="hl1-rider" data-ride={`${place.spot[0]},${place.spot[1]}`} style={{ left: s[0], top: s[1] }}>
      <span className={`hl1-spot is-${place.side}${big ? " is-big" : ""}${small ? " is-small" : ""}`} data-spot={place.id}>
        <svg className="hl1-tri" viewBox="-6 -6 12 12" aria-hidden="true">
          <path className="o" d="M0 -4.6 4.6 3.4H-4.6Z" />
          <path className="f" d="M0 -4.6 4.6 3.4H-4.6Z" data-tri />
        </svg>
        <span className="hl1-stack">
          <span className="hl1-jname" data-jname>
            {job.name}
          </span>
          <Odo text={label} red={red} />
          <span className="hl1-today" data-today>
            {unit}
          </span>
          <span className="hl1-sr">
            {job.full}: {label} today
          </span>
        </span>
      </span>
    </span>
  );
}

function Note({ place, at, phone }: { place: JobPlace; at: (p: Pt) => Pt; phone: boolean }) {
  if (phone || !place.note) return null;
  const a = at(place.note.from);
  const b = at(place.note.to);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return (
    <>
      <i className="hl1-leader" data-leader style={{ left: a[0], top: a[1], width: len, transform: `rotate(${ang}deg)` }} />
      <i className="hl1-leader-end" data-leader-end style={{ left: b[0], top: b[1] }} />
      <span className="hl1-note-t" data-notet style={{ right: `calc(100% - ${b[0] - 7}px)`, top: b[1] }}>
        {JOBS[place.id].note!.split(". ").map((l, i, a) => (
          <span key={i}>{i < a.length - 1 ? `${l}.` : l}</span>
        ))}
      </span>
    </>
  );
}

function Rules({ L }: { L: Layout }) {
  const { inset: i, W, H, field: F, tb, cells } = L;
  const hr = (k: string, x: number, y: number, w: number, d = 0, o: "l" | "r" = "l") => <i key={k} className={`hl1-rule h is-${o}`} data-rule={d} style={{ left: x, top: y, width: w }} />;
  // h < 0: run to the sheet's foot (phones: the sheet is as tall as its content)
  const vr = (k: string, x: number, y: number, h: number, d = 0, o: "t" | "b" = "t") => <i key={k} className={`hl1-rule v is-${o}`} data-rule={d} style={h < 0 ? { left: x, top: y, bottom: i } : { left: x, top: y, height: h }} />;
  const rules: ReactNode[] = [];
  if (L.phone) {
    rules.push(
      hr("top", i, i, W - 2 * i, 0),
      vr("l", i, i, -1, 60),
      vr("r", W - i - 1, i, -1, 60),
      <i key="bot" className="hl1-rule h" data-rule={0} style={{ left: i, bottom: i, width: W - 2 * i }} />,
      hr("strip", i, F.y, W - 2 * i, 120, "r"),
      hr("tb", i, tb.y, W - 2 * i, 180),
    );
  } else {
    const bottom = H - i - 1;
    rules.push(
      hr("top", i, i, W - 2 * i, 0),
      hr("bot", i, bottom, W - 2 * i, 40, "r"),
      vr("l", i, i, H - 2 * i, 60, "b"),
      vr("r", W - i - 1, i, H - 2 * i, 60),
      hr("strip", i, F.y, W - 2 * i, 140, "r"),
      hr("fb", i, F.y + F.h, W - 2 * i, 200),
      hr("tb", i, tb.y, W - 2 * i, 230),
      vr("c1", cells[0], tb.y, H - i - tb.y, 330),
      vr("c2", cells[1], tb.y, H - i - tb.y, 380),
    );
  }
  // edge ticks: zone marks along the sheet border (drafting sheets carry them; quiet)
  const ticks: string[] = [];
  if (!L.phone) {
    const n = 8;
    for (let k = 1; k < n; k++) {
      const x = Math.round(i + ((W - 2 * i) * k) / n) + 0.5;
      ticks.push(`M${x} ${i}v6M${x} ${H - i}v-6`);
    }
    for (const y of [Math.round(i + (F.y + F.h / 2 - i)) + 0.5]) ticks.push(`M${i} ${y}h6M${W - i} ${y}h-6`);
  }
  return (
    <div className="hl1-rules" aria-hidden="true">
      {rules}
      {ticks.length > 0 && (
        <svg className="hl1-ticks" width={W} height={H} data-p="ticks">
          <path d={ticks.join("")} />
        </svg>
      )}
    </div>
  );
}

function TitleBlock({ L, copy, onCta }: { L: Layout; copy: Copy; onCta?: (i: "trial" | "demo") => void }) {
  const { tb, cells, W, inset } = L;
  const cols = L.phone ? undefined : `${cells[0] - tb.x}px ${cells[1] - cells[0]}px ${W - inset - cells[1]}px`;
  const lines = L.phone ? copy.h1Phone : copy.h1;
  return (
    <div className="hl1-tb" style={L.phone ? { marginTop: tb.y, marginLeft: tb.x, width: tb.w } : { left: tb.x, top: tb.y, width: tb.w, height: tb.h, gridTemplateColumns: cols }}>
      <div className="hl1-cell hl1-cell--a">
        <div className="hl1-row hl1-row--a" data-p="row-a">
          <span className="hl1-label">Project</span>
          <span className="hl1-eyebrow">{EYEBROW}</span>
        </div>
        <h1 className="hl1-h1">
          {lines.map((l, i) => (
            <span key={i} className="hl1-h1-line">
              <span className="hl1-h1-in" data-h1={i}>
                {l}
              </span>
            </span>
          ))}
        </h1>
        <div className="hl1-used" data-p="used">
          <span className="hl1-label">Used by</span>
          <ul>
            {LOGOS.map((g) => (
              <li key={g.name}>
                <img src={g.src} alt={g.name} style={{ aspectRatio: String(g.aspect) }} loading={L.phone ? "lazy" : "eager"} decoding="async" />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="hl1-cell hl1-cell--b">
        <div className="hl1-row hl1-row--b" data-p="row-b">
          <span className="hl1-label">Notes</span>
          <span className="hl1-sheetno">
            <ScaleBar />
            <NorthArrow />
            <span>Sheet C-101</span>
          </span>
        </div>
        <p className="hl1-sub" data-p="sub">
          {copy.sub}
        </p>
        <p className="hl1-demo" data-p="demo">
          {DEMO_DATA}
        </p>
        <a className="hl1-cue" href="#day" data-p="cue">
          {CUE}
          <svg viewBox="0 0 14 14" aria-hidden="true">
            <path d="M7 2v9.5M3 7.6 7 11.6l4-4" />
          </svg>
        </a>
      </div>
      <div className="hl1-cell hl1-cell--c">
        <div className="hl1-row hl1-row--c" data-p="row-c">
          <span className="hl1-label">Approved</span>
          <span className="hl1-stampdate">Fri, Oct 9 · 5:00 PM</span>
        </div>
        <div className="hl1-ctawrap" data-p="cta">
          <button type="button" className="hl1-cta" data-cursor="cta" onClick={() => onCta?.("trial")}>
            <span>{CTA}</span>
            <Arrow className="hl1-cta-arrow" />
          </button>
          <svg className="hl1-ring" data-ring aria-hidden="true">
            <path className="a" data-ring-a />
            <path className="b" data-ring-b />
          </svg>
          <i className="hl1-drop" data-drop />
        </div>
        <button type="button" className="hl1-link" data-p="link" onClick={() => onCta?.("demo")}>
          {DEMO}
        </button>
        <p className="hl1-micro" data-p="micro">
          {MICRO}
        </p>
      </div>
    </div>
  );
}

function Notes({ L }: { L: Layout }) {
  const r = L.notes;
  const box = (id: NoteId): CSSProperties => ({ left: r[id].x, top: r[id].y, width: r[id].w });
  const gutter = Math.min(64, Math.max(20, L.W * 0.04));
  return (
    <div className="hl1-notes" aria-hidden="true">
      <div className="hl1-nhead" style={{ left: gutter, top: L.phone ? 28 : 32 }} data-a="nlogo">
        <Logo className="hl1-nlogo" tone="white" decorative />
      </div>
      <div className="hl1-note" style={box("clockin")} data-note="clockin">
        <span className="hl1-note-av">MB</span>
        <span className="hl1-note-tx">
          <b>Marcus Bell clocked in</b>
          <span>Hwy 9 Culvert · Pipe Laying</span>
        </span>
        <span className="hl1-note-time">6:42 AM</span>
      </div>
      <div className="hl1-note" style={box("load")} data-note="load">
        <span className="hl1-note-ic">
          <svg viewBox="0 0 24 24">
            <path d="M2.8 15.8V9.6l9.6-2.4v8.6M12.4 9.6h4.4l3.6 3.6v2.6" />
            <circle cx="6.4" cy="17.4" r="1.9" />
            <circle cx="17.2" cy="17.4" r="1.9" />
            <path d="M8.3 17.4h7M2.8 15.8h1.7M19.1 15.8h1.3" />
          </svg>
        </span>
        <span className="hl1-note-tx">
          <b>Load #14 logged</b>
          <span>12 yd³ select fill · Hollis pit</span>
        </span>
        <span className="hl1-note-time">9:20 AM</span>
      </div>
      <div className="hl1-note is-money" style={box("profit")} data-note="profit">
        <span className="hl1-note-ic">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8.8" />
            <path d="M14.6 9.3c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 2 0 2.6 5.3 1.4 5.3 4.2 0 1.2-1.2 2-2.7 2-1.3 0-2.4-.6-2.8-1.6M12 6.2v1.6M12 16.6v1.6" />
          </svg>
        </span>
        <span className="hl1-note-tx">
          <b>+$4,120 today</b>
          <span>Hwy 9 Culvert · job profit</span>
        </span>
        <span className="hl1-note-time">5:00 PM</span>
      </div>
    </div>
  );
}

function CursorEls() {
  return (
    <div className="hl1-cursor" data-cursor-root aria-hidden="true">
      <svg className="hl1-cur-ring" data-cur-ring>
        <rect data-cur-rect />
      </svg>
      <i className="hl1-cur-dot" data-cur-dot />
    </div>
  );
}

// ─── the choreography ─────────────────────────────────────────────────────────

type BuildOpts = { intro: boolean; angle: Angle; lead: number };

function build(root: HTMLElement, L: Layout, o: BuildOpts): Timeline {
  const T: Track[] = [];
  const q = <E extends Element = HTMLElement>(s: string) => root.querySelector<E>(s);
  const qa = <E extends Element = HTMLElement>(s: string) => [...root.querySelectorAll<E>(s)];
  const add = (el: Element | null, kf: Keyframe[], at: number, dur: number, ease?: string, hold?: boolean) => el && T.push({ el, kf, at, dur, ease, hold });
  const P = L.phone;
  const F = L.field;
  const fo: Pt = [F.x, F.y];
  const rootBox = root.getBoundingClientRect();
  const rel = (r: DOMRect) => ({ x: r.left - rootBox.left, y: r.top - rootBox.top, w: r.width, h: r.height });

  // ── timing (ms) ──
  const CAM = P ? 700 : 800;
  const SW_AT = P ? 760 : 800;
  const SW_DUR = P ? 900 : 1100;
  const TB = P ? 640 : 900; // title block starts plotting

  // ── measure first (static CSS = final frame) ──
  const cta = q(".hl1-ctawrap");
  const ctaBox = cta ? rel(cta.getBoundingClientRect()) : { x: 0, y: 0, w: 0, h: 0 };

  if (o.intro) {
    // ── 0 · the pull-back: the night map shrinks about Hwy 9; the day drawing comes from 1/r ──
    const night = q("[data-a=night]");
    add(night, [{ transform: "translate(0px, 0px) scale(1)" }, { transform: `translate(${L.t[0]}px, ${L.t[1]}px) scale(${L.r})` }], 0, CAM, EASE.cam, true);
    const cam = q("[data-a=cam]");
    const T0: Pt = [-L.t[0] / L.r + fo[0] / L.r - fo[0], -L.t[1] / L.r + fo[1] / L.r - fo[1]];
    add(cam, [{ transform: `translate(${T0[0]}px, ${T0[1]}px) scale(${1 / L.r})` }, { transform: "translate(0px, 0px) scale(1)" }], 0, CAM, EASE.cam);
    // things in screen space ride the same path (a point under this camera moves linearly in its eased time)
    for (const el of qa("[data-ride]")) {
      const [wx, wy] = el.dataset.ride!.split(",").map(Number);
      const a = toIntro(L, [wx, wy]);
      const b = toScreen(L, [wx, wy]);
      add(el, [{ transform: `translate(${a[0] - b[0]}px, ${a[1] - b[1]}px)` }, { transform: "translate(0px, 0px)" }], 0, CAM, EASE.cam);
    }
    // night → (a warm beat) → paper
    add(q("[data-a=warm]"), [{ opacity: 0 }, { opacity: 1 }], 0, P ? 240 : 280, EASE.inOut, true);
    add(q("[data-a=paper]"), [{ opacity: 0 }, { opacity: 1 }], P ? 110 : 130, P ? 400 : 460, EASE.inOut);
    // the day drawing fades up under it
    add(cam, [{ opacity: 0 }, { opacity: 1 }], P ? 160 : 200, P ? 420 : 460, EASE.out);

    // ── the intro's cards collapse into the drawing ──
    const mb = toScreen(L, MB_AT);
    const card = (id: NoteId) => q(`[data-note=${id}]`);
    const nr = L.notes;
    {
      const c = nr.clockin;
      const ox = 12 + 19;
      const oy = c.h / 2;
      const el = card("clockin");
      if (el) el.style.transformOrigin = `${ox}px ${oy}px`;
      add(el, [{ transform: "translate(0px, 0px) scale(1)", opacity: 1 }, { opacity: 1, offset: 0.55 }, { transform: `translate(${mb[0] - (c.x + ox)}px, ${mb[1] - (c.y + oy)}px) scale(0.16)`, opacity: 0 }], 30, P ? 460 : 520, EASE.inOut);
    }
    {
      const c = nr.load;
      const ox = 12 + 19;
      const oy = c.h / 2;
      const pit = L.scene.pit ? toScreen(L, L.scene.pit) : ([c.x, c.y + 200] as Pt);
      const el = card("load");
      if (el) el.style.transformOrigin = `${ox}px ${oy}px`;
      add(el, [{ transform: "translate(0px, 0px) scale(1)", opacity: 1 }, { opacity: 1, offset: 0.45 }, { transform: `translate(${pit[0] - (c.x + ox)}px, ${pit[1] - (c.y + oy)}px) scale(0.14)`, opacity: 0 }], 0, P ? 420 : 480, EASE.inOut);
    }
    {
      const c = nr.profit;
      const ox = 62;
      const oy = 22;
      const num = q("[data-spot=hwy9] .hl1-num");
      const nb = num ? rel(num.getBoundingClientRect()) : { x: c.x, y: c.y, w: 100, h: 40 };
      const el = card("profit");
      if (el) el.style.transformOrigin = `${ox}px ${oy}px`;
      add(el, [{ transform: "translate(0px, 0px) scale(1)", opacity: 1 }, { opacity: 1, offset: 0.5 }, { transform: `translate(${nb.x - (c.x + ox)}px, ${nb.y + nb.h / 2 - (c.y + oy)}px) scale(0.55)`, opacity: 0 }], 110, P ? 480 : 540, EASE.inOut);
    }
    // the night logo hands over to the sheet's
    const nlogo = q("[data-a=nlogo]");
    const logo = q("[data-p=logo]");
    if (nlogo && logo) {
      const a = rel(nlogo.getBoundingClientRect());
      const b = rel(logo.getBoundingClientRect());
      const s = b.h / a.h;
      nlogo.style.transformOrigin = "0 0";
      logo.style.transformOrigin = "0 0";
      add(nlogo, [{ transform: "translate(0px, 0px) scale(1)", opacity: 1 }, { transform: `translate(${b.x - a.x}px, ${b.y - a.y}px) scale(${s})`, opacity: 0 }], 120, 620, EASE.inOut);
      add(logo, [{ transform: `translate(${a.x - b.x}px, ${a.y - b.y}px) scale(${1 / s})`, opacity: 0 }, { transform: "translate(0px, 0px) scale(1)", opacity: 1 }], 120, 620, EASE.inOut);
    }
  } else {
    // no intro: the drawing plots in on paper
    const cam = q("[data-a=cam]");
    add(cam, [{ opacity: 0, transform: "scale(1.035)" }, { opacity: 1, transform: "scale(1)" }], 0, 700, EASE.out);
    add(q("[data-p=logo]"), [{ opacity: 0 }, { opacity: 1 }], 100, 500, EASE.out);
  }

  // ── Hwy 9: Marcus's dot takes the clock-in card, the crew pops in; its number is already set ──
  qa("[data-crew]").forEach((el, i) => add(el, [{ transform: "scale(0)" }, { transform: "scale(1.7)", offset: 0.45 }, { transform: "scale(1)" }], (o.intro ? 380 : 300) + i * 70, 420, EASE.out));
  const hw = q("[data-spot=hwy9]");
  if (hw) {
    add(hw.querySelector(".hl1-num"), [{ opacity: 0, transform: "scale(0.86)" }, { opacity: 1, transform: "scale(1)" }], o.intro ? 430 : 500, 380, EASE.out);
    add(hw.querySelector(".hl1-tri"), [{ opacity: 0 }, { opacity: 1 }], o.intro ? 430 : 500, 260, EASE.out);
    add(hw.querySelector("[data-jname]"), [{ opacity: 0 }, { opacity: 1 }], o.intro ? 520 : 560, 360, EASE.out);
    add(hw.querySelector("[data-today]"), [{ opacity: 0 }, { opacity: 1 }], o.intro ? 560 : 600, 360, EASE.out);
  }

  // ── the other jobs: their fences fade and scale in, staggered ──
  const order: JobId[] = ["maple", "county", "river"];
  qa("[data-job]")
    .sort((a, b) => order.indexOf(a.dataset.job as JobId) - order.indexOf(b.dataset.job as JobId))
    .forEach((el, i) => {
      const at = (o.intro ? (P ? 330 : 380) : 300) + i * (P ? 110 : 120);
      add(el, [{ opacity: 0, transform: "scale(0.92)" }, { opacity: 1, transform: "scale(1)" }], at, 440, EASE.out);
      add(q(`[data-spot=${el.dataset.job}] [data-jname]`), [{ opacity: 0 }, { opacity: 1 }], at + 120, 380, EASE.out);
      add(q(`[data-spot=${el.dataset.job}] .hl1-tri`), [{ opacity: 0 }, { opacity: 1 }], at + 80, 300, EASE.out);
    });

  // ── the sheet's rules draw (scale on 1 px elements), border first ──
  const R0 = o.intro ? (P ? 240 : 300) : 120;
  for (const el of qa("[data-rule]")) {
    const d = +(el.dataset.rule || 0);
    const h = el.classList.contains("h");
    add(el, [{ transform: h ? "scaleX(0)" : "scaleY(0)" }, { transform: "none" }], R0 + d, h ? 560 : 480, EASE.inOut);
  }
  add(q("[data-p=ticks]"), [{ opacity: 0 }, { opacity: 1 }], R0 + 500, 400, EASE.out);
  add(q("[data-p=nav]"), [{ opacity: 0 }, { opacity: 1 }], R0 + 380, 420, EASE.out);

  // ── the 5:00 PM line ──
  const xs = -1;
  const xe = P ? F.w + 2 : ctaBox.x + ctaBox.w / 2 - F.x;
  const passAt = (x: number) => SW_AT + timeAtProgress(EASE.sweep, Math.min(1, Math.max(0, (x - xs) / (xe - xs)))) * SW_DUR;
  const sweep = q("[data-a=sweep]");
  const RETRACT = 150;
  if (sweep) {
    add(sweep, [{ transform: `translateX(${xs}px)` }, { transform: `translateX(${xe}px)` }], SW_AT, SW_DUR, EASE.sweep, true);
    add(sweep, [{ opacity: 0 }, { opacity: 1 }], SW_AT, 120, "linear", true);
  }
  const line = q("[data-a=sweep-line]");
  const tag = q("[data-a=sweep-tag]");
  if (P) {
    add(line, [{ opacity: 1 }, { opacity: 0 }], SW_AT + SW_DUR - 160, 160, "linear", true);
    add(tag, [{ opacity: 1 }, { opacity: 0 }], SW_AT + SW_DUR - 220, 200, "linear", true);
  } else {
    // it falls into the APPROVED cell: the top end drops to the field's foot...
    add(line, [{ transform: "translateY(0px) scaleY(1)" }, { transform: `translateY(${F.h}px) scaleY(0)` }], SW_AT + SW_DUR, RETRACT, EASE.in, true);
    add(tag, [{ opacity: 1 }, { opacity: 0 }], SW_AT + SW_DUR - 40, 160, "linear", true);
  }

  // the numbers set as the line passes each digit
  const fieldLeft = (el: Element) => el.getBoundingClientRect().left - rootBox.left - F.x;
  let lastSet = 0;
  for (const spot of qa("[data-spot]")) {
    const id = spot.dataset.spot as JobId;
    if (id === "hwy9") {
      // already set by the profit card: the line just confirms it (the mark goes solid)
      const tri = spot.querySelector("[data-tri]");
      add(tri, [{ opacity: 0 }, { opacity: 1 }], o.intro ? 520 : 600, 200, EASE.out);
      if (!o.intro) for (const c of spot.querySelectorAll(".hl1-roll")) add(c, [{ transform: "translateY(0%)" }, { transform: `translateY(-${(100 * 6) / 7}%)` }], 500, 520, EASE.expo);
      continue;
    }
    let end = 0;
    const tri = spot.querySelector("[data-tri]");
    const t0 = passAt(fieldLeft(spot));
    add(tri, [{ opacity: 0 }, { opacity: 1 }], t0, 160, EASE.out);
    for (const ch of spot.querySelectorAll("[data-ch]")) add(ch, [{ opacity: 0 }, { opacity: 1 }], passAt(fieldLeft(ch)) - 20, 160, EASE.out);
    for (const col of spot.querySelectorAll("[data-col]")) {
      const at = passAt(fieldLeft(col)) - 30;
      const strip = col.querySelector(".hl1-roll")!;
      add(col, [{ opacity: 0 }, { opacity: 1 }], at, 120, "linear");
      add(strip, [{ transform: "translateY(0%)" }, { transform: `translateY(-${(100 * 6) / 7}%)` }], at, P ? 460 : 540, EASE.expo);
      end = Math.max(end, at + (P ? 460 : 540));
    }
    add(spot.querySelector("[data-today]"), [{ opacity: 0 }, { opacity: 1 }], end - 200, 300, EASE.out);
    if (JOBS[id].profit < 0 && o.angle !== "timecards" && o.angle !== "payroll") {
      // the only red: one ring off its fence, then the note
      const pulse = q("[data-pulse]");
      add(pulse, [{ opacity: 0, transform: "scale(1)" }, { opacity: 0.95, transform: "scale(1.02)", offset: 0.08 }, { opacity: 0, transform: "scale(1.24)" }], end - 280, 820, EASE.out, false);
      const leader = q("[data-leader]");
      if (leader) add(leader, [{ transform: leader.style.transform + " scaleX(0)" }, { transform: leader.style.transform + " scaleX(1)" }], end - 120, 320, EASE.out);
      add(q("[data-leader-end]"), [{ opacity: 0 }, { opacity: 1 }], end + 160, 200, EASE.out);
      add(q("[data-notet]"), [{ opacity: 0, transform: "translateX(-6px)" }, { opacity: 1, transform: "translateX(0px)" }], end + 60, 380, EASE.out);
      lastSet = Math.max(lastSet, end);
    }
  }
  void lastSet;

  // ── the title block plots in ──
  add(q("[data-p=row-a]"), [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], TB, 420, EASE.out);
  qa("[data-h1]").forEach((el, i) => add(el, [{ transform: "translateY(108%)" }, { transform: "translateY(0%)" }], TB + 60 + i * 70, P ? 560 : 640, EASE.expo));
  add(q("[data-p=row-b]"), [{ opacity: 0 }, { opacity: 1 }], TB + 160, 420, EASE.out);
  add(q("[data-p=sub]"), [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], TB + (P ? 240 : 280), 520, EASE.out);
  add(q("[data-p=row-c]"), [{ opacity: 0 }, { opacity: 1 }], TB + 240, 420, EASE.out);
  add(q("[data-p=cta]"), [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], TB + (P ? 380 : 470), 560, EASE.spring);
  add(q("[data-p=link]"), [{ opacity: 0 }, { opacity: 1 }], TB + (P ? 520 : 600), 420, EASE.out);
  add(q("[data-p=micro]"), [{ opacity: 0 }, { opacity: 1 }], TB + 640, 420, EASE.out);
  add(q("[data-p=demo]"), [{ opacity: 0 }, { opacity: 1 }], TB + 460, 420, EASE.out);
  add(q("[data-p=cue]"), [{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], TB + 700, 420, EASE.out);
  add(q("[data-p=used]"), [{ opacity: 0 }, { opacity: 1 }], TB + 620, 520, EASE.out);

  // ── the stamp: the line drops onto the CTA and a geofence closes round it ──
  const ring = q<SVGSVGElement>("[data-ring]");
  const RING_AT = P ? SW_AT + SW_DUR + 40 : SW_AT + SW_DUR + RETRACT + 110;
  if (ring) {
    const r = ring.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    const rad = Math.min(22, h / 2);
    const cx = w / 2;
    const p = 1; // stroke inset
    // two halves from top-centre round to bottom-centre: the ring closes at the bottom
    const right = `M${cx} ${p}H${w - rad - p}A${rad - p} ${rad - p} 0 0 1 ${w - p} ${rad}V${h - rad}A${rad - p} ${rad - p} 0 0 1 ${w - rad - p} ${h - p}H${cx}`;
    const left = `M${cx} ${p}H${rad + p}A${rad - p} ${rad - p} 0 0 0 ${p} ${rad}V${h - rad}A${rad - p} ${rad - p} 0 0 0 ${rad + p} ${h - p}H${cx}`;
    const a = ring.querySelector<SVGPathElement>("[data-ring-a]")!;
    const b = ring.querySelector<SVGPathElement>("[data-ring-b]")!;
    a.setAttribute("d", right);
    b.setAttribute("d", left);
    ring.setAttribute("viewBox", `0 0 ${w} ${h}`);
    if (P) {
      // phones: a pre-drawn ring, scale + opacity only
      add(ring, [{ opacity: 0, transform: "scale(1.08)" }, { opacity: 1, transform: "scale(1)", offset: 0.22 }, { opacity: 1, transform: "scale(1)", offset: 0.7 }, { opacity: 0, transform: "scale(1)" }], RING_AT, 2200, EASE.out);
    } else {
      const len = a.getTotalLength();
      for (const el of [a, b]) {
        el.style.strokeDasharray = `${len} ${len}`;
        add(el, [{ strokeDashoffset: `${len}` }, { strokeDashoffset: "0" }], RING_AT, 420, EASE.inOut, true);
      }
      add(ring, [{ opacity: 1 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], RING_AT, 2400, "linear");
      // the closed ring goes solid for a beat ("clocked in")
      add(ring, [{ transform: "scale(1)" }, { transform: "scale(1.035)", offset: 0.35 }, { transform: "scale(1)" }], RING_AT + 400, 420, EASE.out);
      // the drop: from the title block's top rule down onto the ring's top
      const drop = q("[data-drop]");
      if (drop) {
        const top = L.tb.y - ctaBox.y; // negative: the rule is above the CTA
        const len2 = -top - 7;
        drop.style.top = `${top}px`;
        drop.style.height = `${len2}px`;
        add(drop, [{ transform: "translateY(0px) scaleY(0)" }, { transform: "translateY(0px) scaleY(1)", offset: 0.4 }, { transform: "translateY(0px) scaleY(1)", offset: 0.55 }, { transform: `translateY(${len2}px) scaleY(0)` }], SW_AT + SW_DUR + RETRACT - 20, 360, "linear", false);
      }
    }
  }

  return timeline(T, o.lead);
}

function expose(t: Timeline, L: Layout) {
  (window as unknown as { __hl1: unknown }).__hl1 = { seek: t.seek, play: t.play, end: t.end, layout: L, progressAt };
}
