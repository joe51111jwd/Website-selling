import { Fragment, useEffect, useRef, type RefObject } from 'react';
import { COPY } from '../copy';
import { WetText, Words } from '../water/WetText';
import { engine, type Controller, type Frame } from '../engine/engine';
import { Tween } from '../motion/tween';
import { easeInOutCubic, lerp, range, smoothstep } from '../motion/easing';
import { measureBox, stickyProgress, stickyTop, type SectionBox } from '../hooks/useScrollProgress';
import { OXYGEN_P, seg, segAt, type Seg } from './cycle.timeline';
import { TURN_END } from './Turn';

const STAND = COPY.cycle.standing.split(' '); // Up. Side. Down. Repeat.
const PHASES = ['up', 'side', 'down'] as const;
const L = COPY.cycle.labels;

/** "Up for growth." with its first word in the phase's ink. */
function Phase({ text, k }: { text: string; k: number }) {
  const i = text.indexOf(' ');
  return (
    <>
      <span className={`ph-${PHASES[k]}`}>{text.slice(0, i)}</span>
      {text.slice(i)}
    </>
  );
}

export function CycleStage({ stageRef, fixed }: { stageRef?: RefObject<HTMLDivElement>; fixed?: 'end' | 'oxygen' }) {
  return (
    <div
      ref={stageRef}
      className="stage cycle-stage"
      data-phase={fixed ?? 'intro'}
      data-lap={fixed ? '2' : '0'}
      data-bands={fixed ? '3' : '0'}
      data-labels={fixed ? '1' : '0'}
      data-static={fixed}
    >
      <div className="cy-bands" aria-hidden="true">
        {[0, 1, 2].map((k) => (
          <div className="band" data-k={k} key={k}>
            <span className="lab band-sys">{L.band}</span>
          </div>
        ))}
      </div>

      <div className="cy-lift" data-lift="">
        <div className="cy-type">
          <WetText as="h2" id={fixed ? undefined : 'cycle-title'} className="standing" wobble>
            {STAND.map((w, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                {i === 2 && <br className="br-p" />}
                <span className={`w sw sw-${i}`}>{w}</span>
              </Fragment>
            ))}
            <span className="probe" data-probe="" />
          </WetText>
          <WetText className="standing oxygen" wobble>
            <Words text={COPY.cycle.oxygen} cls={(w) => (w === 'Oxygen.' ? 'c-up' : undefined)} />
          </WetText>
        </div>
        <div className="deck" data-deck="">
          <span className="lab lab-capacity">{L.deck}</span>
        </div>
        {[0, 1, 2].map((k) => (
          <i className="ul" data-k={k} key={k} aria-hidden="true" />
        ))}
      </div>

      <div className="dim" data-dim="" aria-hidden="true">
        <i className="dim-line" />
        <i className="dim-tick dim-a" />
        <i className="dim-tick dim-b" />
        <span className="lab dim-lab">{L.gap}</span>
      </div>
      <span className="lab lab-complexity" data-cx="" aria-hidden="true">
        {L.water}
      </span>
      <p className="breathe">{COPY.cycle.breathe}</p>

      {/* The legend lives in the water: all three phases always on screen, the active one lit. */}
      <div className="cy-legend">
        <p className="cy-lap" data-lap-label="">
          {COPY.cycle.lapLabels[fixed ? 2 : 0]}
        </p>
        <p className="cy-rows">
          {COPY.cycle.phases.map((t, k) => (
            <Fragment key={k}>
              {k > 0 && ' '}
              <span className="cy-row" data-c={PHASES[k]}>
                <Phase text={t} k={k} />
              </span>
            </Fragment>
          ))}
        </p>
        <div className="cy-subs">
          <p className="cy-sub" data-c="side">
            {COPY.cycle.sideOnce}
          </p>
          <p className="cy-sub" data-c="down">
            {COPY.cycle.downOnce}
          </p>
        </div>
        <p className="cy-close">{COPY.cycle.close}</p>
      </div>
    </div>
  );
}

