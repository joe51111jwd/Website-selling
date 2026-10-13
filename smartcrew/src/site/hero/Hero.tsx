// 1 · Hero: "Fence the Words" (scratchpad design/v2/herolab/HERO_SPEC.md). The type is the hero:
// a centred, giant headline on the warm jobsite ground. A geofence is staked round the ad angle's
// key phrase ("every job"), the Hwy 9 crew walk in along its band and clock in on the headline, a
// flagging-tape tag tied to the fence reads that job's profit today (phones and narrow laptops: a
// job chip under the headline), and the orange "Get my free trial" sits alone on the axis
// underneath, with its own fence closing once, the "clocked in" moment. No devices in the first
// screen: the Stage parks them below the fold for One Day.
//
// React renders the copy and the empty layers; ./fence/engine.ts measures the set type, builds the
// ground, the fence and the crew, and plays the entrance (every visit). An opening can hand it
// pieces it has already delivered and keep it hidden until then (./fence/opening.ts). Desktop and
// phones share this component: phones get their own line breaks, copy (HERO_PHONE) and a light,
// transform/opacity-only engine path.

import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import { ANGLES, HERO, HERO_JOBS, HERO_PHONE, LOGOS, LOGO_VECTORS, readAngle } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { reducedMotion, reveal } from "../../three/stage/store";
import type { PoseKey } from "../../three/stage/types";
import { Cta, DemoLink } from "../ui/Cta";
import { watchHeroCta } from "../shell/heroCta";
import { onPageReady } from "../ready";
import { scrollToScene } from "../scroll";
import { usePhoneLite } from "../phone";
import { mountFence } from "./fence/engine";
import "./fence/fence.css";

/**
 * `hero-park`: the Stage's pose under the hero. The MacBook and the iPhone wait below the fold in
 * One Day's own frame (its anchor sits one screen down), tilted back and still (no float, no
 * look-around, so the Stage idles while the hero is at rest), on the screens One Day opens with.
 * As the page scrolls they rise into One Day's first shot (its clock-in key).
 */
export const HERO_PARK: PoseKey[] = [
  {
    at: 0,
    anchor: "day",
    frame: [5.3, 3.4],
    iphone: { x: -1.25, y: -0.95, z: 0.5, rx: 34, ry: 16, rz: 2, s: 1.32, screen: "phone-home" },
    macbook: { x: 0.95, y: -0.55, z: -1.3, rx: 42, ry: -24, rz: 0, s: 0.98, screen: "web-dashboard" },
    display: { show: 0 },
    float: 0,
    look: 0,
    view: { rx: 0, ry: 0 },
  },
];

type Line = { pre: string; fence: string | null; post: string; first: boolean; last: boolean };

/**
 * Split each line round the fenced phrase. The phrase may run over two or more lines (a long one on
 * a phone: "Friday / scramble"): each line gets its part, and the fence is staked round them all.
 * A fenced phrase that ends the sentence drops its full stop (on screen only).
 */
