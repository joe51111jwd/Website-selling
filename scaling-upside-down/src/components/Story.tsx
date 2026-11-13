import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import * as m from "motion/react-m";
import { FrameStore, fetchOk } from "../frames";
import { CALLOUTS, FOCUS_HERO, FOCUS_LINES, HERO_FRAME, INTRO_MS, LAST_SHOT, OPEN_P, STORY_VH, filmP, FOCUS_SPANS, focusAt, focusBox, focusHold, focusIndex, focusSpan, frameAt, introFrame, portraitFit, setHeroCap, sp, type FocusSide } from "../story";
import { FOCUS } from "../focus";
import { FOCUS_COPY, type Beat, type SiteCopy } from "../copy";
import { JoinLink } from "./JoinLink";
import HERO from "../hero.json";

type Anchors = { names: string[]; frames: Record<string, [number, number]>[] };

const STORY_ALT = "The Up, Side and Down blocks lie face up on a table, then stand up and stack. Blocks labelled with hires and tools are stacked on the Up, Side and Down blocks faster and faster until the tower falls over. Twelve painted system blocks widen the base into a three-colour foundation, the dead weight is cleared, and the same team is stacked back on it into a taller building that holds.";
const FOCUS_ALT = "The Up, Side and Down blocks lie face up on a table, then stand up and stack. Three planks go on top, reading from the top Always launching, Always hiring, Always adding; then more and more blocks, faster and crookeder, until the tower falls over. The Up, Side and Down stack turns upside down and is set right again. Twelve painted system blocks are set in from both sides into a three-colour foundation, the planks and the dead weight are cleared away, the six blocks that stayed go back on it, and new plain blocks rise from them into a taller building that holds.";
/** the focus version plays its own film (render/focus_film.py), opening with the same 89 pictures */
const FRAMES = FOCUS ? "frames-focus" : "frames";
const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// below this opacity a control is treated as gone: no clicks, no Tab stop
const shown = (o: number) => (o > 0.05 ? "visible" : "hidden");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** the story's progress past which the visitor has scrolled (home: a few pixels; it ends the opening) */
const MOVED = FOCUS ? OPEN_P * 0.62 : 0.0005;
const smooth01 = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
/** the hero's planks fade as the rush starts: their opacity at story progress v */
const heroShown = (v: number) => (v <= sp(0.02) ? 1 : v >= sp(0.045) ? 0 : 1 - (v - sp(0.02)) / (sp(0.045) - sp(0.02)));

/** focus: the book has the landing to itself; the picture comes in from behind the paper as it leaves */
const veilAt = (v: number) => (v <= FOCUS_HERO[1] ? 1 : Math.max(0, 1 - (v - FOCUS_HERO[1]) / (FOCUS_HERO[2] - FOCUS_HERO[1])));
/** focus, an upright screen: the picture's top and height (CSS px); the words go in the band under it */
const bandFit = (vh: number) => {
  const h = vh * 0.56;
  const top = Math.max(60, vh * 0.09);
  return { top, h, band: top + h + 14 };
};

/** focus: one line beside the still picture. The loop sets where it sits (the outer box); it fades and rises inside it */
function FocusLineView({ id, at, progress, refEl }: { id: string; at: [number, number]; progress: MotionValue<number>; refEl: (el: HTMLDivElement | null) => void }) {
  const line = FOCUS_COPY[id];
  const [a, b] = at;
  const f = Math.min(0.01, (b - a) / 4);
  const range = [a, a + f, b - f, b];
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, reduced ? [0, 0, 0, 0] : [14, 0, 0, -10]);
  // (no visibility: a line holds no controls, and every line stays in the reading order for screen readers)
  return (
    <div className="fl" ref={refEl}>
      <m.article className={`fl-in tone-${line.tone}${line.big ? " is-big" : ""}`} style={{ opacity, y }}>
        {line.kicker && (
          <p className="beat-k">
            <i />
            {line.kicker}
          </p>
        )}
        <h2 className="fl-h">{line.headline.replace(/—/g, "\u2060—")}</h2>
        {line.detail && <p className="fl-d">{line.detail}</p>}
      </m.article>
    </div>
  );
}

function BeatView({ beat, progress }: { beat: Beat; progress: MotionValue<number> }) {
  const [a, b] = beat.at;
  // fade in and out inside the window so neighbouring beats never overlap
  const f = Math.min(0.014, (b - a) / 4);
  const range = [a, a + f, b - f, b];
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, reduced ? [0, 0, 0, 0] : [28, 0, 0, -22]);
  const events = useTransform(opacity, (o) => (o > 0.6 ? "auto" : "none"));
  const ctaVis = useTransform(opacity, shown);
  return (
    <m.article className={`beat beat-${beat.id} tone-${beat.tone ?? "ink"}${beat.headline.split(" ").length > 10 ? " is-long" : ""}`} style={{ opacity, y, pointerEvents: events }}>
      {beat.kicker && (
        <p className="beat-k">
          <i />
          {beat.kicker}
        </p>
      )}
      <h2 className="beat-h">{beat.headline}</h2>
      {beat.body && <p className="beat-b">{beat.body}</p>}
      {beat.stats && (
        <dl className="beat-stats">
          {beat.stats.map((st) => (
            <div key={st.label}>
              <dt>{st.value}</dt>
              <dd>{st.label}</dd>
            </div>
          ))}
        </dl>
      )}
      {beat.note && <p className="beat-n">{beat.note}</p>}
      {beat.detail && <p className="beat-d">{beat.detail}</p>}
      {beat.cta && (
        <m.div className="beat-cta" style={{ visibility: ctaVis }}>
          <JoinLink />
        </m.div>
      )}
    </m.article>
  );
}