type Els = {
  section: HTMLElement;
  stage: HTMLElement;
  lift: HTMLElement;
  standRoot: HTMLElement;
  oxRoot: HTMLElement;
  probe: HTMLElement;
  deck: HTMLElement;
  bands: HTMLElement[];
  uls: HTMLElement[];
  words: HTMLElement[];
  dim: HTMLElement;
  dimLine: HTMLElement;
  dimA: HTMLElement;
  dimB: HTMLElement;
  dimLab: HTMLElement;
  cx: HTMLElement;
  lapLabel: HTMLElement;
  breathe: HTMLElement;
};

export function cycleEls(section: HTMLElement, stage: HTMLElement): Els {
  const q = <T extends HTMLElement>(s: string) => stage.querySelector<T>(s)!;
  const stands = stage.querySelectorAll<HTMLElement>('.standing');
  return {
    section,
    stage,
    lift: q('[data-lift]'),
    standRoot: stands[0],
    oxRoot: stands[1],
    probe: stands[0].querySelector<HTMLElement>('.wt-dry [data-probe]')!,
    deck: q('[data-deck]'),
    bands: Array.from(stage.querySelectorAll<HTMLElement>('.band')),
    uls: Array.from(stage.querySelectorAll<HTMLElement>('.ul')),
    words: [0, 1, 2, 3].map((k) => stands[0].querySelector<HTMLElement>(`.wt-dry .sw-${k}`)!),
    dim: q('[data-dim]'),
    dimLine: q('.dim-line'),
    dimA: q('.dim-a'),
    dimB: q('.dim-b'),
    dimLab: q('.dim-lab'),
    cx: q('[data-cx]'),
    lapLabel: q('[data-lap-label]'),
    breathe: q('.breathe'),
  };
}

/** The rendered box of a word's letters, optionally without its last character (the full stop). */
function textRect(el: HTMLElement, trim: number) {
  const tn = el.firstChild as Text | null;
  if (!tn || tn.nodeType !== 3) return el.getBoundingClientRect();
  const r = document.createRange();
  r.setStart(tn, 0);
  r.setEnd(tn, Math.max(1, tn.length - trim));
  return r.getBoundingClientRect();
}

export class CycleController implements Controller {
  box: SectionBox = { top: 0, height: 1 };
  V = 900;
  W = 1440;
  phone = false;
  fs = 100;
  y0 = 400; // standing type baseline (stage-local)
  deck0 = 410; // the deck's top edge (stage-local), clear of the descenders
  deckL = 100;
  deckR = 1300;
  heights = [40, 50, 58];
  bandTw = [0, 1, 2].map(() => new Tween(0, 600));
  private segs: { up: Seg; side: Seg; down: Seg }[] = [0, 1, 2].map((k) => ({ up: seg('up', k), side: seg('side', k), down: seg('down', k) }));
  private oxy = seg('oxygen');
  private sig = '';
  private ulSig = '';
  private stageTop = 0;
  private lapK = -1;

  constructor(private e: Els, private fixedP: number | null = null, private block: HTMLElement | null = null) {}

  start() {
    return this.box.top;
  }

