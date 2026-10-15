// THE PLAYER: a scene that plays like a film, on a clock, at one pace for every visitor (One Day's
// "Enjoy the ride"; Five apps' walkthrough next). Not a video: the film is the page's own DOM and
// the 3D Stage, timed.
//
// Everything on the film is a Web Animation on one shared clock (`track(el, frames)`): opacity and
// transform keyframes at absolute times (ms). So the film
//   · plays on the compositor (no per-frame JS: phones can run it with no rAF at all),
//   · pauses exactly where it is (a tap half pressed stays half pressed),
//   · seeks to any millisecond (captures, the rail, reduced-motion stepping), and
//   · stays in sync: every animation runs on document.timeline from the same start.
// The Stage reads the same clock on its own frames (`sceneClock`, a SceneClock for
// registerPoses(…, { clock })), so the devices land on exactly the frame the DOM does.
//
// Chapters (the moments) give the rail its ticks and next / previous their stops. A jump between
// chapters is soft: the film's DOM fades down, the clock moves, it fades up again, while the Stage
// glides the devices straight from one pose to the other (never a fast-forward through the rest).
//
// Reduced motion: never plays; the visitor steps through the chapters (each shown landed) with the
// rail and Previous / Next; every change is instant.

import { trackCustom } from "../../lib/track";
import type { ClockRead, SceneClock } from "../../three/stage/store";

export type PlayerState = "idle" | "playing" | "paused" | "ended";
/** Why the film stopped: the visitor paused it, a CTA opened the popup, they scrolled up out of
 * it, pressed Skip / Esc, the tab went to the background, the page left it some other way, or
 * they are scrolling through it (it plays on again when they stop). */
export type PauseReason = "user" | "cta" | "exit" | "skip" | "hidden" | "away" | "scrub";

export type Chapter = {
  /** where the chapter begins (its transition in starts here) */
  start: number;
  /** where a jump lands while playing: the transition is done, the chapter plays from here */
  at: number;
  /** where a jump lands while paused or ended: everything in it has landed */
  rest: number;
  /** where it ends (the next one's start) */
  end: number;
  /** the rail's label ("6:42 AM") */
  label: string;
};

/** A keyframe at an absolute time (ms): CSS properties (opacity, transform, …) and the easing
 * of the segment that starts here. */
export type TrackFrame = { t: number; ease?: string } & Record<string, string | number | undefined>;

export type PlayerOpts = {
  /** analytics prefix: `${name}_start`, `_complete`, `_skip`, `_exit_up` */
  name: string;
  duration: number;
  chapters: Chapter[];
  /** extra times at which the beat changes (labels that switch on, inert flags…) */
  cues?: number[];
  reduced?: boolean;
  /** playback speed (1 = the film's own pace; tests may slow it down) */
  rate?: number;
  /**
   * Stretches of the film where nothing in the 3D Stage moves (the holds): the Stage stops
   * drawing there, so a held frame is drawn once and kept, pixel for pixel. It is woken at every
   * beat, so put a cue at the end of each stretch.
   */
  still?: [number, number][];
  /** how long a soft jump's fade takes (ms, each way) and the Stage's glide */
  jump?: { fadeOut: number; fadeIn: number; glide: number };
};

type Events = {
  state: (s: PlayerState, reason: PauseReason | null) => void;
  /** the beat (the number of cues at or before the clock) changed */
  beat: (beat: number, t: number) => void;
  /** a soft jump: fade the film's DOM to `opacity` over `ms` */
  fade: (opacity: number, ms: number) => void;
};

const now = () => performance.now();

export class Player {
  readonly name: string;
  readonly duration: number;
  readonly chapters: Chapter[];
  readonly reduced: boolean;
  readonly rate: number;
  /** sorted cue times: chapter starts, rests and the scene's own */
  readonly cues: number[];
  state: PlayerState = "idle";
  reason: PauseReason | null = null;
  /** the film has been started at least once on this page (it auto-starts once per load) */
  started = false;
  /** it has played through to the end at least once */
  completed = false;

  private clock: Animation;
  private anims = new Set<Animation>();
  private subs: { [K in keyof Events]: Set<Events[K]> } = { state: new Set(), beat: new Set(), fade: new Set() };
  private beat = -1;
  private timer = 0;
  private jumpState: { from: number; start: number; dur: number } | null = null;
  private jumpTimer = 0;
  private opts: Required<Pick<PlayerOpts, "jump">>;
  private still: [number, number][];

