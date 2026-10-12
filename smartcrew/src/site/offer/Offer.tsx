// 7 · Andrew + the offer (BRIEF §7, beat 8). The man you'll talk to, in three lines from his own
// letter, and his offer as a receipt that prints as it comes into view: everything you get, and
// what it costs you (one call). The receipt is signed; the CTA sits directly under it.

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ANDREW, CTA } from "../../content/copy";
import { reducedMotion } from "../../three/stage";
import { Scene } from "../scene/Scene";
import { Receipt } from "./Receipt";
import { useSeen } from "./useSeen";
import { DemoButton, TrialButton } from "./Actions";
import "./offer.css";

export default function Offer() {
  return (
    <Scene id="offer" pinnedViewports={1} label="Andrew and the offer" className="offer">
      <OfferBody />
    </Scene>
  );
}

function OfferBody() {
  const grid = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLButtonElement>(null);

  // Andrew rises out of the ground as the scene arrives (scroll-linked, small)
  const { scrollYProgress } = useScroll({ target: grid, offset: ["start end", "start 0.15"] });
  const photoY = useTransform(scrollYProgress, [0, 1], [reducedMotion ? 0 : 56, 0]);

  // the title and story enter once, the first time they're seen
  const seen = useSeen(grid);

  // once the slip is signed, the button below it gets one quiet "clocked in" ping
  const ping = () => {
    const b = cta.current;
    if (!b || reducedMotion) return;
    b.classList.remove("is-ping");
    void b.offsetWidth;
    b.classList.add("is-ping");
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
        <div className="offer-actions" data-hides-sticky>
          <TrialButton ref={cta} source="offer" cursorLabel="Clocked in · {time}" className="offer-cta" />
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
