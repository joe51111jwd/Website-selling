// 5 · Proof, PHONE MODE (BRIEF ROUND 3; scratchpad design/v2/phone/PHONE.md). One quote per
// screen, nothing else on it. Phil's screen is the number: "~$150k" set huge, rolling up like an
// odometer the first time it arrives, a survey-paint stroke wiping in under it once it lands, then
// who said it and the family disclosure ⚑. Katie's screen is her one sentence, said phrase by
// phrase as it arrives. Plain document flow, trigger-once (useArrive), transform/opacity only:
// no scroll-driven motion, no layout reads. The words are readable before anything plays.

import { FLAG, PROOF } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { useArrive } from "../phone/useArrive";
import "./proof-phone.css";

const P = PROOF.phil;
const K = PROOF.katie;

/** Phil's first sentence, verbatim ("…per YEAR in profit."): the rest of his quote stays on desktop. */
const PHIL_REST = `${P.after.split(". ")[0]}.`;
/** A quote in the phrases it is said in: its sentences, long ones split at the space nearest their
 * middle. Joined back together it is the quote verbatim (spaces kept). No lookbehind: older iOS. */
function phrases(text: string) {
  const out: string[] = [];
  for (const s of text.replace(/([!.?])\s+/g, "$1 \u0000").split("\u0000")) {
    const t = s.trimEnd();
    if (t.length < 34) {
      out.push(s);
      continue;
    }
    const mid = t.length / 2;
    let at = -1;
    for (let i = 0; i < t.length; i++) if (t[i] === " " && (at < 0 || Math.abs(i - mid) < Math.abs(at - mid))) at = i;
    if (at < 0) out.push(s);
    else out.push(s.slice(0, at), s.slice(at));
  }
  return out;
}
const KATIE_PHRASES = phrases(K.text);

/**
 * The figure's odometer, light: each reel is ONE text node of stacked digits (white-space:
 * pre-line), not a span per digit, so the screen's first render stays small. Same roll as the
 * laptop's (./Odometer.tsx): every reel turns at least once, the leftmost lands last.
 */
function Reels({ digits, on, duration = 1500 }: { digits: string; on: boolean; duration?: number }) {
  const n = digits.length;
  return (
    <span className="odo" aria-hidden="true">
      {digits.split("").map((ch, i) => {
        const turns = i + 1;
        const target = on ? 10 * turns + Number(ch) : 0;
        const cells = Array.from({ length: 10 * turns + 10 }, (_, k) => k % 10).join("\n");
        return (
          <span className="odo-col" key={i}>
            <span
              className="odo-reel prfp-reel"
              style={{ ["--odo-y" as string]: String(-target), transitionDuration: `${duration}ms`, transitionDelay: on ? `${(n - 1 - i) * 70}ms` : "0ms" }}
            >
              {cells}
            </span>
            <span className="odo-size">{ch}</span>
          </span>
        );
      })}
    </span>
  );
}

function Flag({ title }: { title: string }) {
  return (
    <span className="flag" title={title} aria-label={title}>
      {FLAG}
    </span>
  );
}

function Phil() {
  // ≥ 45 % on screen: the figure is well up from the bottom edge when it starts to roll
  const [ref, on] = useArrive<HTMLElement>({ amount: 0.45 });
  const said = `${P.before} ${P.figure.prefix}${P.figure.digits}${P.figure.suffix} ${P.figureRest} ${PHIL_REST}`;
  return (
    <figure ref={ref} className={`prfp-q prfp-phil${on ? " is-on" : ""}`}>
      <blockquote className="prfp-quote">
        <p>
          <span className="sr-only">{`“${said}”`}</span>
          <span className="prfp-lead" aria-hidden="true">
            “{P.before}
          </span>
          <span className="prfp-num t-time" aria-hidden="true">
            {P.figure.prefix}
            <Reels digits={P.figure.digits} on={on} />
            {P.figure.suffix}
            {/* survey paint under the figure: a wipe (two counter-moving transforms), once it lands */}
            <span className="prfp-mark">
              <svg viewBox="0 0 400 16" preserveAspectRatio="none">
                <path d="M4 10.5C60 7.2 122 6.4 192 7.6c66 1.2 134 2.2 204-1.6" />
              </svg>
            </span>
          </span>
          <span className="prfp-per" aria-hidden="true">
            {P.figureRest} {PHIL_REST}”
          </span>
        </p>
      </blockquote>
      <figcaption className="prfp-cite">
        <span className="prfp-who">
          <b>{P.name}</b> · {P.company}
        </span>
        <span className="prfp-disclose">
          {P.disclosure}
          <Flag title={PROOF.flagDisclosure} />
        </span>
      </figcaption>
    </figure>
  );
}

function Katie() {
  const [ref, on] = useArrive<HTMLElement>({ amount: 0.6 });
  return (
    <figure ref={ref} className={`prfp-q prfp-katie${on ? " is-on" : ""}`}>
      <blockquote className="prfp-quote">
        <p className="prfp-katie-text">
          <span className="prfp-open" aria-hidden="true">
            “
          </span>
          {KATIE_PHRASES.map((s, i) => (
            <span key={i} className="prfp-said" style={{ ["--i" as string]: i }}>
              {s}
              {i === KATIE_PHRASES.length - 1 ? "”" : ""}
            </span>
          ))}
        </p>
      </blockquote>
      <figcaption className="prfp-cite">
        <span className="prfp-who">
          <b>{K.name}</b> · {K.company}
          <Flag title={PROOF.flagKatie} />
        </span>
      </figcaption>
    </figure>
  );
}

export default function ProofPhone() {
  return (
    <Scene id="proof" pinnedViewports={0} stage="keep" label={PROOF.label} className="proof proof--phone">
      <Phil />
      <Katie />
    </Scene>
  );
}
