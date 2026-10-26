import { Fragment, useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import * as m from "motion/react-m";
import { FrameStore, fetchOk } from "../frames";
import { CALLOUTS, LAST_SHOT, OPEN_P, STORY_VH, YEARS, filmP, focusAt, frameAt, portraitFit, progressAt, sp, yearAt } from "../story";
import type { Beat } from "../copy";
import { CopyButton } from "./CopyButton";
import { ensureBootloader } from "../bootloader";
import { LINKS, preorderHref } from "../links";

type Anchors = { names: string[]; frames: Record<string, [number, number]>[] };

const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// below this opacity a control is treated as gone: no clicks, no Tab stop
const shown = (o: number) => (o > 0.05 ? "visible" : "hidden");

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
          <CopyButton source="story" size="lg" label="Copy the AI prompt" />
          <a className="ghost" href={preorderHref()}>
            {LINKS.preorder ? "Pre-order the book" : "The book"}
          </a>
        </m.div>
      )}
    </m.article>
  );
}

export function Story({ beats, hero }: { beats: Beat[]; hero: { kicker: string; title: string; sub: string; detail: string; preorder: string } }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const callouts = useRef<(HTMLDivElement | null)[]>([]);
  const hud = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [load, setLoad] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  // the film's own 0-1, after the opening (the beats, the chapters and the margin panel run on it)
  const film = useTransform(scrollYProgress, filmP);
  // the page opens on the blocks alone; the title arrives as they finish stacking, and leaves as the rush starts
  const heroOpacity = useTransform(scrollYProgress, [OPEN_P * 0.6, OPEN_P * 0.86, sp(0.02), sp(0.045)], [0, 1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [OPEN_P * 0.6, OPEN_P * 0.86, sp(0), sp(0.04)], reduced ? [0, 0, 0, 0] : [18, 0, 0, -40]);
  const [heroIn, setHeroIn] = useState(false);
  const heroVis = useTransform(heroOpacity, shown);
  const heroEvents = useTransform(heroOpacity, (o) => (o > 0.05 ? "auto" : "none"));
  const hudIn = progressAt(YEARS[0].from);
  const hudOpacity = useTransform(scrollYProgress, [hudIn - 0.01, hudIn + 0.004, sp(0.295), sp(0.305)], [0, 1, 1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.012], [1, 0]);
  // gone once faded, so its looping animation stops too
  const cueDisplay = useTransform(cueOpacity, (o) => (o > 0 ? "" : "none"));
  // the prompt is about to be wanted: make sure it is here, so the copy never waits on the network
  const fetched = useRef(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v > OPEN_P * 0.62 && !heroIn) setHeroIn(true);
    if (v > sp(0.6) && !fetched.current) {
      fetched.current = true;
      ensureBootloader("high").catch(() => {});
    }
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
    let lastHud = -1;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    // callout tags are static text: measure them once, not every frame
    const measure = () => {
      widths = callouts.current.map((el) => (el?.lastElementChild as HTMLElement | null)?.offsetWidth ?? 0);
      lastPlaced = Number.NaN;
    };
    const draw = (bmp: ImageBitmap, frame: number) => {
      const cw = cv.width;
      const ch = cv.height;
      const aspect = bmp.width / bmp.height;
      let dw: number;
      let dh: number;
      let oy: number;
      if (cw / ch < 1) {
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
      const ox = dw > cw ? Math.min(0, Math.max(cw - dw, cw / 2 - focusAt(frame) * dw)) : Math.min(cw - dw, Math.max(0, cw * 0.6 - focusAt(frame) * dw));
      ctx.drawImage(bmp, ox, oy, dw, dh);
      if (oy > 0) ctx.drawImage(bmp, 0, 0, bmp.width, 2, ox, 0, dw, oy + 1);
      if (oy + dh < ch) ctx.drawImage(bmp, 0, bmp.height - 2, bmp.width, 2, ox, oy + dh - 1, dw, ch - oy - dh + 1);
      if (ox > 0) ctx.drawImage(bmp, 0, 0, 2, bmp.height, 0, oy, ox + 1, dh);
      if (ox + dw < cw) ctx.drawImage(bmp, bmp.width - 2, 0, 2, bmp.height, ox + dw - 1, oy, cw - ox - dw + 1, dh);
      fit = { w: dw, h: dh, ox, oy, dpr: scale };
    };

    const resize = () => {
      const r = cv.getBoundingClientRect();
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
    void document.fonts?.ready.then(() => !disposed && measure());
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
      if (!anchors) return;
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
      anchors
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
        const hiOpen = FrameStore.open(`${import.meta.env.BASE_URL}frames/hi/`, hiLimit, decodeW, () => undefined).catch(() => null);
        const smallSet = await FrameStore.open(`${import.meta.env.BASE_URL}frames/lo/`, loLimit, 9999, () => setLoad(smallSet.loadedChunks / smallSet.chunkCount));
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

  const shownHero = phase !== "loading" && heroIn;
  return (
    <section ref={section} className={`story is-${phase}`} style={{ height: `${STORY_VH}vh` }} id="story">
      <div className="stage">
        <canvas
          ref={canvas}
          className="frames"
          role="img"
          aria-label="The Up, Side and Down blocks lie face up on a table, then stand up and stack. Blocks labelled with hires and tools are stacked on the Up, Side and Down blocks faster and faster until the tower falls over. Twelve painted system blocks widen the base into a three-colour foundation, the dead weight is cleared, and the same team is stacked back on it into a taller building that holds."
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

        <m.div className="hero" style={{ opacity: heroOpacity, y: heroY, pointerEvents: heroEvents }}>
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
            <CopyButton source="hero" size="lg" label="Copy the AI prompt" />
            <a className="ghost" href={preorderHref()}>
              {LINKS.preorder ? hero.preorder : "The book"}
            </a>
          </m.div>
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

        <div className="beats">
          {beats.map((b) => (
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
  ["Foundation", 0.385, 1],
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
