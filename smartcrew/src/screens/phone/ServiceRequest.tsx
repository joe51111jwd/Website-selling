import { PhoneShell, Field, Input, Choice } from "../kit";
import { crewById, equipmentById, serviceQueue } from "../data";
import { FormHeader, formFooterFor } from "./ReportForms";

// Service Request on the phone (Watch it work, The Day, 2:15 PM; Andrew's comment-mode note, Oct 21:
// "Mobile to Service Request screen"). Sam reports the roller that lands in the shop's service
// queue on the laptop (sq-117).

const job = serviceQueue.find((q) => q.id === "sq-117")!;
const roller = equipmentById(job.equipmentId);

export default function ServiceRequest() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooterFor("Submit")}>
      <FormHeader icon="wrench" title="Service Request" />

      <Field label="Equipment">
        <Input select value={roller.name} placeholder="Select equipment" />
      </Field>
      <Field label="What's Wrong?">
        <Input multiline className="rf-notes" value={`${job.issue}. Low amplitude still works.`} placeholder="Describe the problem" />
      </Field>
      <Field label="Urgency" className="rf-field-choice">
        <div className="rf-choices" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <Choice label="Low" />
          <Choice label="Medium" />
          <Choice label="High" check selected />
        </div>
      </Field>
      <Field label="Can It Still Run?" className="rf-field-choice">
        <div className="rf-choices">
          <Choice label="Yes" check selected />
          <Choice label="No" />
        </div>
      </Field>
      <Field label="Reported By">
        <Input select value={crewById(job.crewId).name} placeholder="Select person" />
      </Field>
    </PhoneShell>
  );
}
