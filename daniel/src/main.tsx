import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/instrument-sans/wdth.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/geist-mono";
import "lenis/dist/lenis.css";
import "./styles/base.css";
import "./styles/chrome.css";
import "./styles/home.css";
import "./styles/pages.css";
import "./styles/structure.css";
import { stage } from "./lib/gl/stage";
import App from "./App";

// the WebGL stage starts before React so components know whether it's there
stage.mount(document.getElementById("gl") as HTMLCanvasElement, document.getElementById("gl-front") as HTMLCanvasElement);
document.documentElement.dataset.mode = "surface";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
