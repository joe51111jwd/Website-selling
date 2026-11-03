import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import * as m from "motion/react-m";
import { FrameStore, fetchOk } from "../frames";
import { CALLOUTS, FOCUS_HERO, FOCUS_LINES, LAST_SHOT, OPEN_P, STORY_VH, YEARS, filmP, focusAt, focusBox, frameAt, portraitFit, progressAt, setHeroCap, sp, yearAt, type FocusSide } from "../story";
import { FOCUS } from "../focus";
import { FOCUS_COPY, type Beat, type SiteCopy } from "../copy";
import { JoinLink } from "./JoinLink";
import { BOOK } from "../book";

type Anchors = { names: string[]; frames: Record<string, [number, number]>[] };

const STORY_ALT = "The Up, Side and Down blocks lie face up on a table, then stand up and stack. Blocks labelled with hires and tools are stacked on the Up, Side and Down blocks faster and faster until the tower falls over. Twelve painted system blocks widen the base into a three-colour foundation, the dead weight is cleared, and the same team is stacked back on it into a taller building that holds.";
const FOCUS_ALT = "The Up, Side and Down blocks lie face up on a table, then stand up and stack. Three planks stamped Always launching, Always hiring and Always adding go on top, then more and more blocks, faster and crookeder, until the tower falls over. The Up, Side and Down stack turns upside down and is set right again. Twelve painted system blocks slide in from both sides into a three-colour foundation, the planks and the dead weight are cleared away, and the same team is stacked back on it into a taller building that holds.";
/** the focus version plays its own film (render/focus_film.py), opening with the same 89 pictures */
const FRAMES = FOCUS ? "frames-focus" : "frames";
const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// below this opacity a control is treated as gone: no clicks, no Tab stop
const shown = (o: number) => (o > 0.05 ? "visible" : "hidden");

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
  const visibility = useTransform(opacity, shown);
  return (
    <div className="fl" ref={refEl}>
      <m.article className={`fl-in tone-${line.tone}`} style={{ opacity, y, visibility }}>
        {line.kicker && (
          <p className="beat-k">
            <i />
            {line.kicker}
          </p>
        )}
        <h2 className="fl-h">{line.headline}</h2>
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
  const hud = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [load, setLoad] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  // the film's own 0-1, after the opening (the beats, the chapters and the margin panel run on it)
  const film = useTransform(scrollYProgress, filmP);
  // the page opens on the blocks alone; the title arrives as they finish stacking, and leaves as the rush starts
  // (focus: the page opens on the book alone, and it leaves before the blocks stand up)
  const heroOpacity = useTransform(scrollYProgress, FOCUS ? FOCUS_HERO : [OPEN_P * 0.6, OPEN_P * 0.86, sp(0.02), sp(0.045)], FOCUS ? [1, 1, 0] : [0, 1, 1, 0]);
  const heroY = useTransform(scrollYProgress, FOCUS ? FOCUS_HERO : [OPEN_P * 0.6, OPEN_P * 0.86, sp(0), sp(0.04)], reduced ? (FOCUS ? [0, 0, 0] : [0, 0, 0, 0]) : FOCUS ? [0, 0, -30] : [18, 0, 0, -40]);
  // focus: the paper that the picture steps back behind whenever words have the screen
  const veil = useTransform(scrollYProgress, (v) => (FOCUS ? veilAt(v) : 0));
  const [heroIn, setHeroIn] = useState(FOCUS);
  const heroVis = useTransform(heroOpacity, shown);
  const heroEvents = useTransform(heroOpacity, (o) => (o > 0.05 ? "auto" : "none"));
  const hudIn = progressAt(YEARS[0].from);
  const hudOpacity = useTransform(scrollYProgress, [hudIn - 0.01, hudIn + 0.004, sp(0.295), sp(0.305)], [0, 1, 1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.012], [1, 0]);
  // gone once faded, so its looping animation stops too
  const cueDisplay = useTransform(cueOpacity, (o) => (o > 0 ? "" : "none"));
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v > OPEN_P * 0.62 && !heroIn) setHeroIn(true);
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
    let fit = { w: 1, h: 1, ox: 0, oy: 0, dpr: 1 };
    let lastBmp: ImageBitmap | null = null;
    let lastFrame = 0;
    let scale = 1; // the device pixel ratio the canvas was sized with
    let widths: number[] = [];
    let placed: string[] = []; // focus: where each line was last set, by the picture's position
    let lastHud = -1;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    // callout tags are static text: measure them once, not every frame
    const measure = () => {
      widths = callouts.current.map((el) => (el?.lastElementChild as HTMLElement | null)?.offsetWidth ?? 0);
      lastPlaced = Number.NaN;
      placed = [];
    };
    const draw = (bmp: ImageBitmap, frame: number) => {
      const cw = cv.width;
      const ch = cv.height;
      const aspect = bmp.width / bmp.height;
      let dw: number;
      let dh: number;
      let oy: number;
      if (FOCUS) {
        // the picture's subject on the screen's centre line; on an upright screen the picture sits above
        // the band its words go in, the studio backdrop continuing round it
        if (cw < ch) {
          const b = bandFit(ch / scale);
          dh = b.h * scale;
          oy = b.top * scale;
        } else {
          dh = ch;
          oy = 0;
        }
        dw = dh * aspect;
      } else if (cw / ch < 1) {
        // phones: the hero fills the screen; after it the picture sits above the words, and the
        // studio backdrop continues above and below it
        const { scale, bottom } = portraitFit(frame);
        dh = ch * scale;
        dw = Math.max(cw, dh * aspect);
        dh = dw / aspect;
        oy = ch * bottom - dh;
      } else if (cw / ch > aspect) {
        // wider than the render (16:9 and up): never crop the tower, continue the backdrop at the sides
        dh = ch;
        dw = dh * aspect;
        oy = 0;
      } else {
        const s = Math.max(cw / bmp.width, ch / bmp.height);
        dw = bmp.width * s;
        dh = bmp.height * s;
        oy = (ch - dh) / 2;
      }
      // narrower than the screen: slide the tower right, away from the words on the left
      // (a cropped frame on a landscape screen keeps the stack right of the words too; phones centre it)
      const anchor = cw >= ch ? 0.6 : 0.5;
      const ox = FOCUS ? cw / 2 - focusAt(frame) * dw : dw > cw ? Math.min(0, Math.max(cw - dw, cw * anchor - focusAt(frame) * dw)) : Math.min(cw - dw, Math.max(0, cw * 0.6 - focusAt(frame) * dw));
      ctx.drawImage(bmp, ox, oy, dw, dh);
      if (oy > 0) ctx.drawImage(bmp, 0, 0, bmp.width, 2, ox, 0, dw, oy + 1);
      if (oy + dh < ch) ctx.drawImage(bmp, 0, bmp.height - 2, bmp.width, 2, ox, oy + dh - 1, dw, ch - oy - dh + 1);
      if (ox > 0) ctx.drawImage(bmp, 0, 0, 2, bmp.height, 0, oy, ox + 1, dh);
      if (ox + dw < cw) ctx.drawImage(bmp, bmp.width - 2, 0, 2, bmp.height, ox + dw - 1, oy, cw - ox - dw + 1, dh);
      fit = { w: dw, h: dh, ox, oy, dpr: scale };
    };

    // an upright phone: the stack's top (about 15% down the picture) stays 12px under the hero's button
    const capHero = () => {
      const hero = cv.parentElement?.querySelector<HTMLElement>(".hero");
      const cta = hero?.querySelector<HTMLElement>(".hero-cta");
      const vh = cv.clientHeight;
      if (FOCUS || !hero || !cta || cv.clientWidth >= vh) return setHeroCap(0.58);
      const below = hero.offsetTop + cta.offsetTop + cta.offsetHeight; // layout, not the scroll-time shift
      setHeroCap((vh - below - 12) / (0.85 * vh));
    };
    const resize = () => {
      const r = cv.getBoundingClientRect();
      capHero();
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
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();
    void document.fonts?.ready.then(() => {
      if (disposed) return;
      capHero(); // the type changes the hero's height
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
      // a tag never sits under the words, the HUD or the nav. Read everything first, then write.
      let rects: DOMRect[] | null = null;
      const blockers = () =>
        (rects ??= [hud.current, document.querySelector<HTMLElement>(".nav .brand"), document.querySelector<HTMLElement>(".nav-cta"), ...(cv.parentElement?.querySelectorAll<HTMLElement>(".beat") ?? [])]
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
      FOCUS_LINES.forEach((ln, k) => {
        const el = lines.current[k];
        if (!el || fp < ln.at[0] - 0.01 || fp > ln.at[1] + 0.01) return; // only the one that is up (or about to be)
        // it is measured once per picture position and window size, not every frame
        const key = `${fit.ox.toFixed(1)}:${fit.oy.toFixed(1)}:${fit.w.toFixed(1)}:${vw}x${vh}`;
        if (placed[k] === key) return;
        placed[k] = key;
        const [bl, bt, br, bb] = focusBox(ln.box);
        const L = (fit.ox + bl * fit.w) / fit.dpr;
        const T = (fit.oy + bt * fit.h) / fit.dpr;
        const R = (fit.ox + br * fit.w) / fit.dpr;
        const B = (fit.oy + bb * fit.h) / fit.dpr;
        const gut = vw <= 600 ? 20 : 40;
        const set = (side: FocusSide | "band", maxW: number) => {
          el.dataset.side = side;
          el.style.maxWidth = `${Math.max(0, Math.round(maxW))}px`;
          return { w: el.offsetWidth, h: el.offsetHeight };
        };
        const put = (x: number, y: number) => void (el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`);
        if (vw < vh) {
          const top = (fit.oy + fit.h) / fit.dpr + 14;
          const { w } = set("band", Math.min(520, vw - 2 * gut));
          return put((vw - w) / 2, top);
        }
        const gap = vw <= 900 ? 22 : 36;
        const midY = (h: number) => Math.min(vh - h - 24, Math.max(84, (T + B) / 2 - h / 2));
        const tries: FocusSide[] = ln.side === "right" ? ["right", "left", "below", "above"] : ln.side === "left" ? ["left", "right", "below", "above"] : ln.side === "above" ? ["above", "below", "right", "left"] : ["below", "above", "right", "left"];
        for (const side of tries) {
          if (side === "right" || side === "left") {
            const room = side === "right" ? vw - R - gap - gut : L - gap - gut;
            if (room < 240) continue;
            const { w, h } = set(side, Math.min(vw <= 900 ? 300 : 440, room));
            return put(side === "right" ? R + gap : L - gap - w, midY(h));
          }
          const { w, h } = set(side, Math.min(640, vw - 2 * gut));
          const y = side === "below" ? B + 22 : T - 22 - h;
          if (y < 80 || y + h > vh - 20) continue;
          return put(Math.min(vw - gut - w, Math.max(gut, (L + R) / 2 - w / 2)), y);
        }
        const { w, h } = set("below", Math.min(640, vw - 2 * gut)); // nowhere is clear: the foot of the screen
        put((vw - w) / 2, vh - h - 20);
      });
    };

    const updateHud = (frame: number) => {
      const f = Math.round(frame);
      if (f === lastHud || !hud.current) return;
      lastHud = f;
      const y = yearAt(f) ?? YEARS[0];
      const set = (k: string, v: string) => {
        const el = hud.current!.querySelector<HTMLElement>(`[data-k="${k}"]`);
        if (el && el.textContent !== v) {
          el.textContent = v;
          const row = el.closest<HTMLElement>(".hud > div, .hud > header");
          row?.classList.remove("bump");
          void row?.offsetWidth;
          row?.classList.add("bump");
        }
      };
      set("year", y.year);
      set("team", String(y.team));
      set("revenue", y.revenue);
      set("margin", y.margin);
      set("take", y.take);
      set("lines", String(y.lines));
      hud.current.classList.toggle("first", y === YEARS[0]);
    };

    const loop = () => {
      raf = 0;
      if (disposed || !lo) return;
      const target = frameAt(scrollYProgress.get());
      // off screen: jump to the true frame, draw it once, then sleep, so the canvas is right when it scrolls back in
      if (!onScreen && cur === target && lastKey) return;
      raf = requestAnimationFrame(loop);
      const diff = target - cur;
      cur = reduced || !onScreen ? target : Math.abs(diff) < 0.02 ? target : cur + diff * 0.2;
      const i = Math.max(0, Math.min(lo.m.count - 1, Math.round(cur)));
      const dir = Math.sign(diff) || 1;
      // full quality when it is decoded (or one a frame or two away); the small set only fills gaps
      const hiHas = !!store?.blobs[i];
      const hi = store?.get(i) ?? null;
      store?.prefetch(i, dir, small ? 6 : 10);
      const bmp = hi ?? (hiHas ? store!.nearest(i, dir, 2) : null) ?? lo.peek(i) ?? lo.get(i) ?? lo.nearest(i, dir) ?? store?.nearest(i, dir) ?? null;
      if (!hiHas) lo.prefetch(i, dir, 6);
      const exact = !!(hi || lo.peek(i));
      const key = `${i}:${cv.width}x${cv.height}`;
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
        updateHud(cur);
        lastPlaced = cur;
      }
      placeLines();
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
        const at = Math.round(frameAt(scrollYProgress.get()));
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
          // the opening picture is the first impression: give the sharp one a moment to arrive (never long)
          const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
          const slow = !!conn && (!!conn.saveData || (conn.effectiveType ?? "4g") !== "4g");
          await Promise.race([hiStore.loadChunk(hiStore.chunkOf(at)).catch(() => undefined), new Promise((r) => setTimeout(r, slow ? 0 : 600))]);
          if (disposed) return;
          await hiStore.decode(at).catch(() => undefined);
          if (disposed) return;
        }
        void loadAnchors();
        cur = frameAt(scrollYProgress.get());
        if (scrollYProgress.get() > OPEN_P * 0.62) setHeroIn(true); // a reload or a link that lands past the opening
        setPhase("ready");
        await rest;
      } catch {
        // nothing here may leave the story dark or unlabelled
        if (!disposed) {
          setPhase("ready");
          start();
          void loadAnchors();
        }
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
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
        <div className="scrim" aria-hidden="true" />

        <div className="callouts" aria-hidden="true">
          {CALLOUTS.map((c, k) => (
            <div key={`${c.anchor}-${c.from}`} className={`callout side-${c.side ?? "right"} tone-${c.tone ?? "ink"}`} ref={(el) => void (callouts.current[k] = el)}>
              <span className="callout-line" />
              <span className="callout-tag">{c.text}</span>
            </div>
          ))}
        </div>

        {/* the blocks finish stacking beside the book they come from: the hardcover, the cover's own blocks on it */}
        <m.div className="hero" style={{ opacity: heroOpacity, y: heroY, pointerEvents: heroEvents }}>
          <m.figure className="hero-book" style={{ "--bx": BOOK.box[0], "--bf": BOOK.box[2] } as CSSProperties} initial={false} animate={{ opacity: shownHero ? 1 : 0, y: shownHero ? 0 : 28 }} transition={{ duration: 1.1, ease: [0.2, 0.75, 0.15, 1], delay: 0.1 }}>
            <img src={BOOK.src} srcSet={BOOK.srcSet} sizes="(max-width: 900px) and (orientation: landscape) 140px, (max-width: 900px) min(38vw, 204px), (max-width: 1100px) 220px, min(24vw, 438px)" width={BOOK.w} height={BOOK.h} alt={hero.cover} decoding="async" fetchPriority="high" draggable={false} />
          </m.figure>
          <div className="hero-text">
            <m.p className="hero-k" initial={false} animate={{ opacity: shownHero ? 1 : 0, y: shownHero ? 0 : 12 }} transition={{ duration: 0.7, delay: 0.05 }}>
              {hero.kicker}
            </m.p>
            <h1 className="hero-t">
              {hero.title.split("\n").map((line, n) => (
                <span className="ln" key={line}>
                  <m.span initial={false} animate={{ y: shownHero ? "0%" : "108%" }} transition={{ duration: 1, ease: [0.2, 0.75, 0.15, 1], delay: 0.1 + n * 0.1 }}>
                    {line}
                  </m.span>
                </span>
              ))}
            </h1>
            <m.p className="hero-s" initial={false} animate={{ opacity: shownHero ? 1 : 0, y: shownHero ? 0 : 14 }} transition={{ duration: 0.8, delay: 0.35 }}>
              {hero.sub}
            </m.p>
            <m.p className="hero-d" initial={false} animate={{ opacity: shownHero ? 1 : 0 }} transition={{ duration: 0.8, delay: 0.45 }}>
              {hero.detail}
            </m.p>
            <m.div className="hero-cta" style={{ visibility: heroVis }} initial={false} animate={{ opacity: shownHero ? 1 : 0, y: shownHero ? 0 : 14 }} transition={{ duration: 0.8, delay: 0.55 }}>
              <JoinLink label={hero.join} />
              <p className="hero-free">{hero.free}</p>
            </m.div>
          </div>
        </m.div>

        <m.div className="cue" style={{ opacity: cueOpacity, display: cueDisplay }} aria-hidden="true">
          <span>Scroll</span>
          <i />
        </m.div>

        <m.aside className="hud" ref={hud} style={{ opacity: hudOpacity }} aria-hidden="true">
          <header>
            <span>The margin inversion</span>
            <em data-k="year">Year 0</em>
          </header>
          <div>
            <span>Team</span>
            <b data-k="team">12</b>
            <i className="up">↑</i>
          </div>
          <div>
            <span>Revenue</span>
            <b data-k="revenue">$3M</b>
            <i className="up">↑</i>
          </div>
          <div>
            <span>Margin</span>
            <b data-k="margin">20%</b>
            <i className="down">↓</i>
          </div>
          <div>
            <span>Owner take</span>
            <b data-k="take">$900K</b>
            <i className="down">↓</i>
          </div>
          <div className="lines">
            <span>Communication pathways</span>
            <b data-k="lines">66</b>
            <i className="down">↑</i>
          </div>
          <footer>Illustration from Chapter 17</footer>
        </m.aside>

        {FOCUS && <m.div className="veil" style={{ opacity: veil }} aria-hidden="true" />}

        <div className="beats">
          {FOCUS
            ? FOCUS_LINES.map((ln, k) => <FocusLineView key={ln.id} id={ln.id} at={ln.at} progress={film} refEl={(el) => void (lines.current[k] = el)} />)
            : beats.map((b) => (
                <Fragment key={b.id}>
                  <BeatView beat={b} progress={film} />
                  {b.id === "collapse" && <MarginTable />}
                </Fragment>
              ))}
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

/** the HUD's numbers for screen readers, read where the story reaches them */
function MarginTable() {
  return (
    <div className="sr-only">
      <table>
        <caption>The margin inversion, an illustration from Chapter 17</caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Team</th>
            <th scope="col">Revenue</th>
            <th scope="col">Profit margin</th>
            <th scope="col">Owner take</th>
            <th scope="col">Communication pathways</th>
          </tr>
        </thead>
        <tbody>
          {YEARS.map((y) => (
            <tr key={y.year}>
              <th scope="row">{y.year}</th>
              <td>{y.team}</td>
              <td>{y.revenue}</td>
              <td>{y.margin}</td>
              <td>{y.take}</td>
              <td>{y.lines}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
