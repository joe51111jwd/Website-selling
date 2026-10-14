// One Day's ground (RIDE_SHOTS §1): the map the ride walks across. A fixed layer under the Stage:
//
//  · the ground's colour: dawn → day → late afternoon → Friday night, interpolated across the whole
//    film (never flat inside a moment; the nightfall is its one fast change);
//  · the contour sheet: the page's topographic style (src/site/topo), drawn once off the main
//    thread at the size the walk needs, then only moved: one track on the film's clock walks it
//    opposite the camera (./ground.ts). At nightfall a light-ink copy crossfades in. A static mask
//    keeps the lines out from behind the copy;
//  · 9:20 AM: the haul road, drawn on the map itself (it walks with the ground): the truck drives
//    from the pit to the job while the camera tracks it.
//
// Its opacity follows the scroll (One Day's presence), as the page's ground hands over to it.

import { memo, useEffect, useRef, useState, type RefObject } from "react";
import { EASE, type Player, type TrackFrame } from "../player";
import { paintSheet } from "../topo/sheet";
import { dayPresence, luminance, readPalette, rgb, type RGB } from "./clock";
import { haulRoute, walkFrames } from "./ground";
import { RIDE, type Ride } from "./ride";
import { RIDE_COPY } from "./rideCopy";

/** The ground's colour stops (the palette's moments; the finale stays night). */
function groundStops(R: Ride) {
  const pal = readPalette();
  const st: { t: number; c: RGB }[] = [{ t: 0, c: pal.moments[0] }];
  R.moments.forEach((m, i) => {
    if (i === R.moments.length - 1) {
      // the nightfall: held until Friday's move, then fast
      st.push(
        { t: m.start, c: pal.moments[i - 1] },
        { t: m.settle, c: pal.moments[i] },
      );
    } else st.push({ t: m.settle, c: pal.moments[i] });
  });
  st.push({ t: R.duration, c: pal.moments[pal.moments.length - 1] });
  return st;
}

/** The ground's colour layers: each time of day's colour and when it fades in over the last. */
function tintWindows(R: Ride) {
  const pal = readPalette();
  const m = R.moments;
  const last = m.length - 1;
  return pal.moments.map((c, i) =>
    i === 0
      ? { c, a: 0, b: 0, night: false }
      : i === last
        ? { c, a: m[i].start, b: m[i].settle, night: true }
        : { c, a: m[i - 1].settle, b: m[i].settle, night: false },
  );
}
/** How many colour layers the ground stacks. */
const TINTS = 7;

/** The ground's colour at film time `t` (for the header and the bar, which take it on beats). */
export function groundAt(t: number, R: Ride = RIDE): RGB {
  const st = groundStops(R);
  let i = 0;
  while (i < st.length - 1 && st[i + 1].t <= t) i++;
  const a = st[i];
  const b = st[Math.min(st.length - 1, i + 1)];
  if (b === a || b.t <= a.t) return a.c;
  const k = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
  return a.c.map((v, j) => v + (b.c[j] - v) * k) as RGB;
}

/** The film time the ground turns dark (the copy's ink flips at the same moment). */
export const nightfallAt = (R: Ride = RIDE) => {
  const m = R.moments[R.moments.length - 1];
  return m.start + (m.settle - m.start) * 0.5;
};

type Geo = {
  L: number;
  T: number;
  Wv: number;
  Hv: number;
  w: number;
  h: number;
};

/** The sheet's place and size (% of the viewport) so the walk never shows its edge. */
function sheetGeo(R: Ride, vw: number, vh: number): Geo {
  const f = walkFrames(R, 250);
  let L = Infinity;
  let Rr = -Infinity;
  let T = Infinity;
  let B = -Infinity;
  for (const p of f) {
    L = Math.min(L, 50 - p.x - 50 / p.s);
    Rr = Math.max(Rr, 50 - p.x + 50 / p.s);
    T = Math.min(T, 50 - p.y - 50 / p.s);
    B = Math.max(B, 50 - p.y + 50 / p.s);
  }
  L -= 2;
  T -= 2;
  Rr += 2;
  B += 2;
  return {
    L,
    T,
    Wv: Rr - L,
    Hv: B - T,
    w: Math.round(((Rr - L) / 100) * vw),
    h: Math.round(((B - T) / 100) * vh),
  };
}