  measure(scrollY: number, V: number, W: number) {
    const e = this.e;
    this.V = V;
    this.W = W;
    this.box = measureBox(e.section, scrollY);
    const phone = W <= 640;
    this.phone = phone;
    this.y0 = (phone ? 0.42 : 0.4) * V;
    // The oxygen line takes the standing line's measure (one line on desktop).
    e.oxRoot.style.fontSize = '';
    const fs = parseFloat(getComputedStyle(e.standRoot).fontSize);
    this.fs = fs;
    if (!phone) {
      const ratio = e.standRoot.offsetWidth / Math.max(1, e.oxRoot.offsetWidth);
      e.oxRoot.style.fontSize = `${(fs * Math.min(1, ratio * 1.04)).toFixed(2)}px`;
    }
    const liftR = e.lift.getBoundingClientRect();
    const probeTop = e.probe.getBoundingClientRect().top;
    const bo = probeTop - liftR.top;
    e.lift.style.top = `${(this.y0 - bo).toFixed(1)}px`;
    // The deck sits below the descenders (p, y, g), so it reads as a floor, not a strike-through.
    const gap = Math.round(0.24 * fs);
    const textW = Math.max(e.standRoot.offsetWidth, e.oxRoot.offsetWidth);
    const deckW = phone ? W - 48 : Math.min(W - 160, textW + 80);
    this.deckL = (W - deckW) / 2;
    this.deckR = this.deckL + deckW;
    this.deck0 = this.y0 + gap;
    Object.assign(e.deck.style, { top: `${(bo + gap).toFixed(1)}px`, left: `${this.deckL.toFixed(1)}px`, width: `${deckW.toFixed(1)}px` });
    // The phase underlines: on the deck under words on its line, under the baseline otherwise.
    const last = textRect(e.words[3], 0);
    const descent = last.bottom - probeTop;
    e.uls.forEach((ul, k) => {
      const r = textRect(e.words[k], 1);
      const onDeck = Math.abs(r.bottom - last.bottom) < 4;
      const h = onDeck ? (phone ? 4 : 5) : 3;
      const top = onDeck ? bo + gap - (h - 2) / 2 : r.bottom - descent - liftR.top + 0.1 * fs;
      Object.assign(ul.style, { left: `${(r.left - liftR.left).toFixed(1)}px`, width: `${r.width.toFixed(1)}px`, top: `${top.toFixed(1)}px`, height: `${h}px` });
    });
    this.heights = (phone ? [0.035, 0.04, 0.045] : [0.045, 0.055, 0.065]).map((h) => h * V);
    let bottom = this.deck0 + 2;
    e.bands.forEach((b, k) => {
      const h = this.heights[k];
      Object.assign(b.style, { top: `${(bottom - h).toFixed(1)}px`, height: `${h.toFixed(1)}px`, left: `${this.deckL.toFixed(1)}px`, width: `${deckW.toFixed(1)}px` });
      bottom -= h;
    });
    e.breathe.style.top = `${(this.deck0 + (phone ? 30 : 46)).toFixed(1)}px`;
    e.stage.style.setProperty('--deckL', `${this.deckL.toFixed(1)}px`);
    e.stage.style.setProperty('--deckR', `${this.deckR.toFixed(1)}px`);
    this.sig = '';
    this.ulSig = '';
    this.lapK = -1;
    if (this.fixedP !== null) {
      const f: Frame = { now: 0, dt: 0, scrollY, V, W, phone, compact: W < 1100, jump: true };
      this.apply(this.fixedP, f, true);
      if (this.block) this.block.dataset.level = String(this.levelAt(this.fixedP));
    }
  }

  /** complexity: Up lets it in, Down drains it; each lap the deck has risen, so the margin grows. */
  levelAt(p: number) {
    const V = this.V;
    const rise = (this.phone ? 0.15 : 0.2) * V;
    const drain = (this.phone ? 0.13 : 0.17) * V;
    let level = TURN_END * V;
    for (const { up, down } of this.segs) {
      level -= rise * smoothstep(range(p, up.a, up.a + 0.75 * (up.b - up.a)));
      level += drain * smoothstep(range(p, down.a, down.a + 0.75 * (down.b - down.a)));
    }
    const ox = this.oxy;
    if (p > ox.a) level = lerp(level, V + 20, easeInOutCubic(range(p, ox.a, ox.a + 0.45 * (ox.b - ox.a)))); // Oxygen: lots of air
    return level;
  }

  target(f: Frame) {
    return this.levelAt(stickyProgress(this.box, f.scrollY, f.V));
  }

  update(f: Frame) {
    this.stageTop = stickyTop(this.box, f.scrollY, f.V);
    if (this.stageTop > f.V + 40 || this.stageTop + f.V < -40) return;
    this.apply(stickyProgress(this.box, f.scrollY, f.V), f, f.jump);
  }

