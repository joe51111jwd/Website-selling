// 1 · Hero. Copy on the left (phones: on top); on the right the real MacBook and iPhone (the
// Stage, fitted into the "hero" anchor) with the hook readable on the laptop: the clock-in toast
// lands and the job's profit ticks up (crisp DOM cards that follow the laptop, ./cards.ts). After
// the intro those two cards ARE the intro's notifications, glided onto the laptop. The ad's angle
// (?angle=) picks the headline. Phones: the headline, the devices with the toast, and the CTA
// all share the first screen; the sub shortens.

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ANGLES, CTA, HERO, HERO2, INTRO2, LOGOS, LOGO_VECTORS, readAngle } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { StageAnchor } from "../../three/stage/StageAnchor";
import { phone, reducedMotion, reveal } from "../../three/stage/store";
import type { PoseKey } from "../../three/stage/types";
import { Cta, DemoLink } from "../ui/Cta";
import { watchHeroCta } from "../shell/heroCta";
import { introRan, useIntroPhase } from "../intro/intro";
import { startTopo } from "../intro/topo";
import { scrollToScene } from "../scroll";
import { HERO_FRAME, money, mountCards } from "./cards";
import { runHeroLife } from "./screenLife";
import { Dollar, HERO_EASE, Words } from "./parts";
import HeroPhone from "./HeroPhone";
import { usePhoneLite } from "../phone";
import "./hero.css";

const ease = HERO_EASE;

/** The hero's pose: laptop three-quarter, the phone leaning in front of it. */
export function heroPoses(laptop: string): PoseKey[] {
  if (phone)
    return [
      {
        at: 0,
        anchor: "hero",
        frame: HERO_FRAME,
        macbook: { x: -0.42, y: 0.12, z: -0.4, rx: 12, ry: -20, rz: 0, s: 1, screen: laptop },
        iphone: { x: 1.62, y: -0.3, z: 1.0, rx: 5, ry: -16, rz: -3, s: 1.04, screen: "phone-working" },
        float: 1,
        look: 1,
      },
    ];
  return [
    {
      at: 0,
      anchor: "hero",
      frame: HERO_FRAME,
      macbook: { x: -0.32, y: 0.16, z: -0.5, rx: 14, ry: -26, rz: 0, s: 1, screen: laptop },
      iphone: { x: 1.3, y: -0.32, z: 1.5, rx: 5, ry: -20, rz: -3.5, s: 1.06, screen: "phone-working" },
      float: 1,
      look: 1,
    },
  ];
}

