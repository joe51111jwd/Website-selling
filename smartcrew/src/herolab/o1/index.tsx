// O1 · "Clock in": the opening (scratchpad design/v2/opening/OPENING_BRIEF.md).
//
// The page opens on the crew's phone: Marcus Bell's SmartCrew app, standing inside the Hwy 9
// Culvert geofence. A finger taps Clock In, the button turns green ("Clocked in 6:42 AM") and his
// pin on the map gets the green clocked-in dot. Then ONE camera move: we push into the phone's map
// until its geofence is exactly the fence round the headline's phrase. The phone passes the camera
// and dissolves; the map's geofence never leaves the map, it just becomes the size of the words,
// which come up inside it; Marcus's pin walks to his place on the fence as the hero's MB marker.
// The hero (its API: src/site/hero/fence/opening.ts) masks the rest of the headline in round the
// fence and lands the sub and the orange button.
//
// The pieces the hero takes over are one element each, start to finish (no swap until they have
// landed, pixel for pixel):
//   - the geofence: one SVG in the hero's own coordinates (its points, its dash), scaled down onto
//     the map; two strokes crossfade during the move so the line stays ~2 px on screen at every scale;
//   - the phone rides the SAME transform (same keyframes and easing; the fence layer's start and the
//     phone's end are each other's inverse), so the fence stays painted on the map all the way; the
//     map's fence sits where the headline's will be, so the move is a pure push in (the small fence
//     grows inside the big one's box and never crosses a line of the headline);
//   - the six stakes and Marcus: their own elements on the same easing (the stakes ride the
//     fence's vertices exactly);
//   - the fenced words: copies of the hero's own spans (face, size, place), scaled with the fence.
// On the frame they land, the hero's own pieces show and this layer goes.
//
// Main thread: the phone and its map (~100 elements and one 11 KB image) are rendered at boot,
// transparent, on their own layer, so their style and layout are done before the first frame;
// "play" only adds the 17 flying pieces, sets a few inline styles and starts WAAPI animations
// (transform and opacity, on the compositor). No rAF.
// The hero's own copies of the flying pieces are held with inline `visibility` (no class on <html>,
// which would restyle the page mid-move); the layer's unmount waits for an idle moment.
//
// Rules kept: warm ground from the first frame; real UI (./screen.tsx); any input (pointer, key,
// wheel, touch, scroll, resize) skips to the end state at once; once per session; reduced motion:
// no opening (the gate in ./dev.html never sets it up).
//
// ?o1Debug (with ?heroDebug): the timeline is built paused; window.__o1.seek(ms) renders the frame
// at `ms` (opening and hero together), for frame-by-frame captures.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { PhoneFrame } from "../../site/phone/PhoneFrame";
import { PHONE_QUERY } from "../../site/phone";
import { heroEnter, whenHeroLaid, type HeroEnterOpts, type HeroTargets, type Pt } from "../../site/hero/fence/opening";
import { BTN, ClockScreen, GEO, INITIALS, MAP, MAP_PAD, MAP_SRC } from "./screen";
import "./o1.css";

// ── timing (ms from the opening's first frame) ─────────────────────────────────────────

export const O1 = {
  /** the phone settles in */
  in: 400,
  /** the finger comes down on Clock In (it touches ~170 ms later) */
  tap: 130,
  /** the button turns green, Marcus's pin clocks in */
  on: 300,
  /** the camera move starts */
  fly: 460,
  /** and lasts */
  dur: 640,
  /** the hero's entrance starts this long after the move does (the phone's body has gone by the
   * time the headline's lines show) … */
  enter: 130,
  /** … this far into its own beats (HERO_BEATS), at this speed */
  at: 0,
  speed: 1.2,
  /** the orange button lands this long after the hero enters (ahead of its own beat, 500 ms at
   * this speed: the button is the point of the page, and it must be up by 2 s) */
  cta: 70,
};
const LAND = O1.fly + O1.dur;

const EO = "cubic-bezier(0.22, 1, 0.36, 1)";
const EPOP = "cubic-bezier(0.34, 1.5, 0.64, 1)";
/** the camera: eases in (the push), then a long settle onto the words */
const ECAM = "cubic-bezier(0.5, 0, 0.16, 1)";