  constructor(o: PlayerOpts) {
    this.name = o.name;
    this.duration = o.duration;
    this.chapters = o.chapters;
    this.reduced = !!o.reduced;
    this.rate = o.rate && o.rate > 0 ? o.rate : 1;
    this.still = o.still ?? [];
    this.opts = { jump: o.jump ?? { fadeOut: 180, fadeIn: 320, glide: 950 } };
    const cues = new Set<number>(o.cues ?? []);
    o.chapters.forEach((c) => (cues.add(c.start), cues.add(c.at), cues.add(c.rest)));
    this.cues = [...cues].filter((t) => t > 0 && t <= o.duration).sort((a, b) => a - b);
    // the clock: an effect with no target, as long as the film
    this.clock = new Animation(new KeyframeEffect(null, null, { duration: o.duration, fill: "both" }), document.timeline);
    this.clock.playbackRate = this.rate;
    this.clock.pause();
    this.clock.currentTime = 0;
    this.clock.onfinish = () => this.finished();
    document.addEventListener("visibilitychange", this.onVisibility);
    this.emitBeat();
  }

  // ── the clock ──────────────────────────────────────────────────────────────

  /** The film's time now, ms. */
  time(): number {
    const t = this.clock.currentTime;
    return typeof t === "number" ? Math.max(0, Math.min(this.duration, t)) : 0;
  }

  /** For the Stage: where the devices are on the film's clock (blending during a soft jump). */
  readonly sceneClock: SceneClock = {
    read: (n: number): ClockRead => {
      const t = this.time();
      const j = this.jumpState;
      if (!j) return { a: t, b: t, w: 0 };
      const w = (now() - j.start) / j.dur;
      if (w >= 1) return { a: t, b: t, w: 0 };
      void n;
      return { a: j.from, b: t, w: Math.max(0, w) };
    },
    moving: () => {
      if (this.jumpState && now() - this.jumpState.start < this.jumpState.dur) return true;
      if (this.state !== "playing") return false;
      const t = this.time();
      return !this.still.some(([a, b]) => t >= a && t < b);
    },
  };

  /** The chapter the clock is in. */
  chapterAt(t = this.time()): number {
    let i = 0;
    while (i < this.chapters.length - 1 && this.chapters[i + 1].start <= t) i++;
    return i;
  }

  /** The number of cues at or before `t` (the beat). */
  beatAt(t = this.time()): number {
    let n = 0;
    while (n < this.cues.length && this.cues[n] <= t + 0.5) n++;
    return n;
  }

  // ── tracks ─────────────────────────────────────────────────────────────────

