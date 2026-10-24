import { problem } from "../content";
import { Reveal, Rich, ScaleMedia } from "./ui";

/** The scaling trap, told like an Apple product story: eyebrow, huge line, a photo that grows, then copy and callouts. */
export function Problem() {
  return (
    <section className="section story" id="overview">
      <Reveal className="story-head">
        <p className="eyebrow">{problem.eyebrow}</p>
        <h2 className="headline">{problem.headline}</h2>
      </Reveal>

      <ScaleMedia
        name="pyramid"
        alt="A huge stepped stone pyramid balanced upside down on one narrow pillar in the desert, a tiny figure at its base."
        position="50% 60%"
      />

      <div className="wrap story-copy">
        <Reveal className="story-body">
          {problem.body.map((p, i) => (
            <p key={i}>
              <Rich parts={p} />
            </p>
          ))}
        </Reveal>
        <Reveal className="callouts" delay={0.1}>
          {problem.callouts.map((c) => (
            <div className="callout" key={c.big}>
              <span className="callout-big">{c.big}</span>
              <span className="callout-small">{c.small}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
