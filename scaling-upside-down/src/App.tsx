import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import Lenis from "lenis";
import { COPY } from "./copy";
import { Story } from "./components/Story";
import { Bootloader, Book, Footer, Nav } from "./components/Sections";
import { loadBootloader } from "./bootloader";

export default function App() {
  useEffect(() => {
    void loadBootloader();
    // the book prints scalingupsidedown.com/appendix, and section links can be shared
    const target = window.location.pathname.replace(/\/+$/, "").endsWith("/appendix") ? "bootloader" : window.location.hash.slice(1);
    const jump = () => {
      const el = target ? document.getElementById(target) : null;
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(jump);
      return;
    }
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: true });
    requestAnimationFrame(() => {
      jump();
      lenis.resize();
    });
    return () => lenis.destroy();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main>
        <Story beats={COPY.beats} hero={COPY.hero} />
        <Bootloader copy={COPY.bootloader} />
        <Book copy={COPY.book} />
      </main>
      <Footer copy={COPY.footer} />
    </MotionConfig>
  );
}
