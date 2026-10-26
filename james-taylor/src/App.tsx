import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import Lenis from "lenis";
import { Preloader } from "./ui/Preloader";
import { Nav } from "./ui/Nav";
import { Grain } from "./ui/Grain";
import { Hero } from "./sections/Hero";
import { Creed } from "./sections/Creed";
import { Story } from "./sections/Story";
import { Notebook } from "./sections/Notebook";
import { Broiler } from "./sections/Broiler";
import { Press } from "./sections/Press";
import { Joyce } from "./sections/Joyce";
import { Book } from "./sections/Book";
import { Footer } from "./sections/Footer";
import { reducedMotion } from "./lib/motion";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const lenis = reducedMotion() ? null : new Lenis({ autoRaf: true, lerp: 0.085 });
    // in-page links glide instead of jumping, and keep Back working
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      const el = a ? document.getElementById(a.hash.slice(1)) : null;
      if (!a || !el || !lenis) return;
      e.preventDefault();
      history.pushState(null, "", a.hash);
      lenis.resize();
      lenis.scrollTo(el, { duration: 1.6 });
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    const remeasure = () => lenis?.resize();
    void document.fonts?.ready.then(remeasure);
    window.addEventListener("load", remeasure, { once: true });
    return () => {
      document.removeEventListener("click", onClick);
      lenis?.destroy();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Preloader onDone={() => setReady(true)} />
      <Grain />
      <Nav />
      <main>
        <Hero ready={ready} />
        <Creed />
        <Story />
        <Notebook />
        <Broiler />
        <Press />
        <Joyce />
        <Book />
      </main>
      <Footer />
    </MotionConfig>
  );
}
