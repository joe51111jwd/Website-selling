import { PhoneShell, PhoneHeader, CircleButton, Badge } from "../kit";
import "./Messages.css";

// Group messaging on the phone: the chat channels (Watch it work, The Day, 10:15 AM; Andrew's
// comment-mode notes, Oct 21: "Change this screen to the group messaging screen from app" and "Add
// mobile view of group chat screen so people can see the different chat channels"). The messages
// are the crew messages and announcements the rest of the demo account uses.

type Channel = { name: string; who: string; last: string; time: string; unread?: number; tone: string; initials: string };

const CHANNELS: Channel[] = [
  { name: "Hwy 9 Culvert Crew", who: "Tomás", last: "Copy. I'll take both after the Riverside run.", time: "9:55 AM", unread: 3, tone: "orange", initials: "H9" },
  { name: "All Company", who: "Office", last: "Crew assignments for the week of Oct 5 are posted.", time: "6:05 AM", tone: "dark", initials: "AC" },
  { name: "Maple Ridge Ph. 2", who: "Kenji", last: "Lots 14–22 rough graded. Photos in field notes.", time: "10:08 AM", unread: 1, tone: "green", initials: "MR" },
  { name: "Trucking", who: "Gabe", last: "Two loads of #57 stone booked for 7:00 and 7:40.", time: "9:51 AM", tone: "blue", initials: "TR" },
  { name: "Shop", who: "Luis", last: "D6 is back together. Track tension reset.", time: "Yesterday", tone: "grey", initials: "SH" },
  { name: "Riverside Storm Sewer", who: "Andre", last: "MH-6 set and grouted. Inspector signed off.", time: "Yesterday", tone: "purple", initials: "RS" },
  { name: "Safety", who: "Office", last: "Toolbox talk: trench safety. Sign-in sheet in Docs.", time: "Sep 28", tone: "red", initials: "SF" },
];

export default function Messages() {
  return (
    <PhoneShell tab="Home">
      <PhoneHeader icon="messaging" title="Messages" right={<CircleButton icon="edit" />} />
      <div className="pmsg-search">Search messages</div>
      <ul className="pmsg-list">
        {CHANNELS.map((c) => (
          <li key={c.name} className="pmsg-row">
            <span className={`pmsg-av pmsg-av--${c.tone}`}>{c.initials}</span>
            <span className="pmsg-main">
              <span className="pmsg-top">
                <span className="pmsg-name">{c.name}</span>
                <span className="pmsg-time">{c.time}</span>
              </span>
              <span className="pmsg-bottom">
                <span className="pmsg-last">
                  <b>{c.who}:</b> {c.last}
                </span>
                {c.unread ? <Badge tone="orange">{c.unread}</Badge> : null}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}
