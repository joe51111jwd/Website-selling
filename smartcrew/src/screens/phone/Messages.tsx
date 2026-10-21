import type { ReactNode } from "react";
import { PhoneShell, Icon } from "../kit";
import "./Messages.css";

// Group messaging on the phone: the Chats screen, as Andrew sent it from the app (Oct 21: "This
// screenshot for the Chat function I posted about"; his comment-mode notes: "Change this screen to the
// group messaging screen from app" and "Add mobile view of group chat screen so people can see the
// different chat channels"). His channels, dates and lines, with demo names for the people in them.

type Channel = { name: string; last: string; date?: string; announce?: boolean };

const CHANNELS: Channel[] = [
  { name: "General", last: "Elena: luis, its under i-stone ...", date: "Oct 19", announce: true },
  { name: "Sales", last: "Kenji: Image attachment", date: "Sep 3" },
  { name: "Equipment", last: "Kenji: Test", date: "Aug 18" },
  { name: "Concrete Crew", last: "No messages yet" },
  { name: "Dirt Crew", last: "No messages yet" },
  { name: "Management", last: "No messages yet" },
  { name: "Office", last: "No messages yet" },
];

// the app's own glyphs: two square speech bubbles (a chat), a megaphone (announcements). The bottom
// bar is the updated app's (kit TabBar, James's screenshots Oct 21).
const g = (d: string) => <path d={d} />;
const Svg = ({ children, size = 24, fill = false }: { children: ReactNode; size?: number; fill?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
export const ChatGlyph = ({ size, fill }: { size?: number; fill?: boolean }) => (
  <Svg size={size} fill={fill}>
    {fill ? (
      <>
        {g("M2.5 3.5h12.5v9H7l-4.5 3.6z")}
        {g("M17 7h4.5v12.6L17.6 17H9v-2.6h8z")}
      </>
    ) : (
      <>
        {g("M3 4h11.5v8.4H7.2L3 15.6z")}
        {g("M17.2 7.6H21v12l-3.6-2.8H9.4v-2.2")}
      </>
    )}
  </Svg>
);
const Megaphone = ({ size }: { size?: number }) => (
  <Svg size={size}>
    {g("M3.5 10v4h3l7 4V6l-7 4z")}
    {g("M6.5 14l1.2 4.2M17.6 9.2l2-1.4M18.2 12h2.4M17.6 14.8l2 1.4")}
  </Svg>
);
export default function Messages() {
  return (
    <PhoneShell tab="Messages">
      <div className="pchat-head">
        <h1>Chats</h1>
        <span className="pchat-btn">
          <Icon name="bell" size={18} stroke={1.7} />
        </span>
        <span className="pchat-btn">
          <Icon name="camera" size={18} stroke={1.7} />
        </span>
        <span className="pchat-btn">
          <Icon name="settings" size={18} stroke={1.7} />
        </span>
        <span className="pchat-date">
          Oct 21
          <small>2026</small>
        </span>
      </div>
      <div className="pchat-seg">
        <span className="is-on">
          <ChatGlyph size={22} />
        </span>
        <span>
          <Megaphone size={22} />
        </span>
      </div>
      <ul className="pchat-list">
        {CHANNELS.map((c) => (
          <li key={c.name} className="pchat-row">
            <span className="pchat-av">{c.announce ? <Megaphone size={20} /> : <ChatGlyph size={20} />}</span>
            <span className="pchat-main">
              <span className="pchat-name">{c.name}</span>
              <span className="pchat-last">{c.last}</span>
            </span>
            {c.date && <span className="pchat-when">{c.date}</span>}
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}
