// The header: logo, two quiet links and the primary CTA. Transparent over the hero, solid once
// the page scrolls. The CTA steps in once the hero's own button has scrolled away, and steps aside
// again whenever a scene's own primary CTA is on screen, so two orange buttons are never on screen
// together. Phones show the logo only; the sticky bar at the bottom carries the CTA there.

import { useEffect, useState } from "react";
import { Logo } from "../../brand/Logo";
import { HEADER } from "../../content/copy";
import { handleAnchorClick, scrollToY } from "../scroll";
import { Cta } from "../ui/Cta";
import { useHeroCtaGone } from "./heroCta";
import { usePrimaryInView } from "./primaryCta";
import "./shell.css";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const heroGone = useHeroCtaGone();
  const sceneCta = usePrimaryInView();
  const ctaOn = heroGone && !sceneCta;
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-solid" : ""}${ctaOn ? " is-cta" : ""}`}>
      <div className="site-header-in">
        <a
          href="#top"
          className="site-logo"
          aria-label={HEADER.logoLabel}
          onClick={(e) => {
            e.preventDefault();
            scrollToY(0);
          }}
        >
          <Logo className="site-logo-svg" />
        </a>
        <nav className="site-nav" aria-label="Page">
          {HEADER.nav.map((l) => (
            <a key={l.href} href={l.href} onClick={handleAnchorClick}>
              {l.label}
            </a>
          ))}
        </nav>
        <span className="hdr-cta" inert={!ctaOn}>
          <Cta source="header" size="sm" label={HEADER.cta} primary={false} />
        </span>
      </div>
    </header>
  );
}