  private apply(p: number, f: Frame, instant: boolean) {
    const e = this.e;
    const now = f.now;
    const s = segAt(p);
    const phase = s.phase;
    const lap = s.lap;
    const phaseU = range(p, s.a, s.b);
    let nb = 0;
    this.segs.forEach(({ side }, k) => {
      const on = p >= side.a + 0.1 * (side.b - side.a);
      if (on) nb++;
      this.bandTw[k].set(on ? 1 : 0, now, instant);
    });
    const labels = p >= 0.01 ? '1' : '0';
    const dim = p >= this.segs[1].up.a && p < OXYGEN_P ? '1' : '0';
    const sig = `${phase}|${lap}|${labels}|${dim}|${nb}`;
    if (sig !== this.sig) {
      this.sig = sig;
      const st = e.stage.dataset;
      if (this.fixedP === null) st.phase = phase;
      st.lap = String(lap);
      st.labels = labels;
      st.dim = dim;
      st.bands = String(nb);
      if (lap !== this.lapK) {
        this.lapK = lap;
        e.lapLabel.textContent = COPY.cycle.lapLabels[lap];
      }
    }
    // The active phase word is underlined as its phase plays.
    const ulK = phase === 'up' ? 0 : phase === 'side' ? 1 : phase === 'down' ? 2 : -1;
    const ulV = ulK >= 0 ? smoothstep(phaseU * 1.6) : 0;
    const ulSig = `${ulK}|${ulV.toFixed(3)}`;
    if (ulSig !== this.ulSig) {
      this.ulSig = ulSig;
      e.uls.forEach((el, k) => (el.style.transform = `scaleX(${k === ulK ? ulV.toFixed(3) : 0})`));
    }
    // Strata slide in under the deck; the deck and the type ride up on them.
    let lift = 0;
    e.bands.forEach((b, k) => {
      const v = this.bandTw[k].update(now);
      lift += this.heights[k] * v;
      b.style.transform = v >= 1 ? 'none' : `translate3d(${((v - 1) * (f.W + 40)).toFixed(1)}px,0,0)`;
    });
    if (this.bandTw.some((t) => t.busy)) engine.hold(80);
    e.lift.style.transform = `translate3d(0, ${(-lift).toFixed(2)}px, 0)`;
    // complexity rides the surface; margin measures the air between the surface and the deck.
    const m = engine.model;
    const phone = f.W <= 640;
    const cxX = phone ? f.W - 16 : this.deckR + 14;
    const sY = (this.fixedP !== null ? this.levelAt(p) : m.surfaceY(cxX) - this.stageTop) + 10;
    e.cx.style.transform = `translate3d(0, ${sY.toFixed(1)}px, 0)`;
    const dx = phone ? 12 : this.deckL - 26;
    const deckY = this.deck0 - lift;
    const surf = this.fixedP !== null ? this.levelAt(p) : m.surfaceY(dx) - this.stageTop;
    const h = Math.max(0, surf - deckY);
    e.dim.style.transform = `translate3d(${dx.toFixed(1)}px, ${deckY.toFixed(1)}px, 0)`;
    e.dimLine.style.transform = `scaleY(${h.toFixed(1)})`;
    e.dimB.style.transform = `translateY(${h.toFixed(1)}px)`;
    // Phones: the label sits level in the air under the strata; desktop: beside the line's middle.
    const labY = phone ? (this.deck0 + 2 + surf) / 2 - deckY : h / 2;
    e.dimLab.style.transform = `translateY(${labY.toFixed(1)}px)`;
  }
}

/** 04 · THE CYCLE: complexity rises, systems lift the deck, pruning drains it. Three laps. */
export function Cycle() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => engine.addController(new CycleController(cycleEls(section.current!, stage.current!))), []);
  return (
    <section id="cycle" className="cycle" ref={section} aria-labelledby="cycle-title">
      <CycleStage stageRef={stage} />
    </section>
  );
}
