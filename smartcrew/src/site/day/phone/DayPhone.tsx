// 2 · One Day, PHONE MODE (BRIEF ROUND 3 §3; scratchpad design/v2/phone/PHONE.md). Seven moments,
// one full screen each, in plain document flow (no pinning, no scroll-driven JS). Each moment
// plays ONCE when it arrives (≥ half on screen): a finger taps the exact button on the crew's
// phone, the screen changes to its after state, and the office's result card slides up beneath
// it ("In the office" + the state + the exact row, crisp live UI at ≥ 14 px). Office → field
// (5:30 PM) runs the other way: the office card first, then the plan lands on the phone.
// Skim it and you still get the story: the big time and a headline of six words or fewer.
// Each moment's ground follows the clock (dawn → day → amber → Friday night), as static CSS.

import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { MOMENTS, type Moment, type MomentId } from "../../../content/moments";
import { DAY2, DAY_UI, FLAG } from "../../../content/copy";
import { Scene } from "../../scene/Scene";
import { PhoneFrame, type Box } from "../../phone/PhoneFrame";
import { useArrive, useSteps } from "../../phone/useArrive";
import { SCRIPT } from "../script";
import { DAY_DATA } from "../states/data";
import "./day-phone.css";

const UpdateCardBody = lazy(() => import("../UpdateCard"));

const COPY = {
  office: "In the office",
  fromOffice: "From the office",
  more: (n: number) => `+${n} more here`,
  moreTitle: (when: string) => `Also at ${when}`,
  close: "Close",
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

function More({ m, open, setOpen }: { m: Moment; open: boolean; setOpen: (v: boolean) => void }) {
  const id = useId();
  const rest = m.features.slice(1);
  if (!rest.length) return null;
  return (
    <>
      <button type="button" className="dph-more" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {open ? COPY.close : COPY.more(rest.length)}
      </button>
      <div className="dph-sheet" id={id} hidden={!open}>
        <p className="dph-sheet-t">{COPY.moreTitle(m.when)}</p>
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
    </>
  );
}

function MomentScreen({ m, i, next }: { m: Moment; i: number; next: Moment | null }) {
  const sc = SCRIPT[i];
  const copy = DAY2[m.id];
  const up = sc.dir === "up";
  const [arriveRef, arrived] = useArrive<HTMLElement>({ amount: 0.5 });
  const el = useRef<HTMLElement | null>(null);
  const ref = useCallback(
    (n: HTMLElement | null) => {
      el.current = n;
      arriveRef(n);
    },
    [arriveRef],
  );
  const step = useSteps(arrived, up ? BEATS_UP : BEATS_DOWN);
  const [open, setOpen] = useState(false);
  // field → office: 1 tap · 2 after screen · 3 card. office → field: 1 card · 2 the phone.
  const after = step >= 2;
  const card = up ? step >= 3 : step >= 1;
  const tapBox: Box | null = up ? (sc.phone.tap ?? null) : (NOTIFY[m.id] ?? [sc.phone.mark[0] - 34, sc.phone.mark[1] - 34, 68, 68]);
  const tapN = up ? (step >= 1 ? 1 : 0) : step >= 2 ? 1 : 0;
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
        <Time when={m.when} />
        <div className="dph-side">
          <p className="dph-count" aria-label={`Moment ${i + 1} of ${MOMENTS.length}`}>
            <span className="dph-bar" aria-hidden="true">
              {MOMENTS.map((x, k) => (
                <i key={x.id} className={k <= i ? "is-on" : undefined} />
              ))}
            </span>
            <span className="t-num">
              {i + 1} / {MOMENTS.length}
            </span>
          </p>
          <More m={m} open={open} setOpen={setOpen} />
        </div>
      </div>
      <h3 className="dph-head">{copy.headline}</h3>
      <div className="dph-stage">
        <div className="dph-phone">
          <PhoneFrame
            screens={[sc.phone.before, sc.phone.after]}
            index={after ? 1 : 0}
            tap={tapBox ? { box: tapBox, n: tapN, kind: up ? "touch" : "notify" } : null}
            sizes="(max-width: 430px) 240px, 260px"
            loading={i === 0 ? "eager" : "lazy"}
            tone={dark ? "dark" : "light"}
            alt={`The crew app: ${copy.phone}`}
          />
        </div>
        <div className="dph-card" aria-hidden={!card}>
          <p className="dph-card-k">
            <span className="dph-card-dot" aria-hidden="true" />
            {up ? COPY.office : COPY.fromOffice}
          </p>
          <p className="dph-card-state">{copy.office}</p>
          <div className="dph-card-row">
            <Suspense fallback={<div className="dph-card-wait" />}>
              <UpdateCardBody id={m.id} />
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
    // a band the height of the header at the top of the viewport
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => (e.isIntersecting ? under.add(e.target) : under.delete(e.target)));
        apply();
      },
      { rootMargin: "0px 0px -92% 0px" },
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
