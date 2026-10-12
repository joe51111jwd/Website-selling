import { PhoneShell, Field, Input, Choice } from "../kit";
import { haulingForm, equipmentById, projectById } from "../data";
import { FormHeader, formFooter } from "./ReportForms";

// M7 · Hauling Log form (reference: vercel-module-materials-hauling-mobile.png), filled in for
// today's import run on Riverside Storm Sewer (#2409) with truck 1102. The source's copy-bug label
// "What was the location of the incident?" is corrected for a hauling form.

const truck = equipmentById("1102-MACK-GU713");
const job = projectById("p2409");
// Same run as hauling log hl-882 in data.ts (6 loads of select fill). Non-breaking hyphens keep
// the manhole numbers on one line.
const notes = "6 loads of select fill for trench backfill between MH\u20115 and MH\u20116.";

export default function Hauling() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooter}>
      <FormHeader icon="truck" title="Hauling Log" />

      <Field label="Date">
        <Input className="rf-date" icon="calendar" value={haulingForm.date} />
      </Field>
      <Field label="Equipment">
        <Input select value={truck.name} placeholder="Select equipment" />
      </Field>
      <Field label="Project Category">
        <Input select value={haulingForm.projectCategory} placeholder="Select project category" />
      </Field>
      <Field label="Project Number">
        <Input value={job.number.replace("#", "")} placeholder="Enter project number" />
      </Field>
      <Field label="Type" className="rf-field-choice">
        <div className="rf-choices">
          <Choice label="Import" check selected={haulingForm.type === "Import"} />
          <Choice label="Export" check selected={haulingForm.type === "Export"} />
        </div>
      </Field>
      <Field label="What was the hauling location?">
        <Input select icon="mapPin" value={haulingForm.location} placeholder="Select location" />
      </Field>
      <Field label="Notes">
        <Input multiline className="rf-notes" value={notes} placeholder="Add any additional information about the hauling" />
      </Field>
    </PhoneShell>
  );
}
