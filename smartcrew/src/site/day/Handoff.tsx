// The hand-off's own pieces (desktop): the flying copy of One Day's first odometer (page space)
// and the fence that leaves the hero's words for the crew phone (a fixed layer). Both live in
// <body>, outside the hero (which clips) and outside One Day (whose stage clips). The motion is
// ./handoff.ts.

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MOMENTS } from "../../content/moments";
import { reducedMotion } from "../../three/stage/store";
import { Odometer } from "./Odometer";
import { startHandoff, type HandoffEls } from "./handoff";
import "./handoff.css";

export function HeroHandoff() {
  const time = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const t = time.current;
    const s = svg.current;
    if (!t || !s || reducedMotion) return;
    const timeP = t.querySelector<HTMLElement>(".day-time");
    const q = <T extends Element>(c: string) => s.querySelector(`.${c}`) as T;
    if (!timeP) return;
    const els: HandoffEls = {
      time: t,
      timeP,
      svg: s,
      shadow: q("ho-fence-shadow"),
      fill: q("ho-fence-fill"),
      line: q("ho-fence-line"),
      ping: q("ho-fence-ping"),
      stakes: [...s.querySelectorAll<SVGCircleElement>(".ho-stake")],
    };
    return startHandoff(els);
  }, []);
  if (reducedMotion || typeof document === "undefined") return null;
  return createPortal(
    <>
      <div className="ho-time" ref={time} aria-hidden="true">
        <Odometer value={MOMENTS[0].when} step={0} className="t-time day-time" />
      </div>
      <svg className="ho-fence" ref={svg} aria-hidden="true">
        <polygon className="ho-fence-shadow" />
        <polygon className="ho-fence-fill" />
        <polygon className="ho-fence-ping" />
        <polygon className="ho-fence-line" />
        {Array.from({ length: 6 }, (_, i) => (
          <circle key={i} className="ho-stake" r="3" />
        ))}
      </svg>
    </>,
    document.body,
  );
}
