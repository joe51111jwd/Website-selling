// 2 · One Day, PHONE MODE (BRIEF ROUND 3 §3; scratchpad design/v2/phone/PHONE.md). Seven moments,
// one full screen each, in plain document flow (no pinning, no scroll-driven JS). Each moment
// plays ONCE when it arrives (≥ half on screen): a finger taps the exact button on the crew's
// phone, the screen changes to its after state, and the office's result card slides up beneath
// it ("In the office" + the state + the exact row, crisp live UI at ≥ 14 px). Office → field
// (5:30 PM) runs the other way: the office card first, then the plan lands on the phone.
// Skim it and you still get the story: the big time and a headline of six words or fewer.
// Each moment's ground follows the clock (dawn → day → amber → Friday night), as static CSS.

import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { MOMENTS, type Moment, type MomentId } from "../../../content/moments";
import { DAY2, DAY_UI, FLAG } from "../../../content/copy";
import { Scene } from "../../scene/Scene";
import { PhoneFrame, pct, type Box } from "../../phone/PhoneFrame";
import { useArrive, useSteps } from "../../phone/useArrive";
import { SCRIPT } from "../script";
import { CLOCK_IN_FENCE, fenceBox } from "../ring";
import { DAY_DATA } from "../states/data";
import "./day-phone.css";

const UpdateCardBody = lazy(() => import("../UpdateCard"));

const COPY = {
  office: "In the office",
  fromOffice: "From the office",
  more: (n: number) => `+${n} more here`,
  moreTitle: (when: string) => `Also at ${when}`,
  close: "Close",
  /** Friday's bold result (AMBER: "ready for QuickBooks", never "sent"/"synced": TRUTH.md). */
  payrollState: "Ready for QuickBooks",
};

/** Each moment's ground, from the time-of-day tokens (the desktop's light follows the same clock). */
const GROUND: Record<MomentId, string> = {
  clockin: "var(--dawn)",
  pretrip: "color-mix(in srgb, var(--dawn) 55%, var(--day))",
  load: "var(--day)",
  leak: "color-mix(in srgb, var(--day) 45%, var(--dusk))",
  profit: "var(--dusk)",
  plan: "color-mix(in srgb, var(--dusk) 90%, var(--orange))",
  payroll: "var(--evening)",
};
const DARK = new Set<MomentId>(["payroll"]);

/** Office → field: where the plan lands on the phone (its sheet's title), native px. */
const NOTIFY: Partial<Record<MomentId, Box>> = { plan: [167, 622, 68, 68] };

/** Beats after arrival (ms). Field → office: tap, after screen, card. Office → field: card, then the phone. */
const BEATS_UP = [280, 820, 1180];
const BEATS_DOWN = [260, 1050];
/**
 * 6:42 AM, the hand-off from the hero (HERO_SPEC §8, phones): the hero's fence closes round the
 * phone's Clock In button (fence in, closed solid), then the tap, the after screen, the card.
 */
const BEATS_FIRST = [60, 640, 920, 1460, 1820];

/** The fence round the Clock In button, as an overlay on the phone's screen (native px). */
const FENCE_BOX = fenceBox(6);
const FENCE_PTS = CLOCK_IN_FENCE.map(([x, y]) => `${(x - FENCE_BOX[0]).toFixed(1)},${(y - FENCE_BOX[1]).toFixed(1)}`).join(" ");
const FENCE_VB = `0 0 ${FENCE_BOX[2].toFixed(1)} ${FENCE_BOX[3].toFixed(1)}`;

/**
 * The hero is 40% out of view (once): One Day's first screen plays its arrival. One
 * IntersectionObserver on the hero, nothing per frame. A page that opens below the hero reports
 * it at once.
 */
function useHeroOut(on: boolean) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!on || out || !hero || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio <= 0.6 && e.boundingClientRect.top < 0) {
          setOut(true);
          io.disconnect();
        }
      },
      { threshold: [0, 0.6] },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [on, out]);
  return out;
}

/**
 * 6:42 AM as an odometer that sets once (phones: CSS keyframes, transform only): each wheel rolls
 * up through two digits and lands, the minutes' last wheel first and the hour last, then "AM".
 * Before it plays the wheels are empty (their glyph keeps the space).
 */
