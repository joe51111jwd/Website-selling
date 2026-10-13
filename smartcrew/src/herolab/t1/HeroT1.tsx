// t1 · Hero: "The Site Model". The first frame is an object: the graded jobsite as a laser-cut
// site model (one sheet per 5 ft, white museum board), seen three-quarter, with the headline, the
// sub and the orange button printed on its pad. In one eased camera move it tips flat into plan
// view; the sheets close up, their edges become the contour lines, and the page is the plan: the
// copy on a level pad, the cut and fill slopes round it, the natural ground beyond.
//
// React renders the copy and the empty layers; ./ground.ts fits the type, measures the pad, asks
// the worker for the land (./terrain.ts), builds the sheets and plays the camera move (WAAPI on
// two elements; no rAF). At rest the sheets are plain flat SVGs: nothing renders. Desktop and
// phones share this component: phones get their own line breaks and copy (HERO_PHONE), a
// 5-sheet model and a tilt-only move.

import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import { ANGLES, HERO, HERO_PHONE, LOGOS, LOGO_VECTORS, readAngle } from "../../content/copy";
import { Scene } from "../../site/scene/Scene";
import { reducedMotion, reveal } from "../../three/stage/store";
import type { PoseKey } from "../../three/stage/types";
import { Cta, DemoLink } from "../../site/ui/Cta";
import { watchHeroCta } from "../../site/shell/heroCta";
import { onPageReady } from "../../site/ready";
import { scrollToScene } from "../../site/scroll";
import { usePhoneLite } from "../../site/phone";
import { mountT1 } from "./ground";
import "./t1.css";

/** The Stage's pose under the hero (as the page's hero): the devices wait below the fold. */
const HERO_PARK: PoseKey[] = [
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

type Line = { pre: string; key: string | null; post: string };

/** Split each line round the key phrase (it may run over two lines on a phone: "Friday / scramble"). */
function splitLines(lines: string[], key: string): Line[] {
  const joined = lines.join(" ");
  const at = joined.indexOf(key);
  const end = at + key.length;
  let o = 0;
  return lines.map((l) => {
    const s = Math.max(at, o);
    const e = Math.min(end, o + l.length);
    const line: Line = { pre: l, key: null, post: "" };
    if (at >= 0 && e > s) {
      line.pre = l.slice(0, s - o);
      line.key = l.slice(s - o, e - o);
      line.post = l.slice(e - o);
    }
    o += l.length + 1;
    return line;
  });
}

const Down = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2.5v10.2M3.8 8.6 8 12.8l4.2-4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function HeroT1() {
  const lite = usePhoneLite();
  const angle = useMemo(readAngle, []);
  const copy = ANGLES[angle];
  const lines = useMemo(() => splitLines(lite ? copy.lines.phone : copy.lines.desk, copy.fence), [lite, copy]);
  const root = useRef<HTMLDivElement>(null);
  const act = useRef<HTMLDivElement>(null);

  // the header's CTA and the phone's sticky bar appear once this button has scrolled away
  useEffect(() => watchHeroCta(act.current), [lite]);
  // the 3D devices' entrance (parked below the fold) waits until the first screen has landed
  useEffect(() => onPageReady(reveal), []);
  useLayoutEffect(() => mountT1(root.current!, { phone: lite, reduced: reducedMotion }), [lite]);

  return (
    <Scene id="top" pinnedViewports={1} poses={lite ? undefined : HERO_PARK} stage={lite ? "keep" : "hide"} label="SmartCrew" className="hero t1">
      <div className={`t1-root${lite ? " t1--phone" : ""}`} ref={root}>
        {/* the camera (perspective) › the model (its tilt) › the stack (its sheet separation) */}
        <div className="t1-cam">
          <div className="t1-model">
            <div className="t1-zs">
              {/* the table's shadow under the model, then the sheets (./ground.ts) */}
              <div className="t1-table" aria-hidden="true" />
              <div className="t1-sheets" aria-hidden="true" />

              {/* the copy, printed on the pad */}
              <div className="t1-copy">
                {!lite && <p className="t1-eyebrow">{HERO.eyebrow}</p>}
                <h1 className="t1-h1">
                  <span className="sr-only">{copy.h1}</span>
                  <span className="t1-h1-v" aria-hidden="true">
                    {lines.map((l, i) => (
                      <span className="t1-line" key={i}>
                        <span className="t1-line-in">
                          {l.pre}
                          {l.key && (
                            <span className="t1-key">
                              {l.key}
                              <i className="t1-tape" />
                            </span>
                          )}
                          {l.post}
                        </span>
                      </span>
                    ))}
                  </span>
                </h1>
                <p className="t1-sub">{lite ? HERO_PHONE.sub[angle] : copy.sub}</p>
                <div className="t1-act" ref={act} data-hero-cta>
                  <span className="t1-cta-wrap">
                    <Cta source="hero" id="hero-cta" size="xl" className="t1-cta" cue={false} block={lite} data-cursor-magnet={6} />
                  </span>
                  <DemoLink source="hero" className="t1-demo" />
                </div>
                <p className="t1-micro">{lite ? HERO_PHONE.micro : HERO.micro}</p>
              </div>

              <div className="t1-foot">
                <div className="t1-logos">
                  <span className="t1-logos-k">{HERO.usedBy}</span>
                  <ul>
                    {LOGOS.map((l) => {
                      const h = Math.round(Math.sqrt(1900 / l.aspect));
                      return (
                        <li key={l.name}>
                          <img
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
                <button type="button" className="t1-cue" data-cursor="link" onClick={() => scrollToScene("day")}>
                  <span>{HERO.cue}</span>
                  <Down />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* the plan's labels: index elevations and the pad's note (flat, after the camera lands) */}
        <svg className="t1-labels" aria-hidden="true" focusable="false" />
        {/* the cursor's contour readout (desktop) */}
        <svg className="t1-probe" aria-hidden="true" focusable="false" />
      </div>
    </Scene>
  );
}
