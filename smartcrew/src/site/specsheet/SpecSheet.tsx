// 2b · "That was one day. Here's everything it does." (SPEC_BRIEF.md: less text, click through
// the web app). The section is the SmartCrew office web app itself, live and clickable: its
// sidebar is the spec sheet's six groups, each opens the group's real screen, and quiet dots on
// each screen name the tools in one line. Outside the app only the title, the count ("38 tools in
// 6 groups") and "Show everything" (the plain list, ./AllTools.tsx) and the CTA.
//
// The moment (SCROLL_BRIEF.md): as the section arrives, the app boots calmly, once: the window
// settles, the sidebar draws in, the first screen loads, its dots appear and the first one names
// its tool. Then it waits for the visitor; untouched, it walks on by itself (./useTour.ts), so it
// is never a still frame, and it holds the moment the visitor touches it.
//
// Phones get ./SpecPhone.tsx (the same idea in a 2D iPhone, transform/opacity only).

import { useCallback, useMemo, useState } from "react";
import { CTA, SPEC } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { exitKeys, reducedMotion } from "../../three/stage";
import { Cta, DemoLink } from "../ui/Cta";
import { usePhoneLite } from "../phone";
import { useArrive, useSteps } from "../phone/useArrive";
import { TOOL_COUNT, CATEGORIES, type Tool } from "./data";
import { GROUPS, findSpot } from "./tour";
import { useTour } from "./useTour";
import { AppFrame } from "./AppFrame";
import { AllTools, GridGlyph } from "./AllTools";
import { Roll } from "./Roll";
import SpecPhone from "./SpecPhone";
import "./specsheet.css";
import "./all-tools.css";

/** New words this layout needs (not in copy.ts yet: for the copy review). */
export const SPEC_COUNT = {
  /** after the big figure: "38 | tools in 6 groups" */
  line: (groups: number) => `${SPEC.unit} in ${groups} groups`,
};

/**
 * The devices' exit (the Stage's exitKeys): over the scroll from One Day's last key to this
 * section's top, the laptop glides out past the left edge and the phone past the right, turning:
 * never a vanish. The recipe's last key (at: 1) is dropped: this one-screen scene isn't pinned.
 */
const EXIT = exitKeys({ start: -0.98, end: 0, side: { macbook: -1, iphone: 1, display: 1 } }).slice(0, 2);

/** The tour's shape: spots per page per group. */
const SHAPE = GROUPS.map((g) => g.pages.map((p) => p.spots.length));

/** ms after arrival: 1 the window · 2 the sidebar · 3 the screen · 4 the dots · 5 the first name. */
const BOOT = [40, 420, 760, 1180, 1620];

export default function SpecSheet() {
  return usePhoneLite() ? <SpecPhone /> : <SpecDesk />;
}

function SpecDesk() {
  return (
    <Scene id="specs" pinnedViewports={1} poses={EXIT} label={SPEC.label} className="spec">
      <Desk />
    </Scene>
  );
}

function Desk() {
  const [arriveRef, arrived] = useArrive<HTMLDivElement>({ amount: 0.42 });
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
  const tour = useTour({
    ready: boot >= 5 && !reducedMotion,
    visible,
    blocked: all,
    shape: SHAPE,
    dwell: 2900,
    firstWait: 4200,
    resume: 9000,
  });

  const canShow = useCallback((t: Tool) => !!findSpot(t.id), []);
  const pick = useCallback(
    (t: Tool) => {
      const at = findSpot(t.id);
      setAll(false);
      if (!at) return;
      tour.go(at);
      // focus lands on the spot once the list has gone (its dot names the tool)
      window.setTimeout(() => document.querySelector<HTMLElement>(`.spx-page.is-on [data-tool="${t.id}"]`)?.focus({ preventScroll: true }), 360);
    },
    [tour],
  );
  const count = useMemo(() => SPEC_COUNT.line(CATEGORIES.length), []);

  return (
    <div ref={ref} className="spec-in wrap" data-boot={boot}>
      <div className="spec-head">
        <h2 className="t-h2 spec-title">
          <span className="spec-title-a">{SPEC.kicker}</span> <span className="spec-title-b">{SPEC.title}</span>
        </h2>
        <div className="spec-count">
          <p className="spec-count-p">
            <Roll value={TOOL_COUNT} go={boot >= 1} delay={260} className="t-time spec-count-n" />
            <span className="spec-count-l">{count}</span>
          </p>
          <button type="button" className="spec-all" data-all aria-haspopup="dialog" data-cursor="link" onClick={() => setAll(true)}>
            <GridGlyph />
            <span>{SPEC.all}</span>
          </button>
        </div>
      </div>

      <AppFrame
        pos={tour.pos}
        go={tour.go}
        boot={boot}
        running={tour.running}
        stopped={tour.stopped}
        wait={tour.wait}
        beat={tour.beat}
        onToggle={tour.toggle}
        onHover={tour.hover}
        onPoke={tour.poke}
      />

      <div className="spec-foot">
        <Cta source="specsheet" size="md" cursorLabel="Clocked in · {time}" className="spec-cta" />
        <DemoLink source="specsheet" className="spec-demo" />
        <p className="t-micro spec-micro">{CTA.micro}</p>
      </div>

      <AllTools open={all} onClose={() => setAll(false)} onPick={pick} canShow={canShow} variant="desk" />
    </div>
  );
}
