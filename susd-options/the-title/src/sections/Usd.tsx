import { useCallback, useEffect, useRef } from 'react';
import { COPY } from '../copy';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { fontsReady } from '../hooks/fonts';
import { Spring } from '../motion/spring';
import { subscribe, wake } from '../motion/loop';
import { tween } from '../motion/timeline';
import { easeInOutCubic, easeOutCubic, range, lerp } from '../motion/ease';
import { C, css, mix, type RGB } from '../motion/color';
import { scrollToInstant } from '../scroll';
import { Sentences } from '../components/Lines';

interface Props {
  sticky: boolean;
  reduced: boolean;
  debug: boolean;
}

// the title, letter by letter; `key` marks the three initials that survive
type Glyph = { ch: string; tone: 'up' | 'side' | 'down'; keep?: boolean; hy?: boolean };
function glyphs(): Glyph[] {
  const [up, side, down] = COPY.hero.words;
  const out: Glyph[] = [];
  const add = (w: string, tone: Glyph['tone']) => [...w].forEach((ch, i) => out.push({ ch, tone, keep: i === 0 }));
  add(up, 'up');
  out.push({ ch: '', tone: 'up', hy: true });
  add(side, 'side');
  out.push({ ch: '', tone: 'up', hy: true });
  add(down, 'down');
  return out;
}

const FACE: Record<string, RGB> = { up: C.up, side: C.side, down: C.down };
const EDGE: Record<string, RGB> = { up: C.upEdge, side: C.sideEdge, down: C.downEdge };
/** desktop: the title at ~70vw (7.8vw type) -> USD at 16vw; on a phone 10vw type -> 24vw initials */
const scaleK = () => (window.innerWidth <= 700 ? 2.4 : 2.05);

