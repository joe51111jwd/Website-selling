// 2b · "That was one day. Here's everything it does." (SPEC_BRIEF.md: less text, click through
// the web app). The section is the SmartCrew office web app itself, live and clickable: its
// sidebar is the spec sheet's six groups, each opens the group's real screen, and quiet dots on
// each screen name the tools in one line. Outside the app only the title, the count ("38 tools in
// 6 groups"), "See all 38 tools" (big and dark: the list of all 38, where any tool starts the
// flat walkthrough through all of them, ./AllTools.tsx + ./Walk.tsx) and the CTA.
//
// The speed bump (the boss: "it's too easy to accidentally scroll past it"): scrolling down onto
// the section, the page glides it into place and holds it for a moment (../player/hold.ts: the
// wheel is absorbed, a clear scroll up lets go, every button still works), then hands it back.
//
// The moment (SCROLL_BRIEF.md): as the section arrives, the app boots calmly, once: the window
// settles, the sidebar draws in, the first screen loads, its dots appear and the first one names
// its tool. Then it waits for the visitor; untouched, it walks on by itself (./useTour.ts), so it
// is never a still frame, and it holds the moment the visitor touches it.
//
// Phones get ./SpecPhone.tsx (the same idea in a 2D iPhone, transform/opacity only).

import { useCallback, useEffect, useMemo, useState } from "react";
import { CTA, SPEC } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { exitKeys, reducedMotion } from "../../three/stage";
import { sceneY } from "../../three/stage/store";
import { navigatingTo } from "../scroll";
import { holdPage } from "../player";
import { Cta, DemoLink } from "../ui/Cta";
import { usePhoneLite } from "../phone";
import { useArrive, useSteps } from "../phone/useArrive";
import { TOOL_COUNT, CATEGORIES } from "./data";
import { GROUPS } from "./tour";
import { useTour } from "./useTour";
import { AppFrame } from "./AppFrame";
import { AllTools, GridGlyph } from "./AllTools";
import { WALK_COPY } from "./Walk";
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
/** The speed bump: how long the section holds the page once it has glided into place, ms. */
const HOLD_MS = 3000;

/** Scrolling down onto the section: glide it into place and hold it a moment (once per load). */
function useSpeedBump() {
  useEffect(() => {
    if (reducedMotion) return;
    const hold = holdPage({ y: () => sceneY("specs", 0), onExit: () => {} });
    let done = false;
    let lastY = window.scrollY;
    let t = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY;
      lastY = y;
      if (done || !down || hold.held || document.documentElement.classList.contains("scroll-locked")) return;
      const top = sceneY("specs", 0);
      if (top === null) return;
      // a header link passing through on its way further down doesn't stop here
      const nav = navigatingTo();
      if (nav !== null && Math.abs(nav - top) > 2) return;
      const vh = window.innerHeight;
      if (y >= top - 0.45 * vh && y < top + 0.08 * vh) {
        done = true;
        hold.engage(() => (t = window.setTimeout(() => hold.release(), HOLD_MS)));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
      hold.release();
    };
  }, []);
}

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

  useSpeedBump();
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
            <span>{WALK_COPY.all(TOOL_COUNT)}</span>
            <svg className="spec-all-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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

      <AllTools open={all} onClose={() => setAll(false)} variant="desk" />
    </div>
  );
}
