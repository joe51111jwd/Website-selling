import { lazy, Suspense } from "react";

const Specimen = lazy(() => import("./Specimen"));
const RenderPhone = lazy(() => import("./RenderPhone"));

export default function ProductProto() {
  const q = new URLSearchParams(location.search);
  if (q.get("render") === "iphone") return <Suspense fallback={null}><RenderPhone /></Suspense>;
  return <Suspense fallback={null}><Specimen /></Suspense>;
}
