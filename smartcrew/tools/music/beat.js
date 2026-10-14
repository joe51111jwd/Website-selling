// The ride's placeholder beat: a hard trap instrumental built from synthesis alone (no samples, so
// nothing to license), written to the ride's own timeline (src/site/day/ride.ts). It stands in
// until the licensed track arrives; ./render.mjs renders it (OfflineAudioContext in a headless
// browser) to public/audio/ride.mp3.
//
// The grid is set by the film: 139.24 BPM, so that the bar lines land on the ride's marks:
//   0:02.50  bar 0   the drop: 6:42 AM, the first shot has settled
//   0:33.53  bar 18  the build (5 PM is coming)
//   0:35.25  bar 19  the big drop: the profit card takes over the screen
//   0:47.32  bar 26  nightfall (Friday): the drums go dark
//   0:55.50  bar 30, beat 4  the final hit: "That's SmartCrew."
//   0:58.85  the end of the ride
// F minor; four chords round and round (Fm, Db, Bbm, C).
//
// Runs in a browser: defines window.renderBeat() → a WAV file as a base64 string.

(() => {
  const SR = 44100;
  const DUR = 58.85;
  const BEAT = 32.75 / 76; // s: 76 beats from the drop (2.5 s) to the profit card (35.25 s)
  const STEP = BEAT / 4;
  const BAR = BEAT * 4;
  const T0 = 2.5;
  const at = (bar, step = 0) => T0 + bar * BAR + step * STEP;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // the harmony: chord i of [Fm, Db, Bbm, C]
  const CH = [
    { root: 29, pad: [53, 56, 60], bell: { 0: 72, 3: 68, 6: 65, 10: 68, 12: 67, 14: 65 } }, // Fm
    { root: 25, pad: [49, 53, 56], bell: { 0: 73, 3: 68, 6: 65, 10: 68, 12: 70, 14: 68 } }, // Db
    { root: 34, pad: [46, 49, 53], bell: { 0: 70, 3: 65, 6: 73, 10: 72, 12: 70, 14: 68 } }, // Bbm
    { root: 36, pad: [48, 52, 55], bell: { 0: 64, 3: 67, 6: 72, 10: 70, 12: 67, 14: 64 } }, // C
  ];
  // bars 0–16 go round from Fm; from bar 17 the round is shifted so the big drop (bar 19) is on Fm
  const chordOf = (bar) => (bar < 17 ? ((bar % 4) + 4) % 4 : (bar - 15) % 4);

  // the sections, by bar
  const NIGHT = [26, 29];
  const section = (bar) =>
    bar < 0 ? "intro" : bar <= 8 ? "A" : bar <= 12 ? "B" : bar <= 16 ? "B+" : bar === 17 ? "strip" : bar === 18 ? "build" : bar <= 21 ? "C" : bar <= 25 ? "B" : bar <= 29 ? "night" : "end";

  // 808 rhythms (step: [length in steps, glide to (semitones from the root) at its end?])
  const BASS = {
    A: [
      { 0: [6], 7: [2], 10: [5] },
      { 0: [5], 6: [2], 11: [5, 12] },
    ],
    B: [
      { 0: [4], 3: [2], 6: [3], 10: [2], 12: [3] },
      { 0: [3], 3: [3], 7: [2], 10: [3], 14: [2, 12] },
    ],
    C: [
      { 0: [3], 3: [3], 6: [2], 9: [2], 11: [3], 14: [2] },
      { 0: [3], 3: [2], 6: [3], 10: [2], 12: [2, 12], 14: [2, 7] },
    ],
  };

  function noiseBuffer(ctx, secs) {
    const b = ctx.createBuffer(1, Math.floor(SR * secs), SR);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function impulse(ctx, secs) {
    const n = Math.floor(SR * secs);
    const b = ctx.createBuffer(2, n, SR);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        d[i] = t < 0.015 ? 0 : (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2) * Math.exp(-t * 1.1);
      }
    }
    return b;
  }
  function satCurve(drive) {
    const n = 2048;
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.tanh(drive * x) / Math.tanh(drive);
    }
    return c;
  }

  async function render() {
    const ctx = new OfflineAudioContext(2, Math.ceil(SR * (DUR + 0.3)), SR);
    const NOISE = noiseBuffer(ctx, 4);
    const SAT808 = satCurve(3.2);
    const SATBOOM = satCurve(2.2);

    // ── the mix: drums / 808 / music (ducked under the 808) → glue compressor → limiter ──
    const glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -14;
    glue.knee.value = 10;
    glue.ratio.value = 2.2;
    glue.attack.value = 0.006;
    glue.release.value = 0.16;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -2;
    lim.knee.value = 0;
    lim.ratio.value = 20;
    lim.attack.value = 0.001;
    lim.release.value = 0.06;
    glue.connect(lim);
    lim.connect(ctx.destination);

    const inGain = ctx.createGain();
    inGain.gain.value = 0.5;
    inGain.connect(glue);
    const drumsLP = ctx.createBiquadFilter();
    drumsLP.type = "lowpass";
    drumsLP.Q.value = 0.6;
    drumsLP.connect(inGain);
    const drums = ctx.createGain();
    drums.gain.value = 0.9;
    drums.connect(drumsLP);
    // the 808: no rumble under 32 Hz, and enough of its overtones that it's heard on laptop speakers
    const bassHP = ctx.createBiquadFilter();
    bassHP.type = "highpass";
    bassHP.frequency.value = 32;
    bassHP.connect(inGain);
    const bass = ctx.createGain();
    bass.gain.value = 0.44;
    bass.connect(bassHP);
    const musicLP = ctx.createBiquadFilter();
    musicLP.type = "lowpass";
    musicLP.Q.value = 0.8;
    musicLP.connect(inGain);
    const music = ctx.createGain();
    music.connect(musicLP);
    const fxBus = ctx.createGain();
    fxBus.gain.value = 0.8;
    fxBus.connect(inGain);
    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    verb.connect(wet);
    wet.connect(inGain);

    // the drums go dark at night; the music opens up at the drops
    const dl = drumsLP.frequency;
    dl.setValueAtTime(18000, 0);
    dl.setValueAtTime(18000, at(26));
    dl.exponentialRampToValueAtTime(1300, at(26) + 1.4);
    dl.setValueAtTime(1300, at(29, 8));
    dl.exponentialRampToValueAtTime(18000, at(30));
    const ml = musicLP.frequency;
    ml.setValueAtTime(900, 0);
    ml.exponentialRampToValueAtTime(2600, at(0) - 0.05);
    ml.setValueAtTime(16000, at(0));
    ml.setValueAtTime(16000, at(17, 8));
    ml.exponentialRampToValueAtTime(1100, at(17, 15));
    ml.exponentialRampToValueAtTime(7000, at(19) - 0.03);
    ml.setValueAtTime(16000, at(19));
    ml.setValueAtTime(16000, at(26));
    ml.exponentialRampToValueAtTime(4200, at(26) + 1.4);
    ml.setValueAtTime(4200, at(30));
    ml.exponentialRampToValueAtTime(16000, at(30, 4));

    const send = (node, amt) => {
      if (!amt) return;
      const g = ctx.createGain();
      g.gain.value = amt;
      node.connect(g);
      g.connect(verb);
    };
    const pan = (node, p, dest) => {
      const pn = ctx.createStereoPanner();
      pn.pan.value = p;
      node.connect(pn);
      pn.connect(dest);
      return pn;
    };
    const noise = (t, len, rate = 1) => {
      const s = ctx.createBufferSource();
      s.buffer = NOISE;
      s.playbackRate.value = rate;
      s.start(t, Math.random() * Math.max(0, 3.9 - len), len + 0.05);
      return s;
    };
    const filt = (type, f, q = 0.7) => {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q;
      return b;
    };
    const env = (t, peak, attack, decay, curve = "exp") => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
      if (curve === "exp") g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
      else g.gain.linearRampToValueAtTime(0, t + attack + decay);
      return g;
    };

    // the music ducks under every 808 hit (the pump)
    let lastDuck = -1;
    const duck = (t, depth = 0.5) => {
      if (t - lastDuck < 0.06) return;
      lastDuck = t;
      music.gain.setValueAtTime(1, Math.max(0, t - 0.002));
      music.gain.linearRampToValueAtTime(depth, t + 0.008);
      music.gain.setTargetAtTime(1, t + 0.03, 0.08);
    };

    // ── the instruments ──
    function kick(t, v = 1) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.07);
      const g = env(t, 0.9 * v, 0.002, 0.16);
      o.connect(g);
      g.connect(drums);
      o.start(t);
      o.stop(t + 0.25);
      const c = noise(t, 0.012);
      const hp = filt("highpass", 2500);
      const cg = env(t, 0.22 * v, 0.001, 0.01);
      c.connect(hp);
      hp.connect(cg);
      cg.connect(drums);
    }
    function e808(t, midi, len, glideTo, v = 1) {
      const f = hz(midi);
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(f * 2.4, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.045);
      if (glideTo != null) {
        o.frequency.setValueAtTime(f, t + len * 0.5);
        o.frequency.exponentialRampToValueAtTime(hz(glideTo), t + len * 0.92);
      }
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.004);
      g.gain.setValueAtTime(v, t + Math.max(0.02, len - 0.09));
      g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.04);
      const sh = ctx.createWaveShaper();
      sh.curve = SAT808;
      const lp = filt("lowpass", 1700, 0.5);
      o.connect(g);
      g.connect(sh);
      sh.connect(lp);
      lp.connect(bass);
      o.start(t);
      o.stop(t + len + 0.08);
      duck(t, 0.5);
    }
    function clap(t, v = 1, dark = false) {
      const bp = filt("bandpass", dark ? 900 : 1250, 0.9);
      const hp = filt("highpass", 450);
      const out = ctx.createGain();
      out.gain.value = 1.25 * v;
      bp.connect(hp);
      hp.connect(out);
      out.connect(drums);
      send(out, 0.22);
      [0, 0.011, 0.023].forEach((d, i) => {
        const s = noise(t + d, 0.02);
        const g = env(t + d, [1, 0.75, 0.9][i], 0.001, 0.012);
        s.connect(g);
        g.connect(bp);
      });
      const tail = noise(t + 0.03, 0.22);
      const tg = env(t + 0.03, 0.7, 0.002, 0.17);
      tail.connect(tg);
      tg.connect(bp);
    }
    function snare(t, v = 1, bright = 0) {
      const s = noise(t, 0.14);
      const bp = filt("bandpass", 1800 + bright * 3500, 0.7);
      const g = env(t, 0.95 * v, 0.001, 0.1);
      s.connect(bp);
      bp.connect(g);
      g.connect(drums);
      send(g, 0.1);
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(230 + bright * 120, t);
      o.frequency.exponentialRampToValueAtTime(170, t + 0.05);
      const og = env(t, 0.35 * v, 0.001, 0.07);
      o.connect(og);
      og.connect(drums);
      o.start(t);
      o.stop(t + 0.12);
    }
    let hatSide = 1;
    function hat(t, v = 1, open = false) {
      const s = noise(t, open ? 0.35 : 0.06, 1.0);
      const hp = filt("highpass", open ? 6500 : 7800, 0.6);
      const pk = filt("peaking", 10500, 1.2);
      pk.gain.value = 5;
      const g = env(t, (open ? 0.5 : 0.75) * v, 0.001, open ? 0.26 : 0.045);
      s.connect(hp);
      hp.connect(pk);
      pk.connect(g);
      hatSide = -hatSide;
      pan(g, hatSide * 0.18, drums);
    }
    let bellSide = 1;
    function bell(t, midi, v = 1, dur = 0.95) {
      const f = hz(midi);
      const car = ctx.createOscillator();
      car.frequency.value = f;
      const mod = ctx.createOscillator();
      mod.frequency.value = f * 2;
      const mg = ctx.createGain();
      mg.gain.setValueAtTime(f * 2.4, t);
      mg.gain.exponentialRampToValueAtTime(f * 0.25, t + 0.4);
      mod.connect(mg);
      mg.connect(car.frequency);
      const g = env(t, 0.42 * v, 0.004, dur);
      car.connect(g);
      const sh = ctx.createOscillator();
      sh.type = "triangle";
      sh.frequency.value = f * 2.003;
      const sg = env(t, 0.05 * v, 0.003, dur * 0.5);
      sh.connect(sg);
      sg.connect(g);
      bellSide = -bellSide;
      const p = pan(g, bellSide * 0.22, music);
      send(p, 0.38);
      [car, mod, sh].forEach((o) => {
        o.start(t);
        o.stop(t + dur + 0.1);
      });
    }
    function pad(t, notes, dur, v = 1) {
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, t);
      out.gain.linearRampToValueAtTime(0.035 * v, t + 0.45);
      out.gain.setValueAtTime(0.035 * v, t + Math.max(0.5, dur - 0.5));
      out.gain.linearRampToValueAtTime(0.0001, t + dur + 0.2);
      // the pad stays out of the 808's way
      const lp = filt("lowpass", 1600, 0.4);
      const hp = filt("highpass", 190, 0.5);
      lp.connect(hp);
      hp.connect(out);
      out.connect(music);
      send(out, 0.45);
      notes.forEach((m) =>
        [-8, 8].forEach((cents, k) => {
          const o = ctx.createOscillator();
          o.type = "sawtooth";
          o.frequency.value = hz(m);
          o.detune.value = cents;
          pan(o, k ? 0.35 : -0.35, lp);
          o.start(t);
          o.stop(t + dur + 0.3);
        }),
      );
    }
    function riser(t, dur, v = 1) {
      const s = noise(t, dur);
      const bp = filt("bandpass", 400, 1.4);
      bp.frequency.setValueAtTime(400, t);
      bp.frequency.exponentialRampToValueAtTime(9000, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.32 * v, t + dur);
      g.gain.setValueAtTime(0.0001, t + dur + 0.005);
      s.connect(bp);
      bp.connect(g);
      g.connect(fxBus);
      send(g, 0.25);
    }
    function swell(t, dur, v = 1) {
      // a reversed cymbal: it grows into the hit and stops dead on it
      const s = noise(t, dur);
      const hp = filt("highpass", 3800, 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22 * v, t + dur - 0.01);
      g.gain.setValueAtTime(0.0001, t + dur);
      s.connect(hp);
      hp.connect(g);
      g.connect(fxBus);
    }
    function impact(t, v = 1, root = 29) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(hz(root) * 3, t);
      o.frequency.exponentialRampToValueAtTime(hz(root), t + 0.12);
      o.frequency.exponentialRampToValueAtTime(hz(root) * 0.75, t + 2.2);
      const g = env(t, 0.95 * v, 0.003, 2.3);
      const sh = ctx.createWaveShaper();
      sh.curve = SATBOOM;
      const lp = filt("lowpass", 900, 0.5);
      o.connect(g);
      g.connect(sh);
      sh.connect(lp);
      lp.connect(bass);
      o.start(t);
      o.stop(t + 2.5);
      // the crash
      const c = noise(t, 2.4);
      const hp = filt("highpass", 3200, 0.5);
      const cg = env(t, 0.3 * v, 0.002, 2.2);
      c.connect(hp);
      hp.connect(cg);
      pan(cg, 0.1, fxBus);
      send(cg, 0.4);
      kick(t, 1.1 * v);
      clap(t, 0.8 * v);
      duck(t, 0.3);
    }

    // ── the score ──
    // the intro: the pad comes up under "Enjoy the ride", the bell plays the turnaround, a riser
    pad(0.1, CH[0].pad, at(-1) + 0.1, 0.8);
    for (const [s, m] of Object.entries(CH[3].bell)) bell(at(-1, +s), m, 0.85);
    pad(at(-1), CH[3].pad, BAR, 0.9);
    riser(0.7, at(0) - 0.7, 0.9);
    swell(at(-1, 4), at(0) - at(-1, 4), 1);
    [8, 10, 12, 13, 14, 15].forEach((s, i) => hat(at(-1, s), 0.35 + i * 0.1));

    const LAST = 30;
    for (let bar = 0; bar <= LAST; bar++) {
      const sec = section(bar);
      const ch = CH[chordOf(bar)];
      const odd = bar % 2;
      const night = sec === "night";
      const end = sec === "end";
      // the hits
      if (bar === 0) impact(at(0), 0.85, 29);
      if (bar === 19) impact(at(19), 1.0, 29);

      // pad and bell
      if (!end) pad(at(bar), ch.pad, BAR, night ? 1.5 : sec === "strip" || sec === "build" ? 1.3 : 1);
      if (sec !== "build" && !end) {
        for (const [s, m] of Object.entries(ch.bell)) {
          bell(at(bar, +s), m, night ? 0.75 : 1, night ? 1.4 : 0.95);
          if (sec === "B+" || sec === "C") bell(at(bar, +s) + 0.004, m + 12, 0.38, 0.6);
        }
      }
      if (end) {
        for (const [s, m] of Object.entries(ch.bell)) if (+s < 12) bell(at(bar, +s), m, 1);
      }

      // the build into 5 PM: a snare roll that speeds up, a riser, then a breath before the drop
      if (sec === "build") {
        const hits = [];
        for (let s = 0; s < 8; s += 2) hits.push(s);
        for (let s = 8; s < 12; s += 1) hits.push(s);
        for (let s = 12; s < 14.6; s += 0.5) hits.push(s);
        hits.forEach((s, i) => snare(at(bar, s), 0.35 + (0.65 * i) / hits.length, i / hits.length));
        riser(at(bar), BAR - STEP * 1.2, 1.1);
        swell(at(bar, 8), at(19) - at(bar, 8), 1.2);
        // (no 808 in the build: the low end is empty until the drop)
        continue;
      }

      // 808 + kick
      const pat = sec === "C" ? BASS.C : sec === "B" || sec === "B+" ? BASS.B : BASS.A;
      const bp = pat[odd];
      for (const [s, [len, gl]] of Object.entries(bp)) {
        const st = +s;
        if (sec === "strip" && st >= 8) continue;
        if (end && st >= 12) continue;
        const nextRoot = CH[chordOf(bar + 1)].root;
        const glide = gl == null ? null : gl === 12 ? ch.root + 12 : gl === 7 ? ch.root + 7 : nextRoot;
        const len2 = Math.min(len, (end ? 12 : 16) - st) * STEP;
        e808(at(bar, st), ch.root, len2, glide, sec === "C" ? 1 : 0.92);
        if (st === 0 || sec === "C" || st % 4 === 0) kick(at(bar, st), night ? 0.7 : 1);
      }

      // clap (and a snare under it at the peak)
      clap(at(bar, 8), night ? 0.7 : 1, night);
      if (sec === "C") snare(at(bar, 8), 0.5, 0.3);
      if (sec === "C" && odd) clap(at(bar, 15), 0.45);
      if (sec === "B+" && odd) clap(at(bar, 14.5), 0.35);

      // hats
      const hv = night ? 0.55 : 1;
      if (sec === "A" || sec === "strip" || end) {
        for (let s = 0; s < 16; s += 2) {
          if (sec === "strip" && s > 8) break;
          if (end && s >= 12) break;
          if (odd && s >= 12 && sec === "A") break;
          hat(at(bar, s), (s % 4 === 0 ? 0.95 : 0.6) * hv);
        }
        if (odd && sec === "A") for (let k = 0; k < 8; k++) hat(at(bar, 12 + k * 0.5), (0.45 + k * 0.07) * hv);
      } else if (sec === "B" || sec === "B+" || sec === "C") {
        for (let s = 0; s < 16; s++) {
          if (!odd && s >= 6 && s < 8) continue;
          if (odd && s >= 13) continue;
          hat(at(bar, s), (s % 4 === 0 ? 0.9 : s % 2 === 0 ? 0.65 : 0.42) * hv);
        }
        if (!odd) for (let k = 0; k < 3; k++) hat(at(bar, 6 + (k * 2) / 3), (0.55 + k * 0.15) * hv);
        else for (let k = 0; k < 6; k++) hat(at(bar, 13 + k * 0.5), (0.45 + k * 0.08) * hv);
        if (odd) hat(at(bar, 14), 0.8 * hv, true);
        if (sec === "C" && !odd) hat(at(bar, 10), 0.7, true);
      } else if (night) {
        for (let s = 0; s < 16; s += 4) hat(at(bar, s + 2), 0.5);
        if (bar === 29) riser(at(29, 8), at(30) - at(29, 8), 0.8);
      }
    }

    // the final hit: "That's SmartCrew." (bar 30, beat 4), then the pad rings out to the end
    const fin = at(LAST, 12);
    swell(at(LAST, 4), fin - at(LAST, 4), 1.1);
    impact(fin, 1.05, 29);
    e808(fin, 29, 2.6, 24, 1);
    bell(fin, 72, 1, 2.6);
    bell(fin + 0.005, 77, 0.5, 2.6);
    pad(fin, CH[0].pad, DUR - fin - 0.3, 1.6);

    const buf = await ctx.startRendering();
    // fade the very end, so it ends on the ride's last frame
    const n = Math.floor(DUR * SR);
    const fade = Math.floor(0.6 * SR);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = n - fade; i < d.length; i++) d[i] *= i >= n ? 0 : (n - i) / fade;
    }
    return wavBase64(buf, n);
  }

  function wavBase64(buf, frames) {
    const ch = 2;
    const bytes = 44 + frames * ch * 2;
    const ab = new ArrayBuffer(bytes);
    const v = new DataView(ab);
    const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF");
    v.setUint32(4, bytes - 8, true);
    w(8, "WAVE");
    w(12, "fmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, ch, true);
    v.setUint32(24, SR, true);
    v.setUint32(28, SR * ch * 2, true);
    v.setUint16(32, ch * 2, true);
    v.setUint16(34, 16, true);
    w(36, "data");
    v.setUint32(40, frames * ch * 2, true);
    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);
    let o = 44;
    for (let i = 0; i < frames; i++) {
      for (const d of [L, R]) {
        const x = Math.max(-1, Math.min(1, d[i]));
        v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true);
        o += 2;
      }
    }
    let s = "";
    const u8 = new Uint8Array(ab);
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }

  window.renderBeat = render;
})();
