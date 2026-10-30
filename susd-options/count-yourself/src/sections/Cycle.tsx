import { useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COPY, UI } from '../copy';
import { Wheel, type WheelApi } from '../components/Wheel';
import { Swap } from '../components/Swap';
import { setN, useStore } from '../state/store';
import { useInView } from '../hooks/useInView';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { addTick, wake } from '../motion/loop';
import { Spring } from '../motion/spring';
import { peopleWord, tempoOf, zoneId, zoneOf } from '../zones';
import { skipIntro } from '../intro';
import { S, T } from '../components/Text';

const FACE_CLASS = ['pw-up', 'pw-side', 'pw-down'];
const SYS = [COPY.cycle.systems.up, COPY.cycle.systems.side, COPY.cycle.systems.down];
const SEASONS = [UI.upFace, UI.sideFace, UI.downFace];
const KEYS = ['up', 'side', 'down'] as const;
/**
 * A six-face prism (UP, SIDE, DOWN, twice; 60° per step). Its silhouette is always taller than the
 * window, so a turn never shows the well behind it.
 */
const FACES = [0, 1, 2, 0, 1, 2].map((k, i) => (
  <span className={`pw ${FACE_CLASS[k]}`} key={i}>
    {COPY.cycle.faces[k]}
  </span>
));
const faceClass = (i: number) => `pf pf-${i % 3}`;

/** Dwell per face (ms) from the tempo band for n (BL 161–164). */
function dwell(n: number, face: number): number {
  if (n <= 3) return [1800, 600, 600][face];
  if (n <= 6) return 1000;
  if (n <= 9) return 1400;
  return 2000;
}

