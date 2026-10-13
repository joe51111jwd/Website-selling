// 2 · One Day: "Enjoy the ride" (RIDE_BRIEF.md). The visitor scrolls past the hero; the page
// glides One Day into place on its own and holds it; "Enjoy the ride" holds for a breath; then
// the day PLAYS, on a clock, at one calm pace you can read: seven moments of a workday at Cedar
// Ridge Earthworks on the real app, on the real 3D devices. Built from the page's own DOM and the
// Stage, never a video.
//
// Each moment, one thing at a time, in reading order (./ride.ts): the camera glides to the shot →
// the big time rolls → the headline → a finger taps the button on the crew's phone and its screen
// shows the result (its label) → the orange pulse travels → the office screen updates in place →
// the camera pushes in on what changed and the crisp update card lands → it holds, still, to be
// read. Then the next.
//
// The visitor's own scrolling never fights it (src/site/player/hold.ts): downward input is
// absorbed while it plays; a clear scroll up hands the page back ("Resume the ride"); the header's
// orange button stays clickable (it pauses the film and opens the popup). Controls like a video
// player's: play / pause, the seven times as a rail (click to go there), Skip; Space, ← →, Esc.
// At the end it lands on Friday and its orange button, and the page is handed back: the rail
// stays as a scrubber with Replay. Once per page load it starts on its own.
//
// Reduced motion: no autoplay, no holding: the moments one at a time, landed, with the rail and
// Previous / Next. Phones: ./phone/DayPhone.tsx (2D, no WebGL).
//
// The 3D choreography is ./poses.ts (on the film's clock), the screens' own animations
// ./rideLife.ts, the light ./stageFx.ts. This file is the DOM and the controller.

import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { MOMENTS, type Moment } from "../../content/moments";
import { DAY2, DAY2_UI, DAY_UI, FLAG } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { StageAnchor } from "../../three/stage/StageAnchor";
import { onStageFrame, onStatus, poke, reducedMotion, registerPoses, sceneOnScreen, sceneY, status, type StageFrame } from "../../three/stage/store";
import { onSignup } from "../../signup/contract";
import { Cta } from "../ui/Cta";
import { glideTo, navigatingTo } from "../scroll";
import { usePhoneLite } from "../phone";
import { Controls, EASE, Player, bindPlayerKeys, holdPage, presence, usePlayer, type TrackFrame } from "../player";
import { RIDE, PACE, rideChapters, type Ride } from "./ride";
import { ridePoses, dayPosterFrame, markOf, tapOf } from "./poses";
import { SCRIPT } from "./script";
import { rideLifePending, startRideLife } from "./rideLife";
import { RideOdo } from "./RideOdo";
import { RIDE_COPY } from "./rideCopy";
import { dayPresence, luminance, readPalette, rgb } from "./clock";
import DayPhone from "./phone/DayPhone";
import "./day.css";

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
    ridePlayer = new Player({ name: "ride", duration: RIDE.duration, chapters: rideChapters(), cues: RIDE.cues, reduced: reducedMotion, rate });
    ridePlayer.setStagePoke(poke);
    // reduced motion: no autoplay; the first moment is shown landed
    if (reducedMotion) ridePlayer.seek(RIDE.moments[0].hold[0]);
  }
  return ridePlayer;
}

/** Phones get the light 2D day (./phone/DayPhone.tsx). */
export default function Day() {
  return usePhoneLite() ? <DayPhone /> : <DayDesk />;
}

function DayDesk() {
  const player = getRidePlayer();
  // the Stage plays One Day on the film's clock: its keys are in ms of the film. The scene sits in
  // the scroll timeline at its top and again three quarters of a screen earlier (where the ride
  // starts), so while the page glides in, the devices wait below the fold with One Day's stage
  useEffect(() => registerPoses("day", ridePoses(), { clock: player.sceneClock, portal: [-0.75, 0] }), [player]);
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
      held(() => p.play(p.started ? "user" : "auto"));
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
    // Space / ← → / Esc while One Day is the scene on screen
    const offKeys = bindPlayerKeys(p, {
      active: () => sceneOnScreen("day", window.scrollY, window.innerHeight),
      onSkip: actions.skip,
      onToggle: actions.toggle,
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      offSignup();
      offState();
      offKeys();
      window.clearTimeout(t);
      hold.release();
    };
  }, [p, actions, hold]);

  useEffect(() => {
    if (!DEBUG) return;
    (window as unknown as { __ride: unknown }).__ride = {
      player: p,
      ride: RIDE,
      actions,
      seek: (ms: number) => p.seek(ms),
      time: () => p.time(),
      state: () => ({ state: p.state, reason: p.reason, t: p.time(), chapter: p.chapterAt(), held: hold.held, started: p.started }),
      pending: () => rideLifePending(),
    };
  }, [p, actions, hold]);

  return actions;
}

