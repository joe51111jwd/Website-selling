// 2b · The spec sheet, PHONE MODE (BRIEF ROUND 3; scratchpad design/v2/phone/PHONE.md).
// The three-second read survives: "Here's everything it does." over six ruled sections, each just
// its name, its one-line outcome and its count as a big tabular figure, and under the double rule
// the counts add up to the total. On arrival (once) the rules draw, the sections land and the
// counts roll; it's all CSS transitions on transform/opacity (no layout animation, no motion
// projection, nothing per frame from JS).
//
// Tap a section → a clean full-screen sheet slides up with its tools: one line each (name, field /
// office), the first one open. An open tool shows its one plain sentence and a crisp crop of the
// real screen (phone-sized image, the exact spot ringed, the office's label as live text). "Next"
// pages through the six sections; the orange CTA sits at the bottom of the sheet.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { SPEC } from "../../content/copy";
import type { Box } from "../../content/moments";
import { NATIVE, screenUrl } from "../../three/stage/urls";
import { Scene } from "../scene/Scene";
import { lockScroll } from "../scroll";
import { Cta } from "../ui/Cta";
import { phoneSmall, phoneSrcSet } from "../phone/PhoneFrame";
import { useArrive } from "../phone/useArrive";
import { useStaged } from "../try/warm";
import { CATEGORIES, TOOL_COUNT, type Category, type Shot as ShotT, type Tool } from "./data";
import "./spec-phone.css";

const COPY = {
  tools: "tools",
  /** under a screen crop: whose app it is, and that the data is the demo account's */
  demo: "Demo account",
  next: (name: string) => `Next: ${name}`,
  close: "Close",
};

const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const base = import.meta.env.BASE_URL;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

/** srcset for a web screen: the 960 px phone copy and the 2880 px (2x) original. */
const webSrcSet = (id: string) => `${base}phone/screens/${id}-960.webp 960w, ${screenUrl(id)} 2880w`;

