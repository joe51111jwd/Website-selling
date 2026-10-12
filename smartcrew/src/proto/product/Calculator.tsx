import { useEffect, useId, useRef, useState } from "react";
import { SIZES, type OpenSignup, type Size } from "./data";
import { track } from "./track";

// "Run your own numbers" (OFFER §6, PLAYBOOK S3). The visitor sets every input; the page only
// multiplies and shows the working, so the figure is his, not our claim. No defaults for the
// two judgement inputs, no count-up, no "SmartCrew saves you $X".

const MINUTES = [5, 10, 15, 20, 30];
const RATES = [25, 35, 45, 55];
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function bucket(n: number): Size {
  if (n <= 5) return SIZES[0];
  if (n <= 20) return SIZES[1];
  if (n <= 50) return SIZES[2];
  if (n <= 100) return SIZES[3];
  return SIZES[4];
}

export default function Calculator({ openSignup }: { openSignup: OpenSignup }) {
  const uid = useId();
  const [crew, setCrew] = useState<number | null>(null);
  const [min, setMin] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [days, setDays] = useState(250);
  const [otherMin, setOtherMin] = useState(false);
  const [otherRate, setOtherRate] = useState(false);
  const touched = useRef(false);

  const ready = crew != null && crew > 0 && min != null && min > 0 && rate != null && rate > 0;
  const annual = ready ? Math.round((crew! * min! * days * rate!) / 60) : 0;
  const weekly = Math.round(annual / 52);

  const touch = () => {
    if (!touched.current) {
      touched.current = true;
      track("calc_interact");
    }
  };
  useEffect(() => {
    if (ready) track("calc_result", { crew, minutes: min, rate, annual });
  }, [ready, crew, min, rate, annual]);

  const pct = crew == null ? 0 : ((crew - 1) / 149) * 100;

  return (
    <div className="pc-card">
      <div className="pc-head">
        <span className="pc-head-t">Run your own numbers</span>
        <span className="pc-head-s">Your numbers stay on this screen unless you continue.</span>
      </div>

      <div className="pc-row pc-row-crew">
        <label className="pc-k" htmlFor={`${uid}-crew`}>
          People in the field
          <span className="pc-hint">{crew == null ? "Set your crew size." : "Drag, or tap − and +."}</span>
        </label>
        <div className="pc-crew">
          <button type="button" className="pc-step" aria-label="One fewer" onClick={() => (touch(), setCrew((c) => Math.max(1, (c ?? 2) - 1)))}>
            −
          </button>
          <output className={`pc-crew-n${crew == null ? " is-empty" : ""}`} htmlFor={`${uid}-crew`}>
            {crew ?? "–"}
          </output>
          <button type="button" className="pc-step" aria-label="One more" onClick={() => (touch(), setCrew((c) => Math.min(150, (c ?? 0) + 1)))}>
            +
          </button>
          <input
            id={`${uid}-crew`}
            className="pc-range"
            type="range"
            min={1}
            max={150}
            value={crew ?? 1}
            style={{ ["--p" as string]: `${pct}%` }}
            onChange={(e) => (touch(), setCrew(+e.target.value))}
            aria-valuetext={crew == null ? "Not set" : `${crew} people`}
          />
        </div>
      </div>

      <div className="pc-row">
        <div className="pc-k" id={`${uid}-min`}>
          Minutes lost per person, per day
          <span className="pc-hint">Think of one guy who writes 7:00 when he showed up at 7:10.</span>
        </div>
        <div className="pc-chips" role="radiogroup" aria-labelledby={`${uid}-min`}>
          {MINUTES.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={!otherMin && min === m} className={`pc-chip${!otherMin && min === m ? " is-on" : ""}`} onClick={() => (touch(), setOtherMin(false), setMin(m))}>
              {m}
            </button>
          ))}
          {otherMin ? (
            <input className="pc-other" type="number" inputMode="numeric" min={1} max={240} autoFocus aria-label="Other minutes" placeholder="min" value={min ?? ""} onChange={(e) => setMin(e.target.value ? +e.target.value : null)} />
          ) : (
            <button type="button" className="pc-chip" onClick={() => (touch(), setOtherMin(true), setMin(null))}>
              Other
            </button>
          )}
        </div>
      </div>

      <div className="pc-row">
        <div className="pc-k" id={`${uid}-rate`}>
          Hourly cost per field employee
          <span className="pc-hint">Wage plus taxes and insurance.</span>
        </div>
        <div className="pc-chips" role="radiogroup" aria-labelledby={`${uid}-rate`}>
          {RATES.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={!otherRate && rate === r} className={`pc-chip${!otherRate && rate === r ? " is-on" : ""}`} onClick={() => (touch(), setOtherRate(false), setRate(r))}>
              ${r}
            </button>
          ))}
          {otherRate ? (
            <input className="pc-other" type="number" inputMode="decimal" min={1} max={300} autoFocus aria-label="Other hourly cost" placeholder="$/hr" value={rate ?? ""} onChange={(e) => setRate(e.target.value ? +e.target.value : null)} />
          ) : (
            <button type="button" className="pc-chip" onClick={() => (touch(), setOtherRate(true), setRate(null))}>
              Other
            </button>
          )}
        </div>
      </div>

      <div className="pc-total" aria-live="polite">
        {ready ? (
          <>
            <div className="pc-sum">
              <span className="pc-sum-n">{usd(annual)}</span>
              <span className="pc-sum-u">a year</span>
              <span className="pc-sum-w">about {usd(weekly)} a week</span>
            </div>
            <p className="pc-formula">
              {crew} people × {min} min × <input className="pc-days" type="number" min={1} max={365} value={days} aria-label="Workdays per year" onChange={(e) => setDays(Math.max(1, Math.min(365, +e.target.value || 250)))} /> days × ${rate}/hr = {usd(annual)}
            </p>
            <p className="pc-after">That’s what loose time costs you at the numbers you picked. SmartCrew is built to close this gap: GPS fills in the timecards and every hour goes on a cost code.</p>
          </>
        ) : (
          <p className="pc-wait">Set your crew, the minutes and the hourly cost. Your number shows here, with the math.</p>
        )}
      </div>

      <div className="pc-foot">
        <button
          type="button"
          className="pp-btn pp-btn-dark"
          onClick={() =>
            openSignup({
              intent: "trial",
              source: "calc",
              size: crew ? bucket(crew) : undefined,
              calc: ready ? { calc_crew: crew!, calc_minutes: min!, calc_rate: rate!, calc_annual: annual } : undefined,
            })
          }
        >
          Get my free trial
        </button>
        <p className="pc-foot-t">
          <span className="pp-ph-box pp-ph-inline-box">
            <span className="pp-ph">Placeholder for Andrew</span>Andrew will go over your number with you on the call.
          </span>
        </p>
      </div>
    </div>
  );
}
