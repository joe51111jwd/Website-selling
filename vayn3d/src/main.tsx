import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/hubot-sans/standard.css";
import "@fontsource-variable/mona-sans/standard.css";
import "@fontsource-variable/martian-mono/standard.css";
import "lenis/dist/lenis.css";
import "./styles/base.css";
import "./styles/page.css";
import "./styles/inspector.css";
import App from "./App";
import { installWatermark } from "./lib/watermark";

// set in .env.watermark, so only `npm run build:watermark` carries it
if (import.meta.env.VITE_WATERMARK) installWatermark(import.meta.env.VITE_WATERMARK);

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
