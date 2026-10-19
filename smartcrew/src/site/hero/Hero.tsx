// 1 · The fold, round 4 (Andrew's Oct 16 doc and video). Only what earns its place above the
// fold: "Featured at ConExpo", Andrew's headline and subhead, the orange "Get my free trial" with
// "or book a demo with Andrew" stacked under it, and the "Used by" logos, on the topographic
// ground. The headline is plain type, "Heavy Civil & Dirtwork" in orange (the agency owner, Oct 17:
// "just do normal text and not the pour because it could be hard to read"). Cut this round: the eyebrow (now in the headline), the green
// job tag and chip ("the green really pulls my eye away from the headline"), the Founding Member
// line, and the "Watch a day" cue (the ride is gone).
//
// React renders the copy and the empty ground; ./land.ts fits the headline, lays the ground and
// plays the entrance. Desktop and phones share this component; phones get their own line breaks.

import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import { CTA, FLAG, HERO4, LOGOS, LOGO_VECTORS, OFFER, PROOF } from "../../content/copy";
import { config } from "../../config";
import { SHOW_FLAGS } from "../../lib/flags";
import { BOLD, CLASSIC, OPTIMIZED } from "../../lib/look";
import { PRICED, PRICE_SLOTS, priceFrom } from "../../lib/offer";
import { Flag } from "../../signup/Flag";
import { Scene } from "../scene/Scene";
import { reducedMotion } from "../../three/stage/store";
import { Cta, DemoLink } from "../ui/Cta";
import { watchHeroCta } from "../shell/heroCta";
import { usePhoneLite } from "../phone";
import { mountLanding } from "./land";
import "./fence/fence.css";
import "./hero.css";
import "./focus.css";
import "./bold.css";
import "./optimized.css";
import "./classic.css";

const BASE = import.meta.env.BASE_URL;

type Line = { pre: string; fence: string | null; post: string };

/** Split each line round the orange phrase (which may run over two lines on a phone). */
function splitLines(lines: string[], fence: string): Line[] {
  const joined = lines.join(" ");
  const at = joined.indexOf(fence);
  const end = at + fence.length;
  let o = 0;
  return lines.map((l) => {
    const s = Math.max(at, o);
    const e = Math.min(end, o + l.length);
    const line: Line = { pre: l, fence: null, post: "" };
    if (at >= 0 && e > s) {
      line.pre = l.slice(0, s - o);
      line.fence = l.slice(s - o, e - o).trim();
      line.post = l.slice(e - o);
    }
    o += l.length + 1;
    return line;
  });
}

