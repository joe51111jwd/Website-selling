import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { TICKETS, type Ticket } from "../content";
import "./Rail.css";

/** His career as order tickets on the pass rail. Scrolling slides the rail; each ticket that
 * reaches the middle gets fired. */
export function Rail() {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [span, setSpan] = useState(0);
  const [fired, setFired] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.04, 0.96], [0, -span]);

  useLayoutEffect(() => {
    const measure = () => {
      const t = track.current;
      if (t) setSpan(Math.max(0, t.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const check = () => {
    const t = track.current;
    if (!t) return;
    const mid = window.innerWidth * 0.62;
    let n = 0;
    t.querySelectorAll<HTMLElement>(".ticket").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.left + r.width / 2 < mid) n++;
    });
    setFired(n);
  };
  useMotionValueEvent(x, "change", check);
  useEffect(check, [span]);

  return (
    <section id="story" ref={ref} className="rail" style={{ height: `calc(100svh + ${span}px)` }}>
      <div className="rail-stick">
        <div className="rail-head wrap">
          <p className="eyebrow">The story</p>
          <h2 className="display">
            Order <span className="serif">history</span>
          </h2>
          <p className="rail-sub">Every cook has a rail of tickets behind them. These are his.</p>
        </div>
        <div className="rail-bar" aria-hidden>
          <i />
        </div>
        <motion.div ref={track} className="rail-track" style={{ x }}>
          {TICKETS.map((t, i) => (
            <TicketCard key={t.no} t={t} i={i} fired={i < fired} />
          ))}
          <div className="rail-end" aria-hidden />
        </motion.div>
      </div>
    </section>
  );
}

function TicketCard({ t, i, fired }: { t: Ticket; i: number; fired: boolean }) {
  return (
    <article className={`ticket ${fired ? "fired" : ""}`} style={{ ["--tilt" as string]: `${((i * 37) % 7) - 3}deg` }}>
      <header>
        <span>Ticket #{t.no}</span>
        <span>{String(i + 1).padStart(2, "0")}/{String(TICKETS.length).padStart(2, "0")}</span>
      </header>
      <div className="ticket-rule" />
      <p className="ticket-when">{t.when}</p>
      <h3 className="ticket-where">{t.where}</h3>
      <p className="ticket-what">{t.what}</p>
      {t.quote && <blockquote className="ticket-quote">“{t.quote}”</blockquote>}
      <footer>
        <span>Chef: J. Taylor</span>
        <span>{t.stamp === "Open" ? "Now open" : "Ordered"}</span>
      </footer>
      <span className={`ticket-stamp ${t.stamp === "Open" ? "open" : ""}`} aria-hidden>
        {t.stamp === "Open" ? "Open" : "Fired"}
      </span>
    </article>
  );
}
