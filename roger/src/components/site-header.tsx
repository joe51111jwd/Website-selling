"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ctaLong, ctaShort } from "@/data/v3-copy";
import { Mark } from "./v3/mark";
import { StartLink } from "./v3/start-link";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/library", label: "Use cases" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

// No header button on /start/*, /signin and /app/* (spec A.3). Unlisted pages keep their
// own exclusion through navFor(path) in the live header; merge this file into that one.
const noButton = (p: string) => p.startsWith("/start") || p.startsWith("/signin") || p.startsWith("/app");

export function SiteHeader() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [tone, setTone] = useState<"ground" | "night">("ground");
  const [open, setOpen] = useState(false);

  // The header takes the tone of the chapter underneath it.
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = (ref.current?.offsetHeight ?? 60) / 2;
      let t: "ground" | "night" = "ground";
      for (const el of document.querySelectorAll<HTMLElement>("[data-tone]")) {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) t = el.dataset.tone === "night" ? "night" : "ground";
      }
      setTone(t);
    };
    const on = () => (raf ||= requestAnimationFrame(read));
    read();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header ref={ref} className="site-header" data-tone={open ? "ground" : tone}>
      <div className="wrap bar">
        <Link href="/" className="brand" aria-label="Roger, home">
          <Mark />
          Roger
        </Link>
        <nav className="nav" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="header-right">
          {/* A signed-in visitor sees "Open Roger" to /app in place of both. The app exposes the helper. */}
          <a href="/signin" className="signin">
            Sign in
          </a>
          {!noButton(pathname) && (
            <StartLink className="btn btn-sm">
              <span className="cta-short">{ctaShort}</span>
              <span className="cta-long">{ctaLong}</span>
            </StartLink>
          )}
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 6.5h14M3 13.5h14" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Main, mobile">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <a href="/signin">Sign in</a>
        </nav>
      )}
    </header>
  );
}