export default function Hero() {
  const lite = usePhoneLite();
  // the bold look sets the headline in a column beside the product on laptops, so it takes the
  // phone's five-line breaks there too (same words, larger type); the optimized look's trimmed first
  // screen takes four longer lines, set smaller, so the button comes up (./optimized.css)
  const lines = useMemo(
    () => splitLines(OPTIMIZED ? HERO4.lines.trim : lite || BOLD ? HERO4.lines.phone : HERO4.lines.desk, HERO4.fence),
    [lite],
  );
  const root = useRef<HTMLDivElement>(null);
  const act = useRef<HTMLDivElement>(null);

  // the header's CTA and the phone's sticky bar appear once this button has scrolled away
  useEffect(() => watchHeroCta(act.current), [lite]);
  useLayoutEffect(() => mountLanding(root.current!, { phone: lite, reduced: reducedMotion }), [lite]);

  return (
    <Scene id="top" pinnedViewports={lite ? 0 : 1} stage="keep" label="SmartCrew" className="hero hf hf4">
      <div className={`hf-root${lite ? " hf--phone" : ""}`} ref={root}>
        <div className="hf-ground" aria-hidden="true">
          <div className="hf-ground-drift">
            <svg>
              <path className="mi" />
              <path className="ma" />
            </svg>
          </div>
        </div>

        {BOLD && (
          // the bold look's ground: a graded pad cut into rolling ground at dusk, its geofence and the
          // crew's GPS pins (rendered offline: tools/terrain/), and on laptops the product over it
          <div className="hb-art" aria-hidden="true">
            <picture>
              <source media="(max-width: 760px)" srcSet={`${BASE}bold/terrain-phone.webp`} />
              <img className="hb-terrain" src={`${BASE}bold/terrain.webp`} alt="" fetchPriority="high" decoding="async" />
            </picture>
            {!lite && <img className="hb-devices" src={`${BASE}renders/hero.webp`} alt="" decoding="async" />}
          </div>
        )}

        <div className="hf-copy">
          {CLASSIC ? (
            // Andrew's round 2: "Featured by" over the ConExpo logo, on two lines ("ConExpo is the World's
            // Largest Construction event… super high trust building")
            <p className="hf-featured">
              <span className="hf-featured-k">{HERO4.featuredBy}</span>
              {config.conexpoLogo ? (
                <img className="hf-featured-logo" src={BASE + config.conexpoLogo} alt={HERO4.featuredName} height={30} decoding="async" />
              ) : (
                <span className="hf-featured-name">
                  {HERO4.featuredName}
                  <span className="flag" title={HERO4.featuredNote} aria-label={HERO4.featuredNote}>
                    {FLAG}
                  </span>
                </span>
              )}
            </p>
          ) : (
            !OPTIMIZED && <p className="hf-eyebrow">{HERO4.featured}</p>
          )}
          <h1 className="hf-h1">
            <span className="sr-only">{HERO4.h1}</span>
            <span className="hf-h1-v" aria-hidden="true">
              {lines.map((l, i) => (
                <span className={`hf-line${l.fence ? " hf-line--fence" : ""}`} key={i}>
                  <span className="hf-line-in" style={{ "--i": lines.length - 1 - i } as CSSProperties}>
                    {l.pre}
                    {l.fence && <span className="hf-fenced">{l.fence}</span>}
                    {l.post}
                    <i className="hf-base" />
                  </span>
                </span>
              ))}
            </span>
          </h1>
          {/* optimized: Andrew's sub moves below the fold, opening the Replace section (../replace/Replace.tsx) */}
          {!OPTIMIZED && <p className="hf-sub">{HERO4.sub}</p>}
          <div className="hf-act" ref={act} data-hero-cta>
            <span className="hf-cta-wrap">
              <Cta source="hero" id="hero-cta" size="xl" className="hf-cta" cue={false} block={lite} data-cursor-magnet={6} />
            </span>
            <DemoLink source="hero" className="hf-demo" />
          </div>
          {PRICE_SLOTS && (!PRICED || priceFrom()) && (
            // the price right by the button, once Andrew sets a starting figure ("no price anywhere" was
            // the top objection; src/lib/offer.ts); a review build shows the ⚑ slot
            <p className="hb-price">
              {priceFrom() ?? (
                <>
                  <i>{OFFER.price.placeholder}</i>
                  <Flag note={OFFER.price.note} />
                </>
              )}
              {" · "}
              {CTA.micro}
            </p>
          )}
          {(BOLD || CLASSIC) && (
            // the click simulator's one repeat winner: Katie's quote right under the button (won 7 of 8
            // blind head-to-heads; /mnt/project-files/click-science/simulation/findings.md); classic
            // too since Oct 19 (James: "optimize the main one")
            <figure className="hb-proof">
              <blockquote>“{PROOF.katie.text}”</blockquote>
              <figcaption>
                {config.katiePhoto ? (
                  <img className="hb-proof-photo" src={BASE + config.katiePhoto} alt="" width={28} height={28} decoding="async" />
                ) : (
                  SHOW_FLAGS && <span className="hb-proof-photo is-slot" title={OFFER.katiePhotoNote} aria-label={OFFER.katiePhotoNote} />
                )}
                {PROOF.katie.name} · {PROOF.katie.company}{" "}
                <span className="flag" title={PROOF.flagKatie} aria-label={PROOF.flagKatie}>
                  {FLAG}
                </span>
              </figcaption>
            </figure>
          )}
        </div>

        <div className="hf-foot">
          {/* optimized: "Featured at ConExpo" joins the logos, the proof under the button, instead of
              sitting above the headline */}
          {OPTIMIZED && <p className="hb-featured">{HERO4.featured}</p>}
          <div className="hf-logos">
            <span className="hf-logos-k">{HERO4.usedBy}</span>
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
        </div>
      </div>
    </Scene>
  );
}
