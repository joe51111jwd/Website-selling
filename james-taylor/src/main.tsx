import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/base.css"; // first, so section styles can override the base classes
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
