// 8 · FAQ + the close (BRIEF §8, PLAYBOOK S8; round 2 §6). Five questions, one open at a time,
// answers that start with the fact; beside them the page's close: the devices come back (they
// glide in from the right as this scene comes up, in the hero's own composition, so the page
// bookends with the product: the Stage's returnKeys) over Andrew's last line and the last orange
// CTA. That CTA waits (hidden) while the offer's CTA above it is still on screen, so two orange
// buttons never show together (src/site/shell/primaryCta.ts usePrimaryElsewhere).

import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ANDREW, ANGLES, CTA, FAQ_CLOSE, FAQ_TITLE, FAQS, FLAG, readAngle } from "../../content/copy";
import { trackCustom } from "../../lib/track";
import { StageAnchor, phone, returnKeys, type PoseKey } from "../../three/stage";
import { usePhoneLite } from "../phone";
import { usePrimaryElsewhere } from "../shell/primaryCta";
import { Scene } from "../scene/Scene";
import { DemoButton, TrialButton } from "../offer/Actions";
import { PHONE_HERO_STILL } from "../hero/still";
import { useSeen } from "../offer/useSeen";
import "./faq.css";

/** The hero's composition (src/site/hero/Hero.tsx heroPoses), on the hero's own laptop screen. */
function closePose(): Omit<PoseKey, "at"> {
  const laptop = ANGLES[readAngle()].laptop;
  return phone
    ? {
        anchor: "faq",
        frame: [5.2, 3.0],
        macbook: { x: -0.35, y: -0.1, z: -0.4, rx: 14, ry: -18, rz: 0, s: 1, screen: laptop },
        iphone: { x: 1.75, y: -0.25, z: 1.0, rx: 6, ry: -16, rz: -3, s: 1.08, screen: "phone-working" },
        display: { show: 0 },
        float: 0.8,
        look: 0.6,
        view: { rx: 0, ry: 0 },
        light: { key: 1, warm: 0 },
      }
    : {
        anchor: "faq",
        frame: [4.4, 2.75],
        macbook: { x: -0.32, y: 0.16, z: -0.5, rx: 14, ry: -26, rz: 0, s: 1, screen: laptop },
        iphone: { x: 1.3, y: -0.32, z: 1.5, rx: 5, ry: -20, rz: -3.5, s: 1.06, screen: "phone-working" },
        display: { show: 0 },
        float: 0.8,
        look: 0.8,
        view: { rx: 0, ry: 0 },
        light: { key: 1, warm: 0 },
      };
}

/**
 * Where the anchor sits in the section, in scene progress units, so the return is timed to the
 * anchor coming up the screen (not the section's top: on phones the close sits below the list).
 */
