import { T } from "./copy";
import logo from "./assets/logo.svg";

// The plan-sheet title block, used once (AISMELL V14 place b), and the Notes block (Mercury pattern).
export function Footer() {
  return (
    <footer className="f-footer" data-sec="footer">
      <div className="f-wrap">
        <div className="f-titleblock">
          <div className="f-tb-cell f-tb-brand">
            <img src={logo} alt="SmartCrew" width={160} height={22} />
            <span>Software for dirt work contractors with <span className="f-nw">{T.SIZE} employees</span>.</span>
          </div>
          <div className="f-tb-cell">
            <span className="f-tb-k">Contact</span>
            <a href={`mailto:${T.EMAIL}`}>{T.EMAIL}</a>
            <span className="f-tb-todo">Andrew’s number goes here once it’s set up for texts.</span>
          </div>
          <div className="f-tb-cell">
            <span className="f-tb-k">Company</span>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="https://smart-crew-app.web.app/">Log in</a>
          </div>
          <div className="f-tb-cell f-tb-sheet">
            <span className="f-tb-k">Sheet</span>
            <span>Product page · 1 of 1</span>
            <span>© 2026 SmartCrew</span>
          </div>
        </div>

        <div className="f-notes">
          <h2 className="f-notes-h">Notes</h2>
          <ol>
            <li>Andrew’s design goal, not a measured average.</li>
            <li>
              busybusy, QB Time, ExactTime, fleet.io, HubSpot, Close, Dropbox, Google Drive, Slack, WhatsApp and QuickBooks are trademarks of their owners. SmartCrew isn’t affiliated with
              them.
            </li>
            <li>Product screens come from a demo account. Names and numbers are made up.</li>
            <li>Job photos are placeholders until Andrew sends photos from real SmartCrew customers.</li>
          </ol>
          <p className="f-notes-proto">
            Prototype legend: dashed boxes are proposals or lines Andrew hasn’t approved yet; <sup className="f-flag">⚑</sup> marks wording he still has to confirm.
          </p>
        </div>
      </div>
    </footer>
  );
}
