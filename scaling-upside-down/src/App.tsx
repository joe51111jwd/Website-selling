import { useCallback, useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { LocalNav } from "./components/LocalNav";
import { Hero } from "./components/Hero";
import { Highlights } from "./components/Highlights";
import { CloserLook } from "./components/CloserLook";
import { Problem } from "./components/Problem";
import { Numbers } from "./components/Numbers";
import { Model } from "./components/Model";
import { Inversions } from "./components/Inversions";
import { Bootloader } from "./components/Bootloader";
import { Products } from "./components/Products";
import { Author, Faq, Footer } from "./components/Closing";

export default function App() {
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(true);
  const onReady = useCallback(() => setReady(true), []);

  // the product bar is dark over the hero photo and the black section, light everywhere else
  useEffect(() => {
    const update = () => {
      const hero = document.getElementById("top");
      if (!hero) return;
      const overHero = window.scrollY < (hero.offsetHeight - window.innerHeight) * 0.5;
      const overDark = [...document.querySelectorAll<HTMLElement>(".dark")].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= 52 && r.bottom > 52;
      });
      setDark(overHero || overDark);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <LocalNav visible={ready} dark={dark} />
      <main>
        <Hero onReady={onReady} />
        <Highlights />
        <CloserLook />
        <Problem />
        <Numbers />
        <Model />
        <Inversions />
        <Bootloader />
        <Products />
        <Author />
        <Faq />
      </main>
      <Footer />
    </MotionConfig>
  );
}
