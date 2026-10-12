// 1 · Hero. Copy on the left; on the right the real MacBook and iPhone (the Stage, fitted into the
// "hero" anchor) with the office screen coming alive. The ad's angle (?angle=) picks the headline.

import { useEffect, useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ANGLES, CTA, HERO, LOGOS, readAngle } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { StageAnchor } from "../../three/stage/StageAnchor";
import { phone, reducedMotion, reveal } from "../../three/stage/store";
import type { PoseKey } from "../../three/stage/types";
import { Cta, DemoLink } from "../ui/Cta";
import { watchHeroCta } from "../shell/heroCta";
import { useIntroPhase } from "../intro/intro";
import { scrollToScene } from "../scroll";
import { runHeroLife } from "./screenLife";
import "./hero.css";

const ease = [0.22, 1, 0.36, 1] as const;

/** The hero's pose: laptop three-quarter, the phone leaning in front of it. */
export function heroPoses(laptop: string): PoseKey[] {
  if (phone)
    return [
      {
        at: 0,
        anchor: "hero",
        frame: [5.2, 3.0],
        macbook: { x: -0.35, y: -0.1, z: -0.4, rx: 14, ry: -18, rz: 0, s: 1, screen: laptop },
        iphone: { x: 1.75, y: -0.25, z: 1.0, rx: 6, ry: -16, rz: -3, s: 1.08, screen: "phone-working" },
        float: 1,
        look: 1,
      },
    ];
  return [
    {
      at: 0,
      anchor: "hero",
      frame: [4.5, 3.2],
      macbook: { x: -0.32, y: 0.16, z: -0.5, rx: 14, ry: -26, rz: 0, s: 1, screen: laptop },
      iphone: { x: 1.3, y: -0.32, z: 1.5, rx: 5, ry: -20, rz: -3.5, s: 1.06, screen: "phone-working" },
      float: 1,
      look: 1,
    },
  ];
}

function Words({ text, delay, play }: { text: string; delay: number; play: boolean }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className="hero-word-clip">
            <motion.span
              className="hero-word"
              initial={false}
              animate={play ? { y: "0%", opacity: 1 } : { y: "105%", opacity: 0 }}
              transition={{ duration: 0.9, ease, delay: delay + i * 0.055 }}
            >
              {w}
            </motion.span>
          </span>{" "}
        </span>
      ))}
    </>
  );
}

export default function Hero() {
  const angle = useMemo(readAngle, []);
  const copy = ANGLES[angle];
  const poses = useMemo(() => heroPoses(copy.laptop), [copy.laptop]);
  const phase = useIntroPhase();
  const play = phase !== "playing";
  const cta = useRef<HTMLDivElement>(null);

  useEffect(() => watchHeroCta(cta.current), []);
  // without an intro (second visit, reduced motion) the devices come in as the page opens
  useEffect(() => {
    if (play) reveal();
  }, [play]);
  useEffect(() => runHeroLife(copy.laptop), [copy.laptop]);

  // as the page scrolls on, the copy lifts and fades while the devices fly into One Day
  const { scrollY } = useScroll();
  // (phones scroll through a taller hero, so there the copy simply scrolls away)
  const still = reducedMotion || phone;
  const exitY = useTransform(scrollY, [0, 520], [0, still ? 0 : -70]);
  const exitO = useTransform(scrollY, [80, 480], [1, still ? 1 : 0]);

  const fade = (d: number) => ({
    initial: false as const,
    animate: play ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    transition: { duration: 0.8, ease, delay: d },
  });

  return (
    <Scene id="top" pinnedViewports={1} poses={poses} label="SmartCrew" className="hero">
      <div className="hero-grid wrap">
        <motion.div className="hero-copy" style={{ y: exitY, opacity: exitO }}>
          <motion.p className="hero-eyebrow" {...fade(0.05)}>
            {HERO.eyebrow}
          </motion.p>
          <h1 className="t-hero hero-h1">
            <Words text={copy.h1} delay={0.1} play={play} />
          </h1>
          <motion.p className="t-lead hero-sub" {...fade(0.42)}>
            {copy.sub}
          </motion.p>
          <motion.div className="hero-actions" ref={cta} data-hero-cta {...fade(0.55)}>
            <Cta source="hero" id="hero-cta" />
            <DemoLink source="hero" />
          </motion.div>
          <motion.p className="t-micro hero-micro" {...fade(0.62)}>
            {CTA.micro}
          </motion.p>
        </motion.div>
        <StageAnchor
          id="hero"
          className="hero-stage"
          poster={{
            src: phone ? "renders/hero-phone.webp" : "renders/hero.webp",
            frame: phone ? [5.2, 3.0] : [4.5, 3.2],
            pad: 0.12,
            alt: "SmartCrew on a MacBook and an iPhone",
          }}
        />
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
                        src={import.meta.env.BASE_URL + l.src}
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
