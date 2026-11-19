import { useEffect, useRef, type CSSProperties } from "react";
import { COPY, type Phase } from "../copy";
import { track } from "../scroll";
import { Fill } from "./Problem";

const C = COPY.cycle;

// Each phase is a band in its block's colour. They stack as you scroll, like the blocks on the cover,
// and each one's word moves its own way: Up rises, Side slides across, Down sinks.
function Band({ ph, i }: { ph: Phase; i: number }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? track(ref.current, "view") : undefined), []);
  return (
    <article className={`band band-${ph.key}`} ref={ref} style={{ "--i": i } as CSSProperties} aria-labelledby={`band-${ph.key}`}>
      <header className="band-tab">
        <span className="band-n">0{i + 1}</span>
        <span className="band-kicker">{ph.kicker}</span>
        <span className="band-n">0{i + 1} / 03</span>
      </header>
      <div className="band-body">
        <div className="band-stage" aria-hidden="true">
          <span className="band-word">{ph.word}</span>
        </div>
        <div className="band-text">
          <h3 id={`band-${ph.key}`}>{ph.line}</h3>
          {ph.detail && <p>{ph.detail}</p>}
        </div>
      </div>
    </article>
  );
}

export function Cycle() {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => (end.current ? track(end.current, "pin") : undefined), []);
  return (
    <section className="cycle" id="idea" aria-labelledby="cycle-title">
      <h2 className="cycle-title" id="cycle-title">
        {C.kicker.split(" ").map((w, i, all) => (
          <span key={w}>
            {w}
            {i < all.length - 1 ? " " : ""}
          </span>
        ))}
      </h2>
      <div className="bands">
        {C.phases.map((ph, i) => (
          <Band key={ph.key} ph={ph} i={i} />
        ))}
      </div>
      <div className="once" ref={end}>
        <div className="once-stage">
          <p className="once-all">
            <Fill text={C.all} from={0.04} to={0.3} />
          </p>
          <p className="once-line">
            <Fill text={C.once} from={0.36} to={0.8} />
          </p>
        </div>
      </div>
    </section>
  );
}