function PhoneOdo({ when, go }: { when: string; go: boolean }) {
  const m = when.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return <Time when={when} />;
  const chars = `${m[1]}:${m[2]}`.split("");
  const n = chars.filter((c) => c !== ":").length;
  let k = 0;
  return (
    <p className={`t-time dph-time dph-odo${go ? " is-go" : ""}`} aria-label={when}>
      <span className="dph-hm" aria-hidden="true">
        {chars.map((c, j) => {
          if (c === ":")
            return (
              <span key={j} className="dph-colon">
                :
              </span>
            );
          const d = Number(c);
          const delay = (n - 1 - k++) * 55;
          return (
            <span key={j} className="dph-wheel" style={{ ["--d" as string]: `${delay}ms` } as CSSProperties}>
              <span className="dph-wheel-sz">{c}</span>
              <span className="dph-strip">
                {[(d + 8) % 10, (d + 9) % 10, d].map((v, q) => (
                  <span key={q}>{v}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
      <span className="dph-ap" aria-hidden="true">
        {m[3]}
      </span>
    </p>
  );
}

/** The hero's fence, small, round the phone's Clock In button: draws in dashed, closes solid, rings out at the tap. */
function ClockInFence({ step }: { step: "off" | "in" | "closed" | "out" }) {
  return (
    <span className={`dph-fence is-${step}`} style={pct(FENCE_BOX)} aria-hidden="true">
      <svg className="dph-fence-dash" viewBox={FENCE_VB}>
        <polygon points={FENCE_PTS} />
      </svg>
      <svg className="dph-fence-solid" viewBox={FENCE_VB}>
        <polygon points={FENCE_PTS} />
      </svg>
    </span>
  );
}

/** The time as the big instrument: "6:42" large, "AM" small; a word ("Friday") whole. */
function Time({ when }: { when: string }) {
  const m = when.match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/i);
  return (
    <p className="t-time dph-time">
      {m ? (
        <>
          <span className="dph-hm">{m[1]}</span>
          <span className="dph-ap">{m[2]}</span>
        </>
      ) : (
        <span className="dph-word">{when}</span>
      )}
    </p>
  );
}

/** "+N more here": the moment's other tools, in a bottom sheet over a dimmed page (a tap outside,
 * the Close button or Escape closes it). Portalled to <body>: the moment itself skips rendering
 * offscreen (content-visibility), which would clip and re-anchor a fixed sheet inside it. */
function More({ m, open, setOpen }: { m: Moment; open: boolean; setOpen: (v: boolean) => void }) {
  const id = useId();
  const rest = m.features.slice(1);
  if (!rest.length) return null;
  return (
    <>
      <button type="button" className="dph-more" aria-expanded={open} aria-controls={id} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {COPY.more(rest.length)}
      </button>
      {open && createPortal(<MoreSheet id={id} m={m} rest={rest} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function MoreSheet({ id, m, rest, onClose }: { id: string; m: Moment; rest: Moment["features"]; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState(false);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    // next frame: the sheet slides up from its start position (a CSS transition)
    const raf = requestAnimationFrame(() => setUp(true));
    panel.current?.querySelector<HTMLElement>(".dph-sheet-x")?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(raf);
      back?.focus?.({ preventScroll: true });
    };
  }, []);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  };
  return (
    <div className={`dph-sheet-root${up ? " is-up" : ""}`} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} onKeyDown={onKey}>
      <div className="dph-scrim" onClick={onClose} aria-hidden="true" />
      <div className="dph-sheet" id={id} ref={panel}>
        <div className="dph-sheet-head">
          <p className="dph-sheet-t" id={`${id}-t`}>
            {COPY.moreTitle(m.when)}
          </p>
          <button type="button" className="dph-sheet-x" onClick={onClose}>
            {COPY.close}
          </button>
        </div>
        <ul>
          {rest.map((f) => (
            <li key={f.id}>
              <b>
                {f.label}
                {f.confirm && (
                  <span className="flag" title="Andrew to confirm">
                    {FLAG}
                  </span>
                )}
              </b>
              <span>{f.line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MomentScreen({ m, i, next }: { m: Moment; i: number; next: Moment | null }) {
  const sc = SCRIPT[i];
  const copy = DAY2[m.id];
  const up = sc.dir === "up";
  const first = i === 0;
  const [arriveRef, arrived] = useArrive<HTMLElement>({ amount: 0.5 });
  // 6:42 AM: the time sets once the hero is 40% out of view; the fence and the tap wait until the
  // phone itself is on screen (a slow scroller never misses the tap below the fold)
  const heroOut = useHeroOut(first);
  const [phoneRef, phoneSeen] = useArrive<HTMLDivElement>({ amount: 0.6 });
  const odoGo = first && (heroOut || arrived);
  const el = useRef<HTMLElement | null>(null);
  const ref = useCallback(
    (n: HTMLElement | null) => {
      el.current = n;
      arriveRef(n);
    },
    [arriveRef],
  );
  const step = useSteps(first ? odoGo && phoneSeen : arrived, first ? BEATS_FIRST : up ? BEATS_UP : BEATS_DOWN);
  const [open, setOpen] = useState(false);
  // field → office: 1 tap · 2 after screen · 3 card. office → field: 1 card · 2 the phone.
  // 6:42 AM: 1 fence in · 2 fence closed · 3 tap · 4 after screen · 5 card.
  const sh = first ? 2 : 0;
  const after = step >= 2 + sh;
  const card = up ? step >= 3 + sh : step >= 1;
  const tapBox: Box | null = up ? (sc.phone.tap ?? null) : (NOTIFY[m.id] ?? [sc.phone.mark[0] - 34, sc.phone.mark[1] - 34, 68, 68]);
  const tapN = up ? (step >= 1 + sh ? 1 : 0) : step >= 2 ? 1 : 0;
  const fence = !first ? "off" : step >= 3 ? "out" : step >= 2 ? "closed" : step >= 1 ? "in" : "off";
  const dark = DARK.has(m.id);
  useProfitTick(el, m.id === "profit" && card);
  const style = {
    ["--g" as string]: GROUND[m.id],
    ["--g2" as string]: next ? GROUND[next.id] : "var(--ground)",
  } as CSSProperties;
  return (
    <section
      ref={ref}
      className={`dph-m${dark ? " is-dark" : ""}${card ? " is-card" : ""}${open ? " is-open" : ""}${next ? "" : " is-last"}`}
      data-moment={m.id}
      data-ground={dark ? "dark" : "light"}
      style={style}
      aria-label={`${m.when}: ${copy.headline}`}
    >
      <div className="dph-top">
        {first ? <PhoneOdo when={m.when} go={odoGo} /> : <Time when={m.when} />}
        <div className="dph-side">
          <p className="dph-count t-num" aria-label={`Moment ${i + 1} of ${MOMENTS.length}`}>
            {i + 1} / {MOMENTS.length}
          </p>
          <More m={m} open={open} setOpen={setOpen} />
        </div>
      </div>
      <h3 className="dph-head">{copy.headline}</h3>
      <div className="dph-stage">
        <div className="dph-phone" ref={first ? phoneRef : undefined}>
          <PhoneFrame
            screens={[sc.phone.before, sc.phone.after]}
            index={after ? 1 : 0}
            tap={tapBox ? { box: tapBox, n: tapN, kind: up ? "touch" : "notify" } : null}
            sizes="(max-width: 430px) 240px, 260px"
            loading={i === 0 ? "eager" : "lazy"}
            tone={dark ? "dark" : "light"}
            alt={`The crew app: ${copy.phone}`}
          >
            {first && <ClockInFence step={fence} />}
          </PhoneFrame>
        </div>
        <div className="dph-card" aria-hidden={!card}>
          <p className="dph-card-k">
            <span className="dph-card-dot" aria-hidden="true" />
            {up ? COPY.office : COPY.fromOffice}
          </p>
          <p className="dph-card-state">{m.id === "payroll" ? COPY.payrollState : copy.office}</p>
          <div className="dph-card-row">
            <Suspense fallback={<div className="dph-card-wait" />}>
              <UpdateCardBody id={m.id} phone />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}

const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** 5:00 PM: the job's profit ticks up by the day's take as the card lands (once, ~1 s). */
function useProfitTick(root: React.RefObject<HTMLElement | null>, go: boolean) {
  useEffect(() => {
    if (!go || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = root.current?.querySelector<HTMLElement>(".dph-card .sc-kpi-value");
    if (!el) return;
    const { from, to } = DAY_DATA.profit;
    const t0 = performance.now() + 250;
    let raf = 0;
    const step = () => {
      const t = Math.min(1, Math.max(0, (performance.now() - t0) / 1100));
      const e = 1 - Math.pow(1 - t, 3);
      el.textContent = "$" + fmt.format(Math.round((from + (to - from) * e) * 100) / 100);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, [root, go]);
}

/** While a dark moment is under the header, the header goes dark with it (one observer, no scroll handler). */
function useHeaderGround(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const html = document.documentElement;
    const header = document.querySelector<HTMLElement>(".site-header");
    const under = new Set<Element>();
    const apply = () => {
      const top = [...under][0] as HTMLElement | undefined;
      const dark = top?.dataset.ground === "dark";
      if (dark) {
        html.dataset.ground = "dark";
        header?.style.setProperty("--page-ground", "var(--evening)");
      } else if (html.dataset.ground === "dark") {
        html.removeAttribute("data-ground");
        header?.style.removeProperty("--page-ground");
      }
    };
    // a thin band just under the header: the moment that fills the window right now (moments
    // start under the header and snap there)
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => (e.isIntersecting ? under.add(e.target) : under.delete(e.target)));
        apply();
      },
      { rootMargin: "-60px 0px -84% 0px" },
    );
    el.querySelectorAll(".dph-m").forEach((s) => io.observe(s));
    return () => {
      io.disconnect();
      if (html.dataset.ground === "dark") html.removeAttribute("data-ground");
      header?.style.removeProperty("--page-ground");
    };
  }, [root]);
}

export default function DayPhone() {
  const root = useRef<HTMLDivElement>(null);
  useHeaderGround(root);
  // the update card's chunk (the app kit) loads while the visitor is still on the hero
  useEffect(() => {
    const t = window.setTimeout(() => void import("../UpdateCard"), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <Scene id="day" pinnedViewports={0} stage="keep" label={DAY_UI.rail} className="day day--phone">
      <div className="dph" ref={root}>
        {MOMENTS.map((m, i) => (
          <MomentScreen key={m.id} m={m} i={i} next={MOMENTS[i + 1] ?? null} />
        ))}
        <p className="dph-caption">{DAY_UI.caption}</p>
      </div>
    </Scene>
  );
}
