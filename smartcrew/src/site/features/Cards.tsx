// The ten feature cards (Andrew: "bigger cards where it's like time tracking and then a sentence
// underneath of what it does. And then you click on time tracking, and then you have a subhead, a
// little bit of copy, a couple features"; round of Oct 19: ten of them, his copy, "Cut the subcopy
// on the button page", "Cut the 'free trial' button at bottom of each section"). One open at a
// time. Closed: the icon and the name. Open: his headline, his sub and his bullets as ticks.
//
// Desktop: the column beside the app; opening a card switches the app to its screen. Phones: an
// accordion (a tap on the open one closes it), and the open card carries one still of its screen:
// a tap on it opens the full-screen walkthrough at that feature.

import { useId, useLayoutEffect, useRef, type CSSProperties } from "react";
import { FEATURES, type FeatureId } from "../../content/features";
import { Icon } from "../../screens/kit/Icon";
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
  const root = useRef<HTMLDivElement>(null);

  // desktop: the column's tallest state (every card closed, plus the tallest open panel), as
  // --ft-need: the body is at least that tall, so ten cards are never cut on a short laptop and
  // opening another card never changes the section's height (features.css)
  useLayoutEffect(() => {
    const el = root.current;
    if (variant !== "desk" || !el) return;
    let raf = 0;
    const measure = () => {
      const cards = [...el.querySelectorAll<HTMLElement>(".ft-card")];
      let h = (parseFloat(getComputedStyle(el).rowGap) || 0) * (cards.length - 1);
      let panel = 0;
      for (const c of cards) {
        const cs = getComputedStyle(c);
        h += c.querySelector(".ft-card-btn")!.getBoundingClientRect().height + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
        panel = Math.max(panel, c.querySelector(".ft-card-panel-in")!.getBoundingClientRect().height);
      }
      el.style.setProperty("--ft-need", `${Math.ceil(h + panel) + 1}px`);
    };
    measure();
    // the cards' buttons and panels (fonts, width, the picker's line), not the column: its height
    // follows --ft-need. Set on the next frame, so the app's own observer sees one change.
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    el.querySelectorAll(".ft-card-btn, .ft-card-panel-in").forEach((p) => ro.observe(p));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [variant]);

  return (
    <div ref={root} className={`ft-cards ft-cards--${variant}`} data-ft-in="3">
      {FEATURE_LIST.map((f, i) => {
        const on = f.id === open;
        const bid = `${base}-b-${f.id}`;
        const pid = `${base}-p-${f.id}`;
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
                data-testid={`feature-card-${f.id}`}
                data-cursor="link"
                onClick={() => onOpen(f.id)}
              >
                <span className="ft-card-icon" aria-hidden="true">
                  <Icon name={f.icon} size={19} stroke={1.7} />
                </span>
                <span className="ft-card-name">{f.name}</span>
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
                <p className="ft-card-sub">{f.headline}</p>
                <p className="ft-card-copy">{f.sub}</p>
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
