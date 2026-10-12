import { useId, useState } from "react";
import { bucketFor, money, track, type OpenSignup } from "./copy";
import { Flag } from "./ui";

const MINUTES = [5, 10, 15, 20, 30];
const RATES = [25, 35, 45, 55];

// "Run your own numbers" (OFFER.md §6): the visitor sets every input, we only multiply and show
// the working, so the figure is his. No defaults on the money inputs, no count-up, no ticker.
export function Leak({ open }: { open: OpenSignup }) {
  const [crew, setCrew] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [minOther, setMinOther] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [rateOther, setRateOther] = useState(false);
  const [days, setDays] = useState(250);
  const [officeOpen, setOfficeOpen] = useState(false);
  const [oHours, setOHours] = useState<number | null>(null);
  const [oRate, setORate] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const uid = useId();

  const poke = () => {
    if (!touched) {
      setTouched(true);
      track("calc_interact");
    }
  };
  const ready = crew != null && minutes != null && rate != null && days > 0;
  const field = ready ? crew! * (minutes! / 60) * days * rate! : 0;
  const office = officeOpen && oHours && oRate ? oHours * oRate * 52 : 0;
  const annual = field + office;

  const setC = (v: number) => {
    poke();
    setCrew(Math.max(1, Math.min(150, Math.round(v))));
  };

  return (
    <section className="f-leak" id="numbers" aria-labelledby="f-leak-h" data-sec="leak">
      <div className="f-wrap f-leak-grid">
        <div className="f-leak-copy">
          <h2 id="f-leak-h" className="f-h2">
            You’re losing margin on every job. You just don’t know it yet.
          </h2>
          <p className="f-lead">
            Time tracking in one app. Job costs in spreadsheets. Hauling logs in paper folders. Receipts in texts. Payroll re-entered into QuickBooks. By the time the numbers are clean, the
            job is already over.
          </p>
          <p className="f-leak-hint">You set every number on the card. It only does the math.</p>
        </div>

        <div className="f-card f-timecard" role="group" aria-label="Run your own numbers">
          <div className="f-timecard-head">
            <span className="f-timecard-title">Run your own numbers</span>
            <span className="f-timecard-sub">Loose time, per year</span>
          </div>

          <div className="f-timecard-body">
            <div className="f-tc-inputs">
              {/* crew */}
              <div className="f-tc-row">
                <div className="f-tc-line">
                  <label className="f-tc-label" htmlFor={`${uid}-crew`}>
                    People in the field
                  </label>
                  <div className="f-tc-crew">
                    <button type="button" className="f-step" aria-label="One fewer" onClick={() => setC((crew ?? 1) - 1)}>
                      −
                    </button>
                    <output className={`f-tc-big${crew == null ? " is-empty" : ""}`} htmlFor={`${uid}-crew`}>
                      {crew ?? "Set crew size"}
                    </output>
                    <button type="button" className="f-step" aria-label="One more" onClick={() => setC((crew ?? 0) + 1)}>
                      +
                    </button>
                  </div>
                </div>
                <input
                  id={`${uid}-crew`}
                  className={`f-range${crew == null ? " is-empty" : ""}`}
                  type="range"
                  min={1}
                  max={150}
                  value={crew ?? 1}
                  onChange={(e) => setC(+e.target.value)}
                  aria-valuetext={crew == null ? "not set" : `${crew} people`}
                />
              </div>

              {/* minutes */}
              <div className="f-tc-row">
                <span className="f-tc-label" id={`${uid}-min`}>
                  Minutes lost per person, per day
                </span>
                <span className="f-tc-hint">Think of one guy who writes 7:00 when he showed up at 7:10.</span>
                <div className="f-chips" role="radiogroup" aria-labelledby={`${uid}-min`}>
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={!minOther && minutes === m}
                      className="f-chip"
                      onClick={() => {
                        poke();
                        setMinOther(false);
                        setMinutes(m);
                      }}
                    >
                      {m}
                    </button>
                  ))}
                  {minOther ? (
                    <input
                      className="f-chip-input"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={240}
                      autoFocus
                      aria-label="Other minutes"
                      placeholder="min"
                      onChange={(e) => setMinutes(e.target.value ? Math.min(240, Math.max(1, +e.target.value)) : null)}
                    />
                  ) : (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={false}
                      className="f-chip"
                      onClick={() => {
                        poke();
                        setMinOther(true);
                        setMinutes(null);
                      }}
                    >
                      Other
                    </button>
                  )}
                </div>
              </div>

              {/* rate */}
              <div className="f-tc-row">
                <span className="f-tc-label" id={`${uid}-rate`}>
                  What an hour in the field costs you <span className="f-tc-hint">wage, taxes and insurance</span>
                </span>
                <div className="f-chips" role="radiogroup" aria-labelledby={`${uid}-rate`}>
                  {RATES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={!rateOther && rate === r}
                      className="f-chip"
                      onClick={() => {
                        poke();
                        setRateOther(false);
                        setRate(r);
                      }}
                    >
                      ${r}
                    </button>
                  ))}
                  {rateOther ? (
                    <input
                      className="f-chip-input"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={500}
                      autoFocus
                      aria-label="Other hourly cost in dollars"
                      placeholder="$/hr"
                      onChange={(e) => setRate(e.target.value ? Math.min(500, Math.max(1, +e.target.value)) : null)}
                    />
                  ) : (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={false}
                      className="f-chip"
                      onClick={() => {
                        poke();
                        setRateOther(true);
                        setRate(null);
                      }}
                    >
                      Other
                    </button>
                  )}
                </div>
              </div>

              <div className="f-tc-row f-tc-row-inline">
                <label className="f-tc-label" htmlFor={`${uid}-days`}>
                  Workdays a year
                </label>
                <input
                  id={`${uid}-days`}
                  className="f-tc-days"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={366}
                  value={days}
                  onChange={(e) => setDays(Math.max(0, Math.min(366, +e.target.value || 0)))}
                />
                <span className="f-tc-hint">edit if different</span>
                {!officeOpen && (
                  <button type="button" className="f-link f-tc-more" onClick={() => setOfficeOpen(true)}>
                    + Office time
                  </button>
                )}
              </div>

              {officeOpen && (
                <div className="f-tc-row f-tc-office">
                  <span className="f-tc-label">Office hours a week on timecards, re-entry and chasing tickets</span>
                  <div className="f-tc-office-in">
                    <input type="number" inputMode="numeric" min={0} max={80} aria-label="Office hours a week" placeholder="hrs / week" onChange={(e) => setOHours(+e.target.value || null)} />
                    <span>×</span>
                    <input type="number" inputMode="numeric" min={0} max={300} aria-label="Office hourly cost" placeholder="$ / hr" onChange={(e) => setORate(+e.target.value || null)} />
                  </div>
                </div>
              )}
            </div>

            <div className={`f-tc-total${ready ? " is-ready" : ""}`} aria-live="polite">
              <span className="f-tc-total-label">Your total</span>
              {ready ? (
                <>
                  <span className="f-tc-money">
                    {money(annual)}
                    <small> a year</small>
                  </span>
                  <span className="f-tc-week">about {money(annual / 52)} a week</span>
                  <code className="f-tc-formula">
                    {crew} people × {minutes} min × {days} days × ${rate}/hr = {money(field)}
                    {office > 0 && (
                      <>
                        <br />+ {oHours} hrs/week × ${oRate}/hr × 52 = {money(office)}
                      </>
                    )}
                  </code>
                  <p className="f-tc-says">
                    That’s what loose time costs you at the numbers you picked. SmartCrew is built to close this gap: GPS fills in the timecards and every hour goes on a cost code.
                  </p>
                </>
              ) : (
                <>
                  <span className="f-tc-money is-empty" aria-label="not set yet">
                    $<span className="f-tc-blank" />
                  </span>
                  <code className="f-tc-formula">
                    {crew ?? "__"} people × {minutes ?? "__"} min × {days} days × ${rate ?? "__"}/hr
                  </code>
                  <p className="f-tc-says">Set the three numbers. Your total shows here.</p>
                </>
              )}
              <div className="f-tc-cta" data-pair-end>
                <button
                  type="button"
                  className="f-btn f-btn-light"
                  onClick={() => {
                    if (ready) track("calc_result", { crew, minutes, rate, annual: Math.round(annual) });
                    open({ intent: "trial", source: "calc", size: crew != null ? bucketFor(crew) : undefined, calc: ready ? { crew: crew!, minutes: minutes!, rate: rate!, days, annual } : undefined });
                  }}
                >
                  Get my free trial
                </button>
                <span className="f-tc-cta-note">
                  Andrew will go over your number with you on the call.
                  <Flag />
                </span>
              </div>
            </div>
          </div>
          <p className="f-timecard-foot">Your numbers stay on this screen unless you continue.</p>
        </div>
      </div>
    </section>
  );
}
