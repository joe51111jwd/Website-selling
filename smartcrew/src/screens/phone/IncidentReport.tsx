import { PhoneShell, Field, Input, Choice } from "../kit";
import { crewById, projectById, safetyItems } from "../data";
import { FormHeader, formFooterFor } from "./ReportForms";

// Incident Report on the phone (Watch it work, The Month's Safety & Compliance; Andrew's comment-mode
// note, Oct 21: "Show Incident Report"). Kenji's near miss at Maple Ridge (safety log sf-508), drawn
// in the manner of the other report forms until we have a capture of the app's own screen.

const s = safetyItems.find((i) => i.id === "sf-508")!;

export default function IncidentReport() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooterFor("Submit")}>
      <FormHeader icon="clipboard" title="Incident Report" />

      <Field label="Project">
        <Input select value={projectById(s.projectId!).name} placeholder="Select project" />
      </Field>
      <Field label="Date & Time">
        <Input icon="calendar" className="rf-date" value={`Wed, Oct 7, 2026 · ${s.time}`} />
      </Field>
      <Field label="Type" className="rf-field-choice">
        <div className="rf-choices" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <Choice label="Injury" />
          <Choice label="Near Miss" check selected />
          <Choice label="Damage" />
        </div>
      </Field>
      <Field label="What Happened?">
        <Input multiline className="rf-notes" value={`${s.title} on lot 18. Nobody hurt. Area flagged off and the owner called.`} placeholder="Describe what happened" />
      </Field>
      <Field label="Photos">
        <Input icon="camera" value="2 photos attached" placeholder="Add photos" />
      </Field>
      <Field label="Reported By">
        <Input select value={crewById(s.byId).name} placeholder="Select person" />
      </Field>
    </PhoneShell>
  );
}
