import { lazy, Suspense, useEffect, useMemo } from "react";
import { SIZE, screenById } from "./registry";

/** One screen alone at its native size, top-left, nothing else on the page. */
export default function ScreenView({ id }: { id: string }) {
  const def = screenById(id);
  const Comp = useMemo(() => (def ? lazy(def.load) : null), [def]);
  // this dev view sits in an unstyled body: drop its default 8px margin so a viewport-sized
  // screenshot (1440×900 / 402×874) starts exactly at the screen's top-left corner
  useEffect(() => {
    const prev = document.body.style.margin;
    document.body.style.margin = "0";
    return () => {
      document.body.style.margin = prev;
    };
  }, []);
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
