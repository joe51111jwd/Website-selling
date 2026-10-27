import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { APPENDIX_URL } from "../optin";
import { GetLink } from "./GetLink";
import { openNotice } from "./NoticeDialog";
import type { SiteCopy } from "../copy";
import { geo } from "../closedloop";
import { lenis } from "../lenis";
import { sp } from "../story";

const BASE = import.meta.env.BASE_URL;
const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const asset = (name: string) => `${BASE}closed/${name}`;

export function Nav() {
  const [pastHero, setPastHero] = useState(false);
  const [mode, setMode] = useState<"story" | "page">("story");
  useEffect(() => {
    const on = () => {
      const story = document.getElementById("story");
      // the copy button joins the menu once the title (with its own) has gone: the opening is the blocks alone
      const v = story ? (window.scrollY - story.offsetTop) / Math.max(1, story.offsetHeight - window.innerHeight) : 1;
      setPastHero(v > sp(0.045));
      // the story and the closed loop are one picture: the menu stays out of the way until both are done
      const closed = document.getElementById("closed");
      const end = closed ? closed.offsetTop + closed.offsetHeight - window.innerHeight : 0;
      setMode(window.scrollY < end ? "story" : "page");
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`nav is-${mode}`}>
      <a className="brand" href="#story" aria-label="Scaling Up-Side-Down, back to top">
        <span className="mark" aria-hidden="true">
          <i className="up" />
          <i className="side" />
          <i className="down" />
        </span>
        <span>Scaling Up-Side-Down</span>
      </a>
      <nav className="links" aria-label="Sections">
        <a href="#story">The story</a>
        <a href={APPENDIX_URL}>The Appendix</a>
        <a href="#book">The book</a>
      </nav>
      <div className={`nav-cta ${pastHero ? "" : "hidden"}`}>
        <a className="nav-book" href="#book">
          Book
        </a>
        <GetLink size="sm" />
      </div>
    </header>
  );
}

/** the proof, from the film's own pictures: the crooked needle (40 people) becomes the building (12) */
export function Proof({ copy }: { copy: SiteCopy["proof"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: v } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const building = useTransform(v, [0.35, 0.55], [0, 1]);
  const roll = useTransform(v, [0.42, 0.48], reduced ? ["0%", "0%"] : ["0%", "-50%"]);
  const fadeA = useTransform(v, [0.43, 0.47], [1, 0]);
  const fadeB = useTransform(v, [0.43, 0.47], [0, 1]);
  const [a, b] = copy.items;
  const pic = (key: "needle" | "building") => (
    <picture>
      <source media="(max-width: 900px)" srcSet={asset(geo.files[`proof_${key}_m`])} />
      <img src={asset(geo.files[`proof_${key}_d`])} alt="" loading="lazy" decoding="async" />
    </picture>
  );
  return (
    <section className="proof3" ref={ref} aria-labelledby="proof-close">
      <div className="proof3-art" aria-hidden="true">
        {pic("needle")}
        <m.div className="proof3-top" style={{ opacity: building }}>
          {pic("building")}
        </m.div>
      </div>
      <div className="proof3-copy">
        <p className="kick">
          <i className="dot side" />
          {copy.title}
        </p>
        <div className="proof3-num" aria-hidden="true">
          <m.div className="proof3-roll" style={reduced ? undefined : { y: roll }}>
            <m.span className={`tone-${a.tone}`} style={reduced ? { opacity: fadeA } : undefined}>
              {a.n}
            </m.span>
            <m.span className={`tone-${b.tone}`} style={reduced ? { opacity: fadeB } : undefined}>
              {b.n}
            </m.span>
          </m.div>
        </div>
        <div className="proof3-labels" aria-hidden="true">
          <m.p style={{ opacity: fadeA }}>
            <span>{a.label}</span>
            <i>{a.title}</i>
          </m.p>
          <m.p style={{ opacity: fadeB }}>
            <span>{b.label}</span>
            <i>{b.title}</i>
          </m.p>
        </div>
        <ul className="sr-only">
          {copy.items.map((it) => (
            <li key={it.n}>
              {it.n} {it.label}, {it.title}
            </li>
          ))}
        </ul>
        <p className="proof3-close" id="proof-close">
          {copy.close}
        </p>
      </div>
    </section>
  );
}

export function Footer({ copy }: { copy: SiteCopy["footer"] }) {
  const top = () => {
    if (lenis && !reduced) lenis.scrollTo(0, { duration: 1.8, onComplete: () => document.querySelector<HTMLElement>(".nav .brand")?.focus({ preventScroll: true }) });
    else {
      window.scrollTo(0, 0);
      document.querySelector<HTMLElement>(".nav .brand")?.focus({ preventScroll: true });
    }
  };
  return (
    <footer className="foot">
      <a className="foot-seal" href="#bootloader" aria-label="Back to the closed loop and the Bootloader">
        <img src={asset(geo.files.seal)} alt="" width="220" height="220" loading="lazy" decoding="async" />
      </a>
      <p className="foot-line">{copy.line}</p>
      <button type="button" className="foot-repeat" onClick={top}>
        Repeat <span aria-hidden="true">↑</span>
      </button>
      <div className="foot-bar">
        <span className="brand">
          <span className="mark" aria-hidden="true">
            <i className="up" />
            <i className="side" />
            <i className="down" />
          </span>
          Scaling Up-Side-Down
        </span>
        <button type="button" className="foot-notice" onClick={(e) => openNotice(e.currentTarget)}>
          Use notice
        </button>
        <span>© 2026 Michael Wentz</span>
      </div>
    </footer>
  );
}
