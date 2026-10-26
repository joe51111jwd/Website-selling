import { AWARDS, PRESS } from "../content";
import { Clipping, Piece, Spread, Tapes } from "../ui/collage";
import "./Press.css";

const AT = [
  { at: { x: 4, y: 16, w: 46, r: -2.5, z: 2 }, m: { x: 3, y: 9, w: 94, r: -2, z: 2 } },
  { at: { x: 56, y: 10, w: 34, r: 3, z: 3 }, m: { x: 10, y: 37, w: 84, r: 3, z: 3 } },
  { at: { x: 30, y: 56, w: 44, r: -1, z: 4 }, m: { x: 3, y: 58, w: 94, r: -1, z: 4 } },
];

/** What the critics wrote, clipped out and taped up. */
export function Press() {
  return (
    <Spread id="press" className="press" label="Press">
      <div className="press-head wrap">
        <p className="eyebrow">Word from the dining room</p>
      </div>
      {PRESS.map((q, i) => (
        <Piece key={i} at={AT[i].at} m={AT[i].m} depth={0.08 + i * 0.07} order={i} drag>
          <div className="press-pin">
            <Clipping outlet={q.outlet} when={q.when} rating={q.rating || undefined}>
              {q.text}
            </Clipping>
            <Tapes at={i === 1 ? "corners" : "top"} />
          </div>
        </Piece>
      ))}
      <Piece at={{ x: 78, y: 62, w: 16, r: -8, z: 5 }} m={{ x: 4, y: 84, w: 44, r: -8, z: 5 }} depth={0.2} order={3}>
        <Seal text={AWARDS[0]} />
      </Piece>
      <Piece at={{ x: 8, y: 74, w: 15, r: 9, z: 5 }} m={{ x: 52, y: 86, w: 42, r: 9, z: 5 }} depth={0.26} order={4}>
        <Seal text={AWARDS[1]} tone="gold" />
      </Piece>
    </Spread>
  );
}

function Seal({ text, tone = "red" }: { text: string; tone?: "red" | "gold" }) {
  return (
    <div className={`seal seal-${tone}`}>
      <span className="seal-star" aria-hidden>
        ★
      </span>
      <span className="seal-text">{text}</span>
    </div>
  );
}
