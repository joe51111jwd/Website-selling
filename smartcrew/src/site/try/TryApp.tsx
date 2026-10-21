// The SmartCrew crew app as live DOM, without a status bar (on a phone the visitor's own status bar
// is right above it; on desktop the caller draws one). Every control works (./app/views.tsx): Clock
// In / Out, Break, Log & Switch (the "Select task and project" sheet and its pickers), Today ·
// Entries · Week, the week strip, the camera, Request day off, and the tab bar's Jobsites, Docs,
// Summary and Profile with what their rows open. Clocked in / out is the page's (../clock.ts: the
// copy and the self demo follow it); the rest is the app's own state (./app/model.ts).
// Transitions are transform / opacity only (app.css); reduced motion: instant.
//
// Classic is a limited app (Andrew's comment-mode note, Oct 21: "Can we add back functionality for
// log& switch, the tabs at hte top, etc. Lets add back all the forms on the reporting page… For
// jobsites, lets custom build one that has field note history and docs and make that the only
// clickable one. Also want messaging to be shown… I love being ablet to click on it. but want to
// limit how deep into the app people can go."): Home, Docs and their forms, Summary, one jobsite and
// one chat work; Messages takes Profile's tab; deeper rows show but are off (B's `off`, LIMITED in
// ./app/views.tsx), and taps on them do nothing here.

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useReducer, useRef, useState, type PointerEvent } from "react";
import { timer } from "../../screens/kit";
import { initial, reduce, type Task } from "./app/model";
import { Camera, DayHeader, Docs, Jobsites, LIMITED, Messages, nowTime, PastDay, Profile, Ready, RouteView, Sheet, Summary, TabBar, Working, WeekStrip, type Ctx } from "./app/views";
import { TODAY } from "../../screens/data";
import "./app/app.css";

const ease = [0.22, 1, 0.36, 1] as const;
const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type TryAppProps = {
  on: boolean;
  secs: number;
  ghost: boolean;
  /** the app can take focus / taps (it is on screen and settled) */
  live: boolean;
  /**
   * The Clock In circle breathes once (1 → 1.04 → 1, after --tp-breathe-delay; try-phone.css).
   * Set while it should play; leave it off after the first tap so it never plays again.
   */
  breathe?: boolean;
  onClockIn: () => void;
  onClockOut?: () => void;
  /** Any tap or key inside the app (the visitor is using it: no self demo). */
  onTouch?: () => void;
  /**
   * Phones build the app a piece at a time (./warm.ts), so its first layout is never one long task:
   * 1 the Clock In body · 2 + the day header and week strip · 3 + the tab bar. Parts not built yet
   * keep their exact space (no shift when they land). Default: everything at once.
   */
  stage?: number;
};

