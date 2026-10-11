import { useEffect, useRef } from "react";
import { filaments, fmtTime, liveOrders, liveSpec, productBySlug, stats } from "../content/catalog";
import { everyFrame, line } from "../lib/line";

// The end of the line: a printer working on a customer's order, on its own clock.
export default function Live() {
  const refs = {
    piece: useRef<HTMLElement>(null),
    who: useRef<HTMLElement>(null),
    layer: useRef<HTMLElement>(null),
    left: useRef<HTMLElement>(null),
    bar: useRef<HTMLSpanElement>(null),
    state: useRef<HTMLSpanElement>(null),
  };

  useEffect(() => {
    let lastOrder = -1;
    let total = 0;
    let layers = 0;
    return everyFrame(() => {
      const { progress, order } = line.live;
      const o = liveOrders[order];
      if (order !== lastOrder) {
        lastOrder = order;
        const p = productBySlug(o.product)!;
        const f = filaments[o.filament];
        const s = stats({ infillPct: p.infillPct, spec: liveSpec }, 45, f);
        total = s.minutes;
        layers = s.layers;
        if (refs.piece.current) refs.piece.current.textContent = `No. ${p.no} ${p.name}, ${f.name} ${f.material}`;
        if (refs.who.current) refs.who.current.textContent = `${o.who}, ${o.where}`;
      }
      if (refs.layer.current) refs.layer.current.textContent = `${String(Math.round(progress * layers)).padStart(3, "0")} / ${layers}`;
      if (refs.left.current) refs.left.current.textContent = progress >= 1 ? "Done, packing" : fmtTime(total * (1 - progress));
      if (refs.bar.current) refs.bar.current.style.transform = `scaleX(${progress})`;
      if (refs.state.current) refs.state.current.textContent = progress <= 0 ? "Waiting" : progress >= 1 ? "Finished" : "Printing";
    });
  }, []);

  return (
    <section className="live" id="live" aria-labelledby="live-title">
      <div className="live__copy">
        <p className="live__tag mono">
          <span className="live__dot" /> Live · Printer 02 · <span ref={refs.state}>Waiting</span>
        </p>
        <h2 className="section-title" id="live-title">Nothing is printed until it's ordered.</h2>
        <p className="live__text">
          Your piece joins the queue and gets its own printer, and you get a link to watch it being made, layer by layer,
          like this one.
        </p>
        <dl className="live__status mono">
          <div><dt>Now printing</dt><dd ref={refs.piece}>…</dd></div>
          <div><dt>For</dt><dd ref={refs.who}>…</dd></div>
          <div><dt>Layer</dt><dd ref={refs.layer}>000</dd></div>
          <div><dt>Time left</dt><dd ref={refs.left}>…</dd></div>
          <div><dt>Nozzle / bed</dt><dd>215 °C / 60 °C</dd></div>
        </dl>
        <span className="live__bar" aria-hidden="true"><span ref={refs.bar} /></span>
      </div>
      <div className="live__stage">
        <div className="station" data-station="live" />
        <span className="live__plate" aria-hidden="true" />
      </div>
    </section>
  );
}
