import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { FrameStore } from "../frames";
import { CALLOUTS, HERO_FRAME, INTRO_FRAMES, STORY_VH, YEARS, focusAt, frameAt, portraitScale, progressAt, yearAt } from "../story";
import type { Beat } from "../copy";
import { CopyButton } from "./CopyButton";
import { LINKS, preorderHref } from "../links";

type Anchors = { names: string[]; frames: Record<string, [number, number, number]>[] };

const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function BeatView({ beat, progress }: { beat: Beat; progress: MotionValue<number> }) {
  const [a, b] = beat.at;
  // fade in and out inside the window so neighbouring beats never overlap
  const f = Math.min(0.014, (b - a) / 4);
  const range = [a, a + f, b - f, b];
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, [28, 0, 0, -22]);
  const events = useTransform(opacity, (o) => (o > 0.6 ? "auto" : "none"));
  return (
    <motion.article className={`beat beat-${beat.id} tone-${beat.tone ?? "ink"}`} style={{ opacity, y, pointerEvents: events }} aria-label={beat.headline}>
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
        <div className="beat-cta">
          <CopyButton size="lg" />
          <a className="ghost" href={preorderHref()}>
            {LINKS.preorder ? "Pre-order the book" : "The book"}
          </a>
        </div>
      )}
    </motion.article>
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
  const heroY = useTransform(scrollYProgress, [0, 0.03], [0, -40]);
  const hudIn = progressAt(YEARS[0].from);
  const hudOpacity = useTransform(scrollYProgress, [hudIn - 0.01, hudIn + 0.004, 0.405, 0.418], [0, 1, 1, 0]);
  const verdict = useTransform(scrollYProgress, [0.318, 0.332, 0.405, 0.418], [0, 1, 1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.012], [1, 0]);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d", { alpha: false })!;
    let store: FrameStore | null = null; // full-quality frames
    let lo: FrameStore | null = null; // tiny frames that load first, so the story starts at once
    let anchors: Anchors | null = null;
    let raf = 0;
    let disposed = false;
    let cur = HERO_FRAME;
    let introFrame = -1;
    let lastKey = "";
    let fit = { w: 1, h: 1, ox: 0, oy: 0, dpr: 1 };
    let lastHud = -1;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = cv.getBoundingClientRect();
      const d = dpr();
      cv.width = Math.round(r.width * d);
      cv.height = Math.round(r.height * d);
      lastKey = "";
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();

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
      fit = { w: dw, h: dh, ox, oy, dpr: dpr() };
    };

    const placeCallouts = (frame: number) => {
      if (!anchors) return;
      const row = anchors.frames[Math.max(0, Math.min(anchors.frames.length - 1, Math.round(frame)))];
      // a tag never sits under the words, the HUD or the nav
      let rects: DOMRect[] | null = null;
      const blockers = () =>
        (rects ??= [hud.current, cv.parentElement?.querySelector<HTMLElement>(".hud .verdict"), document.querySelector<HTMLElement>(".nav .brand"), document.querySelector<HTMLElement>(".nav-cta"), ...(cv.parentElement?.querySelectorAll<HTMLElement>(".beat") ?? [])]
          .filter((e): e is HTMLElement => !!e && parseFloat(getComputedStyle(e).opacity) > 0.3)
          .map((e) => e.getBoundingClientRect()));
      const vw = cv.clientWidth;
      CALLOUTS.forEach((c, k) => {
        const el = callouts.current[k];
        if (!el) return;
        const fade = 2.5;
        const o = Math.max(0, Math.min(1, (frame - c.from) / fade, (c.to - frame) / fade));
        const a = row[c.anchor];
        if (!a || o <= 0.01 || a[0] < -0.1 || a[0] > 1.1 || a[1] < -0.1 || a[1] > 1.1) {
          el.style.opacity = "0";
          return;
        }
        const x = (fit.ox + a[0] * fit.w) / fit.dpr;
        const y = (fit.oy + a[1] * fit.h) / fit.dpr;
        const tw = (el.lastElementChild as HTMLElement).offsetWidth;
        let side = c.side ?? "right";
        if (side === "right" && x + 80 + tw > vw - 12) side = "left";
        else if (side === "left" && x - 80 - tw < 12) side = "right";
        el.classList.toggle("side-left", side === "left");
        el.classList.toggle("side-right", side === "right");
        const left = side === "right" ? x + 80 : x - 80 - tw;
        const blocked = blockers().some((r) => y + 14 > r.top && y - 14 < r.bottom && left + tw > r.left && left < r.right);
        if (blocked || y < 92 || y > window.innerHeight - 70 || left < 12 || left + tw > vw - 12) {
          el.style.opacity = "0";
          return;
        }
        el.style.opacity = String(o);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
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
          const row = el.closest("div");
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
      raf = requestAnimationFrame(loop);
      if (!lo) return;
      const target = introFrame >= 0 ? introFrame : frameAt(scrollYProgress.get());
      const diff = target - cur;
      cur = reduced || introFrame >= 0 ? target : Math.abs(diff) < 0.02 ? target : cur + diff * 0.2;
      const i = Math.max(0, Math.min(lo.m.count - 1, Math.round(cur)));
      const dir = Math.sign(diff);
      const hi = store?.get(i) ?? null;
      store?.prefetch(i, dir || 1);
      const bmp = hi ?? lo.get(i) ?? lo.nearest(i, dir);
      lo.prefetch(i, dir || 1, 6);
      const key = `${i}:${cv.width}x${cv.height}:${bmp ? bmp.width : 0}`;
      if (bmp && key !== lastKey) {
        draw(bmp, i);
        lastKey = hi || lo.get(i) ? key : "";
      }
      placeCallouts(cur);
      updateHud(cur);
    };

    (async () => {
      try {
        const small = Math.min(window.innerWidth, window.innerHeight) < 700;
        const decodeW = Math.min(1600, Math.round(Math.max(window.innerWidth, window.innerHeight * 1.6) * dpr()));
        lo = await FrameStore.open(`${import.meta.env.BASE_URL}frames/lo/`, 90, 9999, () => {
          if (lo) setLoad(lo.loadedChunks / lo.chunkCount);
        });
        fetch(`${import.meta.env.BASE_URL}anchors.json`)
          .then((r) => r.json())
          .then((a: Anchors) => (anchors = a))
          .catch(() => undefined);
        await lo.loadAll([0], 4);
        if (disposed) return;
        await Promise.all(Array.from({ length: INTRO_FRAMES }, (_, f) => lo!.decode(f)));
        raf = requestAnimationFrame(loop);
        // full-quality frames stream in behind, intro frames first
        const hiStore = await FrameStore.open(`${import.meta.env.BASE_URL}frames/hi/`, small ? 18 : 32, decodeW, () => undefined);
        store = hiStore;
        const introChunks = [...new Set(Array.from({ length: INTRO_FRAMES }, (_, f) => hiStore.chunkOf(f)))];
        const rest = hiStore.loadAll(introChunks, 2);
        const atTop = window.scrollY < 40;
        if (atTop && !reduced) {
          await Promise.race([Promise.all(introChunks.map((c) => hiStore.loadChunk(c))), new Promise((r) => setTimeout(r, 2500))]);
          await Promise.all(Array.from({ length: INTRO_FRAMES }, (_, f) => hiStore.decode(f)));
          setPhase("intro");
          const t0 = performance.now();
          await new Promise<void>((done) => {
            const step = () => {
              const f = Math.floor(((performance.now() - t0) / 1000) * 24);
              introFrame = Math.min(HERO_FRAME, f);
              if (f >= HERO_FRAME || disposed) {
                introFrame = -1;
                done();
              } else requestAnimationFrame(step);
            };
            step();
          });
        }
        cur = frameAt(scrollYProgress.get());
        setPhase("ready");
        await rest;
      } catch {
        setPhase("ready");
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [scrollYProgress]);

  return (
    <section ref={section} className={`story is-${phase}`} style={{ height: `${STORY_VH}vh` }} id="story">
      <div className="stage">
        <canvas ref={canvas} className="frames" aria-label="A stack of wooden blocks labelled with hires and tools grows past twelve, the top falls, and the rest is rebuilt into a stack of ten that holds" />
        <div className="scrim" aria-hidden="true" />

        <div className="callouts" aria-hidden="true">
          {CALLOUTS.map((c, k) => (
            <div key={`${c.anchor}-${c.from}`} className={`callout side-${c.side ?? "right"} tone-${c.tone ?? "ink"}`} ref={(el) => void (callouts.current[k] = el)}>
              <span className="callout-line" />
              <span className="callout-tag">{c.text}</span>
            </div>
          ))}
        </div>

        <motion.div className="hero" style={{ opacity: heroOpacity, y: heroY }}>
          <motion.p className="hero-k" initial={false} animate={{ opacity: phase === "ready" ? 1 : 0, y: phase === "ready" ? 0 : 12 }} transition={{ duration: 0.7, delay: 0.05 }}>
            {hero.kicker}
          </motion.p>
          <h1 className="hero-t">
            {hero.title.split("\n").map((line, n) => (
              <span className="ln" key={line}>
                <motion.span initial={false} animate={{ y: phase === "ready" ? "0%" : "108%" }} transition={{ duration: 1, ease: [0.2, 0.75, 0.15, 1], delay: 0.1 + n * 0.1 }}>
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p className="hero-s" initial={false} animate={{ opacity: phase === "ready" ? 1 : 0, y: phase === "ready" ? 0 : 14 }} transition={{ duration: 0.8, delay: 0.35 }}>
            {hero.sub}
          </motion.p>
          <motion.p className="hero-d" initial={false} animate={{ opacity: phase === "ready" ? 1 : 0 }} transition={{ duration: 0.8, delay: 0.45 }}>
            {hero.detail}
          </motion.p>
          <motion.div className="hero-cta" initial={false} animate={{ opacity: phase === "ready" ? 1 : 0, y: phase === "ready" ? 0 : 14 }} transition={{ duration: 0.8, delay: 0.55 }}>
            <CopyButton size="lg" />
            <a className="ghost" href={preorderHref()}>
              {LINKS.preorder ? hero.preorder : "The book"}
            </a>
          </motion.div>
        </motion.div>

        <motion.div className="cue" style={{ opacity: cueOpacity }} aria-hidden="true">
          <span>Scroll</span>
          <i />
        </motion.div>

        <motion.aside className="hud" ref={hud} style={{ opacity: hudOpacity }} aria-label="The margin inversion, an illustration from Chapter 17">
          <header>
            <span>The margin inversion</span>
            <em data-k="year">Year 0</em>
          </header>
          <div>
            <span>Team</span>
            <b data-k="team">12</b>
            <i className="up" aria-hidden="true">↑</i>
          </div>
          <div>
            <span>Revenue</span>
            <b data-k="revenue">$3M</b>
            <i className="up" aria-hidden="true">↑</i>
          </div>
          <div>
            <span>Margin</span>
            <b data-k="margin">20%</b>
            <i className="down" aria-hidden="true">↓</i>
          </div>
          <div>
            <span>Owner take</span>
            <b data-k="take">$900K</b>
            <i className="down" aria-hidden="true">↓</i>
          </div>
          <div className="lines">
            <span>Communication pathways</span>
            <b data-k="lines">66</b>
            <i className="down" aria-hidden="true">↑</i>
          </div>
          <motion.p className="verdict" style={{ opacity: verdict }}>
            The founder doubled the team, increased revenue 40%, and lost 83% of their income.
          </motion.p>
          <footer>Illustration from Chapter 17</footer>
        </motion.aside>

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
    <motion.ol className="chapters" style={{ opacity: show }} aria-hidden="true">
      {CHAPTERS.map(([name, a, b]) => (
        <Chapter key={name} name={name} a={a} b={b} progress={progress} />
      ))}
    </motion.ol>
  );
}

function Chapter({ name, a, b, progress }: { name: string; a: number; b: number; progress: MotionValue<number> }) {
  const fill = useTransform(progress, [a, b], [0, 1], { clamp: true });
  const on = useTransform(progress, (p) => (p >= a && p < b ? 1 : 0.62));
  return (
    <motion.li style={{ opacity: on }}>
      <span>{name}</span>
      <i>
        <motion.b style={{ scaleX: fill }} />
      </i>
    </motion.li>
  );
}
