import { useEffect, useRef, useState } from "react";
import { animate, motion } from "motion/react";
import { site } from "../content/site";
import { featured, findProject, heroMedia, type Media } from "../content/work";
import { stage } from "../lib/gl/stage";
import { here } from "../lib/router";
import { clamp, easeCurtain, onTick, reducedMotion } from "../lib/ticker";
import { phase } from "../lib/transition";

const SEEN = "daniel:seen";

function firstMedia(): Media[] {
  const { route } = here.get();
  if (route.name === "project") {
    const p = findProject(route.slug);
    return p ? [heroMedia(p)] : [];
  }
  if (route.name === "home") return featured.map(heroMedia);
  return [];
}

/**
 * A counter from 000 to 100 tracking the real downloads (fonts and the films
 * the first screen needs), then the panel lifts off like the page curtain.
 * Shorter on repeat visits in the same session.
 */
export function Preloader() {
  const [gone, setGone] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let repeat = false;
    try {
      repeat = sessionStorage.getItem(SEEN) === "1";
      sessionStorage.setItem(SEEN, "1");
    } catch {
      /* private mode: always the full intro */
    }
    const minTime = reducedMotion ? 300 : repeat ? 700 : 2000;
    const media = stage.enabled ? firstMedia() : [];
    const total = media.length + 1;
    let loaded = 0;
    let live = true;
    const bump = () => {
      if (live) loaded++;
    };
    stage.preload(media, bump);
    (document.fonts?.ready ?? Promise.resolve()).then(bump);
    const start = performance.now();
    const failsafe = start + 7000;
    let shown = 0;
    let finished = false;

    const stop = onTick((time, dt) => {
      const real = time > failsafe ? 1 : loaded / total;
      const clock = clamp((time - start) / minTime);
      const target = Math.min(real, clock);
      // eased by time, not frames, so slow devices don't crawl
      shown += (target - shown) * (1 - Math.pow(0.86, dt / 16.67)) + (target > shown ? 0.002 * (dt / 16.67) : 0);
      shown = Math.min(shown, target);
      if (count.current) count.current.textContent = String(Math.round(shown * 100)).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${shown})`;
      if (!finished && shown >= 0.999) {
        finished = true;
        stop();
        setReady(true);
        leave();
      }
    });

    async function leave() {
      await new Promise((r) => setTimeout(r, reducedMotion ? 0 : 250));
      if (!live) return;
      phase.set("entering");
      if (panel.current) {
        await animate(panel.current, { clipPath: ["inset(0% 0% 0% 0%)", "inset(0% 0% 100% 0%)"] }, { duration: reducedMotion ? 0.3 : 1.05, ease: easeCurtain });
      }
      setGone(true);
      setTimeout(() => phase.set("idle"), 900);
    }
    return () => {
      live = false;
      stop();
    };
  }, []);

  if (gone) return null;
  return (
    <div className="preloader" ref={panel} aria-hidden>
      <div className="preloader-top">
        <span>{site.name}®</span>
        <span>{site.role}</span>
        <span>Portfolio ©{new Date().getFullYear()}</span>
      </div>
      <div className="preloader-status">
        <span>
          Surface <i /> <b>{ready ? "ready" : "loading"}</b>
        </span>
        <span>
          Structure <i /> <b>{ready ? "ready" : "loading"}</b>
        </span>
      </div>
      <div className="preloader-count-mask">
        <motion.div className="preloader-count" animate={ready ? { y: "-105%" } : undefined} transition={{ duration: 0.8, ease: easeCurtain }}>
          <span ref={count}>000</span>
        </motion.div>
      </div>
      <span className="preloader-bar" ref={bar} />
    </div>
  );
}
