import type { ReactNode } from "react";
import { PhoneShell, Icon } from "../kit";
import { reportsMenu } from "../data";
import { Glyph } from "./ReportForms";
import "./Reports.css";

// M6 · Reports menu. The only capture is the Gen B app in the explainer video (frame v054); this is
// the same list redrawn in Gen C: the 40 px large title of the Gen C home screen, 40 px #F4F4F4 icon
// circles, one consistent black outline icon set (Gen B mixed grey and black glyph sets), and the
// "Docs" tab of the Gen C tab bar active (the [V] mocks label the reports tab "Docs").
// Rows, order and glyph shapes follow the video: 70 px rows, 18 px semibold labels, chevrons.

const own = (children: ReactNode) => (
  <svg className="sc-icon" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

/** Open-end wrench with an outlined handle, head at the upper right. */
const WRENCH =
  "M4 17.6l7.08-7.08A5 5 0 0 1 17.91 3.97L14.19 7.69l2.12 2.12 3.72-3.72A5 5 0 0 1 13.48 12.92L6.4 20a1.7 1.7 0 0 1-2.4-2.4z";

/** Glyph per row, matching the shapes in the video (asterisk tile, wrench-in-circle, archive box …). */
const ROW_ICON: Record<string, ReactNode> = {
  "Incident Report": own(
    <>
      <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="2.6" />
      <path d="M12 7.9v8.2M8.45 9.95l7.1 4.1M15.55 9.95l-7.1 4.1" />
    </>,
  ),
  "Service Request": own(
    <>
      <path d="M14 3.5H7.2a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V8.3z" />
      <path d="M14 3.5v3.3a1.5 1.5 0 0 0 1.5 1.5h3.3M8.8 12.3h6.4M8.8 15.8h6.4M8.8 8.8h2.6" />
    </>,
  ),
  "Add Service Records": own(<path d={WRENCH} />),
  "Hauling Log Report": <Glyph name="truck" size={22} stroke={1.6} />,
  "Receipts Report": <Icon name="archive" size={22} stroke={1.6} />,
  "Service Queue": own(
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d={WRENCH} transform="translate(12 12) scale(-0.52 0.52) translate(-12 -11.8)" strokeWidth={3.2} />
    </>,
  ),
  "Field Usage Report": <Icon name="archive" size={22} stroke={1.6} />,
  "DOT Inspection Report": <Glyph name="clipboard" size={22} stroke={1.6} />,
  Scheduling: <Icon name="calendarOff" size={22} stroke={1.6} />,
  "Day Off Request": <Icon name="calendarOff" size={22} stroke={1.6} />,
};

export default function Reports() {
  return (
    <PhoneShell tab="Docs" padded={false} bodyClassName="rp-body">
      <div className="sc-phead-big rp-title">Reports</div>
      <div className="rp-list">
        {reportsMenu.map(({ label, icon }) => (
          <div className="rp-row" key={label}>
            <span className="sc-circle-btn rp-icon">{ROW_ICON[label] ?? <Icon name={icon} size={22} stroke={1.6} />}</span>
            <span className="rp-label">{label}</span>
            <Icon name="chevronRight" size={17} stroke={1.6} className="rp-chev" />
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}
