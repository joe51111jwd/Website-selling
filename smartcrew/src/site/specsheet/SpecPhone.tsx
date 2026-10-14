// 2b · "Here's everything it does", PHONE MODE (SPEC_BRIEF.md; scratchpad design/v2/phone/PHONE.md).
// The same click-through in a 2D iPhone: the six groups are thumb-sized chips (a tablist that
// scrolls sideways), each opens its screen on the phone (the crew app where the group lives in
// the field, the office app's mobile layout where it doesn't), and quiet dots on the screen name
// the tools in one line. Swipe the phone to go to the next or the previous group. Outside the app:
// the title, the count and "Show everything" (the plain list, ./AllTools.tsx), and the CTA in
// the sticky bar's place (the bar steps aside while it shows).
//
// The moment: on arrival (once) the title settles, the chips draw in, the phone rises and its
// first screen names its first tool; untouched, it walks on by itself (./useTour.ts). The phone
// glides up or down inside its window (a transform) to bring a spot into view. Every motion is
// transform/opacity, triggered by a step, never per frame; the screens mount one per idle moment.

import { startTransition, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type TouchEvent } from "react";
import { SPEC } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { Cta } from "../ui/Cta";
import { PhoneFrame } from "../phone/PhoneFrame";
import { useArrive, useSteps } from "../phone/useArrive";
import { CATEGORIES, TOOL_COUNT, type Tool } from "./data";
import { GROUPS, findPhoneSpot } from "./tour";
import { useTour, type Pos } from "./useTour";
import { AllTools, Flag, GridGlyph } from "./AllTools";
import { Roll } from "./Roll";
import { idle, screenComp, warmScreen } from "./screens";
import "./spec-phone.css";
import "./all-tools.css";

const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

/** New words this layout needs (not in copy.ts yet: for the copy review). */
const COUNT_LINE = (groups: number) => `${SPEC.unit} in ${groups} groups`;

const SHAPE = GROUPS.map((g) => [g.phone.spots.length]);
/** ms after arrival: 1 the title · 2 the chips · 3 the phone · 4 the dots · 5 the first name. */
const BOOT = [40, 260, 520, 980, 1360];
/** The iPhone's body around its 402 × 874 screen (PhoneFrame): 430 × 900, the screen 13 pt down. */
const BODY = { w: 430, h: 900, top: 13, left: 14 };

export default function SpecPhone() {
  return (
    <Scene id="specs" pinnedViewports={1} stage="keep" label={SPEC.label} className="spp">
      <Inner />
    </Scene>
  );
}

