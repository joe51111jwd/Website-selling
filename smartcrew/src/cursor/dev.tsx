import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CursorDemo from "./Demo";

// Entry for dev.html, so the demo runs without touching main.tsx.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CursorDemo />
  </StrictMode>,
);
