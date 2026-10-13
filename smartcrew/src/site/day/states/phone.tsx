// One Day's phone states: the crew app before and after each tap, built from the recreated app
// (src/screens: the kit, the clock parts, the report forms) so they look exactly like the other
// screens. Shot to textures (public/renders/day-s/phone-d-*.webp, 402×874 @3x) by
// scratchpad design/v2/r2-day2/scripts/states.cjs through ./dev.html.

import type { ReactNode } from "react";
import { PhoneShell, StatusBar, TabBar, Icon, Field, Input, Choice, timer } from "../../../screens/kit";
import { DayHeader, WeekStrip, Stopwatch } from "../../../screens/phone/ClockParts";
import { HomeBody } from "../../../screens/phone/Home";
import { FormHeader, formFooter } from "../../../screens/phone/ReportForms";
import Summary from "../../../screens/phone/Summary";
import { equipmentById } from "../../../screens/data";
import { DAY_DATA } from "./rows";
import "../../../screens/phone/clock.css";
import "../../../screens/phone/ReportForms.css";
import "./states.css";

// ─── clock: working (fresh clock-in, or late in the day) ─────────────────────
function WorkingScreen({ task, today, project, activity, equipment }: { task: number; today: number; project: string; activity: string; equipment: string }) {
  return (
    <PhoneShell tab="Home">
      <DayHeader />
      <WeekStrip todayMark="check" />
      <div className="pc-seg">
        <span className="is-on">Today</span>
        <span>Entries</span>
        <span>Week</span>
      </div>
      <div className="pc-work">
        <div className="pc-work-title">Currently working on</div>
        <div className="pc-task">
          <div className="pc-timer">{timer(task)}</div>
          <div className="pc-rows">
            <div className="pc-row">
              <span className="pc-row-k">Project</span>
              <span className="pc-row-v">{project}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-k">Activity code</span>
              <span className="pc-row-v">{activity}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-k">Equipment</span>
              <span className="pc-row-v">{equipment}</span>
            </div>
          </div>
          <div className="pc-btns">
            <span className="pc-btn">
              <Icon name="coffee" size={19} stroke={1.6} />
              Break
            </span>
            <span className="pc-btn pc-btn--dark">
              <Icon name="save" size={18} stroke={1.6} />
              Log &amp; Switch
            </span>
          </div>
        </div>
        <div className="pc-work-rule" />
        <div className="pc-total">
          <span>
            <span className="pc-total-k">Total hours</span>
            <span className="pc-total-v">{timer(today)}</span>
          </span>
          <span className="pc-btn pc-btn--pink" data-tap="clockout">
            <Stopwatch size={21} stroke={1.8} />
            Clock Out
          </span>
        </div>
      </div>
    </PhoneShell>
  );
}

const C = DAY_DATA.clockin;

/** 6:42 AM, one second after the tap. */
export const ClockedIn = () => <WorkingScreen task={3} today={3} project={C.project} activity={C.activity} equipment={C.equipment} />;

/** 5:00 PM: on erosion control since noon, 10h 18m on the clock. */
export const Working5pm = () => <WorkingScreen task={5 * 3600 + 4} today={10 * 3600 + 18 * 60 + 4} project={C.project} activity="Erosion Control" equipment="None" />;

/** 5:00 PM, after Clock Out: the day's two entries and the total. */
export function ClockedOut() {
  return (
    <PhoneShell tab="Home">
      <DayHeader />
      <WeekStrip todayMark="check" />
      <div className="pc-seg">
        <span className="is-on">Today</span>
        <span>Entries</span>
        <span>Week</span>
      </div>
      <div className="dds-out">
        <div className="dds-out-head">
          <span className="dds-ok">
            <Icon name="check" size={20} stroke={2.4} />
          </span>
          <span>
            <b>Clocked out</b>
            <span>5:00 PM · {C.project}</span>
          </span>
        </div>
        <div className="dds-out-total">
          <span>Total hours</span>
          <b className="sc-num">10h 18m</b>
        </div>
        <div className="dds-out-rule" />
        <Entry activity="Pipe Laying" span="6:42 AM – 12:00 PM" hours="5h 18m" equipment={C.equipment} />
        <Entry activity="Erosion Control" span="12:00 PM – 5:00 PM" hours="5h 00m" equipment="None" />
      </div>
    </PhoneShell>
  );
}

