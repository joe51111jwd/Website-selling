// Watch it work (round 4): the One Day story told in a few seconds of normal scrolling, instead of
// the ride. Seven moments, one row each: the feature headline (big), then the flow of data as the
// picture: the crew phone's chip → a wire with the time of day on it (small) → the row that lands
// in the office (Monday's plan runs the other way: office → the crew's phones). As each row comes
// into view a dot runs along its wire once and the far end lands (~1 s, rows staggered ~0.1 s);
// then everything rests. No pinning, no film, no timeline: one IntersectionObserver, CSS
// transform/opacity animations only, and reduced motion (or no IntersectionObserver) shows the
// end state from the start. Copy: src/content/watch.ts.

import { useEffect, useRef } from "react";
import { WATCH, type WatchMoment } from "../../content/watch";
import type { MomentId } from "../../content/moments";
import { me } from "../../screens/data";
import { Icon, type IconName } from "../../screens/kit/Icon";
import { Scene } from "../scene/Scene";
import { Cta } from "../ui/Cta";
import "./watch.css";

/** The app area each office line lands in, as the app's own outline icon (clock-in: Marcus Bell's
 * avatar, the demo crew's foreman, src/screens/data.ts). */
const OFFICE_ICON: Record<Exclude<MomentId, "clockin">, IconName> = {
  pretrip: "clipboardCheck",
  load: "dumpTruck",
  leak: "wrench",
  profit: "dollarCircle",
  plan: "calendar",
  payroll: "fileText",
};

/** Minimum gap between two rows' starts, so rows that arrive together still play in turn. */
const STAGGER = 110;

function PhoneGlyph() {
  return (
    <svg className="ww-glyph" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="4.25" y="1.75" width="7.5" height="12.5" rx="1.9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 11.9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function OfficeGlyph() {
  return (
    <svg className="ww-glyph" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.75" y="3.25" width="10.5" height="7.5" rx="1.3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.25 13.25h13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Row({ m }: { m: WatchMoment }) {
  const up = m.dir === "up";
  return (
    <li className="ww-item" data-moment={m.id} data-dir={m.dir}>
      <h3 className="ww-h">{m.headline}</h3>
      <p className={`ww-chip ${up ? "ww-src" : "ww-dst"}`}>
        <PhoneGlyph />
        <span className="sr-only">{WATCH.phoneSr} </span>
        {m.phone}
      </p>
      <p className="ww-wire">
        <span className="ww-when">{m.when}</span>
        <span className="ww-line" aria-hidden="true">
          <svg className="ww-tip" viewBox="0 0 8 10" fill="none">
            <path d="M1.5 1.5 6 5l-4.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="ww-run" aria-hidden="true">
          <span className="ww-dot" />
        </span>
      </p>
      <p className={`ww-office ${up ? "ww-dst" : "ww-src"}`}>
        <span className="ww-well" aria-hidden="true">
          {m.id === "clockin" ? <span className="ww-avatar">{me.initials}</span> : <Icon name={OFFICE_ICON[m.id]} size={17} stroke={1.7} />}
        </span>
        <span className="ww-office-txt">
          <span className="sr-only">{WATCH.officeSr} </span>
          {m.office}
        </span>
        <span className="ww-where" aria-hidden="true">
          {m.where}
        </span>
      </p>
    </li>
  );
}

export default function Watch() {
  const board = useRef<HTMLDivElement>(null);

  // each row plays once as it comes into view; rows that arrive together go in turn
  useEffect(() => {
    const el = board.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const rows = Array.from(el.querySelectorAll<HTMLElement>(".ww-item"));
    el.classList.add("ww-armed");
    let next = 0;
    const io = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => rows.indexOf(a) - rows.indexOf(b))
          .forEach((row) => {
            io.unobserve(row);
            const start = Math.max(now, next);
            next = start + STAGGER;
            row.style.setProperty("--ww-d", `${Math.round(start - now)}ms`);
            row.classList.add("is-in");
          });
      },
      { threshold: 0.75, rootMargin: "0px 0px -4% 0px" },
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <Scene id="watch" pinnedViewports={0} stage="keep" label={WATCH.label} className="ww">
      <div className="wrap ww-wrap">
        <header className="ww-head">
          <h2 className="t-h2 ww-title">{WATCH.title}</h2>
          <p className="t-lead ww-sub">{WATCH.sub}</p>
        </header>

        <div className="ww-board" ref={board}>
          <div className="ww-cols" aria-hidden="true">
            <span className="ww-col ww-col--phone">
              <PhoneGlyph />
              {WATCH.phoneHead}
            </span>
            <svg className="ww-col-to" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h9.5M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="ww-col ww-col--office">
              <OfficeGlyph />
              {WATCH.officeHead}
            </span>
          </div>
          <ol className="ww-list" aria-label={WATCH.listLabel}>
            {WATCH.moments.map((m) => (
              <Row key={m.id} m={m} />
            ))}
          </ol>
          <div className="ww-foot">
            <div className="ww-close-group">
              <p className="ww-close">{WATCH.close}</p>
              <Cta source="watch" size="lg" />
            </div>
            <p className="t-micro ww-caption">{WATCH.caption}</p>
          </div>
        </div>
      </div>
    </Scene>
  );
}