const DEBUG = typeof location !== "undefined" && /[?&]o1Debug\b/.test(location.search);
const html = () => document.documentElement;
export const o1On = () => typeof document !== "undefined" && html().classList.contains("o1-on");

// ── geometry ───────────────────────────────────────────────────────────────────────────

type Box = { x: number; y: number; w: number; h: number };
type Device = { W: number; H: number; phone: boolean; box: Box; u: number };

/** The phone's place: a function of the viewport only (so it can be laid out at boot). */
function device(): Device {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const phone = window.matchMedia(PHONE_QUERY).matches;
  const v = parseFloat(getComputedStyle(html()).getPropertyValue("--header-h"));
  const hh = Number.isFinite(v) && v > 0 ? v : phone ? 56 : 64;
  // real proportions (430 × 900 body); desktop as big as the screen allows (crisp, readable),
  // phones ~70 % of the height so it still reads as a phone, not as the page; high, right under
  // the header, so the map (the top of the screen) is about where the headline's phrase will be
  const ph = phone ? Math.round(Math.min(H * 0.74, (W - 40) * (900 / 430))) : Math.round(Math.min(H - hh - 22, 640));
  const pw = (ph * 430) / 900;
  return { W, H, phone, box: { x: (W - pw) / 2, y: hh + 4, w: pw, h: ph }, u: pw / 430 };
}

type Word = { text: string; style: CSSProperties };
export type Plan = Device & {
  t: HeroTargets;
  /** the fence layer's start: hero coords → the map (p ↦ s0·p + t0) */
  s0: number;
  t0: Pt;
  /** the fence's centre at rest, and on the map */
  c1: Pt;
  c0: Pt;
  /** the map's fence centre, native screen y */
  geoY: number;
  /** Marcus: on the map (centre, scale), and at rest (centre) */
  mb0: Pt;
  mbS: number;
  mb1: Pt;
  words: Word[];
};

export function makePlan(d: Device, t: HeroTargets): Plan {
  const { box, u } = d;
  // native screen px → viewport px (the screen sits 14 × 13 units inside the 430 × 900 body)
  const X = (x: number) => box.x + (14 + x) * u;
  const Y = (y: number) => box.y + (13 + y) * u;

  // the hero's fence, and the same shape on the map (uniformly scaled: it IS the same fence)
  const xs = t.fence.map((p) => p[0]);
  const ys = t.fence.map((p) => p[1]);
  const fw = Math.max(...xs) - Math.min(...xs);
  const fh = Math.max(...ys) - Math.min(...ys);
  const c1: Pt = [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2];
  const s0 = Math.min(GEO.maxW / fw, GEO.maxH / fh) * u;
  // the map's fence where the headline's will be: the camera's move is a pure push in
  const geoY = Math.max(GEO.minY, Math.min(GEO.maxY, (c1[1] - box.y) / u - 13));
  const c0: Pt = [X(GEO.cx), Y(geoY)];
  const t0: Pt = [c0[0] - s0 * c1[0], c0[1] - s0 * c1[1]];
  const onMap = (p: Pt): Pt => [t0[0] + s0 * p[0], t0[1] + s0 * p[1]];

  // Marcus: at rest just inside the fence's right point. On the map he stands on the same spot of
  // the (smaller) fence, as a pin sized to fit the fence's point there (so the words, when they come
  // up inside it, never run under him); only if that would be too small is he moved in a little
  const mb1 = t.markers.mb!.at;
  const [, tr2, pt3, br4] = [t.fence[1], t.fence[2], t.fence[3], t.fence[4]];
  const edge = (a: Pt, b: Pt, x: number) => a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0] || 1);
  const xIn = Math.min(Math.max(mb1[0], tr2[0]), pt3[0] - 1);
  const half = ((edge(br4, pt3, xIn) - edge(tr2, pt3, xIn)) / 2) * s0;
  // (and clear of the words' end: at rest he stands `gap` px past it; his radius grows from mbS·13
  // to 13 while the gap grows from s0·gap, on the same easing, so clear at the start is clear throughout)
  const gap = mb1[0] - (t.words.x + t.words.w);
  const fit = Math.min((half - 2.5) / 13, (gap * s0 - 1.5) / 13);
  const mbS = Math.max(0.5, Math.min(d.phone ? 0.82 : 0.86, fit));
  const mb0: Pt = onMap(mb1);

  // the fenced words: copies of the hero's own spans (same face, size and place)
  const words: Word[] = [...document.querySelectorAll<HTMLElement>(".hf-root .hf-fenced")].map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: el.textContent ?? "",
      style: {
        left: r.left,
        top: r.top,
        height: r.height,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight as CSSProperties["fontWeight"],
        fontStretch: cs.fontStretch,
        letterSpacing: cs.letterSpacing,
        wordSpacing: cs.wordSpacing,
        lineHeight: cs.lineHeight,
        fontKerning: cs.fontKerning as CSSProperties["fontKerning"],
        fontFeatureSettings: cs.fontFeatureSettings,
        fontVariationSettings: cs.fontVariationSettings,
        color: cs.color,
      },
    };
  });
  return { ...d, t, s0, t0, c1, c0, geoY, mb0, mbS, mb1, words };
}

