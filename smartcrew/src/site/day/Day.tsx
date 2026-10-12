// 2 · One Day. A pinned scene: seven moments of one workday at Cedar Ridge Earthworks, about one
// screen of scroll each. Left: the time (huge), what happens, what it means, and the features it
// carries. Right: the Stage plays the moment (phone → pulse → laptop). A day rail tracks the day;
// the ground tints from dawn to Friday night.
//
// FIRST WORKING VERSION by the lead (Stage API proof): moments 1–2 have tuned shots, the rest
// cycle; copy layout, rail and tint are functional. The Day owner refines from here.

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useMotionValueEvent } from "motion/react";
import { MOMENTS, MOMENT_TONE } from "../../content/moments";
import { FLAG } from "../../content/copy";
import { Scene, useSceneProgress, useSceneStep } from "../scene/Scene";
import { StageAnchor } from "../../three/stage/StageAnchor";
import { InlineCta } from "../ui/Cta";
import { scrollToScene } from "../scroll";
import { DAY_STEPS, beat, dayPoses } from "./poses";
import "./day.css";

const ease = [0.22, 1, 0.36, 1] as const;

const TONES: Record<string, [number, number, number]> = {
  dawn: [238, 241, 243],
  day: [251, 248, 244],
  dusk: [246, 231, 212],
  evening: [29, 26, 22],
};

/** Tints the page ground through the day while the scene is on screen. */
function useDayTint() {
  const progress = useSceneProgress();
  useMotionValueEvent(progress, "change", (p) => {
    const root = document.documentElement;
    if (p <= 0 || p >= 1) {
      root.style.removeProperty("--page-ground");
      root.removeAttribute("data-ground");
      return;
    }
    const f = p * DAY_STEPS - 0.5;
    const i = Math.max(0, Math.min(DAY_STEPS - 1, Math.floor(f)));
    const j = Math.min(DAY_STEPS - 1, i + 1);
    const t = Math.max(0, Math.min(1, (f - i - 0.35) / 0.3));
    const a = TONES[MOMENT_TONE[MOMENTS[i].id]];
    const b = TONES[MOMENT_TONE[MOMENTS[j].id]];
    const c = a.map((v, k) => Math.round(v + (b[k] - v) * t));
    root.style.setProperty("--page-ground", `rgb(${c.join(" ")})`);
    root.toggleAttribute("data-ground", true);
    root.dataset.ground = c[0] < 120 ? "dark" : "light";
  });
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("--page-ground");
      document.documentElement.removeAttribute("data-ground");
    },
    [],
  );
}

function Rail({ step }: { step: number }) {
  return (
    <nav className="day-rail" aria-label="The day">
      <ol>
        {MOMENTS.map((m, i) => (
          <li key={m.id} className={i === step ? "is-on" : i < step ? "is-past" : ""}>
            <button type="button" onClick={() => scrollToScene("day", beat(i, 0.3))} aria-current={i === step ? "step" : undefined}>
              <span className="day-rail-dot" aria-hidden="true" />
              <span className="day-rail-t">{m.when}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function MomentCopy({ step }: { step: number }) {
  const m = MOMENTS[step];
  const [num, ampm] = m.when.split(" ");
  return (
    <div className="day-copy" aria-live="polite">
      <div className="day-time-wrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={m.id}
            className="t-time day-time"
            initial={{ y: "60%", opacity: 0, filter: "blur(8px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-60%", opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.6, ease }}
          >
            {num}
            {ampm && <span className="day-ampm">{ampm}</span>}
          </motion.p>
        </AnimatePresence>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }}>
          <h3 className="t-h3 day-title">{m.title}</h3>
          <p className="t-lead day-outcome">{m.outcome}</p>
          <p className="day-features">
            {m.features.map((f, k) => (
              <span key={f.id}>
                {k > 0 && <span aria-hidden="true"> · </span>}
                {f.label}
                {f.confirm && (
                  <span className="flag" title="Andrew to confirm">
                    {FLAG}
                  </span>
                )}
              </span>
            ))}
          </p>
          {(m.id === "profit" || m.id === "payroll") && <InlineCta source={`day-${m.id}`} className="day-cta" />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Stills of each moment's landed shot (public/renders, from scripts/posters.cjs) for when 3D is
 * missing or still loading. Moments 3–7 have none yet. */
const POSTERS: Partial<Record<string, string>> = { clockin: "renders/day-clockin.webp", pretrip: "renders/day-pretrip.webp" };

function DayStage() {
  const step = useSceneStep(DAY_STEPS);
  useDayTint();
  const poster = POSTERS[MOMENTS[step].id];
  return (
    <div className="day-grid wrap">
      <MomentCopy step={step} />
      <StageAnchor id="day" className="day-stage" poster={poster ? { src: poster, frame: [5.0, 3.4], pad: 0.12, alt: MOMENTS[step].title } : undefined} />
      <Rail step={step} />
    </div>
  );
}

export default function Day() {
  const poses = useMemo(dayPoses, []);
  return (
    <Scene id="day" pinnedViewports={DAY_STEPS + 1} poses={poses} label="One day at Cedar Ridge Earthworks" className="day">
      <DayStage />
    </Scene>
  );
}
