import { PhoneShell } from "../kit";
import logoUrl from "../kit/smartcrew-logo.svg";
import { crewMessages, scheduleBlocks } from "../data";
import { HomeBody } from "./Home";
import "./Push.css";

// The crew's phone getting the plan (Watch it work, The Week's Dispatch: "Push notifications put
// assignments and updates right on your crew's phones"; Andrew's comment-mode note, Oct 20: "Show a
// push notification on mobile and the messaging dispatch side on web"). Home under two SmartCrew
// notifications: Monday's first assignment from the schedule and the office's message about the
// stone loads (crewMessages cm-2, the same thread the laptop's Messaging screen shows).

const toMin = (t: string) => {
  const [hm, ap] = t.split(" ");
  const [h, m] = hm.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
};
const first = scheduleBlocks.filter((b) => b.date === "2026-10-12").sort((a, b) => toMin(a.start) - toMin(b.start))[0];
const office = crewMessages.find((m) => m.id === "cm-2")!;

const NOTES = [
  { when: "now", title: "New assignment · Mon, Oct 12", body: first ? `${first.start} · ${first.title}` : "Your schedule for Monday is ready." },
  { when: "1m ago", title: "Message from the office", body: office.text },
];

export default function Push() {
  return (
    <div className="pn">
      <PhoneShell tab="Home">
        <HomeBody />
      </PhoneShell>
      <div className="pn-stack">
        {NOTES.map((n) => (
          <div className="pn-note" key={n.title}>
            <img className="pn-app" src={logoUrl} alt="" draggable={false} />
            <div className="pn-text">
              <div className="pn-top">
                <b>SmartCrew</b>
                <span>{n.when}</span>
              </div>
              <div className="pn-title">{n.title}</div>
              <div className="pn-body">{n.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
