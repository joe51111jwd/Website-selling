import { lazy, Suspense, useEffect } from "react";
import { products } from "./content/catalog";
import { watchLayout } from "./lib/layout";
import { lenis } from "./lib/scroll";
import { line } from "./lib/line";
import { store, syncFromHash, useStore } from "./lib/store";
import Preloader from "./components/Preloader";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Statement from "./components/Statement";
import Piece from "./components/Piece";
import Live from "./components/Live";
import Custom from "./components/Custom";
import Footer from "./components/Footer";
import Hud from "./components/Hud";
import Queue from "./components/Queue";

const World = lazy(() => import("./three/World"));
const Inspector = lazy(() => import("./components/Inspector"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
line.webgl = hasWebGL();
document.documentElement.classList.toggle("no-webgl", !line.webgl);

export default function App() {
  const inspect = useStore((s) => s.inspect);
  const queueOpen = useStore((s) => s.queueOpen);

  useEffect(() => {
    const stop = watchLayout();
    syncFromHash();
    window.addEventListener("popstate", syncFromHash);
    return () => {
      stop();
      window.removeEventListener("popstate", syncFromHash);
    };
  }, []);

  // freeze the page under overlays
  useEffect(() => {
    const locked = !!inspect || queueOpen;
    if (locked) lenis.stop();
    else lenis.start();
    document.documentElement.classList.toggle("locked", locked);
  }, [inspect, queueOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && store.get().queueOpen) store.set({ queueOpen: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Preloader />
      {line.webgl && (
        <Suspense fallback={null}>
          <World />
        </Suspense>
      )}
      <Header />
      <main>
        <Hero />
        <Statement />
        <section className="collection" id="collection" aria-label="The collection">
          {products.map((p, i) => (
            <Piece key={p.slug} product={p} index={i} />
          ))}
        </section>
        <Live />
        <Custom />
      </main>
      <Footer />
      <Hud />
      <Queue />
      {inspect && (
        <Suspense fallback={null}>
          <Inspector slug={inspect} />
        </Suspense>
      )}
    </>
  );
}
