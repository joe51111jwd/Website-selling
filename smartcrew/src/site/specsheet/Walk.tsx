// The flat walkthrough: all 38 tools, one after another, each on its real screen (the boss: "for all
// the features, when you click on it, it just starts a walkthrough… just clicking through all the
// different things… all 38 features need to be there").
//
// It starts at the tool that was clicked in "See all 38 tools" (./AllTools.tsx) and plays on by
// itself through every tool of the six groups, in the sheet's order. Each step shows the tool's
// screen flat (no 3D), zoomed in on the part that shows it, with an orange ring on it; on the same
// screen the view glides from box to box (the boss liked the highlight moving over the boxes
// rather than cutting); a new screen crossfades in. Beside it: the group, the tool's name and its
// one line. Prev / Play–Pause / Next, ← → and Space, and a 38-step bar to jump anywhere. The last
// step ends on the orange button.
//
// The screens are the same live React screens the app tour uses (./screens.ts), scaled with a
// transform; tools with no screen of their own show the closest one (data.ts `closest`).

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { SPEC } from "../../content/copy";
import type { Box } from "../../content/moments";
import { Cta } from "../ui/Cta";
import { CATEGORIES, TOOL_COUNT, type Category, type Tool } from "./data";
import { screenComp, warmScreen } from "./screens";

/** New words this view needs (not in copy.ts yet: for the copy review). */
export const WALK_COPY = {
  all: (n: number) => `See all ${n} tools`,
  start: (n: number) => `Walk through all ${n}`,
  back: "All tools",
  prev: "Previous tool",
  next: "Next tool",
  play: "Play",
  pause: "Pause",
  of: (i: number, n: number) => `${i} of ${n}`,
  end: (n: number) => `That's all ${n}.`,
};

export type Step = { t: Tool; c: Category; ci: number; k: number };
/** Every tool, in the sheet's order. */
export const STEPS: Step[] = CATEGORIES.flatMap((c, ci) => c.tools.map((t, k) => ({ t, c, ci, k })));
export const stepOf = (id: string) => Math.max(0, STEPS.findIndex((s) => s.t.id === id));

const NATIVE = { web: { w: 1440, h: 900 }, phone: { w: 402, h: 874 } } as const;
/** How long each tool holds while it plays, ms. */
const DWELL = 3800;
const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Flag() {
  return (
    <span className="flag spec-flag" title={SPEC.flagTitle} aria-label={SPEC.flagTitle} role="img">
      ⚑
    </span>
  );
}

type Size = { w: number; h: number };

/** Where the screen sits in the view for a shot: its scale and offset (web: zoomed on the focus box). */
function frameFor(kind: "web" | "phone", focus: Box, view: Size) {
  const N = NATIVE[kind];
  if (kind === "phone") {
    // the whole phone screen, as tall as the view allows, centred
    const s = Math.min((view.h * 0.92) / N.h, (view.w * 0.8) / N.w);
    return { s, x: (view.w - N.w * s) / 2, y: (view.h - N.h * s) / 2 };
  }
  const fit = Math.min(view.w / N.w, view.h / N.h);
  const [fx, fy, fw, fh] = focus;
  const want = Math.min(view.w / (fw * 1.45), view.h / (fh * 1.9));
  const s = Math.max(fit, Math.min(fit * 2.3, want));
  const cx = fx + fw / 2;
  const cy = fy + fh / 2;
  let x = view.w / 2 - cx * s;
  let y = view.h / 2 - cy * s;
  // never past the screen's edges
  const sw = N.w * s;
  const sh = N.h * s;
  x = sw <= view.w ? (view.w - sw) / 2 : Math.min(0, Math.max(view.w - sw, x));
  y = sh <= view.h ? (view.h - sh) / 2 : Math.min(0, Math.max(view.h - sh, y));
  return { s, x, y };
}

