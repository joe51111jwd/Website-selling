// t0 lab entry (dev.html): the page's own boot (src/main.tsx's styles and flags) rendering the
// real page with the "Grade the Pad" hero (./DevApp.tsx).
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "../../styles/fonts.css";
import "../../styles/tokens.css";
import "../../styles/base.css";
import "../../styles/shell.css";
import "../../styles/type-roles.css";
import "../../lib/flags";
import DevApp from "./DevApp";

document.documentElement.classList.add("sc-page");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <DevApp />
    </Suspense>
  </StrictMode>,
);
