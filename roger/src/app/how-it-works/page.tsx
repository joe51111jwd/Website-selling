import type { Metadata } from "next";
import Link from "next/link";
import { ClosingBand } from "@/components/v3/blocks";
import { Brick } from "@/components/v3/bricks";
import { FactorBars, PasteBlock, Playbook } from "@/components/v3/idea-card";
import { siteConfig } from "@/data/config";
import { sampleIdeas } from "@/data/sample-ideas";
import { home } from "@/data/v3-copy";
import { zackAgents, zackFile, zackVersion } from "@/data/zack";

export const metadata: Metadata = {
  title: "How it works",
  description: "The week, Zack and Cora in detail, the anatomy of an idea, and your first two weeks.",
};

const week = [
  {
    day: "Sunday",
    bricks: 0,
    text: "Zack runs on his own inside your AI agent account. He reviews your past seven days and writes up the work that was most useful, with private details replaced by placeholders. His report is due by 11:59 PM, Toronto time. You do nothing.",
  },
  {
    day: "Monday",
    bricks: 1,
    text: "At 1:00 AM Cora reads what worked for everyone and picks your three ideas. At 7:00 AM your list arrives. Open the ideas you want, press copy, and paste each one into your AI agent.",
  },
  {
    day: "Tuesday",
    bricks: 1,
    text: "Your AI agent runs what you set up. If an idea needs adjusting, tell your AI agent. It wrote its own version of the playbook, so it can change it.",
  },
  {
    day: "Wednesday",
    bricks: 1,
    text: siteConfig.flags.statsEmail
      ? "At 9:00 AM a short email shows where your stack stands. Nothing to do."
      : "Nothing to do. Your AI agents keep working, and each idea you set up stays set up.",
  },
];

const trial = [
  { when: "Today", what: "You sign up and add a card. Nothing is charged." },
  { when: "Your first Monday", what: "Zack has reviewed your week. Your first list of three ideas arrives. It is free." },
  { when: "Your second Monday", what: "Your second list arrives. It is free. We email you with what happens next." },
  {
    when: "Your third Monday",
    what: "On monthly, your card is charged with your third list and not before. On one at a time, it is charged only when you order a list. Cancel in one click before then and you pay nothing.",
  },
];

export default function HowItWorksPage() {
  const idea = sampleIdeas[0];
  return (
    <>
      <section className="ground page-top" data-tone="ground" style={{ paddingBottom: "clamp(5rem, 12vh, 9rem)" }}>
        <div className="wrap">
          <div className="narrow prose" style={{ marginInline: "auto", maxWidth: "44rem" }}>
            <h1 className="t-display">How it works</h1>
            <p className="t-lead ink-2" style={{ marginTop: "1.5rem" }}>
              One loop, every week. Zack writes up what worked for you. Cora sends you what worked for everyone else.
            </p>

            <h2 id="week">The week</h2>
            <div style={{ marginTop: "1.5rem" }}>
              {week.map((d) => (
                <div className="day-row" key={d.day}>
                  <div>
                    <p className="t-title" style={{ marginTop: 0 }}>{d.day}</p>
                    <div aria-hidden="true" style={{ marginTop: "0.6rem", display: "flex", gap: 4 }}>{[1, 2, 3].map((l) => <Brick key={l} level={l} empty={!d.bricks} style={{ width: 16 }} />)}</div>
                  </div>
                  <p style={{ marginTop: 0 }}>{d.text}</p>
                </div>
              ))}
            </div>

            <h2 id="zack">Zack, in detail</h2>
            <h3>What he reads</h3>
            <p>Only your own activity inside your AI agent account, from the past seven days.</p>
            <h3>What he never reads</h3>
            <p>Your email, your calendar and your files.</p>
            <h3>What he removes</h3>
            <p>Names, clients, addresses, amounts and other private details. Each one is replaced by a placeholder such as <span className="tok">[client]</span> or <span className="tok">[address]</span> before the report leaves your account.</p>
            <h3>What you can change</h3>
            <p>Your dashboard shows the exact instructions your Zack runs. You can tell him to skip whole subjects, block specific words and names, share an outline only, or follow rules you write yourself. You can turn sharing off, and you can delete any weekly report.</p>
            <h3>Read him before you sign up</h3>
            <p>The Zack files are public. Version {zackVersion}:</p>
            <ul>
              {zackAgents.map((a) => (
                <li key={a.slug}><a className="link" href={zackFile(a.slug)}>Zack the Collector for {a.name}</a></li>
              ))}
            </ul>

            <h2 id="cora">Cora, in detail</h2>
            <p>Cora scores every play on five things, each out of ten.</p>
            <div className="card" style={{ marginTop: "1.5rem" }}><FactorBars factors={idea.factors} /></div>
            <p>Then she matches plays to the kind of work your own week shows. She never sends you something you already run, and she never names who a play came from.</p>

            <h2 id="idea">The anatomy of an idea</h2>
            <p>Every idea arrives as a playbook in the same nine parts. This is a sample, with private details removed.</p>
            <p className="t-eyebrow ink-2" style={{ marginTop: "2rem" }}>Added to the top of every playbook</p>
            <blockquote className="card" style={{ marginTop: "0.75rem" }}>{siteConfig.v3.playbookPreface}</blockquote>
            <h3>{idea.title}</h3>
            <div style={{ marginTop: "1rem" }}><Playbook idea={idea} notes /></div>
            <div style={{ marginTop: "1rem" }}><PasteBlock idea={idea} /></div>
            <p className="t-meta ink-2">Paste to install: the one instruction that tells your AI agent to save the play and schedule it.</p>

            <h2 id="trial">Your first two weeks</h2>
            <div style={{ marginTop: "1.5rem" }}>
              {trial.map((t) => (
                <div className="day-row" key={t.when}>
                  <p className="t-title" style={{ marginTop: 0 }}>{t.when}</p>
                  <p style={{ marginTop: 0 }}>{t.what}</p>
                </div>
              ))}
            </div>

            <h2 id="no-agent">If you have no AI agent yet</h2>
            <p>The startup page walks you through installing one and setting up a starter team for real estate. Most people finish in about half an hour.</p>
            <p><Link className="link" href="/getstarted">Get started <span aria-hidden="true">›</span></Link></p>
          </div>
        </div>
      </section>
      <ClosingBand line={home.closing} />
    </>
  );
}
