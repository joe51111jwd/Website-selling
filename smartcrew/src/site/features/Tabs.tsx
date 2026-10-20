// Classic's feature cards as tabs (James and Andrew, Oct 20: the cards' type "feels a little tight",
// the card's name read smaller than its headline once opened, and the section didn't fit one
// screen). The ten names are a row of tabs; the picked one's copy sits in one card under them:
// its name as a small label, then Andrew's headline, his sub and his bullets, word for word.
//
// Desktop: the tabs run across the section, the card stands beside the app (picking a tab switches
// the app's screen, as the cards did). Phones: the tabs are one row that swipes sideways, and the
// card carries the screen's still, which opens the full-screen walkthrough at that feature.

import { useId, useRef, type KeyboardEvent } from "react";
import { FEATURES, type FeatureId } from "../../content/features";
import { Icon } from "../../screens/kit/Icon";
import { FEATURE_LIST, featureById, type Feature } from "./data";

type TabsProps = {
  open: FeatureId;
  onOpen: (id: FeatureId) => void;
  variant: "desk" | "phone";
};

const tabId = (base: string, id: FeatureId) => `${base}-t-${id}`;
export const PANEL_ID = "ft-tab-panel";

export function FeatureTabs({ open, onOpen, variant }: TabsProps) {
  const base = useId();
  const row = useRef<HTMLDivElement>(null);

  // phones: keep the picked tab in the row's view (sideways only, the page never moves)
  const pick = (id: FeatureId) => {
    onOpen(id);
    const el = row.current;
    const tab = el?.querySelector<HTMLElement>(`[data-feature="${id}"]`);
    if (variant !== "phone" || !el || !tab) return;
    const left = tab.offsetLeft - el.offsetLeft;
    if (left < el.scrollLeft + 16 || left + tab.offsetWidth > el.scrollLeft + el.clientWidth - 16)
      el.scrollTo({ left: left - (el.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
  };

  // arrow keys move along the tabs (the tablist pattern)
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = FEATURE_LIST.findIndex((f) => f.id === open);
    const n = FEATURE_LIST.length;
    const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    const id = FEATURE_LIST[to].id;
    pick(id);
    row.current?.querySelector<HTMLElement>(`[data-feature="${id}"]`)?.focus();
  };

  return (
    <div ref={row} className={`ft-tabs ft-tabs--${variant}`} role="tablist" aria-label={FEATURES.label} onKeyDown={onKey} data-ft-in="3">
      {FEATURE_LIST.map((f) => {
        const on = f.id === open;
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            id={tabId(base, f.id)}
            className={`ft-tab${on ? " is-on" : ""}`}
            aria-selected={on}
            aria-controls={PANEL_ID}
            tabIndex={on ? 0 : -1}
            data-feature={f.id}
            data-testid={`feature-card-${f.id}`}
            data-cursor="link"
            onClick={() => pick(f.id)}
          >
            <span className="ft-tab-icon" aria-hidden="true">
              <Icon name={f.icon} size={variant === "phone" ? 17 : 20} stroke={1.7} />
            </span>
            <span className="ft-tab-name">{f.name}</span>
          </button>
        );
      })}
    </div>
  );
}

type PanelProps = {
  open: FeatureId;
  variant: "desk" | "phone";
  /** desktop: the card's foot steps on to the next feature */
  onOpen?: (id: FeatureId) => void;
  /** phones: tap the still */
  onShot?: (id: FeatureId) => void;
};

export function FeaturePanel({ open, variant, onOpen, onShot }: PanelProps) {
  const f = featureById(open);
  const i = FEATURE_LIST.findIndex((x) => x.id === open);
  const next = FEATURE_LIST[(i + 1) % FEATURE_LIST.length];
  return (
    <div className={`ft-panel ft-panel--${variant}`} id={PANEL_ID} role="tabpanel" aria-label={f.name} data-ft-in="3">
      {variant === "desk" ? (
        // desktop: every feature's copy sits in the same spot, the picked one shown, so the card is
        // always the tallest one's height and switching tabs never moves the page
        <div className="ft-panel-stack">
          {FEATURE_LIST.map((x) => (
            <Copy key={x.id} f={x} on={x.id === open} />
          ))}
        </div>
      ) : (
        // phones: the picked one alone (keyed: its copy fades in fresh)
        <Copy key={f.id} f={f} on onShot={onShot} phone />
      )}
      {variant === "desk" && (
        <button type="button" className="ft-panel-next" data-cursor="link" onClick={() => onOpen?.(next.id)}>
          <span className="ft-panel-next-n">
            {i + 1} / {FEATURE_LIST.length}
          </span>
          <span className="ft-panel-next-to">
            Next: {next.name}
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

function Copy({ f, on, phone = false, onShot }: { f: Feature; on: boolean; phone?: boolean; onShot?: (id: FeatureId) => void }) {
  return (
    <div className={`ft-panel-in${on ? " is-on" : ""}`} aria-hidden={!on} inert={!on}>
      {/* phones: the picked tab, just above, already names it */}
      {!phone && <p className="ft-panel-name">{f.name}</p>}
      <h3 className="ft-panel-head">{f.headline}</h3>
      <p className="ft-panel-copy">{f.sub}</p>
      {phone && (
        <button type="button" className="ft-shot ft-panel-shot" onClick={() => onShot?.(f.id)} aria-label={FEATURES.shotLabel(f.name)}>
          <img src={f.shot.src} width={f.shot.w} height={f.shot.h} alt="" loading="lazy" decoding="async" draggable={false} />
          <span className="ft-shot-hint" aria-hidden="true">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6.5 4.2v11.6c0 .6.6.9 1.1.6l9-5.8a.7.7 0 0 0 0-1.2l-9-5.8c-.5-.3-1.1 0-1.1.6Z" fill="currentColor" />
            </svg>
            {FEATURES.shotHint}
          </span>
        </button>
      )}
      <ul className="ft-ticks ft-panel-ticks">
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
  );
}
