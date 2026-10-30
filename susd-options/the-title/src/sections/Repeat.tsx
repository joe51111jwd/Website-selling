import { useCallback, useEffect, useRef } from 'react';
import { COPY } from '../copy';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { fontsReady } from '../hooks/fonts';
import { Clauses, Sentences } from '../components/Lines';
import { prefersReduced } from '../hooks/useReducedMotion';

interface Props {
  sticky: boolean; // desktop and motion allowed
}

const TONES = ['up', 'side-ink', 'down', 'ink'];
const KEYS = ['up', 'side', 'down'] as const;

/** "Up. Side. Down. Repeat." with each sentence in its own ink (one verbatim string, split for colour). */
export function RepeatWords({ text }: { text: string }) {
  const parts = text.split(' ');
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          <span className={`rh relief-sm relief--${TONES[i]}`}>{p}</span>
          {i < parts.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}

function RepeatHeadline({ id }: { id?: string }) {
  return (
    <h2 id={id} className="repeat-headline">
      <RepeatWords text={COPY.repeat.headline} />
    </h2>
  );
}

/** A system name with its "&" set lighter and smaller, so Archivo's open ampersand reads as a conjunction,
 *  not a letter (the words are unchanged). */
function SystemName({ text }: { text: string }) {
  const parts = text.split(' & ');
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && (
            <>
              {' '}
              <span className="amp">&amp;</span>{' '}
            </>
          )}
          {p}
        </span>
      ))}
    </>
  );
}

/** A small UP▪SIDE▪DOWN lockup. */
export function Lockup({ className = '' }: { className?: string }) {
  return (
    <span className={`lockup ${className}`} aria-hidden="true">
      <span className="lw relief-sm relief--up">{COPY.hero.words[0]}</span>
      <span className="lh" />
      <span className="lw relief-sm relief--side">{COPY.hero.words[1]}</span>
      <span className="lh" />
      <span className="lw relief-sm relief--down">{COPY.hero.words[2]}</span>
    </span>
  );
}

