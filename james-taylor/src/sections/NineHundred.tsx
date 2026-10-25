import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { ScrubFilm } from "../ui/ScrubFilm";
import { BroilerFire } from "../ui/BroilerFire";
import { reducedMotion } from "../lib/media";
import "./NineHundred.css";

const BASE = import.meta.env.BASE_URL;

/** Chicago style, in two parts: the ribeye opens on scroll while the copy walks through the heat and
 * the rest; then a broiler you can fire yourself. */
export function NineHundred() {
  return (
    <section id="heat" className="nh">
      <Split />
      <Fire />
    </section>
  );
}

function Split() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const film = useTransform(p, [0.02, 0.9], [0, 1], { clamp: true });
  const a = useTransform(p, [0.0, 0.06, 0.3, 0.36], [0, 1, 1, 0]);
  const b = useTransform(p, [0.36, 0.42, 0.64, 0.7], [0, 1, 1, 0]);
  const c = useTransform(p, [0.7, 0.78, 1], [0, 1, 1]);
  return (
    <div ref={ref} className="nh-split">
      <div className="nh-stick">
        <ScrubFilm
          name="film-steak"
          progress={film}
          fit="cover"
          portrait={{ fit: 0.4, x: 0.64, y: 0.1 }}
          className="nh-film"
          label="The Chicago Cut Ribeye on a board, cut through the middle; the halves part to show a rosy medium-rare inside."
        />
        <div className="nh-shade" aria-hidden />
        <motion.div className="nh-card wrap" style={{ opacity: a }}>
          <p className="eyebrow">No. 01 · Chicago style</p>
          <h2 className="nh-big display" aria-label="900 degrees, Chicago style">
            900<sup>°</sup>
          </h2>
          <blockquote>
            <p className="serif">
              “cooked from above using a broiler heated to about 900 degrees rather than from below with grill flames.”
            </p>
            <cite>Boca Raton Observer, on The Joyce</cite>
          </blockquote>
        </motion.div>
        <motion.div className="nh-card wrap" style={{ opacity: b }}>
          <p className="eyebrow">Then it rests</p>
          <RestClock p={p} />
          <blockquote>
            <p className="serif">
              “The meat then rests for up to 45 minutes, depending on its size, allowing the juices to settle and stay
              sealed inside.”
            </p>
            <cite>Boca Raton Observer</cite>
          </blockquote>
        </motion.div>
        <motion.div className="nh-card nh-last wrap" style={{ opacity: c }}>
          <p className="eyebrow">Edge to edge</p>
          <p className="nh-big display">
            Pink<span className="serif">.</span>
          </p>
          <blockquote>
            <p className="serif">“A pretty perfect steak”</p>
            <cite>The Infatuation</cite>
          </blockquote>
        </motion.div>
      </div>
    </div>
  );
}

/** 45:00 counting down to zero as the second card scrolls by (its own component, so only it re-renders). */
function RestClock({ p }: { p: MotionValue<number> }) {
  const [clock, setClock] = useState("45:00");
  useMotionValueEvent(p, "change", (v) => {
    const k = Math.max(0, Math.min(1, (v - 0.38) / 0.28));
    const s = Math.round(45 * 60 * (1 - k));
    setClock(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
  });
  return <p className="nh-big display nh-clock">{clock}</p>;
}

function Fire() {
  const heat = useRef(0);
  const holding = useRef(false);
  const [temp, setTemp] = useState(72);
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
      const target = holding.current ? 1 : 0;
      const rate = holding.current ? 0.42 : 0.6; // heats in ~2.4 s, cools a little faster
      heat.current += Math.sign(target - heat.current) * Math.min(Math.abs(target - heat.current), rate * dt * (slow ? 3 : 1));
      setTemp(Math.round(72 + (900 - 72) * Math.pow(heat.current, 0.85)));
      if (heat.current > 0.995) setDone(true);
      if (holding.current || heat.current > 0) raf.current = requestAnimationFrame(tick);
      else raf.current = 0;
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const on = (v: boolean) => {
    holding.current = v;
    setHold(v);
    run();
    if (v) {
      setDone(false);
      navigator.vibrate?.(20);
    }
  };

  return (
    <div className={`nh-fire ${hold ? "hold" : ""} ${done ? "done" : ""}`}>
      <BroilerFire heat={heat} />
      <div className="nh-fire-steak" style={{ ["--h" as string]: heat.current }} aria-hidden>
        <img src={`${BASE}seq/turn-ribeye/0001.webp`} alt="" loading="lazy" />
      </div>
      <div className="nh-fire-copy wrap">
        <p className="eyebrow">Your turn</p>
        <p className="nh-temp display" aria-live="polite">
          {temp}
          <span>°F</span>
        </p>
        <button
          className="nh-btn"
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            on(true);
          }}
          onPointerUp={() => on(false)}
          onPointerCancel={() => on(false)}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && (e.preventDefault(), on(true))}
          onKeyUp={(e) => (e.key === " " || e.key === "Enter") && on(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <span className="nh-btn-ring" aria-hidden />
          {done ? "Order up. Let it rest." : hold ? "Firing…" : "Hold to fire the broiler"}
        </button>
      </div>
    </div>
  );
}
