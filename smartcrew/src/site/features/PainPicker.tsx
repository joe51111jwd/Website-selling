// The pain picker (James: "Type in your biggest pain, or select one of the pre-pains… and it'll be
// like, 'We have a feature for that.'"): six preset chips, one per feature, and a field to type
// your own. A pick answers "We have a feature for that." with the feature's name and opens its card
// (and, on desktop, its screen in the app). Typed text is matched in the browser (./match.ts) and
// never sent or kept; no match answers with Andrew's trial call and the primary button.

import { useId, useState, type FormEvent } from "react";
import { FEATURES, type FeatureId } from "../../content/features";
import { Cta } from "../ui/Cta";
import { matchPain } from "./match";
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

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const id = matchPain(t);
    onAnswer(id ? { kind: "yes", id, chip: false } : { kind: "no" });
  };

  const picked = answer?.kind === "yes" && answer.chip ? answer.id : null;

  return (
    <div className="ft-pain" data-ft-in="2">
      <p className="ft-pain-q" id={qid}>
        {C.prompt}
      </p>
      <div className="ft-pain-row">
        <div className="ft-chips" role="group" aria-labelledby={qid}>
          {FEATURES.cards.map((c) => (
            <button
              key={c.id}
              type="button"
              className="ft-chip"
              aria-pressed={picked === c.id}
              data-cursor="link"
              onClick={() => onAnswer({ kind: "yes", id: c.id, chip: true })}
            >
              {c.pain}
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
      <div className="ft-answer" aria-live="polite">
        {answer?.kind === "yes" && (
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
        {answer?.kind === "no" && (
          <div className="ft-answer-no" key="no">
            <p>{C.noMatch}</p>
            <Cta source="features-pain" size="md" className="ft-answer-cta" />
          </div>
        )}
      </div>
    </div>
  );
}
