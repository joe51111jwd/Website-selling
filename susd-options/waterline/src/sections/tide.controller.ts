import { engine, type Controller, type Frame } from '../engine/engine';
import { PARAMS } from '../engine/params';
import { clamp, easeOutCubic, lerp, range, smoothstep } from '../motion/easing';
import { measureBox, stickyProgress, stickyTop, type SectionBox } from '../hooks/useScrollProgress';
import { COPY } from '../copy';

export const pathways = (n: number) => (n * (n - 1)) / 2;
export const peopleLabel = (n: number) => (n === 1 ? COPY.hero.person : COPY.hero.people);
export const linesLabel = (pw: number) => (pw === 1 ? COPY.hero.line : COPY.hero.lines);

export type ZoneKey = keyof typeof COPY.zones;
export const zoneOf = (n: number): ZoneKey =>
  n <= 1 ? 'solopreneur' : n <= 3 ? 'smallTeam' : n <= 7 ? 'valley' : n <= 12 ? 'team' : n <= 14 ? 'threshold' : n <= 39 ? 'graveyard' : 'teamOfTeams';
export const zoneName = (z: ZoneKey) => COPY.zones[z].tag.split(' · ')[0];

// Scroll → headcount, in screens of scroll (V). Each hire is a step: it arrives in the first 55%
// of its segment and dwells for the rest, so every number (and caption) gets read. 13–14 (the
// threshold, "Past twelve, something breaks.") holds for almost a full screen.
const STEPS: [number, number, number][] = [
  [0.12, 8, 8],
  [0.18, 8, 9],
  [0.18, 9, 10],
  [0.18, 10, 11],
  [0.18, 11, 12],
  [0.18, 12, 12], // the line you don't cross
  [0.22, 12, 13],
  [0.4, 13, 13], // past twelve, something breaks
  [0.26, 13, 14],
  [0.22, 14, 15],
  [0.55, 15, 39], // the flood (Redline arrives at 36)
  [0.95, 39, 39], // Redline holds for almost a screen; the stage fades only as it scrolls away into the turn
];
export const TIDE_TRAVEL = STEPS.reduce((s, [d]) => s + d, 0); // 3.62 screens → #tide is 462vh
const SEG: [number, number, number, number][] = [];
{
  let at = 0;
  for (const [d, n0, n1] of STEPS) {
    SEG.push([at / TIDE_TRAVEL, (at + d) / TIDE_TRAVEL, n0, n1]);
    at += d;
  }
}
/** From this headcount the stage reads Redline (the readout gives way to the equation). */
const FLOOD_N = 36;

export function nOfP(p: number) {
  for (const [a, b, n0, n1] of SEG) {
    if (p <= b) {
      const u = range(p, a, b);
      if (n1 === n0) return n0;
      if (n1 - n0 === 1) return n0 + smoothstep(u / 0.55);
      return n0 + (n1 - n0) * smoothstep(u);
    }
  }
  return 39;
}

export type TideEls = {
  section: HTMLElement;
  stage: HTMLElement;
  h1Root: HTMLElement;
  h1Dry: HTMLElement;
  h1Wet: HTMLElement;
  probe: HTMLElement;
  readout: HTMLElement;
  people: HTMLElement[];
  peopleLab: HTMLElement[];
  paths: HTMLElement[];
  pathsLab: HTMLElement[];
  gauge: HTMLElement;
  marker: HTMLElement;
  mval: HTMLElement;
  numTicks: HTMLElement[];
  redSegs: HTMLElement[];
  znames: HTMLElement[];
  complexity: HTMLElement;
  live: HTMLElement | null;
};

type Mode = { pinned: number | null; staticMode: boolean; block?: HTMLElement | null };

export class TideController implements Controller {
  box: SectionBox = { top: 0, height: 1 };
  V = 900;
  W = 1440;
  B = 400;
  T = 150;
  P = 90;
  xh = 48;
  fs = 96;
  lines = 3;
  roTop = 600;
  h1x = [200, 720, 1240];
  pts: [number, number][] = [];
  private tickY: number[] = [];
  private names: { y: number; el: HTMLElement; wet: number }[] = [];
  private rn = -1;
  private sink = -1;
  private ready = false;
  private sloshed = false;
  private fade = -1;
  private exit = -1;
  private cache = { at: -1, n: 8, p: 0 };
  private announceTimer = 0;
  private lastAnnounced = '';
  private lastZone = '';
  private stageTop = 0;
  private flags = '';
  private tagOk = false; // the surface tag waits until the water has settled, so it never rides through the readout

