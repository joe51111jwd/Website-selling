// Harness for herolab c1 "Today's Sheet" (dev only): mounts the hero with the page's fonts, and a
// stub of the hand-off into One Day below it, so the scroll move can be judged.
//   desktop: the sheet tilts back (rotateX) and becomes the table the crew phone lands on
//   phones:  the drawing slides up and the phone rises over it (IntersectionObserver, once)

import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../styles/fonts.css";
import "../../styles/tokens.css";
import "@fontsource-variable/inter/index.css";
import HeroSheet, { readAngle } from "./index";
import "./dev.css";

const q = new URLSearchParams(location.search);

function Handoff() {
  const stage = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState(() => innerWidth <= 760);
  useEffect(() => {
    const on = () => setPhone(innerWidth <= 760);
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);

  // desktop: scroll-linked tilt (transform only; one rAF per scroll event at most)
  useEffect(() => {
    const el = stage.current;
    if (!el || phone) return;
    const tilt = el.querySelector<HTMLElement>(".dev-tilt")!;
    const day = el.querySelector<HTMLElement>(".dev-day")!;
    const dev = el.querySelector<HTMLElement>(".dev-phone")!;
    const shadow = el.querySelector<HTMLElement>(".dev-shadow")!;
    let raf = 0;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const render = () => {
      raf = 0;
      const p = clamp(scrollY / (innerHeight * 0.9));
      const e = ease(p);
      tilt.style.transform = `translateY(${(-e * 4).toFixed(2)}%) rotateX(${(e * 58).toFixed(2)}deg) scale(${(1 - e * 0.08).toFixed(4)})`;
      tilt.style.setProperty("--tb-fade", String(clamp(1 - p * 2.6)));
      const d = ease(clamp((p - 0.35) / 0.65));
      day.style.opacity = String(clamp((p - 0.45) / 0.4));
      day.style.transform = `translateY(${((1 - d) * 24).toFixed(1)}px)`;
      dev.style.transform = `translate(-50%, ${((1 - d) * 110).toFixed(2)}vh) rotate(${((1 - d) * -6).toFixed(2)}deg)`;
      shadow.style.opacity = String(d * 0.9);
      shadow.style.transform = `translate(-50%, 0) scale(${(0.6 + d * 0.4).toFixed(3)})`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    addEventListener("scroll", on, { passive: true });
    render();
    return () => {
      removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, [phone]);

  // phones: once, when One Day arrives
  useEffect(() => {
    const el = stage.current;
    if (!el || !phone) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    const t = el.querySelector(".dev-pday");
    if (t) io.observe(t);
    return () => io.disconnect();
  }, [phone]);

  const hero = (
    <HeroSheet
      angle={readAngle()}
      intro={q.get("intro") !== "0"}
      hold={q.has("hold") ? +q.get("hold")! : 700}
      paused={q.has("paused")}
      onCta={(i) => console.log("[hl1] cta", i)}
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
        <div className="dev-tilt">{hero}</div>
        <div className="dev-shadow" />
        <div className="dev-phone">
          <img src="/screens/phone-working.webp" alt="" />
        </div>
        <div className="dev-day" id="day">
          <div className="dev-time">6:42 AM</div>
          <p className="dev-title">The crew pulls onto the job.</p>
          <p className="dev-out">The timecard starts on the right job and cost code.</p>
          <p className="dev-note">Hand-off stub: in the page, the 3D MacBook and iPhone land here.</p>
        </div>
      </div>
    </div>
  );
}

document.documentElement.classList.toggle("is-day", q.get("intro") === "0");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Handoff />
  </StrictMode>,
);
