"use client";

import { prices, type Currency, type StartPath } from "@/data/config";
import { cardLine, ctaLong, trialLine } from "@/data/v3-copy";
import { useCurrency } from "./currency";
import { StartLink } from "./start-link";

export function CurrencyToggle() {
  const { cur, setCur } = useCurrency();
  return (
    <div className="cur-toggle" role="group" aria-label="Currency">
      {(["USD", "CAD"] as Currency[]).map((c) => (
        <button key={c} type="button" aria-pressed={cur === c} onClick={() => setCur(c)}>{c}</button>
      ))}
    </div>
  );
}

/** Two ways to buy, side by side. Monthly is the marked choice and the larger of the two.
    The currency code always follows the amount; a bare "$" never appears. */
export function PriceBlock({ path, heading = "Two free Monday lists. Then pick how you pay.", as: H = "h2" }: { path?: StartPath; heading?: string; as?: "h1" | "h2" }) {
  const { cur } = useCurrency();
  const p = prices(cur);
  return (
    <div className="wrap" style={{ textAlign: "center" }}>
      <H className="t-h2" style={{ maxWidth: "44rem", marginInline: "auto" }}>{heading}</H>
      <div style={{ marginTop: "2rem" }}><CurrencyToggle /></div>
      <div className="plans" style={{ maxWidth: "58rem", marginInline: "auto" }}>
        <div className="plan pick">
          <span className="tag">Most people choose this</span>
          <h3 className="t-title">Monthly</h3>
          <p className="amount"><span className="n">{p.symbol}{p.monthly}</span><span className="per">/ month {p.code}</span></p>
          <p className="ink-2">Three ideas every Monday.</p>
        </div>
        <div className="plan">
          <h3 className="t-title" style={{ marginTop: "auto" }}>One list at a time</h3>
          <p className="amount"><span className="n">{p.symbol}{p.list}</span><span className="per">/ list {p.code}</span></p>
          <p className="ink-2">Order a list for any Monday you want one.</p>
        </div>
      </div>
      <p className="t-small" style={{ maxWidth: "40rem", margin: "1.75rem auto 0" }}>{trialLine}</p>
      <p className="t-meta ink-2" style={{ marginTop: "0.6rem" }}>Prices shown before tax, {p.tax}.</p>
      <div style={{ marginTop: "2.25rem" }}><StartLink path={path}>{ctaLong}</StartLink></div>
      <p className="t-meta ink-2" style={{ marginTop: "0.9rem" }}>{cardLine}</p>
    </div>
  );
}
