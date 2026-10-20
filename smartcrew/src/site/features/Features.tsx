// 3 · "Everything. Built for dirt." (Andrew's round-4 outline: "feature list with cards. Headline.
// Subhead. Clickable image for each feature."; his copy of Oct 19: ten features and the CTA under
// them). What SmartCrew does, in one section:
//   - the head: kicker, Andrew's headline and the sub from his mock, and "See all 38 tools" (the
//     list of all 38 and the flat walkthrough through them, ../specsheet/AllTools.tsx + Walk.tsx);
//   - the pain picker (./PainPicker.tsx): pick or type a headache, "We have a feature for that.",
//     and its card opens (not in classic: Andrew cut it there, Oct 20);
//   - desktop: the ten cards (./Cards.tsx) beside the office web app as a big clickable prototype
//     (./AppWindow.tsx, its own chunk): opening a card switches the app to that feature's screen,
//     and opening a screen from the app's sidebar opens its feature's card;
//   - phones: the cards as an accordion, the open one with a still of its screen that opens the
//     full-screen walkthrough at that feature. The big app never loads on phones;
//   - the close: Andrew's "Ready to run your entire operation in one place?" and the primary button.
// One calm entrance as the section arrives (the head, the picker, the cards, the window), then it
// waits for the visitor: no autoplay, no pinning, nothing holds the page.

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { FEATURES, type FeatureId } from "../../content/features";
import { Scene } from "../scene/Scene";
import { usePhoneLite } from "../phone";
import { useArrive } from "../phone/useArrive";
import { CLASSIC, FOCUS } from "../../lib/look";
import { scrollToY } from "../scroll";
import { AllTools, GridGlyph } from "../specsheet/AllTools";
import { WALK_COPY, stepOf } from "../specsheet/Walk";
import { TOOL_COUNT } from "../specsheet/data";
import { Cta } from "../ui/Cta";
import { featureById, screenDef } from "./data";
import { Cards } from "./Cards";
import { PainPicker, type Answer } from "./PainPicker";
import ClassicFeatures from "./Wheel";
import "../specsheet/all-tools.css";
import "./features.css";
import "./glass.css";
import "./focus.css";
import "./bold.css";

const AppWindow = lazy(() => import("./AppWindow"));

const FIRST: FeatureId = "time";
const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// classic (Oct 20, James's drawing): the feature wheel beside an iPad (./Wheel.tsx)
export default function Features() {
  return CLASSIC ? <ClassicFeatures /> : <LookFeatures />;
}

function LookFeatures() {
  const phone = usePhoneLite();
  const [arriveRef, arrived] = useArrive<HTMLDivElement>({ amount: 0.18 });
  const [open, setOpen] = useState<FeatureId | null>(FIRST);
  const [screen, setScreen] = useState(featureById(FIRST).screen);
  const [answer, setAnswer] = useState<Answer>(null);
  const [all, setAll] = useState<{ open: boolean; at: number | null }>({ open: false, at: null });
  const bodyRef = useRef<HTMLDivElement>(null);

  // desktop always shows one card open (the app's screen belongs to it)
  useEffect(() => {
    if (!phone && open === null) setOpen(screenDef(screen).feature);
  }, [phone, open, screen]);

  const openCard = useCallback(
    (id: FeatureId) => {
      if (phone) {
        setOpen((cur) => (cur === id ? null : id));
        return;
      }
      setOpen(id);
      setScreen((cur) => (screenDef(cur).feature === id ? cur : featureById(id).screen));
    },
    [phone],
  );

  // a screen opened from the app opens its feature's card
  const openScreen = useCallback((id: string) => {
    setScreen(id);
    setOpen(screenDef(id).feature);
  }, []);

  // a pick in the pain picker: open its card (and its screen), then bring it into view if it isn't
  const onAnswer = useCallback(
    (a: Answer) => {
      setAnswer(a);
      if (a?.kind !== "yes") return;
      setOpen(a.id);
      setScreen(featureById(a.id).screen);
      requestAnimationFrame(() => requestAnimationFrame(() => reveal(a.id)));
    },
    [phone],
  );

  const reveal = (id: FeatureId) => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
    const vh = window.innerHeight;
    if (phone) {
      // phones: the opened card, just under the header
      const card = document.querySelector<HTMLElement>(`.ft [data-feature="${id}"]`);
      if (!card) return;
      const r = card.getBoundingClientRect();
      if (r.top >= header + 8 && r.top < vh * 0.55) return;
      scrollToY(window.scrollY + r.top - header - 12);
      return;
    }
    // desktop: the answer line and the cards and app under it, or the cards and app alone if both
    // don't fit; nothing moves if they are already in view
    const body = bodyRef.current;
    const ans = document.querySelector<HTMLElement>(".ft .ft-answer");
    if (!body) return;
    const b = body.getBoundingClientRect();
    if (b.top >= header && b.bottom <= vh + 4) return;
    const a = ans?.getBoundingClientRect();
    const fitsBoth = a && b.bottom - a.top <= vh - header - 12;
    const top = fitsBoth && a ? a.top - 12 : b.top - 12;
    scrollToY(window.scrollY + top - header);
  };

  const openAll = (at: number | null) => setAll({ open: true, at });

  return (
    <Scene id="features" pinnedViewports={0} stage="keep" label={FEATURES.label} className="ft">
      <div ref={arriveRef} className={`ft-in wrap${phone ? " is-phone" : " is-desk"}`} data-in={arrived || reduce ? "" : undefined}>
        <div className="ft-head">
          <div className="ft-head-text" data-ft-in="1">
            <p className="ft-kicker">{FEATURES.kicker}</p>
            <h2 className="t-h2 ft-title">{FEATURES.title}</h2>
            <p className="t-lead ft-sub">{FEATURES.sub}</p>
          </div>
          {!phone && !FOCUS && <AllButton onClick={() => openAll(null)} />}
        </div>

        {/* Andrew's Loom (Oct 20): the headache picker "kind of like muddies it up… we may cut this
            little section… and then just have it everything built for dirt"; the other looks keep it */}
        {!CLASSIC && <PainPicker answer={answer} onAnswer={onAnswer} />}

        <div ref={bodyRef} className="ft-body">
          <Cards open={open} matched={answer?.kind === "yes" ? answer.id : null} onOpen={openCard} variant={phone ? "phone" : "desk"} onShot={(id) => openAll(stepOf(featureById(id).tools[0]))} />
          {!phone && (
            <Suspense fallback={<div className="ft-app ft-app--wait" aria-hidden="true" />}>
              <AppWindow screen={screen} onScreen={openScreen} arrived={arrived} />
            </Suspense>
          )}
        </div>

        {/* the focus look keeps the head to the headline: "See all" closes the section, as on phones */}
        {(phone || FOCUS) && (
          <div className="ft-foot">
            <AllButton onClick={() => openAll(null)} />
          </div>
        )}

        <div className="ft-close">
          <h3 className="ft-close-title">{FEATURES.close.title}</h3>
          <p className="ft-close-sub">{FEATURES.close.sub}</p>
          <Cta source="features-close" size="lg" block={phone} className="ft-close-cta" />
        </div>
      </div>
      <AllTools open={all.open} startAt={all.at} onClose={() => setAll((s) => ({ ...s, open: false }))} variant={phone ? "phone" : "desk"} />
    </Scene>
  );
}

export function AllButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="ft-all" aria-haspopup="dialog" data-cursor="link" onClick={onClick} data-ft-in="1">
      <GridGlyph className="ft-all-glyph" />
      <span>{WALK_COPY.all(TOOL_COUNT)}</span>
      <svg className="ft-all-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
