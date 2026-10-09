import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "../content/site";
import { attachCursor, cursorState } from "../lib/cursor";
import { useClock } from "../lib/hooks";
import { toggleStructure, useStructure } from "../lib/mode";
import { useLocation } from "../lib/router";
import { useStore } from "../lib/store";
import { ease, easeCurtain, isTouch, lenis, onTick } from "../lib/ticker";
import { attachCurtain, curtainLabel, go } from "../lib/transition";
import { Link } from "./Link";
import { Roll } from "./Text";

export function Clock() {
  return <span className="clock">{useClock(site.timeZone)}</span>;
}

export function ModeSwitch({ className }: { className?: string }) {
  const on = useStructure();
  return (
    <button
      type="button"
      className={`mode-switch${className ? ` ${className}` : ""}`}
      aria-pressed={on}
      aria-label="Structure mode: show how the site is built"
      title="Structure mode (S)"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggleStructure({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
    >
      <span className="mode-switch-track">
        <span className="mode-switch-knob" />
      </span>
      <span className="mode-switch-text">{on ? "Structure" : "Surface"}</span>
    </button>
  );
}

const LINKS = [
  { label: "Work", to: "/work" },
  { label: "About", to: "/#about" },
  { label: "Contact", to: "/#contact" },
];

export function Nav() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const { path } = useLocation();

  // tuck away while scrolling down, come back on the way up
  useEffect(
    () =>
      onTick(() => {
        const el = ref.current;
        if (!el) return;
        const hide = lenis.scroll > 160 && lenis.direction === 1 && !open;
        const show = lenis.direction === -1 || lenis.scroll <= 160;
        if (hide && el.dataset.hidden !== "true") el.dataset.hidden = "true";
        else if (show && el.dataset.hidden === "true") el.dataset.hidden = "false";
      }),
    [open],
  );

  useEffect(() => {
    if (open) lenis.stop();
    else lenis.start();
  }, [open]);

  useEffect(() => setOpen(false), [path]);

  return (
    <>
      <header className="nav" ref={ref}>
        <Link to="/" className="nav-logo" aria-label={`${site.name}, home`}>
          <Roll>{site.name}</Roll>
          <sup>®</sup>
        </Link>
        <p className="nav-meta">
          <span>{site.role}</span>
          <span>
            {site.location.split(",")[0]} <Clock />
          </span>
        </p>
        <nav className="nav-links" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} aria-current={l.to === path ? "page" : undefined}>
              <Roll>{l.label}</Roll>
            </Link>
          ))}
        </nav>
        <ModeSwitch className="nav-switch" />
        <button type="button" className="nav-menu" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
          <Roll>{open ? "Close" : "Menu"}</Roll>
        </button>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            id="menu"
            className="menu"
            initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
            transition={{ duration: 0.8, ease: easeCurtain }}
          >
            <nav aria-label="Menu">
              {[{ label: "Index", to: "/" }, ...LINKS].map((l, i) => (
                <span className="mask" key={l.label}>
                  <motion.a
                    href={l.to}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      go(l.to);
                    }}
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.9, ease, delay: 0.25 + i * 0.06 }}
                  >
                    <sup>0{i + 1}</sup>
                    {l.label}
                  </motion.a>
                </span>
              ))}
            </nav>
            <div className="menu-foot">
              <ModeSwitch />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const CURSOR_TEXT: Record<string, string> = { view: "View", drag: "Drag", copy: "Copy" };

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const { kind, label } = useStore(cursorState);
  const structure = useStructure();
  useEffect(() => {
    if (!ref.current) return;
    attachCursor(ref.current);
    document.documentElement.classList.add("has-cursor");
  }, []);
  if (isTouch) return null;
  const text = kind === "lens" ? (structure ? "Surface" : "Structure") : label || CURSOR_TEXT[kind] || "";
  return (
    <div ref={ref} className="cursor" data-kind={kind} aria-hidden>
      <span className="cursor-label" key={text}>
        {text}
      </span>
    </div>
  );
}

export function Curtain() {
  const label = useStore(curtainLabel);
  return (
    <div className="curtain" ref={attachCurtain} aria-hidden>
      <span className="curtain-label">{label}</span>
      <span className="curtain-meta">
        {site.name}® — {site.role}
      </span>
    </div>
  );
}

/** The 12-column grid, visible in Structure mode. */
export function GridOverlay() {
  return (
    <div className="grid-overlay" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i}>
          <i>{String(i + 1).padStart(2, "0")}</i>
        </span>
      ))}
    </div>
  );
}
