import { useEffect, useState } from "react";
import { scrollToId } from "../lib/scroll";
import { store, useStore } from "../lib/store";
import Logo from "./Logo";


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
        <Logo className="header__logo" />
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
