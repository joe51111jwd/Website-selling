import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZackTool } from "@/components/v3/zack-tool";
import { zackAgents } from "@/data/zack";

const find = (slug: string) => {
  const a = zackAgents.find((x) => x.slug === slug);
  if (a) return { ...a, listed: true };
  return slug === "other" ? { slug: "other", name: "Another agent", listed: false } : null;
};

export function generateStaticParams() {
  return [...zackAgents.map((a) => ({ agent: a.slug })), { agent: "other" }];
}

export async function generateMetadata({ params }: { params: Promise<{ agent: string }> }): Promise<Metadata> {
  const a = find((await params).agent);
  return { title: a ? `Run Zack in ${a.listed ? a.name : "your agent"}` : "Run Zack" };
}

export default async function ZackAgentPage({ params }: { params: Promise<{ agent: string }> }) {
  const agent = find((await params).agent);
  if (!agent) notFound();
  return (
    <section className="ground page-top" data-tone="ground" style={{ paddingBottom: "clamp(5rem, 12vh, 9rem)" }}>
      <div className="wrap">
        <div style={{ maxWidth: "46rem", marginInline: "auto" }}>
          <p className="t-eyebrow ink-2">Zack the Collector</p>
          <h1 className="t-h2" style={{ marginTop: "0.75rem", marginBottom: "clamp(2.5rem, 7vh, 4rem)" }}>
            {agent.listed ? `Run Zack in ${agent.name}.` : "Run Zack in your own agent."}
          </h1>
          <ZackTool agent={agent} />
        </div>
      </div>
    </section>
  );
}
