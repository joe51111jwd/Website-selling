// O1's test bench: the REAL page (the app's own entry, src/main.tsx, minus its dev-only views) with
// the opening in front of it. http://127.0.0.1:5310/src/herolab/o1/dev.html
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../styles/fonts.css";
import "../../styles/tokens.css";
import "../../styles/base.css";
import "../../styles/shell.css";
import "../../styles/type-roles.css";
import "../../lib/flags";
import App from "../../App";
import { Opening } from "./index";

document.documentElement.classList.add("sc-page");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Opening />
    <App />
  </StrictMode>,
);
