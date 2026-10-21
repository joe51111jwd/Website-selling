import { PhoneShell, Field, Input } from "../kit";
import { dailyReports, dailyReportDetail, projectById } from "../data";
import { FormHeader, formFooterFor } from "./ReportForms";

// Daily Report on the phone (Watch it work, The Day, 4:00 PM; Andrew's comment-mode note, Oct 21:
// "Mobile to Daily Report Screen"). Marcus files today's Hwy 9 report from the job; the laptop shows
// the daily reports list it lands in.

const r = dailyReports.find((d) => d.id === "dr-2417-1009")!;

export default function DailyReportForm() {
  return (
    <PhoneShell tab={null} padded={false} bodyClassName="rf-body" footer={formFooterFor("Submit")}>
      <FormHeader icon="clipboard" title="Daily Report" />

      <Field label="Project">
        <Input select value={projectById(r.projectId).name} placeholder="Select project" />
      </Field>
      <Field label="Date">
        <Input icon="calendar" className="rf-date" value="Fri, Oct 9, 2026" />
      </Field>
      <Field label="Weather">
        <Input value={dailyReportDetail.weather} placeholder="Weather" />
      </Field>
      <Field label="Work Completed">
        <Input multiline className="rf-notes" value={r.note} placeholder="What got done today?" />
      </Field>
      <Field label="Photos">
        <Input icon="camera" value={`${r.photos} photos attached`} placeholder="Add photos" />
      </Field>
    </PhoneShell>
  );
}
