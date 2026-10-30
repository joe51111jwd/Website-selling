import { useEffect, useRef } from 'react';
import { COPY } from '../copy';
import { WetText, Words } from '../water/WetText';
import { engine, type Controller, type Frame } from '../engine/engine';
import { clamp, easeInOutCubic, lerp, range } from '../motion/easing';
import { measureBox, stickyProgress, type SectionBox } from '../hooks/useScrollProgress';

const SENT2 = 5; // the second sentence starts on its own line (desktop)
const PHONE = [3, 5, 8]; // phone: four lines, breaking before words 3, 5 and 8 (each sentence starts a line)
export const TURN_END = 0.7; // the water rests at 0.70V when the line has broken the surface

export function TurnLine({ id }: { id?: string }) {
  return (
    <WetText as="h2" id={id} className="turn-line" wobble>
      <Words text={COPY.turn.line} breaks={[SENT2]} phoneBreaks={PHONE} />
    </WetText>
  );
}

// p 0–0.04: the Redline is still fading away above; the line is already in the water, low.
// p 0.04–0.55: the water drains while the line rises and breaks the surface. Then it holds,
// and from 0.86 it fades in place: the cycle (overlapping this section) takes its spot.
const A = 0.04;
const Z = 0.55;
const OUT_A = 0.86;
const OUT_B = 0.97;

class TurnController implements Controller {
  box: SectionBox = { top: 0, height: 1 };
  h = 100;
  private last = '';
  private lastOp = '';
  private lastWc = '';
  constructor(private section: HTMLElement, private line: HTMLElement) {}
  start() {
    return this.box.top;
  }
  // The turn overlaps the end of the tide by one screen: it owns the water once its stage sticks.
  owns() {
    return this.box.top;
  }
  measure(scrollY: number) {
    this.box = measureBox(this.section, scrollY);
    this.h = this.line.offsetHeight;
    this.last = '';
    this.lastOp = '';
    this.lastWc = '';
  }
  private e(f: Frame) {
    return easeInOutCubic(range(stickyProgress(this.box, f.scrollY, f.V), A, Z));
  }
  target(f: Frame) {
    const p = stickyProgress(this.box, f.scrollY, f.V);
    const m = engine.model;
    const calm = 1 - clamp((p - A) / (Z - A));
    m.ampGoal = lerp(1, 0.3, calm);
    m.ctGoal = lerp(1, 0.5, calm);
    return lerp(-0.04 * f.V, TURN_END * f.V, this.e(f));
  }
  update(f: Frame) {
    const top = this.box.top - f.scrollY;
    if (top > f.V + 20 || top + this.box.height < -20) return;
    const p = stickyProgress(this.box, f.scrollY, f.V);
    const out = range(p, OUT_A, OUT_B);
    // whole device pixels, and no promoted layer once it rests, so the dry type is crisp
    const dpr = window.devicePixelRatio || 1;
    const y = Math.round((lerp(0.86 * f.V, 0.38 * f.V, this.e(f)) - this.h / 2 - 18 * out) * dpr) / dpr;
    const tr = `translate3d(0, ${y}px, 0)`;
    if (tr !== this.last) {
      this.last = tr;
      this.line.style.transform = tr;
    }
    const op = out > 0 ? (1 - out).toFixed(3) : '';
    if (op !== this.lastOp) {
      this.lastOp = op;
      this.line.style.opacity = op;
      this.line.style.visibility = out >= 1 ? 'hidden' : '';
    }
    const wc = p < Z || out > 0 ? 'transform' : 'auto';
    if (wc !== this.lastWc) {
      this.lastWc = wc;
      this.line.style.willChange = wc;
    }
  }
}

/** 03 · THE TURN: the shame lifts. The line rises through the water and breaks the surface. */
export function Turn() {
  const section = useRef<HTMLElement>(null);
  const line = useRef<HTMLDivElement>(null);
  useEffect(() => engine.addController(new TurnController(section.current!, line.current!)), []);
  return (
    <section id="turn" className="turn" ref={section} aria-labelledby="turn-title">
      <div className="stage turn-stage">
        <div className="turn-pos" ref={line}>
          <TurnLine id="turn-title" />
        </div>
      </div>
    </section>
  );
}
