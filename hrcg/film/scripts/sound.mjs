#!/usr/bin/env node
// THE SET foley, synthesised with ffmpeg (brief §7c; no music, no voice, no crowd). Zero credits.
// Elements: room tone (pink noise, low-passed, reverb tail), reel pay-out whirr, string twang,
// thwack (filtered noise burst + 90 Hz sine thump), powder hiss, low thud on the plan cut,
// pencil ticks (sine blips), dry foley hits (synth thud), pencil scratch bed, five soft clacks.
// Cue times come from src/timeline.json and the scene constants, so picture and sound share one clock.
// Output: public/audio/the-set-{169,916,11}.wav, integrated ≈ −14 LUFS, true peak ≤ −1 dBTP.
// Run: scripts/cpuq node film/scripts/sound.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/audio');
const SFX = join(OUT, 'sfx');
mkdirSync(SFX, { recursive: true });
const TL = JSON.parse(readFileSync(join(ROOT, 'src/timeline.json'), 'utf8'));
const FPS = TL.fps;
const SR = 48000;

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });

// ---------- elements (mono, 48 kHz) ----------
const el = {
  room: (d) =>
    ff([
      '-f', 'lavfi', '-i', `anoisesrc=color=pink:amplitude=0.6:seed=7:d=${d}`,
      '-af', `highpass=f=45,lowpass=f=420,lowpass=f=900,aecho=0.8:0.6:70|140:0.22|0.12,volume=0.55,afade=t=in:d=0.35`,
      '-ar', SR, '-ac', 1, join(SFX, 'room.wav'),
    ]),
  whirr: () =>
    ff([
      '-f', 'lavfi', '-i', `anoisesrc=color=white:amplitude=0.5:seed=3:d=0.62`,
      '-af', `bandpass=f=1500:width_type=o:w=1.4,volume='0.32*(0.55+0.45*sin(2*PI*46*t))*min(1,t/0.06)*min(1,(0.62-t)/0.12)':eval=frame,lowpass=f=5000`,
      '-ar', SR, '-ac', 1, join(SFX, 'whirr.wav'),
    ]),
  stretch: () =>
    ff([
      '-f', 'lavfi', '-i', `anoisesrc=color=brown:amplitude=0.5:seed=12:d=0.75`,
      '-af', `bandpass=f=420:width_type=o:w=1.2,volume='0.35*min(1,t/0.5)':eval=frame,afade=t=out:st=0.66:d=0.09`,
      '-ar', SR, '-ac', 1, join(SFX, 'stretch.wav'),
    ]),
  twang: () =>
    ff([
      '-f', 'lavfi', '-i',
      `aevalsrc='(0.55*sin(2*PI*104*t*(1-0.04*t))+0.28*sin(2*PI*209*t)+0.14*sin(2*PI*318*t)+0.06*sin(2*PI*427*t))*exp(-16*t)':s=${SR}:d=0.32`,
      '-ar', SR, '-ac', 1, join(SFX, 'twang.wav'),
    ]),
  thwack: () =>
    ff([
      '-f', 'lavfi', '-i', `anoisesrc=color=white:amplitude=0.9:seed=21:d=0.16`,
      '-f', 'lavfi', '-i', `aevalsrc='0.95*sin(2*PI*90*t)*exp(-15*t)':s=${SR}:d=0.4`,
      '-filter_complex',
      `[0]bandpass=f=1700:width_type=o:w=1.6,volume='exp(-38*t)':eval=frame,volume=1.6[n];[1]lowpass=f=240[s];[n][s]amix=inputs=2:normalize=0,alimiter=limit=0.95`,
      '-ar', SR, '-ac', 1, join(SFX, 'thwack.wav'),
    ]),
  hiss: (d) =>
    ff([
      '-f', 'lavfi', '-i', `anoisesrc=color=white:amplitude=0.5:seed=33:d=${d}`,
      '-af', `highpass=f=2800,lowpass=f=8500,volume='0.38*min(1,t/0.03)*exp(-2.4*t)':eval=frame`,
      '-ar', SR, '-ac', 1, join(SFX, 'hiss.wav'),
    ]),
  thud: () =>
    ff([
      '-f', 'lavfi', '-i', `aevalsrc='0.9*sin(2*PI*52*t)*exp(-8*t)+0.25*sin(2*PI*104*t)*exp(-14*t)':s=${SR}:d=0.7`,
      '-f', 'lavfi', '-i', `anoisesrc=color=brown:amplitude=0.6:seed=4:d=0.3`,
      '-filter_complex', `[1]lowpass=f=180,volume='exp(-16*t)':eval=frame[n];[0][n]amix=inputs=2:normalize=0,lowpass=f=600`,
      '-ar', SR, '-ac', 1, join(SFX, 'thud.wav'),
    ]),
  tick: () =>
    ff([
      '-f', 'lavfi', '-i', `aevalsrc='0.5*sin(2*PI*2650*t)*exp(-260*t)+0.18*sin(2*PI*5200*t)*exp(-420*t)':s=${SR}:d=0.04`,
      '-ar', SR, '-ac', 1, join(SFX, 'tick.wav'),
    ]),
  hit: () =>
    ff([
      '-f', 'lavfi', '-i', `aevalsrc='0.8*sin(2*PI*132*t)*exp(-30*t)':s=${SR}:d=0.22`,
      '-f', 'lavfi', '-i', `anoisesrc=color=white:amplitude=0.7:seed=9:d=0.1`,
      '-filter_complex', `[1]bandpass=f=900:width_type=o:w=1.0,volume='exp(-60*t)':eval=frame[n];[0][n]amix=inputs=2:normalize=0,lowpass=f=3000`,
      '-ar', SR, '-ac', 1, join(SFX, 'hit.wav'),
    ]),
  scratch: (d) =>
    ff([
      '-f', 'lavfi', '-i', `anoisesrc=color=white:amplitude=0.6:seed=44:d=${d}`,
      '-af',
      `bandpass=f=3800:width_type=o:w=1.3,volume='0.30*pow(abs(sin(2*PI*2.7*t)*sin(2*PI*1.3*t+0.6)),0.6)*(0.35+0.65*min(1,max(0,(t-1.4)/0.2))*min(1,max(0,(2.5-t)/0.3)))':eval=frame,afade=t=out:st=${d - 0.25}:d=0.25`,
      '-ar', SR, '-ac', 1, join(SFX, 'scratch.wav'),
    ]),
  clack: (i) =>
    ff([
      '-f', 'lavfi', '-i', `anoisesrc=color=white:amplitude=0.7:seed=${60 + i}:d=0.08`,
      '-f', 'lavfi', '-i', `aevalsrc='0.35*sin(2*PI*${410 + i * 23}*t)*exp(-60*t)+0.15*sin(2*PI*${1130 + i * 41}*t)*exp(-90*t)':s=${SR}:d=0.12`,
      '-filter_complex', `[0]bandpass=f=${1050 + i * 60}:width_type=o:w=1.1,volume='exp(-75*t)':eval=frame[n];[n][1]amix=inputs=2:normalize=0`,
      '-ar', SR, '-ac', 1, join(SFX, `clack${i}.wav`),
    ]),
};

