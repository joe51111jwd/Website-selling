// The hand-off from the hero into One Day (desktop; HERO_SPEC §8). Scroll-linked, on native
// scroll, reversible: every frame is a pure function of the scroll position, so scrolling back up
// plays it backwards. Hero progress p = scrollY / (0.8 × viewport height).
//
//   0    → 0.35  the hero's copy (eyebrow, the headline's other lines, sub, button row, small
//                print, logos, scroll cue) rises 40 px and fades; the tag and ER / JL fade
//   0.10 → 0.60  MB's "6:42" becomes One Day's big time: a copy of One Day's own odometer, scaled
//                down onto the stamp, grows and flies onto the real one (" AM" from 0.45); at 0.60
//                the real odometer takes over on the same frame, in the same place (type to type)
//   0.15 → 0.70  the fence leaves the words: it lifts (scale + a soft shadow), then its six stakes
//                travel onto a hexagon round the crew phone's Clock In button, projected through
//                the Stage onto the 3D iPhone's screen; it closes solid at 0.70 (one ping) and
//                rides the phone until the finger lands (One Day's tap), then rings out and goes
//   0.30 → 0.50  the fenced words fade, so the fence is seen to leave them
//   0    → 0.70  the devices rise from the hero-park pose into the clock-in shot (./poses.ts: the
//                docked keys); the contours drift up at half speed and fade
//
// The time travels in page space (it and its target scroll with the page, so native and smooth
// scrolling can never shear them apart); the fence is a fixed layer drawn on the Stage's own frame
// (onStageFrame), so it lands on exactly the phone that frame drew. Without the Stage (not loaded
// yet, no WebGL) the fence lifts off and fades instead. Reduced motion: no hand-off at all (the
// hero simply scrolls away; One Day's poses keep their own ring on the button).
//
// Layout is read on start, on every hero (re)layout and when fonts land, never while scrolling.

import { getHeroTargets, heroLand, onHeroLayout, type Pt } from "../hero/fence/opening";
import { setHeroCtaFaded } from "../shell/heroCta";
import { polyPoints } from "../hero/fence/geom";
import { onStageFrame, onStatus, sceneProgress, status, type StageFrame } from "../../three/stage/store";
import { B, DAY_STEPS } from "./clock";
import { CLOCK_IN_FENCE } from "./ring";

/** The beats, in hero progress (see above). */
export const HO = {
  /** p = scrollY / (dist × viewport height) */
  dist: 0.8,
  rise: [0, 0.35],
  /** the tag and its tape fade first (the tape is tied to the stake that is about to lift) */
  tag: [0, 0.2],
  mb: [0.15, 0.4],
  words: [0.3, 0.5],
  time: [0.1, 0.6],
  /** the stamp and its copy cross over (same face, same size: hides a sub-pixel difference) */
  take: [0.1, 0.13],
  am: [0.45, 0.6],
  lift: [0.15, 0.25],
  fence: [0.25, 0.7],
  close: [0.6, 0.7],
  stakes: [0.25, 0.45],
  ground: [0.1, 0.8],
  /** the devices are in their clock-in shot (./poses.ts docks them there) */
  devices: 0.7,
} as const;

/** Where the docked clock-in keys sit, in viewport heights before One Day's top (./poses.ts). */
export const HO_DOCK_OFFSET = HO.devices * HO.dist - 1;

/** The fence round the phone's Clock In button (native px of phone-home), where this one lands. */
const TARGET: Pt[] = CLOCK_IN_FENCE;
/** One Day's tap on moment 0 (phase of the moment): the fence rings out as the finger lands. */
const OUT: [number, number] = [B.tap - 0.012, B.tap + 0.035];

