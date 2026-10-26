import { useEffect, useState } from "react";
import { SITE } from "../content";
import "./Nav.css";

const LINKS = [
  ["#story", "Story"],
  ["#menu", "Notebook"],
  ["#heat", "900°"],
  ["#press", "Press"],
  ["#joyce", "The Joyce"],
] as const;

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`nav ${solid ? "solid" : ""} ${open ? "open" : ""}`}>
      <a className="nav-mark" href="#top" aria-label="James Taylor, back to top">
        <span className="nav-jt">JT</span>
        <span className="nav-name">James Taylor</span>
      </a>
      <nav aria-label="Sections">
        <ul>
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <a href={href} onClick={() => setOpen(false)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a className="nav-cta" href={SITE.reserve} target="_blank" rel="noreferrer">
        Reserve <span aria-hidden>↗</span>
      </a>
      <button className="nav-burger" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
        <i />
        <i />
      </button>
    </header>
  );
}