/** One screen in the view: its live page, moved and scaled to the step's frame, the ring on it. */
function ScreenLayer({ step, view, leaving }: { step: Step; view: Size; leaving: boolean }) {
  const { shot } = step.t;
  const Comp = screenComp(shot.screen);
  const N = NATIVE[shot.kind];
  const f = frameFor(shot.kind, shot.focus, view);
  const ring = shot.ring;
  const style: CSSProperties = { width: N.w, height: N.h, transform: `translate3d(${f.x}px, ${f.y}px, 0) scale(${f.s})` };
  const pad = 7 / f.s;
  return (
    <div className={`swk-layer swk-layer--${shot.kind}${leaving ? " is-leaving" : ""}`} aria-hidden="true">
      {shot.kind === "phone" && (
        <span
          className="swk-bezel"
          style={{ left: f.x - 12, top: f.y - 12, width: N.w * f.s + 24, height: N.h * f.s + 24, borderRadius: 54 * f.s + 12 }}
        />
      )}
      <div className="swk-scr" style={style}>
        <div className="swk-page" inert>
          <Suspense fallback={null}>
            <Comp />
          </Suspense>
        </div>
        {ring && (
          <span
            className="swk-ring"
            style={{
              left: ring[0] - pad,
              top: ring[1] - pad,
              width: ring[2] + pad * 2,
              height: ring[3] + pad * 2,
              borderWidth: 3 / f.s,
              borderRadius: 10 / f.s,
            }}
          >
            {shot.tag && (
              <span className="swk-ring-tag" style={{ transform: `scale(${1 / f.s})` }}>
                {shot.tag}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

type Props = {
  start: number;
  onBack: () => void;
  onClose: () => void;
  variant: "desk" | "phone";
};

export function Walk({ start, onBack, onClose, variant }: Props) {
  const [i, setI] = useState(start);
  const [playing, setPlaying] = useState(!reduce);
  const [ended, setEnded] = useState(false);
  const [tick, setTick] = useState(0);
  const step = STEPS[i];
  const last = STEPS.length - 1;

  // the view's size (the screen fits it)
  const viewRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<Size>({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const read = () => setView({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the screen that's leaving (a new screen crossfades in over it)
  const [prev, setPrev] = useState<Step | null>(null);
  const shown = useRef(step);
  useEffect(() => {
    const was = shown.current;
    shown.current = step;
    if (was.t.shot.screen === step.t.shot.screen) return;
    setPrev(was);
    const t = window.setTimeout(() => setPrev(null), reduce ? 0 : 420);
    return () => window.clearTimeout(t);
  }, [step]);

  // the next screens' code, ahead of time
  useEffect(() => {
    for (const d of [1, 2]) {
      const n = STEPS[i + d];
      if (n) void warmScreen(n.t.shot.screen);
    }
  }, [i]);

  // it plays on by itself; any move by the visitor restarts the clock on the new step
  useEffect(() => {
    if (!playing) return;
    if (i >= last) {
      const t = window.setTimeout(() => {
        setPlaying(false);
        setEnded(true);
      }, DWELL);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setI((x) => Math.min(last, x + 1)), DWELL);
    return () => window.clearTimeout(t);
  }, [playing, i, last, tick]);

  const go = useCallback(
    (to: number) => {
      setEnded(false);
      setI(Math.max(0, Math.min(last, to)));
      setTick((n) => n + 1);
    },
    [last],
  );
  const toggle = () => {
    if (ended || (!playing && i >= last)) {
      go(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
    setTick((n) => n + 1);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(i + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(i - 1);
    } else if (e.key === " " && !(e.target as HTMLElement).closest("button")) {
      e.preventDefault();
      toggle();
    }
  };

  // the bar: one segment per tool, the six groups apart
  const groups = useMemo(() => CATEGORIES.map((c, ci) => ({ c, steps: STEPS.map((s, k) => ({ s, k })).filter((x) => x.s.ci === ci) })), []);
  const t = step.t;
  const side = SPEC.side[t.side];
  const app = SPEC.app[t.shot.kind];

  return (
    <div className={`swk swk--${variant}`} onKeyDown={onKey}>
      <div className="swk-top">
        <button type="button" className="swk-back" onClick={onBack} data-cursor="link">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H4M7.5 4.5 4 8l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {WALK_COPY.back}
        </button>
        <p className="swk-count" aria-live="polite">
          <b>{i + 1}</b> / {TOOL_COUNT}
        </p>
        <button type="button" className="spal-x" onClick={onClose} aria-label={SPEC.close}>
          <span>{SPEC.close}</span>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="swk-main">
        <div className="swk-view" ref={viewRef}>
          {view.w > 0 && prev && <ScreenLayer key={`p-${prev.t.shot.screen}`} step={prev} view={view} leaving />}
          {view.w > 0 && <ScreenLayer key={step.t.shot.screen} step={step} view={view} leaving={false} />}
          {t.closest && <p className="swk-closest">{SPEC.closest}</p>}
        </div>

        <div className="swk-text" key={i}>
          <p className="swk-group">
            <span>{step.c.name}</span>
            <span className="swk-dim">{WALK_COPY.of(step.k + 1, step.c.tools.length)}</span>
          </p>
          <h3 className="swk-name">
            {t.label}
            {t.confirm && <Flag />}
          </h3>
          <p className="swk-line">{t.line}</p>
          <p className="swk-chips">
            <span className="swk-chip">{app}</span>
            <span className="swk-chip">{side}</span>
          </p>
          {ended && (
            <div className="swk-end">
              <p className="swk-end-t">{WALK_COPY.end(TOOL_COUNT)}</p>
              <span onClickCapture={() => window.setTimeout(onClose, 0)}>
                <Cta source="specsheet-walk" size="md" cue={false} />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="swk-bottom">
        <div className="swk-ctrl">
          <button type="button" className="swk-btn" onClick={() => go(i - 1)} disabled={i === 0} aria-label={WALK_COPY.prev} data-cursor="link">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="swk-btn swk-play" onClick={toggle} aria-label={playing ? WALK_COPY.pause : WALK_COPY.play} data-cursor="link">
            {playing ? (
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="5" y="4" width="3.4" height="12" rx="1" fill="currentColor" />
                <rect x="11.6" y="4" width="3.4" height="12" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.5 4.2v11.6c0 .6.6.9 1.1.6l9-5.8a.7.7 0 0 0 0-1.2l-9-5.8c-.5-.3-1.1 0-1.1.6Z" fill="currentColor" />
              </svg>
            )}
          </button>
          <button type="button" className="swk-btn" onClick={() => go(i + 1)} disabled={i === last} aria-label={WALK_COPY.next} data-cursor="link">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <ol className="swk-bar" aria-label={SPEC.allTitle(TOOL_COUNT)}>
          {groups.map(({ c, steps }) => (
            <li key={c.id} className="swk-bar-g" title={c.name} style={{ ["--n" as string]: steps.length } as CSSProperties}>
              {steps.map(({ s, k }) => (
                <button
                  key={s.t.id}
                  type="button"
                  className={`swk-seg${k === i ? " is-on" : k < i ? " is-past" : ""}`}
                  onClick={() => go(k)}
                  aria-label={`${k + 1}. ${s.t.label}`}
                  aria-current={k === i ? "step" : undefined}
                  title={s.t.label}
                >
                  {k === i && playing && !ended && <span key={`${i}-${tick}`} className="swk-seg-fill" style={{ animationDuration: `${DWELL}ms` }} />}
                </button>
              ))}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
