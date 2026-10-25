import { useEffect } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import Lenis from "lenis";
import { COPY } from "./copy";
import { Story } from "./components/Story";
import { Bootloader, Book, Footer, Nav } from "./components/Sections";
import { loadBootloader } from "./bootloader";

export default function App() {
  useEffect(() => {
    void loadBootloader();
    // the page is drawn by script, so the browser can't restore the scroll position on reload; do it here
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    let saved = 0;
    try {
      saved = Number(sessionStorage.getItem("susd-y")) || 0;
    } catch {
      saved = 0;
    }
    const save = () => {
      try {
        sessionStorage.setItem("susd-y", String(Math.round(window.scrollY)));
      } catch {
        /* private mode */
      }
    };
    window.addEventListener("pagehide", save);
    // the book prints scalingupsidedown.com/appendix, and section links can be shared
    const target = window.location.pathname.replace(/\/+$/, "").endsWith("/appendix") ? "bootloader" : window.location.hash.slice(1);
    const reload = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload";
    const jump = () => {
      const el = target && !(reload && saved) ? document.getElementById(target) : null;
      const y = el ? el.getBoundingClientRect().top + window.scrollY : reload ? saved : 0;
      if (y) window.scrollTo(0, y);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(jump);
      return () => window.removeEventListener("pagehide", save);
    }
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09 });
    // in-page links: re-measure first, the page grows as fonts and images arrive
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      const el = a ? document.getElementById(a.hash.slice(1)) : null;
      if (!a || !el) return;
      e.preventDefault();
      lenis.resize();
      lenis.scrollTo(el);
      history.pushState(null, "", a.hash);
    };
    document.addEventListener("click", onClick);
    const remeasure = () => lenis.resize();
    void document.fonts?.ready.then(remeasure);
    window.addEventListener("load", remeasure, { once: true });
    requestAnimationFrame(() => {
      jump();
      lenis.resize();
    });
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("load", remeasure);
      window.removeEventListener("pagehide", save);
      lenis.destroy();
    };
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Nav />
        <main>
          <Story beats={COPY.beats} hero={COPY.hero} />
          <Bootloader copy={COPY.bootloader} />
          <Book copy={COPY.book} />
        </main>
        <Footer copy={COPY.footer} />
      </MotionConfig>
    </LazyMotion>
  );
}
