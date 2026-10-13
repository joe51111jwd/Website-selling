import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/wght.css";
import "../../styles/fonts.css";
import "../../styles/tokens.css";
import Cursor from "../../cursor/Cursor";
import HeroFence from "./index";
import "./dev.css";

// Entry for dev.html: the hero, the page's cursor, and a stand-in for the next scene (to scroll).
function Dev() {
  return (
    <>
      <HeroFence />
      <section className="hl0-dev-next">
        <p>6:42 AM · One Day starts here</p>
      </section>
      <Cursor />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Dev />
  </StrictMode>,
);
