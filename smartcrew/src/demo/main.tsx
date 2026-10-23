import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/fonts.css";
import "../styles/tokens.css";
import "../book/book.css";
import "../styles/type-roles.css";
import "./demo.css";
import "../lib/flags";
import "../lib/look";
import { startTracking } from "../lib/track";
import { captureAttribution } from "../lib/lead";
import Demo from "./Demo";

// /demo: Andrew's demo video on a page of its own, to send to people (noindex, see demo/index.html).
captureAttribution();
startTracking();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