const fmt = (n: number) => n.toFixed(2);
const tr = (p: Pt) => `translate(${fmt(p[0])}px, ${fmt(p[1])}px)`;
const points = (ps: Pt[]) => ps.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(" ");

// ── the timeline: WAAPI only, one clock ────────────────────────────────────────────────

class Tl {
  anims: Animation[] = [];
  add(el: Element | null | undefined, kf: Keyframe[], at: number, dur: number, easing = EO, fill: FillMode = "both") {
    if (!el) return null;
    const a = el.animate(kf, { delay: at, duration: Math.max(1, dur), easing, fill });
    this.anims.push(a);
    return a;
  }
  /** a cue on the animation clock (a target-less effect): it fires on a frame, in step with the motion */
  cue(at: number, f: () => void) {
    const a = new Animation(new KeyframeEffect(null, [], { duration: Math.max(1, at) }), document.timeline);
    a.onfinish = f;
    a.play();
    this.anims.push(a);
  }
  seek(ms: number) {
    for (const a of this.anims) {
      a.pause();
      a.currentTime = ms;
    }
  }
  cancel() {
    for (const a of this.anims) a.cancel();
    this.anims = [];
  }
}

/** Everything given: the hero's rest state on one frame (a skip before the hand-off). */
const ALL_GIVEN: HeroEnterOpts = {
  ground: "given",
  h1: "given",
  words: "given",
  fence: "given",
  markers: "given",
  stamp: "given",
  tag: "given",
  sub: "given",
  cta: "given",
  foot: "given",
  ctaFence: false,
  roll: false,
};

/** The hand-off: the fence, the words and Marcus are ours until they land; the hero plays the rest. */
const HANDOFF: HeroEnterOpts = { fence: "given", words: "given", markers: { mb: "given" }, stamp: "play", at: O1.at, speed: O1.speed };

/** The hero's own copies of the pieces in flight: held hidden (inline, no page-wide restyle) until they land. */
function hold(on: boolean) {
  const v = on ? "hidden" : "";
  document.querySelectorAll<HTMLElement>('.hf-root .hf-fence, .hf-root .hf-fenced, .hf-root .hf-mk[data-id="mb"], .hf-root .hf-stamp[data-id="mb"]').forEach((el) => (el.style.visibility = v));
}

/** the map's snapshot, fetched and decoded from the start (it is on the first frame) */
const mapReady: Promise<void> =
  typeof Image !== "undefined" && o1On()
    ? (() => {
        const img = new Image();
        img.src = MAP_SRC;
        return img.decode().catch(() => undefined);
      })()
    : Promise.resolve();

const idle = (f: () => void) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(f, { timeout: 1500 }) : window.setTimeout(f, 300));

type Phase = "wait" | "play" | "done";

