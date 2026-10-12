// M1 · Phone home, "Ready to clock in?" (Gen C mock: vercel-module-gps-time-tracking-mobile.png).
// Marcus Bell's phone on Friday Oct 9, 2026: Mon–Thu worked, today not clocked in yet.
import { PhoneShell, Icon } from "../kit";
import { DayHeader, WeekStrip, Stopwatch } from "./ClockParts";

/** Header, week strip and the Clock In block; shared with the M3 sheet backdrop. */
export function HomeBody() {
  return (
    <>
      <DayHeader />
      <WeekStrip />
      <div className="pc-ready">
        <div className="pc-ready-q">Ready to clock in?</div>
        <div className="pc-clockin">
          <Stopwatch size={22} stroke={1.7} />
          <span className="pc-clockin-label">Clock In</span>
        </div>
        <div className="pc-dayoff">
          <Icon name="calendarOff" size={21} stroke={1.55} />
          <span>Request day off</span>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <PhoneShell tab="Home">
      <HomeBody />
    </PhoneShell>
  );
}
