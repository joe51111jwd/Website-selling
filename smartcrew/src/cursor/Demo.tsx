import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/hanken-grotesk";
import "../styles/tokens.css";
import "./demo.css";
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import Cursor, { useMagnetic, writeLoupeQuad } from "./Cursor";

// Test bench for the geofence cursor: every state on one page, on the light day ground and on
// the dark night ground. Dev only: mount at ?cursor-demo (see CURSOR.md), or open
// /src/cursor/dev.html on the dev server.

const BASE = import.meta.env.BASE_URL;
const DASH = `${BASE}screens/web-dashboard.webp`;
const PHONE = `${BASE}screens/phone-working.webp`;

export default function CursorDemo() {
  useEffect(() => {
    document.title = "Cursor · SmartCrew";
    document.body.style.margin = "0";
  }, []);
  return (
    <div className="cdemo">
      <Cursor />
      <Hero />
      <Night />
      <YourNumber />
      <Form />
      <Story />
      <ModeReadout />
    </div>
  );
}

function Hero() {
  const header = useRef<HTMLAnchorElement>(null);
  useMagnetic(header, 4);
  const device = useRef<HTMLDivElement>(null);

  // the loupe's screen rect, inside the device bezel (tests data-loupe-rect)
  useEffect(() => {
    const el = device.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const b = 10;
      el.setAttribute("data-loupe-rect", `${b},${b},${el.clientWidth - 2 * b},${el.clientHeight - 2 * b}`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="cdemo-hero" data-cursor-tone="light">
      <header className="cdemo-head">
        <a className="cdemo-word" href="#top">
          SmartCrew
        </a>
        <nav className="cdemo-nav">
          <a href="#night">How it works</a>
          <a href="#number">Your number</a>
          <a href="#story">Andrew</a>
        </nav>
        <a ref={header} className="cdemo-btn cdemo-btn-sm" href="#form" data-cursor="cta" data-cursor-label="Free trial">
          Get my free trial
        </a>
      </header>

      <div className="cdemo-hero-grid">
        <div className="cdemo-hero-copy">
          <p className="cdemo-kicker">For dirt work contractors with 5–100 employees</p>
          <h1 className="cdemo-h1">See what every job is making, every day.</h1>
          <p className="cdemo-sub" data-cursor="text">
            GPS fills in timecards and tags every hour to the right job. You see each job’s profit daily, in time to fix it.
          </p>
          <div className="cdemo-ctas">
            <a className="cdemo-btn" href="#form" data-cursor="cta" data-cursor-label="Clocked in · {time}">
              Get my free trial
            </a>
            <a className="cdemo-link" href="#form">
              or book a demo with Andrew
            </a>
          </div>
          <p className="cdemo-micro">Founding Member trial · starts with a 30-minute call with Andrew · no contract</p>
        </div>
        <figure className="cdemo-figure">
          <div ref={device} className="cdemo-device" data-cursor="loupe" data-loupe-src={DASH}>
            <img src={DASH} alt="SmartCrew dashboard" draggable={false} />
          </div>
          <figcaption>Loupe, flat screen · data-loupe-rect</figcaption>
        </figure>
      </div>

      <a className="cdemo-cue" href="#night">
        Watch a day at Cedar Ridge Earthworks <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}

function Night() {
  const stage = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const phoneScreen = useRef<HTMLSpanElement>(null);

  // A CSS-3D laptop screen that floats like the WebGL devices will. Each frame it writes its
  // projected corners to data-loupe-quad, exactly as the 3D stage's useFrame should.
  useEffect(() => {
    const st = stage.current;
    const el = screen.current;
    if (!st || !el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let box = { sw: 0, sh: 0, ex: 0, ey: 0, ew: 0, eh: 0 };
    const measure = () => (box = { sw: st.clientWidth, sh: st.clientHeight, ex: el.offsetLeft, ey: el.offsetTop, ew: el.offsetWidth, eh: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    let raf = 0;
    const P = 1600;
    const B = 10; // bezel
    const tick = (t: number) => {
      const s = reduced ? 0 : t / 1000;
      const tf = `rotateX(${(7 + Math.cos(s * 0.5) * 1.5).toFixed(3)}deg) rotateY(${(-24 + Math.sin(s * 0.6) * 3).toFixed(3)}deg) rotateZ(-1deg)`;
      el.style.transform = tf;
      const { sw, sh, ex, ey, ew, eh } = box;
      const persp = new DOMMatrix();
      persp.m34 = -1 / P;
      const m = new DOMMatrix()
        .translate(sw / 2, sh / 2)
        .multiply(persp)
        .translate(-sw / 2, -sh / 2)
        .translate(ex + ew / 2, ey + eh / 2)
        .multiply(new DOMMatrix(tf))
        .translate(-ew / 2, -eh / 2);
      const pts = [B, B, ew - B, B, ew - B, eh - B, B, eh - B];
      const out: number[] = [];
      for (let i = 0; i < 8; i += 2) {
        const p = m.transformPoint(new DOMPoint(pts[i], pts[i + 1], 0, 1));
        out.push(p.x / p.w, p.y / p.w);
      }
      writeLoupeQuad(st, out);
      if (!reduced) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // The phone is a second screen of the same overlay: a data-only child with its own src, in
  // px relative to the stage (the pattern for the shared WebGL canvas: one child per device).
  useEffect(() => {
    const el = phone.current;
    const data = phoneScreen.current;
    if (!el || !data) return;
    const ro = new ResizeObserver(() => {
      const b = 9;
      data.setAttribute("data-loupe-rect", `${el.offsetLeft + b},${el.offsetTop + b},${el.offsetWidth - 2 * b},${el.offsetHeight - 2 * b}`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section id="night" className="cdemo-night" data-cursor-tone="dark">
      <div className="cdemo-night-copy">
        <p className="cdemo-time">5:00 PM</p>
        <h2 className="cdemo-h2">Every job’s profit, before you leave the yard.</h2>
        <p className="cdemo-line" data-cursor="text">
          Labor, equipment and materials land on the right job as the day happens.
        </p>
        <p className="cdemo-feat">Job costing · Daily profit · Cost codes</p>
        <a className="cdemo-link cdemo-link-night" href="#form">
          Want this for your crew? Get my free trial →
        </a>
        <button className="cdemo-btn cdemo-btn-light" data-cursor="cta" data-cursor-label="Clocked in · {time}">
          Get my free trial
        </button>
        <div className="cdemo-card cdemo-card-night" data-cursor="view" data-cursor-label="Play" role="button" tabIndex={0}>
          <div className="cdemo-card-thumb">
            <img src={DASH} alt="" draggable={false} />
          </div>
          <div>
            <p className="cdemo-card-t">Andrew’s 2-minute walkthrough</p>
            <p className="cdemo-card-s">data-cursor="view" · label “Play”</p>
          </div>
        </div>
      </div>

      <div ref={stage} className="cdemo-stage" data-cursor="loupe" data-loupe-src={DASH} data-cursor-label="Live dashboard">
        <div ref={screen} className="cdemo-tilt">
          <img src={DASH} alt="SmartCrew dashboard, at an angle" draggable={false} />
        </div>
        <div ref={phone} className="cdemo-phone">
          <img src={PHONE} alt="SmartCrew crew app, clocked in" draggable={false} />
        </div>
        <span ref={phoneScreen} hidden data-loupe-src={PHONE} data-loupe-dpr="3" data-loupe-size="168" data-cursor-label="Crew app" />
        <p className="cdemo-stage-cap">Loupe, device at an angle · data-loupe-quad, updated every frame</p>
      </div>
    </section>
  );
}

function YourNumber() {
  const [crew, setCrew] = useState(16);
  const [mins, setMins] = useState(15);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const MIN = 5;
  const MAX = 100;

  const fromX = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (x - r.left) / r.width));
    setCrew(Math.round(MIN + t * (MAX - MIN)));
  };
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    fromX(e.clientX);
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => dragging.current && fromX(e.clientX);
  const up = () => (dragging.current = false);

  const yearly = Math.round((crew * mins * 250 * 35) / 60);
  const t = (crew - MIN) / (MAX - MIN);

  return (
    <section id="number" className="cdemo-number" data-cursor-tone="light">
      <h2 className="cdemo-h2 cdemo-ink">What’s loose time costing you?</h2>
      <div
        ref={track}
        className="cdemo-slider"
        role="slider"
        aria-label="People in the field"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={crew}
        tabIndex={0}
        data-cursor="drag"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setCrew((c) => Math.min(MAX, c + 1));
          if (e.key === "ArrowLeft") setCrew((c) => Math.max(MIN, c - 1));
        }}
      >
        <div className="cdemo-slider-fill" style={{ width: `${t * 100}%` }} />
        <div className="cdemo-slider-thumb" style={{ left: `${t * 100}%` }} />
      </div>
      <div className="cdemo-number-row">
        <p className="cdemo-crew">
          <b>{crew}</b> people in the field
        </p>
        <div className="cdemo-chips" role="group" aria-label="Minutes lost per person per day">
          {[5, 10, 15, 20, 30].map((m) => (
            <button key={m} className={m === mins ? "on" : ""} onClick={() => setMins(m)}>
              {m} min
            </button>
          ))}
        </div>
      </div>
      <p className="cdemo-result">
        ${yearly.toLocaleString("en-US")} <span>a year</span>
      </p>
      <p className="cdemo-formula">
        {crew} people × {mins} min a day × 250 workdays × $35 an hour
      </p>
    </section>
  );
}

function Form() {
  return (
    <section id="form" className="cdemo-form" data-cursor-tone="light">
      <div>
        <h2 className="cdemo-h2 cdemo-ink">Set up your SmartCrew</h2>
        <p className="cdemo-line cdemo-ink-2" data-cursor="text">
          Inputs, selects, textareas and iframes always keep the native cursor. So does anything inside data-cursor="hide".
        </p>
        <form className="cdemo-fields" onSubmit={(e) => e.preventDefault()}>
          <label>
            Company
            <input placeholder="Cedar Ridge Earthworks" />
          </label>
          <label>
            Crew size
            <select defaultValue="16">
              <option value="5">5–10</option>
              <option value="16">11–25</option>
              <option value="40">26–50</option>
            </select>
          </label>
          <label className="cdemo-wide">
            Anything Andrew should know?
            <textarea rows={3} placeholder="We run three crews and two lowboys…" />
          </label>
          <button className="cdemo-btn" data-cursor="cta">
            Continue
          </button>
        </form>
      </div>
      <div className="cdemo-cal" data-cursor="hide">
        <iframe
          title="Calendar stand-in"
          srcDoc={`<body style="margin:0;font:15px system-ui;background:#fff;color:#17130f;display:grid;place-items:center;height:100vh"><div style="text-align:center"><p style="margin:0 0 12px">Cal.com embed stand-in</p><button style="font:inherit;padding:10px 16px;border-radius:8px;border:1px solid #e8dfd5;background:#fbf8f4;cursor:pointer">9:30 AM</button> <button style="font:inherit;padding:10px 16px;border-radius:8px;border:1px solid #e8dfd5;background:#fbf8f4;cursor:pointer">10:00 AM</button></div></body>`}
        />
      </div>
    </section>
  );
}

function Story() {
  return (
    <section id="story" className="cdemo-story" data-cursor-tone="light">
      <div className="cdemo-story-copy" data-cursor="text">
        <h2 className="cdemo-h2 cdemo-ink">I was in a trench at thirteen.</h2>
        <p>
          My dad ran a dirt work company, and I grew up on the end of a shovel. Then I spent twenty years building software, and watched contractors fight
          apps their crews never used.
        </p>
        <p>So I built SmartCrew for my family’s company first: timecards that fill themselves, and every job’s number, every day.</p>
      </div>
      <div className="cdemo-card" data-cursor="view" role="button" tabIndex={0}>
        <div className="cdemo-card-thumb cdemo-card-thumb-tall">
          <img src={`${BASE}screens/phone-dot.webp`} alt="" draggable={false} />
        </div>
        <div>
          <p className="cdemo-card-t">6:55 AM · DOT pre-trip</p>
          <p className="cdemo-card-s">data-cursor="view"</p>
        </div>
      </div>
    </section>
  );
}

/** Small readout of what the cursor is doing, for the demo only. */
function ModeReadout() {
  const [txt, setTxt] = useState("move the mouse");
  useEffect(() => {
    let mo: MutationObserver | null = null;
    const t = setInterval(() => {
      const root = document.querySelector(".cur-root");
      if (!root || mo) return;
      const read = () => setTxt(`${root.getAttribute("data-mode")} · ${root.getAttribute("data-tone")}${root.getAttribute("data-hint") === "1" ? " · scroll hint" : ""}`);
      mo = new MutationObserver(read);
      mo.observe(root, { attributes: true, attributeFilter: ["data-mode", "data-tone", "data-hint"] });
      read();
    }, 200);
    return () => {
      clearInterval(t);
      mo?.disconnect();
    };
  }, []);
  return (
    <p className="cdemo-readout" aria-hidden="true">
      cursor: {txt}
    </p>
  );
}