  /**
   * Put an element on the film: keyframes at absolute times (ms). Before its first keyframe it
   * holds the first one's values; after its last, the last's. Returns a remover.
   */
  track(el: Element, frames: TrackFrame[]): () => void {
    if (!frames.length) return () => {};
    const D = this.duration;
    const sorted = [...frames].sort((a, b) => a.t - b.t);
    const props = (f: TrackFrame) => {
      const o: Record<string, string | number> = {};
      for (const k in f) if (k !== "t" && k !== "ease" && f[k] !== undefined) o[k] = f[k] as string | number;
      return o;
    };
    const kf: Keyframe[] = sorted.map((f) => ({ ...props(f), offset: Math.max(0, Math.min(1, f.t / D)), easing: f.ease ?? "linear" }));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first.t > 0) kf.unshift({ ...props(first), offset: 0, easing: "linear" });
    if (last.t < D) kf.push({ ...props(last), offset: 1 });
    const a = el.animate(kf, { duration: D, fill: "both" });
    a.playbackRate = this.rate;
    this.sync(a);
    this.anims.add(a);
    return () => {
      this.anims.delete(a);
      a.cancel();
    };
  }

  /** Bring an animation in line with the clock (same time, same play state). */
  private sync(a: Animation) {
    if (this.state === "playing" && this.clock.playState === "running" && this.clock.startTime !== null) {
      a.startTime = this.clock.startTime;
    } else {
      a.pause();
      a.currentTime = this.time();
    }
  }

  private all(fn: (a: Animation) => void) {
    fn(this.clock);
    this.anims.forEach(fn);
  }

  // ── events ─────────────────────────────────────────────────────────────────

  on<K extends keyof Events>(ev: K, fn: Events[K]): () => void {
    (this.subs[ev] as Set<Events[K]>).add(fn);
    return () => void (this.subs[ev] as Set<Events[K]>).delete(fn);
  }
  private emit<K extends keyof Events>(ev: K, ...args: Parameters<Events[K]>) {
    (this.subs[ev] as Set<(...a: Parameters<Events[K]>) => void>).forEach((f) => f(...args));
  }

  private setState(s: PlayerState, reason: PauseReason | null = null) {
    if (this.state === s && this.reason === reason) return;
    this.state = s;
    this.reason = reason;
    this.emit("state", s, reason);
  }

  /** Re-derive the beat and schedule the next one while playing. */
  private emitBeat() {
    clearTimeout(this.timer);
    const t = this.time();
    const b = this.beatAt(t);
    if (b !== this.beat) {
      this.beat = b;
      this.emit("beat", b, t);
      // the Stage may be resting (a still stretch): wake it on every beat
      this.pokeStage();
    }
    if (this.state === "playing" && b < this.cues.length) {
      const wait = Math.max(4, (this.cues[b] - t) / this.rate + 2);
      this.timer = window.setTimeout(() => this.emitBeat(), wait);
    }
  }

  // ── transport ──────────────────────────────────────────────────────────────

  play(via: "auto" | "user" | "replay" = "user") {
    if (this.reduced || this.state === "playing") return;
    if (this.time() >= this.duration) return;
    const first = !this.started;
    this.started = true;
    this.all((a) => a.play());
    this.setState("playing");
    this.emitBeat();
    if (first || via === "replay") trackCustom(`${this.name}_start`, { via });
  }

  pause(reason: PauseReason = "user") {
    if (this.state !== "playing") {
      // a paused film keeps the strongest reason it has (an exit stays an exit if the popup opens);
      // a pause for the tab or for a scrub gives way to any other
      if (this.state === "paused" && reason !== "hidden" && (this.reason === "hidden" || this.reason === "scrub")) this.setState("paused", reason);
      return;
    }
    this.all((a) => a.pause());
    this.setState("paused", reason);
    this.emitBeat();
  }

  toggle() {
    if (this.state === "playing") this.pause("user");
    else if (this.state === "ended") this.replay();
    else this.play("user");
  }

  /** Jump the clock at once (no fade, no glide). */
  seek(t: number) {
    const tt = Math.max(0, Math.min(this.duration, t));
    // (an ended film stays "ended" while the visitor scrubs it: the rail is a scrubber, Replay plays)
    this.all((a) => (a.currentTime = tt));
    this.emitBeat();
    this.pokeStage();
  }

  /**
   * Go to another point of the film, softly: the DOM fades down, the clock moves, it fades up;
   * the Stage glides the devices from the old pose to the new one. Reduced motion: at once.
   */
  jumpTo(t: number) {
    const tt = Math.max(0, Math.min(this.duration, t));
    if (this.reduced) return this.seek(tt);
    clearTimeout(this.jumpTimer);
    const { fadeOut, fadeIn, glide } = this.opts.jump;
    const wasPlaying = this.state === "playing";
    if (wasPlaying) this.all((a) => a.pause());
    this.emit("fade", 0, fadeOut);
    this.jumpTimer = window.setTimeout(() => {
      this.jumpState = { from: this.time(), start: now(), dur: glide };
      this.seek(tt);
      if (wasPlaying && this.state === "playing") this.all((a) => a.play());
      this.emit("fade", 1, fadeIn);
      this.emitBeat();
      this.pokeStage();
    }, fadeOut);
  }

  /** Where a jump to chapter `i` lands now (playing: its start of play; otherwise everything landed). */
  chapterTarget(i: number) {
    const c = this.chapters[Math.max(0, Math.min(this.chapters.length - 1, i))];
    return this.state === "playing" ? c.at : c.rest;
  }

  goChapter(i: number) {
    this.jumpTo(this.chapterTarget(i));
  }

  next() {
    const i = this.chapterAt();
    if (i < this.chapters.length - 1) this.goChapter(i + 1);
  }

  prev() {
    const t = this.time();
    const i = this.chapterAt(t);
    // early in a chapter (or paused on it): the one before; otherwise back to this one's top
    const c = this.chapters[i];
    const back = this.state === "playing" && t - c.at > 2500 ? i : i - 1;
    this.goChapter(Math.max(0, back));
  }

  /** Play it again from the first chapter (the title and the hand-off are not repeated). */
  replay() {
    if (this.reduced) return this.seek(this.chapters[0].rest);
    this.all((a) => a.pause());
    this.setState("paused", "user");
    this.jumpTo(this.chapters[0].at);
    window.setTimeout(() => this.play("replay"), this.opts.jump.fadeOut + 10);
  }

  /** Scrolled through to the end: it's over (Replay), as if it had played to the end. */
  end() {
    if (this.state === "ended") return;
    this.all((a) => a.pause());
    this.seek(this.duration);
    this.completed = true;
    this.setState("ended");
    this.emitBeat();
    trackCustom(`${this.name}_complete`, { via: "scroll" });
  }

  /** Mark a skip (the caller hands the page back). */
  skip() {
    if (this.state === "playing") this.pause("skip");
    else if (this.state === "paused" || this.state === "idle") this.setState(this.state === "idle" ? "paused" : this.state, "skip");
    trackCustom(`${this.name}_skip`, { at: Math.round(this.time() / 1000), chapter: this.chapterAt() + 1 });
  }

  /** The visitor scrolled up out of it. */
  exitUp() {
    // (it may be mid-scroll: scrolled back past its start)
    if (this.state !== "playing" && !(this.state === "paused" && this.reason === "scrub")) return;
    this.pause("exit");
    trackCustom(`${this.name}_exit_up`, { at: Math.round(this.time() / 1000), chapter: this.chapterAt() + 1 });
  }

  private finished() {
    if (this.state !== "playing") return;
    this.all((a) => a.pause());
    this.completed = true;
    this.setState("ended");
    this.emitBeat();
    trackCustom(`${this.name}_complete`, {});
  }

  private hiddenPause = false;
  private onVisibility = () => {
    if (document.hidden && this.state === "playing") {
      this.pause("hidden");
      this.hiddenPause = true;
    } else if (!document.hidden && this.hiddenPause) {
      this.hiddenPause = false;
      if (this.state === "paused" && this.reason === "hidden") this.play("user");
    }
  };

  private stagePoke: (() => void) | null = null;
  /** The Stage's invalidate (store.poke), so a paused seek still draws a frame. */
  setStagePoke(fn: () => void) {
    this.stagePoke = fn;
  }
  private pokeStage() {
    this.stagePoke?.();
  }

  dispose() {
    clearTimeout(this.timer);
    clearTimeout(this.jumpTimer);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.all((a) => a.cancel());
    this.anims.clear();
  }
}

