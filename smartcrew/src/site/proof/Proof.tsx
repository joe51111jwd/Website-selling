// 5 · Proof (BRIEF §5, beat 6: "Proof lands on a number"). Pinned for 0.35 screen of scroll, one
// quote at a time, nothing else on it: Phil Drish's quote set large and typographic, its
// "~$150k" rolling up like an odometer as it enters, a survey-paint stroke landing under it, his
// name, company and the family disclosure ⚑. Scrolling on, Phil's quote lifts away and Katie's
// takes the screen. No devices here (Try it sent them out; they stay out, and Five apps brings them
// back from the right with the Stage's returnKeys), no logos (they are in the hero), no CTA
// (PLAYBOOK S2).

import { useEffect, useRef, useState } from "react";
import { motion, useTransform } from "motion/react";
import { FLAG, PROOF } from "../../content/copy";
import { Scene, useSceneProgress } from "../scene/Scene";
import { reducedMotion } from "../../three/stage";
import { exitKeys } from "../../three/stage";
import { Odometer } from "./Odometer";
import { usePhoneLite } from "../phone";
import ProofPhone from "./ProofPhone";
import "./proof.css";

const P = PROOF.phil;
const PROOF_VIEWPORTS = 1.35;
const K = PROOF.katie;

function Flag({ title = PROOF.flagTitle }: { title?: string }) {
  return (
    <span className="flag" title={title} aria-label={title}>
      {FLAG}
    </span>
  );
}

/** Rolls once, the first time the figure comes into view. */
function useRollOnEnter() {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(reducedMotion);
  useEffect(() => {
    const el = ref.current;
    if (!el || on) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      // starts as the figure comes up into view, so it is still rolling as it settles (never sits at $000k)
      { threshold: 0, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [on]);
  return { ref, on };
}

function Phil() {
  const progress = useSceneProgress();
  // scrolling on, Phil's quote lifts away and dims to make room for Katie's
  const y = useTransform(progress, [0.16, 0.48], ["0svh", reducedMotion ? "0svh" : "-7svh"]);
  const opacity = useTransform(progress, [0.16, 0.42], [1, 0]);
  const pointerEvents = useTransform(opacity, (o) => (o < 0.5 ? "none" : "auto"));
  const { ref, on } = useRollOnEnter();
  const full = `${P.before} ${P.figure.prefix}${P.figure.digits}${P.figure.suffix} ${P.figureRest} ${P.after}`;
  return (
    <motion.figure className="proof-q proof-phil" style={{ y, opacity, pointerEvents }}>
      <blockquote className="proof-quote" data-cursor="text">
        <p>
          <span className="sr-only">{`“${full}”`}</span>
          <span aria-hidden="true" className="proof-lead">
            <span className="proof-open">“</span>
            {P.before}
          </span>
          <span aria-hidden="true" className={`proof-figure${on ? " is-on" : ""}`} ref={ref}>
            <span className="proof-num t-time">
              {P.figure.prefix}
              <Odometer digits={P.figure.digits} on={on} duration={1700} />
              {P.figure.suffix}
              {/* a survey-paint stroke under the figure, sprayed once it lands */}
              <svg className="proof-mark" viewBox="0 0 400 16" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 10.5C60 7.2 122 6.4 192 7.6c66 1.2 134 2.2 204-1.6" pathLength={1} />
              </svg>
            </span>
            <span className="proof-per">{P.figureRest}</span>
          </span>
          <span aria-hidden="true" className="proof-rest">
            {P.after}”
          </span>
        </p>
      </blockquote>
      <figcaption className="proof-cite">
        <span className="proof-who">
          <span className="proof-name">{P.name}</span>
          <span className="proof-co">{P.company}</span>
        </span>
        <span className="proof-disclose">
          {P.disclosure}
          <Flag title={PROOF.flagDisclosure} />
        </span>
      </figcaption>
    </motion.figure>
  );
}

function Katie() {
  const progress = useSceneProgress();
  const y = useTransform(progress, [0.34, 0.68], [reducedMotion ? "0svh" : "7svh", "0svh"]);
  const opacity = useTransform(progress, [0.36, 0.6], [0, 1]);
  // both quotes stay readable to screen readers; only the one on screen takes the pointer
  const pointerEvents = useTransform(opacity, (o) => (o < 0.5 ? "none" : "auto"));
  return (
    <motion.figure className="proof-q proof-katie" style={{ y, opacity, pointerEvents }}>
      <blockquote className="proof-quote" data-cursor="text">
        <p className="proof-katie-text">
          <span className="proof-open">“</span>
          {K.text}”
        </p>
      </blockquote>
      <figcaption className="proof-cite">
        <span className="proof-who">
          <span className="proof-name">{K.name}</span>
          <span className="proof-co">
            {K.company}
            <Flag title={PROOF.flagKatie} />
          </span>
        </span>
      </figcaption>
    </motion.figure>
  );
}

/** No devices on this screen: they are already out (Try it's exit) and stay out. */
const PROOF_POSES = exitKeys({ hold: true, side: 1, start: 0 });

/** Phones (PHONE MODE): one quote per screen, trigger-once, no scroll-driven motion (./ProofPhone.tsx). */
export default function Proof() {
  return usePhoneLite() ? <ProofPhone /> : <ProofDesk />;
}

function ProofDesk() {
  const poses = PROOF_POSES;
  return (
    <Scene id="proof" pinnedViewports={PROOF_VIEWPORTS} poses={poses} label={PROOF.label} className="proof">
      <div className="proof-grid wrap">
        <Phil />
        <Katie />
      </div>
    </Scene>
  );
}