export function Repeat({ sticky }: Props) {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stair = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const last = useRef({ beat: '', on: [false, false, false], deposit: false, list: false });

  // draw the connectors from the measured lockup positions
  const drawConnectors = useCallback(() => {
    const box = stair.current;
    const s = svg.current;
    if (!box || !s) return;
    const b = box.getBoundingClientRect();
    const items = [...box.querySelectorAll<HTMLElement>('.step')].map((el) => {
      const r = el.querySelector('.lockup')!.getBoundingClientRect();
      return { l: r.left - b.left, r: r.right - b.left, y: r.bottom - b.top + 10 };
    });
    s.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
    s.setAttribute('width', String(b.width));
    s.setAttribute('height', String(b.height));
    const row = items.length > 1 && items[0].r < items[1].l;
    const paths = s.querySelectorAll('path');
    items.forEach((it, k) => {
      const next = items[k + 1];
      let d = `M${it.l.toFixed(1)} ${it.y.toFixed(1)} H${it.r.toFixed(1)}`;
      if (next) {
        if (row) {
          const mid = it.r + (next.l - it.r) * 0.35;
          d += ` H${mid.toFixed(1)} L${(next.l - 4).toFixed(1)} ${next.y.toFixed(1)}`;
        } else {
          // phone: Cycle 1 at the bottom, each cycle above it, further right and bigger (column-reverse).
          // Each tread runs on past its lockup to the right end of the next tread, then rises straight up
          // to it: the right-hand profile is a plain staircase climbing to the upper right (clear of labels).
          d += ` H${next.r.toFixed(1)} V${next.y.toFixed(1)}`;
        }
      }
      paths[k]?.setAttribute('d', d);
    });
  }, []);

  useEffect(() => {
    let dead = false;
    fontsReady().then(() => !dead && drawConnectors());
    const ro = new ResizeObserver(() => drawConnectors());
    if (stair.current) ro.observe(stair.current);
    return () => {
      dead = true;
      ro.disconnect();
    };
  }, [drawConnectors]);

  // The cycles strike one after another, at least 300 ms apart, however fast the visitor scrolls, and
  // stay struck. Connector k draws as lockup k + 1 lands, so no line ever rises into empty paper.
  const q = useRef({ want: 0, shown: 0, timer: 0, lastAt: 0 });
  const pump = useCallback(() => {
    const st = stage.current;
    const Q = q.current;
    if (!st || Q.timer || Q.shown >= Q.want) return;
    const steps = st.querySelectorAll<HTMLElement>('.step');
    const paths = st.querySelectorAll<SVGPathElement>('.stair-lines path');
    const strike = () => {
      Q.timer = 0;
      const k = Q.shown++;
      Q.lastAt = performance.now();
      steps[k]?.classList.add('on');
      if (k > 0) paths[k - 1]?.classList.add('on');
      if (k === steps.length - 1) paths[k]?.classList.add('on');
      pump();
    };
    if (prefersReduced()) {
      while (Q.shown < Q.want) strike();
      return;
    }
    Q.timer = window.setTimeout(strike, Math.max(0, Q.lastAt + 300 - performance.now()));
  }, []);
  const want = useCallback(
    (n: number) => {
      if (n <= q.current.want) return;
      q.current.want = n;
      pump();
    },
    [pump],
  );
  useEffect(() => () => window.clearTimeout(q.current.timer), []);

  const apply = useCallback(
    (p: number) => {
      const st = stage.current;
      if (!st) return;
      const L = last.current;
      const beat = p >= 0.58 ? 'b' : 'a';
      if (beat !== L.beat) {
        L.beat = beat;
        st.dataset.beat = beat;
      }
      // As soon as the staircase comes into view (p 0.07, well before the stage sticks at 0.33) the three
      // cycles strike in sequence, 300 ms apart, and the deposit line comes up with cycle 1: no frame of
      // this beat is a lone headline or a lone lockup.
      want(p >= 0.07 ? 3 : 0);
      const dep = p >= 0.07;
      if (dep !== L.deposit) {
        L.deposit = dep;
        st.querySelector('.deposit')?.classList.toggle('on', dep);
      }
      const list = p >= 0.6;
      if (list !== L.list) {
        L.list = list;
        st.querySelector('.twelve')?.classList.toggle('on', list);
      }
    },
    [want],
  );

  // p starts while the section is still arriving (top at 45% of the screen): the staircase is already
  // built when the stage sticks, so the visitor never lands on a lone headline over empty paper
  useScrollProgress(ref, apply, sticky, 0.45);

  // stacked mode: reveal each block on IntersectionObserver at 40%
  useEffect(() => {
    if (sticky || !stage.current) return;
    const st = stage.current;
    st.dataset.beat = 'all';
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            if (el.classList.contains('stair')) want(3);
            else el.classList.add('on');
            io.unobserve(el);
          }
        }),
      { threshold: 0.4 },
    );
    st.querySelectorAll('.stair, .deposit, .twelve').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sticky, want]);

  let n = 0;
  return (
    <section id="repeat" className={`repeat ${sticky ? 'is-sticky' : 'is-stacked'}`} ref={ref} aria-labelledby="repeat-h">
      <div className="repeat-stage" ref={stage} data-beat="a">
        <div className="beat beat-a">
          <RepeatHeadline id="repeat-h" />
          <div className="stair" ref={stair}>
            <svg className="stair-lines" ref={svg} aria-hidden="true">
              <path pathLength={100} />
              <path pathLength={100} />
              <path pathLength={100} />
            </svg>
            {COPY.repeat.cycleLabels.map((label, k) => (
              <div className={`step step-${k}`} key={k}>
                <Lockup />
                <span className="step-label caps">{label}</span>
              </div>
            ))}
          </div>
          <p className="deposit">
            <Sentences text={COPY.repeat.deposit} />
          </p>
        </div>
        <div className="beat beat-b">
          <div className="twelve">
            <p className="twelve-lead">
              <Sentences text={COPY.repeat.machine} />
            </p>
            <p className="twelve-line">
              <Clauses text={COPY.repeat.twelve} />
            </p>
            <div className="cols">
              {KEYS.map((k, c) => (
                <div className={`col col-${k}`} key={k}>
                  {/* SIDE as text uses the darker ochre (the cover ochre is for the logotype and fills only) */}
                  <h3 className={`col-head relief relief--${k === 'side' ? 'side-ink' : k}`}>{COPY.hero.words[c]}</h3>
                  <ul>
                    {COPY.repeat.systems[k].map((s) => (
                      <li key={s} style={{ transitionDelay: `${(n++) * 35}ms` }}>
                        <SystemName text={s} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