export function Opening() {
  const [phase, setPhase] = useState<Phase>(() => (o1On() ? "wait" : "done"));
  // the phone's place is known at boot; it is laid out (hidden) with the first render
  const [dev] = useState<Device | null>(() => (o1On() ? device() : null));
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sys, setSys] = useState(false);

  // wait for the hero to be laid out (its targets) and the app's face, never long
  useEffect(() => {
    if (phase !== "wait" || !dev) return;
    let dead = false;
    const giveUp = () => {
      dead = true;
      void heroEnter();
      html().classList.remove("o1-on", "has-opening");
      setPhase("done");
    };
    // no hero after this long (a very slow boot): no opening, the hero enters on its own
    const give = window.setTimeout(() => !dead && giveUp(), 2600);
    // the visitor is already using the page, or the window changed: no opening
    const early = () => !dead && (clearTimeout(give), giveUp());
    const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "resize"] as const;
    EVENTS.forEach((e) => window.addEventListener(e, early, { passive: true, capture: true }));
    whenHeroLaid().then(async (t) => {
      if (dead) return;
      performance.mark("o1:laid");
      // the app's face (Inter): a moment for it, else the system face (never a swap mid-play)
      const inter = document.fonts ? document.fonts.load('600 30px "Inter Variable"').then((f) => f.length > 0) : Promise.resolve(true);
      const [ok] = await Promise.all([
        Promise.race([inter, new Promise<boolean>((r) => setTimeout(() => r(false), 260))]),
        Promise.race([mapReady, new Promise<void>((r) => setTimeout(r, 260))]),
      ]);
      if (dead) return;
      performance.mark("o1:ready");
      clearTimeout(give);
      // opened scrolled (a restored position), or nothing to fly: the hero's own entrance
      if (window.scrollY > 2 || !t.markers.mb || t.phone !== dev.phone) return giveUp();
      dead = true;
      setSys(!ok);
      setPlan(makePlan(dev, t));
      setPhase("play");
    });
    return () => {
      dead = true;
      clearTimeout(give);
      EVENTS.forEach((e) => window.removeEventListener(e, early, { capture: true }));
    };
  }, [phase, dev]);

  if (phase === "done" || !dev) return null;
  return createPortal(<Stage dev={dev} plan={plan} sys={sys} onDone={() => setPhase("done")} />, document.body);
}

