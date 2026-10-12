// The header: logo, two quiet links and the primary CTA. Transparent over the hero, solid once
// the page scrolls. The CTA steps forward (dark) once the hero's own button has scrolled away,
// so two primary buttons are never on screen together. Phones show the logo only; the sticky
// bar at the bottom carries the CTA there.

import { useEffect, useState } from "react";
import logo from "../assets/logo.svg";
import { HEADER } from "../../content/copy";
import { handleAnchorClick, scrollToY } from "../scroll";
import { Cta } from "../ui/Cta";
import { useHeroCtaGone } from "./heroCta";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const ctaOn = useHeroCtaGone();
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
          <img src={logo} alt="SmartCrew" width={143} height={20} />
        </a>
        <nav className="site-nav" aria-label="Page">
          {HEADER.nav.map((l) => (
            <a key={l.href} href={l.href} onClick={handleAnchorClick}>
              {l.label}
            </a>
          ))}
        </nav>
        <Cta source="header" small label={HEADER.cta} className="site-header-cta" />
      </div>
    </header>
  );
}
