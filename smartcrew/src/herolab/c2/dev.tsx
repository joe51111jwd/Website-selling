// Harness for herolab c2 "The Work-Zone Board" (dev only): mounts the hero with the page's fonts
// and the page's geofence cursor, and a stub of One Day below it, so the hand-off can be judged.
//   desktop: the hero sits in a sticky stage; the sign's 6:42 AM flies into One Day's first time
//   phones:  the sign flips back to 6:42 as it scrolls away; One Day opens on the big time (IO, once)

import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../styles/fonts.css";
import "../../styles/tokens.css";
import "@fontsource-variable/inter/index.css";
import Cursor from "../../cursor/Cursor";
import HeroBoard, { readAngle } from "./index";
import "./dev.css";

const q = new URLSearchParams(location.search);

function Harness() {
  const stage = useRef<HTMLDivElement>(null);
  const time = useRef<HTMLDivElement>(null);
  const [phone] = useState(() => innerWidth <= 760);

  // desktop: the stub's other lines follow the same scroll (transform/opacity)
  useEffect(() => {
    const el = stage.current;
    if (!el || phone) return;
    const rest = [...el.querySelectorAll<HTMLElement>("[data-stub]")];
    let raf = 0;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const render = () => {
      raf = 0;
      const p = clamp(scrollY / (innerHeight * 0.9));
      rest.forEach((r, i) => {
        const k = clamp((p - 0.72 - i * 0.05) / 0.22);
        r.style.opacity = String(k);
        r.style.transform = `translateY(${((1 - k) * 18).toFixed(1)}px)`;
      });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    addEventListener("scroll", on, { passive: true });
    render();
    return () => removeEventListener("scroll", on);
  }, [phone]);

  // phones: once, when One Day arrives
  useEffect(() => {
    const el = stage.current;
    if (!el || !phone) return;
    const t = el.querySelector(".dev-pday");
    if (!t) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(t);
    return () => io.disconnect();
  }, [phone]);

  const hero = (
    <HeroBoard
      angle={readAngle()}
      intro={q.get("intro") !== "0"}
      hold={q.has("hold") ? +q.get("hold")! : 500}
      paused={q.has("paused")}
      handoff={q.get("stub") === "0" || phone ? undefined : { target: () => time.current, distance: () => innerHeight * 0.9 }}
      onCta={(i) => console.log("[hl2] cta", i)}
    />
  );

  if (q.get("stub") === "0") return hero;

  if (phone)
    return (
      <div className="dev-pstage" ref={stage}>
        {hero}
        <section className="dev-pday" id="day">
          <div className="dev-ptime">6:42 AM</div>
          <p className="dev-ptitle">The crew pulls onto the job.</p>
          <div className="dev-pphone">
            <img src="/screens/phone-working.webp" alt="" />
          </div>
          <p className="dev-pcard">
            <b>In the office:</b> Marcus · on site 6:42
          </p>
          <p className="dev-note">Hand-off stub (not part of the hero): One Day starts here.</p>
        </section>
      </div>
    );

  return (
    <div className="dev-stage" ref={stage}>
      <div className="dev-sticky">
        {hero}
        <div className="dev-day" id="day">
          <div className="dev-time" ref={time}>
            6:42 AM
          </div>
          <p className="dev-title" data-stub>
            The crew pulls onto the job.
          </p>
          <p className="dev-out" data-stub>
            The timecard starts on the right job and cost code.
          </p>
          <p className="dev-note" data-stub>
            Hand-off stub: in the page, the 3D MacBook and iPhone land here.
          </p>
        </div>
        <div className="dev-phone" data-stub>
          <img src="/screens/phone-working.webp" alt="" />
        </div>
      </div>
      <div className="dev-after" />
    </div>
  );
}

document.documentElement.classList.toggle("is-day", q.get("intro") === "0");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Harness />
    {q.has("nocursor") ? null : <Cursor />}
  </StrictMode>,
);
