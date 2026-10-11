import { useEffect, useRef } from "react";
import { everyFrame, line } from "../lib/line";

// A slicer-style readout that counts the line laid as you scroll.
export default function Hud() {
  const m = useRef<HTMLElement>(null);
  const l = useRef<HTMLElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      everyFrame(() => {
        if (m.current) m.current.textContent = line.meters.toFixed(1).padStart(6, "0");
        if (l.current) l.current.textContent = String(Math.round(line.layer)).padStart(4, "0");
        root.current?.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.5);
      }),
    [],
  );
  return (
    <div ref={root} className="hud mono" aria-hidden="true">
      <span><i className="hud__dot" />Line <b ref={m}>0000.0</b> m</span>
      <span>Layer <b ref={l}>0000</b></span>
    </div>
  );
}
