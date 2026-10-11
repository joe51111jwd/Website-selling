import { useEffect, useState } from "react";
import { scrollToId } from "../lib/scroll";
import { store, useStore } from "../lib/store";

export function Wordmark() {
  return (
    <span className="wordmark" aria-label="Strand">
      <svg viewBox="0 0 22 22" aria-hidden="true">
        <path d="M3 18.5h16M3 14.5h16M3 10.5h16M3 6.5h16" />
      </svg>
      Strand
    </span>
  );
}

export default function Header() {
  const count = useStore((s) => s.queue.length);
  const [dark, setDark] = useState(false);
  // over the ink footer the header turns light-on-dark
  useEffect(() => {
    const onScroll = () => {
      const f = document.querySelector(".footer");
      setDark(!!f && f.getBoundingClientRect().top < 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`header${dark ? " is-dark" : ""}`}>
      <a href="#top" className="header__home" onClick={(e) => (e.preventDefault(), scrollToId("top"))}>
        <Wordmark />
      </a>
      <nav className="header__nav mono" aria-label="Sections">
        <a href="#collection" onClick={(e) => (e.preventDefault(), scrollToId("collection"))}>Collection</a>
        <a href="#live" onClick={(e) => (e.preventDefault(), scrollToId("live"))}>Live printer</a>
        <a href="#custom" onClick={(e) => (e.preventDefault(), scrollToId("custom"))}>Custom</a>
      </nav>
      <button className="header__queue mono" onClick={() => store.set({ queueOpen: true })} aria-label={`Your print queue, ${count} items`}>
        Queue <span className="header__count">{count}</span>
      </button>
    </header>
  );
}
