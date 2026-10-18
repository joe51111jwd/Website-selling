import { StrictMode, lazy, Suspense, type ReactNode } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";
import { installWatermark } from "./lib/watermark";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/type-roles.css";
import "./styles/glass.css";
import "./styles/focus.css";
import "./styles/bold.css";
import "./lib/flags";
import { FOCUS } from "./lib/look";
import { startFocus } from "./site/focus";
import App from "./App";

// set in .env.watermark, so only `npm run build:watermark` carries it
if (import.meta.env.VITE_WATERMARK) installWatermark(import.meta.env.VITE_WATERMARK);

let view: ReactNode = <App />;

// Dev-only views: ?screen=<id> renders one product screen at its native size (the device
// textures are shot from it), ?screens shows them all, ?sandbox=devices the 3D devices,
// ?cursor-demo the geofence cursor's test bench.
if (import.meta.env.DEV) {
  const q = new URLSearchParams(location.search);
  const Screen = lazy(() => import("./screens/ScreenView"));
  const Gallery = lazy(() => import("./screens/Gallery"));
  const Devices = lazy(() => import("./sandbox/Devices"));
  const CursorDemo = lazy(() => import("./cursor/Demo"));
  if (q.get("screen")) view = <Screen id={q.get("screen")!} />;
  else if (q.has("screens")) view = <Gallery />;
  else if (q.get("sandbox") === "devices") view = <Devices />;
  else if (q.has("cursor-demo")) view = <CursorDemo />;
}

// the product page's global styles (src/styles/base.css) apply only to the page itself
if ((view as React.ReactElement).type === App) {
  document.documentElement.classList.add("sc-page");
  if (FOCUS) startFocus();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={null}>{view}</Suspense>
  </StrictMode>,
);
