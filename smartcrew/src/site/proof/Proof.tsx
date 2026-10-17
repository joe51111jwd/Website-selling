// 5 · Testimonials, round 4 (Andrew's Loom 2:37: "change this testimonial out" for boxes with a photo
// and a quote; he likes Katie's). Two quote cards side by side (stacked on phones), Katie's first,
// then Phil Drish's at the same size with the family disclosure ⚑ (FTC endorsement guides). Both
// quotes are verbatim from smartcrewhq.com (PROOF in content/copy.ts); Phil's figure is only set in
// bold, never restated as our claim. Initials stand in for the photos until Andrew sends them. No
// pinning, no scroll-driven motion: the cards come up once as they arrive (CSS).

import { FLAG, PROOF } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { useArrive } from "../phone/useArrive";
import "./proof.css";
import "./glass.css";

const P = PROOF.phil;
const K = PROOF.katie;

function Flag({ title = PROOF.flagTitle }: { title?: string }) {
  return (
    <span className="flag" title={title} aria-label={title}>
      {FLAG}
    </span>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

function Card({ name, company, flag, note, children }: { name: string; company: string; flag?: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="proof-card">
      <figure>
        <span className="proof-mark-open" aria-hidden="true">
          “
        </span>
        <blockquote className="proof-text" data-cursor="text">
          <p>{children}</p>
        </blockquote>
        <figcaption className="proof-by">
          <span className="proof-face" aria-hidden="true">
            {initials(name)}
          </span>
          <span className="proof-who">
            <span className="proof-name">{name}</span>
            <span className="proof-co">
              {company}
              {flag && <Flag title={flag} />}
            </span>
          </span>
        </figcaption>
        {note && <p className="proof-note">{note}</p>}
      </figure>
    </li>
  );
}

export default function Proof() {
  const [ref, arrived] = useArrive<HTMLDivElement>({ amount: 0.25 });
  return (
    <Scene id="proof" pinnedViewports={0} stage="keep" label={PROOF.label} className="proof proof4">
      <div ref={ref} className={`proof-wrap wrap${arrived ? " is-in" : ""}`}>
        <h2 className="t-h2 proof-title">{PROOF.label}</h2>
        <ul className="proof-cards">
          <Card name={K.name} company={K.company} flag={PROOF.flagKatie}>
            {K.text}
          </Card>
          <Card
            name={P.name}
            company={P.company}
            note={
              <>
                {P.disclosure}
                <Flag title={PROOF.flagDisclosure} />
              </>
            }
          >
            {P.before}{" "}
            <strong className="proof-fig">
              {P.figure.prefix}
              {P.figure.digits}
              {P.figure.suffix} {P.figureRest}
            </strong>{" "}
            {P.after}
          </Card>
        </ul>
      </div>
    </Scene>
  );
}