function Entry({ activity, span, hours, equipment }: { activity: string; span: string; hours: string; equipment: string }) {
  return (
    <div className="dds-entry">
      <span className="dds-entry-check">
        <Icon name="check" size={11} stroke={2.6} />
      </span>
      <span className="dds-entry-main">
        <b>{activity}</b>
        <span>{span}</span>
        <span className="dds-entry-eq">
          Equipment: <b>{equipment}</b>
        </span>
      </span>
      <span className="dds-entry-h sc-num">{hours}</span>
    </div>
  );
}

// ─── the success sheet the app shows after a form goes in ────────────────────
function Sent({ title, sub, rows, children }: { title: string; sub: string; rows: [string, string][]; children: ReactNode }) {
  return (
    <div className="sc dds-sent">
      {children}
      <div className="pc-scrim" />
      <div className="dds-sheet">
        <span className="dds-sheet-ok">
          <Icon name="check" size={30} stroke={2.6} />
        </span>
        <div className="dds-sheet-title">{title}</div>
        <div className="dds-sheet-sub">{sub}</div>
        <div className="dds-sheet-rows">
          {rows.map(([k, v]) => (
            <div key={k} className="dds-sheet-row">
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <div className="dds-sheet-done">Done</div>
        <span className="sc-homebar" />
      </div>
    </div>
  );
}

// ─── 6:55 AM: DOT pre-trip on truck 1102, nothing defective ──────────────────
const truck = equipmentById("1102-MACK-GU713");

export function DotForm() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooter}>
      <FormHeader icon="clipboard" title="DOT Inspection Report" />
      <Field label="Truck">
        <Input select value={truck.name} />
      </Field>
      <Field label="Mileage">
        <Input value={truck.reading.toLocaleString("en-US")} />
      </Field>
      <Field label="Trailer Number">
        <Input select value="No Trailer" />
      </Field>
      <Field label="Is Anything Defective On The Truck?" className="rf-field-choice">
        <div className="rf-choices">
          <Choice label="No" check selected />
          <Choice label="Yes" check />
        </div>
      </Field>
    </PhoneShell>
  );
}

/** 6:55 AM, before the form fills itself (the ride's covers are cut from this one). */
export function DotFormEmpty() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooter}>
      <FormHeader icon="clipboard" title="DOT Inspection Report" />
      <Field label="Truck">
        <Input select placeholder="Select truck" />
      </Field>
      <Field label="Mileage">
        <Input placeholder="Enter mileage" />
      </Field>
      <Field label="Trailer Number">
        <Input select placeholder="Select trailer" />
      </Field>
      <Field label="Is Anything Defective On The Truck?" className="rf-field-choice">
        <div className="rf-choices">
          <Choice label="No" check />
          <Choice label="Yes" check />
        </div>
      </Field>
    </PhoneShell>
  );
}

export const DotSent = () => (
  <Sent
    title="Pre-trip passed"
    sub="DOT inspection submitted"
    rows={[
      ["Truck", truck.name],
      ["Mileage", truck.reading.toLocaleString("en-US")],
      ["Defects", "None"],
      ["Time", "6:55 AM"],
    ]}
  >
    <DotForm />
  </Sent>
);

// ─── 9:20 AM: a load of select fill to Riverside ─────────────────────────────
const L = DAY_DATA.load;

export function HaulForm() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooter}>
      <FormHeader icon="truck" title="Hauling Log" />
      <Field label="Equipment">
        <Input select value={L.truck} />
      </Field>
      <Field label="Project Number">
        <Input value={L.number.replace("#", "")} />
      </Field>
      <Field label="Type" className="rf-field-choice">
        <div className="rf-choices">
          <Choice label="Import" check selected />
          <Choice label="Export" check />
        </div>
      </Field>
      <Field label="Material">
        <Input select value={L.material} />
      </Field>
      <Field label="Quantity">
        <Input value={L.qty} />
      </Field>
      <Field label="What was the hauling location?">
        <Input select icon="mapPin" value="Hollis Sand & Gravel pit" />
      </Field>
    </PhoneShell>
  );
}

