// 4 · Your number, PHONE MODE (BRIEF ROUND 3; scratchpad design/v2/phone/PHONE.md): one screen,
// slider + result + CTA. The headline, the crew (one canvas of hard hats, ./CrewCanvas.tsx), the
// two picks, then the visitor's own number and the orange CTA that carries it into the popup.
// Same arithmetic and honesty as the desktop (OFFER.md §6): every input is the visitor's, nothing
// is pre-selected, we only multiply and show the working. No scroll-driven JS: the empty crew
// ripples in once on arrival; everything else moves only when the visitor touches it.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CALC, FLAG } from "../../content/copy";
import { sizeFor, type SignupRequest } from "../../signup/contract";
import { trackCustom } from "../../lib/track";
import { useArrive } from "../phone/useArrive";
import { SceneCta } from "../try/SceneCta";
import { CrewCanvas } from "./CrewCanvas";
import { Odometer } from "./Odometer";
import { DAYS_DEFAULT, annualCost, money, parseDays, weekly } from "./calc";
import "./number-phone.css";

const COPY = {
  /** CALC.rateLabel / rateNote, shortened so the label stays on one line at 360 px ("per person"
   * matches the minutes label; the wage is the hourly cost itself) */
  rate: "Hourly cost per person",
  rateNote: "with taxes + insurance",
};

/** Short phones (in-app browsers with tall toolbars): a 5-row crew instead of 6, so the CTA stays on screen. */
const SHORT = "(max-height: 640px)";
function useShort() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(SHORT);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(SHORT).matches,
    () => false,
  );
}

function Pick<T extends number>({
  label,
  note,
  options,
  value,
  format,
  onPick,
}: {
  label: string;
  note?: string;
  options: readonly T[];
  value: T | null;
  format: (v: T) => string;
  onPick: (v: T) => void;
}) {
  return (
    <div className="nph-pick" role="group" aria-label={note ? `${label} (${note})` : label}>
      <p className="nph-pick-k">
        {label}
        {note && <span className="nph-pick-note"> · {note}</span>}
      </p>
      <div className="nph-chips">
        {options.map((o) => (
          <button key={o} type="button" className={`nph-chip${value === o ? " is-on" : ""}`} aria-pressed={value === o} onClick={() => onPick(o)}>
            {format(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NumberPhone() {
  const [crew, setCrew] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [daysText, setDaysText] = useState(String(DAYS_DEFAULT));
  const days = parseDays(daysText);
  const annual = annualCost({ crew, minutes, rate, days });
  const complete = annual != null;
  const [ref, arrived] = useArrive<HTMLDivElement>({ amount: 0.4 });
  const short = useShort();

  // analytics, as on the desktop: the first touch and each settled result; never the figures
  const interacted = useRef(false);
  const touch = (what: string) => {
    if (interacted.current) return;
    interacted.current = true;
    trackCustom("calc_interact", { first: what });
  };
  const results = useRef(0);
  useEffect(() => {
    if (annual == null) return;
    const t = window.setTimeout(() => trackCustom("calc_result", { n: ++results.current }), 1200);
    return () => window.clearTimeout(t);
  }, [annual]);

  const request = (): SignupRequest => ({
    intent: "trial",
    source: "calculator",
    size: crew ? sizeFor(crew) : undefined,
    estimate: complete ? { crew: crew!, minutes: minutes!, rate: rate!, days: days!, annual: Math.round(annual!) } : undefined,
  });

  const blank = <span className="nph-blank">–</span>;
  return (
    <div ref={ref} className={`nph wrap${arrived ? " is-in" : ""}${complete ? " is-done" : ""}`}>
      <h2 className="t-h2 nph-title">{CALC.title}</h2>

      <CrewCanvas
        value={crew}
        rows={short ? 5 : 6}
        arrived={arrived}
        onFirst={() => touch("crew")}
        onChange={setCrew}
      />

      <Pick
        label={CALC.minutesLabel}
        options={CALC.minutes}
        value={minutes}
        format={(m) => String(m)}
        onPick={(m) => {
          touch("minutes");
          setMinutes(m);
        }}
      />
      <Pick
        label={COPY.rate}
        note={COPY.rateNote}
        options={CALC.rates}
        value={rate}
        format={(r) => `$${r}`}
        onPick={(r) => {
          touch("rate");
          setRate(r);
        }}
      />

      <div className="nph-out" data-hides-sticky>
        <p className="nph-big">
          <Odometer value={complete ? annual : null} className="t-time nph-odo" label={CALC.year} />
          <span className="nph-per">
            <span className="nph-year">{CALC.year}</span>
            {complete && <span className="nph-week">{CALC.week(money(weekly(annual!)))}</span>}
          </span>
        </p>
        <p className="nph-formula t-num" aria-live="polite">
          {crew || minutes || rate ? (
            <>
              <span>{crew ?? blank}</span> × <span>{minutes ?? blank} min</span> ×{" "}
              <label className="nph-days">
                <input
                  type="text"
                  inputMode="numeric"
                  value={daysText}
                  size={3}
                  maxLength={3}
                  onChange={(e) => {
                    touch("days");
                    setDaysText(e.target.value.replace(/[^\d]/g, "").slice(0, 3));
                  }}
                  onBlur={() => !parseDays(daysText) && setDaysText(String(DAYS_DEFAULT))}
                  aria-label={CALC.daysLabel}
                />{" "}
                days
              </label>{" "}
              × <span>{rate ? `$${rate}` : <>${blank}</>}/hr</span>
            </>
          ) : (
            CALC.pending
          )}
        </p>
        <SceneCta request={request} size="lg" className="nph-cta" />
        <p className="t-micro nph-micro">
          {CALC.ctaMicro}
          <span className="flag" title="Andrew to confirm">
            {FLAG}
          </span>
        </p>
      </div>
    </div>
  );
}
