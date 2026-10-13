// Phones only: once the hero's CTA has scrolled away, a bar at the bottom keeps the trial one
// thumb away for the rest of the page (PLAYBOOK §2.0.4): one full-width orange button. It steps
// aside while a scene's own primary CTA is on screen, and where a scene asks for the whole screen
// (data-hides-sticky, e.g. Try it's full-screen app).

import { useEffect, useId, useState } from "react";
import { STICKY } from "../../content/copy";
import { Cta } from "../ui/Cta";
import { useHeroCtaGone } from "./heroCta";
import { usePrimaryInView } from "./primaryCta";
import "./shell.css";

export function StickyBar() {
  const gone = useHeroCtaGone();
  const sceneCta = usePrimaryInView();
  const [hidden, setHidden] = useState(false);
  const desc = useId();
  // a scene can hide it while an element is on screen: add data-hides-sticky to that element
  useEffect(() => {
    const seen = new Set<Element>();
    const watched = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      setHidden(seen.size > 0);
    });
    // phones mount the later scenes progressively (App: useLateScenes): look again when they land
    const scan = () =>
      document.querySelectorAll("[data-hides-sticky]").forEach((el) => {
        if (watched.has(el)) return;
        watched.add(el);
        io.observe(el);
      });
    scan();
    window.addEventListener("sc:scenes", scan);
    return () => {
      window.removeEventListener("sc:scenes", scan);
      io.disconnect();
    };
  }, []);
  const on = gone && !hidden && !sceneCta;
  return (
    <div className={`sticky-bar sbar${on ? " is-on" : ""}`} inert={!on} data-testid="sticky-bar">
      <Cta source="sticky" label={STICKY.cta} block primary={false} aria-describedby={desc} className="sbar-cta" />
      <span id={desc} className="sr-only">
        {STICKY.title}. {STICKY.sub}.
      </span>
    </div>
  );
}
