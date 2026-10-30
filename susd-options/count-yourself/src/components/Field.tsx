import { useEffect, useRef } from 'react';
import { getState, subscribe, type Change } from '../state/store';
import { fieldOf, fgOf, wellOf, zoneId } from '../zones';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { EASE } from '../motion/ease';

/** Where colour sweeps start when the change did not come from a tapped element: the drum window. */
export function windowCentre(): { x: number; y: number } {
  const w = document.getElementById('dial-window');
  if (w) {
    const r = w.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

// What is currently on <html>, so a step that keeps the same colours writes nothing (no style recalc).
const applied: Record<string, string> = {};
let themeMeta: HTMLMetaElement | null = null;

function setVar(name: 'field' | 'fg' | 'well' | 'bar' | 'bar-fg', v: string) {
  if (applied[name] === v) return;
  applied[name] = v;
  document.documentElement.style.setProperty(`--${name}`, v);
}
function setData(name: 'zone' | 'ink', v: string) {
  if (applied[name] === v) return;
  applied[name] = v;
  document.documentElement.dataset[name] = v;
}

/** Each zone has one colour; the Graveyard uses its first shade for the whole band. */
const zoneField = (n: number) => fieldOf(zoneId(n) === 'graveyard' ? 15 : n);

let shadeEl: HTMLStyleElement | null = null;
/**
 * Inside the Graveyard the field darkens with every person (15 → 39). Only four elements need that
 * shade (the two windows' wells, the chip and the phone bar), so it goes into a tiny stylesheet that
 * targets them, instead of a root variable that would re-style the whole page on every step.
 */
function applyShade(n: number) {
  const f = fieldOf(n);
  if (applied.shade === f) return;
  applied.shade = f;
  if (!shadeEl) {
    shadeEl = document.createElement('style');
    shadeEl.id = 'field-shade';
    document.head.appendChild(shadeEl);
  }
  shadeEl.textContent = f === zoneField(n) ? '' : `#dial-window,.prism-window{--well:${wellOf(f)}}.chip,.bbar{--bar:${f}}`;
}

/**
 * Text, field and well colours as CSS variables, per zone. They switch instantly (never interpolated,
 * so text never passes through a muddy mid-grey between ink and cream); the field itself crossfades
 * or sweeps.
 */
/** The chip and the phone bar: their colour pair switches as one, at the start of a sweep. */
function applyBar(n: number) {
  setVar('bar', zoneField(n));
  setVar('bar-fg', fgOf(n));
}

function applyVars(n: number) {
  const field = zoneField(n);
  setVar('field', field);
  setVar('fg', fgOf(n));
  applyBar(n);
  setVar('well', wellOf(field));
  setData('zone', zoneId(n));
  setData('ink', fgOf(n) === '#1C1A17' ? 'ink' : 'cream');
  applyShade(n);
  const shade = fieldOf(n);
  if (applied.theme !== shade) {
    applied.theme = shade;
    themeMeta ??= document.querySelector('meta[name="theme-color"]');
    themeMeta?.setAttribute('content', shade);
  }
}

type Overlay = { el: HTMLDivElement; seq: number; colour: string };

/**
 * The fixed full-viewport field (#field, behind everything). One flat cover ink at a time, with grain.
 * Zone changes sweep the new colour out as a hard-edged circle from the window (or from the tapped
 * bar or button). The window's well turns first (the colour floods out of it); the text flips once
 * the circle has covered the centre column (30% of the sweep).
 */
export function Field() {
  const base = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const b = base.current!;
    const l = layer.current!;
    let overlays: Overlay[] = [];
    let varsSeq = 0;
    let lastSeq = -1;

    const setBase = (c: string, ms: number) => {
      b.style.transition = ms ? `background-color ${ms}ms linear` : 'none';
      b.style.backgroundColor = c;
    };
    const varsAt = (ch: Change, delay: number) => {
      const go = () => {
        if (ch.seq < varsSeq) return;
        varsSeq = ch.seq;
        applyVars(ch.n);
      };
      if (delay > 0) window.setTimeout(go, delay);
      else go();
    };
    const clearOverlays = (fade: boolean, ms = 200) => {
      for (const o of overlays) {
        if (fade) {
          o.el.style.transition = `opacity ${ms}ms linear`;
          o.el.style.opacity = '0';
          window.setTimeout(() => o.el.remove(), ms + 30);
        } else o.el.remove();
      }
      overlays = [];
    };
    const sweep = (ch: Change, colour: string, ms: number) => {
      const el = document.createElement('div');
      el.className = 'sweep';
      el.style.backgroundColor = colour;
      l.appendChild(el);
      const o: Overlay = { el, seq: ch.seq, colour };
      overlays.push(o);
      const { x, y } = ch.origin ?? windowCentre();
      // Grow to the farthest corner, so the whole 450–500 ms of the sweep is visible.
      const w = window.innerWidth;
      const h = window.innerHeight;
      const far = Math.ceil(Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y)) * 1.02);
      const anim = el.animate(
        [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${far}px at ${x}px ${y}px)` }],
        { duration: ms, easing: EASE.outCubic, fill: 'forwards' },
      );
      anim.onfinish = () => {
        const i = overlays.indexOf(o);
        if (i < 0) return;
        setBase(o.colour, 0);
        overlays.slice(0, i + 1).forEach((v) => v.el.remove());
        overlays = overlays.slice(i + 1);
      };
      // The well first (the circle leaves the window within ~40 ms), then text and chrome.
      if (ch.seq >= varsSeq) {
        setVar('well', wellOf(zoneField(ch.n)));
        applyShade(ch.n);
        applyBar(ch.n);
      }
      varsAt(ch, ms * 0.3);
    };

    const init = getState();
    setBase(fieldOf(init.n), 0);
    applyVars(init.n);
    lastSeq = init.change.seq;

    // Pre-warm the sweep: build one full-screen clip-path layer now (invisible), so the first real
    // sweep (the oxblood flood in the intro) does not pay for layer setup mid-animation.
    const warm = document.createElement('div');
    warm.className = 'sweep';
    warm.style.opacity = '0.001';
    warm.style.backgroundColor = fieldOf(15);
    l.appendChild(warm);
    const wa = warm.animate([{ clipPath: 'circle(0px at 50% 50%)' }, { clipPath: 'circle(40px at 50% 50%)' }], { duration: 120 });
    wa.onfinish = () => warm.remove();

    return subscribe(() => {
      const ch = getState().change;
      if (ch.seq === lastSeq) return;
      lastSeq = ch.seq;
      const next = fieldOf(ch.n);
      const prevColour = fieldOf(ch.prev);
      if (next === prevColour) {
        varsAt(ch, 0);
        return;
      }
      if (prefersReducedMotion() || ch.from === 'init') {
        clearOverlays(false);
        setBase(next, 0);
        varsAt(ch, 0);
        return;
      }
      const zoneChanged = zoneId(ch.n) !== zoneId(ch.prev);
      const intoGraveyard = ch.n >= 15 && ch.prev < 15 && ch.n < 40;
      if (ch.from === 'intro') {
        // The count follows the drum, one integer at a time. 14 → 15 floods oxblood out of the window.
        // Every other step is a cut on the same frame as the digit: field, well and text change
        // together, so no in-between colour (and no text on the wrong ground) is ever on screen.
        if (ch.n >= 15 && ch.prev < 15) sweep(ch, next, 450);
        else {
          clearOverlays(false);
          setBase(next, 0);
          varsAt(ch, 0);
        }
        return;
      }
      if (zoneChanged) {
        sweep(ch, next, intoGraveyard ? 450 : 500);
        return;
      }
      // Same zone, new shade (the Graveyard darkens toward 39): crossfade, and retint any sweep still running.
      const top = overlays[overlays.length - 1];
      if (top) {
        top.el.style.transition = 'background-color 200ms linear';
        top.el.style.backgroundColor = next;
        top.colour = next;
      } else setBase(next, 200);
      varsAt(ch, 0);
    });
  }, []);

  return (
    <div id="field" aria-hidden="true">
      <div className="field-base" ref={base} />
      <div className="field-sweeps" ref={layer} />
      <div className="field-grain" />
    </div>
  );
}
