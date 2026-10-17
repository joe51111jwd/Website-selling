// The six feature cards (Andrew: "bigger cards where it's like time tracking and then a sentence
// underneath of what it does. And then you click on time tracking, and then you have a subhead, a
// little bit of copy, a couple features"). One open at a time. Closed: the name and one line. Open:
// a subhead, a line or two, three ticks and the primary button.
//
// Desktop: the column beside the app; opening a card switches the app to its screen. Phones: an
// accordion (a tap on the open one closes it), and the open card carries one still of its screen:
// a tap on it opens the full-screen walkthrough at that feature.

import { useId, type CSSProperties } from "react";
import { FEATURES, type FeatureId } from "../../content/features";
import { Icon } from "../../screens/kit/Icon";
import { Cta } from "../ui/Cta";
import { FEATURE_LIST } from "./data";

type Props = {
  open: FeatureId | null;
  /** the feature the pain picker answered with (its card says so) */
  matched?: FeatureId | null;
  onOpen: (id: FeatureId) => void;
  /** phones: tap the open card's still */
  onShot?: (id: FeatureId) => void;
  variant: "desk" | "phone";
};

export function Cards({ open, matched = null, onOpen, onShot, variant }: Props) {
  const base = useId();
  return (
    <div className={`ft-cards ft-cards--${variant}`} data-ft-in="3">
      {FEATURE_LIST.map((f, i) => {
        const on = f.id === open;
        const bid = `${base}-b-${f.id}`;
        const pid = `${base}-p-${f.id}`;
        const lid = `${base}-l-${f.id}`;
        return (
          <div key={f.id} className={`ft-card${on ? " is-open" : ""}`} data-feature={f.id} style={{ "--i": i } as CSSProperties}>
            <h3 className="ft-card-h">
              <button
                type="button"
                id={bid}
                className="ft-card-btn"
                aria-expanded={on}
                aria-controls={pid}
                aria-label={f.name}
                aria-describedby={lid}
                data-testid={`feature-card-${f.id}`}
                data-cursor="link"
                onClick={() => onOpen(f.id)}
              >
                <span className="ft-card-icon" aria-hidden="true">
                  <Icon name={f.icon} size={19} stroke={1.7} />
                </span>
                <span className="ft-card-text">
                  <span className="ft-card-name">{f.name}</span>
                  <span className="ft-card-line" id={lid}>
                    {f.line}
                  </span>
                </span>
                <svg className="ft-card-chev" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </h3>
            <div className="ft-card-panel" id={pid} role="region" aria-labelledby={bid} inert={!on} aria-hidden={!on}>
              <div className="ft-card-panel-in">
                {on && matched === f.id && (
                  <p className="ft-card-match">
                    <span className="ft-card-match-check" aria-hidden="true">
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="m3.5 8.4 2.9 2.9 6.1-6.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {FEATURES.pain.yes}
                  </p>
                )}
                <p className="ft-card-sub">{f.subhead}</p>
                <p className="ft-card-copy">{f.copy}</p>
                {variant === "phone" && on && (
                  <button type="button" className="ft-shot" onClick={() => onShot?.(f.id)} aria-label={FEATURES.shotLabel(f.name)}>
                    <img src={f.shot.src} width={f.shot.w} height={f.shot.h} alt="" loading="lazy" decoding="async" draggable={false} />
                    <span className="ft-shot-hint" aria-hidden="true">
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M6.5 4.2v11.6c0 .6.6.9 1.1.6l9-5.8a.7.7 0 0 0 0-1.2l-9-5.8c-.5-.3-1.1 0-1.1.6Z" fill="currentColor" />
                      </svg>
                      {FEATURES.shotHint}
                    </span>
                  </button>
                )}
                <ul className="ft-ticks">
                  {f.ticks.map((t) => (
                    <li key={t}>
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="m3.2 8.5 3 3 6.6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t}
                    </li>
                  ))}
                </ul>
                <Cta source="features" size="md" className="ft-card-cta" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