export function TryApp({ on, secs, ghost, live, breathe, onClockIn, onClockOut, onTouch, stage }: TryAppProps) {
  const [s, d] = useReducer(reduce, initial);
  const at = stage ?? 3;
  const staged = stage !== undefined;

  // clocked in / out (by a tap here, the self demo, or the page's own "Clock out" link)
  const root = useRef<HTMLDivElement>(null);
  const pending = useRef<Task | undefined>(undefined);
  const lastSecs = useRef(0);
  lastSecs.current = secs || lastSecs.current;
  const was = useRef(on);
  useEffect(() => {
    if (on === was.current) return;
    was.current = on;
    if (on) {
      d({ t: "shiftStart", time: nowTime(), task: pending.current });
      d({ t: "tab", tab: "Home" });
      pending.current = undefined;
    } else {
      const total = lastSecs.current;
      d({ t: "shiftEnd", secs: total, time: nowTime() });
      d({ t: "toast", text: `Clocked out · ${timer(total)}` });
    }
    lastSecs.current = 0;
    // the home screen swaps its body: start it from the top
    root.current?.querySelector(".ca-view")?.scrollTo(0, 0);
  }, [on]);

  const toast = useCallback((text: string) => d({ t: "toast", text }), []);
  useEffect(() => {
    if (!s.toast) return;
    const n = s.toast.n;
    const t = window.setTimeout(() => d({ t: "toastGone", n }), 2400);
    return () => window.clearTimeout(t);
  }, [s.toast]);
  useEffect(() => {
    if (!s.sheet?.closing) return;
    const t = window.setTimeout(() => d({ t: "sheetGone" }), reduced ? 0 : 200);
    return () => window.clearTimeout(t);
  }, [s.sheet?.closing]);

  const c: Ctx = {
    s,
    d,
    on,
    secs,
    clockIn: (task) => {
      pending.current = task;
      onClockIn();
    },
    clockOut: () => onClockOut?.(),
    toast,
  };

  // a circular ripple where the finger lands (the only mark a tap leaves)
  const [ripple, setRipple] = useState<{ x: number; y: number; n: number } | null>(null);
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    onTouch?.();
    const el = root.current;
    const btn = (e.target as Element).closest("button");
    if (!el || reduced || !btn || btn.hasAttribute("data-off")) return;
    const r = el.getBoundingClientRect();
    const k = r.width / (el.offsetWidth || r.width);
    setRipple((p) => ({ x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, n: (p?.n ?? 0) + 1 }));
  };

  const top = s.stack[s.stack.length - 1];
  const camera = top?.k === "camera";
  const route = top && !camera ? top : null;
  const viewKey = route ? `${s.tab}/${s.stack.length}` : s.tab;
  // which way the new screen comes in: computed once per screen change (not per timer tick)
  const depth = route ? s.stack.length : 0;
  const nav = useRef({ key: viewKey, depth, dir: "swap" });
  if (nav.current.key !== viewKey) {
    const dir = depth > nav.current.depth ? "push" : depth < nav.current.depth ? "pop" : "swap";
    nav.current = { key: viewKey, depth, dir };
  }
  const dir = nav.current.dir;

  let view;
  if (route) view = <RouteView c={c} r={route} />;
  else if (s.tab === "Jobsites") view = <Jobsites c={c} />;
  else if (s.tab === "Docs") view = <Docs c={c} />;
  else if (s.tab === "Summary") view = <Summary c={c} />;
  else if (s.tab === "Profile") view = <Profile c={c} />;
  else if (s.tab === "Messages") view = <Messages c={c} />;
  else {
    const chrome = (
      <>
        <DayHeader c={c} />
        <WeekStrip c={c} />
      </>
    );
    view = (
      <>
        {!staged ? chrome : at >= 2 ? <div className="tp-chrome">{chrome}</div> : <div className="tp-chrome tp-chrome--wait" aria-hidden="true" />}
        {at < 1 ? null : s.day !== TODAY.iso ? (
          <PastDay c={c} />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {!on ? (
              <motion.div
                key="ready"
                className="ca-grow"
                initial={reduced ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
                transition={{ duration: reduced ? 0 : 0.3, ease }}
              >
                <Ready c={c} ghost={ghost} breathe={breathe} />
              </motion.div>
            ) : (
              <motion.div
                key="work"
                initial={reduced ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.45, ease }}
              >
                <Working c={c} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </>
    );
  }

  return (
    <div
      ref={root}
      className={`sc tp-sc ca${LIMITED ? " is-limited" : ""}`}
      onPointerDown={onDown}
      onClickCapture={
        LIMITED
          ? (e) => {
              if ((e.target as Element).closest("button[data-off]")) {
                e.preventDefault();
                e.stopPropagation();
              }
            }
          : undefined
      }
      onKeyDown={() => onTouch?.()}
      inert={!live}
      data-cursor="hide"
    >
      <div className="ca-main">
        <div key={viewKey} className={`ca-view${s.tab === "Home" && !route ? " ca-view--home" : ""} ca-in--${dir}`}>
          {view}
        </div>
        {s.toast && (
          <div key={s.toast.n} className="ca-toast" role="status">
            {s.toast.text}
          </div>
        )}
      </div>
      {at >= 3 ? <TabBar c={c} /> : <div className="tp-tabs--wait" aria-hidden="true" />}
      {s.sheet && <Sheet c={c} />}
      {camera && <Camera c={c} />}
      {ripple && <span key={ripple.n} className="ca-ripple" style={{ left: ripple.x, top: ripple.y }} aria-hidden="true" />}
    </div>
  );
}
