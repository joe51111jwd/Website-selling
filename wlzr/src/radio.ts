// The pirate radio. Plays a track's audio file when there is one; until the masters arrive it plays a
// synthesized placeholder groove (kick, clap, hats, bass, a stab), seeded per track, so the players, the
// speakers and the spectrum all have something real to move to. Changing station tunes through static.

import { TRACKS, type Track } from "./data";

type Listener = () => void;

class Radio {
  ctx: AudioContext | null = null;
  out!: GainNode;
  analyser!: AnalyserNode;
  index = 0;
  playing = false;
  started = 0; // ctx time the current track started
  beat = 0; // last beat time, for things that bounce
  private nextStep = 0;
  private step = 0;
  private timer = 0;
  private el: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private beatListeners = new Set<(t: number, strong: boolean) => void>();

  get track(): Track {
    return TRACKS[this.index];
  }

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  onBeat(fn: (t: number, strong: boolean) => void) {
    this.beatListeners.add(fn);
    return () => this.beatListeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((f) => f());
  }

  private ensure() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.72;
    this.out.connect(comp).connect(this.analyser).connect(ctx.destination);
    return ctx;
  }

  get time() {
    if (!this.ctx || !this.playing) return 0;
    if (this.el) return this.el.currentTime;
    return this.ctx.currentTime - this.started;
  }

  toggle() {
    this.playing ? this.pause() : this.play();
  }

  play() {
    const ctx = this.ensure();
    void ctx.resume();
    if (this.playing) return;
    this.playing = true;
    this.static(0.35);
    this.startTrack(ctx.currentTime + 0.3);
    this.emit();
  }

  pause() {
    this.playing = false;
    clearInterval(this.timer);
    this.el?.pause();
    this.emit();
  }

  skip(d: number) {
    this.index = (this.index + d + TRACKS.length) % TRACKS.length;
    if (!this.playing) return this.emit();
    clearInterval(this.timer);
    this.el?.pause();
    this.el = null;
    const ctx = this.ensure();
    this.static(0.6);
    this.startTrack(ctx.currentTime + 0.55);
    this.emit();
  }

  private startTrack(at: number) {
    const ctx = this.ctx!;
    const t = this.track;
    this.started = at;
    if (t.audio) {
      const el = new Audio(t.audio);
      el.crossOrigin = "anonymous";
      ctx.createMediaElementSource(el).connect(this.out);
      this.el = el;
      el.onended = () => this.skip(1);
      setTimeout(() => void el.play(), Math.max(0, (at - ctx.currentTime) * 1000));
      return;
    }
    this.step = 0;
    this.nextStep = at;
    const tick = () => {
      const spb = 60 / t.bpm / 4; // sixteenth notes
      while (this.nextStep < ctx.currentTime + 0.15) {
        this.voice(this.step, this.nextStep, t);
        this.nextStep += spb;
        this.step++;
      }
    };
    tick();
    this.timer = window.setInterval(tick, 40);
  }

  // ----- the placeholder groove -----
  private voice(step: number, t: number, tr: Track) {
    const s = step % 16;
    const bar = Math.floor(step / 16);
    const seed = tr.key * 7 + tr.bpm;
    // dembow-ish: kick on 1 and 3, the "boom-ch-boom-chick" on the off-beats
    if (s === 0 || s === 8 || (seed % 2 && s === 11)) this.kick(t);
    if (s === 3 || s === 6 || s === 11 || s === 14) this.clap(t, s === 6 || s === 14 ? 0.5 : 0.32);
    if (s % 2 === 0) this.hat(t, s % 4 === 2 ? 0.16 : 0.07);
    const line = [0, 0, 7, 0, 10, 0, 5, 3];
    if (s % 2 === 0) this.bass(t, tr.key + line[(s / 2 + bar) % 8 | 0] - 12, (60 / tr.bpm) * 0.45);
    if ((s === 2 || s === 10) && bar % 2 === 1) this.stab(t, tr.key + 12 + (bar % 4 === 3 ? 3 : 0));
    if (s % 4 === 0) {
      const strong = s === 0;
      const delay = Math.max(0, (t - this.ctx!.currentTime) * 1000);
      setTimeout(() => {
        this.beat = performance.now();
        this.beatListeners.forEach((f) => f(this.beat, strong));
      }, delay);
    }
  }

  private env(g: GainNode, t: number, peak: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  }

  private kick(t: number) {
    const c = this.ctx!;
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    this.env(g, t, 1, 0.42);
    o.connect(g).connect(this.out);
    o.start(t); o.stop(t + 0.45);
  }

  private noiseBuf: AudioBuffer | null = null;
  private noise() {
    const c = this.ctx!;
    if (!this.noiseBuf) {
      this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const n = c.createBufferSource();
    n.buffer = this.noiseBuf;
    return n;
  }

  private clap(t: number, v: number) {
    const c = this.ctx!;
    const n = this.noise(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = "bandpass"; f.frequency.value = 1500; f.Q.value = 0.8;
    this.env(g, t, v, 0.16);
    n.connect(f).connect(g).connect(this.out);
    n.start(t, Math.random()); n.stop(t + 0.2);
  }

  private hat(t: number, v: number) {
    const c = this.ctx!;
    const n = this.noise(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = "highpass"; f.frequency.value = 7500;
    this.env(g, t, v, 0.05);
    n.connect(f).connect(g).connect(this.out);
    n.start(t, Math.random()); n.stop(t + 0.07);
  }

  private bass(t: number, note: number, len: number) {
    const c = this.ctx!;
    const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = "sawtooth";
    o.frequency.value = 440 * 2 ** ((note - 69) / 12);
    f.type = "lowpass"; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(140, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(f).connect(g).connect(this.out);
    o.start(t); o.stop(t + len + 0.02);
  }

  private stab(t: number, note: number) {
    const c = this.ctx!;
    const g = c.createGain();
    this.env(g, t, 0.12, 0.35);
    g.connect(this.out);
    for (const iv of [0, 3, 7]) {
      const o = c.createOscillator();
      o.type = "square";
      o.frequency.value = 440 * 2 ** ((note + iv - 69) / 12);
      o.connect(g); o.start(t); o.stop(t + 0.36);
    }
  }

  /** A burst of tuning static. */
  static(len: number) {
    const c = this.ensure();
    const n = this.noise(), f = c.createBiquadFilter(), g = c.createGain();
    const t = c.currentTime;
    f.type = "bandpass"; f.Q.value = 0.6;
    f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(3800, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    n.connect(f).connect(g).connect(this.out);
    n.start(t, Math.random()); n.stop(t + len);
  }

  /** 0..1 levels for n bands (zeros when silent). */
  levels(n: number, into: Float32Array) {
    if (!this.ctx || !this.playing) {
      into.fill(0);
      return into;
    }
    const bins = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(bins);
    for (let i = 0; i < n; i++) {
      const a = Math.floor((i / n) ** 1.6 * bins.length * 0.8), b = Math.max(a + 1, Math.floor(((i + 1) / n) ** 1.6 * bins.length * 0.8));
      let m = 0;
      for (let j = a; j < b; j++) m = Math.max(m, bins[j]);
      into[i] = m / 255;
    }
    return into;
  }
}

export const radio = new Radio();