// ── building tracks ──────────────────────────────────────────────────────────

/** Ease names → CSS easing. Calm only: in-out glides and soft outs, no overshoot. */
export const EASE = {
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  in: "cubic-bezier(0.55, 0, 1, 0.45)",
  linear: "linear",
} as const;

/**
 * Show / hide windows → opacity (and optional rise) keyframes: visible from `in[0]`→`in[1]`
 * until `out[0]`→`out[1]`, as many times as there are windows. `rise` px: it comes up from that
 * far below as it fades in and leaves upwards by a third of it.
 */
export function presence(
  windows: { in: [number, number]; out?: [number, number] }[],
  o: { rise?: number; scale?: number; from?: number } = {},
): TrackFrame[] {
  const rise = o.rise ?? 0;
  const sc = o.scale ?? 1;
  const tf = (y: number, s = 1) => (rise || sc !== 1 ? `translate3d(0, ${y}px, 0)${s !== 1 ? ` scale(${s})` : ""}` : undefined);
  const hidden = (y: number, s = sc) => ({ opacity: 0, transform: tf(y, s) });
  const shown = { opacity: 1, transform: tf(0, 1) };
  const fr: TrackFrame[] = [{ t: o.from ?? 0, ...hidden(rise) }];
  for (const w of windows) {
    fr.push({ t: w.in[0], ease: EASE.out, ...hidden(rise) });
    fr.push({ t: w.in[1], ...shown });
    if (w.out) {
      fr.push({ t: w.out[0], ease: EASE.inOut, ...shown });
      fr.push({ t: w.out[1], ...hidden(-rise / 3, 1) });
      // back to its entrance place, invisibly, for the next window
      fr.push({ t: w.out[1] + 1, ...hidden(rise) });
    }
  }
  return fr;
}
