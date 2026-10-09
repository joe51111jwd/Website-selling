import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { Cursor, Curtain, GridOverlay, Nav } from "./components/Chrome";
import { Footer } from "./components/Footer";
import { Preloader } from "./components/Preloader";
import { useLocation, type Route } from "./lib/router";
import { onTick } from "./lib/ticker";
import { titleFor } from "./lib/transition";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { Project } from "./pages/Project";
import { Work } from "./pages/Work";

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case "home":
      return <Home />;
    case "work":
      return <Work />;
    case "project":
      return <Project slug={route.slug} />;
    default:
      return <NotFound />;
  }
}

/** Sections carry data-theme; the page takes the colours of whichever is mid-screen. */
function useSectionTheme() {
  useEffect(() => {
    let frame = 0;
    return onTick(() => {
      if (frame++ % 5) return;
      const y = window.innerHeight * 0.55;
      let theme = "paper";
      for (const el of document.querySelectorAll<HTMLElement>("main [data-theme]")) {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) theme = el.dataset.theme ?? theme;
      }
      if (document.documentElement.dataset.theme !== theme) document.documentElement.dataset.theme = theme;
    });
  }, []);
}

export default function App() {
  const { path, route } = useLocation();
  useSectionTheme();
  useEffect(() => {
    document.title = titleFor(route);
  }, [route]);

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main" key={path}>
        <Page route={route} />
        <Footer />
      </main>
      <GridOverlay />
      <Curtain />
      <Cursor />
      <Preloader />
    </MotionConfig>
  );
}
