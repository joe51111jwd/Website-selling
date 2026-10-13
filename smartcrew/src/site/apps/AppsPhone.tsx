// 6 · Five apps → one, PHONE MODE (BRIEF ROUND 3; scratchpad design/v2/phone/PHONE.md). One screen,
// no 3D, no per-frame loop. The five app tiles sit stacked like notifications over a dark 2D
// iPhone. When the screen arrives they drain into it one by one (outside in: the stack collapses
// on the phone's centre), the first one waking the screen up on the crew app. Then "Or one that
// does.": the office laptop slides in behind the phone, the phone's timer rings and the office's
// clock-in row lights up (the two talk to each other), and the CTA comes in. Plays once
// (useArrive + useSteps), transform/opacity only; the sticky bar steps aside just before the CTA.

import { useEffect, useMemo } from "react";
import { APPS, APPS_SCENE } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { Cta } from "../ui/Cta";
import { PhoneFrame, type Box } from "../phone/PhoneFrame";
import { LaptopFrame } from "../phone/LaptopFrame";
import { useArrive, useSteps } from "../phone/useArrive";
import "./apps-phone.css";

/** Drain order (indexes into APPS.apps, top to bottom on screen): outside in, top first. */
const ORDER = [0, 4, 1, 3, 2];
/** ms after arrival: five drains · the payoff (laptop + "Or one that does.") · the office lights up · sticky bar away · CTA. */
const BEATS = [280, 620, 960, 1300, 1640, 2080, 2560, 2700, 2900];
const DRAINED = (step: number) => Math.min(step, ORDER.length);
const PAYOFF = 6;
const LIGHT = 7;
const BAR_AWAY = 8;
const CLOSE = 9;

/** The phone's running timer (phone-working, native px) and the office's 6:42 AM clock-in row (web-dashboard). */
const TIMER: Box = [46, 327, 310, 42];
const CLOCK_ROW: Box = [339, 694, 1057, 66];

export default function AppsPhone() {
  const [ref, arrived] = useArrive<HTMLDivElement>({ amount: 0.62 });
  const step = useSteps(arrived, BEATS);
  const gone = DRAINED(step);
  // the screen wakes as the first tile lands in it
  const lit = step >= 2;
  const payoff = step >= PAYOFF;
  const close = step >= CLOSE;
  const barAway = step >= BAR_AWAY;

  // each tile's place in the (re-centred) stack; a drained tile keeps the place it left from
  const slots = useMemo(
    () =>
      APPS.apps.map((_, i) => {
        const g = ORDER.indexOf(i);
        const left = ORDER.slice(Math.min(gone, g)).sort((a, b) => a - b);
        return { slot: left.indexOf(i) - (left.length - 1) / 2, out: g < gone };
      }),
    [gone],
  );

  // the sticky bar re-scans [data-hides-sticky] on this event: the marker below only exists from
  // just before the CTA comes in, so the bar keeps the trial one tap away while the tiles drain
  useEffect(() => {
    if (barAway) window.dispatchEvent(new Event("sc:scenes"));
  }, [barAway]);

  return (
    <Scene id="apps" pinnedViewports={0} stage="keep" label={APPS_SCENE.label} className="apps apps--phone">
      <div ref={ref} className={`aph${payoff ? " is-payoff" : ""}${close ? " is-close" : ""}`}>
        <h2 className="t-h2 aph-title">
          <span className="aph-l1">{APPS_SCENE.lead}</span>{" "}
          <span className="aph-l2">{APPS_SCENE.payoff}</span>
        </h2>
        {/* reduced motion never sees the stack drain: the five apps stay named here */}
        <p className="aph-list" aria-hidden="true">
          {APPS.apps.map((a) => a.kind).join(" · ")}
        </p>

        <div className="aph-stage">
          <div className="aph-laptop" aria-hidden={!payoff}>
            <LaptopFrame screens={["web-dashboard"]} ring={step >= LIGHT ? CLOCK_ROW : null} sizes="300px" alt="The office dashboard" />
          </div>
          <div className="aph-phone">
            <PhoneFrame
              screens={["phone-working"]}
              index={lit ? 0 : -1}
              tap={step >= LIGHT ? { box: TIMER, n: 1, kind: "notify" } : null}
              sizes="(max-width: 430px) 190px, 210px"
              alt="The crew app"
            >
              {/* a ping at the centre of the screen as each tile goes in */}
              {Array.from({ length: gone }, (_, k) => (
                <span key={k} className="aph-ping" aria-hidden="true" />
              ))}
            </PhoneFrame>
          </div>
          <ul className="aph-tiles" aria-label={APPS_SCENE.tilesLabel}>
            {APPS.apps.map((a, i) => {
              const { slot, out } = slots[i];
              return (
                <li key={a.kind} className={`aph-tile${out ? " is-gone" : ""}`} style={{ ["--slot" as string]: slot }}>
                  <span className="aph-tile-kind">{a.kind}</span>
                  <span className="aph-tile-names">{a.names}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="aph-close" inert={!close}>
          <Cta source="apps" size="lg" block />
          <p className="t-micro aph-note">{APPS_SCENE.footnote}</p>
          {barAway && <span className="aph-bar-mark" data-hides-sticky aria-hidden="true" />}
        </div>
      </div>
    </Scene>
  );
}