// ─── the ground: dawn → Friday night, on the film's clock ───────────────────────

/**
 * A fixed layer just above the page's ground (portalled to <body>, under the Stage's canvas): its
 * colour follows the film (a track: it changes only while the camera glides between moments),
 * its opacity follows the scroll (One Day's presence). The header and the controls take the
 * moment's ground (--page-ground on those two only: an inherited custom property set higher up
 * restyles every element under it, a long task on a slow laptop) and Friday night's dark tone
 * (html[data-ground]) at each moment's start.
 */
function useGround(p: Player, el: RefObject<HTMLDivElement | null>, grid: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const g = el.current;
    if (!g) return;
    const pal = readPalette();
    const fr: TrackFrame[] = [{ t: 0, backgroundColor: rgb(pal.moments[0]) }];
    RIDE.moments.forEach((m, i) => {
      if (i === 0) return;
      fr.push({ t: m.start, backgroundColor: rgb(pal.moments[i - 1]), ease: EASE.inOut }, { t: m.settle, backgroundColor: rgb(pal.moments[i]) });
    });
    const offTrack = p.track(g, fr);

    const root = document.documentElement;
    const tinted = () => [document.querySelector<HTMLElement>(".site-header"), grid.current?.querySelector<HTMLElement>(".plc")].filter((x): x is HTMLElement => !!x);
    let ground = "";
    let tone = "";
    let bodyClear = false;
    let lastW = -1;
    let raf = 0;
    const setGround = (c: string) => {
      if (c === ground) return;
      ground = c;
      for (const e of tinted()) {
        if (c) e.style.setProperty("--page-ground", c);
        else e.style.removeProperty("--page-ground");
      }
    };
    const setTone = (t: string) => {
      if (t === tone) return;
      tone = t;
      if (t) root.dataset.ground = t;
      else root.removeAttribute("data-ground");
    };
    const apply = () => {
      raf = 0;
      const w = dayPresence(window.scrollY, window.innerHeight);
      if (Math.abs(w - lastW) > 0.002) {
        g.style.opacity = w.toFixed(3);
        lastW = w;
      }
      // the page's own ground (body) steps aside while One Day's shows through
      if (w > 0 && !bodyClear) {
        document.body.style.setProperty("background-color", "transparent");
        bodyClear = true;
      } else if (w <= 0 && bodyClear) {
        document.body.style.removeProperty("background-color");
        bodyClear = false;
      }
      if (w >= 0.5) {
        const c = pal.moments[p.chapterAt()];
        setGround(rgb(c));
        setTone(luminance(c) < 0.45 ? "dark" : "light");
      } else {
        setGround("");
        setTone("");
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const offBeat = p.on("beat", onScroll);
    return () => {
      offTrack();
      offBeat();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      setGround("");
      setTone("");
      if (bodyClear) document.body.style.removeProperty("background-color");
    };
  }, [p, el, grid]);
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
                {" ·"}
              </span>
            )}
          </span>
        </span>
      ))}
    </>
  );
}

/** The windows a moment's things are on screen: from when they land until the next glide begins. */
const outOf = (R: Ride, i: number): [number, number] | undefined => {
  const n = R.moments[i + 1];
  return n ? [n.start, n.start + PACE.out] : undefined;
};

