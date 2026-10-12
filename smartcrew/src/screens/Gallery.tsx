import { lazy, Suspense, useMemo } from "react";
import { SCREENS, SIZE, type ScreenDef } from "./registry";

/** Every screen at half size, for reviewing them side by side. */
export default function Gallery() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 32, padding: 32, background: "#ddd", minHeight: "100vh", font: "13px system-ui" }}>
      {SCREENS.map((s) => (
        <Tile key={s.id} def={s} />
      ))}
    </div>
  );
}

function Tile({ def }: { def: ScreenDef }) {
  const Comp = useMemo(() => lazy(def.load), [def]);
  const { w, h } = SIZE[def.kind];
  const k = 0.5;
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ width: w * k, height: h * k, overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px #0003" }}>
        <div style={{ width: w, height: h, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          <Suspense fallback={null}>
            <Comp />
          </Suspense>
        </div>
      </div>
      <figcaption style={{ marginTop: 8 }}>
        <a href={`?screen=${def.id}`}>{def.id}</a> · {def.title}
      </figcaption>
    </figure>
  );
}