export function Usd({ sticky, reduced, debug }: Props) {
  const ref = useRef<HTMLElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const G = useRef(glyphs());
  const geo = useRef<{ dx: number; dy: number }[] | null>(null);
  const prog = useRef(new Spring(0, 200, 26));
  const target = useRef(0);
  const lineShown = useRef(false);
  const kRef = useRef(1.6);

  const measure = useCallback(() => {
    const el = line.current;
    if (!el) return;
    const spans = [...el.querySelectorAll<HTMLElement>('.ul-g')];
    spans.forEach((s) => (s.style.transform = ''));
    const box = el.getBoundingClientRect();
    const rects = spans.map((s) => s.getBoundingClientRect());
    const F = parseFloat(getComputedStyle(el).fontSize);
    // baseline of the line: a zero-height inline-block inside the first glyph's own line box
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    spans[0].appendChild(probe);
    const base = probe.getBoundingClientRect().top - box.top;
    probe.remove();
    let cap = 0.7 * F;
    try {
      const c = document.createElement('canvas').getContext('2d');
      if (c) {
        c.font = `900 ${F}px ${getComputedStyle(el).fontFamily}`;
        const m = c.measureText('H').actualBoundingBoxAscent;
        if (m > 0.5 * F && m < 0.9 * F) cap = m;
      }
    } catch {
      /* default */
    }
    const K = scaleK();
    kRef.current = K;
    const keep = G.current.map((g, i) => (g.keep ? i : -1)).filter((i) => i >= 0);
    const total = keep.reduce((a, i) => a + rects[i].width, 0) * K;
    const cx = box.width / 2;
    const targetBase = base - cap / 2 + (cap * K) / 2;
    let cum = 0;
    const out = G.current.map(() => ({ dx: 0, dy: 0 }));
    keep.forEach((i) => {
      const r = rects[i];
      const x0 = r.left - box.left;
      const y0 = r.top - box.top;
      const bIn = base - y0; // baseline inside the glyph box
      const x1 = cx - total / 2 + cum;
      const y1 = targetBase - K * bIn;
      out[i] = { dx: x1 - x0, dy: y1 - y0 };
      cum += r.width * K;
    });
    geo.current = out;
    // the $ bar through the S
    const sIdx = keep[1];
    const sr = rects[sIdx];
    if (bar.current) {
      // the dollar sign's stroke: 0.05em wide, standing 0.12em proud of the S top and bottom
      const sx = cx - total / 2 + rects[keep[0]].width * K + (sr.width * K) / 2;
      const h = cap * K + 2 * 0.12 * F * K;
      const w = 0.05 * F * K;
      bar.current.style.fontSize = `${F * K}px`;
      bar.current.style.width = `${w}px`;
      bar.current.style.height = `${h}px`;
      bar.current.style.left = `${sx - w / 2}px`;
      bar.current.style.top = `${targetBase - cap * K - (h - cap * K) / 2}px`;
    }
    render(prog.current.value);
  }, []);

  const render = useCallback((p: number) => {
    const el = line.current;
    const g = geo.current;
    if (!el || !g) return;
    const spans = el.querySelectorAll<HTMLElement>('.ul-g');
    const blind = range(p, 0, 0.14);
    const drop = range(p, 0.12, 0.3);
    const slide = easeInOutCubic(range(p, 0.26, 0.5));
    G.current.forEach((gl, i) => {
      const s = spans[i];
      if (!s) return;
      if (gl.keep) {
        const sc = lerp(1, kRef.current, slide);
        s.style.transform = `translate3d(${(g[i].dx * slide).toFixed(2)}px, ${(g[i].dy * slide).toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
      } else {
        const face = gl.hy ? mix(C.ink, C.paperShade, blind) : mix(FACE[gl.tone], C.paperShade, blind);
        const edge = gl.hy ? mix([5, 4, 4], C.paperEdge, blind) : mix(EDGE[gl.tone], C.paperEdge, blind);
        if (gl.hy) s.style.background = css(face);
        else s.style.color = css(face);
        s.style.setProperty('--edge', css(edge));
        s.style.transform = drop > 0 ? `translate3d(0, ${(0.3 * drop).toFixed(4)}em, 0)` : '';
        s.style.opacity = String(1 - drop);
      }
    });
    if (bar.current) bar.current.style.transform = `scaleY(${easeOutCubic(range(p, 0.48, 0.58)).toFixed(4)})`;
    const show = p >= 0.6;
    if (show !== lineShown.current) {
      lineShown.current = show;
      caption.current?.classList.toggle('on', show);
    }
  }, []);

  // spring follower: the scroll sets the target, the spring smooths it
  useEffect(() => {
    let dead = false;
    fontsReady().then(() => {
      if (dead) return;
      measure();
      if (reduced) {
        prog.current.set(1);
        render(1);
      }
    });
    const ro = new ResizeObserver(() => measure());
    if (line.current) ro.observe(line.current);
    const un = subscribe((_now, dt) => {
      const s = prog.current;
      s.target = target.current;
      const moving = s.step(dt);
      if (moving) render(s.value);
      return moving;
    });
    return () => {
      dead = true;
      ro.disconnect();
      un();
    };
  }, [measure, render, reduced]);

  useScrollProgress(
    ref,
    (p) => {
      // p starts while the section is still coming in (its top at 60% of the screen), so the full
      // title never sits on screen at rest: its letters are already draining as it arrives. It completes
      // just after the stage sticks, and the short runway (130vh) holds U$D for a moment, not two screens.
      target.current = Math.min(1, p / 0.8);
      wake();
    },
    sticky && !reduced && !debug,
    0.6,
  );

  // stacked mode (phone / reduced): play once at 40% visibility
  useEffect(() => {
    if (sticky || !ref.current || debug) return;
    if (reduced) {
      target.current = 1;
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect();
          tween(
            1700,
            (v) => {
              target.current = v;
              wake();
            },
            { ease: (t) => t, delay: 200 },
          );
        }
      },
      { threshold: 0.4 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [sticky, reduced, debug]);

  // debug: ?section=usd
  useEffect(() => {
    if (!debug || !ref.current) return;
    const el = ref.current;
    target.current = 1;
    prog.current.set(1);
    caption.current?.classList.add('on', 'is-instant');
    fontsReady().then(() => {
      render(1);
      window.setTimeout(() => {
        if (sticky) window.scrollTo(0, el.offsetTop + (el.offsetHeight - window.innerHeight) * 0.85);
        else scrollToInstant(el);
      }, 60);
    });
  }, [debug, render, sticky]);

  return (
    <section id="usd" className={`usd ${sticky ? 'is-sticky' : 'is-stacked'}`} ref={ref} aria-labelledby="usd-h">
      <div className="usd-stage">
        <h2 id="usd-h" className="usd-label caps">
          {COPY.usd.label}
        </h2>
        <div className="usd-line" ref={line} aria-hidden="true">
          {G.current.map((g, i) =>
            g.hy ? (
              <span key={i} className="ul-g ul-hy" />
            ) : (
              <span key={i} className={`ul-g relief relief--${g.tone} ${g.keep ? 'is-keep' : ''}`}>
                {g.ch}
              </span>
            ),
          )}
          <span className="usd-bar" ref={bar} />
        </div>
        <p className="usd-caption" ref={caption}>
          <Sentences text={COPY.usd.line} />
        </p>
      </div>
    </section>
  );
}
