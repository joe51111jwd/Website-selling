import { PhoneShell, Field, Input, Choice } from "../kit";
import { dotForm, equipmentById } from "../data";
import { FormHeader, formFooter } from "./ReportForms";

// M8 · DOT Inspection Report form (reference: vercel-module-dot-compliance-mobile.png). Pre-trip
// on dump truck 1102 (same truck as the Hauling Log screen), odometer taken from its equipment
// record, no trailer, and a defect flagged ("Yes" selected, as in the source mock).

const truck = equipmentById(dotForm.truck);

export default function Dot() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooter}>
      <FormHeader icon="clipboard" title="DOT Inspection Report" />

      <Field label="Truck">
        <Input select value={truck.name} placeholder="Select a truck" />
      </Field>
      <Field label="Mileage">
        <Input value={truck.reading.toLocaleString("en-US")} placeholder="Enter current mileage" />
      </Field>
      <Field label="Trailer Number">
        <Input select value={dotForm.trailer} />
      </Field>
      <Field label="Is Anything Defective On The Truck?" className="rf-field-choice">
        <div className="rf-choices">
          <Choice label="No" check selected={!dotForm.defective} />
          <Choice label="Yes" check selected={dotForm.defective} />
        </div>
      </Field>
    </PhoneShell>
  );
}
