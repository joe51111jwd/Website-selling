import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/martian-mono/standard.css";
import "lenis/dist/lenis.css";
import "./styles/base.css";
import "./styles/page.css";
import "./styles/inspector.css";
import App from "./App";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
