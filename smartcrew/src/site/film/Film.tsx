// 2 · One Day as Andrew's own walkthrough video (version 2, ?v=video; src/site/version.ts).
// The visitor scrolls past the hero; the page glides this one-screen section into place and the
// screen is taken over: "Enjoy the ride", then the video plays (muted autoplay, as browsers
// require, with a big "Tap for sound") until it ends. The visitor's own scrolling never fights it:
// downward wheel / swipe / keys are absorbed, a clear scroll up lets go (with "Resume"), Esc or
// Skip ends it. When it ends the page lets go where it is and the section rests on the player with
// Replay and the orange CTA.
//
// The stage is one element in both states: absolute over the section at rest, fixed over the
// viewport while it plays. The page sits exactly at the section's top when it switches, so the two
// rects are the same and nothing jumps.

import { useCallback, useEffect, useRef, useState } from "react";
import { Scene } from "../scene/Scene";
import { config } from "../../config";
import { mountVidalytics } from "../../book/embeds";
import { glideTo, lockScroll } from "../scroll";
import { trackCustom } from "../../lib/track";
import { Cta } from "../ui/Cta";
import { reducedMotion } from "../../three/stage/store";
import "./film.css";

type Phase = "idle" | "title" | "playing" | "away" | "done";

const TITLE_MS = 1600;
/** px of upward wheel / swipe, within one burst, that counts as "let me out" */
const EXIT_UP = 90;

