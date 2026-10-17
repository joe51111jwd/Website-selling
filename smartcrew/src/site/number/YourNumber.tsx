// 4 · Your number (BRIEF §4, beat 5; OFFER.md §6): "What's loose time costing you?"
// A number is there at once (round 4, James): a preset crew, minutes and hourly cost (./calc.ts
// PRESET). The visitor drags their crew size (the crew fills in as tiny hard-hat marks), picks the
// minutes lost per person a day and the hourly cost, and their own number rolls up with the working
// shown. We only multiply; we never claim SmartCrew saves it. The CTA carries the number into the
// popup once it is theirs (they changed something).
// The scroll moment is the "hour meter" (scratchpad design/v2/scroll/SCROLL_SHOTS.md §2): as the
// crew comes into view the empty slots ripple in and the meter keys on (every wheel turns once);
// at 1.4 s the knob nudges once; when his inputs settle (250 ms after the last change) the wheels
// roll to his number, and "a year" and the weekly line come up 200 ms after the last one lands.

import { useEffect, useRef, useState } from "react";
import { CALC, FLAG } from "../../content/copy";
import { sizeFor, type SignupRequest } from "../../signup/contract";
import { trackCustom } from "../../lib/track";
import { Scene } from "../scene/Scene";
import { exitKeys } from "../../three/stage";
import { SceneCta } from "../try/SceneCta";
import { CrewSlider } from "./CrewSlider";
import { Odometer } from "./Odometer";
import { DAYS_DEFAULT, PRESET, annualCost, money, parseDays, weekly } from "./calc";
import { useSettled } from "./settle";
import { usePhoneLite } from "../phone";
import NumberPhone from "./NumberPhone";
import "./number.css";
import "./glass.css";

function Chips<T extends number>({
  label,
  note,
  after,
  options,
  value,
  format,
  onPick,
  name,
}: {
  label: string;
  note?: string;
  after?: string;
  options: T[];
  value: T | null;
  format: (v: T) => string;
  onPick: (v: T) => void;
  name: string;
}) {
  return (
    <div className="num-pick" role="group" aria-label={label}>
      <p className="num-pick-k">
        {label}
        {note && <span className="num-pick-note">{note}</span>}
      </p>
      <div className="num-chips">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`num-chip${value === o ? " is-on" : ""}`}
            aria-pressed={value === o}
            onClick={() => onPick(o)}
            data-name={name}
          >
            {format(o)}
          </button>
        ))}
        {after && <p className="t-micro num-hint">{after}</p>}
      </div>
    </div>
  );
}

function Calculator() {
  const [crew, setCrew] = useState<number | null>(PRESET.crew);
  const [minutes, setMinutes] = useState<number | null>(PRESET.minutes);
  const [rate, setRate] = useState<number | null>(PRESET.rate);
  const [daysText, setDaysText] = useState(String(DAYS_DEFAULT));
  const days = parseDays(daysText);
  const annual = annualCost({ crew, minutes, rate, days });
  const complete = annual != null;
  // the meter: keyed on as the crew arrives; it rolls once the inputs have settled, and the result's
  // words come up once it has landed
  const [arrived, setArrived] = useState(false);
  const [dragging, setDragging] = useState(false);
  const shown = useSettled(annual, dragging);
  const [landed, setLanded] = useState<number | null>(null);
  useEffect(() => {
    if (shown == null) setLanded(null);
  }, [shown]);

  // analytics: the first touch, and each time a complete result settles. The figures themselves
  // are not sent: the page promises "your numbers stay on this screen unless you continue" (they
  // travel with the lead, via the CTA, only when the visitor continues).
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

  // the presets are ours: the number goes with the lead only once the visitor has made it theirs
  const request = (): SignupRequest => ({
    intent: "trial",
    source: "calculator",
    size: interacted.current && crew ? sizeFor(crew) : undefined,
    estimate: interacted.current && complete ? { crew: crew!, minutes: minutes!, rate: rate!, days: days!, annual: Math.round(annual!) } : undefined,
  });

  const blank = <span className="num-blank">–</span>;
  return (
    <div className="num-grid-wrap wrap">
      <h2 className="t-h2 num-title">{CALC.title}</h2>

      <div className="num-in">
        <CrewSlider value={crew} onChange={setCrew} onFirst={() => touch("crew")} onArrive={() => setArrived(true)} onDrag={setDragging} />
        <Chips
          name="minutes"
          label={CALC.minutesLabel}
          options={CALC.minutes}
          value={minutes}
          after={CALC.hint}
          format={(m) => String(m)}
          onPick={(m) => {
            touch("minutes");
            setMinutes(m);
          }}
        />
        <Chips
          name="rate"
          label={CALC.rateLabel}
          note={CALC.rateNote}
          options={CALC.rates}
          value={rate}
          format={(r) => `$${r}`}
          onPick={(r) => {
            touch("rate");
            setRate(r);
          }}
        />
      </div>

      <div className={`num-out${landed != null ? " is-on" : ""}`} data-hides-sticky>
        <p className="num-big">
          <Odometer value={shown} keyOn={arrived} className="t-time num-odo" label={CALC.year} onLand={(v) => setLanded(v)} />
          <span className="num-year">{CALC.year}</span>
        </p>
        <p className="num-week" aria-live="polite">
          {landed != null ? CALC.week(money(weekly(landed))) : CALC.pending}
        </p>
        <p className="num-formula t-num">
          <span>{crew ?? blank} people</span> <span aria-hidden="true">×</span> <span>{minutes ?? blank} min</span>{" "}
          <span aria-hidden="true">×</span>{" "}
          <label className="num-days">
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
              title={CALC.daysLabel}
            />{" "}
            workdays
          </label>{" "}
          <span aria-hidden="true">×</span> <span>{rate ? `$${rate}` : <>${blank}</>}/hr</span>
          {complete && (
            <>
              {" "}
              <span aria-hidden="true">=</span> <strong>{money(annual!)}</strong>
            </>
          )}
        </p>
        <p className="num-framing" data-cursor="text">
          {CALC.framing} <span className="num-built">{CALC.built}</span>
        </p>
        <div className="num-cta">
          <SceneCta request={request} />
          <p className="t-micro num-micro">
            {CALC.ctaMicro}
            <span className="flag" title="Andrew to confirm">
              {FLAG}
            </span>{" "}
            <span className="num-privacy">{CALC.privacy}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/** No devices here: Try it glided the phone out past the right edge; they stay out (never a shrink). */
const NUMBER_POSES = exitKeys({ hold: true, side: 1, start: 0 });

export default function YourNumber() {
  // phones: the light 2D build (one screen, the crew on one canvas; no Stage keys)
  if (usePhoneLite())
    return (
      <Scene id="number" pinnedViewports={1} stage="keep" label="Your number" className="num num--phone">
        <NumberPhone />
      </Scene>
    );
  return (
    // desktop: natural height, tight to the calculator (no empty band); phones keep one full
    // screen (slider, result and CTA in one view), set in number.css
    <Scene id="number" pinnedViewports={0} poses={NUMBER_POSES} label="Your number" className="num">
      <Calculator />
    </Scene>
  );
}