function Chevron({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Flag() {
  return (
    <span className="flag spp-flag" title={SPEC.flagTitle} aria-label={SPEC.flagTitle} role="img">
      ⚑
    </span>
  );
}

/** A count that rolls like a mechanical counter (CSS: each digit a 0–9 strip that slides once). */
function Roll({ value, delay, className }: { value: number; delay: number; className?: string }) {
  const digits = String(value).split("");
  return (
    <span className={`spp-roll${className ? ` ${className}` : ""}`}>
      <span className="sr-only">{value}</span>
      <span className="spp-roll-d" aria-hidden="true">
        {digits.map((d, i) => (
          <span key={i} className="spp-col">
            <span
              className="spp-strip"
              style={
                {
                  "--d": d,
                  "--delay": `${delay + (digits.length - 1 - i) * 70}ms`,
                } as CSSProperties
              }
            >
              {"0123456789".split("").map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

// ─── the section on the page ─────────────────────────────────────────────────

/** ms after arrival: rows land one by one, then the double rule draws and the total rolls. */
const ROW0 = 140;
const ROW_STEP = 70;
const TOTAL_AT = ROW0 + CATEGORIES.length * ROW_STEP + 260;

export default function SpecPhone() {
  return (
    <Scene id="specs" pinnedViewports={1} stage="keep" label={SPEC.label} className="spp">
      <SpecPhoneInner />
    </Scene>
  );
}

function SpecPhoneInner() {
  const [arriveRef, arrived] = useArrive<HTMLDivElement>({ amount: 0.25 });
  const el = useRef<HTMLDivElement | null>(null);
  const ref = useCallback(
    (n: HTMLDivElement | null) => {
      el.current = n;
      arriveRef(n);
    },
    [arriveRef],
  );
  // built before it scrolls in, a piece per idle moment (../try/warm.ts): 1 the scene lays out,
  // 2 the six sections, 3 the total and the CTA
  const stage = useStaged(el, 3);
  const [open, setOpen] = useState<string | null>(null);
  const opener = useRef<string | null>(null);

  const openCat = useCallback((id: string) => {
    opener.current = id;
    setOpen(id);
  }, []);
  const close = useCallback(() => {
    setOpen(null);
    // focus goes back to the section that opened the sheet (without scrolling the page)
    const id = opener.current;
    window.setTimeout(() => document.querySelector<HTMLElement>(`.spp-row[data-cat="${id}"]`)?.focus({ preventScroll: true }), 0);
  }, []);

  return (
    <div ref={ref} className={`spp-in wrap${arrived ? " is-in" : ""}`}>
      <h2 className="t-h2 spp-title">
        <span className="spp-kicker">{SPEC.kicker}</span> {SPEC.title}
      </h2>
      <span className="spp-rule-heavy" aria-hidden="true" />
      <ul className="spp-rows">
        {stage >= 2 &&
          CATEGORIES.map((c, i) => (
            <li key={c.id} className="spp-li" style={{ "--i": i } as CSSProperties}>
              <button type="button" className="spp-row" data-cat={c.id} aria-haspopup="dialog" onClick={() => openCat(c.id)}>
                <span className="spp-row-t">
                  <span className="spp-name">{c.name}</span>
                  <span className="spp-out">{c.outcome}</span>
                </span>
                <Roll value={c.tools.length} delay={ROW0 + i * ROW_STEP + 120} className="spp-n" />
                <Chevron className="spp-chev" />
              </button>
            </li>
          ))}
      </ul>
      <span className="spp-rule-double" aria-hidden="true" />
      {stage >= 3 && (
        <>
          <p className="spp-total">
            <span className="t-label spp-total-k">
              {SPEC.total} {COPY.tools}
            </span>
            <Roll value={TOOL_COUNT} delay={TOTAL_AT} className="spp-total-n" />
          </p>
          <Cta source="specsheet" size="lg" className="spp-cta" />
        </>
      )}
      <CatSheet id={open} onPick={openCat} onClose={close} />
    </div>
  );
}

// ─── the full-screen sheet ───────────────────────────────────────────────────

/** Mounted while open and while it slides away. */
function CatSheet({ id, onPick, onClose }: { id: string | null; onPick: (id: string) => void; onClose: () => void }) {
  const [shown, setShown] = useState<string | null>(id);
  const [up, setUp] = useState(false);

  useEffect(() => {
    if (id) {
      setShown(id);
      lockScroll(true);
      // next frame: slide up (the panel mounts below the screen first)
      let r2 = 0;
      const r = requestAnimationFrame(() => (r2 = requestAnimationFrame(() => setUp(true))));
      return () => {
        cancelAnimationFrame(r);
        cancelAnimationFrame(r2);
      };
    }
    setUp(false);
    lockScroll(false);
    const t = window.setTimeout(() => setShown(null), reduce ? 0 : 380);
    return () => window.clearTimeout(t);
  }, [id]);

  useEffect(() => () => lockScroll(false), []);

  if (!shown) return null;
  const cat = CATEGORIES.find((c) => c.id === shown) ?? CATEGORIES[0];
  return createPortal(<SheetBody cat={cat} up={up && !!id} onPick={onPick} onClose={onClose} />, document.body);
}

function SheetBody({ cat, up, onPick, onClose }: { cat: Category; up: boolean; onPick: (id: string) => void; onClose: () => void }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<string | null>(cat.tools[0].id);
  // tools opened once stay mounted (their crop doesn't reload when they fold away)
  const [seen, setSeen] = useState<Set<string>>(() => new Set([cat.tools[0].id]));
  const idx = CATEGORIES.indexOf(cat);
  const next = CATEGORIES[(idx + 1) % CATEGORIES.length];

  // a new section: its first tool open, the list back at the top
  const shownCat = useRef(cat.id);
  useLayoutEffect(() => {
    if (shownCat.current === cat.id) return;
    shownCat.current = cat.id;
    setTool(cat.tools[0].id);
    setSeen(new Set([cat.tools[0].id]));
    list.current?.scrollTo({ top: 0 });
  }, [cat]);

  // focus the close button once the sheet is up
  useEffect(() => {
    if (!up) return;
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>(".spps-x")?.focus({ preventScroll: true }), reduce ? 0 : 60);
    return () => window.clearTimeout(t);
  }, [up]);

  const pick = (id: string) => {
    setTool((t) => (t === id ? null : id));
    setSeen((s) => (s.has(id) ? s : new Set(s).add(id)));
  };

  // Escape closes; Tab stays inside the sheet
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const f = [...panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])")];
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={`spps${up ? " is-up" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKey}>
      <div className="spps-scrim" onClick={onClose} aria-hidden="true" />
      <div ref={panel} className="spps-panel">
        <div className="spps-head" key={cat.id}>
          <p className="t-time spps-n" aria-hidden="true">
            {cat.tools.length}
          </p>
          <div className="spps-head-t">
            <h3 id={titleId} className="spps-name">
              {cat.name}
              <span className="sr-only">
                , {cat.tools.length} {COPY.tools}
              </span>
            </h3>
            <p className="spps-out">{cat.outcome}</p>
          </div>
          <button type="button" className="spps-x" onClick={onClose} aria-label={`${COPY.close} ${cat.name}`}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div ref={list} className="spps-list">
          <ul className="spps-tools" key={cat.id}>
            {cat.tools.map((t, i) => (
              <ToolRow key={t.id} t={t} i={i} on={tool === t.id} mounted={seen.has(t.id)} onPick={pick} />
            ))}
          </ul>
          <button type="button" className="spps-next" onClick={() => onPick(next.id)}>
            <span>{COPY.next(next.name)}</span>
            <Chevron className="spps-next-chev" />
          </button>
        </div>

        <div className="spps-foot" onClickCapture={() => window.setTimeout(onClose, 0)}>
          <Cta source="specsheet" size="lg" className="spps-cta" cue={false} />
        </div>
      </div>
    </div>
  );
}

function ToolRow({ t, i, on, mounted, onPick }: { t: Tool; i: number; on: boolean; mounted: boolean; onPick: (id: string) => void }) {
  const bodyId = useId();
  return (
    <li className={`spps-tool${on ? " is-on" : ""}`} style={{ "--i": i } as CSSProperties}>
      <button type="button" className="spps-tool-b" data-tool={t.id} aria-expanded={on} aria-controls={bodyId} onClick={() => onPick(t.id)}>
        <span className="spps-dot" aria-hidden="true" />
        <span className="spps-tool-name">
          {t.label}
          {t.confirm && <Flag />}
        </span>
        <span className="spps-side">{SPEC.side[t.side]}</span>
      </button>
      <div id={bodyId} className="spps-body" role="region" aria-label={t.label}>
        <div className="spps-body-in">
          <p className="spps-line">{t.line}</p>
          {mounted && <Shot shot={t.shot} closest={t.closest} />}
        </div>
      </div>
    </li>
  );
}

// ─── a crop of the real screen ───────────────────────────────────────────────

type Cam = { s: number; x: number; y: number };

function camFor(shot: ShotT, fw: number, fh: number): Cam {
  const { w: W, h: H } = NATIVE[shot.kind];
  const F: Box = shot.focus;
  if (shot.kind === "phone") {
    // the crew's screen full width (legible), cropped round the spot
    const s = fw / W;
    const cy = F[1] + F[3] / 2;
    return { s, x: 0, y: clamp(fh / 2 - cy * s, fh - H * s, 0) };
  }
  // the office screen: as close as the spot allows; a spot wider than the frame starts at its left
  const pad = 22;
  const s = clamp(Math.min(fw / (F[2] + pad * 2), fh / (F[3] + pad * 2)), 0.34, 0.72);
  const cx = (F[2] + pad * 2) * s > fw ? F[0] - pad + fw / (2 * s) : F[0] + F[2] / 2;
  const cy = (F[3] + pad * 2) * s > fh ? F[1] - pad + fh / (2 * s) : F[1] + F[3] / 2;
  return {
    s,
    x: clamp(fw / 2 - cx * s, fw - W * s, 0),
    y: clamp(fh / 2 - cy * s, fh - H * s, 0),
  };
}

function Shot({ shot, closest }: { shot: ShotT; closest: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  // the frame's size, measured once (and on resize), never while scrolling
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      setSize((p) => (p && p.w === w && p.h === h ? p : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: W, h: H } = NATIVE[shot.kind];
  const cam = size ? camFor(shot, size.w, size.h) : null;
  const R = shot.ring;
  const ring =
    cam && R
      ? {
          l: cam.x + R[0] * cam.s - 4,
          t: cam.y + R[1] * cam.s - 4,
          w: R[2] * cam.s + 8,
          h: R[3] * cam.s + 8,
        }
      : null;
  const round = !!R && Math.abs(R[2] - R[3]) < 6;
  const tagBelow = !!(ring && size && ring.t + ring.h + 40 < size.h);
  const phoneShot = shot.kind === "phone";
  return (
    <figure className="spps-shot" data-kind={shot.kind}>
      <div ref={frame} className="spps-frame" aria-hidden="true">
        {cam && (
          <img
            className="spps-img"
            src={phoneShot ? phoneSmall(shot.screen) : `${base}phone/screens/${shot.screen}-960.webp`}
            srcSet={phoneShot ? phoneSrcSet(shot.screen) : webSrcSet(shot.screen)}
            sizes={`${Math.round(W * cam.s)}px`}
            alt=""
            decoding="async"
            draggable={false}
            style={{
              width: W * cam.s,
              height: H * cam.s,
              transform: `translate3d(${cam.x}px, ${cam.y}px, 0)`,
            }}
          />
        )}
        {ring && (
          <span className={`spps-ring${round ? " is-round" : ""}`} style={{ left: ring.l, top: ring.t, width: ring.w, height: ring.h }}>
            <span className="spps-ping" />
          </span>
        )}
        {ring && size && shot.tag && (
          <span
            className="spps-tag"
            style={{
              left: clamp(ring.l, 8, Math.max(8, size.w - 236)),
              ...(tagBelow ? { top: ring.t + ring.h + 8 } : { bottom: size.h - ring.t + 8 }),
            }}
          >
            {shot.tag}
          </span>
        )}
      </div>
      <figcaption className="spps-cap">
        {SPEC.app[shot.kind]} · {SPEC.screen[shot.screen] ?? shot.screen} · {closest ? SPEC.closest : COPY.demo}
      </figcaption>
    </figure>
  );
}
