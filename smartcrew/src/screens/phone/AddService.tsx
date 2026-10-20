import { PhoneShell, Field, Input, Choice } from "../kit";
import { crewById, equipmentById, serviceQueue } from "../data";
import { FormHeader, formFooterFor } from "./ReportForms";

// Add Service Record on the phone (Watch it work, The Week's Shop Management; Andrew's
// comment-mode note, Oct 20: "Show Add Service Record on mobile"). The shop logs the fix for the
// D6 it has had since Oct 8 (service queue sq-118, the machine page's dozer).

const job = serviceQueue.find((q) => q.id === "sq-118")!;
const dozer = equipmentById(job.equipmentId);

export default function AddService() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooterFor("Save Record")}>
      <FormHeader icon="wrench" title="Add Service Record" />

      <Field label="Equipment">
        <Input select value={dozer.name} placeholder="Select equipment" />
      </Field>
      <Field label="Type" className="rf-field-choice">
        <div className="rf-choices">
          <Choice label="Repair" check selected />
          <Choice label="Maintenance" check />
        </div>
      </Field>
      <Field label="Work Done">
        <Input multiline className="rf-notes" value="Idler seal kit installed, track tension reset." placeholder="What was done?" />
      </Field>
      <Field label="Hour Meter">
        <Input value={dozer.reading.toLocaleString("en-US")} placeholder="Enter hours" />
      </Field>
      <Field label="Done By">
        <Input select value={`${crewById("c10").name} (shop)`} placeholder="Select mechanic" />
      </Field>
    </PhoneShell>
  );
}