function useTracks(p: Player, root: RefObject<HTMLElement | null>, sel: string, frames: (i: number) => TrackFrame[]) {
  useEffect(() => {
    const els = root.current ? [...root.current.querySelectorAll<HTMLElement>(sel)] : [];
    const offs = els.map((el) => {
      const i = Number(el.dataset.i ?? 0);
      return p.track(el, frames(i));
    });
    return () => offs.forEach((f) => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, root, sel]);
}

// ─── the annotation layer: the finger, the phone's label, leader lines ─────────

const PHONE_W = 402;

/** Without WebGL (posters only) nothing can be pinned to the phone: its label joins the office's. */
function useNoStage() {
  const [no, setNo] = useState(() => !status.webgl || status.failed);
  useEffect(() => onStatus(() => setNo(!status.webgl || status.failed)), []);
  return no;
}

const Annotations = memo(function Annotations({ p, stageRef }: { p: Player; stageRef: RefObject<HTMLDivElement | null> }) {
  const root = useRef<HTMLDivElement>(null);
  const R = RIDE;

  // the finger: a pad lands, an orange ring opens out of it (calm: no squash, no bounce)
  useTracks(p, root, ".day-touch-pad", (i) => {
    const t = R.moments[i].tap;
    return [
      { t: 0, opacity: 0, transform: "scale(1.18)" },
      { t: t - 1, opacity: 0, transform: "scale(1.18)", ease: EASE.out },
      { t: t + 200, opacity: 1, transform: "scale(1)" },
      { t: t + 420, opacity: 1, transform: "scale(1)", ease: EASE.inOut },
      { t: t + 760, opacity: 0, transform: "scale(1)" },
    ];
  });
  useTracks(p, root, ".day-touch-ring", (i) => {
    const t = R.moments[i].tap + 90;
    return [
      { t: 0, opacity: 0, transform: "scale(0.6)" },
      { t: t - 1, opacity: 0, transform: "scale(0.6)" },
      { t, opacity: 0.95, transform: "scale(0.6)", ease: EASE.out },
      { t: t + 900, opacity: 0, transform: "scale(2.4)" },
    ];
  });
  // the phone's label and its leader
  useTracks(p, root, ".day-chip-in", (i) => presence([{ in: R.moments[i].phoneLabel, out: outOf(R, i) }], { rise: 0 }).map((f) => ({ ...f, transform: f.opacity ? "translate3d(0, 0, 0)" : "translate3d(-8px, 0, 0)" })));
  useTracks(p, root, ".day-lead--phone", (i) => presence([{ in: R.moments[i].phoneLabel, out: outOf(R, i) }]));
  useTracks(p, root, ".day-lead--office", (i) => presence([{ in: [R.moments[i].card[0] + 120, R.moments[i].card[1] + 120], out: outOf(R, i) }]));

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends Element>(s: string) => [...el.querySelectorAll<T>(s)];
    const touch = q<HTMLElement>(".day-touch");
    const chips = q<HTMLElement>(".day-chip");
    const leadP = q<SVGGElement>(".day-lead--phone");
    const leadO = q<SVGGElement>(".day-lead--office");
    const set = (e: Element | null | undefined, attrs: Record<string, string | number>) => {
      if (!e) return;
      for (const k in attrs) {
        const v = String(attrs[k]);
        if (e.getAttribute(k) !== v) e.setAttribute(k, v);
      }
    };
    const place = (e: HTMLElement | undefined, x: number, y: number) => {
      if (!e) return;
      const t = `translate3d(${Math.round(x * 10) / 10}px, ${Math.round(y * 10) / 10}px, 0)`;
      if (e.style.transform !== t) e.style.transform = t;
    };
    let shown = "";
    return onStageFrame((f: StageFrame) => {
      // the layer is One Day's: it fades as the scene scrolls away (the devices glide off with it)
      const w = dayPresence(f.y, f.h);
      const o = w >= 0.98 ? "" : w.toFixed(3);
      if (o !== shown) {
        el.style.opacity = o;
        shown = o;
      }
      if (w <= 0) return false;
      const t = p.time();
      const k = R.moments.findIndex((m) => m.end > t);
      const cur = k < 0 ? R.moments.length - 1 : k;
      // the moment on screen and the one fading out
      for (const i of cur > 0 ? [cur, cur - 1] : [cur]) {
        const sc = SCRIPT[i];
        const tap = tapOf(i);
        // layout reads first (one card rect), then writes
        const card = stageRef.current?.querySelector<HTMLElement>(`.day-office[data-i="${i}"] .day-card`);
        const cardRect = card?.getBoundingClientRect() ?? null;
        const chip = chips[i];
        const cw = chip?.offsetWidth ?? 0;
        const ch = chip?.offsetHeight ?? 0;
        if (tap) {
          const pt = f.project(tap.device, tap.px[0], tap.px[1]);
          if (pt) place(touch[i], pt.x, pt.y);
        }
        // the phone's label: beside the phone, level with where its screen shows the new state
        const [ax, ay] = sc.phone.mark;
        const edge = f.project("iphone", PHONE_W, ay);
        const from = f.project("iphone", ax, ay);
        // a phone that has glided out of the frame takes its label with it
        if (chip) chip.style.visibility = edge ? "" : "hidden";
        if (edge && from && chip) {
          let x = edge.x + 22;
          if (x + cw > f.w - 8) x = Math.max(8, f.w - 8 - cw);
          const y = Math.max(72, Math.min(f.h - ch - 8, edge.y - ch / 2));
          place(chip, x, y);
          if (chip.dataset.placed !== "1") chip.dataset.placed = "1";
          const g = leadP[i];
          if (g) {
            for (const l of g.querySelectorAll("line")) set(l, { x1: from.x, y1: from.y, x2: x, y2: y + ch / 2 });
            set(g.querySelector("circle"), { cx: from.x, cy: from.y });
          }
        }
        // the office leader: from the card to the spot that changed
        const mk = markOf(i);
        const to = f.project("macbook", mk[0], mk[1]);
        const g = leadO[i];
        if (g && to && cardRect) {
          const r = cardRect;
          const below = to.y > r.bottom;
          const sx = Math.max(r.left + 28, Math.min(r.right - 28, to.x));
          const sy = below ? r.bottom : r.top;
          const pts = `${sx},${sy} ${sx},${sy + (below ? 1 : -1) * Math.min(18, Math.abs(to.y - sy) / 2)} ${to.x},${to.y}`;
          for (const l of g.querySelectorAll("polyline")) set(l, { points: pts });
          for (const c of g.querySelectorAll("circle")) set(c, { cx: to.x, cy: to.y });
        }
      }
      return false;
    });
  }, [p, R, stageRef]);

  return (
    <div className="day-ann" ref={root} aria-hidden="true">
      <svg className="day-ann-svg">
        {MOMENTS.map((m, i) => (
          <g key={m.id}>
            <g className="day-lead--phone" data-i={i}>
              <line className="day-lead day-lead-halo" />
              <line className="day-lead" />
              <circle className="day-lead-dot" r="3.5" />
            </g>
            <g className="day-lead--office" data-i={i}>
              <polyline className="day-lead day-lead-halo" fill="none" />
              <polyline className="day-lead" fill="none" />
              <circle className="day-lead-ring" r="9" />
              <circle className="day-lead-dot" r="3.5" />
            </g>
          </g>
        ))}
      </svg>
      {MOMENTS.map((m, i) => (
        <div key={m.id} className={`day-touch${SCRIPT[i].dir === "up" ? "" : " is-click"}`} data-i={i}>
          <span className="day-touch-pad" data-i={i} />
          <span className="day-touch-ring" data-i={i} />
        </div>
      ))}
      {MOMENTS.map((m, i) => (
        <div key={m.id} className="day-chip" data-i={i}>
          <p className="day-tag day-tag--phone day-chip-in" data-i={i}>
            <span className="day-tag-dot" />
            {DAY2[m.id].phone}
          </p>
        </div>
      ))}
    </div>
  );
});

