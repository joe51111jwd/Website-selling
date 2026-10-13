// 7 · Andrew + the offer (BRIEF §7, beat 8). The man you'll talk to, in three lines from his own
// letter, and his offer as a receipt that prints as it comes into view: everything you get, and
// what it costs you (one call). The receipt is signed; the CTA sits directly under it.

import { useEffect, useRef, useState, type RefObject } from "react";
import { exitKeys } from "../../three/stage";
import { motion, useScroll, useTransform } from "motion/react";
import { ANDREW, CTA } from "../../content/copy";
import { reducedMotion } from "../../three/stage";
import { Scene } from "../scene/Scene";
import { Receipt } from "./Receipt";
import { useSeen } from "./useSeen";
import { DemoButton, TrialButton } from "./Actions";
import { playCue } from "../ui/cue";
import { usePhoneLite } from "../phone";
import OfferPhone from "./OfferPhone";
import "./offer.css";

// No devices here: Five apps glides them out past the right edge as this scene comes up (its exit
// ends 0.24 screen before this scene's top). These keys keep them out (the Stage's `out`, never a
// shrink in place). Both sit just after that exit and well before the FAQ's return keys: a key at
// this natural-height scene's end would land after the FAQ has started bringing them back.
const OFFER_POSES = exitKeys({ hold: true, side: 1, start: -0.2, end: -0.18 });

/** Phones (PHONE MODE): face, one line, the receipt (simplified, prints once), the CTA (./OfferPhone.tsx). */
export default function Offer() {
  return usePhoneLite() ? <OfferPhone /> : <OfferDesk />;
}

function OfferDesk() {
  return (
    // natural height, tight to its content (BRIEF round 2 §7): no empty band above or below it
    <Scene id="offer" pinnedViewports={0} poses={OFFER_POSES} label="Andrew and the offer" className="offer">
      <OfferBody />
    </Scene>
  );
}

function OfferBody() {
  const grid = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLButtonElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const under = useUnderHeader(actions);

  // Andrew rises out of the ground as the scene arrives (scroll-linked, small)
  const { scrollYProgress } = useScroll({ target: grid, offset: ["start end", "start 0.15"] });
  const photoY = useTransform(scrollYProgress, [0, 1], [reducedMotion ? 0 : 56, 0]);

  // the title and story enter once, the first time they're seen
  const seen = useSeen(grid);

  // once the slip is signed, the button below it gets its one "clocked in" cue: the geofence
  // draws round it and closes (the same cue every primary CTA plays once, held back until now)
  const cued = useRef(false);
  const ping = () => {
    const b = cta.current;
    if (!b || reducedMotion || cued.current) return;
    cued.current = true;
    playCue(b);
  };

  const [no1, no2, just] = splitTitle(ANDREW.title);

  return (
    <div className={`offer-grid wrap${seen ? " is-seen" : ""}`} ref={grid}>
      <div className="offer-story">
        <h2 className="t-h2 offer-title">
          <span className="offer-title-line is-muted" style={{ ["--d" as string]: "0ms" }}>
            {no1}
          </span>{" "}
          <span className="offer-title-line is-muted" style={{ ["--d" as string]: "90ms" }}>
            {no2}
          </span>{" "}
          <span className="offer-title-line" style={{ ["--d" as string]: "200ms" }}>
            {just}
          </span>
        </h2>
        <ul className="offer-lines t-lead" data-cursor="text">
          {ANDREW.story.map((l, i) => (
            <li key={l} style={{ ["--d" as string]: `${360 + i * 110}ms` }}>
              {l}
            </li>
          ))}
        </ul>
        <div className="offer-demo" style={{ ["--d" as string]: "720ms" }}>
          <DemoButton source="offer" label={CTA.demo} arrow />
        </div>
      </div>

      <motion.figure className="offer-photo" style={{ y: photoY }}>
        <img
          src={import.meta.env.BASE_URL + ANDREW.photo}
          alt={ANDREW.photoAlt}
          width={456}
          height={420}
          loading="lazy"
          decoding="async"
        />
      </motion.figure>

      <div className="offer-deal">
        <Receipt onSigned={ping} />
        <div className={`offer-actions${under ? " is-under" : ""}`} ref={actions} data-hides-sticky>
          <TrialButton ref={cta} source="offer" cursorLabel="Clocked in · {time}" className="offer-cta" size="lg" block cue={false} />
        </div>
      </div>
    </div>
  );
}

/** "No sales team. No BDR. Just Andrew." → its three sentences. */
function splitTitle(t: string): [string, string, string] {
  const parts = t.match(/[^.]+\./g)?.map((s) => s.trim()) ?? [t];
  return [parts[0] ?? t, parts[1] ?? "", parts.slice(2).join(" ")];
}

/**
 * True once the element's top has slid up under the fixed header. The header is frosted (see-
 * through), and the FAQ's close CTA comes in as soon as this one is under it (primaryCta.ts), so
 * this one fades out there: two orange buttons never show at once, not even through the glass.
 */
function useUnderHeader(ref: RefObject<HTMLElement | null>) {
  const [under, setUnder] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const h = Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64);
    const io = new IntersectionObserver(([e]) => setUnder(e.boundingClientRect.top < h - 1), {
      rootMargin: `-${h}px 0px 0px 0px`,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return under;
}