// ---------- cue sheet per format ----------
const BRICK_TIMES = [0.1, 0.18, 0.26, 0.34, 0.42]; // = scenes/EndCard.tsx
const cues = (f) => {
  const c = [];
  const cover = f.cover;
  const impactF = Math.round(cover.impact * FPS);
  const freeze = (impactF + 8 + 30 - 1) / FPS; // = scenes/Cover.tsx coverFreeze
  c.push({ el: 'room', at: 0, vol: 0.85, cut: freeze });
  c.push({ el: 'whirr', at: cover.payout[0], vol: 0.55 });
  c.push({ el: 'stretch', at: cover.pull[0], vol: 0.5 });
  c.push({ el: 'twang', at: cover.pull[1], vol: 0.55 });
  c.push({ el: 'thwack', at: cover.impact, vol: 1.0 });
  c.push({ el: 'hiss', at: cover.impact, vol: 1.15, cut: freeze });
  c.push({ el: 'thud', at: f.plancut.start + 0.06, vol: 0.95 });
  for (let i = 0; i < 5; i++) {
    const s0 = f.sheets.start + i * f.sheets.each;
    c.push({ el: 'tick', at: s0, vol: 0.8 });
    c.push({ el: 'hit', at: s0 + f.sheets.plan, vol: 0.85 });
  }
  if (f.context) c.push({ el: 'scratch', at: f.context.start, vol: 1.0 });
  BRICK_TIMES.forEach((bt, i) => c.push({ el: `clack${i}`, at: f.end.start + bt, vol: 0.7 }));
  return c;
};

