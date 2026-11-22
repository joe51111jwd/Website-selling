import { sampleIdeas, sampleWeek, type Idea } from "@/data/sample-ideas";
import { Brick } from "./bricks";
import { IdeaCard } from "./idea-card";
import { Reveal } from "./reveal";

/**
 * The sample idea block. On the live site this reads the play chosen in the admin and is
 * absent until one is chosen (spec A.4): pass `ideas={[]}` and nothing renders.
 */
export function Monday({ title, line, ideas = sampleIdeas }: { title: string; line: string; ideas?: Idea[] }) {
  if (!ideas.length) return null;
  return (
    <section className="chapter ground" data-tone="ground">
      <div className="wrap">
        <Reveal className="center-head">
          <h2 className="t-h2">{title}</h2>
          <p className="t-lead ink-2" style={{ marginTop: "1rem" }}>{line}</p>
        </Reveal>
        <Reveal className="monday-frame" delay={0.1}>
          <div className="monday-bar">
            <span aria-hidden="true" style={{ display: "flex", gap: 4 }}>{[1, 2, 3].map((l) => <Brick key={l} level={l} style={{ width: 16 }} />)}</span>
            <span style={{ fontWeight: 620 }}>{sampleWeek}</span>
            <span className="t-meta ink-2" style={{ marginLeft: "auto" }}>Your three ideas</span>
          </div>
          <div className="monday-list">
            {ideas.map((idea, i) => <IdeaCard key={idea.id} idea={idea} index={i} />)}
          </div>
        </Reveal>
        <p className="t-meta ink-2" style={{ marginTop: "1.25rem", textAlign: "center" }}>
          A sample list with private details removed. Time figures are estimates from other users&rsquo; runs.
        </p>
      </div>
    </section>
  );
}