function useAnchorSpot(section: React.RefObject<HTMLDivElement | null>, anchor: React.RefObject<HTMLDivElement | null>) {
  const [spot, setSpot] = useState<{ c: number; vh: number } | null>(null);
  useLayoutEffect(() => {
    const s = section.current?.closest("section");
    const a = anchor.current;
    if (!s || !a) return;
    const read = () => {
      const H = s.offsetHeight || 1;
      const sr = s.getBoundingClientRect();
      const ar = a.getBoundingClientRect();
      // the anchor's centre, from the section's top, and one viewport, both as fractions of H
      const c = (ar.top + ar.height / 2 - sr.top) / H;
      const vh = window.innerHeight / H;
      setSpot((p) => (p && Math.abs(p.c - c) < 0.005 && Math.abs(p.vh - vh) < 0.005 ? p : { c, vh }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(s);
    window.addEventListener("resize", read);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [section, anchor]);
  return spot;
}

/**
 * Phones (PHONE MODE): no Stage, so no return keys and no anchor measuring (it would force the
 * still-skipped section to lay out as soon as it mounts): the same questions and close, compact.
 */
export default function Faq() {
  return usePhoneLite() ? <FaqPhone /> : <FaqDesk />;
}

function FaqPhone() {
  const root = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  return (
    <Scene id="faq" pinnedViewports={0} stage="keep" label={FAQ_TITLE} className="faq faq--phone">
      <FaqBody root={root} anchor={anchor} />
    </Scene>
  );
}

function FaqDesk() {
  const root = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const spot = useAnchorSpot(root, anchor);
  // the return (Stage returnKeys, from the right, where Five apps sent them): out of frame while
  // the offer is up; gliding in as the anchor comes up from below; in the hero's shot by the time
  // the anchor's centre is at 62 % of the viewport; held to the end of the page. Offsets are in
  // screens from this section's top (returnKeys' units); the glide never starts before the
  // offer's own "keep them out" keys (src/site/offer/Offer.tsx, 0.2 screen before its top).
  const poses = useMemo<PoseKey[] | undefined>(() => {
    if (!spot) return undefined;
    const pose = closePose();
    const cVh = spot.c / spot.vh; // the anchor's centre, in screens below this section's top
    const end = cVh - 0.62;
    const start = Math.max(end - 0.68, -0.85);
    return [...returnKeys(pose, { side: 1, start, end }), { ...pose, at: Math.max(1, spot.c - 0.62 * spot.vh + 0.01) }];
  }, [spot]);
  return (
    <Scene id="faq" pinnedViewports={0} poses={poses} stage="keep" label={FAQ_TITLE} className="faq">
      <FaqBody root={root} anchor={anchor} />
    </Scene>
  );
}

function FaqBody({ root, anchor }: { root: React.RefObject<HTMLDivElement | null>; anchor: React.RefObject<HTMLDivElement | null> }) {
  const [open, setOpen] = useState(0);
  const lite = usePhoneLite();
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const seen = useSeen(root, 0.25);
  // the last CTA waits while the offer's is still on screen (one orange button at a time)
  const close = useRef<HTMLDivElement>(null);
  const held = usePrimaryElsewhere(close);

  const toggle = (i: number) => {
    setOpen((o) => (o === i ? -1 : i));
    if (open !== i) trackCustom("faq_open", { faq_id: FAQS[i].id });
  };

  return (
    <div className={`faq-grid wrap${seen ? " is-seen" : ""}`} ref={root}>
      <div className="faq-main">
        <h2 className="t-h2 faq-title">{FAQ_TITLE}</h2>
        <ul className="faq-list">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            const qId = `${base}-q${i}`;
            const aId = `${base}-a${i}`;
            return (
              <li key={f.id} className={`faq-item${isOpen ? " is-open" : ""}`} style={{ ["--i" as string]: i }}>
                <h3 className="faq-h">
                  <button type="button" id={qId} className="faq-q" aria-expanded={isOpen} aria-controls={aId} onClick={() => toggle(i)}>
                    <span className="faq-q-text">{f.q}</span>
                    <span className="faq-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path className="faq-icon-h" d="M7 12h10" />
                        <path className="faq-icon-v" d="M12 7v10" />
                      </svg>
                    </span>
                  </button>
                </h3>
                <div id={aId} role="region" aria-labelledby={qId} className="faq-a" inert={!isOpen}>
                  <div className="faq-a-in">
                    <p className="faq-a-text" data-cursor="text">
                      {f.a}
                      {f.flag && (
                        <span className="flag" title={f.flag}>
                          {FLAG}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* the close: the product back on screen, Andrew's last line, the last CTA */}
      <div className="faq-close" ref={close} data-cta-held={held}>
        <div ref={anchor} className="faq-stage-box">
          {lite ? (
            // phones (no 3D): the hero's still of the real devices bookends the page (same file
            // and same `sizes` as the hero, so it comes from the cache)
            <img
              className="faq-still"
              src={PHONE_HERO_STILL.src}
              srcSet={PHONE_HERO_STILL.srcSet}
              sizes="(max-width: 760px) 100vw, 390px"
              alt=""
              width={1170}
              height={774}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <StageAnchor id="faq" className="faq-stage" />
          )}
        </div>
        <div className="faq-close-head">
          <img className="faq-face" src={import.meta.env.BASE_URL + ANDREW.face} alt="" width={48} height={48} loading="lazy" decoding="async" />
          <p className="faq-close-line">{FAQ_CLOSE.line}</p>
        </div>
        <div className="faq-actions">
          <TrialButton source="faq" size="lg" />
          <DemoButton source="faq" />
        </div>
        <p className="t-micro faq-micro">{CTA.micro}</p>
      </div>
    </div>
  );
}
