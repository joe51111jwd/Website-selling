import { PhoneShell } from "../kit";
import { currentActivity } from "../data";
import { HomeBody } from "./Home";
import { WithAlerts } from "./Push";

// Home with the day's plan as a notification (Watch it work, The Day, 6:30 AM; Andrew's
// comment-mode note, Oct 21: "Add an alert at top showing the plan for the day.").

const a = currentActivity;

export default function HomePlan() {
  return (
    <WithAlerts notes={[{ when: "6:02 AM", title: "Today's plan · Fri, Oct 9", body: `Start 6:30 AM at ${a.project}. ${a.activity} with the ${a.equipment}.` }]}>
      <PhoneShell tab="Home">
        <HomeBody />
      </PhoneShell>
    </WithAlerts>
  );
}
