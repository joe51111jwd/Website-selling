// Hero lab · concept 1 · "Fence the Words": the headline is the jobsite.
//
// The type is the hero. The intro's geofence re-stakes itself round the words "every job", the
// contour lines of the ground bend round the copy as if it were a landform, the Hwy 9 crew walk
// in and clock in on the headline, and one flagging-tape tag tied to the fence rolls once through
// three jobs' profit (one of them red) and parks on today's number. The orange CTA sits alone
// under the copy and gets the same fence when it arrives.
//
// React renders the copy and empty layers; ./engine.ts measures the set type (after the fonts
// load), builds the contours, the fence and the walks, and plays the first seconds (WAAPI,
// transform + opacity only on phones). Standalone: open ./dev.html (?intro=0 skips the stand-in
// intro, ?angle=overbudget|timecards|payroll|replace, ?seek=ms freezes a frame).

import { useLayoutEffect, useMemo, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { Logo } from "../../brand/Logo";
import "../../site/ui/cta.css";
import "./hl0.css";
import { COPY, CREW, HEROES, LOGOS, LOGO_VECTORS, readAngle, type Line } from "./data";
import { mountHero } from "./engine";

const PHONE_Q = "(max-width: 760px)";
const subscribe = (f: () => void) => {
  const mq = matchMedia(PHONE_Q);
  mq.addEventListener("change", f);
  return () => mq.removeEventListener("change", f);
};
const usePhone = () => useSyncExternalStore(subscribe, () => matchMedia(PHONE_Q).matches, () => false);

/** The intro plays once per page view (a later re-layout, e.g. crossing 760 px, does not replay it). */
let introPlayed = false;

function H1Line({ l, i }: { l: Line; i: number }) {
  return (
    <span className={`hl0-line${l.fence ? " hl0-line--fence" : ""}`} data-i={i}>
      <span className="hl0-line-in">
        {l.pre}
        {l.fence && (
          <span className="hl0-fenced" data-cursor="default">
            {l.fence}
          </span>
        )}
        {l.post}
        <i className="hl0-base" />
      </span>
    </span>
  );
}

const Arrow = () => (
  <svg className="cta-arrow" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M3.5 9h10.2M9.6 4.6 14 9l-4.4 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function HeroFence({ intro }: { intro?: boolean }) {
  const phone = usePhone();
  const angle = useMemo(readAngle, []);
  const hero = HEROES[angle];
  const lines = phone ? hero.phone : hero.desk;
  const root = useRef<HTMLElement>(null);
  const q = useMemo(() => new URLSearchParams(location.search), []);
  const wantIntro = intro ?? q.get("intro") !== "0";

  useLayoutEffect(() => {
    const playIntro = wantIntro && !introPlayed;
    root.current!.dataset.intro = playIntro ? "1" : "0";
    return mountHero(root.current!, {
      phone,
      intro: playIntro,
      hero,
      angle,
      seek: q.has("seek") ? Number(q.get("seek")) : null,
      // set once the intro actually starts (StrictMode's throwaway first mount never gets there)
      onIntro: () => (introPlayed = true),
    });
  }, [phone, angle, hero, wantIntro, q]);

  const rows = hero.flag;
  return (
    <section className="hl0" ref={root} aria-label="SmartCrew" data-intro={wantIntro ? "1" : "0"}>
      <div className="hl0-topo" aria-hidden="true">
        <div className="hl0-topo-drift">
          <svg>
            <path className="mi" />
            <path className="ma" />
          </svg>
        </div>
      </div>

      <header className="hl0-head">
        <a className="hl0-logo" href="#top" aria-label="SmartCrew, back to the top">
          <Logo decorative />
        </a>
        <nav className="hl0-nav" aria-label="Page">
          {COPY.nav.map((n) => (
            <a key={n} href={`#${n === "FAQ" ? "faq" : "day"}`} data-cursor="link">
              {n}
            </a>
          ))}
        </nav>
      </header>

      <div className="hl0-copy">
        <p className="hl0-eyebrow">{COPY.eyebrow}</p>
        <h1 className="hl0-h1" aria-label={hero.h1}>
          <span aria-hidden="true">
            {lines.map((l, i) => (
              <H1Line key={i} l={l} i={i} />
            ))}
          </span>
        </h1>
        {(
          <button type="button" className="hl0-chip" aria-label={`${hero.chip[hero.chip.length - 1]} (demo account)`}>
            <svg className="hl0-chip-glyph" viewBox="0 0 15 13" aria-hidden="true">
              <path d="M1 6.5 4 1.2h7L14 6.5 11 11.8H4Z" />
            </svg>
            <span className="hl0-chip-win">
              <span className="hl0-chip-strip">
                {hero.chip.map((c, i) => {
                  const [a, b] = c.split(" · ");
                  const rest = c.slice(a.length + 3);
                  return (
                    <span className="hl0-chip-row" key={i}>
                      {b ? (
                        <>
                          {a} · <b data-tone={rows[Math.min(i, rows.length - 1)].tone}>{rest}</b>
                        </>
                      ) : (
                        c
                      )}
                    </span>
                  );
                })}
              </span>
            </span>
          </button>
        )}
        <p className="hl0-sub">{hero.sub}</p>
        <div className="hl0-act">
          <span className="hl0-cta-wrap">
            <button type="button" className="cta cta--xl hl0-cta" data-cursor="cta" data-cursor-magnet={7}>
              <span className="cta-label">{COPY.cta}</span>
              <Arrow />
            </button>
          </span>
          <button type="button" className="hl0-demo" data-cursor="link">
            {COPY.demo}
          </button>
        </div>
        <p className="hl0-micro">
          {COPY.micro[0]}
          <span className="hl0-nw">{COPY.micro[1]}</span>
          {COPY.micro[2]}
        </p>
        <p className="hl0-phone-note">{COPY.demoNote}</p>
      </div>

      <div className="hl0-foot">
        <div className="hl0-logos">
          <span className="hl0-logos-k">{COPY.usedBy}</span>
          <ul>
            {LOGOS.map((l) => {
              const h = Math.round(Math.sqrt(1900 / l.aspect));
              return (
                <li key={l.name}>
                  <img
                    src={"/" + (LOGO_VECTORS[l.name] ?? l.src)}
                    alt={l.name}
                    width={Math.round(h * l.aspect)}
                    height={h}
                    style={{ "--h": `${h}px` } as CSSProperties}
                  />
                </li>
              );
            })}
          </ul>
        </div>
        <button type="button" className="hl0-cue" data-cursor="link">
          <span>{COPY.cue}</span>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2.5v10.2M3.8 8.6 8 12.8l4.2-4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* the intro's last frame (stand-in for index.html's #intro), handed over into the hero */}
      <div className="hl0-night" aria-hidden="true">
        <div className="hl0-night-bg" />
        <div className="hl0-night-map">
          <svg>
            <path className="mi" />
            <path className="ma" />
            <polygon className="zone" />
          </svg>
        </div>
        <div className="hl0-dawn" />
        <span className="hl0-night-label">{COPY.site}</span>
        <span className="hl0-night-logo">
          <Logo tone="white" decorative />
        </span>
        <div className="hl0-note" data-note="clockin">
          <span className="hl0-note-av is-on">MB</span>
          <span className="hl0-note-tx">
            <b>Marcus Bell clocked in</b>
            <span>Hwy 9 Culvert · Pipe Laying</span>
          </span>
          <span className="hl0-note-time">6:42 AM</span>
        </div>
        <div className="hl0-note" data-note="load">
          <span className="hl0-note-av">
            <svg viewBox="0 0 24 24">
              <path d="M2.8 15.8V9.6l9.6-2.4v8.6M12.4 9.6h4.4l3.6 3.6v2.6" />
              <circle cx="6.4" cy="17.4" r="1.9" />
              <circle cx="17.2" cy="17.4" r="1.9" />
              <path d="M8.3 17.4h7M2.8 15.8h1.7M19.1 15.8h1.3" />
            </svg>
          </span>
          <span className="hl0-note-tx">
            <b>Load #14 logged</b>
            <span>12 yd³ select fill · Hollis pit</span>
          </span>
          <span className="hl0-note-time">9:20 AM</span>
        </div>
        <div className="hl0-note hl0-note--money" data-note="profit">
          <span className="hl0-note-av">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8.8" />
              <path d="M14.6 9.3c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 2 0 2.6 5.3 1.4 5.3 4.2 0 1.2-1.2 2-2.7 2-1.3 0-2.4-.6-2.8-1.6M12 6.4v1.4M12 16v1.6" />
            </svg>
          </span>
          <span className="hl0-note-tx">
            <b>+$4,120 today</b>
            <span>Hwy 9 Culvert · job profit</span>
          </span>
          <span className="hl0-note-time">5:00 PM</span>
        </div>
      </div>

      <div className="hl0-fx" aria-hidden="true">
        <div className="hl0-svgl hl0-tape" />
        <div className="hl0-svgl hl0-ring" />
        <div className="hl0-svgl hl0-ring-s" />
        <div className="hl0-svgl hl0-nfence" />
        <div className="hl0-svgl hl0-fence" />
        <div className="hl0-svgl hl0-pulse" />
        {!phone && (
          <>
            {CREW.map((c) => (
              <span className="hl0-stamp" data-id={c.id} key={c.id}>
                {c.time}
              </span>
            ))}
            <div className="hl0-tally">
              <i className="hl0-tally-dot" />
              <span className="hl0-odo">
                <span className="hl0-odo-in">
                  {CREW.map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </span>
              </span>
              <span>{COPY.onSite}</span>
            </div>
            <div className="hl0-flag" data-cursor="link">
              <div className="hl0-flag-shadow" />
              <svg className="hl0-flag-bg" />
              <div className="hl0-flag-win">
                <div className="hl0-flag-strip">
                  {rows.map((r, i) => (
                    <div className="hl0-flag-row" key={i}>
                      <span className="hl0-flag-job">{r.job}</span>
                      <span className="hl0-flag-state" data-tone={r.tone}>
                        {r.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="hl0-flag-note">{COPY.demoNote}</p>
          </>
        )}
        {CREW.map((c) => (
          <div className="hl0-mk" data-id={c.id} key={c.id}>
            <span className="hl0-mk-i">{c.initials}</span>
            <span className="hl0-mk-t">{c.time}</span>
            <i className="hl0-mk-ring" />
            <i className="hl0-mk-dot" />
          </div>
        ))}
      </div>
    </section>
  );
}
