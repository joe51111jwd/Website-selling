// 2 · One Day: "Enjoy the ride", v2 (RIDE_BRIEF.md; the shot list RIDE_SHOTS.md). The visitor
// scrolls past the hero; the page glides One Day into place on its own and the ride TAKES OVER the
// screen (the header slides away; the control bar keeps a small orange door out); "Enjoy the ride"
// holds over the walking map for a breath; then the day PLAYS, on one clock, at a pace you can
// read: seven moments of a workday at Cedar Ridge Earthworks on the real app, on the real 3D
// devices, as one continuous walk from dawn to Friday night, every moment its own shot, and never
// a still frame. It ends on the whole app, "That's SmartCrew." and the orange button.
//
// Who does what, all on the one clock (./ride.ts):
//   ./poses.ts      the camera: one shot per moment (the Stage's keys)
//   ./rideLife.ts   the screens' own life: taps, a running timer, forms filling, rows sliding in
//   ./Fx.tsx        the DOM that works with the devices: taps, tags, the lifted row, the ticket,
//                   the flying card, the profit card, the cursor and the crew chips
//   ./RideGround.tsx the ground: its colour through the day, the contour map it walks, the haul
//   ./RideOdo.tsx   the clock, rolling through the time in between
//   ./stageFx.ts    the light: dawn to the Friday-night lamp
// This file is the controller (trigger, takeover, controls, keys, exits) and the copy.
//
// The visitor's own scrolling never fights it (src/site/player/hold.ts): downward input is
// absorbed while it plays; a clear scroll up hands the page back ("Resume the ride"); any orange
// button pauses it and opens the popup. Reduced motion: no autoplay, no holding: the moments one
// at a time, landed, with the rail and Previous / Next. Phones: ./phone/DayPhone.tsx (2D).

import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { MOMENTS, type Moment } from "../../content/moments";
import { DAY2, DAY_UI, FLAG } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { StageAnchor } from "../../three/stage/StageAnchor";
import { onStageFrame, onStatus, poke, reducedMotion, registerPoses, sceneOnScreen, sceneY, status } from "../../three/stage/store";
import { onSignup } from "../../signup/contract";
import { Cta } from "../ui/Cta";
import { glideTo, navigatingTo } from "../scroll";
import { usePhoneLite } from "../phone";
import { Controls, EASE, Player, Soundtrack, bindPlayerKeys, holdPage, presence, usePlayer, useSound, type TrackFrame } from "../player";
import { useFirstScreenDone } from "../ready";
import { RIDE, PACE, rideChapters, type Ride } from "./ride";
import { ridePoses } from "./poses";
import { rideLifePending, startRideLife } from "./rideLife";
import { RideOdo } from "./RideOdo";
import { RideFx } from "./Fx";
import { RideSets } from "./Sets";
import "./sets.css";
import { RideGround, nightfallAt } from "./RideGround";
import { RIDE_COPY } from "./rideCopy";
import DayPhone from "./phone/DayPhone";
import "./day.css";
import "./fx.css";

const UpdateCardBody = lazy(() => import("./UpdateCard"));

/** ?rideDebug (or ?stageCap): the film on window.__ride, for captures and the e2e test on a build. */
const DEBUG = typeof location !== "undefined" && /[?&](rideDebug|stageCap)\b/.test(location.search);

// ─── the film: one per page load ────────────────────────────────────────────────

let ridePlayer: Player | null = null;
/** The ride's player (one per page load: it auto-starts once, and keeps its place across remounts). */
export function getRidePlayer() {
  if (!ridePlayer) {
    // ?rideDebug&rideRate=0.25: a slower film (tests on a slow machine keep up with it)
    const rate = DEBUG ? Number(new URLSearchParams(location.search).get("rideRate")) || 1 : 1;
    // the Stage rests (draws nothing) while "Enjoy the ride" holds (the devices wait out of sight;
    // the ground walks on, it is DOM); from the rise on, the shot is always moving
    const still: [number, number][] = [[0, RIDE.moments[0].start]];
    ridePlayer = new Player({ name: "ride", duration: RIDE.duration, chapters: rideChapters(), cues: [...RIDE.cues, nightfallAt()], reduced: reducedMotion, rate, still });
    ridePlayer.setStagePoke(poke);
    // reduced motion: no autoplay; the first moment is shown landed
    if (reducedMotion) ridePlayer.seek(RIDE.moments[0].hold[0] + 200);
  }
  return ridePlayer;
}