function Stage({ dev, plan, sys, onDone }: { dev: Device; plan: Plan | null; sys: boolean; onDone: () => void }) {
  const scene = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const { box, u, phone } = dev;

  useLayoutEffect(() => {
    if (!plan) return;
    const S = scene.current!;
    const F = front.current!;
    const { s0, t0, c0, c1, mb0, mbS, mb1, t, geoY } = plan;
    const q = <T extends Element = HTMLElement>(root: Element, s: string) => root.querySelector<T>(s);
    const qa = (root: Element, s: string) => [...root.querySelectorAll<HTMLElement>(s)];
    try {
      sessionStorage.setItem("sc-o1", "1");
    } catch {
      /* private mode: it plays again next time */
    }
    // the culvert into the map's fence (the map was laid out at boot, centred on it)
    q(S, ".o1-mapin")!.style.transform = `translateY(${fmt(geoY - (MAP.y + MAP.h / 2))}px)`;
    S.dataset.o1 = "play";
    performance.mark("o1:play");
    // the hero's own copies of the pieces we fly stay hidden until they land (it is hidden now anyway)
    hold(true);

    const tl = new Tl();
    const A = tl.add.bind(tl);
    let entered = false;
    let over = false;

    // 1 · the phone settles in (both layers, about the phone's centre, so the map's fence rides it)
    const origin = `${fmt(box.x + box.w / 2)}px ${fmt(box.y + box.h / 2)}px`;
    for (const L of [S, F]) {
      L.style.transformOrigin = origin;
      A(L, [{ transform: "translateY(14px) scale(0.97)" }, { transform: "none" }], 0, O1.in, EO);
    }
    A(S, [{ opacity: 0.4 }, { opacity: 1 }], 0, 180, "linear");
    A(F, [{ opacity: 0 }, { opacity: 1 }], 50, 200, "linear");

    // 2 · the tap: a finger comes down on Clock In, the button gives, an orange ripple rings out
    const touch = O1.tap + 170;
    A(q(S, ".o1-finger"), [
      { opacity: 0, transform: "translate(10px, 18px) scale(1.5)" },
      { opacity: 1, transform: "scale(0.86)", offset: 0.33 },
      { opacity: 1, transform: "scale(0.94)", offset: 0.6 },
      { opacity: 0, transform: "translate(4px, 10px) scale(1)" },
    ], O1.tap, 520, EO);
    A(q(S, ".o1-press"), [{ opacity: 0, transform: "scale(1)" }, { opacity: 1, transform: "scale(0.955)", offset: 0.4 }, { opacity: 0, transform: "scale(1)" }], touch - 40, 380, EO);
    A(q(S, ".o1-ripple"), [{ opacity: 0.95, transform: "scale(0.45)" }, { opacity: 0, transform: "scale(1.7)" }], touch, 700, EO);

    // 3 · clocked in: the button turns green; Marcus's pin gets the green dot; the fence closes solid once
    // (the green fills the black disc from its centre; the black goes once it is covered)
    A(q(S, ".o1-btn-on"), [{ opacity: 0, transform: "scale(0.7)" }, { opacity: 1, transform: "scale(0.95)", offset: 0.3 }, { opacity: 1, transform: "none" }], O1.on, 420, EPOP);
    A(q(S, ".o1-btn-off"), [{ opacity: 1 }, { opacity: 0 }], O1.on + 220, 60, "linear");
    const mk = q(F, ".o1-mk")!;
    A(q(mk, ".o1-mk-dot"), [{ opacity: 0, transform: "scale(0.3)" }, { opacity: 1, transform: "none" }], O1.on + 50, 340, EPOP);
    A(q(mk, ".o1-mk-ring"), [{ opacity: 0, transform: "scale(1)" }, { opacity: 1, transform: "scale(1.25)", offset: 0.3 }, { opacity: 0, transform: "scale(1.35)" }], O1.on + 30, 600, "ease-out");
    A(q(F, ".o1-solid"), [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], O1.on + 30, 520, "ease-out");

    // 4 · the camera: one move, the phone and the fence on the same transform (phone: identity →
    // the map's fence at the words; fence layer: the map → identity), so the fence never leaves the map
    const cam = q(S, ".o1-cam")!;
    const camEnd: Pt = [c1[0] - c0[0] / s0, c1[1] - c0[1] / s0];
    A(cam, [{ transform: "translate(0px, 0px) scale(1)" }, { transform: `${tr(camEnd)} scale(${fmt(1 / s0)})` }], O1.fly, O1.dur, ECAM);
    // the phone passes the camera: its body and its screen go first (the headline comes up where
    // they were), the map a beat later, under the fence, before the words are up inside it
    A(q(S, ".o1-phone"), [{ opacity: 1 }, { opacity: 0 }], O1.fly, 180, "cubic-bezier(0.3, 0, 0.6, 1)");
    A(q(S, ".o1-map"), [{ opacity: 1 }, { opacity: 1, offset: 0.12 }, { opacity: 0, offset: 0.58 }, { opacity: 0 }], O1.fly, O1.dur, "linear");
    const fly = q(F, ".o1-fly")!;
    A(fly, [{ transform: `${tr(t0)} scale(${fmt(s0)})` }, { transform: "translate(0px, 0px) scale(1)" }], O1.fly, O1.dur, ECAM);
    // the map's line (~2 px at the map's scale) hands over to the hero's (2 px at rest): one line
    A(q(F, ".o1-a"), [{ opacity: 1 }, { opacity: 1, offset: 0.08 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], O1.fly, O1.dur, "linear");
    A(q(F, ".o1-b"), [{ opacity: 0 }, { opacity: 0, offset: 0.1 }, { opacity: 1, offset: 0.52 }, { opacity: 1 }], O1.fly, O1.dur, "linear");
    A(q(F, ".o1-fill"), [{ opacity: 1 }, { opacity: 1, offset: 0.1 }, { opacity: 0, offset: 0.45 }, { opacity: 0 }], O1.fly, O1.dur, "linear");
    // the words come up inside the fence as the map goes
    for (const w of qa(F, ".o1-word")) A(w, [{ opacity: 0 }, { opacity: 0, offset: 0.12 }, { opacity: 1, offset: 0.42 }, { opacity: 1 }], O1.fly, O1.dur, "linear");
    // the stakes ride the vertices (same easing: the same path), from map dots to survey stakes
    qa(F, ".o1-stake").forEach((el, i) => {
      const p = t.fence[i];
      const p0: Pt = [t0[0] + s0 * p[0], t0[1] + s0 * p[1]];
      A(el, [{ transform: `${tr(p0)} scale(0.6)` }, { transform: `${tr(p)} scale(1)` }], O1.fly, O1.dur, ECAM);
    });
    // Marcus rides with the fence to its right point and becomes the hero's MB
    A(mk, [{ transform: `${tr([mb0[0] - 13, mb0[1] - 13])} scale(${mbS})` }, { transform: `${tr([mb1[0] - 13, mb1[1] - 13])} scale(1)` }], O1.fly, O1.dur, ECAM);

    // 5 · the hand-off: the hero starts its entrance just after the move does (the pieces we carry
    // stay held) and takes them over on the frame they land
    // the button (and its demo link) land early: our animations on the hero's own elements, created
    // after its entrance's, win while both run, and end where the hero's do (then they are dropped)
    const early: [Animation, number][] = [];
    const enterAt = O1.fly + O1.enter;
    const enter = () => {
      if (entered) return;
      entered = true;
      performance.mark("o1:enter");
      void heroEnter(HANDOFF);
      const wrap = document.querySelector(".hf-root .hf-cta-wrap");
      const demo = document.querySelector(".hf-root .hf-demo");
      const sub = document.querySelector(".hf-root .hf-sub");
      const chip = document.querySelector(".hf-root .hf-chip");
      const E = (el: Element | null, kf: Keyframe[], at: number, dur: number, easing: string) => {
        if (!el) return;
        const a = el.animate(kf, { delay: DEBUG ? 0 : at, duration: dur, easing, fill: "both" });
        if (DEBUG) a.pause();
        early.push([a, enterAt + at]);
      };
      E(wrap, [{ opacity: 0 }, { opacity: 1 }], O1.cta, 240, "linear");
      E(wrap, [{ transform: "translateY(16px)" }, { transform: "translateY(-1.5px)", offset: 0.55 }, { transform: "translateY(0.4px)", offset: 0.8 }, { transform: "none" }], O1.cta, 600, "cubic-bezier(0.3, 0.7, 0.4, 1)");
      E(demo, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], O1.cta + 90, 420, EO);
      // the sub (and the job chip on phones) close the gap above it right after
      E(sub, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], O1.cta + 60, 480, EO);
      if (chip && t.chip) E(chip, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], O1.cta + 120, 440, EO);
      // the hero's own have landed by ~1 s in (HERO_BEATS.cta[1], the chip's 1040 / speed): ours go then
      if (!DEBUG) window.setTimeout(() => early.forEach(([a]) => a.cancel()), 1300);
    };
    let tidy = 0;
    const land = () => {
      if (over) return;
      over = true;
      off();
      hold(false);
      // this layer goes on this frame (opacity: no restyle of its subtree); its DOM in the next idle
      // moment; the page's opening classes once the hero's entrance has played out (a class change on
      // <html> restyles the page: never in the middle of the entrance)
      for (const L of [S, F]) {
        L.getAnimations().forEach((a) => a.cancel());
        L.style.opacity = "0";
      }
      S.dataset.o1 = "gone";
      tidy = idle(() => {
        tl.cancel();
        onDone();
      });
      void heroEnter().then(() => idle(() => html().classList.remove("o1-on", "has-opening")));
    };

    // any input: straight to the end state
    const skip = () => {
      if (over) return;
      if (!entered) {
        entered = true;
        void heroEnter(ALL_GIVEN);
      } else {
        document.querySelector(".hf-root")?.getAnimations({ subtree: true }).forEach((a) => a.finish());
      }
      land();
    };
    const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll", "resize"] as const;
    EVENTS.forEach((e) => window.addEventListener(e, skip, { passive: true, capture: true }));
    const off = () => EVENTS.forEach((e) => window.removeEventListener(e, skip, { capture: true }));

    if (DEBUG) {
      tl.seek(0);
      const w = window as unknown as { __o1: unknown; __hero?: { seek: (ms: number) => void } };
      w.__o1 = {
        O1,
        LAND,
        plan,
        seek(ms: number) {
          if (over) return;
          tl.seek(ms);
          if (ms >= enterAt) {
            enter();
            w.__hero?.seek(O1.at + (ms - enterAt) * O1.speed);
            for (const [a, at0] of early) a.currentTime = Math.max(0, ms - at0);
          }
          const landed = ms >= LAND;
          hold(!landed);
          S.style.visibility = F.style.visibility = landed ? "hidden" : "";
          if (!landed) S.style.opacity = F.style.opacity = "";
        },
        skip,
      };
    } else {
      tl.cue(O1.fly + O1.enter, enter);
      tl.cue(LAND, land);
    }
    return () => {
      off();
      if (!over) tl.cancel();
      if (tidy && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(tidy);
    };
    // the plan is fixed for this opening (a resize skips)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  return (
    <>
      {/* the phone and its map, behind the page (the headline masks in over them as they go);
          laid out at boot, shown once the hero's targets are known */}
      <div className={`o1 o1-scene${phone ? " o1--phone" : ""}${sys ? " o1--sys" : ""}`} ref={scene} style={{ opacity: 0 }} aria-hidden="true">
        <div className="o1-cam">
          <div className="o1-phone" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
            <PhoneFrame screens={[]} shadow>
              <div className="o1-scrw" style={{ transform: `scale(${u})` }}>
                <ClockScreen />
                <div className="o1-tap" style={{ left: BTN.x, top: BTN.y, width: BTN.w, height: BTN.h }}>
                  <span className="o1-press" />
                  <span className="o1-ripple" />
                  <span className="o1-finger" />
                </div>
              </div>
            </PhoneFrame>
          </div>
          <div className="o1-map" style={{ left: box.x + (14 + MAP.x) * u, top: box.y + (13 + MAP.y) * u, width: MAP.w, height: MAP.h, transform: `scale(${u})` }}>
            <img className="o1-mapin" src={MAP_SRC} width={MAP.w} height={MAP.h + MAP_PAD * 2} style={{ top: -MAP_PAD }} alt="" decoding="async" draggable={false} />
          </div>
        </div>
      </div>
      {/* in front: the pieces the hero takes over (the map's geofence, its stakes, Marcus, the words) */}
      {plan && (
        <div className={`o1 o1-front${phone ? " o1--phone" : ""}`} ref={front} aria-hidden="true">
          <div className="o1-fly">
            <svg width={plan.W} height={plan.H} viewBox={`0 0 ${plan.W} ${plan.H}`}>
              <polygon className="o1-fill" points={points(plan.t.fence)} />
              <polygon className="o1-a" points={points(plan.t.fence)} style={{ strokeWidth: 1.9 / plan.s0, strokeDasharray: `${fmt(6.5 / plan.s0)} ${fmt(4.5 / plan.s0)}` }} />
              <polygon className="o1-solid" points={points(plan.t.fence)} style={{ strokeWidth: 2.6 / plan.s0 }} />
              <polygon className="o1-b" points={points(plan.t.fence)} />
            </svg>
            {plan.words.map((w, i) => (
              <span className="o1-word" key={i} style={w.style}>
                {w.text}
              </span>
            ))}
          </div>
          {plan.t.fence.map((_, i) => (
            <i className="o1-stake" key={i} />
          ))}
          <div className="o1-mk">
            <span>{INITIALS}</span>
            <i className="o1-mk-ring" />
            <i className="o1-mk-dot" />
          </div>
        </div>
      )}
    </>
  );
}
