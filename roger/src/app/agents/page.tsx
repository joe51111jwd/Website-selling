import type { Metadata } from "next";
import { ClosingBand, PriceChapter, QuestionsChapter, Testimonials } from "@/components/v3/blocks";
import { ControlBlock } from "@/components/v3/control-block";
import { Hero } from "@/components/v3/hero";
import { How } from "@/components/v3/how";
import { Monday } from "@/components/v3/monday";
import { Statement } from "@/components/v3/statement";
import { agents } from "@/data/v3-copy";
import { zackAgents } from "@/data/zack";

export const metadata: Metadata = {
  title: "For people who run agents",
  description: agents.sub,
};

// The one page (with /zack) where "agent" may stand without "AI" in front.
export default function AgentsPage() {
  return (
    <>
      <Hero
        headline={agents.headline}
        sub={agents.sub}
        path="agents"
        secondary={{ href: "/zack", label: "Run Zack on yourself first", button: true }}
        loop={[
          { when: "Sunday", what: "Zack writes up your best plays" },
          { when: "Overnight", what: "Cora scores every play in the pool" },
          { when: "Monday 7:00 AM", what: "Your three plays arrive" },
        ]}
      >
        <div style={{ marginTop: "clamp(2.5rem, 7vh, 4.5rem)", paddingTop: "2rem", borderTop: "1px solid var(--color-night-rule)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.25rem 2.5rem" }}>
          <div>
            <h2 className="t-title">{agents.stripTitle}</h2>
            <p className="t-small ink-2" style={{ marginTop: "0.3rem", maxWidth: "30rem" }}>{agents.stripLine}</p>
          </div>
          <div className="agent-strip" style={{ marginLeft: "auto" }}>
            {zackAgents.map((a) => <span key={a.slug}>{a.name}</span>)}
          </div>
        </div>
      </Hero>
      <Statement lines={agents.problem} />
      <How title="How it works" steps={agents.steps} scenes={["zack", "cora", "paste"]} />
      <Monday title="What arrives on Monday" line="This is one Monday list, as it arrives. Open a play." />
      <ControlBlock />
      <Testimonials audience="agents" />
      <PriceChapter path="agents" />
      <QuestionsChapter audience="agents" />
      <ClosingBand line={agents.closing} path="agents" />
    </>
  );
}