export const RideGround = memo(function RideGround({
  player: p,
  groundRef,
}: {
  player: Player;
  groundRef: RefObject<HTMLDivElement | null>;
}) {
  const R = RIDE;
  const sheet = useRef<HTMLDivElement>(null);
  const dayInk = useRef<HTMLCanvasElement>(null);
  const nightInk = useRef<HTMLCanvasElement>(null);
  const haul = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1440,
    h: typeof window !== "undefined" ? window.innerHeight : 900,
  }));
  const geo = sheetGeo(R, vp.w, vp.h);

  // the window's size (the sheet is repainted only when it changes by more than a little)
  useEffect(() => {
    let t = 0;
    const on = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        setVp((v) =>
          Math.abs(v.w - w) > 24 || Math.abs(v.h - h) > 24 ? { w, h } : v,
        );
      }, 300);
    };
    window.addEventListener("resize", on);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", on);
    };
  }, []);

  // paint the sheet, off the main thread, once the page is idle
  useEffect(() => {
    const a = dayInk.current;
    const b = nightInk.current;
    if (!a || !b) return;
    let gone = false;
    const scale = Math.min(window.devicePixelRatio || 1, 1.25);
    const go = () => {
      if (!gone)
        void paintSheet([a, b], ["day", "night"], geo.w, geo.h, scale).catch(
          (e) => console.warn("[day] contours failed", e),
        );
    };
    const idle = typeof requestIdleCallback === "function";
    const id = idle
      ? requestIdleCallback(go, { timeout: 2500 })
      : setTimeout(go, 600);
    return () => {
      gone = true;
      if (idle) cancelIdleCallback(id as number);
      else clearTimeout(id);
    };
  }, [geo.w, geo.h]);

  // the colour, the walk, the nightfall, the haul: tracks on the film's clock
  useEffect(() => {
    const g = groundRef.current;
    const s = sheet.current;
    const a = dayInk.current;
    const b = nightInk.current;
    const hl = haul.current;
    if (!g || !s || !a || !b || !hl) return;
    const offs: (() => void)[] = [];
    // the colour: a stack of flat layers, one per time of day, each fading in over the one before
    // (opacity only: the compositor blends them, nothing is repainted per frame)
    const tints = [...(g.querySelectorAll<HTMLElement>(".day-tint") ?? [])];
    tintWindows(R).forEach((w, k) => {
      const el = tints[k];
      if (!el) return;
      el.style.backgroundColor = rgb(w.c);
      if (k === 0) return;
      offs.push(
        p.track(el, [
          { t: 0, opacity: 0 },
          { t: w.a, opacity: 0, ease: w.night ? EASE.inOut : EASE.linear },
          { t: w.b, opacity: 1 },
        ]),
      );
    });
    offs.push(
      p.track(
        s,
        walkFrames(R, 100).map((f) => ({
          t: f.t,
          transform: `translate3d(${f.x.toFixed(3)}vw, ${f.y.toFixed(3)}vh, 0) scale(${f.s.toFixed(4)})`,
        })),
      ),
    );
    const m6 = R.moments[R.moments.length - 1];
    offs.push(
      p.track(a, [
        { t: 0, opacity: 1 },
        { t: m6.start, opacity: 1, ease: EASE.inOut },
        { t: m6.settle, opacity: 0 },
      ]),
    );
    offs.push(
      p.track(b, [
        { t: 0, opacity: 0 },
        { t: m6.start, opacity: 0, ease: EASE.inOut },
        { t: m6.settle, opacity: 1 },
      ]),
    );

    // the haul road: it draws itself ahead of the truck, the truck drives it, a ping on arrival
    const m2 = R.moments[2];
    const m3 = R.moments[3];
    const [d0, d1] = m2.at.drive;
    const route = hl.querySelector<SVGPathElement>(".day-haul-road");
    const truck = hl.querySelector<HTMLElement>(".day-haul-truck");
    const ping = hl.querySelector<HTMLElement>(".day-haul-ping");
    offs.push(
      p.track(hl, [
        { t: 0, opacity: 0 },
        { t: m2.start + 300, opacity: 0, ease: EASE.out },
        { t: m2.settle - 200, opacity: 1 },
        { t: m3.start, opacity: 1, ease: EASE.inOut },
        { t: m3.start + 600, opacity: 0 },
      ]),
    );
    if (route)
      offs.push(
        p.track(route, [
          { t: 0, strokeDashoffset: 1 },
          { t: d0 - 300, strokeDashoffset: 1, ease: EASE.inOut },
          { t: d1, strokeDashoffset: 0 },
        ]),
      );
    if (truck) {
      const pts = routePx(vp.w, vp.h);
      const fr: TrackFrame[] = [];
      const len = pts.reduce(
        (L, q, i) =>
          i ? L + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0,
        0,
      );
      const at = (d: number): [number, number] => {
        let acc = 0;
        for (let i = 1; i < pts.length; i++) {
          const seg = Math.hypot(
            pts[i][0] - pts[i - 1][0],
            pts[i][1] - pts[i - 1][1],
          );
          if (acc + seg >= d) {
            const k = (d - acc) / (seg || 1);
            return [
              pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k,
              pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k,
            ];
          }
          acc += seg;
        }
        return pts[pts.length - 1];
      };
      const inOut = (x: number) =>
        x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const N = 40;
      fr.push({
        t: 0,
        transform: `translate3d(${pts[0][0]}px, ${pts[0][1]}px, 0)`,
        opacity: 0,
      });
      fr.push({
        t: d0 - 260,
        transform: `translate3d(${pts[0][0]}px, ${pts[0][1]}px, 0)`,
        opacity: 0,
      });
      for (let k = 0; k <= N; k++) {
        const [x, y] = at(len * inOut(k / N));
        fr.push({
          t: d0 + ((d1 - d0) * k) / N,
          transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`,
          opacity: 1,
        });
      }
      offs.push(p.track(truck, fr));
    }
    if (ping)
      offs.push(
        p.track(ping, [
          { t: 0, opacity: 0, transform: "scale(0.4)" },
          {
            t: m2.at.arrive[0],
            opacity: 0.9,
            transform: "scale(0.4)",
            ease: EASE.out,
          },
          { t: m2.at.arrive[0] + 900, opacity: 0, transform: "scale(2.6)" },
        ]),
      );
    return () => offs.forEach((f) => f());
  }, [p, R, groundRef, vp.w, vp.h]);

  // a soft jump (the rail, ← →): the map dips with the film's DOM, so it never visibly snaps to
  // the new place on the walk
  useEffect(() => {
    let last: Animation | null = null;
    return p.on("fade", (o, ms) => {
      const el = sheet.current?.parentElement;
      if (!el) return;
      const from = last ? Number(getComputedStyle(el).opacity) : 1;
      last?.cancel();
      const an = el.animate([{ opacity: from }, { opacity: o }], {
        duration: ms,
        easing: EASE.inOut,
        fill: "forwards",
      });
      last = an;
      if (o === 1)
        an.onfinish = () => {
          an.cancel();
          if (last === an) last = null;
        };
    });
  }, [p]);

  // the presence (the scroll hands the page's ground over to One Day's) and the tone of the header
  // and the control bar (they take the ground's colour, and the dark tone after nightfall)
  useEffect(() => {
    const g = groundRef.current;
    if (!g) return;
    const root = document.documentElement;
    const night = nightfallAt(R);
    const tinted = () =>
      [
        document.querySelector<HTMLElement>(".site-header"),
        document.querySelector<HTMLElement>(".day-controls"),
      ].filter((x): x is HTMLElement => !!x);
    let ground = "";
    let tone = "";
    let bodyClear = false;
    let lastW = -1;
    let raf = 0;
    const setGround = (c: string) => {
      if (c === ground) return;
      ground = c;
      for (const e of tinted()) {
        if (c) e.style.setProperty("--page-ground", c);
        else e.style.removeProperty("--page-ground");
      }
    };
    const setTone = (t: string) => {
      if (t === tone) return;
      tone = t;
      if (t) root.dataset.ground = t;
      else root.removeAttribute("data-ground");
    };
    const apply = () => {
      raf = 0;
      const w = dayPresence(window.scrollY, window.innerHeight);
      if (Math.abs(w - lastW) > 0.002) {
        g.style.opacity = w.toFixed(3);
        lastW = w;
      }
      if (w > 0 && !bodyClear) {
        document.body.style.setProperty("background-color", "transparent");
        bodyClear = true;
      } else if (w <= 0 && bodyClear) {
        document.body.style.removeProperty("background-color");
        bodyClear = false;
      }
      if (w >= 0.5) {
        const t = p.time();
        const c = groundAt(t, R);
        setGround(rgb(c));
        setTone(t >= night || luminance(c) < 0.3 ? "dark" : "light");
      } else {
        setGround("");
        setTone("");
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const offBeat = p.on("beat", onScroll);
    return () => {
      offBeat();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      setGround("");
      setTone("");
      if (bodyClear) document.body.style.removeProperty("background-color");
    };
  }, [p, R, groundRef]);

  const route = routePx(vp.w, vp.h);
  const d = route
    .map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`)
    .join(" ");
  const A = route[0];
  const Z = route[route.length - 1];
  return (
    <>
      {Array.from({ length: TINTS }, (_, k) => (
        <div key={k} className="day-tint" />
      ))}
      <div className="day-topo" aria-hidden="true">
        <div
          className="day-topo-sheet"
          ref={sheet}
          style={{
            left: `${geo.L}vw`,
            top: `${geo.T}vh`,
            width: `${geo.Wv}vw`,
            height: `${geo.Hv}vh`,
            transformOrigin: `${50 - geo.L}vw ${50 - geo.T}vh`,
          }}
        >
          <canvas className="day-topo-ink" ref={dayInk} />
          <canvas className="day-topo-ink day-topo-ink--night" ref={nightInk} />
          <div
            className="day-haul"
            ref={haul}
            style={{ left: `${-geo.L}vw`, top: `${-geo.T}vh` }}
          >
            <svg
              className="day-haul-svg"
              width={vp.w}
              height={vp.h}
              viewBox={`0 0 ${vp.w} ${vp.h}`}
            >
              <path className="day-haul-case" d={d} />
              <path className="day-haul-road" d={d} pathLength={1} />
            </svg>
            <span
              className="day-haul-end"
              style={{ transform: `translate3d(${A[0]}px, ${A[1]}px, 0)` }}
            />
            <span
              className="day-haul-end day-haul-end--job"
              style={{ transform: `translate3d(${Z[0]}px, ${Z[1]}px, 0)` }}
            />
            <span className="day-haul-ping" style={{ left: Z[0], top: Z[1] }} />
            <span
              className="day-haul-label"
              style={{
                transform: `translate3d(${A[0] - 6}px, ${A[1] + 14}px, 0)`,
              }}
            >
              {RIDE_COPY.haulFrom}
            </span>
            <span
              className="day-haul-label day-haul-label--job"
              style={{
                transform: `translate3d(${Z[0] + 6}px, ${Z[1] - 30}px, 0) translateX(-100%)`,
              }}
            >
              {RIDE_COPY.haulTo}
            </span>
            <span className="day-haul-truck">
              <span className="day-haul-truck-dot" />
            </span>
          </div>
        </div>
      </div>
    </>
  );
});

/** The haul road in px of the sheet's frame (the viewport at the walk's origin). */
function routePx(w: number, h: number): [number, number][] {
  return haulRoute().pts.map((q) => [(q.x / 100) * w, (q.y / 100) * h]);
}
