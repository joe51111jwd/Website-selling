import { T, type OpenSignup } from "./copy";
import { Flag, Micro, Ph, SizeChips, TrialButton } from "./ui";
import mark from "./assets/mark.svg";

const GET = [
  "Everything in SmartCrew: the crew app and the office app.",
  "Set up with you within a few days, tailored to how you work.",
  "Your crew on it with no training.",
  "The founder on your call. No sales team. No BDR. Just Andrew.",
  "Real people on support, by phone, chat or email.",
  "No contract. Cancel anytime.",
];

export function Offer({ open }: { open: OpenSignup }) {
  return (
    <section className="f-offer" id="trial" aria-labelledby="f-offer-h" data-sec="offer">
      <div className="f-wrap f-offer-grid">
        <div className="f-offer-copy">
          <h2 id="f-offer-h" className="f-h2">
            The {T.PROGRAM}
          </h2>
          <p className="f-lead">
            For dirt work companies with <span className="f-nw">{T.SIZE} employees</span>.
          </p>

          <h3 className="f-h3">What happens when you tap the button</h3>
          <ol className="f-next">
            <li>
              <b>Tell us about your company.</b> Less than a minute.
            </li>
            <li>
              <b>Pick a time with Andrew.</b> {T.N} minutes, by phone.
              <Flag />
            </li>
            <li>
              <b>He sets up your trial around how you work.</b> Most companies are fully set up within a few days.
            </li>
          </ol>

          <div className="f-offer-cta" data-pair-end>
            <TrialButton open={open} source="offer" className="f-btn-lg" />
            <SizeChips open={open} source="offer" />
          </div>
          <Micro face={false} />
        </div>

        <div className="f-card f-workorder" aria-label="Founding Member trial, work order">
          <div className="f-wo-head">
            <img src={mark} alt="" width={22} height={26} />
            <span className="f-wo-title">Work order</span>
            <span className="f-wo-meta">{T.PROGRAM}</span>
          </div>
          <div className="f-wo-grid">
            <span className="f-wo-k">Customer</span>
            <span className="f-wo-v f-wo-blank">Your company</span>
            <span className="f-wo-k">Set up by</span>
            <span className="f-wo-v">Andrew Drish, founder</span>
          </div>

          <h3 className="f-wo-h">What you get</h3>
          <ul className="f-wo-list">
            {GET.map((g) => (
              <li key={g}>
                <span className="f-tick" aria-hidden="true" />
                {g}
              </li>
            ))}
          </ul>
          <Ph label="Placeholder for Andrew: approve, edit or drop each line" className="f-wo-ph">
            <ul className="f-wo-list f-wo-list-ph">
              <li>Founding rate, locked for as long as you stay.</li>
              <li>A money-back guarantee, with written terms.</li>
              <li>Andrew sets up each one himself, so [N] new companies a month.</li>
            </ul>
          </Ph>

          <div className="f-wo-sign">
            <span className="f-wo-k">What it takes from you</span>
            <span className="f-wo-ask">
              One <span className="f-nw">{T.N}-minute</span> call with Andrew.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