export function Story({ beats, hero }: { beats: Beat[]; hero: SiteCopy["hero"] }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const callouts = useRef<(HTMLDivElement | null)[]>([]);
  const lines = useRef<(HTMLDivElement | null)[]>([]);
  const linesBox = useRef<HTMLDivElement>(null);
  const joinEl = useRef<HTMLAnchorElement>(null);
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [load, setLoad] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  // the film's own 0-1, after the opening (the beats and the chapters run on it)
  const film = useTransform(scrollYProgress, filmP);
  // the page opens on the blocks alone; the title arrives as they finish stacking, and leaves as the rush starts
  // (focus: the page opens on the book alone, and it leaves before the blocks stand up)
  // (home: the opening plays by itself on load and lands on the hero, which leaves as the rush starts)
  const heroOpacity = useTransform(scrollYProgress, FOCUS ? FOCUS_HERO : [0, sp(0.02), sp(0.045)], [1, 1, 0]);
  // focus: the paper that the picture steps back behind whenever words have the screen
  const veil = useTransform(scrollYProgress, (v) => (FOCUS ? veilAt(v) : 0));
  const [heroIn, setHeroIn] = useState(FOCUS);
  const heroVis = useTransform(heroOpacity, shown);
  const scrimOpacity = useTransform(heroOpacity, (o) => (FOCUS ? 1 : 1 - o));
  const heroEvents = useTransform(heroOpacity, (o) => (o > 0.05 ? "auto" : "none"));
  const cueOpacity = useTransform(scrollYProgress, [0, 0.012], [1, 0]);
  // gone once faded, so its looping animation stops too
  const cueDisplay = useTransform(cueOpacity, (o) => (o > 0 ? "" : "none"));
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v > MOVED && !heroIn) setHeroIn(true); // (home: a scroll during the opening ends it, in the loop, at the same point)
  });

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d", { alpha: false })!;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    let store: FrameStore | null = null; // full-quality frames
    let lo: FrameStore | null = null; // tiny frames that load first, so the story starts at once
    let anchors: Anchors | null = null;
    let raf = 0;
    let disposed = false;
    let onScreen = true;
    let cur = 0;
    let lastKey = "";
    let lastPlaced = Number.NaN;
    // the home page's opening plays by itself once the first pictures are in (0: not yet); it is over when it
    // reaches the hero or the visitor scrolls, and from then on the scroll drives the picture
    let introStart = 0;
    let introDone = FOCUS || reduced;
    let introHero = false;
    let fit = { w: 1, h: 1, ox: 0, oy: 0, dpr: 1 };
    let lastBmp: ImageBitmap | null = null;
    let lastFrame = 0;
    let scale = 1; // the device pixel ratio the canvas was sized with
    let widths: number[] = [];
    let placed: string[] = []; // focus: where each line was last set, by the picture's position

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    // callout tags are static text: measure them once, not every frame
    const measure = () => {
      widths = callouts.current.map((el) => (el?.lastElementChild as HTMLElement | null)?.offsetWidth ?? 0);
      lastPlaced = Number.NaN;
      placed = [];
    };
    /** focus: where frame's picture sits (device px). Its subject towards the screen's centre line, but a
     *  picture wider than the screen always covers it (no gap at a side); on an upright screen it sits above
     *  the band its words go in. On a screen wider than the picture it is enlarged to the full width
     *  wherever its subject still fits between the menu and the screen's foot, so a block crossing the
     *  picture's edge is cut by the screen's edge, as by a camera, not faded into the wall */
    // focus, a screen wider than the picture: the zoom each film frame may take (its subject between the
    // menu and the foot), then limited to 1.5% a frame either way, so the picture never lurches as the
    // subject shrinks or grows (it only ever zooms less than its subject allows); per screen size
    let zoomKey = "";
    let zooms: number[] = [];
    const zoomsFor = (cw: number, ch: number, aspect: number) => {
      const key = `${cw}x${ch}x${aspect.toFixed(4)}x${scale}`;
      if (key === zoomKey) return zooms;
      zoomKey = key;
      const cover = cw / (ch * aspect);
      const mt = Math.max(ch * 0.1, 64 * scale); // under the menu
      const mb = ch * 0.06;
      const z = FOCUS_SPANS.map(([t, b]) => Math.min(cover, Math.max(1, (ch - mt - mb) / (Math.max(0.01, b - t) * ch))));
      for (let i = 1; i < z.length; i++) z[i] = Math.min(z[i], z[i - 1] * 1.015);
      for (let i = z.length - 2; i >= 0; i--) z[i] = Math.min(z[i], z[i + 1] * 1.015);
      zooms = z;
      return z;
    };
    const focusRect = (frame: number, cw: number, ch: number, aspect: number) => {
      let dh: number;
      let oy: number;
      if (cw < ch) {
        const b = bandFit(ch / scale);
        dh = b.h * scale;
        oy = b.top * scale;
      } else {
        const span = cw > ch * aspect ? focusSpan(frame) : null;
        dh = ch;
        oy = 0;
        if (span) {
          const [t, b] = span;
          const mt = Math.max(ch * 0.1, 64 * scale); // under the menu
          const mb = ch * 0.06;
          const z = zoomsFor(cw, ch, aspect)[focusIndex(frame)];
          if (z > 1) {
            dh = ch * z;
            const c = (t + b) / 2;
            oy = c * ch - c * dh; // enlarged about the subject's middle
            oy = Math.min(ch - mb - b * dh, Math.max(mt - t * dh, oy)); // the subject clear of the menu and the foot
            oy = Math.min(0, Math.max(ch - dh, oy)); // and the picture still covers top to bottom
          }
        }
      }
      const dw = dh * aspect;
      const want = cw / 2 - focusAt(frame) * dw;
      const ox = dw >= cw ? Math.min(0, Math.max(cw - dw, want)) : Math.min(cw - dw, Math.max(0, want));
      return { ox, oy, dw, dh };
    };
    // The hero: the picture steps back, so the stack and the planks that carry the book's words (HERO.box) fit the
    // screen whole, centred under the menu (placeHero sets heroAt, as shares of the screen). It steps back as the
    // blocks finish stacking, and in again once the planks have gone, as the rush starts
    let heroAt: { x: number; y: number; w: number } | null = null;
    const heroGone = frameAt(sp(0.046));
    const heroWeight = (frame: number) => {
      const inn = frame >= HERO_FRAME ? 1 : smooth01((frame - (HERO_FRAME - 32)) / 31);
      return Math.min(inn, 1 - smooth01((frame - heroGone) / 16));
    };
    /** the home page: where frame's picture sits on a cw × ch screen (any unit), as draw() paints it */
    const homeRect = (frame: number, cw: number, ch: number, aspect: number) => {
      let dw: number;
      let dh: number;
      let oy: number;
      if (cw / ch < 1) {
        // phones: after the hero the picture sits above the words, and the studio backdrop continues
        // above and below it
        const { scale, bottom } = portraitFit(frame);
        dh = ch * scale;
        dw = Math.max(cw, dh * aspect);
        dh = dw / aspect;
        oy = ch * bottom - dh;
      } else {
        // the render's shape or narrower: it covers the screen's height and is cropped at the sides; wider
        // (16:9 and up): never crop the tower, continue the backdrop at the sides
        dh = ch;
        dw = dh * aspect;
        oy = 0;
      }
      // narrower than the screen: slide the tower right, away from the words on the left
      // (a cropped frame on a landscape screen keeps the stack right of the words too; phones centre it)
      const anchor = cw >= ch ? 0.6 : 0.5;
      const fx = focusAt(frame);
      let ox = dw > cw ? Math.min(0, Math.max(cw - dw, cw * anchor - fx * dw)) : Math.min(cw - dw, Math.max(0, cw * 0.6 - fx * dw));
      const w = heroAt ? heroWeight(frame) : 0;
      if (heroAt && w) {
        const hw = heroAt.w * cw;
        ox += (heroAt.x * cw - ox) * w;
        oy += (heroAt.y * ch - oy) * w;
        dw += (hw - dw) * w;
        dh = dw / aspect;
      }
      return { ox, oy, dw, dh };
    };
    const draw = (bmp: ImageBitmap, frame: number) => {
      const cw = cv.width;
      const ch = cv.height;
      const aspect = bmp.width / bmp.height;
      if (FOCUS) {
        const r = focusRect(frame, cw, ch, aspect);
        paintFocus(bmp, r.ox, r.oy, r.dw, r.dh, cw, ch);
        fit = { w: r.dw, h: r.dh, ox: r.ox, oy: r.oy, dpr: scale };
        return;
      }
      const { ox, oy, dw, dh } = homeRect(frame, cw, ch, aspect);
      ctx.drawImage(bmp, ox, oy, dw, dh);
      // where the picture does not reach the screen's edges, its own edges run on (the wall above, the table
      // below, the backdrop at the sides, and its corner pixels into the corners)
      const bw = bmp.width;
      const bh = bmp.height;
      const L = Math.max(0, ox);
      const R = Math.min(cw, ox + dw);
      if (oy > 0) ctx.drawImage(bmp, 0, 0, bw, 2, ox, 0, dw, oy + 1);
      if (oy + dh < ch) ctx.drawImage(bmp, 0, bh - 2, bw, 2, ox, oy + dh - 1, dw, ch - oy - dh + 1);
      if (ox > 0) ctx.drawImage(bmp, 0, 0, 2, bh, 0, oy, ox + 1, dh);
      if (ox + dw < cw) ctx.drawImage(bmp, bw - 2, 0, 2, bh, ox + dw - 1, oy, cw - ox - dw + 1, dh);
      if (ox > 0 && oy > 0) ctx.drawImage(bmp, 0, 0, 2, 2, 0, 0, L + 1, oy + 1);
      if (ox + dw < cw && oy > 0) ctx.drawImage(bmp, bw - 2, 0, 2, 2, R - 1, 0, cw - R + 1, oy + 1);
      if (ox > 0 && oy + dh < ch) ctx.drawImage(bmp, 0, bh - 2, 2, 2, 0, oy + dh - 1, L + 1, ch - oy - dh + 1);
      if (ox + dw < cw && oy + dh < ch) ctx.drawImage(bmp, bw - 2, bh - 2, 2, 2, R - 1, oy + dh - 1, cw - R + 1, ch - oy - dh + 1);
      fit = { w: dw, h: dh, ox, oy, dpr: scale };
      drawPlanks(ox, oy, dw, dh);
    };
    // The planks that carry the hero's words (render/hero_words.py), drawn with the frame where the frame is, so
    // they stand on its table: the title page (SCALING beside the stack, the two lines), then the red plank,
    // which lands last and lifts under the pointer. Their layers run below the frame by HERO.over
    const planks: { words?: HTMLImageElement; join?: HTMLImageElement; shadow?: HTMLImageElement } = {};
    let wordsIn = 0; // 0-1: the title page set down
    let joinIn = 0; // 0-1 (a touch past 1 as it settles): the red plank set down
    let lift = 0; // 0-1: the red plank lifted (pointer or keyboard)
    let liftTo = 0;
    let planksAt = Infinity; // when the planks start to arrive (0: already there)
    /** the planks' state now; true while it is still changing (the canvas is painted again) */
    const stepPlanks = (now: number) => {
      const w = Math.max(0, Math.min(1, (now - planksAt) / 650));
      const j0 = Math.max(0, Math.min(1, (now - planksAt - 520) / 520));
      const j = j0 === 1 ? 1 : 1 + 2.2 * Math.pow(j0 - 1, 3) + 1.2 * Math.pow(j0 - 1, 2); // eases out with a small settle
      const l = Math.abs(liftTo - lift) < 0.01 ? liftTo : lift + (liftTo - lift) * (reduced ? 1 : 0.22);
      const moving = w !== wordsIn || j !== joinIn || l !== lift;
      wordsIn = w;
      joinIn = j;
      lift = l;
      return moving;
    };
    const drawPlanks = (ox: number, oy: number, dw: number, dh: number) => {
      const a = heroShown(scrollYProgress.get());
      if (!a || !heroAt || !planks.words) return;
      const H = dh * (1 + HERO.over);
      const cw = cv.width;
      // a layer, and (as the frame's own edges do) its edge columns run on where the picture stops short of the
      // screen's sides: the title plank's long shadow crosses the table past the picture's edge
      const layer = (im: HTMLImageElement, y: number) => {
        ctx.drawImage(im, ox, y, dw, H);
        // (edge to edge, not overlapping by a pixel as the opaque frame's do: a shadow drawn twice shows as a line)
        if (ox > 0) ctx.drawImage(im, 0, 0, 1, im.naturalHeight, 0, y, ox, H);
        if (ox + dw < cw) ctx.drawImage(im, im.naturalWidth - 1, 0, 1, im.naturalHeight, ox + dw, y, cw - ox - dw, H);
      };
      ctx.save();
      ctx.globalAlpha = a * wordsIn;
      if (ctx.globalAlpha > 0) layer(planks.words, oy);
      if (planks.join && planks.shadow && joinIn > 0) {
        const drop = (1 - joinIn) * 0.03 * dh + lift * 0.006 * dh; // in from above, and lifted under the pointer
        ctx.globalAlpha = a * Math.min(1, joinIn * 1.4) * (1 - lift * 0.35);
        layer(planks.shadow, oy);
        ctx.globalAlpha = a * Math.min(1, joinIn * 2.5);
        ctx.drawImage(planks.join, ox, oy - drop, dw, H);
      }
      ctx.restore();
    };

    // focus: a frame's edge (its top or bottom row, or its first or last column) in 24 colours along it,
    // the blocks in it left out (strong colour, dark, or a dip of more than 8% below the wall or floor on
    // both sides of it, as a shaded face or a shadow is; a vignette, the horizon or a bright floor is no
    // dip) and filled from the wall or floor beside them. `exact` is the edge itself, to meet the picture;
    // `flat` is eased toward the edge's middle tone, for a band far from it (no long stripes). Cached per frame
    const N = 24;
    const probe = document.createElement("canvas");
    probe.width = N;
    probe.height = N;
    const pctx = probe.getContext("2d", { willReadFrequently: true })!;
    const edge = document.createElement("canvas"); // the soft seam between the picture and what continues it
    const ectx = edge.getContext("2d")!;
    type Edge = { exact: string[]; flat: string[] };
    const rows = new WeakMap<ImageBitmap, Record<string, Edge>>();
    const edgeLine = (bmp: ImageBitmap, axis: "row" | "col", at: number): Edge => {
      const id = `${axis}${at}`;
      const seen = rows.get(bmp) ?? {};
      if (seen[id]) return seen[id];
      pctx.clearRect(0, 0, N, N);
      if (axis === "row") pctx.drawImage(bmp, 0, at, bmp.width, 2, 0, 0, N, 1);
      else pctx.drawImage(bmp, at, 0, 2, bmp.height, 0, 0, 1, N);
      const d = pctx.getImageData(0, 0, axis === "row" ? N : 1, axis === "row" ? 1 : N).data;
      const px = Array.from({ length: N }, (_, k) => [d[k * 4], d[k * 4 + 1], d[k * 4 + 2]]);
      const L = px.map(([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b);
      const plain = px.map(([r, g, b]) => {
        const hi = Math.max(r, g, b);
        return hi > 120 && (hi - Math.min(r, g, b)) / hi < 0.22;
      });
      const near = (from: number, to: number) => {
        let m = -1;
        for (let j = Math.max(0, from); j <= Math.min(N - 1, to); j++) if (plain[j]) m = Math.max(m, L[j]);
        return m;
      };
      const ok = plain.map((p, k) => {
        if (!p) return false;
        const l = near(k - 5, k - 1);
        const r = near(k + 1, k + 5);
        return !(l > 0 && r > 0 && L[k] < 0.92 * Math.min(l, r));
      });
      const out = px.map((c, k) => {
        if (ok[k]) return c;
        let l = k;
        let r = k;
        while (l >= 0 && !ok[l]) l--;
        while (r < N && !ok[r]) r++;
        if (l < 0 && r >= N) return [241, 234, 223]; // nothing but blocks: the page's paper
        if (l < 0) return px[r];
        if (r >= N) return px[l];
        const t = (k - l) / (r - l);
        return px[l].map((v, i) => v + (px[r][i] - v) * t);
      });
      const okPx = out.filter((_, k) => ok[k]);
      const avg = okPx.length ? [0, 1, 2].map((i) => okPx.reduce((t, c) => t + c[i], 0) / okPx.length) : null;
      const css = (c: number[]) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
      const res = { exact: out.map(css), flat: out.map((c) => css(avg ? c.map((v, i) => v + (avg[i] - v) * 0.4) : c)) };
      seen[id] = res;
      rows.set(bmp, seen);
      return res;
    };
    /** focus: the picture, and round it the wall and floor it shows, continued in its own edge colours, the
     *  picture fading into them wherever the screen is larger than it (so a block cut by the frame's edge
     *  never smears into stripes) */
    const paintFocus = (bmp: ImageBitmap, ox: number, oy: number, dw: number, dh: number, cw: number, ch: number) => {
      const along = (c: CanvasRenderingContext2D, stops: string[], horiz: boolean) => {
        const g = horiz ? c.createLinearGradient(ox, 0, ox + dw, 0) : c.createLinearGradient(0, oy, 0, oy + dh);
        stops.forEach((st, k) => g.addColorStop(k / (stops.length - 1), st));
        return g;
      };
      const gapT = oy > 0.5;
      const gapB = oy + dh < ch - 0.5;
      const gapL = ox > 0.5;
      const gapR = ox + dw < cw - 0.5;
      const top = gapT ? edgeLine(bmp, "row", 0) : null;
      const bot = gapB ? edgeLine(bmp, "row", bmp.height - 2) : null;
      const left = gapL ? edgeLine(bmp, "col", 0).exact : null;
      const right = gapR ? edgeLine(bmp, "col", bmp.width - 2).exact : null;
      // the edge colours over a strip, fading from opaque at the picture's edge to nothing (an offscreen canvas)
      const seam = (stops: string[], horiz: boolean, x: number, y: number, w: number, h: number, inward: "down" | "up" | "right" | "left") => {
        w = Math.max(1, Math.round(w));
        h = Math.max(1, Math.round(h));
        if (edge.width !== w || edge.height !== h) {
          edge.width = w;
          edge.height = h;
        }
        ectx.globalCompositeOperation = "source-over";
        const g = horiz ? ectx.createLinearGradient(ox - x, 0, ox - x + dw, 0) : ectx.createLinearGradient(0, oy - y, 0, oy - y + dh);
        stops.forEach((st, k) => g.addColorStop(k / (stops.length - 1), st));
        ectx.fillStyle = g;
        ectx.fillRect(0, 0, w, h);
        const m = inward === "down" || inward === "up" ? ectx.createLinearGradient(0, 0, 0, h) : ectx.createLinearGradient(0, 0, w, 0);
        const solidFirst = inward === "down" || inward === "right"; // the opaque end is at the picture's edge
        m.addColorStop(0, solidFirst ? "#000" : "rgba(0,0,0,0)");
        m.addColorStop(1, solidFirst ? "rgba(0,0,0,0)" : "#000");
        ectx.globalCompositeOperation = "destination-in";
        ectx.fillStyle = m;
        ectx.fillRect(0, 0, w, h);
        ctx.drawImage(edge, Math.round(x), Math.round(y));
      };
      // the sides (full height of the picture): the edge column itself, so the wall, the horizon and the floor
      // run on at their own light
      if (left) {
        ctx.fillStyle = along(ctx, left, false);
        ctx.fillRect(0, oy, Math.ceil(ox) + 1, dh);
      }
      if (right) {
        ctx.fillStyle = along(ctx, right, false);
        ctx.fillRect(Math.floor(ox + dw) - 1, oy, cw - Math.floor(ox + dw) + 1, dh);
      }
      // the top and bottom bands across the whole width: the eased edge, and the exact edge over the strip
      // next to the picture, so the band meets the picture in its own colours and settles further away
      const T = Math.max(48 * scale, dh * 0.12);
      if (top) {
        ctx.fillStyle = along(ctx, top.flat, true);
        ctx.fillRect(0, 0, cw, Math.ceil(oy) + 1);
        const h = Math.min(T, Math.ceil(oy) + 1);
        seam(top.exact, true, 0, Math.ceil(oy) + 1 - h, cw, h, "up");
      }
      if (bot) {
        ctx.fillStyle = along(ctx, bot.flat, true);
        ctx.fillRect(0, Math.floor(oy + dh) - 1, cw, ch - Math.floor(oy + dh) + 1);
        seam(bot.exact, true, 0, Math.floor(oy + dh) - 1, cw, Math.min(T, ch - Math.floor(oy + dh) + 1), "down");
      }
      ctx.drawImage(bmp, ox, oy, dw, dh);
      // soft seams: the picture's outer strip fades into its own edge colours (a block cut by the frame's
      // edge never ends in a hard line); each reaches a pixel past the edge, so no sliver of it shows
      const fy = dh * 0.08;
      const fx = dw * 0.05;
      if (top) seam(top.exact, true, 0, Math.floor(oy) - 1, cw, Math.ceil(fy) + 2, "down");
      if (bot) {
        const y = Math.floor(oy + dh - fy);
        seam(bot.exact, true, 0, y, cw, Math.ceil(oy + dh) + 1 - y, "up");
      }
      if (left) seam(left, false, Math.floor(ox) - 1, oy, Math.ceil(fx) + 2, dh, "right");
      if (right) {
        const x = Math.floor(ox + dw - fx);
        seam(right, false, x, oy, Math.ceil(ox + dw) + 1 - x, dh, "left");
      }
    };

    // The hero: the picture steps back until the stack and its planks (HERO.fit) fit the screen under the menu,
    // centred, never closer than the story's own hero shot; the red plank's link sits over its stamped face
    const placeHero = () => {
      if (FOCUS) return;
      const vw = cv.clientWidth;
      const vh = cv.clientHeight;
      if (!vw || !vh) return;
      setHeroCap(0.58);
      heroAt = null;
      const A = 1.6; // the render's shape (1600 × 1000)
      const { l, t, r, b } = HERO.fit;
      const top = vh < 520 ? 58 : vw <= 900 ? 74 : 86; // the menu
      const foot = vh < 520 ? 8 : vw <= 900 ? 18 : 28;
      const side = vw <= 600 ? 8 : 32;
      const normal = homeRect(HERO_FRAME, vw, vh, A);
      const dh = Math.min((vw - 2 * side) / ((r - l) * A), (vh - top - foot) / (b - t), normal.dh * 1.1);
      const dw = dh * A;
      const ox = vw / 2 - ((l + r) / 2) * dw;
      const oy = top + (vh - top - foot) / 2 - ((t + b) / 2) * dh;
      heroAt = { x: ox / vw, y: oy / vh, w: dw / vw };
      const link = joinEl.current;
      if (link) {
        const xs = HERO.join.map(([x]) => ox + x * dw);
        const ys = HERO.join.map(([, y]) => oy + y * dh);
        const pad = 4;
        link.style.left = `${Math.round(Math.min(...xs) - pad)}px`;
        link.style.top = `${Math.round(Math.min(...ys) - pad)}px`;
        link.style.width = `${Math.round(Math.max(...xs) - Math.min(...xs) + 2 * pad)}px`;
        link.style.height = `${Math.round(Math.max(...ys) - Math.min(...ys) + 2 * pad)}px`;
      }
      // the scroll cue only where it clears the planks' shadows
      cv.parentElement?.toggleAttribute("data-cue-off", oy + HERO.box.b * dh > vh - 70);
      lastKey = "";
    };
    // the planks' pictures: the size the hero draws them at
    const loadPlanks = () => {
      if (FOCUS || planks.words) return;
      const want = (heroAt?.w ?? 1) * cv.clientWidth * dpr() > 1250 ? "2000" : "1100";
      const get = (k: keyof typeof HERO.files) =>
        new Promise<HTMLImageElement>((res, rej) => {
          const im = new Image();
          im.decoding = "async";
          im.onload = () => res(im);
          im.onerror = rej;
          im.src = `${import.meta.env.BASE_URL}hero/${HERO.files[k][want]}`;
        });
      void Promise.all([get("words"), get("join"), get("join_shadow")])
        .then(([w, j, sh]) => Promise.all([w.decode(), j.decode(), sh.decode()]).then(() => [w, j, sh]))
        .then(([w, j, sh]) => {
          if (disposed) return;
          planks.words = w;
          planks.join = j;
          planks.shadow = sh;
          lastKey = "";
        })
        .catch(() => undefined);
    };

    const resize = () => {
      const r = cv.getBoundingClientRect();
      placeHero();
      loadPlanks();
      scale = dpr();
      const w = Math.round(r.width * scale);
      const h = Math.round(r.height * scale);
      if (w !== cv.width || h !== cv.height) {
        cv.width = w; // clears the canvas (and its settings), so repaint before the browser shows it
        cv.height = h;
        ctx.imageSmoothingQuality = "high"; // the frames are scaled to the screen: keep edges clean
        if (lastBmp && lastBmp.width) draw(lastBmp, lastFrame);
        else {
          ctx.fillStyle = "#d9cfc0"; // the studio backdrop, so the words stay readable before frames arrive
          ctx.fillRect(0, 0, w, h);
        }
      }
      lastKey = "";
      measure();
    };
    const link = joinEl.current;
    const up = () => void ((liftTo = 1), start());
    const down = () => void ((liftTo = 0), start());
    link?.addEventListener("pointerenter", up);
    link?.addEventListener("pointerleave", down);
    link?.addEventListener("focus", up);
    link?.addEventListener("blur", down);
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();
    void document.fonts?.ready.then(() => {
      if (disposed) return;
      placeHero();
      lastKey = "";
      measure();
    });
    // moving the window between screens changes the pixel ratio without resizing the canvas
    let mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onDpr = () => {
      resize();
      mq.removeEventListener("change", onDpr);
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mq.addEventListener("change", onDpr);
    };
    mq.addEventListener("change", onDpr);

    const placeCallouts = (frame: number) => {
      if (!anchors || FOCUS) return; // focus: no words on the picture
      const row = anchors.frames[Math.max(0, Math.min(anchors.frames.length - 1, Math.round(frame)))];
      const vw = cv.clientWidth;
      const vh = cv.clientHeight;
      // a tag never sits under the words or the nav. Read everything first, then write.
      let rects: DOMRect[] | null = null;
      const blockers = () =>
        (rects ??= [document.querySelector<HTMLElement>(".nav .brand"), document.querySelector<HTMLElement>(".nav-cta"), ...(cv.parentElement?.querySelectorAll<HTMLElement>(".beat") ?? [])]
          .filter((e): e is HTMLElement => !!e && parseFloat(getComputedStyle(e).opacity) > 0.3)
          .map((e) => e.getBoundingClientRect()));
      const taken: { l: number; r: number; t: number; b: number }[] = [];
      const narrow = vw <= 900;
      let shownTags = 0;
      const plan = CALLOUTS.map((c, k) => {
        if (narrow && (c.wide || (shownTags >= 1 && frame < LAST_SHOT))) return null;
        const fade = 2.5;
        const o = Math.max(0, Math.min(1, (frame - c.from) / fade, (c.to - frame) / fade));
        const a = row[c.anchor];
        if (!a || o <= 0.01 || a[0] < -0.1 || a[0] > 1.1 || a[1] < -0.1 || a[1] > 1.1) return null;
        const x = (fit.ox + a[0] * fit.w) / fit.dpr;
        const y = (fit.oy + a[1] * fit.h) / fit.dpr;
        const tw = widths[k] ?? 0;
        let side = c.side ?? "right";
        if (side === "right" && x + 80 + tw > vw - 12) side = "left";
        else if (side === "left" && x - 80 - tw < 12) side = "right";
        const left = side === "right" ? x + 80 : x - 80 - tw;
        if (y < 92 || y > vh - 70 || left < 12 || left + tw > vw - 12) return null;
        if (blockers().some((r) => y + 14 > r.top && y - 14 < r.bottom && left + tw > r.left && left < r.right)) return null;
        const box = { l: left, r: left + tw, t: y - 15, b: y + 15 };
        if (taken.some((q) => box.l < q.r && box.r > q.l && box.t < q.b && box.b > q.t)) return null;
        taken.push(box);
        shownTags++;
        return { o, x, y, side };
      });
      plan.forEach((p, k) => {
        const el = callouts.current[k];
        if (!el) return;
        if (!p) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          return;
        }
        el.classList.toggle("side-left", p.side === "left");
        el.classList.toggle("side-right", p.side === "right");
        el.style.opacity = String(p.o);
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      });
    };

    // focus: the line that is up sits beside its blocks, on the paper round them (an upright screen: in the band under the picture)
    const placeLines = () => {
      if (!FOCUS) return;
      const vw = cv.clientWidth;
      const vh = cv.clientHeight;
      const fp = filmP(scrollYProgress.get());
      const m = (store ?? lo)?.m;
      if (!m) return;
      FOCUS_LINES.forEach((ln, k) => {
        const el = lines.current[k];
        if (!el || fp < ln.at[0] - 0.01 || fp > ln.at[1] + 0.01) return; // only the one that is up (or about to be)
        // set from its own held frame's picture (not the moving one), once per window size
        const key = `${cv.width}x${cv.height}`;
        if (placed[k] === key) return;
        placed[k] = key;
        const r = focusRect(focusHold(ln.box), cv.width, cv.height, m.width / m.height);
        const [bl, bt, br, bb] = focusBox(ln.box);
        const L = (r.ox + bl * r.dw) / scale;
        const T = (r.oy + bt * r.dh) / scale;
        const R = (r.ox + br * r.dw) / scale;
        const B = (r.oy + bb * r.dh) / scale;
        const gut = vw <= 600 ? 20 : 40;
        const set = (side: FocusSide | "band", maxW: number) => {
          el.dataset.side = side;
          el.style.maxWidth = `${Math.max(0, Math.round(maxW))}px`;
          return { w: el.offsetWidth, h: el.offsetHeight };
        };
        const put = (x: number, y: number) => void (el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`);
        if (vw < vh) {
          const top = (r.oy + r.dh) / scale + 14;
          const { w } = set("band", Math.min(520, vw - 2 * gut));
          return put((vw - w) / 2, top);
        }
        const gap = vw <= 900 ? 22 : 36;
        const midY = (h: number) => Math.min(vh - h - 24, Math.max(84, (T + B) / 2 - h / 2));
        const tries: FocusSide[] = ln.side === "right" ? ["right", "left", "below", "above"] : ln.side === "left" ? ["left", "right", "below", "above"] : ln.side === "above" ? ["above", "below", "right", "left"] : ["below", "above", "right", "left"];
        const roomR = vw - R - gap - gut;
        const roomL = L - gap - gut;
        const minSide = vh < 450 ? 160 : 240; // a phone on its side has little height, but paper at the sides
        const beside = (side: "left" | "right", room: number) => {
          const { w, h } = set(side, Math.min(vw <= 900 ? 300 : 440, room));
          put(side === "right" ? R + gap : L - gap - w, midY(h));
        };
        for (const side of tries) {
          if (side === "right" || side === "left") {
            const room = side === "right" ? roomR : roomL;
            if (room < minSide) continue;
            return beside(side, room);
          }
          const { w, h } = set(side, Math.min(640, vw - 2 * gut));
          const y = side === "below" ? B + 22 : T - 22 - h;
          if (y < 80 || y + h > vh - 20) continue;
          return put(Math.min(vw - gut - w, Math.max(gut, (L + R) / 2 - w / 2)), y);
        }
        // nowhere is quite clear: the wider side, else the foot of the screen
        if (Math.max(roomL, roomR) >= 120) return beside(roomR >= roomL ? "right" : "left", Math.max(roomL, roomR));
        const { w, h } = set("below", Math.min(640, vw - 2 * gut));
        put((vw - w) / 2, vh - h - 20);
      });
    };

    const loop = () => {
      raf = 0;
      if (disposed || !lo) return;
      const v = scrollYProgress.get();
      let target: number;
      if (introDone) target = frameAt(v);
      else {
        const t = introStart ? (performance.now() - introStart) / INTRO_MS : 0;
        if (t >= 0.6 && !introHero) {
          introHero = true;
          setHeroIn(true);
        }
        // the planks are set down as the blocks settle into the stack
        if (t >= 0.74 && planksAt === Infinity) planksAt = performance.now();
        if (t >= 1 || v > MOVED) introDone = true;
        if (v > MOVED) planksAt = Math.min(planksAt, 0); // a scroll during the opening: they are simply there
        target = introDone ? frameAt(v) : introFrame(t);
      }
      // off screen: jump to the true frame, draw it once, then sleep, so the canvas is right when it scrolls back in
      if (!onScreen && cur === target && lastKey) return;
      raf = requestAnimationFrame(loop);
      const diff = target - cur;
      cur = reduced || !onScreen || !introDone ? target : Math.abs(diff) < 0.02 ? target : cur + diff * 0.2;
      const i = Math.max(0, Math.min(lo.m.count - 1, Math.round(cur)));
      const dir = Math.sign(diff) || 1;
      // full quality when it is decoded (or one a frame or two away); the small set only fills gaps
      const hiHas = !!store?.blobs[i];
      const hi = store?.get(i) ?? null;
      store?.prefetch(i, dir, small ? 6 : 10);
      const bmp = hi ?? (hiHas ? store!.nearest(i, dir, 2) : null) ?? lo.peek(i) ?? lo.get(i) ?? lo.nearest(i, dir) ?? store?.nearest(i, dir) ?? null;
      if (!hiHas) lo.prefetch(i, dir, 6);
      const exact = !!(hi || lo.peek(i));
      const key = `${i}:${cv.width}x${cv.height}:${Math.round(heroShown(v) * 40)}`;
      if (stepPlanks(performance.now())) lastKey = "";
      if (bmp && (key !== lastKey || bmp !== lastBmp)) {
        draw(bmp, i);
        lastBmp = bmp;
        lastFrame = i;
        lastKey = exact ? key : "";
        lastPlaced = Number.NaN;
      }
      // nothing moves while the visitor is not scrolling: skip the layout work
      if (cur !== lastPlaced) {
        placeCallouts(cur);
        lastPlaced = cur;
      }
      placeLines();
      // focus: words only on a still picture; while the picture is still catching up with a fast scroll, they wait
      const box = linesBox.current;
      if (FOCUS && box) {
        const moving = Math.abs(target - cur) > 0.5;
        if (moving !== box.hasAttribute("data-moving")) box.toggleAttribute("data-moving", moving);
      }
    };
    const start = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(loop);
    };
    // the loop sleeps while the story is off screen
    // touching the viewport edge (where #bootloader lands) is not on screen
    // off screen for a couple of seconds: let go of the decoded pictures (phones run short of memory)
    let sleep = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.intersectionRatio > 0;
        window.clearTimeout(sleep);
        if (onScreen) lastKey = "";
        else
          sleep = window.setTimeout(() => {
            lo?.release();
            store?.release();
          }, 2000);
        start();
      },
      { threshold: [0, 0.01] },
    );
    io.observe(cv);

    const loadAnchors = () =>
      anchors || FOCUS // (focus: no labels on the picture)
        ? Promise.resolve()
        : fetchOk(`${import.meta.env.BASE_URL}anchors.json`)
        .then((r) => r.json())
        .then((a: Anchors) => {
          anchors = a;
          lastPlaced = Number.NaN;
        })
        .catch(() => undefined);

    (async () => {
      try {
        const decodeW = Math.min(1600, Math.round(Math.max(window.innerWidth, window.innerHeight * 1.6) * dpr()));
        const loLimit = 24;
        const hiLimit = small ? 12 : 24;
        const FIRST = 20; // frames decoded before the story shows
        // the full-quality manifest is requested alongside the small set, not after it; the story runs without it if it fails
        const hiOpen = FrameStore.open(`${import.meta.env.BASE_URL}${FRAMES}/hi/`, hiLimit, decodeW, () => undefined).catch(() => null);
        const smallSet = await FrameStore.open(`${import.meta.env.BASE_URL}${FRAMES}/lo/`, loLimit, 9999, () => setLoad(smallSet.loadedChunks / smallSet.chunkCount));
        if (disposed) return smallSet.dispose();
        // let a restored scroll position (reload, deep link) land before deciding where the story starts
        await new Promise((r) => requestAnimationFrame(r));
        const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
        const slow = !!conn && (!!conn.saveData || (conn.effectiveType ?? "4g") !== "4g");
        // the opening plays at the top of the page; anywhere else (a reload, a link, a scroll while it loaded),
        // or on a slow connection, the story starts where the visitor is
        const playIntro = !introDone && !slow && scrollYProgress.get() <= MOVED;
        if (!playIntro) introDone = true;
        const at = playIntro ? 0 : Math.round(frameAt(scrollYProgress.get()));
        lo = smallSet;
        // only the chunk on screen holds the story up; the rest streams behind it (and retries what failed)
        await lo.loadChunk(lo.chunkOf(at)).catch(() => undefined);
        if (disposed) return;
        void lo.loadAll([lo.chunkOf(at)], 2);
        cur = at;
        lo.aim(at);
        const first = Math.max(0, Math.min(lo.m.count - (loLimit - 4), at - 4));
        await Promise.all(Array.from({ length: Math.min(FIRST, loLimit - 4) }, (_, n) => lo!.decode(first + n)));
        if (disposed) return;
        start();
        const hiStore = await hiOpen;
        if (disposed) return hiStore?.dispose();
        let rest: Promise<void> = Promise.resolve();
        if (hiStore) {
          store = hiStore;
          hiStore.aim(at);
          const firstChunks = [...new Set(Array.from({ length: FIRST }, (_, n) => hiStore.chunkOf(Math.min(hiStore.m.count - 1, at + n))))];
          rest = hiStore.loadAll(firstChunks, 2);
          // the opening picture is the first impression: give the sharp one a moment to arrive (never long).
          // The opening plays in one go: its first half gets that moment, and the rest streams in (in order,
          // below) while the blocks still lie face up
          const need = playIntro ? [...new Set(Array.from({ length: 50 }, (_, n) => hiStore.chunkOf(n)))] : [hiStore.chunkOf(at)];
          await Promise.race([Promise.all(need.map((c) => hiStore.loadChunk(c).catch(() => undefined))), new Promise((r) => setTimeout(r, playIntro ? 1500 : slow ? 0 : 600))]);
          if (disposed) return;
          await Promise.all(Array.from({ length: playIntro ? 6 : 1 }, (_, n) => hiStore.decode(at + n).catch(() => undefined)));
          if (disposed) return;
        }
        void loadAnchors();
        if (introDone || scrollYProgress.get() > MOVED) {
          introDone = true;
          planksAt = 0;
          cur = frameAt(scrollYProgress.get());
          setHeroIn(true); // no opening to wait for: the hero (or wherever the visitor is) at once
        } else introStart = performance.now() + 250; // once the loader has faded
        setPhase("ready");
        await rest;
      } catch {
        // nothing here may leave the story dark or unlabelled
        if (!disposed) {
          introDone = true;
          planksAt = 0;
          setHeroIn(true);
          setPhase("ready");
          start();
          void loadAnchors();
        }
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      link?.removeEventListener("pointerenter", up);
      link?.removeEventListener("pointerleave", down);
      link?.removeEventListener("focus", up);
      link?.removeEventListener("blur", down);
      window.clearTimeout(sleep);
      ro.disconnect();
      io.disconnect();
      mq.removeEventListener("change", onDpr);
      lo?.dispose();
      store?.dispose();
    };
  }, [scrollYProgress]);

  const shownHero = FOCUS || (phase !== "loading" && heroIn);
  return (
    <section ref={section} className={`story is-${phase}`} style={{ height: `${STORY_VH}vh` }} id="story">
      <div className="stage">
        <canvas
          ref={canvas}
          className="frames"
          role="img"
          aria-label={FOCUS ? FOCUS_ALT : STORY_ALT}
        />
        {/* the wash that keeps the story's words readable over the picture: not over the hero's planks */}
        <m.div className="scrim" style={{ opacity: scrimOpacity }} aria-hidden="true" />

        <div className="callouts" aria-hidden="true">
          {CALLOUTS.map((c, k) => (
            <div key={`${c.anchor}-${c.from}`} className={`callout side-${c.side ?? "right"} tone-${c.tone ?? "ink"}`} ref={(el) => void (callouts.current[k] = el)}>
              <span className="callout-line" />
              <span className="callout-tag">{c.text}</span>
            </div>
          ))}
        </div>

        {/* The hero's words are on the blocks themselves (the planks drawn on the canvas with the frame: SCALING
            beside UP / SIDE / DOWN, then A BOOK BY MICHAEL WENTZ, FOR BOOTSTRAPPED FOUNDERS and the red JOIN THE
            FIRST-EDITION LIST). The same words are here for screen readers and search, and the red plank is a link */}
        <div className="hero hero-words">
          <p>{hero.kicker}</p>
          <h1>{hero.title.replace("\n", " ")}</h1>
          <p>{hero.sub}</p>
          <p>{hero.detail}</p>
        </div>
        <m.a ref={joinEl} className="hero-join" href="#join" style={{ visibility: shownHero ? heroVis : "hidden", pointerEvents: shownHero ? heroEvents : "none" }}>
          <span className="sr-only">
            {hero.join}. {hero.free}.
          </span>
        </m.a>

        <m.div className="cue" style={{ opacity: cueOpacity, display: cueDisplay }} aria-hidden="true">
          {/* (it waits for the hero: the opening plays by itself) */}
          <m.div className="cue-in" initial={false} animate={{ opacity: shownHero ? 1 : 0 }} transition={{ duration: 0.8, delay: 0.9 }}>
            <span>Scroll</span>
            <i />
          </m.div>
        </m.div>


        {FOCUS && <m.div className="veil" style={{ opacity: veil }} aria-hidden="true" />}

        <div className="beats" ref={linesBox}>
          {FOCUS
            ? FOCUS_LINES.map((ln, k) => <FocusLineView key={ln.id} id={ln.id} at={ln.at} progress={film} refEl={(el) => void (lines.current[k] = el)} />)
            : beats.map((b) => <BeatView key={b.id} beat={b} progress={film} />)}
        </div>

        <Chapters progress={film} />

        <div className={`loader ${phase === "loading" ? "on" : ""}`} aria-hidden={phase !== "loading"}>
          <div className="loader-bars">
            {["up", "side", "down"].map((t, n) => (
              <i key={t} className={t} style={{ transform: `scaleX(${Math.min(1, Math.max(0.04, load * 3 - n))})` }} />
            ))}
          </div>
          <p>Scaling Up-Side-Down</p>
        </div>
      </div>
    </section>
  );
}

const CHAPTERS: [string, number, number][] = [
  ["Too fast", 0.035, 0.24],
  ["Falls over", 0.24, 0.385],
  ["Up · Side · Down", 0.385, 1],
];

function Chapters({ progress }: { progress: MotionValue<number> }) {
  const show = useTransform(progress, [0.03, 0.05, 0.97, 1], [0, 1, 1, 0]);
  return (
    <m.ol className="chapters" style={{ opacity: show }} aria-hidden="true">
      {CHAPTERS.map(([name, a, b]) => (
        <Chapter key={name} name={name} a={a} b={b} progress={progress} />
      ))}
    </m.ol>
  );
}

function Chapter({ name, a, b, progress }: { name: string; a: number; b: number; progress: MotionValue<number> }) {
  const fill = useTransform(progress, [a, b], [0, 1], { clamp: true });
  const on = useTransform(progress, (p) => (p >= a && p < b ? 1 : 0.82));
  return (
    <m.li style={{ opacity: on }}>
      <span>{name}</span>
      <i>
        <m.b style={{ scaleX: fill }} />
      </i>
    </m.li>
  );
}
