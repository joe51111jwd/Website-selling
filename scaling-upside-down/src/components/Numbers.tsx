import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { numbers } from "../content";
import { Reveal, Rich } from "./ui";

/*
  "Three numbers. One framework." Apple-style stats, then a compare card: a live diagram of a team,
  one dot per person and one line per pair. Drag the slider and watch twelve people's 66 lines turn
  into forty-eight people's 1,128.
*/

const BLUE = [0, 113, 227];
const RED = [227, 52, 41];
const INK = [29, 29, 31];
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function where(n: number) {
  if (n === 1) return { text: "Solopreneur floor", trap: false };
  if (n <= 12) return { text: "Under the ceiling", trap: false };
  if (n < 40) return { text: "Past the ceiling. Without a moat, this is the trap.", trap: true };
  return { text: "Team-of-teams range", trap: true };
}

function Network({ target }: { target: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const goal = useRef(target);
  goal.current = target;
  const inView = useInView(canvas, { margin: "100px 0px" });

  useEffect(() => {
    const c = canvas.current;
    if (!c || !inView) return;
    const ctx = c.getContext("2d")!;
    const nodes: { a: number; r: number; alpha: number }[] = [];
    let count = nodes.length || goal.current;
    let raf = 0;
    let rot = 0;
    const size = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.width * dpr);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      count += (goal.current - count) * 0.1;
      if (Math.abs(goal.current - count) < 0.02) count = goal.current;
      const n = Math.max(1, Math.round(count));
      while (nodes.length < n) nodes.push({ a: nodes.length ? nodes[nodes.length - 1].a : -Math.PI / 2, r: nodes.length ? 1 : 0, alpha: 0 });
      while (nodes.length > n) nodes.pop();
      rot += 0.0005;
      nodes.forEach((p, i) => {
        const ta = -Math.PI / 2 + (i / n) * Math.PI * 2 + rot;
        const d = Math.atan2(Math.sin(ta - p.a), Math.cos(ta - p.a));
        p.a += d * 0.14;
        p.r += ((n === 1 ? 0 : 1) - p.r) * 0.12;
        p.alpha += (1 - p.alpha) * 0.12;
      });

      const W = c.width;
      const R = W * 0.42;
      const trap = smooth(13, 30, count);
      const j = trap * W * 0.004;
      const pts = nodes.map((p, i) => [
        W / 2 + Math.cos(p.a) * R * p.r + (j ? Math.sin(now * 0.004 + i * 1.7) * j : 0),
        W / 2 + Math.sin(p.a) * R * p.r + (j ? Math.cos(now * 0.005 + i * 2.3) * j : 0),
        p.alpha,
      ]);
      ctx.clearRect(0, 0, W, W);
      const lineCol = mix(INK, RED, trap);
      const base = Math.min(0.42, 0.34 * Math.pow(12 / Math.max(n, 2), 0.85));
      ctx.lineWidth = Math.max(1, W / 1000);
      for (let a = 0; a < pts.length; a++)
        for (let b = a + 1; b < pts.length; b++) {
          ctx.strokeStyle = rgba(lineCol, base * Math.min(pts[a][2], pts[b][2]));
          ctx.beginPath();
          ctx.moveTo(pts[a][0], pts[a][1]);
          ctx.lineTo(pts[b][0], pts[b][1]);
          ctx.stroke();
        }
      const dot = mix(BLUE, RED, trap);
      const rad = W * (0.012 - 0.006 * smooth(12, 48, n));
      pts.forEach(([x, y, a]) => {
        ctx.fillStyle = rgba(dot, a);
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [inView]);

  return <canvas ref={canvas} className="net" aria-label="A team drawn as dots, with a line between every pair of people." />;
}

export function Numbers() {
  const [n, setN] = useState(12);
  const w = where(n);
  return (
    <section className="section numbers" aria-label="The numbers">
      <Reveal className="wrap">
        <h2 className="headline headline-md">{numbers.headline}</h2>
      </Reveal>
      <div className="wrap stat-row">
        {numbers.stats.map((s, i) => (
          <Reveal className="stat" key={s.n} delay={i * 0.08}>
            <span className="stat-n">{s.n}</span>
            <span className="stat-label">{s.label}</span>
            <span className="stat-text">{s.text}</span>
          </Reveal>
        ))}
      </div>

      <div className="wrap">
        <div className="compare">
          <div className="compare-viz">
            <Network target={n} />
          </div>
          <div className="compare-copy">
            <h3 className="compare-title">{numbers.lines.headline}</h3>
            <p className="compare-body">
              <Rich parts={numbers.lines.body} />
            </p>
            <label className="slider" htmlFor="team-size">
              <span className="slider-label">Team size</span>
              <input id="team-size" type="range" min={1} max={70} value={n} onChange={(e) => setN(+e.target.value)} />
            </label>
            <div className="readout">
              <div>
                <span>People</span>
                <b>{n}</b>
              </div>
              <div>
                <span>Lines</span>
                <b>{((n * (n - 1)) / 2).toLocaleString("en-US")}</b>
              </div>
              <div className="readout-wide">
                <span>Where you are</span>
                <b className={w.trap ? "is-trap" : ""}>{w.text}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
