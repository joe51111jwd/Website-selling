// Classic on phones: the ten modules at a glance, as one system (Andrew, Oct 20, texts via James:
// "Instead of going feature by feature I think we might start with High level modules… Or maybe
// just keep it high level. A lot of my traffic is mobile… Those guys don't need to see every
// feature. Generally when someone sees all the big modules in one system a little light bulb goes
// off"). Desktop keeps the tabs (./Tabs.tsx).
//
// The app's screen on top steps through the modules on its own while it's in view (the platform
// in action), the module it shows lit in the grid of all ten under it, with Andrew's headline for
// it in between. A tap on a module shows its screen and stops the stepping; a tap on the screen
// opens the full-screen walkthrough at that module. No bullets here: that's the drill-down.

import { useEffect, useRef, useState } from "react";
import { FEATURES, type FeatureId } from "../../content/features";
import { Icon } from "../../screens/kit/Icon";
import { FEATURE_LIST, featureById } from "./data";

const STEP_MS = 2600;

// the screens zoomed out (Andrew, Oct 22: "those screens on this section were still really hard to
// [see]. So we might need to zoom those out a little bit farther"): each module's page below the
// app's top bar, 820 × 830 of its 1440 × 900, so far more of it shows than the desktop stills' crops
const TALL = import.meta.glob<string>("./shots/tall/*.webp", { eager: true, import: "default" });
const TALL_W = 1100;
const TALL_H = 1113;
const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Props = {
  onShot: (id: FeatureId) => void;
};

export function FeatureModules({ onShot }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState<FeatureId>(FEATURE_LIST[0].id);
  const [auto, setAuto] = useState(!reduce);
  const [seen, setSeen] = useState(false);

  // step only while the screen is in view
  useEffect(() => {
    const el = root.current;
    if (!el || !auto) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [auto]);

  useEffect(() => {
    if (!auto || !seen) return;
    const t = window.setTimeout(() => {
      const i = FEATURE_LIST.findIndex((f) => f.id === on);
      setOn(FEATURE_LIST[(i + 1) % FEATURE_LIST.length].id);
    }, STEP_MS);
    return () => window.clearTimeout(t);
  }, [auto, seen, on]);

  const pick = (id: FeatureId) => {
    setAuto(false);
    setOn(id);
  };

  const f = featureById(on);

  return (
    <div ref={root} className="ftm" data-ft-in="3">
      <button type="button" className="ft-shot ftm-screen" onClick={() => onShot(on)} aria-label={FEATURES.shotLabel(f.name)}>
        {FEATURE_LIST.map((x) => (
          <img
            key={x.id}
            className={x.id === on ? "is-on" : undefined}
            src={TALL[`./shots/tall/${x.id}.webp`] ?? x.shot.src}
            width={TALL_W}
            height={TALL_H}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ))}
        <span className="ft-shot-hint" aria-hidden="true">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6.5 4.2v11.6c0 .6.6.9 1.1.6l9-5.8a.7.7 0 0 0 0-1.2l-9-5.8c-.5-.3-1.1 0-1.1.6Z" fill="currentColor" />
          </svg>
          {FEATURES.shotHint}
        </span>
      </button>

      <p className="ftm-line" key={on}>
        {f.headline}
      </p>

      <div className="ftm-grid" role="tablist" aria-label={FEATURES.label}>
        {FEATURE_LIST.map((x) => {
          const lit = x.id === on;
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={lit}
              className={`ftm-mod${lit ? " is-on" : ""}`}
              data-feature={x.id}
              data-testid={`feature-card-${x.id}`}
              onClick={() => pick(x.id)}
            >
              <span className="ftm-mod-icon" aria-hidden="true">
                <Icon name={x.icon} size={16} stroke={1.8} />
              </span>
              <span className="ftm-mod-name">{x.name}</span>
              {lit && auto && seen && <span className="ftm-mod-time" aria-hidden="true" style={{ animationDuration: `${STEP_MS}ms` }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
