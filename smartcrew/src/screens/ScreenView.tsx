import { lazy, Suspense, useMemo } from "react";
import { SIZE, screenById } from "./registry";

/** One screen alone at its native size, top-left, nothing else on the page. */
export default function ScreenView({ id }: { id: string }) {
  const def = screenById(id);
  const Comp = useMemo(() => (def ? lazy(def.load) : null), [def]);
  if (!def || !Comp) return <p style={{ font: "16px system-ui", padding: 24 }}>No screen "{id}".</p>;
  const { w, h } = SIZE[def.kind];
  return (
    <div id="screen" data-ready style={{ width: w, height: h, overflow: "hidden", position: "relative" }}>
      <Suspense fallback={null}>
        <Comp />
      </Suspense>
    </div>
  );
}
