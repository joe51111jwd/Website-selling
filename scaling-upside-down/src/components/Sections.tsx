import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { AssistantChips } from "./AssistantChips";
import { CopyButton } from "./CopyButton";
import { openNotice } from "./NoticeDialog";
import type { SiteCopy } from "../copy";
import { LINKS, preorderHref } from "../links";
import { sp } from "../story";

const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const still = <T,>(a: T[]) => (reduced ? a.map(() => a[a.length - 1]) : a);

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-12% 0px" },
  transition: { duration: 0.9, ease: [0.2, 0.7, 0.2, 1] as const },
};

export function Nav() {
  const [pastHero, setPastHero] = useState(false);
  const [mode, setMode] = useState<"story" | "page" | "dark">("story");
  useEffect(() => {
    const on = () => {
      const story = document.getElementById("story");
      // the copy button joins the menu once the title (with its own) has gone: the opening is the blocks alone
      const v = story ? (window.scrollY - story.offsetTop) / Math.max(1, story.offsetHeight - window.innerHeight) : 1;
      setPastHero(v > sp(0.045));
      const foot = document.querySelector(".foot");
      const storyEnd = story ? story.offsetTop + story.offsetHeight - window.innerHeight : 0;
      setMode(foot && foot.getBoundingClientRect().top < 64 ? "dark" : window.scrollY < storyEnd ? "story" : "page");
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
        <a href="#bootloader">The bootloader</a>
        <a href="#book">The book</a>
      </nav>
      <div className={`nav-cta ${pastHero ? "" : "hidden"}`}>
        <a className="nav-book" href="#book">
          Book
        </a>
        <CopyButton source="nav" size="sm" />
      </div>
    </header>
  );
}

export function Book({ copy }: { copy: SiteCopy["book"] }) {
  const art = useRef<HTMLDivElement>(null);
  const proof = useRef<HTMLDivElement>(null);
  const { scrollYProgress: arrive } = useScroll({ target: art, offset: ["start end", "start 0.3"] });
  const artScale = useTransform(arrive, [0, 1], still([1.04, 1]));
  // the two numerals sit at slightly different depths
  const { scrollYProgress: pass } = useScroll({ target: proof, offset: ["start end", "end start"] });
  const y40 = useTransform(pass, [0, 1], still([36, -36]));
  return (
    <section className="book" id="book">
      <div className="book-in">
        <m.div className="book-art" ref={art} {...reveal}>
          <m.img style={{ scale: artScale }} src={`${import.meta.env.BASE_URL}book.jpg`} alt="The hardcover of Scaling Up-Side-Down by Michael Wentz, standing next to the three wooden blocks from its cover" loading="lazy" />
        </m.div>
        <div className="book-copy">
          <m.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
            <p className="kick">
              <i className="dot down" />
              {copy.kicker}
            </p>
            <h2>{copy.headline}</h2>
            <p className="sub">{copy.subtitle}</p>
            <p className="lead">{copy.body}</p>
            <div className="book-cta">
              {LINKS.preorder ? (
                <a className="btn" href={LINKS.preorder} target="_blank" rel="noopener">
                  {copy.button}
                </a>
              ) : (
                <>
                  <a className="btn" href="#bootloader">
                    {copy.free}
                  </a>
                  <span className="soon">
                    <i className="dot down" />
                    {copy.soon}
                  </span>
                </>
              )}
            </div>
          </m.div>
          <m.div className="proof2" ref={proof} {...reveal}>
            <p className="proof-t">{copy.proofTitle}</p>
            <div className="proof2-cols">
              {copy.proof.map((p, i) => (
                <div key={p.n} className={`pc tone-${p.tone}`}>
                  <m.b className="pn ink" style={i === 0 ? { y: y40 } : undefined}>
                    {p.n}
                  </m.b>
                  <span className="pl">{p.label}</span>
                  <i className="ptitle">{p.title}</i>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
            <p className="proof-c">{copy.proofClose}</p>
          </m.div>
        </div>
      </div>
    </section>
  );
}

export function Footer({ copy }: { copy: SiteCopy["footer"] }) {
  return (
    <footer className="foot">
      <m.div className="foot-in" {...reveal}>
        <p className="kick on-dark">
          <i className="dot side" />
          {copy.kicker}
        </p>
        <h2>{copy.headline}</h2>
      </m.div>
      <m.div className="foot-left" {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}>
        <p className="lead">{copy.body}</p>
        <p className="foot-detail">{copy.detail}</p>
        <div className="foot-cta">
          <CopyButton source="footer" size="lg" className="on-dark" label="Copy the AI prompt" />
          <a className="ghost on-dark" href={preorderHref()}>
            {LINKS.preorder ? "Pre-order the book" : "The book"}
          </a>
        </div>
        <AssistantChips variant="ink" />
      </m.div>
      <m.dl className="foot-ruler" {...reveal} transition={{ ...reveal.transition, delay: 0.14 }}>
        {copy.scale.map(([v, l]) => (
          <div key={l} className={l === "The Graveyard" ? "warn" : ""}>
            <dt className="ink">{v}</dt>
            <dd>{l}</dd>
          </div>
        ))}
      </m.dl>
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
