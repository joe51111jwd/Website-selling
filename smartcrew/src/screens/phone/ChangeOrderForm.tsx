import { PhoneShell, Field, Input } from "../kit";
import { featuredProject } from "../data";
import { FormHeader, formFooterFor } from "./ReportForms";

// Change Order form on the phone (Watch it work, The Day, 11:30 AM; Andrew's comment-mode note,
// Oct 21: "Make the mobile the change order form."). Marcus writes up Hwy 9's pending CO-02 from the
// field; the laptop shows it on the project's Change Orders tab.

const P = featuredProject;
const co = P.changeOrders.find((c) => c.no === "CO-02")!;

export default function ChangeOrderForm() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooterFor("Submit")}>
      <FormHeader icon="clipboard" title="Change Order" />

      <Field label="Project">
        <Input select value={P.name} placeholder="Select project" />
      </Field>
      <Field label="Title">
        <Input value={co.title} placeholder="What changed?" />
      </Field>
      <Field label="Description">
        <Input
          multiline
          className="rf-notes"
          value="Groundwater higher than the borings showed at the outlet. Pump needs to stay 10 more days to set the last two sections."
          placeholder="Describe the extra work"
        />
      </Field>
      <Field label="Estimated Cost">
        <Input value={`$${co.amount.toLocaleString("en-US")}`} placeholder="$0" />
      </Field>
      <Field label="Photos">
        <Input icon="camera" value="3 photos attached" placeholder="Add photos" />
      </Field>
    </PhoneShell>
  );
}
