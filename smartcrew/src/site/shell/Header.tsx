// The header: logo, two quiet links and the primary CTA. Transparent over the hero, solid once
// the page scrolls. The CTA steps in once the hero's own button has scrolled away, and steps aside
// again whenever a scene's own primary CTA is on screen, so two orange buttons are never on screen
// together. Phones show the logo only; the sticky bar at the bottom carries the CTA there.
// The focus look makes the header a real liquid-glass lens on desktop Chromium (./LiquidGlass.tsx).

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Logo } from "../../brand/Logo";
import { HEADER } from "../../content/copy";
import { FOCUS } from "../../lib/look";
import { handleAnchorClick, scrollToY } from "../scroll";
import { Cta } from "../ui/Cta";
import { useHeroCtaGone } from "./heroCta";
import { LiquidGlassFilter, useLiquidGlass } from "./LiquidGlass";
import { usePrimaryInView } from "./primaryCta";
import "./shell.css";

/** The header's lens: a 14 px squircle rim, as thick as a pill this size reads (the research's settings). */
const LENS = { bezel: 14, thickness: 28, specular: { width: 2.5, strength: 0.85 } };

export function Header() {
  const ref = useRef<HTMLElement>(null);
  const glass = useLiquidGlass(ref, LENS, FOCUS);
  const [scrolled, setScrolled] = useState(false);
  const heroGone = useHeroCtaGone();
  const sceneCta = usePrimaryInView();
  const ctaOn = heroGone && !sceneCta;
  useEffect(() => {
    // only on a change (a setState per scroll event re-renders the header on every frame)
    let last: boolean | null = null;
    const on = () => {
      const v = window.scrollY > 12;
      if (v === last) return;
      last = v;
      setScrolled(v);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      ref={ref}
      className={`site-header${scrolled ? " is-solid" : ""}${ctaOn ? " is-cta" : ""}`}
      data-lg={glass.id ? "" : undefined}
      style={glass.id ? ({ "--lg-url": `url(#${glass.id})` } as CSSProperties) : undefined}
    >
      <LiquidGlassFilter id={glass.id} map={glass.map} />
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