/** "Up for growth. Side for stability. Down for pruning." with one underline that travels to the current phrase. */
function Jobs({ face }: { face: number }) {
  const box = useRef<HTMLParagraphElement>(null);
  const line = useRef<HTMLElement>(null);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);
  const placed = useRef(false);
  useLayoutEffect(() => {
    const place = (animate: boolean) => {
      const el = spans.current[face];
      const u = line.current;
      if (!el || !u) return;
      u.style.transition = animate && placed.current ? '' : 'none';
      u.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop + el.offsetHeight}px) scaleX(${el.offsetWidth})`;
      placed.current = true;
    };
    place(true);
    const ro = new ResizeObserver(() => place(false));
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [face]);
  return (
    <p className="jobs" ref={box}>
      {COPY.cycle.jobs.map((j, i) => (
        <span key={j}>
          <span ref={(el) => (spans.current[i] = el)} className={`job-s${face === i ? ' is-now' : ''}`}>
            {j}
          </span>
          {i < 2 ? ' ' : ''}
        </span>
      ))}
      <i className="job-line" ref={line} aria-hidden="true" />
    </p>
  );
}

/** The four systems for each face, stacked in one cell. A face change flaps the old row out, then the new one in. */
function Systems({ face, phone }: { face: number; phone: boolean }) {
  const prev = useRef(-1);
  const last = useRef(face);
  const [animated, setAnimated] = useState(false);
  if (last.current !== face) {
    prev.current = last.current;
    last.current = face;
    if (!animated) setAnimated(true);
  }
  const state = (r: number) => (r === face ? (animated ? 'is-in' : 'is-on') : r === prev.current ? 'is-out' : 'is-off');
  return (
    <div className={`sys${phone ? ' grid' : ''}`}>
      {SYS.map((row, r) => (
        <div key={r} className={`sys-row ${state(r)}`} aria-hidden={r !== face ? true : undefined}>
          <span className="sys-label">
            <span className="flip" style={{ ['--k' as string]: 0 }}>
              {COPY.cycle.systemsLabel[r]}
            </span>
          </span>
          <ul className="sys-list">
            {row.map((s, i) => (
              <li key={i}>
                <span className="flip" style={{ ['--k' as string]: i + 1 }}>
                  {s}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** The tempo line for n (At n people, then the three season lengths), the current season lit; one full turn's length under it. */
function Tempo({ n, face }: { n: number; face: number | null }) {
  const tempo = tempoOf(n);
  if (!tempo) return null;
  return (
    <div className="tempo-block">
      <p className="tempo">
        <span className="t-at">
          {UI.at} {n} {peopleWord(n)}
        </span>
        <span className="t-seasons">
          {KEYS.map((k, i) => (
            <span key={k} className={`t-s${face === i ? ' is-now' : ''}`}>
              {SEASONS[i]} {tempo[k]}
            </span>
          ))}
        </span>
      </p>
      <p className="tempo-plan">
        <span className="t-k">{UI.fullCycle}</span> {tempo.full}
      </p>
    </div>
  );
}

export function Cycle({ phone }: { phone: boolean }) {
  const nNow = useStore((s) => s.n);
  // Below the fold while the visitor dials: render at low priority.
  const n = useDeferredValue(nNow);
  const z = zoneId(n);
  const locked = z === 'threshold' ? 'threshold' : z === 'graveyard' ? 'graveyard' : z === 'tot' ? 'tot' : null;
  const band = tempoOf(n)?.from ?? 0;
  const rm = useReducedMotion();
  const winRef = useRef<HTMLDivElement>(null);
  const inView = useInView(winRef, 0.4);
  const wheel = useRef<WheelApi>(null);
  const spring = useRef(new Spring(0, 220, 24));
  const steps = useRef(0);
  const [face, setFace] = useState(0);
  const shown = useRef(0);
  const [turns, setTurns] = useState(0);
  // Steps taken at the current tempo. After one full turn (Up, Side, Down) the clock line hands over to
  // the deposit line; a new tempo (the visitor changed their number) brings the clock line back.
  const [atTempo, setAtTempo] = useState({ band, steps: 0 });
  if (atTempo.band !== band) setAtTempo({ band, steps: 0 });
  const fullTurn = atTempo.steps >= 3;

  useEffect(
    () =>
      addTick((dt) => {
        const m = spring.current.step(dt);
        const x = spring.current.x;
        wheel.current?.set(x);
        // The phrase, its underline, the systems and the tempo all follow the face the drum is actually
        // showing (it changes as the turn passes halfway), so no frame shows two different faces.
        const f = ((Math.round(x) % 3) + 3) % 3;
        if (f !== shown.current) {
          shown.current = f;
          setFace(f);
        }
        return m;
      }),
    [],
  );

  const go = (to: number) => {
    steps.current = to;
    spring.current.target = to;
    if (rm) spring.current.jump(to);
    wake();
  };

  // Auto-turn while the drum is at least 40% visible and the cycle is open (tempo bands only).
  useEffect(() => {
    if (!inView || locked || rm) return;
    const t = window.setTimeout(() => {
      go(steps.current + 1);
      setTurns((v) => v + 1);
      setAtTempo((a) => ({ ...a, steps: a.steps + 1 }));
    }, dwell(n, face));
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, locked, rm, face, turns, n]);

  // Locked in the Graveyard or out of scope: turn forward to the UP face and stop there.
  useEffect(() => {
    if ((locked === 'graveyard' || locked === 'tot') && steps.current % 3 !== 0) go(Math.ceil(steps.current / 3) * 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const streamline = (e: React.MouseEvent<HTMLButtonElement>) => {
    skipIntro();
    const r = e.currentTarget.getBoundingClientRect();
    setN(12, 'button', { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    // The button leaves with the locked state: keep the keyboard user's place on the section heading.
    document.getElementById('cycle-h')?.focus({ preventScroll: true });
  };

  return (
    <section id="cycle" className={`cycle${locked ? ` is-${locked}` : ''}${rm ? ' is-static' : ''}`} aria-labelledby="cycle-h">
      {/* The bridge from the meter: what the book does instead of adding complexity in a straight line. */}
      <p className="cycle-mark" aria-hidden="true">
        <span>{COPY.cycle.mark}</span>
      </p>
      <p className="cycle-lead">
        <S>{COPY.cycle.lead}</S>
      </p>
      <h2 id="cycle-h" className="cycle-h" tabIndex={-1}>
        {COPY.cycle.headline}
      </h2>

      {rm ? (
        <ul className="cycle-static">
          {COPY.cycle.faces.map((f, i) => (
            <li key={f}>
              <span className={`tile pw ${FACE_CLASS[i]}`}>{f}</span>
              <span className="tile-job">{COPY.cycle.jobs[i]}</span>
              {!locked && (
                <span className="tile-sys">
                  {SYS[i].map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="prism-wrap">
          <div ref={winRef} className={`prism-window${locked === 'threshold' ? ' is-blank' : ''}`}>
            <Wheel ref={wheel} faces={FACES} dir={-1} className="prism" faceClassName={faceClass} />
            {locked === 'threshold' && (
              <div className="paused" aria-hidden="true">
                <span>{COPY.cycle.paused}</span>
              </div>
            )}
            <div className="shade" aria-hidden="true" />
            <span className="sr-only">{locked ? '' : COPY.cycle.faces[face]}</span>
          </div>
          {locked === 'graveyard' && <div className="strap" aria-hidden="true" />}
        </div>
      )}

      {!locked && (
        <>
          {!rm && (
            <>
              <Jobs face={face} />
              <Systems face={face} phone={phone} />
            </>
          )}
          <Tempo n={n} face={rm ? null : face} />
          {rm ? (
            <>
              <p className="clock">
                <S>{COPY.cycle.clock}</S>
              </p>
              <p className="deposit">
                <S>{COPY.cycle.deposit}</S>
              </p>
            </>
          ) : (
            <Swap
              className="clock"
              as="p"
              text={fullTurn ? COPY.cycle.deposit : COPY.cycle.clock}
              outMs={200}
              inMs={320}
              render={(t) => <S>{t}</S>}
            />
          )}
        </>
      )}

      {locked === 'threshold' && (
        <p className="job-warn">
          <T>{COPY.cycle.phaseChange}</T>
        </p>
      )}
      {/* 40+: the hero has just said why (BL 4253); here the place is named, not repeated. */}
      {locked === 'tot' && <p className="tot-tag">{zoneOf(40).tag}</p>}

      {locked === 'graveyard' && (
        <div className="exits">
          <div className="exit-row">
            <button type="button" className="pill pill-solid exit-go" onClick={streamline}>
              {COPY.cycle.streamlineBtn}
            </button>
            <span className="exit-others">
              {COPY.cycle.exits.slice(1).map((x) => (
                <span key={x} className="exit-off">
                  {x}
                </span>
              ))}
            </span>
          </div>
          <p className="nowaythrough">{COPY.cycle.noWayThrough}</p>
        </div>
      )}
    </section>
  );
}
