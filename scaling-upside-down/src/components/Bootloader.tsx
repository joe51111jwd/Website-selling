import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "motion/react";
import { bootloader } from "../content";
import { MacBook } from "./MacBook";
import { Chevron, Reveal, Rich } from "./ui";

/*
  The bootloader, presented like Apple presents its AI features: black section, huge line, then the
  thing working on a real laptop. A founder's question types itself into a chat with the file attached
  and the answer streams in with its route. Chips switch to the other sample questions.
*/

type Run = (typeof bootloader.runs)[number];
type Token = { w: string; b: boolean; p: number };

function tokens(run: Run): Token[] {
  const out: Token[] = [];
  run.a.forEach((para, p) =>
    para.forEach((seg, s) =>
      seg.split(/(?<=\s)/).forEach((w) => {
        if (w) out.push({ w, b: s % 2 === 1, p });
      }),
    ),
  );
  return out;
}

function Chat({ run, play }: { run: Run; play: boolean }) {
  const toks = useMemo(() => tokens(run), [run]);
  const [q, setQ] = useState(0);
  const [stage, setStage] = useState(0); // 0 typing, 1 route, 2 streaming, 3 done
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setQ(0);
    setStage(0);
    setShown(0);
    if (!play) return;
    const timers: number[] = [];
    let t = 500;
    for (let i = 1; i <= run.q.length; i++) {
      timers.push(window.setTimeout(() => setQ(i), t));
      t += 16 + (run.q[i - 1] === " " ? 30 : 0);
    }
    t += 450;
    timers.push(window.setTimeout(() => setStage(1), t));
    t += 650;
    timers.push(window.setTimeout(() => setStage(2), t));
    for (let i = 1; i <= toks.length; i++) {
      t += 34;
      timers.push(window.setTimeout(() => setShown(i), t));
    }
    timers.push(window.setTimeout(() => setStage(3), t + 300));
    return () => timers.forEach(clearTimeout);
  }, [run, play, toks]);

  const paras: Token[][] = [];
  toks.slice(0, shown).forEach((tk) => (paras[tk.p] ??= []).push(tk));

  return (
    <div className="chat">
      <aside className="chat-side" aria-hidden="true">
        <div className="chat-new">New chat</div>
        <p className="chat-side-label">Recent</p>
        <ul>
          <li className="on">Hiring plan</li>
          <li>Q3 pricing</li>
          <li>Ops review</li>
          <li>Offer audit</li>
        </ul>
      </aside>
      <div className="chat-main">
        <header className="chat-top">
          <span className="chat-file">
            <svg viewBox="0 0 16 20" aria-hidden="true">
              <path d="M2 1h8l4 4v14H2z" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 1v4h4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            scaling-upside-down.md
          </span>
          <span className="chat-ver">bootloader v1.0 · 47K tokens</span>
        </header>
        <div className="chat-body" aria-live="polite">
          {q > 0 ? (
            <div className="msg msg-user">
              {run.q.slice(0, q)}
              {stage === 0 ? <span className="caret" /> : null}
            </div>
          ) : null}
          {stage >= 1 ? (
            <div className="msg msg-ai">
              <p className="msg-route">Route · {run.route}</p>
              {stage === 1 ? <span className="thinking" aria-label="Thinking" /> : null}
              {paras.map((p, i) => (
                <p key={i}>{p.map((tk, j) => (tk.b ? <strong key={j}>{tk.w}</strong> : <span key={j}>{tk.w}</span>))}</p>
              ))}
              {stage === 3 ? <p className="msg-next">{run.next}</p> : null}
            </div>
          ) : null}
        </div>
        <div className="chat-input" aria-hidden="true">
          <span>Ask about your company</span>
          <span className="chat-send">
            <svg viewBox="0 0 16 16">
              <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

export function Bootloader() {
  const [i, setI] = useState(0);
  const device = useRef<HTMLDivElement>(null);
  const inView = useInView(device, { amount: 0.5 });

  return (
    <section className="section dark boot" id="bootloader">
      <Reveal className="story-head">
        <p className="eyebrow">{bootloader.eyebrow}</p>
        <h2 className="headline">{bootloader.headline}</h2>
      </Reveal>
      <Reveal className="wrap boot-lede" delay={0.1}>
        <p className="lede">
          <Rich parts={bootloader.body} />
        </p>
      </Reveal>

      <div className="boot-device" ref={device}>
        <MacBook>
          <Chat run={bootloader.runs[i]} play={inView} />
        </MacBook>
      </div>

      <div className="tabs tabs-dark" role="tablist" aria-label="Sample questions">
        {bootloader.runs.map((r, ri) => (
          <button key={r.chip} type="button" role="tab" aria-selected={ri === i} className={`tab${ri === i ? " is-on" : ""}`} onClick={() => setI(ri)}>
            {r.chip}
          </button>
        ))}
      </div>
      <p className="boot-sample">Sample answers, to show how routing works.</p>

      <div className="wrap boot-stats">
        {bootloader.stats.map((s) => (
          <div className="boot-stat" key={s.label}>
            <span className="boot-stat-label">{s.label}</span>
            <span className="boot-stat-value">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="boot-ctas">
        <a className="btn btn-blue" href="#buy">
          Get the bootloader
        </a>
        <a className="link link-dark" href="#faq">
          Read the full spec <Chevron />
        </a>
      </div>
    </section>
  );
}
