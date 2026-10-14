// THE SOUNDTRACK: one music file on a film's clock (One Day's ride: public/audio/ride.mp3, cut to
// the ride's own marks). It plays while the film plays and nowhere else: it starts where the clock
// is, stops with a short fade when the film pauses (the visitor, the popup, a scroll up, Skip, the
// tab going to the background), dips out and back in with a soft jump (the rail, ← →), and lets
// its last bar ring out when the film ends. A drift check keeps it on the clock.
//
// Browsers only let a page make sound after the visitor has tapped, clicked or pressed a key on
// it (scrolling doesn't count). So the AudioContext is made and started on the first such input
// anywhere on the page; until then the soundtrack is "locked" and the film shows "Tap for sound".
// The visitor's choice (sound on / off) is remembered on this device.

import type { Player } from "./player";

export type SoundView = {
  /** the visitor wants sound (the default; "off" is remembered) */
  on: boolean;
  /** the browser hasn't let the page make sound yet (no tap / click / key so far) */
  locked: boolean;
  /** the music is loaded and decoded */
  ready: boolean;
};

const PREF = "sc-sound";
const readPref = () => {
  try {
    return localStorage.getItem(PREF) !== "off";
  } catch {
    return true;
  }
};
const writePref = (on: boolean) => {
  try {
    localStorage.setItem(PREF, on ? "on" : "off");
  } catch {
    /* private window: not remembered */
  }
};

const GESTURES = ["pointerdown", "pointerup", "click", "keydown", "touchend"] as const;
/** fades, s */
const FADE_IN = 0.09;
const FADE_OUT = 0.16;
/** the music is re-cued when it drifts this far from the film's clock, s */
const DRIFT = 0.06;

type AC = typeof AudioContext;
const AudioCtx: AC | undefined = typeof window !== "undefined" ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AC }).webkitAudioContext) : undefined;

export class Soundtrack {
  view: SoundView;
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private buf: AudioBuffer | null = null;
  private voice: { src: AudioBufferSourceNode; gain: GainNode; at: number; off: number } | null = null;
  private dipped = false;
  private subs = new Set<() => void>();
  private offs: (() => void)[] = [];
  private driftTimer = 0;
  private dead = false;
  private loading: Promise<void> | null = null;

