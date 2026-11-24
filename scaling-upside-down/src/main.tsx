import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./book-page.css";
import { FOCUS } from "./focus";
import { BLOCKS } from "./edition";

if (FOCUS) document.documentElement.classList.add("is-focus");
else if (!BLOCKS) document.documentElement.classList.add("is-book");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
