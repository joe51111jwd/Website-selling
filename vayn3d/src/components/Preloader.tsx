import { useEffect, useRef, useState } from "react";
import { reducedMotion } from "../lib/scroll";
import { store } from "../lib/store";
import Logo from "./Logo";

// The page "heats the nozzle" while fonts and the 3D scene get ready: 24 °C to 215 °C.
export default function Preloader() {
  const [gone, setGone] = useState(false);
  const [lift, setLift] = useState(false);
  const temp = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("vayn3d-seen") === "1";
      sessionStorage.setItem("vayn3d-seen", "1");
    } catch {
      /* no storage, play the full heat-up */
    }
    const dur = reducedMotion ? 200 : seen ? 650 : 1500;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    let fontsDone = false;
    fonts.then(() => (fontsDone = true));
    const t0 = performance.now();
    let id = 0;
    const loop = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      if (temp.current) temp.current.textContent = String(Math.round(24 + (215 - 24) * e)).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${e})`;
      if (k < 1 || !fontsDone) id = requestAnimationFrame(loop);
      else {
        setLift(true);
        store.set({ ready: true });
        setTimeout(() => setGone(true), reducedMotion ? 0 : 900);
      }
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  if (gone) return null;
  return (
    <div className={`preloader${lift ? " is-lifting" : ""}`} aria-hidden="true">
      <div className="preloader__inner mono">
        <Logo className="preloader__logo" />
        <span>Heating nozzle</span>
        <span className="preloader__temp">
          <span ref={temp}>024</span> / 215 °C
        </span>
        <span className="preloader__bar">
          <span ref={bar} />
        </span>
      </div>
    </div>
  );
}