function Inner() {
  const [arriveRef, arrived] = useArrive<HTMLDivElement>({ amount: 0.45 });
  const [seenRef, visible] = useArrive<HTMLDivElement>({ amount: 0.3, repeat: true });
  const ref = useCallback(
    (n: HTMLDivElement | null) => {
      arriveRef(n);
      seenRef(n);
    },
    [arriveRef, seenRef],
  );
  const boot = useSteps(arrived, BOOT);
  const [all, setAll] = useState(false);
  const tour = useTour({ ready: boot >= 5 && !reduce, visible, blocked: all, shape: SHAPE, dwell: 2700, firstWait: 3600, resume: 8000 });
  const { pos, go } = tour;
  const g = GROUPS[pos.g];
  // which way the last switch went (the new screen slides in from that side)
  const [dir, setDir] = useState<1 | -1>(1);
  const prevG = useRef(pos.g);
  useEffect(() => {
    if (prevG.current === pos.g) return;
    const n = GROUPS.length;
    setDir(((pos.g - prevG.current + n) % n) <= n / 2 ? 1 : -1);
    prevG.current = pos.g;
  }, [pos.g]);

  const toGroup = useCallback((i: number) => go({ g: (i + GROUPS.length) % GROUPS.length, p: 0, s: 0 }), [go]);

  // screens mount one per idle moment: the first at once, the rest after the boot
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));
  const mountedRef = useRef(mounted);
  mountedRef.current = mounted;
  useEffect(() => {
    if (!mountedRef.current.has(pos.g)) setMounted((m) => new Set(m).add(pos.g));
  }, [pos.g]);
  useEffect(() => {
    if (!arrived) return;
    let cancel = () => {};
    const next = () => {
      const i = GROUPS.findIndex((_, k) => !mountedRef.current.has(k));
      if (i < 0) return;
      void warmScreen(GROUPS[i].phone.screen).then(() => {
        cancel = idle(() => {
          startTransition(() => setMounted((m) => new Set(m).add(i)));
          cancel = idle(next, 2500);
        }, 2500);
      });
    };
    const t = window.setTimeout(() => (cancel = idle(next, 2500)), reduce ? 0 : 1800);
    return () => {
      window.clearTimeout(t);
      cancel();
    };
  }, [arrived]);
  useEffect(() => {
    void warmScreen(GROUPS[0].phone.screen);
  }, []);

  // the window's height and the phone's width, on mount and resize only
  const win = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ h: number; w: number } | null>(null);
  useLayoutEffect(() => {
    const el = win.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const dev = el.querySelector<HTMLElement>(".spp-dev");
      const h = Math.round(el.clientHeight);
      const w = Math.round(dev?.clientWidth ?? 0);
      setBox((p) => (p && p.h === h && p.w === w ? p : { h, w }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the phone glides inside its window so the named spot is in view
  const spot = g.phone.spots[pos.s];
  const pan = useMemo(() => {
    if (!box || !spot) return 0;
    const u = box.w / BODY.w;
    const max = Math.max(0, BODY.h * u - box.h + 8);
    const b = spot.box;
    if ((BODY.top + b[1] + b[3] + 34) * u <= box.h - 40) return 0;
    return clamp((BODY.top + b[1] + b[3] / 2) * u - box.h * 0.46, 0, max);
  }, [box, spot]);

  // swipe the phone: next / previous group (a horizontal flick; vertical scrolling is untouched)
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    const p = e.touches[0];
    touch.current = { x: p.clientX, y: p.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    const p = e.changedTouches[0];
    if (!s || !p) return;
    const dx = p.clientX - s.x;
    const dy = p.clientY - s.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4 && Date.now() - s.t < 900) toGroup(pos.g + (dx < 0 ? 1 : -1));
  };

  // the chip row keeps the shown group in view (offsets read on resize, not while scrolling)
  const chips = useRef<HTMLDivElement>(null);
  const offsets = useRef<{ l: number; w: number }[]>([]);
  useLayoutEffect(() => {
    const el = chips.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      offsets.current = [...el.querySelectorAll<HTMLElement>("[role=tab]")].map((c) => ({ l: c.offsetLeft, w: c.offsetWidth }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const chipW = useRef(0);
  useEffect(() => {
    const el = chips.current;
    const o = offsets.current[pos.g];
    if (!el || !o || boot < 2) return;
    chipW.current ||= el.clientWidth;
    el.scrollTo({ left: Math.max(0, o.l - (chipW.current - o.w) / 2), behavior: reduce ? "auto" : "smooth" });
  }, [pos.g, boot]);

  const onChipsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = GROUPS.length;
    const to = e.key === "ArrowRight" ? (pos.g + 1) % n : e.key === "ArrowLeft" ? (pos.g - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (to === null) return;
    e.preventDefault();
    toGroup(to);
    chips.current?.querySelectorAll<HTMLElement>("[role=tab]")[to]?.focus({ preventScroll: true });
  };

  const canShow = useCallback((t: Tool) => !!findPhoneSpot(t.id), []);
  const pick = useCallback(
    (t: Tool) => {
      const at = findPhoneSpot(t.id);
      setAll(false);
      if (at) go({ g: at.g, p: 0, s: at.s });
    },
    [go],
  );
  const count = useMemo(() => COUNT_LINE(CATEGORIES.length), []);

  return (
    <div ref={ref} className="spp-in wrap" data-boot={boot} data-running={tour.running || undefined}>
      <h2 className="t-h2 spp-title">
        <span className="spp-kicker">{SPEC.kicker}</span> {SPEC.title}
      </h2>
      <div className="spp-count">
        <p className="spp-count-p">
          <Roll value={TOOL_COUNT} go={boot >= 1} delay={200} className="t-time spp-count-n" />
          <span className="spp-count-l">{count}</span>
        </p>
        <button type="button" className="spp-all" aria-haspopup="dialog" onClick={() => setAll(true)}>
          <GridGlyph className="spp-glyph" />
          <span>{SPEC.all}</span>
        </button>
      </div>

      <div ref={chips} className="spp-chips" role="tablist" aria-label="SmartCrew" onKeyDown={onChipsKey} onPointerDown={tour.poke}>
        {GROUPS.map((x, i) => {
          const on = i === pos.g;
          return (
            <button
              key={x.cat.id}
              type="button"
              role="tab"
              id={`spp-g-${x.cat.id}`}
              className={`spp-chip${on ? " is-on" : ""}`}
              data-cat={x.cat.id}
              aria-selected={on}
              aria-controls="spp-panel"
              tabIndex={on ? 0 : -1}
              style={{ "--i": i } as CSSProperties}
              onClick={() => toGroup(i)}
            >
              <span>{x.cat.name}</span>
              <span className="spp-chip-n">
                {x.cat.tools.length}
                <span className="sr-only"> tools</span>
              </span>
              {on && tour.running && <span key={`${tour.beat}-${pos.s}`} className="spp-prog" style={{ animationDuration: `${tour.wait}ms` }} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div
        ref={win}
        id="spp-panel"
        className="spp-win"
        role="tabpanel"
        aria-labelledby={`spp-g-${g.cat.id}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onPointerDown={tour.poke}
        onKeyDown={tour.poke}
      >
        <div className="spp-dev" style={{ transform: `translate3d(0, ${-pan}px, 0)` }}>
          <PhoneFrame screens={[<Stack key="stack" active={pos.g} dir={dir} mounted={mounted} />]} index={0} tone="light" shadow={false} />
          {/* over the screen, outside the frame (which is decorative for assistive tech) */}
          <Spots key={pos.g} pos={pos} boot={boot} onSpot={(s) => go({ g: pos.g, p: 0, s })} />
        </div>
        <p className="spp-out" key={g.cat.id}>
          {g.cat.outcome}
          {g.officeMobile && <Flag />}
        </p>
      </div>

      {/* the CTA sits where the sticky bar would (which steps aside while it shows) */}
      <Cta source="specsheet" size="lg" block className="spp-cta" />

      <AllTools open={all} onClose={() => setAll(false)} onPick={pick} canShow={canShow} variant="phone" />
    </div>
  );
}

/** The six screens, stacked at native size (402 × 874; PhoneFrame scales them). */
function Stack({ active, dir, mounted }: { active: number; dir: 1 | -1; mounted: Set<number> }) {
  return (
    <div className="spp-stack" data-dir={dir}>
      {GROUPS.map((x, i) => {
        const Comp = mounted.has(i) ? screenComp(x.phone.screen) : null;
        return (
          <div key={x.cat.id} className={`spp-layer${i === active ? " is-on" : ""}`} aria-hidden="true" inert>
            {Comp && (
              <Suspense fallback={null}>
                <Comp />
              </Suspense>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The group's dots, rings and names over the screen (placed in % of 402 × 874). */
function Spots({ pos, boot, onSpot }: { pos: Pos; boot: number; onSpot: (s: number) => void }) {
  const page = GROUPS[pos.g].phone;
  const pc = (x: number, w: number) => `${(x / w) * 100}%`;
  return (
    <div className="spp-spots" data-boot={boot}>
      {page.spots.map((spot, i) => {
        const [bx, by, bw, bh] = spot.box;
        const [dx, dy] = spot.dot;
        const on = boot >= 5 && i === pos.s;
        const align = dx > 280 ? "end" : dx < 120 ? "start" : "mid";
        const below = dy < 150;
        return (
          <div key={spot.tool.id} className={`spp-spot${on ? " is-on" : ""}`} style={{ "--i": i } as CSSProperties}>
            <span className="spp-ring" aria-hidden="true" style={{ left: pc(bx, 402), top: pc(by, 874), width: pc(bw, 402), height: pc(bh, 874) }} />
            <button
              type="button"
              className="spp-dot"
              style={{ left: pc(dx, 402), top: pc(dy, 874) }}
              aria-label={spot.tool.label}
              aria-pressed={on}
              data-tool={spot.tool.id}
              onClick={() => onSpot(i)}
            >
              <span className="spp-dot-core" />
            </button>
            <span className={`spp-tip spp-tip--${align}${below ? " is-below" : ""}`} style={{ left: pc(dx, 402), top: pc(dy, 874) }} aria-hidden="true">
              <span className="spp-tip-in">{spot.tool.label}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
