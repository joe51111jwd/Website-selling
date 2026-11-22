"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { factorLabels, type Factor } from "@/data/sample-ideas";
import { Brick } from "./bricks";

type Step = { title: string; body: string };
export type SceneKey = "setup" | "zack" | "cora" | "paste";

const n = (i: number) => ({ "--n": i }) as CSSProperties;
const Check = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 6.5l2.4 2.4L9.5 3.6" />
  </svg>
);
const Token = ({ children, i }: { children: string; i: number }) => (
  <span className="redact" style={n(i)}>{children}</span>
);

function Scene({ which, active }: { which: SceneKey; active: boolean }) {
  const cls = `scene${active ? " active" : ""}`;
  if (which === "setup")
    return (
      <div className={cls}>
        <div className="sc-head">
          <span className="t-small"><i className="sc-dot" />Your AI agent</span>
          <span className="t-meta ink-2">Starter team</span>
        </div>
        {[62, 48, 70].map((w, i) => (
          <div className="sc-row" key={i} style={n(i)}>
            <span className="sc-check" style={n(i)}><Check /></span>
            <span className="sk" style={{ width: `${w}%` }} />
            <span className="t-meta ink-2">Ready</span>
          </div>
        ))}
        <div className="sc-progress"><i /></div>
        <p className="t-meta ink-2" style={{ marginTop: "0.75rem" }}>About half an hour</p>
      </div>
    );
  if (which === "zack")
    return (
      <div className={cls}>
        <div className="sc-head">
          <span className="t-small">Zack&rsquo;s report</span>
          <span className="t-meta ink-2">Sunday</span>
        </div>
        <p className="rep-line"><b>Play 1</b>Prep brief before each showing for <Token i={0}>[client]</Token></p>
        <p className="rep-line"><b>Play 2</b>Offer summary for <Token i={1}>[address]</Token> at <Token i={2}>[amount]</Token></p>
        <p className="rep-line"><b>Play 3</b>Morning list of who is waiting on a reply</p>
        <p className="t-meta ink-2" style={{ marginTop: "1rem" }}>Names, clients, addresses and amounts are replaced by placeholders.</p>
        <span className="scan" />
      </div>
    );
  if (which === "cora") {
    const picks: Record<number, number> = { 4: 1, 19: 2, 30: 3 };
    const f: [Factor, number][] = [["hours", 6], ["reach", 8], ["ease", 7], ["proof", 8], ["surprise", 10]];
    return (
      <div className={cls}>
        <div className="sc-head">
          <span className="t-small">The pool</span>
          <span className="t-meta ink-2">Monday, 1:00 AM</span>
        </div>
        <div className="pool">
          {Array.from({ length: 36 }, (_, i) => (
            <i key={i} data-pick={picks[i] ? "" : undefined} style={picks[i] ? ({ "--c": `var(--color-level-${picks[i]})`, "--n": picks[i] } as CSSProperties) : undefined} />
          ))}
        </div>
        <div className="bars">
          {f.map(([k, v], i) => (
            <div className="bar" key={k}>
              <span className="ink-2">{factorLabels[k]}</span>
              <span className="bar-track"><span className="bar-fill" style={{ "--c": `var(--color-f-${k})`, "--v": v, "--n": i } as CSSProperties} /></span>
              <span className="num ink-2" style={{ textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={cls}>
      <div className="mini-card">
        <p className="t-meta ink-2">Idea 1 of 3</p>
        <p className="t-small" style={{ fontWeight: 620, marginTop: "0.25rem" }}>Evening prep briefs for tomorrow&rsquo;s appointments</p>
        <span className="fake-btn"><span className="a">Copy prompt and playbook</span><span className="b">Copied</span></span>
      </div>
      <p className="bubble me" style={n(0)}>I want you to take this document, and update it so that it works for my agent system&hellip;</p>
      <p className="bubble" style={n(1)}>Done. Before I install it: which meetings count, and how much detail do you want?</p>
    </div>
  );
}

export function How({ title, steps, scenes }: { title: string; steps: Step[]; scenes: SceneKey[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // The stack grows across the steps: empty slots, then picked, then set up.
  const stackStep = scenes[active] === "paste" ? 4 : scenes[active] === "cora" ? 2 : 0;

  return (
    <section id="how" className="chapter night" data-tone="night">
      <div className="wrap">
        <h2 className="t-h2">{title}</h2>
        <div className="how-grid">
          <ol>
            {steps.map((s, i) => (
              <li key={s.title} data-i={i} ref={(el) => { refs.current[i] = el; }} className={`how-step${i === active ? " active" : ""}`}>
                <span className="how-num" aria-hidden="true">{i + 1}</span>
                <h3 className="t-h3" style={{ marginTop: "1.25rem" }}>{s.title}</h3>
                <p className="t-lead ink-2" style={{ marginTop: "0.75rem", maxWidth: "26rem" }}>{s.body}</p>
                <div className="scene-inline" aria-hidden="true"><Scene which={scenes[i]} active /></div>
              </li>
            ))}
          </ol>
          <div className="how-stage-col" aria-hidden="true">
            <div className="how-stage">
              {scenes.map((k, i) => <Scene key={k} which={k} active={i === active} />)}
              <div className="stack-rail" data-step={stackStep}>
                {[1, 2, 3].map((l, i) => <Brick key={l} level={l} style={n(i)} />)}
                <span className="t-meta ink-2 cap">{stackStep === 4 ? "Three bricks set up" : stackStep === 2 ? "Three picked for you" : "Your first three slots"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