export default function Film() {
  const section = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const phaseRef = useRef<Phase>("idle");
  const taken = phase === "title" || phase === "playing";
  phaseRef.current = phase;
  const embedId = config.vidalytics.walkthrough;

  // the player: mounted once the section is near, so it's ready by the time it's needed
  useEffect(() => {
    const el = section.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      mountVidalytics(embedId, () => setFailed(true));
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        mountVidalytics(embedId, () => setFailed(true));
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [embedId]);

  // find Vidalytics' <video> once it appears, and follow it
  useEffect(() => {
    const host = frame.current;
    if (!host) return;
    let v: HTMLVideoElement | null = null;
    const onEnded = () => finish("complete");
    const attach = () => {
      const found = host.querySelector("video");
      if (!found || found === v) return;
      v = found;
      video.current = v;
      v.playsInline = true;
      v.muted = true;
      v.addEventListener("ended", onEnded);
      if (phaseRef.current === "playing") void v.play().catch(() => {});
    };
    attach();
    const mo = new MutationObserver(attach);
    mo.observe(host, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      v?.removeEventListener("ended", onEnded);
    };
    // finish is stable (useCallback on refs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback(() => {
    const v = video.current;
    if (!v) return;
    v.muted = muted;
    void v.play().catch(() => {
      // autoplay with sound refused: fall back to muted
      v.muted = true;
      setMuted(true);
      void v.play().catch(() => {});
    });
  }, [muted]);

  const take = useCallback((on: boolean) => {
    document.documentElement.classList.toggle("film-on", on);
    lockScroll(on);
  }, []);

  const finish = useCallback(
    (how: "complete" | "skip") => {
      if (phaseRef.current !== "title" && phaseRef.current !== "playing") return;
      trackCustom(how === "complete" ? "film_complete" : "film_skip");
      if (how === "skip") video.current?.pause();
      take(false);
      setPhase("done");
    },
    [take],
  );

  const start = useCallback(() => {
    const el = section.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    trackCustom("film_start");
    glideTo(top, 700, () => {
      take(true);
      setPhase("title");
      window.setTimeout(() => {
        if (phaseRef.current !== "title") return;
        setPhase("playing");
      }, TITLE_MS);
    });
  }, [take]);

  // start: once, the first time the visitor scrolls down into the section
  useEffect(() => {
    const el = section.current;
    if (!el || reducedMotion || typeof IntersectionObserver === "undefined") return;
    let lastY = window.scrollY;
    const io = new IntersectionObserver(
      ([e]) => {
        const down = window.scrollY >= lastY;
        lastY = window.scrollY;
        if (!e.isIntersecting || !down || phaseRef.current !== "idle") return;
        if (e.boundingClientRect.top <= 0) return; // arrived from below (a link, a reload)
        io.disconnect();
        start();
      },
      { threshold: [0.3] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [start]);

  // playing: start the video
  useEffect(() => {
    if (phase === "playing") play();
  }, [phase, play]);

  // while the screen is taken: absorb downward input, let a clear upward scroll out, Esc skips
  useEffect(() => {
    if (!taken) return;
    let up = 0;
    let upAt = 0;
    let touchY: number | null = null;
    const away = () => {
      trackCustom("film_exit_up");
      video.current?.pause();
      take(false);
      setPhase("away");
    };
    const addUp = (px: number) => {
      const now = performance.now();
      if (now - upAt > 400) up = 0;
      upAt = now;
      up += px;
      if (up > EXIT_UP) away();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) addUp(-e.deltaY);
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? null);
    const onTouchMove = (e: TouchEvent) => {
      // let the player's own controls take touches; the page itself never moves
      e.preventDefault();
      const y = e.touches[0]?.clientY;
      if (touchY !== null && y !== undefined) {
        if (y > touchY) addUp(y - touchY);
        touchY = y;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return finish("skip");
      if (["PageDown", "ArrowDown", "End", " "].includes(e.key) && !(e.target as HTMLElement)?.closest?.("button, [role=button]")) e.preventDefault();
      if (e.key === "PageUp" || e.key === "Home" || e.key === "ArrowUp") {
        e.preventDefault();
        away();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [taken, take, finish]);

  // the popup pauses it and leaves it paused
  useEffect(() => {
    const onPopup = (e: Event) => {
      if (!(e as CustomEvent<{ open: boolean }>).detail?.open || phaseRef.current !== "playing") return;
      video.current?.pause();
      take(false);
      setPhase("away");
    };
    window.addEventListener("smartcrew:signup-state", onPopup);
    return () => window.removeEventListener("smartcrew:signup-state", onPopup);
  }, [take]);

  // never leave the page locked behind us
  useEffect(() => () => take(false), [take]);

  const resume = () => {
    const el = section.current;
    if (!el) return;
    glideTo(el.getBoundingClientRect().top + window.scrollY, 600, () => {
      take(true);
      setPhase("playing");
    });
  };

  const replay = () => {
    const v = video.current;
    if (v) v.currentTime = 0;
    resume();
  };

  const sound = () => {
    const v = video.current;
    setMuted(false);
    if (!v) return;
    v.muted = false;
    if (v.paused) void v.play().catch(() => {});
  };

  return (
    <Scene id="day" pinnedViewports={1} stage="hide" label="Andrew walks you through SmartCrew" className="film">
      <div className="film-section" ref={section}>
        <div className={`film-stage is-${phase}${taken ? " is-taken" : ""}`}>
          <p className="film-title" aria-hidden={phase !== "title"}>
            Enjoy the ride
            <span className="film-title-sub">Andrew walks you through SmartCrew</span>
          </p>
          <div className="film-frame">
            <div ref={frame} id={`vidalytics_embed_${embedId}`} className="film-vid" />
            {failed && (
              <p className="film-failed">
                Andrew's video didn't load here. <Cta source="film" size="sm" />
              </p>
            )}
            {phase === "playing" && muted && (
              <button type="button" className="film-sound" onClick={sound} data-cursor="link">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
                  <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Tap for sound
              </button>
            )}
          </div>
          <div className="film-bar">
            {taken ? (
              <>
                <button type="button" className="film-btn" onClick={() => finish("skip")} data-cursor="link">
                  Skip
                </button>
                <Cta source="film" size="sm" />
              </>
            ) : phase === "away" ? (
              <>
                <button type="button" className="film-btn film-btn--solid" onClick={resume} data-cursor="link">
                  Resume the video
                </button>
                <Cta source="film" size="sm" />
              </>
            ) : phase === "done" ? (
              <>
                <button type="button" className="film-btn" onClick={replay} data-cursor="link">
                  Replay
                </button>
                <Cta source="film" size="md" />
              </>
            ) : (
              <button type="button" className="film-btn film-btn--solid" onClick={start} data-cursor="link">
                Play Andrew's walkthrough
              </button>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}
