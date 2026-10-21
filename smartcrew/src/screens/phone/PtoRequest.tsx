import { PhoneShell, Field, Input, Choice } from "../kit";
import { crewById } from "../data";
import { FormHeader, formFooterFor } from "./ReportForms";

// Time-off request on the phone (Watch it work, The Month's PTO; Andrew's comment-mode note, Oct 21:
// "Show PTO request form"). Elena asks for two days; the laptop shows it waiting on Workforce › Time Off.

export default function PtoRequest() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooterFor("Submit Request")}>
      <FormHeader icon="clipboard" title="Request Time Off" />

      <Field label="Type" className="rf-field-choice">
        <div className="rf-choices" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <Choice label="Vacation" check selected />
          <Choice label="Sick" />
          <Choice label="Personal" />
        </div>
      </Field>
      <Field label="Start Date">
        <Input icon="calendar" className="rf-date" value="Thu, Oct 22, 2026" />
      </Field>
      <Field label="End Date">
        <Input icon="calendar" className="rf-date" value="Fri, Oct 23, 2026" />
      </Field>
      <Field label="Hours">
        <Input value="20 hrs (2 days)" placeholder="Hours" />
      </Field>
      <Field label="Note">
        <Input multiline className="rf-notes" value="Family wedding out of town. Back Monday." placeholder="Anything the office should know?" />
      </Field>
      <Field label="Employee">
        <Input select value={crewById("c02").name} placeholder="Select employee" />
      </Field>
    </PhoneShell>
  );
}
