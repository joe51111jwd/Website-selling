import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { BroilerFire } from "../ui/BroilerFire";
import { ScrubFilm } from "../ui/ScrubFilm";
import { Clipping, Cutout, Label, Note, Torn } from "../ui/collage";
import { reducedMotion } from "../lib/motion";
import "./Broiler.css";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// where the film's two broiler flashes fall (frames 36.5 and 66.5 of 96, see models/film.py)
const FLASH = [35.5 / 95, 65.5 / 95];

/** Chicago style is cooked from above. First the film: real steaks, 3D-scanned, under a broiler as you
 * scroll, raw to seared to sliced. Then your turn with the button. */
export function Broiler() {
  return (
    <section id="heat" className="heat dark" aria-label="Broiled at 900 degrees">
      <Torn edge="top" color="var(--char)" seed={11} depth={34} />
      <SteakFilm />
      <YourTurn />
      <Torn edge="bottom" color="var(--char)" seed={23} depth={34} />
    </section>
  );
}

function SteakFilm() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const film = useTransform(p, [0.02, 0.96], [0, 1], { clamp: true });
  // the live flames along the top flare with the film's flashes
  const heat = useRef(0.4);
  useMotionValueEvent(film, "change", (v) => {
    const flare = Math.max(...FLASH.map((f, i) => Math.exp(-(((v - f) / 0.035) ** 2)) * (i ? 0.75 : 1)));
    heat.current = 0.38 + 0.25 * Math.min(1, v / FLASH[0]) + 0.6 * flare;
  });
  const a = useTransform(film, [0, 0.04, 0.26, 0.32], [0, 1, 1, 0]);
  const b = useTransform(film, [0.31, 0.36, 0.43, 0.47], [0, 1, 1, 0]);
  const c = useTransform(film, [0.46, 0.5, 0.62, 0.66], [0, 1, 1, 0]);
  const d = useTransform(film, [0.7, 0.74, 1], [0, 1, 1]);
  return (
    <div ref={ref} className="sf">
      <div className="sf-stick">
        <ScrubFilm
          name="film-steak"
          progress={film}
          fit="cover"
          portrait={{ fit: 0.5, x: 0.5, y: 0.5 }}
          className="sf-film"
          label="Real 3D-scanned steaks under a broiler: a raw bone-in rib steak, the same cut seared dark, then sliced to show it pink inside."
        />
        <div className="sf-ceiling" aria-hidden>
          <BroilerFire heat={heat} />
        </div>
        <div className="sf-shade" aria-hidden />
        <motion.div className="sf-card wrap" style={{ opacity: a }}>
          <Label tone="red">No. 01 · Chicago style</Label>
          <h2 className="sf-big display">The cut</h2>
          <Note color="bone">a bone-in ribeye, raw, under the broiler</Note>
        </motion.div>
        <motion.div className="sf-card sf-center wrap" style={{ opacity: b }}>
          <p className="sf-huge display">
            900<sup>°</sup>
          </p>
          <Note color="flame">from above, not over grill flames</Note>
        </motion.div>
        <motion.div className="sf-card wrap" style={{ opacity: c }}>
          <Clipping outlet="Boca Raton Observer" when="July 2025" className="sf-clip">
            cooked from above using a broiler heated to about 900 degrees rather than from below with grill flames.
          </Clipping>
        </motion.div>
        <motion.div className="sf-card wrap" style={{ opacity: d }}>
          <p className="eyebrow sf-eyebrow">Then it rests</p>
          <RestClock p={film} />
          <Clipping outlet="Boca Raton Observer" when="July 2025" className="sf-clip">
            The meat then rests for up to 45 minutes, depending on its size, allowing the juices to settle and stay sealed
            inside.
          </Clipping>
        </motion.div>
        <p className="sf-credit type">Real steaks, 3D-scanned by alban and Shahriar Shahrabi (CC BY)</p>
      </div>
    </div>
  );
}

/** 45:00 counting down to zero across the last part of the film (its own component, so only it re-renders). */
function RestClock({ p }: { p: MotionValue<number> }) {
  const [clock, setClock] = useState("45:00");
  useMotionValueEvent(p, "change", (v) => {
    const k = Math.max(0, Math.min(1, (v - 0.72) / 0.26));
    const s = Math.round(45 * 60 * (1 - k));
    setClock(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
  });
  return <p className="sf-clock display">{clock}</p>;
}

const PILOT = 0.12; // a low flame while nobody's holding the button

/** Hold the button and the broiler comes on over a raw ribeye; let go and it rests. */
function YourTurn() {
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
    <div className="heat-turn">
      <div className="wrap heat-grid">
        <div className="heat-head">
          <p className="eyebrow">Your turn</p>
          <h2 className="heat-big display">Fire it.</h2>
          <p className="heat-sub type">Hold the button. The broiler climbs to 900° over a raw ribeye; let go and it rests.</p>
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
    </div>
  );
}
