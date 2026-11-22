"use client";

import Link from "next/link";
import { useState } from "react";
import { control } from "@/data/v3-copy";
import { Reveal } from "./reveal";

const Tok = ({ children }: { children: string }) => <span className="tok">{children}</span>;

/** "You decide what Zack shares." The panel is a working illustration of the dashboard controls. */
export function ControlBlock() {
  const [skip, setSkip] = useState(false);
  const [block, setBlock] = useState(false);
  const [outline, setOutline] = useState(false);
  const [off, setOff] = useState(false);

  const switches = [
    { label: "Skip a whole subject: offers", on: skip, set: setSkip },
    { label: "Block a word: showing", on: block, set: setBlock },
    { label: "Share an outline only", on: outline, set: setOutline },
    { label: "Turn sharing off", on: off, set: setOff },
  ];

  return (
    <section className="chapter ground" data-tone="ground">
      <div className="wrap control-grid">
        <Reveal>
          <h2 className="t-h2">{control.title}</h2>
          <ul className="control-points">
            {control.points.map((p) => (
              <li key={p.lead} className="t-lead">
                <strong style={{ fontWeight: 620 }}>{p.lead}</strong> <span className="ink-2">{p.body}</span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: "2rem" }}>
            <Link href="/how-it-works#zack" className="link">{control.link} <span aria-hidden="true">›</span></Link>
          </p>
        </Reveal>

        <Reveal className="zack-demo" delay={0.1}>
          <div className="monday-bar">
            <span style={{ fontWeight: 620 }}>What leaves your account</span>
            <span className="t-meta ink-2" style={{ marginLeft: "auto" }}>Zack&rsquo;s weekly report</span>
          </div>
          <div className="rows" aria-live="polite">
            {off ? (
              <p className="t-lead ink-2" style={{ padding: "2.5rem 0" }}>Nothing. Sharing is off.</p>
            ) : (
              <>
                <p className="row">
                  <b>Play 1</b>
                  {outline ? "Prep brief before a meeting" : <>Prep brief before each {block ? <Tok>[blocked]</Tok> : "showing"} for <Tok>[client]</Tok></>}
                </p>
                <p className="row" data-off={skip ? "" : undefined}>
                  <b>Play 2</b>
                  {outline ? "Offer summary" : <>Offer summary for <Tok>[address]</Tok> at <Tok>[amount]</Tok></>}
                </p>
                <p className="row">
                  <b>Play 3</b>
                  {outline ? "Morning waiting list" : "Morning list of who is waiting on a reply"}
                </p>
              </>
            )}
          </div>
          <div className="switches">
            {switches.map((s) => (
              <button key={s.label} type="button" className="switch" aria-pressed={s.on} onClick={() => s.set(!s.on)}>
                <span>{s.label}</span>
                <span className="knob" aria-hidden="true" />
              </button>
            ))}
          </div>
          <p className="t-meta ink-2" style={{ padding: "0.9rem 1.5rem", borderTop: "1px solid var(--color-rule)" }}>
            An illustration. The real controls are in your dashboard.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
