// The pain picker (James: "Type in your biggest pain, or select one of the pre-pains… and it'll be
// like, 'We have a feature for that.'"): six preset chips (FEATURES.pain.chips, each pointing at
// one of the ten features), and a field to type your own. A pick answers "We have a feature for that." with the feature's name and opens its card
// (and, on desktop, its screen in the app). Typed text is matched in the browser first (./match.ts),
// instantly; when that isn't sure, and the build has the server function, it goes to
// /api/match-pain (./ask.ts) for a second opinion while the answer line says "Finding it…", and
// anything wrong there falls back to the browser's guess. Nothing typed is kept. No match answers
// with Andrew's trial call and the primary button.

import { useId, useRef, useState, type FormEvent } from "react";
import { FEATURES, type FeatureId } from "../../content/features";
import { Cta } from "../ui/Cta";
import { painMatch } from "./match";
import { askOn, askPain } from "./ask";
import { featureById } from "./data";

export type Answer = { kind: "yes"; id: FeatureId; chip: boolean } | { kind: "no" } | null;

type Props = {
  answer: Answer;
  onAnswer: (a: Answer) => void;
};

const C = FEATURES.pain;

export function PainPicker({ answer, onAnswer }: Props) {
  const qid = useId();
  const fid = useId();
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  // each pick's number: a server answer that comes back after a newer pick (a chip, another try) is dropped
  const pick = useRef(0);

  const say = (a: Answer) => {
    pick.current++;
    setThinking(false);
    onAnswer(a);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const local = painMatch(t);
    const yesOrNo = (id: FeatureId | null): Answer => (id ? { kind: "yes", id, chip: false } : { kind: "no" });
    if (local.sure || !askOn) return say(yesOrNo(local.id));
    const n = ++pick.current;
    setThinking(true);
    onAnswer(null);
    const ai = await askPain(t);
    if (n !== pick.current) return;
    // the model's word when it gave one (a feature, or none fits); the browser's guess when it couldn't
    say(yesOrNo(ai === undefined ? local.id : ai));
  };

  const picked = answer?.kind === "yes" && answer.chip ? answer.id : null;

  return (
    <div className="ft-pain" data-ft-in="2">
      <p className="ft-pain-q" id={qid}>
        {C.prompt}
      </p>
      <div className="ft-pain-row">
        <div className="ft-chips" role="group" aria-labelledby={qid}>
          {C.chips.map((c) => (
            <button
              key={c.id}
              type="button"
              className="ft-chip"
              aria-pressed={picked === c.id}
              data-cursor="link"
              onClick={() => say({ kind: "yes", id: c.id, chip: true })}
            >
              {c.label}
            </button>
          ))}
        </div>
        <form className="ft-type" role="search" onSubmit={submit}>
          <label htmlFor={fid} className="sr-only">
            {C.typeLabel}
          </label>
          <input
            id={fid}
            className="ft-type-in"
            type="text"
            inputMode="text"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={80}
            placeholder={`${C.typeLabel}…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="ft-type-go" aria-label={C.submit} title={C.submit} data-cursor="link" disabled={!text.trim()}>
            <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3.5 9h10.2M9.6 4.6 14 9l-4.4 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
      <div className="ft-answer" aria-live="polite" aria-busy={thinking}>
        {thinking && (
          <p className="ft-answer-wait" key="wait">
            <span className="ft-answer-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>{C.thinking}</span>
          </p>
        )}
        {!thinking && answer?.kind === "yes" && (
          <p className="ft-answer-yes" key={`${answer.id}-${answer.chip}`}>
            <span className="ft-answer-check" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="m3.5 8.4 2.9 2.9 6.1-6.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>
              {C.yes} <strong className="ft-answer-name">{featureById(answer.id).name}.</strong>
            </span>
          </p>
        )}
        {!thinking && answer?.kind === "no" && (
          <div className="ft-answer-no" key="no">
            <p>{C.noMatch}</p>
            <Cta source="features-pain" size="md" className="ft-answer-cta" />
          </div>
        )}
      </div>
    </div>
  );
}
