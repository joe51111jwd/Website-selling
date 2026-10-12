// Phones only: once the hero's CTA has scrolled away, a bar at the bottom keeps the trial one
// thumb away for the rest of the page (PLAYBOOK §2.0.4).

import { useEffect, useState } from "react";
import { STICKY } from "../../content/copy";
import { onSignup } from "../../signup/contract";
import { Cta } from "../ui/Cta";
import { useHeroCtaGone } from "./heroCta";

export function StickyBar() {
  const gone = useHeroCtaGone();
  const [hidden, setHidden] = useState(false);
  // a scene's own big CTA can hide it while on screen: add data-hides-sticky to that element
  useEffect(() => {
    const els = document.querySelectorAll("[data-hides-sticky]");
    if (!els.length) return;
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      setHidden(seen.size > 0);
    });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  // step aside while the popup is open (it covers the page anyway)
  useEffect(() => onSignup(() => setHidden(false)), []);
  const on = gone && !hidden;
  return (
    <div className={`sticky-bar${on ? " is-on" : ""}`} inert={!on}>
      <div className="sticky-bar-text">
        <strong>{STICKY.title}</strong>
        <span>{STICKY.sub}</span>
      </div>
      <Cta source="sticky" label={STICKY.cta} className="sticky-bar-cta" />
    </div>
  );
}
