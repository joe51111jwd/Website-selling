import { useEffect, useRef, useState } from "react";
import { BroilerFire } from "../ui/BroilerFire";
import { Clipping, Cutout, Note, Torn } from "../ui/collage";
import { reducedMotion } from "../lib/motion";
import "./Broiler.css";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Chicago style is cooked from above. Hold the button and the broiler comes on over a raw ribeye;
 * let go and it rests. */
const PILOT = 0.12; // a low flame while nobody's holding the button

export function Broiler() {
  const heat = useRef(PILOT);
  const holding = useRef(false);
  const [h, setH] = useState(PILOT);
  const [hold, setHold] = useState(false);
  const [done, setDone] = useState(false);

  // the loop only runs while the broiler is heating or cooling
  const raf = useRef(0);
  const run = () => {
    if (raf.current) return;
    let last = performance.now();
    const slow = reducedMotion();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = holding.current ? 1 : PILOT;
      const rate = holding.current ? 0.42 : 0.6; // heats in ~2.4 s, cools a little faster
      heat.current += Math.sign(target - heat.current) * Math.min(Math.abs(target - heat.current), rate * dt * (slow ? 3 : 1));
      setH(heat.current);
      if (heat.current > 0.995) setDone(true);
      if (holding.current || heat.current > PILOT) raf.current = requestAnimationFrame(tick);
      else raf.current = 0;
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const on = (v: boolean) => {
    holding.current = v;
    setHold(v);
    run();
    if (v) navigator.vibrate?.(20);
  };

  const k = Math.max(0, (h - PILOT) / (1 - PILOT));
  const temp = Math.round(72 + (900 - 72) * Math.pow(k, 0.85));
  // the crust comes on near the top of the climb, and stays once it's there
  const sear = done ? 1 : smooth(0.45, 0.95, k);
  return (
    <section id="heat" className="heat dark" aria-label="Broiled at 900 degrees">
      <Torn edge="top" color="var(--char)" seed={11} depth={34} />
      <div className="wrap heat-grid">
        <div className="heat-head">
          <p className="eyebrow">No. 01 · Chicago style</p>
          <h2 className="heat-big display">
            900<sup>°</sup>
          </h2>
        </div>
        <div className="heat-clips">
          <Clipping outlet="Boca Raton Observer" when="July 2025" className="heat-clip">
            cooked from above using a broiler heated to about 900 degrees rather than from below with grill flames.
          </Clipping>
          <Clipping outlet="Boca Raton Observer" when="July 2025" className="heat-clip heat-clip-2">
            The meat then rests for up to 45 minutes, depending on its size, allowing the juices to settle and stay sealed
            inside.
          </Clipping>
        </div>

        <div className={`heat-box ${hold ? "hold" : ""} ${done ? "done" : ""}`}>
          <div className="heat-window">
            <BroilerFire heat={heat} />
            <div className="heat-steak" style={{ ["--k" as string]: k }} aria-hidden>
              <div style={{ opacity: 1 - sear }}>
                <Cutout id="rib-raw" />
              </div>
              <div className="heat-cooked" style={{ opacity: sear, scale: String(0.94 + sear * 0.06) }}>
                <Cutout id="rib-cooked" />
              </div>
            </div>
            <div className="heat-glow" style={{ opacity: k }} aria-hidden />
          </div>
          <div className="heat-ctl">
            <p className="heat-temp display" aria-live="polite">
              {temp}
              <span>°F</span>
            </p>
            <button
              className="heat-btn"
              onPointerDown={(e) => {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                setDone(false);
                on(true);
              }}
              onPointerUp={() => on(false)}
              onPointerCancel={() => on(false)}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && (e.preventDefault(), setDone(false), on(true))}
              onKeyUp={(e) => (e.key === " " || e.key === "Enter") && on(false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {done && !hold ? "Order up. Let it rest." : hold ? "Firing…" : "Hold to fire the broiler"}
            </button>
            <Note color="flame" className="heat-hint">
              your turn
            </Note>
          </div>
        </div>
      </div>
      <Torn edge="bottom" color="var(--char)" seed={23} depth={34} />
    </section>
  );
}
