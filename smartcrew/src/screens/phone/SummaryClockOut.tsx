import { currentActivity } from "../data";
import Summary from "./Summary";
import { WithAlerts } from "./Push";

// The weekly summary with a clock-out reminder over it (Watch it work, The Day, 6:00 PM; Andrew's
// comment-mode note, Oct 21: "Add an alert up top as a reminder to clock out.").

export default function SummaryClockOut() {
  return (
    <WithAlerts notes={[{ when: "now", title: "Don't forget to clock out", body: `You're still clocked in at ${currentActivity.project}. Tap to clock out and send your hours.` }]}>
      <Summary />
    </WithAlerts>
  );
}
