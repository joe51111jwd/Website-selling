import { PhoneShell, Icon } from "../kit";
import { equipmentById } from "../data";
import { Glyph } from "./ReportForms";
import "./Dot.css";

// M8 · DOT inspection, as the updated app draws it (James's screenshots of the app, Oct 21, for
// Andrew's comment-mode note "Check app for DOT inspection screenshot."): "Equipment Inspection"
// with DOT Inspection picked over Daily Inspection, the equipment and its miles filled in (dump
// truck 1102, the Hauling Log's truck, odometer from its equipment record), then the check / X rows.
// The rest of the form (Notes, photos, the two checkboxes) sits below the fold, as in the app.

const truck = equipmentById("1102-MACK-GU713");

const ITEMS = [
  "Brakes",
  "Steering",
  "Lights / Reflectors",
  "Tires / Wheels",
  "Horn",
  "Mirrors / Windows / Windshield Wipers",
  "Leaks / Fluid Levels",
  "Coupling Devices",
  "Suspension",
  "Frame / Body",
  "Safety Equipment",
  "Load Securement",
];

const footer = (
  <>
    <span className="dot-btn">Cancel</span>
    <span className="dot-btn dot-btn--submit">Submit</span>
  </>
);

export default function Dot() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="dot-body" footer={footer}>
      <div className="dot-head">
        <span className="dot-title">Equipment Inspection</span>
        <Glyph name="history" size={25} stroke={1.9} />
        <Icon name="x" size={25} />
      </div>

      <p className="dot-label">Inspection Type *</p>
      <div className="dot-type is-on">DOT Inspection</div>
      <div className="dot-type">Daily Inspection</div>

      <p className="dot-label">Equipment *</p>
      <div className="dot-input dot-input--select">
        <span>{truck.name}</span>
        <Icon name="chevronDown" size={20} />
      </div>

      <p className="dot-label">Hours / Miles</p>
      <div className="dot-input">{truck.reading.toLocaleString("en-US")} mi</div>

      <ul className="dot-items">
        {ITEMS.map((item) => (
          <li key={item} className="dot-item">
            <span>{item}</span>
            <span className="dot-yes">
              <Icon name="check" size={20} stroke={2} />
            </span>
            <span className="dot-no">
              <Icon name="x" size={20} stroke={2} />
            </span>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}