/** The two live cards on the laptop (markup = the intro's notifications in index.html). */
function HeroCards({ laptop }: { laptop: string }) {
  const layer = useRef<HTMLDivElement>(null);
  const toast = useRef<HTMLDivElement>(null);
  const profit = useRef<HTMLDivElement>(null);
  const value = useRef<HTMLElement>(null);
  const leader = useRef<SVGSVGElement>(null);
  const n = INTRO2.notes.clockin;
  const withLeader = laptop === "web-project-detail";
  useEffect(
    () => mountCards({ layer: layer.current!, toast: toast.current!, profit: profit.current!, value: value.current!, leader: leader.current }, introRan),
    [],
  );
  return (
    <div className="hero-cards" ref={layer} aria-hidden="true">
      {withLeader && (
        <svg className="hero-leader" ref={leader}>
          <line />
          <circle r="4.5" />
        </svg>
      )}
      <div className="sc-note hero-card hero-toast" ref={toast}>
        <span className="sc-note-av">{n.initials}</span>
        <span className="sc-note-tx">
          <b>{n.title}</b>
          <span>{n.meta}</span>
        </span>
        <span className="sc-note-time">{n.time}</span>
      </div>
      <div className="sc-kpi hero-card hero-profit" ref={profit}>
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

/** Phones get the light 2D hero (./HeroPhone.tsx); everything else the 3D one. */
export default function Hero() {
  return usePhoneLite() ? <HeroPhone /> : <HeroDesk />;
}

function HeroDesk() {
  const angle = useMemo(readAngle, []);
  const copy = ANGLES[angle];
  const poses = useMemo(() => heroPoses(copy.laptop), [copy.laptop]);
  const phase = useIntroPhase();
  const play = phase !== "playing";
  // (after the intro, intro.ts flips the phase once the ground has warmed: the copy builds then)
  const cta = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const act = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => watchHeroCta(cta.current), []);
  // without an intro (second visit, reduced motion) the devices come in as the page opens
  useEffect(() => {
    if (play) reveal();
  }, [play]);
  useEffect(() => runHeroLife(copy.laptop), [copy.laptop]);
  // the map under the hero: drifts with the cursor, fades as the page scrolls on
  useEffect(() => (phase === "done" ? startTopo() : undefined), [phase]);

  // phones: the devices take whatever the first screen has left between the headline and the CTA
  useLayoutEffect(() => {
    if (!phone) return;
    const fit = () => {
      const h = head.current?.offsetHeight ?? 0;
      const a = act.current?.offsetHeight ?? 0;
      const header = 56 + 10;
      const room = window.innerHeight - header - h - a - 26;
      stage.current?.style.setProperty("height", `${Math.round(Math.min(330, Math.max(200, room)))}px`);
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

  // as the page scrolls on, the copy lifts and fades while the devices fly into One Day
  const { scrollY } = useScroll();
  // (phones scroll through a taller hero, so there the copy simply scrolls away)
  const still = reducedMotion || phone;
  const exitY = useTransform(scrollY, [0, 520], [0, still ? 0 : -70]);
  const exitO = useTransform(scrollY, [80, 480], [1, still ? 1 : 0]);
  // the demo caption goes with the laptop's cards (the devices start to travel at once)
  const captionO = useTransform(scrollY, [20, 180], [1, reducedMotion ? 1 : 0]);

  const fade = (d: number) => ({
    initial: false as const,
    animate: play ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    transition: { duration: 0.8, ease, delay: d },
  });

  return (
    <Scene id="top" pinnedViewports={1} poses={poses} label="SmartCrew" className="hero">
      <div className="hero-grid wrap">
        <motion.div className="hero-head" ref={head} style={{ y: exitY, opacity: exitO }}>
          <motion.p className="hero-eyebrow" {...fade(0.05)}>
            {HERO.eyebrow}
          </motion.p>
          <h1 className="t-hero hero-h1">
            <Words text={copy.h1} delay={0.1} play={play} />
          </h1>
          <motion.p className="t-lead hero-sub" {...fade(0.42)}>
            <span className="hero-sub-full">{copy.sub}</span>
            <span className="hero-sub-short">{HERO2.subShort[angle]}</span>
          </motion.p>
        </motion.div>
        <div className="hero-stage-wrap" ref={stage}>
          <StageAnchor
            id="hero"
            className="hero-stage"
            poster={{
              src: phone ? "renders/hero-phone.webp" : "renders/hero.webp",
              frame: HERO_FRAME,
              // phones: the stage is full-bleed, so the still is the frame itself (no margin)
              pad: phone ? 0 : 0.12,
              alt: "SmartCrew on a MacBook and an iPhone",
            }}
          >
            <HeroCards laptop={copy.laptop} />
          </StageAnchor>
          <motion.div className="hero-caption" style={{ opacity: captionO }}>
            <motion.p {...fade(0.9)}>{HERO2.caption}</motion.p>
          </motion.div>
        </div>
        <motion.div className="hero-act" ref={act} style={{ y: exitY, opacity: exitO }}>
          <motion.div className="hero-actions" ref={cta} data-hero-cta {...fade(0.55)}>
            <Cta source="hero" id="hero-cta" size="xl" className="hero-cta" />
            <DemoLink source="hero" />
          </motion.div>
          <motion.p className="t-micro hero-micro" {...fade(0.62)}>
            {CTA.micro}
          </motion.p>
        </motion.div>
        <motion.div className="hero-foot" style={{ opacity: exitO }}>
          <motion.div className="hero-foot-in" {...fade(0.8)}>
            <div className="hero-logos">
              <span className="hero-logos-k">{HERO.usedBy}</span>
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
          </motion.div>
        </motion.div>
      </div>
    </Scene>
  );
}
