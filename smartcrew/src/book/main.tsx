import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/fonts.css";
import "../styles/tokens.css";
import "./book.css";
import "../styles/type-roles.css";
import "../styles/glass.css";
import "../styles/focus.css";
import "./glass.css";
import "../styles/bold.css";
import "./bold.css";
import "../lib/flags";
import "../lib/look";
import { startTracking } from "../lib/track";
import { captureAttribution } from "../lib/lead";
import Book from "./Book";

// /book: the page the trial popup lands on (noindex, see book/index.html).
captureAttribution();
startTracking();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Book />
  </StrictMode>,
);