  constructor(
    private player: Player,
    private url: string,
  ) {
    this.view = { on: readPref(), locked: true, ready: false };
    if (!AudioCtx) return;
    // the first tap / click / key anywhere lets the page make sound
    const unlock = () => this.unlock();
    GESTURES.forEach((g) => window.addEventListener(g, unlock, { capture: true, passive: true }));
    this.offs.push(() => GESTURES.forEach((g) => window.removeEventListener(g, unlock, { capture: true })));
    // a visitor who already clicked something on this page: no need to wait for the next one
    if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) this.unlock();
    this.offs.push(
      player.on("state", () => this.sync()),
      // a soft jump: the music dips out with the picture and comes back in at the new time
      player.on("fade", (o, ms) => {
        this.dipped = o === 0;
        if (this.dipped) this.stop(Math.min(ms, 220) / 1000);
        else this.sync();
      }),
    );
  }

  // ── for React ────────────────────────────────────────────────────────────────

  subscribe = (fn: () => void) => {
    this.subs.add(fn);
    return () => void this.subs.delete(fn);
  };
  snapshot = () => this.view;
  private set(p: Partial<SoundView>) {
    const v = { ...this.view, ...p };
    if (v.on === this.view.on && v.locked === this.view.locked && v.ready === this.view.ready) return;
    this.view = v;
    this.subs.forEach((f) => f());
  }

  /** Sound on / off (a click, so it also unlocks). */
  toggle() {
    const on = !this.view.on;
    writePref(on);
    this.set({ on });
    if (on) this.unlock();
    this.sync();
  }

  /** "Tap for sound": switch it on (and the tap itself unlocks it). */
  enable() {
    if (!this.view.on) {
      writePref(true);
      this.set({ on: true });
    }
    this.unlock();
    this.sync();
  }

  /** Fetch and decode the music ahead of the film (call when the film is near). */
  preload() {
    if (this.buf || this.loading || !AudioCtx || this.dead) return;
    this.loading = (async () => {
      try {
        const res = await fetch(this.url);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.arrayBuffer();
        // decoded without waking the audio device: a buffer works in any context
        const dec = this.ctx ?? new OfflineAudioContext(2, 1, 44100);
        this.buf = await dec.decodeAudioData(data);
        this.set({ ready: true });
        this.sync();
      } catch {
        this.loading = null; // a later preload may try again
      }
    })();
  }

  // ── the device ───────────────────────────────────────────────────────────────

  private unlock() {
    if (this.dead || !AudioCtx || !this.view.on) return;
    try {
      if (!this.ctx) {
        this.ctx = new AudioCtx({ latencyHint: "interactive" });
        this.out = this.ctx.createGain();
        this.out.gain.value = 0.9;
        this.out.connect(this.ctx.destination);
        this.ctx.onstatechange = () => {
          this.set({ locked: this.ctx?.state !== "running" });
          this.sync();
        };
      }
      if (this.ctx.state !== "running") void this.ctx.resume().catch(() => {});
      this.set({ locked: this.ctx.state !== "running" });
    } catch {
      /* no audio on this device: the film plays silent */
    }
    this.preload();
  }

  // ── following the film ───────────────────────────────────────────────────────

  /** Where the music should be now, s (the film's clock, plus what the device delays its output by). */
  private target() {
    const c = this.ctx!;
    const lat = (c.outputLatency || 0) + (c.baseLatency || 0);
    return this.player.time() / 1000 + lat * this.player.rate;
  }

  private sync() {
    if (this.dead) return;
    const p = this.player;
    const want = this.view.on && !this.view.locked && !!this.buf && !this.dipped && p.state === "playing";
    // the end: the last bar rings out on its own
    if (p.state === "ended") return;
    if (want && !this.voice) this.start(FADE_IN);
    else if (!want && this.voice) this.stop(FADE_OUT);
  }

  private start(fade: number) {
    const c = this.ctx;
    if (!c || !this.buf || !this.out) return;
    const off = this.target();
    if (off >= this.buf.duration - 0.05) return;
    const src = c.createBufferSource();
    src.buffer = this.buf;
    src.playbackRate.value = this.player.rate;
    const gain = c.createGain();
    const at = c.currentTime + 0.01;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(1, at + fade);
    src.connect(gain);
    gain.connect(this.out);
    src.start(at, Math.max(0, off + 0.01 * this.player.rate));
    const v = { src, gain, at, off: Math.max(0, off + 0.01 * this.player.rate) };
    src.onended = () => {
      if (this.voice === v) this.voice = null;
    };
    this.voice = v;
    window.clearInterval(this.driftTimer);
    this.driftTimer = window.setInterval(() => this.checkDrift(), 500);
  }

  private stop(fade: number) {
    const v = this.voice;
    const c = this.ctx;
    this.voice = null;
    window.clearInterval(this.driftTimer);
    if (!v || !c) return;
    const t = c.currentTime;
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setValueAtTime(v.gain.gain.value, t);
    v.gain.gain.linearRampToValueAtTime(0, t + fade);
    try {
      v.src.stop(t + fade + 0.02);
    } catch {
      /* already stopped */
    }
  }

  private checkDrift() {
    const v = this.voice;
    const c = this.ctx;
    if (!v || !c || this.player.state !== "playing") return;
    const heard = v.off + (c.currentTime - v.at) * this.player.rate;
    if (Math.abs(heard - this.target()) > DRIFT) {
      // re-cue with a quick crossfade
      this.stop(0.04);
      this.start(0.04);
    }
  }

  /** For tests (?rideDebug): is it sounding, and where the music is against the film's clock, s. */
  debug() {
    const v = this.voice;
    const c = this.ctx;
    return {
      ...this.view,
      ctx: c?.state ?? "none",
      sounding: !!v,
      heard: v && c ? v.off + (c.currentTime - v.at) * this.player.rate : null,
      target: c ? this.target() : null,
      film: this.player.time() / 1000,
    };
  }

  dispose() {
    this.dead = true;
    this.stop(0.05);
    this.offs.forEach((f) => f());
    this.subs.clear();
    const c = this.ctx;
    this.ctx = null;
    if (c) window.setTimeout(() => void c.close().catch(() => {}), 200);
  }
}
