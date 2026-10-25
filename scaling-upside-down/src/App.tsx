import { useEffect } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import Lenis from "lenis";
import { COPY } from "./copy";
import { Story } from "./components/Story";
import { Book, Footer, Nav } from "./components/Sections";
import { Couplet, Desk, Hinge } from "./components/Ending";
import { Announcer } from "./components/Announcer";
import { NoticeDialog } from "./components/NoticeDialog";
import { preloadBootloader } from "./bootloader";
import { setLenis } from "./lenis";

type Entry = { y?: number } | null;

export default function App() {
  useEffect(() => {
    preloadBootloader();
    // the page is drawn by script, so the browser can't restore the scroll position itself.
    // Each history entry remembers its own position instead (reload, Back, Forward).
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const navType = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type;
    const savedY = (history.state as Entry)?.y;
    const restore = (navType === "reload" || navType === "back_forward") && typeof savedY === "number";
    const remember = () => {
      try {
        history.replaceState({ ...((history.state as object | null) ?? {}), y: Math.round(window.scrollY) }, "");
      } catch {
        /* some embedded browsers refuse history writes */
      }
    };
    window.addEventListener("pagehide", remember);
    // pagehide alone is not kept across a reload in every browser, so also note the position once scrolling settles
    let settle = 0;
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(remember, 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // the book prints scalingupsidedown.com/appendix, and section links can be shared; a stale #hash loses to a saved position
    const target = window.location.pathname.replace(/\/+$/, "").endsWith("/appendix") ? "bootloader" : window.location.hash.slice(1);
    const jump = () => {
      const el = target && !restore ? document.getElementById(target) : null;
      const y = el ? el.getBoundingClientRect().top + window.scrollY : restore ? (savedY as number) : 0;
      if (y) window.scrollTo(0, y);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduced ? null : new Lenis({ autoRaf: true, lerp: 0.09 });
    setLenis(lenis);
    const goTo = (to: HTMLElement | number) => {
      if (lenis) {
        lenis.resize();
        lenis.scrollTo(to, { immediate: true }); // Back and Forward are instant, as in any page
      } else window.scrollTo(0, typeof to === "number" ? to : to.getBoundingClientRect().top + window.scrollY);
    };
    // in-page links: smooth scroll, keep Back working, and move keyboard focus to where the visitor landed
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab or window stays native
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      const el = a ? document.getElementById(a.hash.slice(1)) : null;
      if (!a || !el) return;
      remember();
      if (!lenis) return; // reduced motion: the native jump already does all of this
      e.preventDefault();
      history.pushState(null, "", a.hash);
      lenis.resize(); // the page grows as fonts and images arrive
      lenis.scrollTo(el);
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    };
    const onPop = (e: PopStateEvent) => {
      const y = (e.state as Entry)?.y;
      const el = y == null && location.hash ? document.getElementById(location.hash.slice(1)) : null;
      goTo(el ?? y ?? 0);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    const remeasure = () => lenis?.resize();
    void document.fonts?.ready.then(remeasure);
    window.addEventListener("load", remeasure, { once: true });
    requestAnimationFrame(() => {
      jump();
      lenis?.resize();
    });
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("load", remeasure);
      window.removeEventListener("pagehide", remember);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(settle);
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Nav />
        <main>
          <Story beats={COPY.beats} hero={COPY.hero} />
          <Couplet copy={COPY.ending.couplet} />
          <Desk copy={COPY.ending.desk} />
          <Hinge copy={COPY.ending.hinge} />
          <Book copy={COPY.book} />
        </main>
        <Footer copy={COPY.footer} />
        <NoticeDialog copy={COPY.ending.notice} />
        <Announcer />
      </MotionConfig>
    </LazyMotion>
  );
}