let rideSound: Soundtrack | null = null;
/** The ride's music (public/audio/ride.mp3, on the film's clock); none with reduced motion (no autoplay). */
export function getRideSound() {
  if (!rideSound && !reducedMotion) rideSound = new Soundtrack(getRidePlayer(), `${import.meta.env.BASE_URL}audio/ride.mp3`);
  return rideSound;
}

/** Phones get the light 2D day (./phone/DayPhone.tsx). */
export default function Day() {
  return usePhoneLite() ? <DayPhone /> : <DayDesk />;
}

function DayDesk() {
  const player = getRidePlayer();
  // the Stage plays One Day on the film's clock: its keys are in ms of the film, laid out for the
  // viewport's shape (registered again when it changes). The scene sits in the scroll timeline at
  // its top (the clock's pose)
  const [aspect, setAspect] = useState(() => window.innerWidth / Math.max(1, window.innerHeight));
  useEffect(() => {
    let t = 0;
    const on = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const a = window.innerWidth / Math.max(1, window.innerHeight);
        setAspect((x) => (Math.abs(x - a) > 0.01 ? a : x));
      }, 200);
    };
    window.addEventListener("resize", on);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", on);
    };
  }, []);
  useEffect(() => {
    const keys = ridePoses(aspect);
    // half a screen before One Day the devices wait out of sight (the film's own first
    // pose, as a scroll key): scrolling into One Day, or away from it after a jump or an exit, blends
    // through this calm pose, never through a push-in the clock happens to be showing
    const wait = { ...keys[0], at: 0, offset: -0.45, ease: "inOut" as const };
    return registerPoses("day", keys, { clock: player.sceneClock, portal: [0], lead: [wait] });
  }, [player, aspect]);
  return (
    <Scene id="day" pinnedViewports={1} stage="keep" label={DAY_UI.rail} className="day day--ride">
      <DayStage player={player} />
    </Scene>
  );
}

// ─── the controller: trigger, hold, controls, keys, CTA, end ────────────────────

type RideActions = {
  start(): void;
  play(): void;
  pause(): void;
  toggle(): void;
  skip(): void;
  replay(): void;
  chapter(i: number): void;
};

function useRide(p: Player): RideActions {
  const { actions, hold } = useMemo(() => {
    const dayTop = () => sceneY("day", 0);
    const hold = holdPage({
      y: dayTop,
      onExit: (dir) => {
        if (dir === "up") p.exitUp();
        else p.pause("away");
      },
    });
    /** glide One Day into place, hold it, then run `then` */
    const held = (then: () => void) => {
      if (p.reduced) return then();
      hold.engage(then);
    };
    const replay = () => held(() => p.replay());
    const play = () => {
      if (p.state === "ended") return replay();
      if (p.state === "playing") return;
      held(() => p.play("user"));
    };
    const pause = () => {
      p.pause("user");
      hold.release();
    };
    const skip = () => {
      p.skip();
      hold.release();
      // on to the next section, softly
      const el = document.getElementById("day");
      if (el) glideTo(el.getBoundingClientRect().bottom + window.scrollY, 800);
    };
    const actions: RideActions = {
      start: () => {
        if (p.reduced || p.started || hold.held) return;
        held(() => p.play("auto"));
      },
      play,
      pause,
      toggle: () => (p.state === "playing" ? pause() : play()),
      skip,
      replay,
      chapter: (i: number) => {
        if (p.reduced) return p.seek(p.chapters[i].rest);
        if (!p.started) {
          // not started yet: go there and play from it
          return held(() => {
            p.jumpTo(p.chapters[i].at);
            window.setTimeout(() => p.play("user"), 200);
          });
        }
        p.goChapter(i);
      },
    };
    return { actions, hold };
  }, [p]);

  useEffect(() => {
    if (p.reduced) return;
    // THE TRIGGER: the first downward scroll that brings One Day in (its top past ~75% of the
    // window: a quarter of the hero scrolled), once per page load
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY;
      lastY = y;
      if (!down || p.started || hold.held || document.documentElement.classList.contains("scroll-locked")) return;
      const top = sceneY("day", 0);
      if (top === null) return;
      // a header link passing through on its way further down (#faq) doesn't start it; one to
      // One Day itself ("How it works") does
      const nav = navigatingTo();
      if (nav !== null && Math.abs(nav - top) > 2) return;
      const vh = window.innerHeight;
      if (y >= top - 0.75 * vh && y < top + 0.3 * vh) actions.start();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // a CTA anywhere (the header's, the day's own) pauses the film and hands the page back; it
    // stays paused, with "Resume the ride", after the popup closes
    const offSignup = onSignup(() => {
      if (p.state !== "playing") return;
      p.pause("cta");
      hold.release();
    });
    // the end: the page is handed back a beat after Friday has landed
    let t = 0;
    const offState = p.on("state", (s) => {
      window.clearTimeout(t);
      if (s === "ended") t = window.setTimeout(() => hold.release(), PACE.release);
    });
    // the window changed size while it plays: One Day's top moved, hold it there
    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => hold.held && p.state === "playing" && hold.engage(), 260);
    };
    window.addEventListener("resize", onResize);
    // Space / ← → / Esc while One Day is the scene on screen
    const offKeys = bindPlayerKeys(p, {
      active: () => sceneOnScreen("day", window.scrollY, window.innerHeight),
      onSkip: actions.skip,
      onToggle: actions.toggle,
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      offSignup();
      offState();
      offKeys();
      window.clearTimeout(t);
      hold.release();
    };
  }, [p, actions, hold]);

  useEffect(() => {
    if (!DEBUG) return;
    // the screens' size on the page this frame (CSS px), for sizing the screen textures
    const quads: Record<string, number[] | null> = {};
    const offQ = onStageFrame((f) => {
      quads.macbook = f.quad("macbook");
      quads.iphone = f.quad("iphone");
    });
    (window as unknown as { __ride: unknown }).__ride = {
      quads: () => quads,
      player: p,
      ride: RIDE,
      actions,
      seek: (ms: number) => p.seek(ms),
      time: () => p.time(),
      state: () => ({ state: p.state, reason: p.reason, t: p.time(), chapter: p.chapterAt(), held: hold.held, started: p.started }),
      pending: () => rideLifePending(),
      sound: () => getRideSound()?.debug(),
    };
    return offQ;
  }, [p, actions, hold]);

  return actions;
}

