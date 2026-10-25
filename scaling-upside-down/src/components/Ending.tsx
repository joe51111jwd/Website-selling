import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import type { SiteCopy } from "../copy";
import { copyNow } from "../bootloader";
import { getCopy, useCopy } from "../copyStore";
import geo from "../flatlay.json";
import { AssistantChips } from "./AssistantChips";
import { CopyButton } from "./CopyButton";
import { openNotice } from "./NoticeDialog";

const BASE = import.meta.env.BASE_URL;
const win = typeof window !== "undefined";
const reduced = win && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const phone = win && window.matchMedia("(max-width: 900px)").matches;
const coarse = win && window.matchMedia("(pointer: coarse)").matches;
const mac = win && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const query = win ? new URLSearchParams(window.location.search) : new URLSearchParams();
const still = <T,>(a: T[]) => (reduced ? a.map(() => a[a.length - 1]) : a);

/* ---------- E1 · the couplet: two lines in two focal planes ---------- */

export function Couplet({ copy }: { copy: SiteCopy["ending"]["couplet"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end end"] });
  // phones and small CPUs skip the blurred copies; the focus pull is opacity and scale alone
  const [lite] = useState(() => reduced || phone || (navigator.hardwareConcurrency ?? 8) <= 4);
  // with reduced motion nothing pulls focus, so the first line simply stays readable
  const backSharp = useTransform(p, [0.25, 0.7], reduced ? [1, 1] : lite ? [1, 0.38] : [1, 0]);
  const backSoft = useTransform(p, [0.25, 0.7], still([0, 0.5]));
  const backScale = useTransform(p, [0.2, 0.8], still(lite ? [1, 0.97] : [1, 0.95]));
  const backY = useTransform(p, [0.2, 0.8], still(lite ? [0, 0] : [40, -10]));
  const frontSoft = useTransform(p, [0.2, 0.45, 0.8], still([0, 0.55, 0]));
  const frontSharp = useTransform(p, lite ? [0.3, 0.8] : [0.45, 0.85], still([0, 1]));
  const frontScale = useTransform(p, [0.3, 0.9], still(lite ? [1.03, 1] : [1.05, 1]));
  const frontY = useTransform(p, [0.3, 0.9], still(lite ? [12, 0] : [-30, 0]));
  const leadO = useTransform(p, [0.72, 0.95], still([0, 1]));
  const leadY = useTransform(p, [0.72, 0.95], still([14, 0]));
  return (
    <section className={`couplet${lite ? " is-lite" : ""}`} ref={ref}>
      <div className="couplet-in">
        <m.p className="cp-back" style={{ scale: backScale, y: backY }}>
          <m.span className="cp-sharp" style={{ opacity: backSharp }}>
            {copy.back}
          </m.span>
          {!lite && (
            <m.span className="cp-soft" aria-hidden="true" style={{ opacity: backSoft }}>
              {copy.back}
            </m.span>
          )}
        </m.p>
        <m.h2 className="cp-front" style={{ scale: frontScale, y: frontY }}>
          <m.span className="cp-sharp" style={{ opacity: frontSharp }}>
            {copy.front}
          </m.span>
          {!lite && (
            <m.span className="cp-soft" aria-hidden="true" style={{ opacity: frontSoft }}>
              {copy.front}
            </m.span>
          )}
        </m.h2>
        <m.p className="cp-lead" style={{ opacity: leadO, y: leadY }}>
          {copy.lead}
        </m.p>
      </div>
    </section>
  );
}

/* ---------- E2 · the desk: the three blocks are the stamp ---------- */

type Box = { box: number[]; c: number[] };
const KEYS = ["up", "side", "down"] as const;
const BLOCKS = geo.blocks as Record<(typeof KEYS)[number], Box>;
const RENDER = geo.render;
const pct = (n: number) => `${n}%`;
const HIT = (() => {
  const b = KEYS.map((k) => BLOCKS[k].box);
  const l = Math.min(...b.map((x) => x[0]));
  const t = Math.min(...b.map((x) => x[1]));
  return { left: pct(l), top: pct(t), width: pct(Math.max(...b.map((x) => x[0] + x[2])) - l), height: pct(Math.max(...b.map((x) => x[1] + x[3])) - t) };
})();
const boxStyle = (k: (typeof KEYS)[number]) => {
  const [l, t, w, h] = BLOCKS[k].box;
  return { left: pct(l), top: pct(t), width: pct(w), height: pct(h) };
};

type Stage = "idle" | "lifting" | "away" | "copied" | "error";
const initialStage = (): Stage => (query.get("ending") === "copied" ? "copied" : query.get("ending") === "error" ? "error" : "idle");

export function Desk({ copy }: { copy: SiteCopy["ending"]["desk"] }) {
  const { seq, words } = useCopy();
  const desk = useRef<HTMLElement>(null);
  const slots = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const [stage, setStage] = useState<Stage>(initialStage);
  const [press, setPress] = useState(false);
  const [instant, setInstant] = useState(stage !== "idle");
  const [reink, setReink] = useState(false);
  const [nudge, setNudge] = useState(false);
  const now = useRef(stage);
  const timers = useRef<number[]>([]);
  const pressTimer = useRef(0);
  const pressShown = useRef(false);
  const start = useRef<[number, number] | null>(null);
  const seen = useRef(seq);
  const ratio = useRef(0);
  const touched = useRef(false); // hovered or pressed: no nudge needed

  const go = (s: Stage) => {
    now.current = s;
    setStage(s);
  };
  const later = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(
    () => () => {
      clearTimers();
      window.clearTimeout(pressTimer.current);
    },
    [],
  );

  // the blocks lift, leave, and their faces are left printed in the slots
  const ritual = (p: Promise<number>, own: boolean) => {
    const s = now.current;
    const shown = pressShown.current;
    pressShown.current = false;
    if (s === "lifting" || s === "away") return setPress(false); // already on its way
    if (s === "copied") {
      setPress(false);
      setInstant(false);
      p.then(
        () => {
          setReink(true);
          later(320, () => setReink(false));
        },
        () => {
          clearTimers();
          setInstant(true);
          go("error");
        },
      );
      return;
    }
    clearTimers();
    setInstant(false);
    if (reduced) {
      p.then(
        () => go("copied"),
        () => go("error"),
      );
      return;
    }
    const t0 = performance.now();
    if (own && !shown) {
      setPress(true);
      later(90, () => {
        setPress(false);
        go("lifting");
      });
    } else {
      setPress(false);
      go("lifting");
    }
    p.then(
      () =>
        later(Math.max(0, 360 - (performance.now() - t0)), () => {
          go("away");
          later(660, () => go("copied"));
        }),
      () => {
        clearTimers();
        setPress(false);
        go("error");
      },
    );
  };

  const activate = () => {
    const p = copyNow("stamp"); // first, inside the click
    window.clearTimeout(pressTimer.current);
    touched.current = true;
    ritual(p, true);
    return p;
  };

  // a copy from anywhere else on the page: play it here if the desk is in view, otherwise just show the result
  useEffect(() => {
    if (seq === seen.current) return;
    seen.current = seq;
    if (getCopy().source === "stamp" && now.current !== "error") return;
    const s = now.current;
    if (s !== "idle" && s !== "error") return;
    if (ratio.current >= 0.4 && !reduced) ritual(Promise.resolve(getCopy().words), false);
    else {
      clearTimers();
      setInstant(true);
      go("copied");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  // the press: at once for a mouse, after 80ms of stillness for a finger (so a scroll never stamps)
  const down = (e: RPointerEvent) => {
    touched.current = true;
    if (e.pointerType === "mouse") {
      if (e.button !== 0) return;
      pressShown.current = true;
      setPress(true);
      return;
    }
    start.current = [e.clientX, e.clientY];
    window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => {
      pressShown.current = true;
      setPress(true);
      navigator.vibrate?.(8);
    }, 80);
  };
  const cancel = () => {
    window.clearTimeout(pressTimer.current);
    start.current = null;
    if (pressShown.current) {
      pressShown.current = false;
      setPress(false);
    }
  };
  const move = (e: RPointerEvent) => {
    const s0 = start.current;
    if (s0 && Math.hypot(e.clientX - s0[0], e.clientY - s0[1]) > 8) cancel();
  };
  const key = (e: KeyboardEvent) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      pressShown.current = true;
      setPress(true);
    }
  };
  // a finger that lifts without a click (a long hold) lets go of the press
  const up = () => {
    window.clearTimeout(pressTimer.current);
    start.current = null;
    window.setTimeout(() => pressShown.current && now.current !== "lifting" && cancel(), 350);
  };
  const press$ = { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: cancel, onPointerLeave: (e: RPointerEvent) => e.pointerType === "mouse" && cancel() };

  // how much of the desk is in view; the nav's copy button steps aside while the desk's own is on screen
  useEffect(() => {
    const d = desk.current;
    const b = pill.current;
    const s = slots.current;
    if (!d || !b || !s) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => (ratio.current = e.intersectionRatio)), { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });
    const ioPill = new IntersectionObserver(([e]) => {
      if (e.intersectionRatio >= 0.5) document.documentElement.dataset.stamp = "";
      else delete document.documentElement.dataset.stamp;
    }, { threshold: [0, 0.5, 1] });
    // once per visit: if the slots sit in view for 4s untouched, the blocks breathe once
    let wait = 0;
    let nudged = false;
    try {
      nudged = sessionStorage.getItem("susd:nudged") === "1";
    } catch {
      /* ignore */
    }
    const ioSlots = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(wait);
        if (nudged || reduced || e.intersectionRatio < 0.6) return;
        wait = window.setTimeout(() => {
          if (touched.current || now.current !== "idle" || getCopy().seq > 0) return;
          nudged = true;
          try {
            sessionStorage.setItem("susd:nudged", "1");
          } catch {
            /* ignore */
          }
          setNudge(true);
          later(900, () => setNudge(false));
        }, 4000);
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(d);
    ioPill.observe(b);
    ioSlots.observe(s);
    return () => {
      io.disconnect();
      ioPill.disconnect();
      ioSlots.disconnect();
      window.clearTimeout(wait);
      delete document.documentElement.dataset.stamp;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // depth: the light pool drifts, the sheet floats a little, the props slide past; the blocks set down on arrival
  const { scrollYProgress: pass } = useScroll({ target: desk, offset: ["start end", "end start"] });
  const { scrollYProgress: arrive } = useScroll({ target: desk, offset: ["start end", "start 0.2"] });
  const enter = useTransform(arrive, (v) => (reduced ? 0 : 1 - v));
  const poolX = useTransform(pass, [0, 1], still(["-2%", "2%"]));
  const sheetY = useTransform(pass, [0, 1], still([14, -14]));
  const propY = useTransform(pass, [0, 1], still([120, -120]));
  const propY2 = useTransform(pass, [0, 1], still([60, -180]));

  const stamped = stage === "away" || stage === "copied";
  const img = (name: string) => `${BASE}flatlay/${name}`;
  const srcs = (k: string, blur = "") => ({
    src: img(`blk_${k}${blur}_1280.webp`),
    srcSet: `${img(`blk_${k}${blur}_820.webp`)} 820w, ${img(`blk_${k}${blur}_1280.webp`)} 1280w`,
    sizes: "(max-width: 900px) 420px, 600px",
  });

  return (
    <m.section
      ref={desk}
      className={`desk${RENDER ? "" : " is-css"}${query.get("flatlay") === "debug" ? " is-debug" : ""}`}
      id="bootloader"
      aria-labelledby="desk-h"
      data-state={stage}
      data-press={press ? "" : undefined}
      data-nudge={nudge ? "" : undefined}
      data-instant={instant ? "" : undefined}
      data-reink={reink ? "" : undefined}
      style={{ "--enter": enter } as unknown as CSSProperties}
    >
      <m.div className="desk-pool" style={{ x: poolX }} aria-hidden="true" />
      {RENDER && (
        <>
          <m.img className="desk-prop prop-leads" src={img("prop_leads.webp")} alt="" aria-hidden="true" loading="lazy" decoding="async" style={{ y: propY }} />
          <m.img className="desk-prop prop-hire12" src={img("prop_hire12.webp")} alt="" aria-hidden="true" loading="lazy" decoding="async" style={{ y: propY2 }} />
        </>
      )}
      <div className="desk-in">
        <div className="desk-copy">
          <p className="kick">
            <i className="dot up" />
            {copy.kicker}
          </p>
          <h2 id="desk-h">{copy.headline}</h2>
          <p className="desk-sub">{copy.sub}</p>
        </div>
        <div className="desk-stack">
          <m.div className="sheet" style={{ y: sheetY }}>
            <div className="sheet-head">
              <span>SUSD-Bootloader.md</span>
              <button type="button" className="notice-link" onClick={(e) => openNotice(e.currentTarget)}>
                Use notice
              </button>
            </div>
            <ol className="steps" id="desk-steps">
              <li style={{ "--i": 0 } as CSSProperties}>
                <span className="cap-l">
                  01 {stamped ? "Copied" : "Copy"}
                  {stamped && <span aria-hidden="true"> ✓</span>}
                </span>
                <span className="cap-s">{words ? `${words.toLocaleString()} words` : "the whole file"}</span>
              </li>
              <li style={{ "--i": 1 } as CSSProperties}>
                <span className="cap-l">
                  02 Paste
                  {stamped && !coarse && (
                    <span className="keys" aria-hidden="true">
                      <kbd>{mac ? "⌘" : "Ctrl"}</kbd>
                      <kbd>V</kbd>
                    </span>
                  )}
                </span>
                <span className="cap-s">
                  into your AI
                  {stamped && coarse && <span className="longpress">Long-press → Paste</span>}
                </span>
              </li>
              <li style={{ "--i": 2 } as CSSProperties}>
                <span className="cap-l">03 Answer</span>
                <span className="cap-s">{copy.answer}</span>
              </li>
            </ol>
            <div className="slots" ref={slots} aria-hidden="true">
              <div className="frame">
                {KEYS.map((k) => (
                  <i key={`s-${k}`} className="slot" style={boxStyle(k)} />
                ))}
                {KEYS.map((k, i) => (
                  <img key={`p-${k}`} className="print" src={img(`print_${k}.webp`)} alt="" decoding="async" draggable={false} style={{ ...boxStyle(k), "--i": i } as CSSProperties} />
                ))}
                {KEYS.map((k, i) => {
                  const b = BLOCKS[k];
                  const vars = { "--i": i, "--cx": pct(b.c[0]), "--cy": pct(b.c[1]) } as CSSProperties;
                  return RENDER ? (
                    <div key={k} className={`blk blk-${k}`} style={vars}>
                      <img className="blk-shd rest" src={img(`shd_${k}_rest.webp`)} alt="" loading="lazy" decoding="async" draggable={false} />
                      <img className="blk-shd lift" src={img(`shd_${k}_lift.webp`)} alt="" loading="lazy" decoding="async" draggable={false} />
                      <div className="blk-body">
                        <img className="blk-face" {...srcs(k)} alt="" loading="lazy" decoding="async" draggable={false} />
                        <img className="blk-blur" {...srcs(k, "_blur")} alt="" loading="lazy" decoding="async" draggable={false} />
                      </div>
                    </div>
                  ) : (
                    <div key={k} className={`blk blk-${k}`} style={vars}>
                      <i className="blk-shd rest" style={boxStyle(k)} />
                      <i className="blk-shd lift" style={boxStyle(k)} />
                      <div className="blk-body">
                        <i className="blk-face" style={{ ...boxStyle(k), backgroundImage: `url(${img(`face_${k}.webp`)})` }} />
                        <i className="blk-blur" style={{ ...boxStyle(k), backgroundImage: `url(${img(`face_${k}.webp`)})` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="blocks-hit" role="presentation" style={HIT} onClick={() => pill.current?.click()} onContextMenu={(e) => e.preventDefault()} {...press$} />
              </div>
            </div>
          </m.div>
          <span className="leader" aria-hidden="true" />
          <div className="desk-cta">
            <CopyButton ref={pill} source="stamp" size="lg" className="stamp-pill" run={activate} flashMs={3400} aria-describedby="desk-steps" onKeyDown={key} onBlur={cancel} {...press$} />
            <a className={`dl${stage === "error" ? " is-promoted" : ""}`} href={`${BASE}bootloader.md`} download="SUSD-Bootloader.md">
              <span aria-hidden="true">↓ </span>Download the file
            </a>
            {stage === "error" && (
              <a className="dl-open" href={`${BASE}bootloader.txt`} target="_blank" rel="noopener">
                Open the file
              </a>
            )}
          </div>
          <AssistantChips variant="paper" />
        </div>
      </div>
    </m.section>
  );
}

/* ---------- H · the hinge: Michael's caution before the book ---------- */

export function Hinge({ copy }: { copy: SiteCopy["ending"]["hinge"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], still([50, -50]));
  return (
    <section className="hinge" ref={ref}>
      <m.figure className="hinge-in" style={{ y }}>
        <blockquote>
          <p>{copy.quote}</p>
        </blockquote>
        <figcaption>
          <img src={`${BASE}michael.jpg`} alt="" width="44" height="44" loading="lazy" decoding="async" />
          <span className="hinge-line">{copy.line}</span>
          <span className="hinge-sign">{copy.sign}</span>
        </figcaption>
      </m.figure>
    </section>
  );
}
