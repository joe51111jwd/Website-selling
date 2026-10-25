import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { motion } from "motion/react";
import { CopyButton } from "./CopyButton";
import { loadBootloader, wordCount } from "../bootloader";
import type { SiteCopy } from "../copy";
import { LINKS, preorderHref } from "../links";

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
      setPastHero(window.scrollY > window.innerHeight * 0.35);
      const story = document.getElementById("story");
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
        <CopyButton size="sm" />
      </div>
    </header>
  );
}

function Sheet({ preview, words }: { preview: string; words: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 7}deg`);
    el.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 5}deg`);
  };
  const leave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };
  return (
    <div className="sheet-wrap" ref={ref} onPointerMove={move} onPointerLeave={leave}>
      <div className="sheet-under two" aria-hidden="true" />
      <div className="sheet-under one" aria-hidden="true" />
      <div className="sheet">
        <div className="sheet-bar">
          <span>SUSD-Bootloader.md</span>
          <span className="sheet-meta">{words ? `${words.toLocaleString()} words · Markdown` : "Markdown"}</span>
        </div>
        <pre className="sheet-text">{preview}</pre>
        <div className="sheet-fade" aria-hidden="true" />
      </div>
    </div>
  );
}

export function Bootloader({ copy }: { copy: SiteCopy["bootloader"] }) {
  const [preview, setPreview] = useState("");
  const [words, setWords] = useState(0);
  useEffect(() => {
    void loadBootloader().then((t) => {
      setPreview(t.split("\n").slice(0, 40).join("\n"));
      setWords(wordCount(t));
    });
  }, []);
  return (
    <section className="boot" id="bootloader">
      <div className="boot-in">
        <motion.div className="boot-copy" {...reveal}>
          <p className="kick">
            <i className="dot up" />
            {copy.kicker}
          </p>
          <h2>{copy.headline}</h2>
          <p className="lead">{copy.body}</p>
          <p className="lead soft">{copy.detail}</p>
          <ol className="steps">
            {copy.steps.map((s, n) => (
              <li key={s}>
                <span className="n">{String(n + 1).padStart(2, "0")}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="boot-cta">
            <CopyButton size="lg" label={copy.button} copied={copy.copied} />
            <a className="ghost" href={`${import.meta.env.BASE_URL}bootloader.md`} download="SUSD-Bootloader.md">
              Download the file
            </a>
          </div>
          <p className="fine">{words ? `${words.toLocaleString()} words. Copies the whole file.` : "Copies the whole file."}</p>
          <details className="notice">
            <summary>{copy.notice.title}</summary>
            <div className="notice-body" data-lenis-prevent>
              {copy.notice.paragraphs.map((p) =>
                p.startsWith("## ") ? <h4 key={p}>{p.slice(3)}</h4> : <p key={p.slice(0, 32)}>{p}</p>,
              )}
            </div>
          </details>
        </motion.div>
        <motion.div className="boot-file" {...reveal} transition={{ ...reveal.transition, delay: 0.12 }}>
          <Sheet preview={preview} words={words} />
        </motion.div>
      </div>
    </section>
  );
}

export function Book({ copy }: { copy: SiteCopy["book"] }) {
  return (
    <section className="book" id="book">
      <div className="book-in">
        <motion.div className="book-art" {...reveal}>
          <img src={`${import.meta.env.BASE_URL}book.jpg`} alt="The hardcover of Scaling Up-Side-Down by Michael Wentz, standing next to the three wooden blocks from its cover" loading="lazy" />
        </motion.div>
        <motion.div className="book-copy" {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
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
                  Start with the free prompt
                </a>
                <span className="soon" role="status">
                  <i className="dot down" />
                  {copy.soon}
                </span>
              </>
            )}
          </div>
          <div className="proof">
            <p className="proof-t">{copy.proofTitle}</p>
            <ol>
              {copy.proof.map((p) => (
                <li key={p.label}>
                  <span className="n">{p.label}</span>
                  <span>{p.text}</span>
                </li>
              ))}
            </ol>
            <p className="proof-c">{copy.proofClose}</p>
          </div>
          <ol className="parts">
            {copy.parts.map((p, n) => (
              <li key={p.title}>
                <i className={["down", "side", "up"][n] ?? "up"} />
                <span>
                  <b>{p.title}</b>
                  <small>{p.text}</small>
                </span>
              </li>
            ))}
          </ol>
          <div className="author">
            <img src={`${import.meta.env.BASE_URL}michael.jpg`} alt="" />
            <p>{copy.author}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer({ copy }: { copy: SiteCopy["footer"] }) {
  return (
    <footer className="foot">
      <motion.div className="foot-in" {...reveal}>
        <p className="kick on-dark">
          <i className="dot side" />
          {copy.kicker}
        </p>
        <h2>{copy.headline}</h2>
        <p className="lead">{copy.body}</p>
        <p className="lead soft">{copy.detail}</p>
        <div className="foot-cta">
          <CopyButton size="lg" className="on-dark" />
          <a className="ghost on-dark" href={preorderHref()}>
            {LINKS.preorder ? "Pre-order the book" : "The book"}
          </a>
        </div>
      </motion.div>
      <motion.dl className="foot-map" {...reveal} transition={{ ...reveal.transition, delay: 0.12 }}>
        {[
          ["1–3", "Small Team"],
          ["8–12", "Team"],
          ["12–40", "The Graveyard"],
          ["40–70", "Team of Teams"],
        ].map(([v, l]) => (
          <div key={l} className={l === "The Graveyard" ? "warn" : ""}>
            <dt>{v}</dt>
            <dd>{l}</dd>
          </div>
        ))}
      </motion.dl>
      <div className="foot-bar">
        <span className="brand">
          <span className="mark" aria-hidden="true">
            <i className="up" />
            <i className="side" />
            <i className="down" />
          </span>
          Scaling Up-Side-Down
        </span>
        <span>© 2026 Michael Wentz</span>
      </div>
    </footer>
  );
}
