// Music transport. Plays a track's audio file when one is set in data.ts.
// Until a master arrives, play/stop only moves the playhead and the spectrum
// drawing. It does not synthesize a stand-in song.

import { TRACKS, type Track } from "./data";

export const EQ_BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

type Listener = () => void;

class Radio {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private eq: BiquadFilterNode[] = [];
  private eqGain = EQ_BANDS.map(() => 0);
  private el: HTMLAudioElement | null = null;
  private elKey = "";
  private listeners = new Set<Listener>();
  private scrub = 0;
  private anchor = 0;
  index = 0;
  playing = false;
  volume = 0.8;
  repeat = true;
  shuffle = false;
  /** Playhead length used when the track has no audio file. */
  readonly previewLength = 30;

  get track(): Track {
    return TRACKS[this.index] ?? TRACKS[0];
  }

  get hasFile() {
    return !!this.track.audio;
  }

  get length() {
    if (this.el && Number.isFinite(this.el.duration) && this.el.duration > 0) return this.el.duration;
    return this.previewLength;
  }

  get time() {
    if (this.el && this.elKey === this.track.audio) return this.el.currentTime || 0;
    if (!this.playing) return this.scrub;
    const t = this.scrub + (performance.now() / 1000 - this.anchor);
    return ((t % this.previewLength) + this.previewLength) % this.previewLength;
  }

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((f) => f());
  }

  private ensure() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = this.volume;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.72;
    let node: AudioNode = this.out;
    this.eq = EQ_BANDS.map((freq, i) => {
      const f = ctx.createBiquadFilter();
      f.type = "peaking";
      f.frequency.value = freq;
      f.Q.value = 1.15;
      f.gain.value = this.eqGain[i];
      node.connect(f);
      node = f;
      return f;
    });
    node.connect(this.analyser).connect(ctx.destination);
    return ctx;
  }

  toggle() {
    this.playing ? this.pause() : this.play();
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.anchor = performance.now() / 1000;
    if (this.track.audio) this.startFile();
    this.emit();
  }

  pause() {
    if (this.playing && !(this.el && this.elKey === this.track.audio)) this.scrub = this.time;
    this.playing = false;
    this.el?.pause();
    this.emit();
  }

  /** Stop and return to the start. */
  stop() {
    this.playing = false;
    this.scrub = 0;
    if (this.el) {
      this.el.pause();
      this.el.currentTime = 0;
    }
    this.emit();
  }

  seek(frac: number) {
    const f = Math.max(0, Math.min(1, frac));
    this.scrub = f * this.previewLength;
    this.anchor = performance.now() / 1000;
    if (this.el && this.el.duration) this.el.currentTime = f * this.el.duration;
    this.emit();
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.out) this.out.gain.value = this.volume;
    if (this.el) this.el.volume = this.volume;
    this.emit();
  }

  setEq(i: number, db: number) {
    const g = Math.max(-12, Math.min(12, db));
    this.eqGain[i] = g;
    this.ensure();
    if (this.eq[i]) this.eq[i].gain.value = g;
  }

  eqAt(i: number) {
    return this.eqGain[i] ?? 0;
  }

  skip(d: number) {
    const n = TRACKS.length;
    if (this.shuffle && n > 1) {
      let next = this.index;
      while (next === this.index) next = Math.floor(Math.random() * n);
      this.index = next;
    } else {
      this.index = (this.index + d + n) % n;
    }
    this.scrub = 0;
    this.anchor = performance.now() / 1000;
    this.el?.pause();
    if (this.playing && this.track.audio) this.startFile();
    this.emit();
  }

  private startFile() {
    const src = this.track.audio;
    if (!src) return;
    const ctx = this.ensure();
    void ctx.resume();
    if (!this.el || this.elKey !== src) {
      this.el?.pause();
      const el = new Audio(src);
      el.crossOrigin = "anonymous";
      el.preload = "auto";
      ctx.createMediaElementSource(el).connect(this.out!);
      el.onended = () => {
        if (this.repeat) {
          el.currentTime = 0;
          void el.play();
        } else this.skip(1);
      };
      this.el = el;
      this.elKey = src;
    }
    this.el.loop = false;
    this.el.volume = this.volume;
    void this.el.play();
  }

  /** 0..1 band levels. With no file, a quiet motion so the LCD still breathes. */
  levels(n: number, into: Float32Array) {
    if (this.analyser && this.playing && this.el && this.elKey === this.track.audio && !this.el.paused) {
      const bins = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(bins);
      for (let i = 0; i < n; i++) {
        const a = Math.floor((i / n) ** 1.6 * bins.length * 0.8);
        const b = Math.max(a + 1, Math.floor(((i + 1) / n) ** 1.6 * bins.length * 0.8));
        let m = 0;
        for (let j = a; j < b; j++) m = Math.max(m, bins[j]);
        into[i] = m / 255;
      }
      return into;
    }
    const moving = this.playing ? 1 : 0.35;
    for (let i = 0; i < n; i++) {
      const wave = 0.18 + 0.16 * Math.sin(performance.now() / 280 + i * 0.7);
      into[i] = wave * moving;
    }
    return into;
  }
}

export const radio = new Radio();