export const HaulSent = () => (
  <Sent
    title={`Load ${L.ticket} logged`}
    sub="Hauling ticket sent to the office"
    rows={[
      ["Material", `${L.qty} ${L.material.toLowerCase()}`],
      ["Project", L.project],
      ["Truck", L.truck],
      ["Time", L.time],
    ]}
  >
    <HaulForm />
  </Sent>
);

// ─── 4:12 PM: a service request for the D6 ───────────────────────────────────
const Q = DAY_DATA.leak;

export function ServiceForm() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooter}>
      <FormHeader icon="clipboard" title="Service Request" />
      <Field label="Equipment">
        <Input select value={Q.equipment} />
      </Field>
      <Field label="Hour Meter">
        <Input value={equipmentById("CAT-D6-01").reading.toLocaleString("en-US")} />
      </Field>
      <Field label="Urgency" className="rf-field-choice">
        <div className="rf-choices dds-choices-3">
          <Choice label="Low" check />
          <Choice label="Medium" check />
          <Choice label="High" check selected />
        </div>
      </Field>
      <Field label="What needs fixing?">
        <Input multiline className="rf-notes" value={`${Q.issue}.`} />
      </Field>
    </PhoneShell>
  );
}

/** 4:12 PM, before the request is written (the ride's covers are cut from this one). */
export function ServiceFormEmpty() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooter}>
      <FormHeader icon="clipboard" title="Service Request" />
      <Field label="Equipment">
        <Input select value={Q.equipment} />
      </Field>
      <Field label="Hour Meter">
        <Input value={equipmentById("CAT-D6-01").reading.toLocaleString("en-US")} />
      </Field>
      <Field label="Urgency" className="rf-field-choice">
        <div className="rf-choices dds-choices-3">
          <Choice label="Low" check />
          <Choice label="Medium" check />
          <Choice label="High" check />
        </div>
      </Field>
      <Field label="What needs fixing?">
        <Input multiline className="rf-notes" value="" />
      </Field>
    </PhoneShell>
  );
}

export const ServiceSent = () => (
  <Sent
    title="Leak reported"
    sub="Service request sent to the shop"
    rows={[
      ["Equipment", Q.equipment],
      ["Urgency", Q.urgency],
      ["Queue", "Shop · Todo"],
      ["Time", "4:12 PM"],
    ]}
  >
    <ServiceForm />
  </Sent>
);

// ─── 5:30 PM: Monday's job arrives ───────────────────────────────────────────
export function PlanSheet() {
  const rows: [string, string][] = [
    ["Project", C.project],
    ["Activity code", C.activity],
    ["Start", "7:00 AM"],
    ["Equipment", C.equipment],
    ["Crew", "Elena, Jake, Andre"],
  ];
  return (
    <div className="sc sc-phone dds-plan">
      <StatusBar />
      <div className="sc-phone-body sc-phone-body--pad">
        <HomeBody />
      </div>
      <TabBar active="Home" />
      <div className="pc-scrim" />
      <div className="dds-sheet dds-sheet--plan">
        <div className="dds-plan-head">
          <Icon name="calendar" size={21} stroke={1.7} />
          <b>Monday, Oct 12</b>
          <Icon name="x" size={21} stroke={1.5} className="dds-plan-x" />
        </div>
        <div className="dds-plan-sub">Your next job · from the office</div>
        <div className="dds-plan-card">
          {rows.map(([k, v]) => (
            <div key={k} className="dds-sheet-row">
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <div className="dds-sheet-done">Got it</div>
        <span className="sc-homebar" />
      </div>
    </div>
  );
}

// ─── Friday: the weekly summary, submitted ───────────────────────────────────
export function SummarySent() {
  return (
    <div className="sc dds-sum">
      <Summary />
      <div className="dds-sum-done">
        <Icon name="check" size={19} stroke={2.4} />
        Timecard submitted
      </div>
    </div>
  );
}
