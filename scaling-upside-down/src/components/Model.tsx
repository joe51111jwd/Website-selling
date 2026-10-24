import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { model } from "../content";
import { Photo, Reveal } from "./ui";

/*
  "Up. Sideways. Down. Up." One big photo with a tab bar under it, like Apple's camera features.
  Two of the steps are a before and after: the wild tree is pruned into a bonsai, and the brass ring
  turns out to be a rising spiral. Tabs advance on their own until someone picks one.
*/

const ALT: Record<string, string> = {
  topo: "A pencil topographic drawing of a mountain with a red route starting up its lower slopes.",
  houses: "A tidy grid of one hundred small lit houses at dusk.",
  "bonsai-wild": "An overgrown juniper spilling out of a bonsai pot.",
  bonsai: "The same juniper pruned into a balanced bonsai with one new shoot.",
  ring: "A brass ribbon seen end-on, looking like a single ring.",
  helix: "The same brass ribbon from the side: a spiral rising out of frame.",
};

export function Model() {
  const [i, setI] = useState(0);
  const [after, setAfter] = useState(false);
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.45 });
  const step = model.steps[i];

  useEffect(() => {
    setAfter(false);
    if (step.images.length < 2 || !inView) return;
    const t = window.setTimeout(() => setAfter(true), 1500);
    return () => clearTimeout(t);
  }, [i, inView, step.images.length]);

  useEffect(() => {
    if (!auto || !inView) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % model.steps.length), 6500);
    return () => clearTimeout(t);
  }, [i, auto, inView]);

  return (
    <section className="section story model" id="model" ref={ref}>
      <Reveal className="story-head">
        <p className="eyebrow">{model.eyebrow}</p>
        <h2 className="headline">{model.headline}</h2>
      </Reveal>

      <div className="wrap-wide">
        <div className="model-media">
          {model.steps.map((s, si) =>
            s.images.map((img, ii) => {
              const on = si === i && (s.images.length === 1 || (ii === 0 ? !after : after));
              return (
                <div key={img} className={`model-img${on ? " is-on" : ""}`} aria-hidden={!on}>
                  <Photo name={img} alt={ALT[img] ?? ""} />
                </div>
              );
            }),
          )}
        </div>

        <div className="tabs" role="tablist" aria-label="The four phases">
          {model.steps.map((s, si) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={si === i}
              className={`tab${si === i ? " is-on" : ""}`}
              onClick={() => {
                setAuto(false);
                setI(si);
              }}
            >
              {s.tab}
            </button>
          ))}
        </div>
        <p className="model-caption" aria-live="polite">
          <strong>{step.lead}</strong> {step.text}
        </p>
      </div>
    </section>
  );
}
