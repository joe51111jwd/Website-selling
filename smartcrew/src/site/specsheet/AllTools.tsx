// "See all 38 tools": every tool of the six groups as a grid of six boxes, each tool a short chip
// (its one plain line is the tooltip; ⚑ where Andrew still has to confirm it). Every tool is a
// button: it starts the flat walkthrough there (./Walk.tsx), which then plays on through all 38;
// "Walk through all 38" starts it at the first. A modal dialog (focus kept inside, Escape or Close
// shuts it, focus goes back to what opened it), portalled to <body>, the page held still
// underneath. Desktop: a panel over the section; phones: a sheet up from the bottom.
// Open/close is opacity + transform only.

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { SPEC } from "../../content/copy";
import { lockScroll } from "../scroll";
import { CATEGORIES, TOOL_COUNT } from "./data";
import { Walk, WALK_COPY, stepOf } from "./Walk";

const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Flag() {
  return (
    <span className="flag spec-flag" title={SPEC.flagTitle} aria-label={SPEC.flagTitle} role="img">
      ⚑
    </span>
  );
}

export function GridGlyph({ className = "spec-glyph" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {[2, 7.25, 12.5].flatMap((x) => [2, 7.25, 12.5].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="3.5" height="3.5" rx="0.9" fill="currentColor" />))}
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** Open straight into the walkthrough at this step (0 = the first tool). */
  startAt?: number | null;
  variant: "desk" | "phone";
};

export function AllTools({ open, ...rest }: Props) {
  // mounted while open and while it leaves
  const [shown, setShown] = useState(open);
  const [up, setUp] = useState(false);
  // the page stays put underneath; only the lock this list took is ever released
  const holds = useRef(false);
  const hold = (on: boolean) => {
    if (holds.current === on) return;
    holds.current = on;
    lockScroll(on);
  };
  useEffect(() => {
    if (open) {
      setShown(true);
      hold(true);
      let r2 = 0;
      const r = requestAnimationFrame(() => (r2 = requestAnimationFrame(() => setUp(true))));
      return () => {
        cancelAnimationFrame(r);
        cancelAnimationFrame(r2);
      };
    }
    setUp(false);
    hold(false);
    const t = window.setTimeout(() => setShown(false), reduce ? 0 : 320);
    return () => window.clearTimeout(t);
  }, [open]);
  useEffect(() => () => hold(false), []);

  if (!shown) return null;
  return createPortal(<Panel up={up && open} {...rest} />, document.body);
}

function Panel({ up, onClose, startAt = null, variant }: Omit<Props, "open"> & { up: boolean }) {
  const titleId = useId();
  // null: the grid; a number: the walkthrough, at that step
  const [walk, setWalk] = useState<number | null>(startAt);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null);

  useEffect(() => {
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>(".spal-x")?.focus({ preventScroll: true }), reduce ? 0 : 40);
    const back = opener.current;
    return () => {
      window.clearTimeout(t);
      // focus goes back to what opened the list (unless a pick moved it on purpose)
      if (back && document.activeElement && (document.activeElement === document.body || panel.current?.contains(document.activeElement)))
        back.focus({ preventScroll: true });
    };
  }, []);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const f = [...panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href]")];
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={`spal spal--${variant}${up ? " is-up" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKey}>
      <div className="spal-scrim" onClick={onClose} aria-hidden="true" />
      <div ref={panel} className={`spal-panel${walk !== null ? " is-walk" : ""}`}>
        <h2 id={titleId} className="sr-only">
          {SPEC.allTitle(TOOL_COUNT)}
        </h2>
        {walk !== null ? (
          <Walk start={walk} onBack={() => setWalk(null)} onClose={onClose} variant={variant} />
        ) : (
          <Grid titleId={titleId} onClose={onClose} onWalk={setWalk} />
        )}
      </div>
    </div>
  );
}

function Grid({ titleId, onClose, onWalk }: { titleId: string; onClose: () => void; onWalk: (i: number) => void }) {
  return (
    <>
        <div className="spal-head">
          <p className="spal-title" aria-hidden="true">
            {SPEC.allTitle(TOOL_COUNT)}
          </p>
          <button type="button" className="spal-walk" onClick={() => onWalk(0)} data-cursor="link">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6.5 4.2v11.6c0 .6.6.9 1.1.6l9-5.8a.7.7 0 0 0 0-1.2l-9-5.8c-.5-.3-1.1 0-1.1.6Z" fill="currentColor" />
            </svg>
            {WALK_COPY.start(TOOL_COUNT)}
          </button>
          <button type="button" className="spal-x" onClick={onClose} aria-label={`${SPEC.close}: ${SPEC.allTitle(TOOL_COUNT)}`}>
            <span>{SPEC.close}</span>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="spal-body" data-lenis-prevent>
          {CATEGORIES.map((c) => (
            <section key={c.id} className="spal-group" aria-labelledby={`${titleId}-${c.id}`}>
              <h3 id={`${titleId}-${c.id}`} className="spal-h">
                <span>{c.name}</span>
                <span className="spal-n">{c.tools.length}</span>
              </h3>
              <ul className="spal-list">
                {c.tools.map((t) => {
                  const name = (
                    <>
                      <span className="spal-name">
                        {t.label}
                        {t.confirm && <Flag />}
                      </span>
                    </>
                  );
                  return (
                    <li key={t.id}>
                      <button type="button" className="spal-tool is-link" data-tool={t.id} title={t.line} onClick={() => onWalk(stepOf(t.id))}>
                        {name}
                        <span className="spal-see" aria-hidden="true">
                          {SPEC.view}
                          <svg viewBox="0 0 16 16" fill="none">
                            <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
    </>
  );
}
