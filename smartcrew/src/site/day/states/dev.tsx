// Dev only (./dev.html): renders one state screen at native size in #screen, or all of them.
import { lazy, Suspense, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import { DAY_STATES } from "./registry";
import { screenById } from "../../../screens/registry";

const SIZE = { web: { w: 1440, h: 900 }, phone: { w: 402, h: 874 } };

function One({ id }: { id: string }) {
  // an original app screen (src/screens) renders too, for measuring
  const orig = screenById(id);
  const def = DAY_STATES.find((d) => d.id === id) ?? (orig ? { id, kind: orig.kind, load: () => orig.load().then((m) => m.default) } : undefined);
  const Comp = useMemo(() => (def ? lazy(() => def.load().then((c) => ({ default: c }))) : null), [def]);
  if (!def || !Comp) return <p>No state "{id}".</p>;
  const { w, h } = SIZE[def.kind];
  return (
    <div id={def.id} data-state={def.id} style={{ width: w, height: h, overflow: "hidden", position: "relative" }}>
      <Suspense fallback={null}>
        <Comp />
      </Suspense>
    </div>
  );
}

const q = new URLSearchParams(location.search).get("s");
createRoot(document.getElementById("root")!).render(
  q ? (
    <div id="screen">
      <One id={q} />
    </div>
  ) : (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 24, background: "#ddd" }}>
      {DAY_STATES.map((d) => (
        <One key={d.id} id={d.id} />
      ))}
    </div>
  ),
);
