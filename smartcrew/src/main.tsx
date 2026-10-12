import { StrictMode, lazy, Suspense, type ReactNode } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";
import { installWatermark } from "./lib/watermark";
import App from "./App";

// set in .env.watermark, so only `npm run build:watermark` carries it
if (import.meta.env.VITE_WATERMARK) installWatermark(import.meta.env.VITE_WATERMARK);

let view: ReactNode = <App />;

// Design directions (`npm run build:directions`, and always in dev): the home page lists the
// prototypes in src/proto/<name>/, each opened with ?proto=<name>.
const directions = import.meta.env.DEV || import.meta.env.VITE_DIRECTIONS === "1";
if (directions) {
  const q = new URLSearchParams(location.search);
  const protos = import.meta.glob<{ default: React.ComponentType }>("./proto/*/index.tsx");
  const proto = q.get("proto");
  if (proto && protos[`./proto/${proto}/index.tsx`]) {
    const Proto = lazy(protos[`./proto/${proto}/index.tsx`]);
    view = <Proto />;
  } else if (!import.meta.env.DEV) {
    const Directions = lazy(() => import("./Directions"));
    view = <Directions names={Object.keys(protos).map((k) => k.split("/")[2])} />;
  }
}

// Dev-only views: ?screen=<id> renders one product screen at its native size (the device
// textures are shot from it), ?screens shows them all, ?sandbox=devices the 3D devices.
if (import.meta.env.DEV) {
  const q = new URLSearchParams(location.search);
  const Screen = lazy(() => import("./screens/ScreenView"));
  const Gallery = lazy(() => import("./screens/Gallery"));
  const Devices = lazy(() => import("./sandbox/Devices"));
  if (q.get("screen")) view = <Screen id={q.get("screen")!} />;
  else if (q.has("screens")) view = <Gallery />;
  else if (q.get("sandbox") === "devices") view = <Devices />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={null}>{view}</Suspense>
  </StrictMode>,
);