export type HandoffEls = {
  /** page-space layer (absolute, in <body>) and the flying copy of the odometer in it */
  time: HTMLElement;
  timeP: HTMLElement;
  /** the fixed fence layer and its parts */
  svg: SVGSVGElement;
  shadow: SVGPolygonElement;
  fill: SVGPolygonElement;
  line: SVGPolygonElement;
  ping: SVGPolygonElement;
  stakes: SVGCircleElement[];
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (v: number, [a, b]: readonly [number, number]) => clamp01((v - a) / (b - a));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out3 = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const r1 = (n: number) => Math.round(n * 10) / 10;

type HeroEls = {
  root: HTMLElement;
  rise: HTMLElement[];
  tag: HTMLElement[];
  crew: HTMLElement[];
  mb: HTMLElement | null;
  words: HTMLElement[];
  ground: HTMLElement | null;
  act: HTMLElement | null;
  stamp: HTMLElement | null;
  fence: HTMLElement[];
};

type Geo = {
  /** the hero's fence, page px */
  fence: Pt[];
  /** MB's stamp, page px */
  stamp: { x: number; y: number; w: number; h: number };
  /** the flyer's digits ("6:42", no " AM") inside it (px from its own origin, unscaled) */
  dL: number;
  dT: number;
  dW: number;
  dH: number;
  /** where the flyer's origin sits when it coincides with the real odometer (page px) */
  ox: number;
  oy: number;
  /** the stamp's size against the odometer's (same face: the glyphs match at this scale) */
  s0: number;
};

/** Inline styles the hand-off writes on the hero, restored exactly when it lets go. */
class Styler {
  private orig = new Map<HTMLElement, Map<string, string>>();
  set(el: HTMLElement | null, prop: string, v: string | null) {
    if (!el) return;
    let o = this.orig.get(el);
    if (!o) this.orig.set(el, (o = new Map()));
    if (!o.has(prop)) o.set(prop, el.style.getPropertyValue(prop));
    const next = v ?? o.get(prop)!;
    if (el.style.getPropertyValue(prop) !== next) {
      if (next) el.style.setProperty(prop, next);
      else el.style.removeProperty(prop);
    }
  }
  restore() {
    this.orig.forEach((o, el) =>
      o.forEach((v, prop) => {
        if (v) el.style.setProperty(prop, v);
        else el.style.removeProperty(prop);
      }),
    );
    this.orig.clear();
  }
}

export function startHandoff(els: HandoffEls): () => void {
  let alive = true;
  const st = new Styler();
  let hero: HeroEls | null = null;
  let G: Geo | null = null;
  let odo: HTMLElement | null = null;
  let lastP = -1;
  let pinged = false;
  const suffix = () => els.timeP.querySelector<HTMLElement>(".day-odo-suffix");

  function queryHero(): HeroEls | null {
    const root = document.querySelector<HTMLElement>("#top .hf-root");
    if (!root || root.classList.contains("hf--phone")) return null;
    const q = (s: string) => root.querySelector<HTMLElement>(s);
    const qa = (s: string) => [...root.querySelectorAll<HTMLElement>(s)];
    return {
      root,
      rise: [...qa(".hf-eyebrow, .hf-line:not(.hf-line--fence), .hf-chip, .hf-sub, .hf-act, .hf-micro, .hf-foot"), ...qa(".hf-ring, .hf-ring-s, .hf-ring-p")],
      tag: qa(".hf-tag, .hf-tag-note, .hf-tape"),
      crew: qa('.hf-mk:not([data-id="mb"])'),
      mb: q('.hf-mk[data-id="mb"]'),
      words: qa(".hf-line--fence"),
      ground: q(".hf-ground"),
      act: q(".hf-act"),
      stamp: q('.hf-stamp[data-id="mb"]'),
      fence: qa(".hf-fence, .hf-pulse"),
    };
  }

  /** Read the layout (never while scrolling): the hero's fence and stamp, the odometer's spot. */
  function measure() {
    if (!alive) return;
    // let go of the hero first: its boxes are read at rest
    st.restore();
    lastP = -1;
    hero = queryHero();
    odo = document.querySelector<HTMLElement>("#day .day-time");
    const t = getHeroTargets();
    const section = document.getElementById("day");
    const stage = odo?.closest<HTMLElement>(".scene-stage");
    if (!hero || !t || t.phone || !t.stamp || !odo || !section || !stage) {
      G = null;
      update(window.scrollY, null);
      return;
    }
    const sy = window.scrollY;
    // the copy is as wide as the real one (its line is absolutely placed in a clipping box)
    els.time.style.width = `${odo.offsetWidth}px`;
    // the flyer's own geometry, untransformed
    const prev = els.time.style.transform;
    els.time.style.transform = "none";
    const wr = els.time.getBoundingClientRect();
    const fp = els.timeP.getBoundingClientRect();
    const runs = [...els.timeP.querySelectorAll<HTMLElement>(".day-odo-wheel, .day-odo-colon")].map((e) => e.getBoundingClientRect());
    els.time.style.transform = prev;
    if (!runs.length) {
      G = null;
      return;
    }
    const l = Math.min(...runs.map((r) => r.left));
    const r = Math.max(...runs.map((r) => r.right));
    const top = Math.min(...runs.map((r) => r.top));
    const bot = Math.max(...runs.map((r) => r.bottom));
    // the real odometer where it sits before One Day pins (its sticky stage scrolls with the page
    // until then; the time lands at p = 0.6, well before)
    const op = odo.getBoundingClientRect();
    const secTop = section.getBoundingClientRect().top + sy;
    const odoTop = secTop + (op.top - stage.getBoundingClientRect().top);
    G = {
      fence: t.fence.map(([x, y]) => [x, y + sy] as Pt),
      stamp: { x: t.stamp.x, y: t.stamp.y + sy, w: t.stamp.w, h: t.stamp.h },
      dL: l - wr.left,
      dT: top - wr.top,
      dW: r - l,
      dH: bot - top,
      ox: op.left - (fp.left - wr.left),
      oy: odoTop - (fp.top - wr.top),
      s0: (parseFloat(getComputedStyle(hero.stamp ?? els.timeP).fontSize) || 15) / (parseFloat(getComputedStyle(els.timeP).fontSize) || 100),
    };
    update(window.scrollY, null);
  }

  // ── the hero and the time (page space; a function of the raw scroll) ──
  function heroAndTime(p: number, s: number) {
    if (p === lastP) return;
    lastP = p;
    const H = hero;
    if (H) {
      // the entrance lands the moment the visitor starts scrolling it away
      if (p > 0.02) heroLand();
      const rise = inOut(seg(p, HO.rise));
      const o = (v: number) => (v >= 0.999 ? null : v.toFixed(3));
      for (const el of H.rise) {
        // the button's own fence (hover / focus) rides with the button row, its opacity stays CSS's
        if (!el.classList.contains("hf-svgl")) st.set(el, "opacity", o(1 - rise));
        st.set(el, "translate", rise > 0.0005 ? `0 ${r1(-40 * rise)}px` : null);
      }
      st.set(H.act, "pointer-events", rise > 0.6 ? "none" : null);
      // the header's button takes over as soon as the hero's has faded (never a beat without one)
      setHeroCtaFaded(rise > 0.5);
      H.root.classList.toggle("ho-out", rise > 0.15);
      const tag = 1 - out3(seg(p, HO.tag));
      for (const el of H.tag) st.set(el, "opacity", o(tag));
      for (const el of H.crew) st.set(el, "opacity", o(1 - rise));
      st.set(H.mb, "opacity", o(1 - inOut(seg(p, HO.mb))));
      const words = 1 - inOut(seg(p, HO.words));
      for (const el of H.words) st.set(el, "opacity", o(words));
      // the contours drift up at half the scroll speed, and fade
      st.set(H.ground, "translate", s > 0 ? `0 ${r1(0.5 * Math.min(s, window.innerHeight))}px` : null);
      st.set(H.ground, "opacity", o(1 - inOut(seg(p, HO.ground))));
      const take = G ? seg(p, HO.take) : 0;
      st.set(H.stamp, "opacity", take > 0 && take < 1 ? (1 - take).toFixed(3) : null);
      st.set(H.stamp, "visibility", take >= 1 ? "hidden" : null);
      for (const el of H.fence) st.set(el, "visibility", p >= HO.lift[0] && G ? "hidden" : null);
    }

    // the time: the stamp's "6:42" grows into One Day's odometer
    const flying = !!G && p >= HO.time[0] && p < HO.time[1];
    if (odo) st.set(odo, "visibility", G && p < HO.time[1] ? "hidden" : null);
    els.time.style.visibility = flying ? "visible" : "hidden";
    if (flying && G) {
      const e = inOut(seg(p, HO.time));
      const sc = lerp(G.s0, 1, e);
      // the digits' left edge and their vertical centre travel in a straight line
      const x = lerp(G.stamp.x, G.ox + G.dL, e);
      const yc = lerp(G.stamp.y + G.stamp.h / 2, G.oy + G.dT + G.dH / 2, e);
      const tx = x - sc * G.dL;
      const ty = yc - sc * (G.dT + G.dH / 2);
      els.time.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
      // the stamp is set in the time's face at --ink-2; it darkens to the odometer's ink
      els.time.style.color = `color-mix(in srgb, var(--ink) ${Math.round(e * 100)}%, var(--ink-2))`;
      els.time.style.opacity = seg(p, HO.take).toFixed(3);
      const am = suffix();
      if (am) am.style.opacity = seg(p, HO.am).toFixed(3);
    }
  }

  // ── the fence (fixed; on the Stage's frame when there is one) ──
  const pts: Pt[] = TARGET.map(() => [0, 0]);
  let lastTgt: Pt[] | null = null;
  function fence(s: number, f: StageFrame | null) {
    const svg = els.svg;
    const p = clamp01(s / (HO.dist * window.innerHeight));
    // moment 0's phase, on the same (smoothed) scroll One Day's tap uses
    const ph = sceneProgress("day", f ? f.y : s) * DAY_STEPS;
    const gone = seg(ph, OUT);
    if (!G || p < HO.lift[0] || gone >= 1 || ph >= 1) {
      if (svg.style.visibility !== "hidden") svg.style.visibility = "hidden";
      if (p < HO.close[1]) pinged = false;
      return;
    }
    let tgt: Pt[] | null = null;
    lastTgt = null;
    if (f && f.visible("iphone")) {
      tgt = [];
      for (const [x, y] of TARGET) {
        const q = f.project("iphone", x, y);
        if (!q) {
          tgt = null;
          break;
        }
        tgt.push([q.x, q.y]);
      }
    }
    lastTgt = tgt;
    const lift = out3(seg(p, HO.lift));
    const t = tgt ? inOut(seg(p, HO.fence)) : 0;
    const close = tgt ? seg(p, HO.close) : 0;
    // without the Stage, the fence lifts off the words and fades
    let alpha = tgt ? 1 : 1 - seg(p, [0.25, 0.5]);
    alpha *= 1 - out3(gone);
    let cx = 0;
    let cy = 0;
    G.fence.forEach(([x, y], i) => {
      const a: Pt = [x, y - s];
      const b = tgt ? tgt[i] : a;
      pts[i][0] = lerp(a[0], b[0], t);
      pts[i][1] = lerp(a[1], b[1], t);
      cx += pts[i][0] / 6;
      cy += pts[i][1] / 6;
    });
    // lifted while it travels, settled on the phone; it rings out as the finger lands
    const up = lift * (1 - t);
    const k = 1 + 0.04 * up + 0.28 * out3(gone);
    for (const q of pts) {
      q[0] = cx + (q[0] - cx) * k;
      q[1] = cy + (q[1] - cy) * k;
    }
    const P = polyPoints(pts);
    if (svg.style.visibility !== "visible") svg.style.visibility = "visible";
    svg.style.opacity = alpha.toFixed(3);
    els.line.setAttribute("points", P);
    els.fill.setAttribute("points", P);
    els.ping.setAttribute("points", P);
    els.ping.style.transformOrigin = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
    els.line.setAttribute("stroke-dasharray", close >= 1 ? "none" : `10 ${(7 * (1 - close)).toFixed(2)}`);
    els.line.setAttribute("stroke-width", (2 + 0.4 * close).toFixed(2));
    els.fill.setAttribute("fill-opacity", (0.07 * close).toFixed(3));
    els.shadow.setAttribute("points", polyPoints(pts.map(([x, y]) => [x, y + 5 * up] as Pt)));
    els.shadow.style.opacity = (0.9 * up).toFixed(3);
    const so = 1 - seg(p, HO.stakes);
    els.stakes.forEach((c, i) => {
      c.setAttribute("cx", pts[i][0].toFixed(1));
      c.setAttribute("cy", pts[i][1].toFixed(1));
      c.style.opacity = so.toFixed(3);
    });
    // closed: one ping, the "clocked in" moment (forward only; scrolling back re-arms it)
    if (close >= 1 && !pinged && gone <= 0) {
      pinged = true;
      els.ping.classList.remove("is-on");
      requestAnimationFrame(() => els.ping.classList.add("is-on"));
    } else if (close < 1) {
      pinged = false;
      els.ping.classList.remove("is-on");
    }
  }

  function update(s: number, f: StageFrame | null) {
    if (!alive) return;
    const p = clamp01(s / (HO.dist * window.innerHeight));
    heroAndTime(p, s);
    // with the Stage drawing, the fence waits for its frame (the scroll invalidates one)
    if (f || !stageDraws()) fence(s, f);
  }
  const stageDraws = () => status.webgl && !status.failed && status.ready && status.revealed;

  // the scroll: the hero and the time at once; the fence too when the Stage isn't drawing
  let raf = 0;
  const onScroll = () => {
    if (!raf)
      raf = requestAnimationFrame(() => {
        raf = 0;
        update(window.scrollY, null);
      });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  const offFrame = onStageFrame((f) => {
    fence(window.scrollY, f);
    return false;
  });
  const offStatus = onStatus(onScroll);
  const offLayout = onHeroLayout(() => requestAnimationFrame(measure));
  const onFonts = () => requestAnimationFrame(measure);
  document.fonts?.addEventListener("loadingdone", onFonts);
  let rt = 0;
  const onResize = () => {
    clearTimeout(rt);
    rt = window.setTimeout(measure, 220);
  };
  window.addEventListener("resize", onResize);
  // the hero may already be laid out (its layout callback came before this mounted)
  const boot = requestAnimationFrame(measure);
  // ?hoDebug (captures and checks): the geometry and the fence's last points
  if (/[?&]hoDebug\b/.test(location.search))
    (window as unknown as { __ho: unknown }).__ho = { geo: () => G, fence: () => pts.map((q) => [...q]), target: () => lastTgt, measure };

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    cancelAnimationFrame(boot);
    clearTimeout(rt);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    document.fonts?.removeEventListener("loadingdone", onFonts);
    offFrame();
    offStatus();
    offLayout();
    st.restore();
    setHeroCtaFaded(false);
    hero?.root.classList.remove("ho-out");
    els.svg.style.visibility = "hidden";
    els.time.style.visibility = "hidden";
  };
}