// ─── the copy column ─────────────────────────────────────────────────────────────

function Features({ m }: { m: Moment }) {
  const last = m.features.length - 1;
  return (
    <>
      {m.features.map((f, k) => (
        <span key={f.id}>
          {k > 0 && " "}
          {/* the middot is glued to the end of the label before it, so a line never starts with one */}
          <span className="day-feature">
            {f.label}
            {f.confirm && (
              <span className="flag" title="Andrew to confirm">
                {FLAG}
              </span>
            )}
            {k < last && (
              <span className="day-dot" aria-hidden="true">
                {" ·"}
              </span>
            )}
          </span>
        </span>
      ))}
    </>
  );
}

/** When a moment's headline leaves: as the next moment's move begins (or the finale's). */
const outOf = (R: Ride, i: number): [number, number] => {
  const t = R.moments[i + 1]?.start ?? R.finale.start;
  return [t, t + 300];
};

function useTracks(p: Player, root: RefObject<HTMLElement | null>, sel: string, frames: (i: number) => TrackFrame[]) {
  useEffect(() => {
    const els = root.current ? [...root.current.querySelectorAll<HTMLElement>(sel)] : [];
    const offs = els.map((el) => p.track(el, frames(Number(el.dataset.i ?? 0))));
    return () => offs.forEach((f) => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, root, sel]);
}

/** Without WebGL (stills only) nothing can follow the devices: the stills and plain labels stand in. */
function useNoStage() {
  const [no, setNo] = useState(() => !status.webgl || status.failed);
  useEffect(() => onStatus(() => setNo(!status.webgl || status.failed)), []);
  return no;
}

const HeadBody = memo(function HeadBody({ m }: { m: Moment }) {
  return (
    <>
      <h3 className="day-title">{DAY2[m.id].headline}</h3>
      {/* the detail, for whoever stops to look: it shows while the ride is paused */}
      <p className="day-features">
        <Features m={m} />
      </p>
    </>
  );
});

const Heads = memo(function Heads({ chapter }: { chapter: number }) {
  return (
    <>
      {MOMENTS.map((mm, k) => (
        <div key={mm.id} className="day-head" data-i={k} data-cur={k === chapter ? "1" : undefined} aria-hidden={k !== chapter}>
          <HeadBody m={mm} />
        </div>
      ))}
    </>
  );
});

/** No WebGL: each moment's still, and its office card, in the old two-column frame. */
const NoStage = memo(function NoStage({ chapter }: { chapter: number }) {
  const m = MOMENTS[chapter];
  const copy = DAY2[m.id];
  return (
    <div className="day-nostage">
      <img className="day-nostage-img" src={`${import.meta.env.BASE_URL}renders/day-${m.id}.webp`} alt={`${m.when}: ${copy.headline}`} decoding="async" />
      <div className="day-nostage-card">
        <p className="day-tag">
          <span className="day-tag-dot" aria-hidden="true" />
          {copy.office}
        </p>
        <div className="day-card">
          <p className="day-card-where">{copy.where}</p>
          <Suspense fallback={<div className="day-card-wait" />}>
            <UpdateCardBody id={m.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
});

// ─── the scene ──────────────────────────────────────────────────────────────────

function DayStage({ player: p }: { player: Player }) {
  const R = RIDE;
  const v = usePlayer(p);
  const a = useRide(p);
  // the music: fetched once the first screen is done (it never competes with the hero), so it's
  // there before the ride starts
  const st = getRideSound();
  const sv = useSound(st);
  const firstDone = useFirstScreenDone();
  useEffect(() => {
    if (!st || !firstDone) return;
    const ric = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 300));
    ric(() => st.preload());
  }, [st, firstDone]);
  const grid = useRef<HTMLDivElement>(null);
  const ground = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLDivElement>(null);
  const noStage = useNoStage();

  // the screens' life and the light, with the Stage
  useEffect(() => {
    let gone = false;
    let stopFx = () => {};
    const stopLife = startRideLife(() => p.time());
    // the stills' office cards (the app kit) load only without WebGL
    const go = () => {
      if (gone) return;
      import("./stageFx")
        .then((m) => {
          if (!gone) stopFx = m.startStageFx(() => p.time());
        })
        .catch((e) => console.warn("[day] stage effects failed", e));
    };
    let off = () => {};
    if (status.ready) go();
    else
      off = onStatus(() => {
        if (!status.ready) return;
        off();
        go();
      });
    return () => {
      gone = true;
      off();
      stopFx();
      stopLife();
    };
  }, [p]);

  // the copy's ink follows the ground on the same clock: it turns to paper as night falls, so
  // it can never sit dark on dark (only the copy column: a colour animation restyles its subtree)
  useEffect(() => {
    const el = grid.current?.querySelector<HTMLElement>(".day-copy");
    if (!el) return;
    const cs = getComputedStyle(document.documentElement);
    const ink = cs.getPropertyValue("--ink").trim() || "#17130f";
    const paper = cs.getPropertyValue("--ink-night").trim() || "#f4eee7";
    const n = nightfallAt(R);
    return p.track(el, [
      { t: 0, color: ink },
      { t: n - 220, color: ink, ease: EASE.inOut },
      { t: n + 220, color: paper },
    ]);
  }, [p, R]);

  // the film's tracks: the title, the copy column, each headline, the finale's line and button
  useTracks(p, grid, ".day-ride-t", () => [
    { t: 0, opacity: 0, transform: "translate3d(0, 10px, 0)" },
    { t: R.title.in[0], opacity: 0, transform: "translate3d(0, 10px, 0)", ease: EASE.out },
    { t: R.title.in[1], opacity: 1, transform: "translate3d(0, 0, 0)" },
    { t: R.title.out[0], opacity: 1, transform: "translate3d(0, 0, 0)", ease: EASE.in },
    { t: R.title.out[1], opacity: 0, transform: "translate3d(0, -36px, 0)" },
  ]);
  useTracks(p, grid, ".day-ride-sub", () => [
    { t: 0, opacity: 0, transform: "translate3d(0, 10px, 0)" },
    { t: R.title.sub[0], opacity: 0, transform: "translate3d(0, 10px, 0)", ease: EASE.out },
    { t: R.title.sub[1], opacity: 1, transform: "translate3d(0, 0, 0)" },
    { t: R.title.out[0] + 60, opacity: 1, transform: "translate3d(0, 0, 0)", ease: EASE.in },
    { t: R.title.out[1] + 60, opacity: 0, transform: "translate3d(0, -36px, 0)" },
  ]);
  useTracks(p, grid, ".day-copy", () => [
    { t: 0, opacity: 1 },
    { t: R.finale.start, opacity: 1, ease: EASE.inOut },
    { t: R.finale.start + 300, opacity: 0 },
  ]);
  useTracks(p, grid, ".day-head", (i) => presence([{ in: R.moments[i].head, out: outOf(R, i) }], { rise: 12 }));
  useTracks(p, grid, ".day-end-t", () => presence([{ in: R.finale.line }], { rise: 12 }));
  useTracks(p, grid, ".day-end-cta", () => presence([{ in: R.finale.cta }], { rise: 8 }));

  // a soft jump (the rail, ← →): the film's DOM dips and comes back while the clock moves
  useEffect(() => {
    let last: Animation | null = null;
    return p.on("fade", (o, ms) => {
      const el = film.current;
      if (!el) return;
      const from = last ? Number(getComputedStyle(el).opacity) : 1;
      last?.cancel();
      const an = el.animate([{ opacity: from }, { opacity: o }], { duration: ms, easing: EASE.inOut, fill: "forwards" });
      last = an;
      if (o === 1)
        an.onfinish = () => {
          an.cancel();
          if (last === an) last = null;
        };
    });
  }, [p]);

  const i = v.chapter;
  const m = MOMENTS[i];
  const ctaOn = v.beat >= p.beatAt(R.finale.cta[0]);
  const finaleOn = v.beat >= p.beatAt(R.finale.line[0]);
  // THE TAKEOVER: while the ride plays (or the visitor has paused it in place) it owns the screen:
  // the site's header slides away (html.ride-on, ./day.css); the control bar keeps a small orange
  // door out, until the finale's own button comes in
  const engaged = v.state === "playing" || (v.state === "paused" && v.reason === "user");
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("ride-on", engaged);
    return () => html.classList.remove("ride-on");
  }, [engaged]);
  const barCta = engaged && !ctaOn;
  return (
    <div className={`day-grid${noStage ? " is-nostage" : ""}`} ref={grid} data-state={v.state} data-started={v.started ? "1" : "0"}>
      {typeof document !== "undefined" &&
        createPortal(
          <div className="day-ground" ref={ground} aria-hidden="true">
            <RideGround player={p} groundRef={ground} />
          </div>,
          document.body,
        )}

      <div className="day-film" ref={film}>
        {/* the Stage's frame: the whole takeover */}
        <StageAnchor id="day" className="day-stage" />
        {noStage && <NoStage chapter={i} />}
        {!noStage && <RideFx player={p} />}
        <RideSets player={p} />

        <div className="day-copy">
          <RideOdo player={p} ride={R} />
          <div className="day-text">
            <Heads chapter={i} />
          </div>
        </div>

        {/* the finale: centred over the whole app */}
        <div className="day-end" aria-hidden={!finaleOn}>
          <p className="day-end-t">{RIDE_COPY.finale}</p>
          <div className="day-end-cta" inert={!ctaOn}>
            <Cta source="day" size="lg" cue={false} />
          </div>
        </div>
      </div>

      {/* "Enjoy the ride": over the walking map, before the day plays */}
      {!p.reduced && (
        <div className="day-ride-title" aria-hidden={v.started && v.beat > 1}>
          <p className="day-ride-t">{RIDE_COPY.title}</p>
          <p className="day-ride-sub">{RIDE_COPY.sub(R.duration)}</p>
        </div>
      )}

      <p className="day-caption">{DAY_UI.caption}</p>

      {/* the browser won't make sound until the visitor taps or clicks: ask, once, while it plays */}
      {st && (
        <button
          type="button"
          className={`day-sound${v.state === "playing" && sv.on && sv.locked ? " is-on" : ""}`}
          onClick={() => st.enable()}
          tabIndex={v.state === "playing" && sv.on && sv.locked ? 0 : -1}
          aria-hidden={!(v.state === "playing" && sv.on && sv.locked)}
          data-cursor="link"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3.5 7.6h2.8L10 4.6v10.8l-3.7-3H3.5a.6.6 0 0 1-.6-.6V8.2c0-.3.3-.6.6-.6Z" fill="currentColor" />
            <path d="M13 7.4a3.7 3.7 0 0 1 0 5.2M15.2 5.3a6.8 6.8 0 0 1 0 9.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          {RIDE_COPY.sound.prompt}
        </button>
      )}

      <Controls
        className="day-controls"
        player={p}
        copy={RIDE_COPY.controls}
        onPlay={a.play}
        onPause={a.pause}
        onSkip={a.skip}
        onReplay={a.replay}
        onChapter={a.chapter}
        sound={st ? { on: sv.on, toggle: () => st.toggle(), label: sv.on ? RIDE_COPY.sound.off : RIDE_COPY.sound.on } : undefined}
      >
        <span className={`plc-cta${barCta ? " is-on" : ""}`} inert={!barCta}>
          <Cta source="ride" size="sm" cue={false} />
        </span>
      </Controls>

      <p className="sr-only" aria-live="polite">
        {v.started || p.reduced ? `${m.when}. ${DAY2[m.id].headline} ${DAY2[m.id].phone}. ${DAY2[m.id].office}.` : ""}
      </p>
    </div>
  );
}