  constructor(private els: TideEls, private mode: Mode) {
    if (mode.pinned !== null || mode.staticMode) this.ready = this.tagOk = true;
  }

  start() {
    return this.box.top;
  }

  measure(scrollY: number, V: number, W: number) {
    const e = this.els;
    this.V = V;
    this.W = W;
    this.box = measureBox(e.section, scrollY);
    const st = e.stage.getBoundingClientRect().top;
    const h1 = e.h1Dry.getBoundingClientRect();
    const cs = getComputedStyle(e.h1Dry);
    const fs = parseFloat(cs.fontSize);
    const lh = parseFloat(cs.lineHeight) || fs;
    this.fs = fs;
    this.T = h1.top - st;
    this.B = e.probe.getBoundingClientRect().top - st;
    this.P = lh;
    this.xh = 0.53 * fs;
    this.lines = Math.max(1, Math.round(h1.height / lh));
    this.h1x = [h1.left + h1.width * 0.12, h1.left + h1.width * 0.5, h1.left + h1.width * 0.88];
    const { B, T, P, xh, lines } = this;
    const pts: [number, number][] = [
      [0, 0.94 * V],
      [28, B + 0.24 * fs + 14], // 8: clear of the descenders, even at the crest of the swell
      [66, B + 3], // 12: lapping the baseline, the line you don't cross
      [78, B - 0.4 * xh], // 13: touching the letters
      [105, T + (lines * P) / 2], // 15: halfway up the sentence
      [190, T - 12], // 20: the sentence is under
      [435, 0.1 * V],
      [741, -0.04 * V], // 39: flooded
    ];
    for (let i = 1; i < pts.length; i++) pts[i][1] = Math.min(pts[i][1], pts[i - 1][1] - 1);
    this.pts = pts;
    e.stage.style.setProperty('--B', `${B.toFixed(1)}px`);
    e.stage.style.setProperty('--T', `${T.toFixed(1)}px`);
    this.roTop = e.readout.getBoundingClientRect().top - st;
    // Ticks sit at the water level of each zone's upper bound (12 on the baseline); each zone
    // name sits in the middle of its own span, so the marker always points into the right name.
    e.gauge.querySelectorAll<HTMLElement>('[data-tick]').forEach((el) => {
      el.style.transform = `translateY(${this.gaugeY(Number(el.dataset.tick), true).toFixed(1)}px)`;
    });
    // The threshold's name sits between the 13 and 14 water levels, never where the water rests.
    this.names = [];
    for (const el of e.znames) {
      const lo = Number(el.dataset.lo);
      const hi = Number(el.dataset.hi);
      const upper = this.gaugeY(hi, true);
      const prev = lo <= 1 ? upper : hi >= 40 ? upper : this.gaugeY(lo - 1, true);
      const y = el.dataset.z === 'threshold' ? (this.lmap(13) + this.lmap(14)) / 2 : (upper + prev) / 2;
      el.style.transform = `translateY(${y.toFixed(1)}px)`;
      this.names.push({ y, el, wet: -1 });
    }
    const red0 = this.gaugeTop();
    const red1 = this.gaugeY(12, true);
    for (const el of e.redSegs) Object.assign(el.style, { top: `${red0.toFixed(1)}px`, height: `${Math.max(0, red1 - red0).toFixed(1)}px` });
    this.tickY = this.els.numTicks.map((el) => this.gaugeY(Number(el.dataset.tick), true));
    this.rn = -1;
    this.sink = -1;
    this.fade = -1;
    this.exit = -1;
    this.flags = '';
    if (this.mode.staticMode) {
      const n = this.mode.pinned ?? 8;
      this.apply(n, n >= 39 ? 1 : 0, 0);
      const level = n >= 39 ? -40 : this.lmap(n);
      if (this.mode.block) this.mode.block.dataset.level = String(level);
      for (const nm of this.names) nm.el.dataset.wet = level < nm.y ? '1' : '0';
      this.placeMarker(this.gaugeY(n));
      e.complexity.style.transform = `translate3d(-50%, ${(level + 12).toFixed(1)}px, 0)`;
      e.stage.dataset.tagv = n <= 12 ? '1' : '0';
    }
  }

