import { useEffect, useId, useRef, useState } from "react";
import { track } from "./track";
import type { OpenSignup, SizeBucket } from "./types";

// OFFER.md §6 "Run your own numbers". The visitor sets every input; we only multiply and show
// the working. No defaults that would be our claim (minutes and rate start unselected).

const MINUTES = [5, 10, 15, 20, 30];
const RATES = [25, 35, 45, 55];

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function bucketFor(n: number): SizeBucket {
  if (n <= 5) return "1–5";
  if (n <= 20) return "6–20";
  if (n <= 50) return "21–50";
  if (n <= 100) return "51–100";
  return "100+";
}

export default function Calculator({ onCta }: { onCta: OpenSignup }) {
  const uid = useId();
  const [crew, setCrew] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [minOther, setMinOther] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [rateOther, setRateOther] = useState(false);
  const [days, setDays] = useState(250);
  const touched = useRef(false);

  const touch = () => {
    if (!touched.current) {
      touched.current = true;
      track("calc_interact");
    }
  };

  const ready = crew != null && crew > 0 && minutes != null && minutes > 0 && rate != null && rate > 0 && days > 0;
  const annual = ready ? Math.round((crew! * minutes! * days * rate!) / 60) : 0;
  const weekly = Math.round(annual / 52);

  useEffect(() => {
    if (ready) track("calc_result", { crew: crew!, minutes: minutes!, rate: rate!, annual });
  }, [ready, crew, minutes, rate, annual]);

  const setCrewSafe = (n: number) => {
    touch();
    setCrew(Math.max(1, Math.min(150, Math.round(n))));
  };

  return (
    <div className="calc" aria-labelledby={`${uid}-h`}>
      <div className="calc-head">
        <h3 className="h3" id={`${uid}-h`}>
          Run your own numbers
        </h3>
        <p className="caption">Your numbers stay on this screen unless you continue.</p>
      </div>

      <div className="calc-body">
        <div className="calc-in">
          <div className="calc-row">
            <div className="calc-label-row">
              <label className="calc-label" htmlFor={`${uid}-crew`}>
                People in the field
              </label>
              <div className="stepper">
                <button type="button" className="stepper-b focusable" aria-label="One fewer" onClick={() => setCrewSafe((crew ?? 11) - 1)}>
                  −
                </button>
                <input
                  id={`${uid}-crew`}
                  className={`stepper-n tnum ${crew == null ? "is-empty" : ""}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Set"
                  value={crew ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    touch();
                    setCrew(v ? Math.min(150, Number(v)) : null);
                  }}
                />
                <button type="button" className="stepper-b focusable" aria-label="One more" onClick={() => setCrewSafe((crew ?? 9) + 1)}>
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              className={`calc-range ${crew == null ? "is-empty" : ""}`}
              min={1}
              max={150}
              value={crew ?? 1}
              aria-label="People in the field"
              style={{ ["--p" as string]: `${(((crew ?? 1) - 1) / 149) * 100}%` }}
              onChange={(e) => setCrewSafe(Number(e.target.value))}
            />
          </div>

          <fieldset className="calc-row">
            <legend className="calc-label">Minutes lost per person, per day</legend>
            <p className="calc-hint">Think of one guy who writes 7:00 when he showed up at 7:10.</p>
            <div className="calc-chips" role="radiogroup" aria-label="Minutes lost per person per day">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={!minOther && minutes === m}
                  className="chip calc-chip"
                  onClick={() => {
                    touch();
                    setMinOther(false);
                    setMinutes(m);
                  }}
                >
                  {m}
                </button>
              ))}
              {minOther ? (
                <input
                  className="calc-other tnum"
                  autoFocus
                  inputMode="numeric"
                  aria-label="Other minutes"
                  placeholder="min"
                  value={minutes ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setMinutes(v ? Math.min(240, Number(v)) : null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  role="radio"
                  aria-checked={false}
                  className="chip calc-chip"
                  onClick={() => {
                    touch();
                    setMinOther(true);
                    setMinutes(null);
                  }}
                >
                  Other
                </button>
              )}
            </div>
          </fieldset>

          <fieldset className="calc-row">
            <legend className="calc-label">Hourly cost per field employee</legend>
            <p className="calc-hint">Wage plus payroll taxes and insurance.</p>
            <div className="calc-chips" role="radiogroup" aria-label="Hourly cost per field employee">
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={!rateOther && rate === r}
                  className="chip calc-chip"
                  onClick={() => {
                    touch();
                    setRateOther(false);
                    setRate(r);
                  }}
                >
                  ${r}
                </button>
              ))}
              {rateOther ? (
                <input
                  className="calc-other tnum"
                  autoFocus
                  inputMode="numeric"
                  aria-label="Other hourly cost in dollars"
                  placeholder="$/hr"
                  value={rate ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setRate(v ? Math.min(500, Number(v)) : null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  role="radio"
                  aria-checked={false}
                  className="chip calc-chip"
                  onClick={() => {
                    touch();
                    setRateOther(true);
                    setRate(null);
                  }}
                >
                  Other
                </button>
              )}
            </div>
          </fieldset>

          <div className="calc-row calc-row-days">
            <label className="calc-label" htmlFor={`${uid}-days`}>
              Workdays a year
            </label>
            <input
              id={`${uid}-days`}
              className="calc-days tnum"
              inputMode="numeric"
              value={days || ""}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setDays(v ? Math.min(366, Number(v)) : 0);
              }}
            />
            <span className="calc-hint">edit if different</span>
          </div>
        </div>

        <div className={`calc-out ${ready ? "is-ready" : ""}`} aria-live="polite">
          <p className="calc-out-label">Loose time costs you</p>
          {ready ? (
            <>
              <p className="calc-total tnum">
                {usd(annual)}
                <span> a year</span>
              </p>
              <p className="calc-week tnum">about {usd(weekly)} a week</p>
              <p className="calc-formula tnum">
                {crew} people × {minutes} min × {days} days × ${rate}/hr
              </p>
              <p className="calc-copy">
                That’s what loose time costs you at the numbers you picked. SmartCrew is built to close this gap: GPS fills in the timecards and every hour goes on a cost code.
              </p>
            </>
          ) : (
            <>
              <p className="calc-total calc-total-empty tnum" aria-label="Not set yet">$__,___</p>
              <p className="calc-copy">Set your crew, the minutes and the hourly cost. We only multiply; the numbers are yours.</p>
            </>
          )}
          <div className="calc-cta">
            <button
              type="button"
              className="btn btn-dark"
              onClick={() =>
                onCta({
                  intent: "trial",
                  source: "calc",
                  size: crew ? bucketFor(crew) : undefined,
                  calc: ready ? { crew: crew!, minutes: minutes!, rate: rate!, days, annual } : undefined,
                })
              }
            >
              Get my free trial
            </button>
            <p className="caption">Andrew will go over your number with you on the call.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
