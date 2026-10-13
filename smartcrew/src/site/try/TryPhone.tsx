// Try it on phones (PHONE MODE; scratchpad design/v2/phone/PHONE.md): the visitor's own phone
// becomes the crew's phone. One screen, in plain document flow (no pinning, nothing driven by the
// scroll): the line and "Tap Clock In." on top, and under them the SmartCrew app itself, edge to
// edge, as live UI (status bar: the visitor's own). When the scene arrives (once) the app rises
// into place; the Clock In circle breathes. They tap the big black Clock In → it clocks in, the
// timer runs (one text update a second), the line on top turns into "That's the whole training.
// Your crew gets this." and the orange CTA slides up into the thumb zone. Untouched for 4 s while
// on screen, it demos itself once.

import { useCallback, useEffect, useRef, useState } from "react";
import { TRY_IT } from "../../content/copy";
import { useArrive } from "../phone/useArrive";
import { Cta } from "../ui/Cta";
import { localTime, useClock, useElapsed, useSelfDemo } from "./clock";
import { TryApp } from "./TryApp";
import { useStaged } from "./warm";
import "./try-phone.css";

const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function TryPhone() {
  const clock = useClock();
  const secs = useElapsed(clock.on, clock.since);
  const [stamp, setStamp] = useState("");
  const [sheet, setSheet] = useState(false);
  // arrives once (the rise); "on view" tracks whether the app is (mostly) on screen right now,
  // which gates the self demo so it never fires off screen
  const [arriveRef, arrived] = useArrive<HTMLDivElement>({ amount: 0.55 });
  const [viewRef, onView] = useArrive<HTMLDivElement>({
    amount: 0.8,
    repeat: true,
  });
  const el = useRef<HTMLDivElement | null>(null);
  const ref = useCallback(
    (n: HTMLDivElement | null) => {
      el.current = n;
      arriveRef(n);
      viewRef(n);
    },
    [arriveRef, viewRef],
  );
  // built before it scrolls in, a piece per idle moment: 1 the scene lays out (still off screen),
  // 2 the Clock In body, 3 the day header + week strip, 4 the tab bar (./warm.ts)
  const stage = useStaged(el, 4);
  useSelfDemo(clock, arrived && onView);

  useEffect(() => {
    if (!clock.on) {
      setSheet(false);
      return;
    }
    setStamp(localTime());
    navigator.vibrate?.(12);
    const t = window.setTimeout(() => setSheet(true), reduce ? 0 : 850);
    return () => window.clearTimeout(t);
  }, [clock.on]);

  return (
    // the rise plays once the staged build is complete (never in the same frame as a build step)
    <div ref={ref} className={`tp${arrived && stage >= 4 ? " is-in" : ""}${clock.on ? " is-on" : ""}`}>
      {/* the line before the tap, and after it (crossfaded in place, no layout change) */}
      <div className="tp-head wrap">
        <div className="tp-swap">
          <h2 className="t-h2 tp-title tp-a">{TRY_IT.title}</h2>
          <p className="t-h2 tp-title tp-b" aria-hidden={!clock.on}>
            {TRY_IT.done}
          </p>
        </div>
        <div className="tp-swap">
          <p className="tp-prompt tp-a">{TRY_IT.prompt}</p>
          <p className="tp-prompt tp-b" aria-hidden={!clock.on}>
            {TRY_IT.doneSub}
          </p>
        </div>
      </div>

      <div className="tp-app tp-ui">
        <TryApp
          on={clock.on}
          secs={secs}
          ghost={clock.ghost}
          live={arrived}
          stage={stage - 1}
          onClockIn={() => clock.clockIn("visitor")}
          onClockOut={clock.clockOut}
        />
      </div>

      {sheet && (
        <div className="tp-sheet" role="status">
          <span className="sr-only">
            {TRY_IT.live} {TRY_IT.done} {TRY_IT.doneSub}
          </span>
          <p className="tp-stamp" aria-hidden="true">
            {TRY_IT.site} · {TRY_IT.clocked.replace("{time}", stamp)}
          </p>
          <Cta source="try" size="lg" className="tp-cta" />
          {/* he clocked in himself: just "Clock out"; the self demo did it: his turn */}
          <button type="button" className="link tp-again" onClick={clock.clockOut}>
            {clock.by === "visitor" ? TRY_IT.clockOut : TRY_IT.again}
          </button>
        </div>
      )}
    </div>
  );
}