  lmap(n: number) {
    const p = pathways(n);
    const pts = this.pts;
    if (!pts.length) return this.V * 2;
    if (p <= pts[0][0]) return pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const [p0, y0] = pts[i];
      const [p1, y1] = pts[i + 1];
      if (p <= p1) return lerp(y0, y1, (p - p0) / (p1 - p0));
    }
    return pts[pts.length - 1][1];
  }

  /** The gauge's top: clear of the rail (and of the two-line kicker on phones). */
  gaugeTop() {
    return this.W <= 640 ? 0.165 * this.V : Math.max(0.15 * this.V, 150);
  }

  /** The read-only tide gauge: the real water level up to 14, then the Graveyard compressed to the top. */
  gaugeY(n: number, tick = false) {
    const V = this.V;
    const top = this.gaugeTop();
    if (n >= 40) return top;
    if (tick && n === 12) return this.B;
    if (n <= 14) return this.lmap(n);
    const u = (pathways(n) - pathways(14)) / (pathways(39) - pathways(14));
    return lerp(this.lmap(14), top + 0.04 * V, clamp(u));
  }

  private placeMarker(y: number) {
    const e = this.els;
    e.marker.style.transform = `translateY(${y.toFixed(1)}px)`;
    // Narrow gauges show numbers only: the marker carries the live headcount, and a fixed
    // number it would sit on is hidden.
    if (this.W < 1280) {
      for (let i = 0; i < e.numTicks.length; i++) {
        // the marker's number is drawn ~8 px under its triangle
        const hide = Math.abs(this.tickY[i] - (y + 8)) < 14;
        const el = e.numTicks[i];
        if ((el.dataset.hide === '1') !== hide) el.dataset.hide = hide ? '1' : '0';
      }
    }
  }

  private state(f: Frame) {
    if (this.cache.at === f.now) return this.cache;
    const p = stickyProgress(this.box, f.scrollY, f.V);
    let n = this.mode.pinned ?? nOfP(p);
    if (engine.introRunning) {
      const t = f.now - engine.introAt;
      n = 1 + 7 * easeOutCubic(t / 2000);
      // The intro is ready once the water has actually arrived (slow devices lag the clock).
      const arrived = engine.model.level.value <= this.lmap(8) + 40;
      if (!this.ready && ((t >= 2300 && arrived) || t >= 4500)) this.ready = true;
      if (t >= 1100 && !this.sloshed) {
        this.sloshed = true;
        engine.model.level.velocity -= 150; // the small slosh on arrival
      }
      engine.model.level.c = 14;
    } else {
      engine.model.level.c = 18;
    }
    this.cache = { at: f.now, n, p };
    return this.cache;
  }

  skipIntro() {
    this.ready = true;
    this.sloshed = true;
  }

  target(f: Frame) {
    const { n } = this.state(f);
    const top = stickyTop(this.box, f.scrollY, f.V);
    let y = this.lmap(n) + top;
    if (engine.introRunning) {
      // The water starts rising at t = 0, so the 600 ms frame already shows it coming.
      const u = clamp((f.now - engine.introAt) / 450);
      y = lerp(f.V + 20, y, u);
    }
    return y;
  }

  update(f: Frame) {
    this.stageTop = stickyTop(this.box, f.scrollY, f.V);
    if (this.stageTop + f.V < -40 && this.rn !== -1) return;
    const { n } = this.state(f);
    const pinned = this.mode.pinned !== null;
    const flood = n >= FLOOD_N ? 1 : 0;
    this.apply(n, flood, 0);
    const e = this.els;
    const m = engine.model;
    this.placeMarker(this.gaugeY(n));
    // Zone names are whole words: each turns cream once the water is above its middle.
    if (!f.compact) {
      const sy = m.surfaceY(f.W - 140) - this.stageTop;
      for (const nm of this.names) {
        const wet = sy < nm.y ? 1 : 0;
        if (wet !== nm.wet) {
          nm.wet = wet;
          nm.el.dataset.wet = String(wet);
        }
      }
    }
    // "complexity" rides the surface in the middle of the screen while the sentence is dry.
    const local = m.surfaceY(f.W / 2) - this.stageTop;
    e.complexity.style.transform = `translate3d(-50%, ${(local + (f.phone ? 9 : 11)).toFixed(1)}px, 0)`;
    if (!this.tagOk && this.ready) {
      const lv = m.level;
      const t = f.now - engine.introAt;
      this.tagOk = !engine.introRunning || t >= 4500 || (Math.abs(lv.value - lv.target) < 5 && Math.abs(lv.velocity) < 40);
    }
    const tagv = this.tagOk && !flood && m.level.value - this.stageTop > this.B + 6;
    // The readout appears as the water reaches it (never floating on bare paper during the intro).
    const ro = this.ready || m.level.value - this.stageTop < this.roTop + 220;
    const flags = `${tagv ? 1 : 0}${ro ? 1 : 0}`;
    if (flags !== this.flags) {
      this.flags = flags;
      e.stage.dataset.tagv = tagv ? '1' : '0';
      e.stage.dataset.ro = ro ? '1' : '0';
    }
    // Leaving: the whole stage fades before the turn drains the water, so nothing is left on dry paper.
    const exit = pinned ? 0 : clamp(-this.stageTop / (0.22 * f.V));
    if (Math.abs(exit - this.exit) > 0.003 || (exit === 0 && this.exit !== 0)) {
      this.exit = exit;
      e.stage.style.opacity = exit > 0 ? (1 - exit).toFixed(3) : '';
      e.stage.style.visibility = exit >= 1 ? 'hidden' : '';
    }
  }

  /** Writes the stage state for headcount n. Cheap when nothing changed. */
  private apply(n: number, flood: number, fade: number) {
    const e = this.els;
    const rn = Math.round(n);
    const st = e.stage.dataset;
    if (rn !== this.rn) {
      const prev = this.rn;
      this.rn = rn;
      const pw = pathways(rn);
      const ps = String(rn);
      const ws = String(pw);
      for (const el of e.people) el.textContent = ps;
      for (const el of e.paths) el.textContent = ws;
      for (const el of e.peopleLab) el.textContent = peopleLabel(rn);
      for (const el of e.pathsLab) el.textContent = linesLabel(pw);
      e.mval.textContent = ps;
      const zone = zoneOf(rn);
      st.zone = zone;
      st.red = rn >= 15 ? '1' : '0';
      if (rn === 12 && prev === 11 && !this.mode.staticMode) {
        e.readout.classList.remove('pulse');
        void e.readout.offsetWidth;
        e.readout.classList.add('pulse');
      }
      if (rn === 13 && prev === 12 && !this.mode.staticMode) {
        for (const x of this.h1x) engine.model.ripple(x, 8);
      }
      if (prev !== -1 && zone !== this.lastZone) this.announce(rn, zone);
      this.lastZone = zone;
    }
    st.flood = String(flood);
    st.ready = this.ready ? '1' : '0';
    const fadeChanged = fade !== this.fade;
    if (fadeChanged) {
      this.fade = fade;
      e.stage.style.setProperty('--fade', (1 - fade).toFixed(3));
    }
    // n 30 → 39: the wet sentence sinks and all but disappears, so it never meets the Redline line.
    const sink = range(n, 30, 39);
    if (Math.abs(sink - this.sink) > 0.002 || fadeChanged) {
      this.sink = sink;
      const floor = this.W <= 640 ? 0.06 : 0.12;
      const w = e.h1Wet.style;
      const op = (1 - (1 - floor) * sink) * (1 - fade);
      w.transform = sink > 0 ? `translateY(${(sink * 8).toFixed(2)}vh)` : '';
      w.filter = sink > 0 ? `blur(${(0.4 + sink * 2).toFixed(2)}px)` : '';
      w.opacity = sink > 0 || fade > 0 ? op.toFixed(3) : '';
    }
  }

  private announce(rn: number, zone: ZoneKey) {
    const live = this.els.live;
    if (!live) return;
    window.clearTimeout(this.announceTimer);
    this.announceTimer = window.setTimeout(() => {
      const pw = pathways(rn);
      const msg = `${rn} ${peopleLabel(rn)}, ${pw} ${linesLabel(pw)}, ${zoneName(zone)}`;
      if (msg !== this.lastAnnounced) live.textContent = this.lastAnnounced = msg;
    }, 650);
  }
}

export const PINNED_N = PARAMS.n;
