import { PhoneShell, Field, Input } from "../kit";
import { crewById, deals } from "../data";
import { FormHeader, formFooterFor } from "./ReportForms";

// Add Project on the phone (Watch it work, The Week's Bids & Deals: "move deals from prospect to
// project"; Andrew's comment-mode note, Oct 20: "Show add a project screen on mobile"). The office
// turns a won deal into a job: Cedar Ridge Trail Grading (d-59, won Oct 6) from the pipeline data.

const deal = deals.find((d) => d.id === "d-59")!;

export default function AddProject() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooterFor("Add Project")}>
      <FormHeader icon="folder" title="Add Project" />

      <Field label="Project Name">
        <Input value={deal.name} placeholder="Enter project name" />
      </Field>
      <Field label="Client">
        <Input select value={deal.company} placeholder="Select client" />
      </Field>
      <Field label="Contract Value">
        <Input value={`$${deal.value.toLocaleString("en-US")}`} placeholder="$0" />
      </Field>
      <Field label="Start Date">
        <Input className="rf-date" icon="calendar" value="Oct 19, 2026" />
      </Field>
      <Field label="Foreman">
        <Input select value={crewById("c01").name} placeholder="Select foreman" />
      </Field>
      <Field label="Job Site">
        <Input select icon="mapPin" value="Cedar Ridge Trailhead, Mill Rd" placeholder="Select location" />
      </Field>
    </PhoneShell>
  );
}
