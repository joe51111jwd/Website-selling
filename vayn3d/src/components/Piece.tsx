import { useEffect, useRef } from "react";
import { filaments, fmtTime, sizes, stats, type Product } from "../content/catalog";
import { everyFrame, line } from "../lib/line";
import { addToQueue, openInspector, store } from "../lib/store";

export const infillName = { grid: "Grid", gyroid: "Gyroid", honeycomb: "Honeycomb" } as const;

// One product on the line. The empty box on one side is where the 3D line prints it;
// the box itself is the button that opens the inspector.
export default function Piece({ product: p, index }: { product: Product; index: number }) {
  const f = filaments[p.filaments[0]];
  const s = stats(p, sizes[1].mm, f);
  const metres = useRef<HTMLElement>(null);
  const layers = useRef<HTMLElement>(null);
  const root = useRef<HTMLElement>(null);

  useEffect(
    () =>
      everyFrame(() => {
        const prog = line.progress.get(p.slug) ?? 0;
        if (metres.current) metres.current.textContent = (prog * s.lineM).toFixed(prog < 1 ? 1 : 0);
        if (layers.current) layers.current.textContent = String(Math.round(prog * s.layers));
        root.current?.classList.toggle("is-printed", prog >= 1);
        root.current?.classList.toggle("is-printing", prog > 0 && prog < 1);
      }),
    [p.slug, s.lineM, s.layers],
  );

  const hover = (on: boolean) => store.set({ hover: on ? p.slug : null });

  return (
    <article ref={root} className={`piece piece--${index % 2 ? "b" : "a"}`} id={p.slug} aria-labelledby={`${p.slug}-name`}>
      <button
        className="piece__stage station"
        data-station={p.slug}
        onClick={() => openInspector(p.slug)}
        onPointerEnter={() => hover(true)}
        onPointerLeave={() => hover(false)}
        onFocus={() => hover(true)}
        onBlur={() => hover(false)}
        aria-label={`Inspect ${p.name} in 3D`}
      >
        <span className="piece__no" aria-hidden="true">{p.no}</span>
        <span className="piece__hint mono" aria-hidden="true">Inspect in 3D</span>
      </button>
      <div className="piece__info">
        <p className="piece__meta mono">
          <span>No. {p.no}</span>
          <span className="piece__rule" />
          <span>{infillName[p.spec.infill]} {p.infillPct}% · {p.spec.walls} walls</span>
        </p>
        <h2 className="piece__name" id={`${p.slug}-name`}>{p.name}</h2>
        <p className="piece__line">{p.line}</p>
        <dl className="piece__stats mono">
          <div>
            <dt>Line</dt>
            <dd><b ref={metres}>0.0</b> m</dd>
          </div>
          <div>
            <dt>Layers</dt>
            <dd><b ref={layers}>0</b>/{s.layers}</dd>
          </div>
          <div>
            <dt>Prints in</dt>
            <dd>{fmtTime(s.minutes)}</dd>
          </div>
        </dl>
        <div className="piece__buy">
          <span className="piece__price">${p.price}</span>
          <span className="piece__spools" aria-label={`Comes in ${p.filaments.map((id) => filaments[id].name).join(", ")}`}>
            {p.filaments.map((id) => (
              <i key={id} style={{ background: filaments[id].hex }} title={`${filaments[id].name}, ${filaments[id].material}`} />
            ))}
          </span>
          <button className="btn btn--ghost" onClick={() => openInspector(p.slug)}>Inspect</button>
          <button className="btn" onClick={() => addToQueue({ slug: p.slug, filament: p.filaments[0], size: "M" })}>
            Queue it
          </button>
        </div>
      </div>
    </article>
  );
}
