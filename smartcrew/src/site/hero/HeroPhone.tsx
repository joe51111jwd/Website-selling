// 1 · Hero, PHONE MODE (BRIEF ROUND 3 §1, §3; scratchpad design/v2/phone/PHONE.md). Everything in
// the first 390 × 664 screen, light and instant: the headline, a short sub, a still of the real
// 3D devices (rendered offline from the Stage at 3x: public/renders/phone-hero.webp) with the
// clock-in toast and the job's profit card as crisp DOM on the laptop, and the full-width orange
// CTA. No WebGL, no scroll-driven JS: the cards land once (or the intro glides its notifications
// onto them) and the profit ticks once.

import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import { motion } from "motion/react";
import { ANGLES, CTA, HERO, HERO2, INTRO2, LOGOS, LOGO_VECTORS, readAngle } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { reveal } from "../../three/stage/store";
import { Cta, DemoLink } from "../ui/Cta";
import { watchHeroCta } from "../shell/heroCta";
import { introRan, useIntroPhase } from "../intro/intro";
import { scrollToScene } from "../scroll";
import { money, mountStillCards, STILL_PCT } from "./cards";
import { Dollar, HERO_EASE, Words } from "./parts";
import "./hero.css";
import "./hero-phone.css";

const base = import.meta.env.BASE_URL;
/** The still: 4.6 × 3.05 frame units, rendered full-bleed at 390 px (3x and 2x files). */
export const PHONE_HERO_STILL = {
  src: `${base}renders/phone-hero.webp`,
  srcSet: `${base}renders/phone-hero-2x.webp 780w, ${base}renders/phone-hero.webp 1170w`,
  aspect: 4.6 / 3.05,
};

function StillCards() {
  const toast = useRef<HTMLDivElement>(null);
  const profit = useRef<HTMLDivElement>(null);
  const value = useRef<HTMLElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const n = INTRO2.notes.clockin;
  useEffect(() => mountStillCards({ layer: layer.current!, toast: toast.current!, profit: profit.current!, value: value.current! }, introRan), []);
  const at = (id: "toast" | "profit") => ({ ["--x" as string]: `${STILL_PCT[id].x}%`, ["--y" as string]: `${STILL_PCT[id].y}%` }) as CSSProperties;
  return (
    <div className="hph-cards" ref={layer} aria-hidden="true">
      <div className="sc-note hero-card hero-toast hph-card hph-toast" ref={toast} style={at("toast")}>
        <span className="sc-note-av">{n.initials}</span>
        <span className="sc-note-tx">
          <b>{n.title}</b>
          <span>{n.meta}</span>
        </span>
        <span className="sc-note-time">{n.time}</span>
      </div>
      <div className="sc-kpi hero-card hero-profit hph-card hph-profit" ref={profit} style={at("profit")}>
        <span className="sc-note-ic">
          <Dollar />
        </span>
        <span className="sc-kpi-tx">
          <span className="sc-kpi-l">
            {HERO2.profit.label} · {HERO2.profit.job}
          </span>
          <b className="sc-kpi-v" ref={value}>
            {money(HERO2.profit.from)}
          </b>
        </span>
        <span className="sc-kpi-d">{HERO2.profit.delta}</span>
      </div>
    </div>
  );
}

export default function HeroPhone() {
  const angle = useMemo(readAngle, []);
  const copy = ANGLES[angle];
  const phase = useIntroPhase();
  const play = phase !== "playing";
  const cta = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const act = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => watchHeroCta(cta.current), []);
  // without an intro (second visit, reduced motion) the cards come in as the page opens
  useEffect(() => {
    if (play) reveal();
  }, [play]);

  // the devices take whatever the first screen has left between the headline and the CTA
  // (measured on resize only, never per frame)
  useLayoutEffect(() => {
    const fit = () => {
      const vh = window.innerHeight;
      const h = head.current?.offsetHeight ?? 0;
      // short screens (< 640 px): only the CTA itself must share the first screen; the demo link
      // and the small print may sit just below it, so the devices keep their size
      const btn = act.current?.querySelector<HTMLElement>(".hero-cta");
      const a = vh < 640 && btn ? btn.offsetHeight + 14 : (act.current?.offsetHeight ?? 0);
      const header = 56 + 10;
      const room = vh - header - h - a - 22;
      const w = stage.current?.offsetWidth ?? window.innerWidth;
      // never taller than the still at full width
      const hMax = Math.round(w / PHONE_HERO_STILL.aspect);
      const sh = Math.round(Math.min(hMax, Math.max(180, room)));
      stage.current?.style.setProperty("height", `${sh}px`);
      // the cards shrink with the still when it can't take the full width
      stage.current?.style.setProperty("--k", Math.min(1, (sh * PHONE_HERO_STILL.aspect) / Math.min(w, 390)).toFixed(3));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (head.current) ro.observe(head.current);
    if (act.current) ro.observe(act.current);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  const fade = (d: number) => ({
    initial: false as const,
    animate: play ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
    transition: { duration: 0.7, ease: HERO_EASE, delay: d },
  });

  return (
    <Scene id="top" pinnedViewports={1} stage="keep" label="SmartCrew" className="hero hero--phone">
      <div className="hero-grid wrap">
        <div className="hero-head" ref={head}>
          <motion.p className="hero-eyebrow" {...fade(0.05)}>
            {HERO.eyebrow}
          </motion.p>
          <h1 className="t-hero hero-h1">
            <Words text={copy.h1} delay={0.08} play={play} />
          </h1>
          <motion.p className="t-lead hero-sub" {...fade(0.36)}>
            {HERO2.subShort[angle]}
          </motion.p>
        </div>
        <div className="hero-stage-wrap hph-wrap" ref={stage}>
          <div className="hph-still">
            <img
              className="hph-img"
              src={PHONE_HERO_STILL.src}
              srcSet={PHONE_HERO_STILL.srcSet}
              sizes="(max-width: 760px) 100vw, 390px"
              alt="SmartCrew on a MacBook and an iPhone"
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
            <StillCards />
          </div>
          <p className="hero-caption hph-caption">{HERO2.caption}</p>
        </div>
        <div className="hero-act" ref={act}>
          <motion.div className="hero-actions" ref={cta} data-hero-cta {...fade(0.48)}>
            <Cta source="hero" id="hero-cta" size="xl" block className="hero-cta" />
            <DemoLink source="hero" />
          </motion.div>
          <motion.p className="t-micro hero-micro" {...fade(0.56)}>
            {CTA.micro}
          </motion.p>
        </div>
        <div className="hero-foot">
          <div className="hero-foot-in">
            <div className="hero-logos">
              <span className="hero-logos-k">{HERO.usedBy}</span>
              <ul>
                {LOGOS.map((l) => {
                  const h = Math.round(Math.sqrt(1900 / l.aspect));
                  return (
                    <li key={l.name}>
                      <img
                        src={base + (LOGO_VECTORS[l.name] ?? l.src)}
                        alt={l.name}
                        width={Math.round(h * l.aspect)}
                        height={h}
                        loading="lazy"
                        decoding="async"
                        style={{ ["--h" as string]: `${h}px` }}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
            <button type="button" className="hero-cue" onClick={() => scrollToScene("day")}>
              <span>{HERO.cue}</span>
              <span className="hero-cue-line" aria-hidden="true">
                <span />
              </span>
            </button>
          </div>
        </div>
      </div>
    </Scene>
  );
}