function splitLines(lines: string[], fence: string): Line[] {
  const joined = lines.join(" ");
  const at = joined.indexOf(fence);
  const end = at + fence.length;
  let o = 0;
  const out = lines.map((l, i) => {
    const s = Math.max(at, o);
    const e = Math.min(end, o + l.length);
    const line: Line = { pre: l, fence: null, post: "", first: false, last: false };
    if (at >= 0 && e > s) {
      line.pre = l.slice(0, s - o);
      line.fence = l.slice(s - o, e - o);
      line.post = l.slice(e - o);
      if (i === lines.length - 1 && /^[.!?]$/.test(line.post)) line.post = "";
    }
    o += l.length + 1;
    return line;
  });
  const fenced = out.filter((l) => l.fence);
  if (fenced.length) {
    fenced[0].first = true;
    fenced[fenced.length - 1].last = true;
  }
  return out;
}

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2.5v10.2M3.8 8.6 8 12.8l4.2-4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Hero() {
  const lite = usePhoneLite();
  const angle = useMemo(readAngle, []);
  const copy = ANGLES[angle];
  const lines = useMemo(() => splitLines(lite ? copy.lines.phone : copy.lines.desk, copy.fence), [lite, copy]);
  const root = useRef<HTMLDivElement>(null);
  const act = useRef<HTMLDivElement>(null);
  const rows = [...HERO_JOBS.rows, HERO_JOBS.rows[0]];

  // the header's CTA and the phone's sticky bar appear once this button has scrolled away
  useEffect(() => watchHeroCta(act.current), [lite]);
  // the 3D devices' entrance (parked below the fold) waits until the first screen has landed, so
  // their first draws never compete with the headline's entrance
  useEffect(() => onPageReady(reveal), []);
  useLayoutEffect(() => mountFence(root.current!, { phone: lite, reduced: reducedMotion }), [lite]);

  return (
    <Scene id="top" pinnedViewports={1} poses={lite ? undefined : HERO_PARK} stage={lite ? "keep" : "hide"} label="SmartCrew" className="hero hf">
      <div className={`hf-root${lite ? " hf--phone" : ""}`} ref={root}>
        <div className="hf-ground" aria-hidden="true">
          <div className="hf-ground-drift">
            <svg>
              <path className="mi" />
              <path className="ma" />
            </svg>
          </div>
        </div>

        <div className="hf-copy">
          {!lite && <p className="hf-eyebrow">{HERO.eyebrow}</p>}
          <h1 className="hf-h1">
            <span className="sr-only">{copy.h1}</span>
            <span className="hf-h1-v" aria-hidden="true">
              {lines.map((l, i) => (
                <span className={`hf-line${l.fence ? " hf-line--fence" : ""}${l.first ? " is-first" : ""}${l.last ? " is-last" : ""}`} key={i}>
                  <span className="hf-line-in">
                    {l.pre}
                    {l.fence && <span className="hf-fenced">{l.fence}</span>}
                    {l.post}
                    <i className="hf-base" />
                  </span>
                </span>
              ))}
            </span>
          </h1>
          {/* the job chip (phones, narrow laptops): the tag's compact form; tap it to roll to the next job */}
          <span className="hf-chip" aria-hidden="true">
            <span className="hf-chip-face">
              <svg className="hf-chip-glyph" viewBox="0 0 15 13">
                <path d="M1 6.5 4 1.2h7L14 6.5 11 11.8H4Z" />
              </svg>
              <span className="hf-chip-win">
                <span className="hf-chip-strip">
                  {rows.map((r, i) => (
                    <span className="hf-chip-row" key={i}>
                      {r.job} · <b data-tone={r.tone}>{r.today}</b>
                    </span>
                  ))}
                </span>
              </span>
            </span>
          </span>
          <p className="hf-sub">{lite ? HERO_PHONE.sub[angle] : copy.sub}</p>
          <div className="hf-act" ref={act} data-hero-cta>
            <span className="hf-cta-wrap">
              <Cta source="hero" id="hero-cta" size="xl" className="hf-cta" cue={false} block={lite} data-cursor-magnet={6} />
            </span>
            <DemoLink source="hero" className="hf-demo" />
          </div>
          <p className="hf-micro">{lite ? HERO_PHONE.micro : HERO.micro}</p>
        </div>

        <div className="hf-foot">
          <div className="hf-logos">
            <span className="hf-logos-k">{HERO.usedBy}</span>
            <ul>
              {LOGOS.map((l) => {
                const h = Math.round(Math.sqrt(1900 / l.aspect));
                return (
                  <li key={l.name}>
                    <img
                      // vector where a faithful trace exists (crisp at any size), raster otherwise
                      src={import.meta.env.BASE_URL + (LOGO_VECTORS[l.name] ?? l.src)}
                      alt={l.name}
                      width={Math.round(h * l.aspect)}
                      height={h}
                      style={{ "--h": `${h}px` } as CSSProperties}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
          <button type="button" className="hf-cue" data-cursor="link" onClick={() => scrollToScene("day")}>
            <span>{HERO.cue}</span>
            <Arrow />
          </button>
        </div>

        {/* the jobsite on the headline: fence, crew, the tag, the button's own fence (decoration) */}
        <div className="hf-fx" aria-hidden="true">
          <div className="hf-svgl hf-tape" />
          <div className="hf-svgl hf-ring" />
          <div className="hf-svgl hf-ring-s" />
          <div className="hf-svgl hf-ring-p" />
          <div className="hf-svgl hf-fence" />
          <div className="hf-svgl hf-pulse" />
          {!lite && (
            <>
              {HERO_JOBS.crew.map((c) => (
                <span className="hf-stamp" data-id={c.id} key={c.id}>
                  {c.time}
                </span>
              ))}
              <div className="hf-tag" data-cursor="link">
                <div className="hf-tag-bgw">
                  <div className="hf-tag-shadow" />
                  <svg className="hf-tag-bg" />
                </div>
                <div className="hf-tag-face">
                  <div className="hf-tag-win">
                    <div className="hf-tag-strip">
                      {rows.map((r, i) => (
                        <div className="hf-tag-row" key={i}>
                          <span className="hf-tag-job">{r.job}</span>
                          <span className="hf-tag-state" data-tone={r.tone}>
                            {r.today}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="hf-tag-note">{HERO_JOBS.note}</p>
            </>
          )}
          {HERO_JOBS.crew.map((c) => (
            <div className="hf-mk" data-id={c.id} key={c.id}>
              <span className="hf-mk-i">{c.initials}</span>
              <span className="hf-mk-t">{c.time}</span>
              <i className="hf-mk-ring" />
              <i className="hf-mk-dot" />
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}
