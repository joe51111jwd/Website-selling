import { useEffect, useRef } from "react";
import { filaments, heroSpec, stats } from "../content/catalog";
import { everyFrame, line } from "../lib/line";
import { scrollToId } from "../lib/scroll";
import { useStore } from "../lib/store";

const heroStats = stats({ infillPct: 15, spec: heroSpec }, 45, filaments.signal);
const heroLayers = heroStats.layers;

export default function Hero() {
  const ready = useStore((s) => s.ready);
  const layer = useRef<HTMLSpanElement>(null);
  const metres = useRef<HTMLSpanElement>(null);
  const state = useRef<HTMLSpanElement>(null);

  useEffect(
    () =>
      everyFrame(() => {
        const p = line.progress.get("hero") ?? 0;
        if (layer.current) layer.current.textContent = String(Math.min(heroLayers, Math.ceil(p * heroLayers))).padStart(3, "0");
        if (metres.current) metres.current.textContent = (p * heroStats.lineM).toFixed(1);
        if (state.current) state.current.textContent = p <= 0 ? "Homing" : p < 1 ? "Printing" : "Done";
      }),
    [],
  );

  return (
    <section className={`hero${ready ? " is-in" : ""}`} id="top">
      <div className="hero__copy">
        <p className="kicker mono">3D-printed objects, made to order</p>
        <h1 className="hero__title">
          <span className="line"><span>Everything</span></span>
          <span className="line"><span>here is</span></span>
          <span className="line"><span>one <em>line.</em></span></span>
        </h1>
        <p className="hero__lede">
          Every piece we sell is drawn by a printer from a single, unbroken strand of plastic, laid down layer on layer,
          the moment you order it.
        </p>
        <button className="cta" onClick={() => scrollToId("collection")}>
          Follow the line
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v11M3.5 8.5 8 13l4.5-4.5" /></svg>
        </button>
      </div>
      <div className="hero__stage">
        <div className="station" data-station="hero" />
        <p className="readout mono" aria-hidden="true">
          <span>No. 00</span>
          <span><span ref={state}>Homing</span></span>
          <span>Layer <span ref={layer}>000</span>/{heroLayers}</span>
          <span><span ref={metres}>0.0</span> m of line</span>
        </p>
      </div>
      <p className="hero__scroll mono" aria-hidden="true">Scroll to print</p>
    </section>
  );
}
