import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ScreenWindow from "./ScreenWindow";
import { FEATURE_COUNT, GROUPS, type Feature, type Group } from "./features";
import { SIZE, screenById } from "../../screens/registry";
import { track } from "./track";

// S5 "What it does": a click-driven reel inside one fixed-height panel (Toast/Cerebrium,
// no scroll-jacking, no auto-rotation per PLAYBOOK S5 rule 8). Column 1 = the 4 groups
// (always visible, with counts), column 2 = every feature of the open group as a plain
// line, column 3 = the real screen for the open line, panned to the part that matters.

const EASE = [0.23, 1, 0.32, 1] as const;

export function useCompact() {
  const q = "(max-width: 720px)";
  const [c, setC] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setC(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return c;
}

/** On a phone the window zooms in around the callout so the UI stays legible. */
function compactFocus(f: Feature) {
  const def = f.screen ? screenById(f.screen) : undefined;
  if (!f.focus || !def) return f.focus;
  if (def.kind === "phone") return f.focus;
  const w = Math.round((f.focus.w ?? SIZE.web.w) * 0.6);
  if (f.callout) return { x: f.callout.x - w * 0.45, y: f.callout.y - w * 0.28, w };
  return { x: f.focus.x, y: f.focus.y, w };
}

export default function FeatureSystem({ initialGroup = "profit" as Group["id"] }) {
  const compact = useCompact();
  const reduce = useReducedMotion();
  const [gid, setGid] = useState<Group["id"]>(initialGroup);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const group = GROUPS.find((g) => g.id === gid)!;
  const idx = picked[gid] ?? 0;
  const f = group.features[idx];
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    track("module_view", { module_id: f.id, group: gid });
  }, [f.id, gid]);

  const pick = (i: number, focus = false) => {
    const n = group.features.length;
    const j = (i + n) % n;
    setPicked((p) => ({ ...p, [gid]: j }));
    if (focus) listRef.current?.querySelectorAll<HTMLButtonElement>("button")[j]?.focus();
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      pick(idx + 1, true);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      pick(idx - 1, true);
    }
  };

  const def = f.screen ? screenById(f.screen) : undefined;
  const kind = def?.kind ?? "web";
  const focus = useMemo(() => (compact ? compactFocus(f) : f.focus), [compact, f]);
  const next = group.features[(idx + 1) % group.features.length];

  const shot = (
    <div className={`fs-shot fs-shot-${f.screen ? kind : "none"}`}>
      {f.screen && !f.confirm ? (
        <>
          <ScreenWindow key={kind} id={f.screen} focus={focus} callout={f.callout} className={`fs-win fs-win-${kind}`} label={`${f.name}: SmartCrew ${kind === "phone" ? "crew app" : "office"} screen`} />
        </>
      ) : (
        <div className={`fs-empty ${f.confirm ? "ph" : ""}`}>
          {f.confirm ? (
            <>
              <span className="ph-tag">Placeholder for Andrew</span>
              <p>Andrew confirms this one is live before it gets a screen here.</p>
            </>
          ) : (
            <p>No demo screen for this one yet. Ask Andrew to show it on your call.</p>
          )}
        </div>
      )}
    </div>
  );

  const head = (
    <div className="fs-head">
      <div className="fs-meta">
        <span className="fs-side">{f.side}</span>
        {!compact && (
          <span className="fs-step tnum">
            <button type="button" className="fs-arrow focusable" aria-label="Previous feature" onClick={() => pick(idx - 1)}>
              <Chevron dir="up" />
            </button>
            <span>
              {idx + 1} of {group.features.length}
            </span>
            <button type="button" className="fs-arrow focusable" aria-label="Next feature" onClick={() => pick(idx + 1)}>
              <Chevron dir="down" />
            </button>
          </span>
        )}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={f.id}
          className="fs-copy"
          initial={{ opacity: 0, y: reduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -4 }}
          transition={{ duration: 0.18, ease: EASE }}
        >
          <h3 className="h3">
            {f.name}
            {f.confirm && <span className="ph-tag fs-confirm">Andrew to confirm</span>}
          </h3>
          <p className="fs-line">{f.line}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <section className="sec fs" id="what-it-does" aria-labelledby="fs-h">
      <div className="fs-top">
        <h2 className="h2 fs-h" id="fs-h">
          All {FEATURE_COUNT} things SmartCrew does, in 4&nbsp;groups.
        </h2>
        <p className="fs-hint">Pick a group, then any line, to see the real screen.</p>
      </div>
      <div className="fs-panel">
        <div className="fs-index">
          <div className="fs-groups" role="tablist" aria-label="Feature groups">
            {GROUPS.map((g) => {
              const on = g.id === gid;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  id={`fs-tab-${g.id}`}
                  aria-selected={on}
                  aria-controls="fs-list"
                  className={`fs-g focusable ${on ? "is-on" : ""}`}
                  onClick={() => setGid(g.id)}
                >
                  <span className="fs-g-name">{compact ? g.short : g.name}</span>
                  <span className="fs-g-n tnum">{g.features.length}</span>
                  {!compact && (
                    <span className="fs-g-promise">
                      <span>{g.promise}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {!compact && (
            <p className="fs-index-foot caption">
              The crew app is on their phones. The office app is on your computer.
            </p>
          )}
        </div>

        {compact && (
          <div className="fs-stage fs-stage-compact">
            {shot}
            {head}
          </div>
        )}

        <div className="fs-listwrap" role="tabpanel" id="fs-list" aria-labelledby={`fs-tab-${gid}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.ol
              key={gid}
              ref={listRef}
              className="fs-list"
              style={{ ["--rows" as string]: group.features.length }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onKeyDown={onListKey}
            >
              {group.features.map((ft, i) => (
                <li key={ft.id}>
                  <button type="button" className={`fs-f focusable ${i === idx ? "is-on" : ""} ${ft.confirm ? "is-confirm" : ""}`} aria-current={i === idx} tabIndex={i === idx ? 0 : -1} onClick={() => pick(i)}>
                    <span className="fs-dot" aria-hidden />
                    <span className="fs-f-name">{ft.name}</span>
                    {ft.confirm && <span className="fs-f-flag">to confirm</span>}
                  </button>
                </li>
              ))}
            </motion.ol>
          </AnimatePresence>
          {compact && (
            <button type="button" className="fs-next focusable" onClick={() => pick(idx + 1)}>
              Next: {next.name}
            </button>
          )}
        </div>

        {!compact && (
          <div className={`fs-stage fs-stage-${f.screen && !f.confirm ? kind : "none"}`}>
            {head}
            {shot}
            {f.screen && !f.confirm && <p className="fs-cap caption">Demo account. Names and numbers are made up.</p>}
          </div>
        )}
      </div>
    </section>
  );
}

function Chevron({ dir }: { dir: "up" | "down" }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {dir === "up" ? <path d="M4 10l4-4 4 4" /> : <path d="M4 6l4 4 4-4" />}
    </svg>
  );
}
