import { useEffect, useRef, useState } from "react";
import { isHeroReady, reducedMotion } from "../lib/motion";
import "./Preloader.css";

// The broiler preheats while the hero loads: the dial climbs from room temperature to 900°F,
// the element glows from dull red to white-hot, then the cover lifts.
const FROM = 72;
const TO = 900;

export function Preloader({ onDone }: { onDone: () => void }) {
  const [temp, setTemp] = useState(FROM);
  const [gone, setGone] = useState(false);
  const [lift, setLift] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    document.getElementById("boot")?.remove();
    document.body.classList.add("loading");
    const quick = reducedMotion();
    let heroReady = isHeroReady();
    const onReady = () => (heroReady = true);
    window.addEventListener("hero:ready", onReady, { once: true });
    const t0 = performance.now();
    const minMs = quick ? 300 : 2300;
    const maxMs = 6500; // never hold the page longer than this, film or no film
    let raf = 0;
    const tick = (now: number) => {
      const el = now - t0;
      const fontsOk = document.fonts ? document.fonts.status === "loaded" : true;
      // ease toward 860 on time alone; the last stretch waits for the film
      const base = Math.min(1, el / minMs);
      const eased = 1 - Math.pow(1 - base, 3);
      const canFinish = (heroReady && fontsOk) || el > maxMs;
      const target = canFinish && base >= 1 ? 1 : eased * 0.95;
      setTemp((t) => {
        const goal = FROM + (TO - FROM) * target;
        return t + (goal - t) * (canFinish && base >= 1 ? 0.22 : 0.12);
      });
      if (canFinish && base >= 1 && performance.now() - t0 > minMs + 350) {
        setTemp(TO);
        setLift(true);
        window.setTimeout(() => {
          document.body.classList.remove("loading");
          done.current();
        }, quick ? 0 : 450);
        window.setTimeout(() => setGone(true), quick ? 0 : 1400);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hero:ready", onReady);
    };
  }, []);

  if (gone) return null;
  const k = (temp - FROM) / (TO - FROM);
  return (
    <div className={`pre ${lift ? "lift" : ""}`} aria-live="polite" aria-label="Loading">
      <div className="pre-top">
        <span>James Taylor</span>
        <span>{lift ? "Ready" : "Preheating"}</span>
      </div>
      <div className="pre-dial" style={{ ["--k" as string]: k }}>
        <span className="pre-num">{Math.round(temp)}</span>
        <span className="pre-deg">°F</span>
      </div>
      <div className="pre-element" style={{ ["--k" as string]: k }}>
        <i />
      </div>
      <div className="pre-bottom">
        <span>Broiler</span>
        <span>Chicago style · from above</span>
      </div>
    </div>
  );
}
