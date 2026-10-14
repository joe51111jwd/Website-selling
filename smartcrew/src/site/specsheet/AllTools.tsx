// "Show everything": the plain list, for people who want to read. Every tool of the six groups
// with its one plain line (⚑ where Andrew still has to confirm it). A tool that has a spot in the
// app is a button: it closes the list and shows that spot. A modal dialog (focus kept inside,
// Escape or Close shuts it, focus goes back to what opened it), portalled to <body>, the page
// held still underneath. Desktop: a panel over the section; phones: a sheet up from the bottom.
// Open/close is opacity + transform only.

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { SPEC } from "../../content/copy";
import { lockScroll } from "../scroll";
import { CATEGORIES, TOOL_COUNT, type Tool } from "./data";

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
  /** A tool with a spot was picked: show it (the list closes first). */
  onPick: (t: Tool) => void;
  /** Whether a tool has a spot to show. */
  canShow: (t: Tool) => boolean;
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

function Panel({ up, onClose, onPick, canShow, variant }: Omit<Props, "open"> & { up: boolean }) {
  const titleId = useId();
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
      <div ref={panel} className="spal-panel">
        <div className="spal-head">
          <h2 id={titleId} className="spal-title">
            {SPEC.allTitle(TOOL_COUNT)}
          </h2>
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
                      <span className="spal-line">{t.line}</span>
                    </>
                  );
                  return (
                    <li key={t.id}>
                      {canShow(t) ? (
                        <button type="button" className="spal-tool is-link" data-tool={t.id} onClick={() => onPick(t)}>
                          {name}
                          <span className="spal-see" aria-hidden="true">
                            {SPEC.view}
                            <svg viewBox="0 0 16 16" fill="none">
                              <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </button>
                      ) : (
                        <div className="spal-tool">{name}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
