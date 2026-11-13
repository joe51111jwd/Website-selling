import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { FOCUS } from "./focus";
import { wheelTest } from "./wheeltest";

if (FOCUS) document.documentElement.classList.add("is-focus");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

window.addEventListener("load", () => wheelTest());
