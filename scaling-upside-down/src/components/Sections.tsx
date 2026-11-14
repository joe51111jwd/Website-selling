import { useEffect, useState } from "react";
import { APPENDIX_URL } from "../optin";
import { JoinLink } from "./JoinLink";
import { openNotice } from "./NoticeDialog";
import type { SiteCopy } from "../copy";
import { geo } from "../closedloop";
import { lenis } from "../lenis";
import { HERO_GONE, sp } from "../story";

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
      setPastHero(v > sp(HERO_GONE)); // (as the hero's own button goes)
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
        <a href="#book">The book</a>
        <a href={APPENDIX_URL}>The appendix</a>
      </nav>
      <div className={`nav-cta ${pastHero ? "" : "hidden"}`}>
        <a className="nav-book" href="#book">
          Book
        </a>
        <JoinLink size="sm" label="Join the list" />
      </div>
    </header>
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
      <a className="foot-seal" href="#join" aria-label="Back to the first-edition list">
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
