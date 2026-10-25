import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, type MotionValue } from "motion/react";
import * as m from "motion/react-m";
import { FrameStore } from "../frames";
import { CALLOUTS, HERO_FRAME, INTRO_FRAMES, STORY_VH, YEARS, focusAt, frameAt, portraitScale, progressAt, yearAt } from "../story";
import type { Beat } from "../copy";
import { CopyButton } from "./CopyButton";
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
    <m.article className={`beat beat-${beat.id} tone-${beat.tone ?? "ink"}`} style={{ opacity, y, pointerEvents: events }} aria-label={beat.headline}>
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
          <CopyButton size="lg" />
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
  const [phase, setPhase] = useState<"loading" | "intro" | "ready">("loading");
  const [load, setLoad] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.025], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.03], reduced ? [0, 0] : [0, -40]);
  const heroVis = useTransform(heroOpacity, shown);
  const hudIn = progressAt(YEARS[0].from);
  const hudOpacity = useTransform(scrollYProgress, [hudIn - 0.01, hudIn + 0.004, 0.405, 0.418], [0, 1, 1, 0]);
  const verdict = useTransform(scrollYProgress, [0.318, 0.332, 0.405, 0.418], [0, 1, 1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.012], [1, 0]);
  // gone once faded, so its looping animation stops too
  const cueDisplay = useTransform(cueOpacity, (o) => (o > 0 ? "flex" : "none"));

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
    let cur = HERO_FRAME;
    let introFrame = -1;
    let lastKey = "";
    let lastPlaced = Number.NaN;
    let fit = { w: 1, h: 1, ox: 0, oy: 0, dpr: 1 };
    let scale = 1; // the device pixel ratio the canvas was sized with
    let widths: number[] = [];
    let lastHud = -1;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    // callout tags are static text: measure them once, not every frame
    const measure = () => {
      widths = callouts.current.map((el) => (el?.lastElementChild as HTMLElement | null)?.offsetWidth ?? 0);
      lastPlaced = Number.NaN;
    };
    const resize = () => {
      const r = cv.getBoundingClientRect();
      scale = dpr();
      cv.width = Math.round(r.width * scale);
      cv.height = Math.round(r.height * scale);
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

    const draw = (bmp: ImageBitmap, frame: number) => {
      const cw = cv.width;
      const ch = cv.height;
      const aspect = bmp.width / bmp.height;
      let dw: number;
      let dh: number;
      let oy: number;
      if (cw / ch < 1) {
        // phones: sit the render low and continue its backdrop upward, leaving room for words
        dh = ch * portraitScale(frame);
        dw = Math.max(cw, dh * aspect);
        dh = dw / aspect;
        oy = ch - dh;
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
      if (ox > 0) ctx.drawImage(bmp, 0, 0, 2, bmp.height, 0, oy, ox + 1, dh);
      if (ox + dw < cw) ctx.drawImage(bmp, bmp.width - 2, 0, 2, bmp.height, ox + dw - 1, oy, cw - ox - dw + 1, dh);
      fit = { w: dw, h: dh, ox, oy, dpr: scale };
    };

    const placeCallouts = (frame: number) => {
      if (!anchors) return;
      const row = anchors.frames[Math.max(0, Math.min(anchors.frames.length - 1, Math.round(frame)))];
      const vw = cv.clientWidth;
      const vh = cv.clientHeight;
      // a tag never sits under the words, the HUD or the nav. Read everything first, then write.
      let rects: DOMRect[] | null = null;
      const blockers = () =>
        (rects ??= [hud.current, cv.parentElement?.querySelector<HTMLElement>(".hud .verdict"), document.querySelector<HTMLElement>(".nav .brand"), document.querySelector<HTMLElement>(".nav-cta"), ...(cv.parentElement?.querySelectorAll<HTMLElement>(".beat") ?? [])]
          .filter((e): e is HTMLElement => !!e && parseFloat(getComputedStyle(e).opacity) > 0.3)
          .map((e) => e.getBoundingClientRect()));
      const plan = CALLOUTS.map((c, k) => {
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
      if (disposed || !onScreen || !lo) return;
      raf = requestAnimationFrame(loop);
      const target = introFrame >= 0 ? introFrame : frameAt(scrollYProgress.get());
      const diff = target - cur;
      cur = reduced || introFrame >= 0 ? target : Math.abs(diff) < 0.02 ? target : cur + diff * 0.2;
      const i = Math.max(0, Math.min(lo.m.count - 1, Math.round(cur)));
      const dir = Math.sign(diff) || 1;
      // full quality when it is decoded (or one a frame or two away); the small set only fills gaps
      const hiHas = !!store?.blobs[i];
      const hi = store?.get(i) ?? null;
      store?.prefetch(i, dir, small ? 6 : 10);
      const bmp = hi ?? (hiHas ? store!.nearest(i, dir, 2) : null) ?? lo.peek(i) ?? lo.get(i) ?? lo.nearest(i, dir) ?? store?.nearest(i, dir) ?? null;
      if (!hiHas) lo.prefetch(i, dir, 6);
      const exact = !!(hi || lo.peek(i));
      const key = `${i}:${cv.width}x${cv.height}:${bmp ? bmp.width : 0}`;
      if (bmp && key !== lastKey) {
        draw(bmp, i);
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
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) start();
    });
    io.observe(cv);

    const loadAnchors = () =>
      fetch(`${import.meta.env.BASE_URL}anchors.json`)
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
        const smallSet = await FrameStore.open(`${import.meta.env.BASE_URL}frames/lo/`, loLimit, 9999, () => setLoad(smallSet.loadedChunks / smallSet.chunkCount));
        if (disposed) return smallSet.dispose();
        // let a restored scroll position (reload, deep link) land before deciding where the story starts
        await new Promise((r) => requestAnimationFrame(r));
        const playIntro = window.scrollY < 40 && !reduced;
        const at = playIntro ? 0 : Math.round(frameAt(scrollYProgress.get()));
        lo = smallSet;
        // only the chunk on screen holds the story up; the rest streams behind the intro
        await lo.loadChunk(lo.chunkOf(at));
        if (disposed) return;
        void lo.loadAll([], 2);
        if (playIntro) introFrame = 0;
        cur = at;
        lo.aim(at);
        const first = Math.max(0, Math.min(lo.m.count - (loLimit - 4), at - 4));
        await Promise.all(Array.from({ length: Math.min(INTRO_FRAMES, loLimit - 4) }, (_, f) => lo!.decode(playIntro ? f : first + f)));
        if (disposed) return;
        start();
        // full-quality frames, intro frames first
        const hiStore = await FrameStore.open(`${import.meta.env.BASE_URL}frames/hi/`, hiLimit, decodeW, () => undefined);
        if (disposed) return hiStore.dispose();
        store = hiStore;
        hiStore.aim(at);
        const introChunks = [...new Set(Array.from({ length: INTRO_FRAMES }, (_, f) => hiStore.chunkOf(Math.min(hiStore.m.count - 1, at + f))))];
        const rest = hiStore.loadAll(introChunks, 2);
        if (playIntro) {
          await Promise.race([Promise.all(introChunks.map((c) => hiStore.loadChunk(c))), new Promise((r) => setTimeout(r, 600))]);
          if (disposed) return;
          await Promise.all(Array.from({ length: Math.min(INTRO_FRAMES, hiLimit - 4) }, (_, f) => hiStore.decode(f)));
          if (disposed) return;
          setPhase("intro");
          void loadAnchors();
          const t0 = performance.now();
          await new Promise<void>((done) => {
            const step = () => {
              const f = Math.floor(((performance.now() - t0) / 1000) * 24);
              introFrame = Math.min(HERO_FRAME, f);
              // scrolling ends the intro at once, so the words and the frames never disagree
              if (f >= HERO_FRAME || disposed || window.scrollY > 40) {
                introFrame = -1;
                done();
              } else requestAnimationFrame(step);
            };
            step();
          });
        } else void loadAnchors();
        if (disposed) return;
        introFrame = -1;
        cur = frameAt(scrollYProgress.get());
        setPhase("ready");
        await rest;
      } catch {
        introFrame = -1;
        if (!disposed) setPhase("ready");
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mq.removeEventListener("change", onDpr);
      lo?.dispose();
      store?.dispose();
    };
  }, [scrollYProgress]);

  const shownHero = phase !== "loading";
  return (
    <section ref={section} className={`story is-${phase}`} style={{ height: `${STORY_VH}vh` }} id="story">
      <div className="stage">
        <canvas
          ref={canvas}
          className="frames"
          role="img"
          aria-label="A stack of wooden blocks labelled with hires and tools grows past twelve and the top falls. Two blocks, Agency and 43 apps, are pulled out, the wreckage is cleared, and one Systems block lands on a stack that holds."
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

        <m.div className="hero" style={{ opacity: heroOpacity, y: heroY, visibility: heroVis }}>
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
          <m.div className="hero-cta" initial={false} animate={{ opacity: shownHero ? 1 : 0, y: shownHero ? 0 : 14 }} transition={{ duration: 0.8, delay: 0.55 }}>
            <CopyButton size="lg" />
            <a className="ghost" href={preorderHref()}>
              {LINKS.preorder ? hero.preorder : "The book"}
            </a>
          </m.div>
        </m.div>

        <m.div className="cue" style={{ opacity: cueOpacity, display: cueDisplay }} aria-hidden="true">
          <span>Scroll</span>
          <i />
        </m.div>

        <m.aside className="hud" ref={hud} style={{ opacity: hudOpacity }} aria-label="The margin inversion, an illustration from Chapter 17">
          <header aria-hidden="true">
            <span>The margin inversion</span>
            <em data-k="year">Year 0</em>
          </header>
          <div aria-hidden="true">
            <span>Team</span>
            <b data-k="team">12</b>
            <i className="up">↑</i>
          </div>
          <div aria-hidden="true">
            <span>Revenue</span>
            <b data-k="revenue">$3M</b>
            <i className="up">↑</i>
          </div>
          <div aria-hidden="true">
            <span>Margin</span>
            <b data-k="margin">20%</b>
            <i className="down">↓</i>
          </div>
          <div aria-hidden="true">
            <span>Owner take</span>
            <b data-k="take">$900K</b>
            <i className="down">↓</i>
          </div>
          <div className="lines" aria-hidden="true">
            <span>Communication pathways</span>
            <b data-k="lines">66</b>
            <i className="down">↑</i>
          </div>
          <table className="sr-only">
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
          <m.p className="verdict" style={{ opacity: verdict }}>
            The founder doubled the team, increased revenue 40%, and lost 83% of their income.
          </m.p>
          <footer>Illustration from Chapter 17</footer>
        </m.aside>

        <div className="beats">
          {beats.map((b) => (
            <BeatView key={b.id} beat={b} progress={scrollYProgress} />
          ))}
        </div>

        <Chapters progress={scrollYProgress} />

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
  ["Grow", 0.04, 0.3],
  ["Break", 0.3, 0.585],
  ["Up · Side · Down", 0.585, 1],
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
