import { memo, useCallback, useDeferredValue, useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from 'react';
import { COPY, UI } from '../copy';
import { Swap } from '../components/Swap';
import { setN, useStore } from '../state/store';
import { useInView } from '../hooks/useInView';
import { usePassed } from '../hooks/useScrollProgress';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { addTick } from '../motion/loop';
import { Spring } from '../motion/spring';
import { pathWord, pathways, peopleWord, zoneId } from '../zones';
import { skipIntro } from '../intro';
import { S } from '../components/Text';

const W = 1000;
const H = 420;
const VH = H + 8; // the viewBox runs from y = -8 to the baseline at 420
const CEIL = 150; // height of the dashed "line you don't cross" between 12 and 13
const BARS = Array.from({ length: 40 }, (_, k) => k + 1);
const barX = (i: number) => 25 * (i - 1) + 3.5;
const barW = 18;
/** Bar i is 400 × i(i−1)/2 / 741 tall on a linear scale (bar 1 keeps a 2-unit stub so it can be seen). */
const barH = (i: number) => Math.max(2, (400 * pathways(i)) / 741);
/** The part of bar i that the i-th person added: i − 1 new pathways. */
const capH = (i: number) => (i <= 1 ? 2 : barH(i) - (400 * pathways(i - 1)) / 741);
/** 1–12 cream, 13–14 ochre, 15–39 a muted oxblood (3:1 on the ink ground; never the cover red, which
 *  means DOWN), 40 slate. */
const colour = (i: number) => (i <= 12 ? '#F1EADF' : i <= 14 ? '#D49B2C' : i <= 39 ? '#A0463A' : '#8A8F96');
/** x of the dashed "line you don't cross" between bars 12 and 13. */
const CEIL_X = barX(13) - 3.5;

/** Pointer moves that really moved (a page scrolling under a resting pointer fires moves with the
 *  same coordinates; those must not pop up hover labels). */
const lastPointer = { x: -1, y: -1 };
if (typeof window !== 'undefined')
  window.addEventListener('pointermove', (e) => {
    lastPointer.x = e.clientX;
    lastPointer.y = e.clientY;
  });
const reallyMoved = (e: React.PointerEvent) => e.clientX !== lastPointer.x || e.clientY !== lastPointer.y;

/** Average advance of the label face (Plex Mono 12 px + 0.08em desktop, 10.5 px + 0.04em phone). */
const charPx = (phone: boolean) => (phone ? 6.72 : 8.16);

/**
 * A label above bar i. It is centred on the bar unless that would push it off the chart or across the
 * dashed 12 line; then it is set flush against the line on the bar's side (8 px clear). If it cannot
 * fit there either (phone), it is lifted above the line's top and joined to its bar by a leader.
 * It is always lifted clear of every bar it spans and of the ceiling label. `upp` = viewBox units
 * per CSS pixel at the meter's current width.
 */
function Label({
  i,
  text,
  phone,
  upp,
  lift = 0,
  className = '',
  ceilLabel = true,
}: {
  i: number;
  text: string;
  phone: boolean;
  upp: number;
  lift?: number;
  className?: string;
  ceilLabel?: boolean;
}) {
  const wU = text.length * charPx(phone) * upp;
  const c = barX(i) + barW / 2;
  let x0 = Math.min(Math.max(0, c - wU / 2), W - wU);
  let anchor: 'l' | 'r' | 'c' = x0 === 0 ? 'l' : x0 === W - wU ? 'r' : 'c';
  const gap = 8 * upp;
  let lifted = false;
  if (x0 < CEIL_X + gap && x0 + wU > CEIL_X - gap) {
    if (c < CEIL_X) {
      if (CEIL_X - gap - wU >= 0) {
        x0 = CEIL_X - gap - wU;
        anchor = 'r';
      } else lifted = true;
    } else {
      x0 = CEIL_X + gap;
      anchor = 'l';
    }
  }
  const x1 = x0 + wU;
  let h = 0;
  for (let k = 1; k <= 40; k++) if (barX(k) + barW > x0 && barX(k) < x1) h = Math.max(h, Math.min(H, barH(k)));
  // Bottom of the label in units above the baseline (10 px gap + any lift).
  let b = h + (10 + lift) * upp;
  if (lifted) b = Math.max(b, CEIL + 10 * upp);
  // The ceiling label sits right-aligned against the dashed line at 12, its bottom 13 px under CEIL.
  if (ceilLabel) {
    const ceilR = CEIL_X - 8 * upp;
    const ceilL = ceilR - COPY.meter.at12.length * charPx(phone) * upp;
    const ceilB = CEIL - 13 * upp;
    const ceilT = ceilB + 15 * upp;
    const top = b + 15 * upp;
    if (x0 < ceilR && x1 > ceilL && top > ceilB && b < ceilT) b = ceilT + 4 * upp;
    // Just right of the line at the ceiling label's height, the two would read as one run: step up.
    else if (anchor === 'l' && x0 === CEIL_X + gap && top > ceilB - 4 * upp && b < ceilT + 4 * upp) b = ceilT + 12 * upp;
  }
  const style: CSSProperties = {
    left: anchor === 'r' ? undefined : `${((anchor === 'c' ? c : x0) / W) * 100}%`,
    right: anchor === 'r' ? `${((W - x1) / W) * 100}%` : undefined,
    bottom: `${(b / VH) * 100}%`,
  };
  const barTop = Math.min(H, barH(i)) + 3 * upp;
  return (
    <>
      <span className={`mlabel a-${anchor} ${className}`} style={style}>
        {text}
      </span>
      {lifted && (
        <span
          className={`mleader ${className}`}
          style={{ left: `${(c / W) * 100}%`, bottom: `${(barTop / VH) * 100}%`, height: `${((b - 3 * upp - barTop) / VH) * 100}%` }}
        />
      )}
    </>
  );
}

/** The 40 bars. Rendered once; the visitor's marks and labels live in their own small layer. */
const Bars = memo(function Bars({
  rm,
  rects,
  onPick,
  onHover,
  hover,
}: {
  rm: boolean;
  hover: number;
  rects: MutableRefObject<(SVGGElement | null)[]>;
  onPick: (i: number, e: React.MouseEvent) => void;
  onHover: (i: number, on: boolean) => void;
}) {
  return (
    <>
      {BARS.map((i, k) => {
        const h = barH(i);
        const x = barX(i);
        const c = capH(i);
        return (
          <g key={i} className={`bar${hover === i ? ' is-hover' : ''}`} style={{ ['--k' as string]: k }}>
            <g ref={(el) => (rects.current[k] = el)} className="bar-rise" style={{ transform: rm ? 'scaleY(1)' : 'scaleY(0)' }}>
              {i === 40 ? (
                <path
                  className="bar-40"
                  d={`M${x} ${H} V6 l${barW / 6} -6 l${barW / 6} 6 l${barW / 6} -6 l${barW / 6} 6 l${barW / 6} -6 l${barW / 6} 6 V${H} Z`}
                  fill={colour(i)}
                />
              ) : (
                <>
                  <rect className="bar-body" x={x} y={H - h} width={barW} height={h} fill={colour(i)} />
                  <rect className="bar-cap" x={x} y={H - h} width={barW} height={c} fill={colour(i)} />
                </>
              )}
            </g>
            <rect
              className="hit"
              x={x - 3.5}
              y={-8}
              width={25}
              height={H + 8}
              onClick={(e) => onPick(i, e)}
              onPointerMove={(e) => e.pointerType === 'mouse' && reallyMoved(e) && onHover(i, true)}
              onPointerLeave={() => onHover(i, false)}
            />
          </g>
        );
      })}
    </>
  );
});

/** The ring around the visitor's bar and, in the second beat, a dashed ring around their next hire. */
function Rings({ n, worse }: { n: number; worse: boolean }) {
  const ring = (i: number, cls: string) => {
    const h = Math.min(barH(i), H);
    return <rect className={cls} x={barX(i) - 4} y={Math.max(-6, H - h - 4)} width={barW + 8} height={h + 4} />;
  };
  return (
    <>
      {ring(n, 'you-ring')}
      {n < 40 && ring(n + 1, `next-ring${worse ? ' on' : ''}`)}
    </>
  );
}

function Meter({ n, rise, phone, worse, mine }: { n: number; rise: boolean; phone: boolean; worse: boolean; mine: boolean }) {
  const rm = useReducedMotion();
  const rects = useRef<(SVGGElement | null)[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const [risen, setRisen] = useState(false);
  const [hover, setHover] = useState(0);
  const [upp, setUpp] = useState(phone ? W / 358 : 1);

  // viewBox units per CSS pixel, so labels can be measured against the bars.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      if (w > 0) setUpp(W / w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bars rise from the baseline on a spring (k 260, c 22), 18 ms apart from the left.
  useEffect(() => {
    if (!rise || risen) return;
    if (rm) {
      rects.current.forEach((r) => r && (r.style.transform = 'scaleY(1)'));
      setRisen(true);
      return;
    }
    const springs = BARS.map(() => new Spring(0, 260, 22));
    const t0 = performance.now();
    const off = addTick((dt, now) => {
      let moving = false;
      springs.forEach((s, k) => {
        if (now - t0 >= k * 18) s.target = 1;
        const m = s.step(dt);
        if (m || s.target === 0) moving = true;
        const el = rects.current[k];
        if (el) el.style.transform = `scaleY(${Math.max(0, s.x).toFixed(4)})`;
      });
      if (!moving) {
        setRisen(true);
        off();
      }
      return moving;
    });
    return off;
  }, [rise, risen, rm]);

  const onPick = useCallback((i: number, e: React.MouseEvent) => {
    skipIntro();
    setN(i, 'bar', { x: e.clientX, y: e.clientY });
  }, []);
  const onHover = useCallback((i: number, on: boolean) => setHover((v) => (on ? i : v === i ? 0 : v)), []);

  const near39 = n >= 34;
  // A narrow chart (phone, or a tablet column under ~800 px): short labels, and the ceiling marked under
  // the axis instead of beside the line, so labels never stack or cross.
  const compact = phone || upp > 1.25;
  const nTxt = `${n}${n === 40 ? '+' : ''}`;
  // Until the visitor sets a number, 8 is an example, not "you".
  const who = mine ? COPY.meter.you : COPY.meter.example;
  const youText = compact
    ? `${who} · ${pathways(n)} ${pathWord(n)}`
    : `${who} · ${nTxt} ${peopleWord(n)} · ${pathways(n)} ${pathWord(n)}`;
  const nextName = mine && !compact ? COPY.meter.nextHire : COPY.meter.nextHireShort;
  const nextText = compact ? `${nextName} · +${n}` : `${nextName} · +${n} ${n === 1 ? UI.pathway : UI.pathways}`;
  const showNext = worse && n < 40;
  return (
    <div ref={box} className={`meter${rise || risen ? ' rising' : ''}${risen ? ' risen' : ''}${worse ? ' worse' : ''}`}>
      <span className="maxis-y" aria-hidden="true">
        <i className="arrow-up" />
        {COPY.meter.axisY}
      </span>
      <svg viewBox={`0 -8 ${W} ${H + 8}`} aria-hidden="true" focusable="false">
        {/* The line you don't cross: a solid rule from the baseline up to its label. */}
        <line className="ceiling" x1={CEIL_X} x2={CEIL_X} y1={H} y2={H - CEIL - 6} />
        <Bars rm={rm} rects={rects} onPick={onPick} onHover={onHover} hover={hover} />
        <Rings n={n} worse={worse} />
        <line className="base" x1={0} x2={W} y1={H + 0.5} y2={H + 0.5} />
      </svg>
      <div className="mlabels" aria-hidden="true">
        {!compact && (
          <span
            className="mlabel ceil"
            style={{ right: `calc(${((W - CEIL_X) / W) * 100}% + 8px)`, bottom: `calc(${(CEIL / VH) * 100}% - 13px)` }}
          >
            {COPY.meter.at12}
          </span>
        )}
        {/* Beat two names what the 39th person adds, not the total: the increments are the picture now. */}
        <Label
          i={39}
          text={worse ? (phone ? COPY.meter.at39AddShort : COPY.meter.at39Add) : phone ? COPY.meter.at39Short : COPY.meter.at39}
          phone={phone}
          upp={upp}
          ceilLabel={!compact}
          key={worse ? 'at39-add' : 'at39'}
          className={worse ? 'swapin' : ''}
        />
        {showNext ? (
          <Label
            i={n + 1}
            text={nextText}
            phone={phone}
            upp={upp}
            lift={n + 1 >= 34 ? 24 : 0}
            ceilLabel={!compact}
            className="you next"
            key={`next-${n}`}
          />
        ) : (
          <Label i={n} text={youText} phone={phone} upp={upp} lift={near39 ? 24 : 0} ceilLabel={!compact} className="you" key={`you-${n}`} />
        )}
        {!phone && hover > 0 && hover !== n && !(showNext && hover === n + 1) && (
          <Label
            i={hover}
            text={`${hover === 40 ? '40+' : hover} ${peopleWord(hover)} · ${pathways(hover)} ${pathWord(hover)}`}
            phone={phone}
            upp={upp}
            lift={hover >= 34 ? 24 : 0}
            className="hov"
          />
        )}
      </div>
      <div className="maxis" aria-hidden="true">
        {(compact ? [1] : [1, 12, 15]).map((i) => (
          <span key={i} style={{ left: `${((barX(i) + barW / 2) / W) * 100}%` }}>
            {i}
          </span>
        ))}
        {compact && (
          <span className="maxis-ceil" style={{ left: `${((barX(12) + barW / 2) / W) * 100}%` }}>
            {COPY.meter.ceilShort}
          </span>
        )}
        <span className="maxis-end" style={{ right: `${((W - barX(40) - barW) / W) * 100}%` }}>
          40+ {COPY.meter.axisX}
        </span>
      </div>
      <div className="mspan" aria-hidden="true" style={{ marginLeft: `${(barX(15) / W) * 100}%`, marginRight: `${((W - barX(39) - barW) / W) * 100}%` }}>
        <span>{COPY.meter.graveyardSpan}</span>
      </div>
      {/* A Graveyard visitor has just read this line as their verdict: keep its place, do not repeat it. */}
      <p
        className="mspan-line"
        aria-hidden={zoneId(n) === 'graveyard' || undefined}
        style={{
          ...(phone ? {} : { marginLeft: `${(barX(15) / W) * 100}%`, marginRight: `${((W - barX(39) - barW) / W) * 100}%` }),
          visibility: zoneId(n) === 'graveyard' ? 'hidden' : undefined,
        }}
      >
        <S>{COPY.meter.graveyardLine}</S>
      </p>
    </div>
  );
}

export function MeterSection({ phone }: { phone: boolean }) {
  const nNow = useStore((s) => s.n);
  const mine = useStore((s) => s.touched);
  // The meter is below the fold while the visitor dials: render it at low priority.
  const n = useDeferredValue(nNow);
  const rm = useReducedMotion();
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // Desktop: the stage is pinned for one screen of scroll; the second beat takes over 40% of the way in,
  // so both beats are read while the headline is in view.
  const passed = usePassed(sec, 0.4, !phone && !rm);
  const inView = useInView(stage, 0.4);
  const [phoneSwap, setPhoneSwap] = useState(false);

  useEffect(() => {
    if (!phone || rm || !inView || phoneSwap) return;
    const t = window.setTimeout(() => setPhoneSwap(true), 2500);
    return () => window.clearTimeout(t);
  }, [phone, rm, inView, phoneSwap]);

  const worse = rm ? false : phone ? phoneSwap : passed;
  return (
    <section id="meter" ref={sec} className={`meter-sec${rm ? ' is-static' : ''}`} aria-labelledby="meter-h">
      <div className="meter-stage" ref={stage}>
        {rm ? (
          <h2 id="meter-h" className="meter-line" tabIndex={-1}>
            <span className="block">{COPY.meter.breaks}</span>
            <span className="block">{COPY.meter.worse}</span>
          </h2>
        ) : (
          <h2 id="meter-h" className="meter-line" tabIndex={-1}>
            <Swap text={worse ? COPY.meter.worse : COPY.meter.breaks} outMs={140} inMs={280} />
          </h2>
        )}
        <Meter n={n} rise={inView} phone={phone} worse={worse} mine={mine} />
        <p className="meter-cap">
          <S>{COPY.meter.caption}</S>
        </p>
      </div>
    </section>
  );
}
