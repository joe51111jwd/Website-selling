import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { filaments, fmtTime, priceFor, productBySlug, products, sizes, stats } from "../content/catalog";
import { everyFrame } from "../lib/line";
import { addToQueue, closeInspector, openInspector, store } from "../lib/store";
import type { PrintState } from "../three/Viewer";
import { infillName } from "./Piece";

const Viewer = lazy(() => import("../three/Viewer"));

// Full-screen inspector: the 3D viewer on the left, the piece and its options on the right.
// The layer slider works like a slicer's: drag it down to un-print the piece and see inside.
export default function Inspector({ slug }: { slug: string }) {
  const product = productBySlug(slug);
  const [filamentId, setFilamentId] = useState(product?.filaments[0] ?? "bone");
  const [sizeId, setSizeId] = useState<"S" | "M" | "L">("M");
  const [lightsOff, setLightsOff] = useState(false);
  const [queued, setQueued] = useState(false);
  const print = useRef<PrintState>({ p: 0, target: 1, speed: 0.42, dragging: false, printId: 0 });
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const layerOut = useRef<HTMLElement>(null);
  const zOut = useRef<HTMLElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLElement | null)[]>([]);

  // a new piece, or a new filament: reprint from the plate up
  useEffect(() => {
    if (!product) return;
    setFilamentId(product.filaments[0]);
    setLightsOff(false);
    setQueued(false);
    print.current.speed = 0.42;
    print.current.printId++;
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const f = filaments[filamentId] ?? filaments.bone;
  const size = sizes.find((s) => s.id === sizeId)!;
  const s = product ? stats(product, size.mm, f) : null;

  useEffect(() => {
    if (!s) return;
    return everyFrame(() => {
      const p = print.current.p;
      const layer = Math.round(p * s.layers);
      if (fill.current) fill.current.style.transform = `scaleY(${p})`;
      if (knob.current) knob.current.style.top = `${(1 - p) * 100}%`;
      if (layerOut.current) layerOut.current.textContent = String(layer).padStart(3, "0");
      if (zOut.current) zOut.current.textContent = (layer * 0.2).toFixed(1);
    });
  }, [s?.layers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!root.current?.contains(document.activeElement)) root.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeInspector();
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // re-bind with the current slug

  const step = (d: number) => {
    const i = products.findIndex((p) => p.slug === slug);
    openInspector(products[(i + d + products.length) % products.length].slug);
  };

  const pick = (id: string) => {
    if (id === filamentId) return;
    setFilamentId(id);
    if (filaments[id].finish !== "glow") setLightsOff(false);
    print.current.speed = 0.62;
    print.current.printId++;
  };

  // layer slider: pointer drag, plus keyboard on the handle
  const fromPointer = useCallback((clientY: number) => {
    const r = track.current!.getBoundingClientRect();
    const p = 1 - Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    print.current.p = p;
    print.current.target = p;
  }, []);
  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    print.current.dragging = true;
    fromPointer(e.clientY);
  };
  const onMove = (e: React.PointerEvent) => print.current.dragging && fromPointer(e.clientY);
  const onUp = () => (print.current.dragging = false);
  const onSliderKey = (e: React.KeyboardEvent) => {
    if (!s) return;
    const one = 1 / s.layers;
    const pr = print.current;
    const k = { ArrowUp: one * 5, ArrowDown: -one * 5, PageUp: 0.1, PageDown: -0.1, Home: 1, End: -1 }[e.key];
    if (k === undefined) return;
    e.preventDefault();
    pr.p = pr.target = Math.min(1, Math.max(0, pr.p + k));
  };
  const finish = () => {
    print.current.speed = 0.5;
    print.current.target = 1;
  };

  if (!product || !s) return null;
  const price = priceFor(product, size);

  return (
    <div
      ref={root}
      tabIndex={-1}
      className={`inspector${lightsOff ? " is-dark" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name}, in 3D`}
    >
      <div className="inspector__stage">
        <Suspense fallback={<div className="inspector__loading mono">Heating nozzle…</div>}>
          <Viewer spec={product.spec} filament={f} mm={size.mm} lightsOff={lightsOff} print={print} labels={labels} />
        </Suspense>
        {[0, 1].map((i) => (
          <span key={i} ref={(el) => void (labels.current[i] = el)} className="dim mono is-hidden" aria-hidden="true">
            {size.mm} mm
          </span>
        ))}

        <div className="inspector__top">
          <button className="pill mono" onClick={closeInspector}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3M7.5 3.5 3 8l4.5 4.5" /></svg>
            Back to the line
          </button>
          <div className="inspector__nav mono">
            <button className="icon-btn" onClick={() => step(-1)} aria-label="Previous piece">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
            </button>
            <span>{product.no} / {String(products.length).padStart(2, "0")}</span>
            <button className="icon-btn" onClick={() => step(1)} aria-label="Next piece">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
            </button>
          </div>
        </div>

        <div className="slicer">
          <p className="slicer__label mono">
            Layer <b ref={layerOut}>000</b>/{s.layers}
            <span>Z <b ref={zOut}>0.0</b> mm</span>
          </p>
          <div
            ref={track}
            className="slicer__track"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div ref={fill} className="slicer__fill" />
            <div
              ref={knob}
              className="slicer__handle"
              role="slider"
              tabIndex={0}
              aria-label="Layer"
              aria-valuemin={0}
              aria-valuemax={s.layers}
              aria-valuetext="Drag down to cut through the layers"
              onKeyDown={onSliderKey}
            />
          </div>
          <button className="slicer__reset mono" onClick={finish}>Print to top</button>
        </div>

        <p className="inspector__hint mono">Drag to turn · Scroll or pinch to zoom · Slide the layers to see inside</p>
        {f.finish === "glow" && (
          <button className={`pill mono inspector__lights${lightsOff ? " is-on" : ""}`} onClick={() => setLightsOff((v) => !v)} aria-pressed={lightsOff}>
            {lightsOff ? "Lights on" : "Lights off"}
          </button>
        )}
      </div>

      <aside className="inspector__panel" data-lenis-prevent>
        <p className="piece__meta mono">
          <span>No. {product.no}</span>
          <span className="piece__rule" />
          <span>{infillName[product.spec.infill]} {product.infillPct}% · {product.spec.walls} walls</span>
        </p>
        <h2 className="inspector__name">{product.name}</h2>
        <p className="inspector__about">{product.about}</p>

        <fieldset className="opt">
          <legend className="mono">Filament <span>{f.name} · {f.material}</span></legend>
          <div className="opt__spools">
            {product.filaments.map((id) => {
              const fl = filaments[id];
              return (
                <button
                  key={id}
                  className={`spool${id === filamentId ? " is-on" : ""}`}
                  style={{ ["--c" as string]: fl.hex }}
                  onClick={() => pick(id)}
                  aria-pressed={id === filamentId}
                  aria-label={`${fl.name}, ${fl.material}`}
                >
                  <span className="spool__reel" aria-hidden="true" />
                  <span className="spool__name mono">{fl.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="opt">
          <legend className="mono">Size <span>{size.mm} × {size.mm} × {size.mm} mm</span></legend>
          <div className="opt__sizes">
            {sizes.map((sz) => (
              <button key={sz.id} className={`size${sz.id === sizeId ? " is-on" : ""}`} onClick={() => setSizeId(sz.id)} aria-pressed={sz.id === sizeId}>
                <b>{sz.id}</b>
                <span className="mono">{sz.mm} mm</span>
              </button>
            ))}
          </div>
        </fieldset>

        <dl className="inspector__stats mono">
          <div><dt>Line</dt><dd>{Math.round(s.lineM)} m</dd></div>
          <div><dt>Layers</dt><dd>{s.layers}</dd></div>
          <div><dt>Weight</dt><dd>{Math.round(s.grams)} g</dd></div>
          <div><dt>Prints in</dt><dd>{fmtTime(s.minutes)}</dd></div>
        </dl>

        <div className="inspector__buy">
          <button
            className="btn btn--big"
            onClick={() => {
              addToQueue({ slug: product.slug, filament: filamentId, size: sizeId }, false);
              setQueued(true);
            }}
          >
            {queued ? "Queued. Add another" : "Print mine"}
            <span className="btn__price">${price}</span>
          </button>
          {queued && (
            <button className="btn btn--ghost btn--wide" onClick={() => (closeInspector(), store.set({ queueOpen: true }))}>
              View your queue
            </button>
          )}
          <p className="mono inspector__fine">Printed when you order, with a link to watch it. Ships in 2–3 days.</p>
        </div>
      </aside>
    </div>
  );
}
