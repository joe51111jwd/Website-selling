// 6 · Five apps → one (BRIEF §6, beat 7), pinned 2.5 screens. The devices sit dark in the middle
// while five app tiles (text only, no competitor logos) drift around them; the cursor shoves them
// about. Scrolling, each is pulled into the phone or the laptop like a magnet and vanishes into the
// exact place on the screen that replaces it; the screens wake up on one SmartCrew, the phone's
// clock-in pulses across to the office, and the close comes in: "Or one that does." + CTA.
// Choreography: ./poses.ts. Tile motion: ./tiles.ts. Phones: the tiles stack over the dark phone
// and drain into it.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent } from "motion/react";
import { APPS, APPS_SCENE } from "../../content/copy";
import { Scene, useScene } from "../scene/Scene";
import { StageAnchor, phone } from "../../three/stage";
import { Cta } from "../ui/Cta";
import { CLOSE_AT, PAYOFF_AT, SHOTS, appsPoses } from "./poses";
import { runTiles } from "./tiles";
import "./apps.css";

const ease = [0.22, 1, 0.36, 1] as const;

/** Phase as React state: 0 apart · 1 all in ("Or one that does.") · 2 the close (sub + CTA).
 * Same beats with reduced motion: the tiles then fade in place instead of flying (./tiles.ts). */
function usePhase() {
  const { progress } = useScene();
  const of = (p: number) => (p >= CLOSE_AT ? 2 : p >= PAYOFF_AT ? 1 : 0);
  const [phase, setPhase] = useState(() => of(progress.get()));
  useMotionValueEvent(progress, "change", (p) => {
    const s = of(p);
    setPhase((c) => (c === s ? c : s));
  });
  return phase;
}

function AppsStage() {
  const { id, progress } = useScene();
  const phase = usePhase();
  const root = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLLIElement | null)[]>([]);
  const pings = useRef<(HTMLSpanElement | null)[]>([]);
  const cta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    const section = el.closest<HTMLElement>(`#${id}`)!;
    const stage = el.closest<HTMLElement>(".scene-stage")!;
    const anchor = el.querySelector<HTMLElement>('[data-stage-anchor="apps"]')!;
    anchor.setAttribute("data-cursor", "loupe");
    return runTiles({
      section,
      stage,
      anchor,
      tiles: tiles.current.filter(Boolean) as HTMLElement[],
      pings: pings.current.filter(Boolean) as HTMLElement[],
      progress,
      look: 0.4,
      loupe: {
        macbook: anchor.querySelector<HTMLElement>("[data-apps-loupe=macbook]")!,
        iphone: anchor.querySelector<HTMLElement>("[data-apps-loupe=iphone]")!,
      },
    });
  }, [id, progress]);

  // the cursor: the shared <Cta> has no attribute pass-through, so tag its button here
  useEffect(() => {
    const b = cta.current?.querySelector("button");
    b?.setAttribute("data-cursor", "cta");
  }, []);

  const show = (on: boolean, d = 0) => ({
    initial: false as const,
    animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    transition: { duration: on ? 0.7 : 0.3, ease, delay: on ? d : 0 },
  });

  return (
    <div className={`apps-grid wrap is-phase-${phase}`} ref={root}>
      <div className="apps-copy">
        <h2 className="t-h2 apps-title">
          <span className="apps-l1">{APPS_SCENE.lead}</span>{" "}
          <span className="apps-l2-clip">
            <motion.span
              className="apps-l2"
              initial={false}
              animate={phase >= 1 ? { y: "0%", opacity: 1 } : { y: "105%", opacity: 0 }}
              transition={{ duration: phase >= 1 ? 0.8 : 0.3, ease }}
            >
              {APPS_SCENE.payoff}
            </motion.span>
          </span>
        </h2>
        <div className="apps-close">
          <motion.p className="t-lead apps-sub" {...show(phase >= 2)}>
            {APPS_SCENE.sub}
          </motion.p>
          <motion.div className="apps-cta" ref={cta} {...show(phase >= 2, 0.08)} inert={phase < 2}>
            <Cta source="apps" />
          </motion.div>
        </div>
        <p className="t-micro apps-note">{APPS_SCENE.footnote}</p>
      </div>

      <StageAnchor
        id="apps"
        className="apps-stage"
        poster={{
          // the close (lit screens), for when WebGL is missing or slow (scratchpad proof_apps/posters-apps.cjs)
          src: phone ? "renders/apps-phone.webp" : "renders/apps.webp",
          frame: SHOTS.close.frame,
          pad: 0.12,
          alt: APPS_SCENE.posterAlt,
        }}
      >
        {/* the cursor's loupe over the screens once they're lit (quads written by ./tiles.ts) */}
        <span hidden data-apps-loupe="macbook" data-loupe-space="viewport" data-cursor-label={APPS_SCENE.loupeOffice} />
        <span
          hidden
          data-apps-loupe="iphone"
          data-loupe-space="viewport"
          data-loupe-dpr="3"
          data-loupe-size="168"
          data-cursor-label={APPS_SCENE.loupeCrew}
        />
      </StageAnchor>

      <ul className="apps-tiles" aria-label={APPS_SCENE.tilesLabel}>
        {APPS.apps.map((a, i) => (
          <li key={a.kind} className="apps-tile" ref={(el) => void (tiles.current[i] = el)}>
            <span className="apps-tile-kind">{a.kind}</span>
            <span className="apps-tile-names">{a.names}</span>
          </li>
        ))}
      </ul>
      {phone && (
        <div className="apps-pings" aria-hidden="true">
          {APPS.apps.map((a, i) => (
            <span key={a.kind} className="apps-ping" ref={(el) => void (pings.current[i] = el)} />
          ))}
        </div>
      )}

      {/* phones: hides the sticky CTA bar while this scene's own CTA is up. StickyBar finds
          [data-hides-sticky] once, at mount, so the marker always exists and is moved outside the
          stage's clip (not intersecting) until the close */}
      <span className={`apps-sticky-mark${phase >= 2 ? " is-on" : ""}`} data-hides-sticky aria-hidden="true" />
    </div>
  );
}

export default function FiveApps() {
  const poses = useMemo(appsPoses, []);
  return (
    <Scene id="apps" pinnedViewports={2.5} poses={poses} label={APPS_SCENE.label} className="apps">
      <AppsStage />
    </Scene>
  );
}