const loudJSON = (file) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], {
    encoding: 'utf8',
  });
  const m = r.stderr.match(/\{[\s\S]*?\}/g);
  return JSON.parse(m[m.length - 1]);
};

const mix = (fmt) => {
  const f = TL.formats[fmt];
  const list = cues(f);
  const inputs = [];
  const parts = [];
  list.forEach((q, i) => {
    inputs.push('-i', join(SFX, `${q.el}.wav`));
    const delay = Math.round(q.at * 1000);
    let chain = `[${i}]volume=${q.vol}`;
    if (q.cut !== undefined) chain += `,atrim=0:${Math.max(0.01, q.cut - q.at).toFixed(4)}`;
    // gentle, fixed stereo placement: the snap sits right of centre (where the line is), the rest centred
    const pan = q.el === 'thwack' || q.el === 'hiss' || q.el === 'twang' || q.el === 'stretch' ? 'c0=0.82*c0|c1=1.0*c0' : 'c0=c0|c1=c0';
    chain += `,pan=stereo|${pan},adelay=${delay}|${delay}[a${i}]`;
    parts.push(chain);
  });
  const amix = `${list.map((_, i) => `[a${i}]`).join('')}amix=inputs=${list.length}:normalize=0:dropout_transition=0,apad=whole_dur=${f.duration},atrim=0:${f.duration}[m]`;
  const raw = join(SFX, `mix-${fmt}-raw.wav`);
  ff([...inputs, '-filter_complex', `${parts.join(';')};${amix}`, '-map', '[m]', '-ar', SR, '-ac', 2, raw]);
  // normalise: measure, apply gain, limit; twice so the limiter's loss is made up
  let src = raw;
  let gainDb = 0;
  for (let pass = 0; pass < 7; pass++) {
    const m = loudJSON(src);
    const I = Number(m.input_i);
    gainDb += -14 - I;
    const dst = join(OUT, `the-set-${fmt}.wav`);
    ff(['-i', raw, '-af', `volume=${gainDb.toFixed(2)}dB,alimiter=limit=0.84:attack=1:release=60:level=0`, '-ar', SR, '-ac', 2, '-c:a', 'pcm_s16le', dst]);
    src = dst;
    const after = loudJSON(dst);
    console.log(`${fmt} pass ${pass}: I=${after.input_i} LUFS, TP=${after.input_tp} dBTP, LRA=${after.input_lra}`);
    if (Math.abs(Number(after.input_i) + 14) < 0.3) break;
  }
};

el.room(8);
el.whirr();
el.stretch();
el.twang();
el.thwack();
el.hiss(1.6);
el.thud();
el.tick();
el.hit();
el.scratch(3.0);
for (let i = 0; i < 5; i++) el.clack(i);
mix('169');
copyFileSync(join(OUT, 'the-set-169.wav'), join(OUT, 'the-set-916.wav'));
mix('11');
writeFileSync(join(OUT, 'README.txt'), 'Synthesised foley for THE SET (scripts/sound.mjs). Regenerate after any timeline change.\n');