// ─── the heavy, static parts (rendered once; only which one is current changes) ──────

const HeadBody = memo(function HeadBody({ m }: { m: Moment }) {
  return (
    <>
      <h3 className="day-title">{DAY2[m.id].headline}</h3>
      <p className="day-features">
        <Features m={m} />
      </p>
    </>
  );
});

const Heads = memo(function Heads({ chapter }: { chapter: number }) {
  return (
    <div className="day-text">
      {MOMENTS.map((mm, k) => (
        <div key={mm.id} className="day-head" data-i={k} aria-hidden={k !== chapter}>
          <HeadBody m={mm} />
        </div>
      ))}
    </div>
  );
});

const OfficeBody = memo(function OfficeBody({ m, noStage }: { m: Moment; noStage: boolean }) {
  const copy = DAY2[m.id];
  return (
    <>
      {noStage && (
        <p className="day-tag day-tag--phone" aria-hidden="true">
          <span className="day-tag-dot" />
          {copy.phone}
        </p>
      )}
      <p className="day-tag day-tag--office">
        <span className="day-tag-dot" aria-hidden="true" />
        <span className="sr-only">{DAY2_UI.officeSr} </span>
        {copy.office}
      </p>
      <div className="day-card" data-cursor="text">
        <p className="day-card-where">{copy.where}</p>
        <Suspense fallback={<div className="day-card-wait" />}>
          <UpdateCardBody id={m.id} />
        </Suspense>
      </div>
    </>
  );
});

