// 7 · Andrew + the offer, PHONE MODE (BRIEF ROUND 3; scratchpad design/v2/phone/PHONE.md). Tight to
// its content: Andrew's face and his one line in a single band, then his receipt (the focal
// point; simplified rows, prints once on arrival, ./ReceiptPhone.tsx), then the CTA right under it.
// No scroll-linked motion (the laptop's useScroll target re-measures every frame), no layout reads.

import { useCallback, useEffect, useRef } from "react";
import { ANDREW } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { Cta } from "../ui/Cta";
import { playCue } from "../ui/cue";
import { reducedMotion } from "../../three/stage";
import { ReceiptPhone } from "./ReceiptPhone";
import "./offer-phone.css";

/** "No sales team. No BDR. Just Andrew." → its three sentences. */
function sentences(t: string) {
  return t.match(/[^.]+\./g)?.map((s) => s.trim()) ?? [t];
}

export default function OfferPhone() {
  const cta = useRef<HTMLButtonElement>(null);
  // once the slip is signed, the button below it gets its one "clocked in" cue: as soon as it is
  // fully on screen (the visitor may still be scrolling down to it)
  const cued = useRef(false);
  const io = useRef<IntersectionObserver | null>(null);
  const onSigned = useCallback(() => {
    const b = cta.current;
    if (!b || reducedMotion || cued.current || io.current || typeof IntersectionObserver === "undefined") return;
    io.current = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || cued.current) return;
        cued.current = true;
        io.current?.disconnect();
        playCue(b);
      },
      { threshold: 0.98 },
    );
    io.current.observe(b);
  }, []);
  useEffect(() => () => io.current?.disconnect(), []);
  const parts = sentences(ANDREW.title);
  const last = parts.length - 1;

  return (
    <Scene id="offer" pinnedViewports={0} stage="keep" label="Andrew and the offer" className="offer offer--phone">
      <div className="ofp">
        <div className="ofp-who">
          <img
            className="ofp-photo"
            src={import.meta.env.BASE_URL + ANDREW.photo}
            alt={ANDREW.photoAlt}
            width={456}
            height={420}
            loading="lazy"
            decoding="async"
          />
          <h2 className="t-h2 ofp-title">
            {parts.map((s, i) => (
              <span key={s} className={i < last ? "is-muted" : undefined}>
                {s}
                {i < last ? " " : ""}
              </span>
            ))}
          </h2>
        </div>

        <ReceiptPhone onSigned={onSigned} />

        <div className="ofp-cta" data-hides-sticky>
          <Cta ref={cta} source="offer" size="lg" block cue={false} />
        </div>
      </div>
    </Scene>
  );
}