const Offices = memo(function Offices({ chapter, noStage, stageRef }: { chapter: number; noStage: boolean; stageRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="day-offices" ref={stageRef}>
      {MOMENTS.map((mm, k) => (
        <div key={mm.id} className="day-office" data-i={k} aria-hidden={k !== chapter}>
          <OfficeBody m={mm} noStage={noStage} />
        </div>
      ))}
    </div>
  );
});

// ─── the scene ──────────────────────────────────────────────────────────────────

function DayStage({ player: p }: { player: Player }) {
  const R = RIDE;
  const v = usePlayer(p);
  const a = useRide(p);
  const grid = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const ground = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLDivElement>(null);
  const noStage = useNoStage();
  useGround(p, ground, grid);

  // the live layer on the screens (the press, the office updates) and the light, with the Stage
  useEffect(() => {
    let gone = false;
    let stopFx = () => {};
    const stopLife = startRideLife(() => p.time());
    // the update card's chunk (the app kit) loads while the visitor is still on the hero
    const idle = window.setTimeout(() => void import("./UpdateCard"), 1200);
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
      window.clearTimeout(idle);
      off();
      stopFx();
      stopLife();
    };
  }, [p]);

  // the film's tracks: the title, each moment's headline, the office's label and card, the CTA
  useTracks(p, grid, ".day-ride-title", () => [
    { t: 0, opacity: 1, transform: "translate3d(0, 0, 0)" },
    { t: R.title[0], opacity: 1, transform: "translate3d(0, 0, 0)", ease: EASE.inOut },
    { t: R.title[1], opacity: 0, transform: "translate3d(0, -12px, 0)" },
  ]);
  useTracks(p, grid, ".day-head", (i) => presence([{ in: R.moments[i].head, out: outOf(R, i) }], { rise: 12 }));
  useTracks(p, grid, ".day-office", (i) => presence([{ in: R.moments[i].card, out: outOf(R, i) }], { rise: 10 }));
  useTracks(p, grid, ".day-end", () => presence([{ in: R.cta }], { rise: 10 }));

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
      // faded back in: let go of the effect (no layer left behind)
      if (o === 1)
        an.onfinish = () => {
          an.cancel();
          if (last === an) last = null;
        };
    });
  }, [p]);

  const i = v.chapter;
  const m = MOMENTS[i];
  const ctaOn = v.beat >= p.beatAt(R.cta[0]);
  const frame = dayPosterFrame();
  return (
    <div className={`day-grid wrap${noStage ? " is-nostage" : ""}`} ref={grid} data-state={v.state} data-started={v.started ? "1" : "0"}>
      {typeof document !== "undefined" && createPortal(<div className="day-ground" ref={ground} aria-hidden="true" />, document.body)}

      <div className="day-film" ref={film}>
        <div className="day-copy">
          <RideOdo player={p} ride={R} />
          <Heads chapter={i} />
          <div className="day-end" inert={!ctaOn} aria-hidden={!ctaOn}>
            <Cta source="day" size="lg" cue={false} />
          </div>
        </div>

        <StageAnchor
          id="day"
          className="day-stage"
          poster={{ src: `renders/day-${m.id}.webp`, frame, pad: 0.04, alt: `${m.when}: ${DAY2[m.id].headline}` }}
        >
          <Offices chapter={i} noStage={noStage} stageRef={stage} />
        </StageAnchor>

        {!noStage && <Annotations p={p} stageRef={stage} />}
      </div>

      {/* "Enjoy the ride": on the warm ground, before the day plays */}
      {!p.reduced && (
        <div className="day-ride-title" aria-hidden={v.started && v.beat > 1}>
          <p className="day-ride-t">{RIDE_COPY.title}</p>
          <p className="day-ride-sub">{RIDE_COPY.sub(R.duration)}</p>
        </div>
      )}

      <p className="day-caption">{DAY_UI.caption}</p>

      <Controls
        className="day-controls"
        player={p}
        copy={RIDE_COPY.controls}
        onPlay={a.play}
        onPause={a.pause}
        onSkip={a.skip}
        onReplay={a.replay}
        onChapter={a.chapter}
      />

      <p className="sr-only" aria-live="polite">
        {v.started || p.reduced ? `${m.when}. ${DAY2[m.id].headline} ${DAY2_UI.phoneSr} ${DAY2[m.id].phone}. ${DAY2_UI.officeSr} ${DAY2[m.id].office}.` : ""}
      </p>
    </div>
  );
}
