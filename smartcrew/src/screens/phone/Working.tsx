// M2 · Clocked in, "Currently working on" (Gen B video frame v041 rebuilt in Gen C style):
// live task timer, Project / Activity code / Equipment, Break, Log & Switch, Total hours + Clock Out.
import { PhoneShell, Icon, timer } from "../kit";
import { currentActivity } from "../data";
import { DayHeader, WeekStrip, Stopwatch } from "./ClockParts";

export default function Working() {
  const a = currentActivity;
  return (
    <PhoneShell tab="Home">
      <DayHeader />
      <WeekStrip todayMark="check" />
      <div className="pc-seg">
        <span className="is-on">Today</span>
        <span>Entries</span>
        <span>Week</span>
      </div>
      <div className="pc-work">
        <div className="pc-work-title">Currently working on</div>
        <div className="pc-task">
          <div className="pc-timer">{timer(a.taskSeconds)}</div>
          <div className="pc-rows">
            <div className="pc-row">
              <span className="pc-row-k">Project</span>
              <span className="pc-row-v">{a.project}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-k">Activity code</span>
              <span className="pc-row-v">{a.activity}</span>
            </div>
            <div className="pc-row">
              <span className="pc-row-k">Equipment</span>
              <span className="pc-row-v">{a.equipment}</span>
            </div>
          </div>
          <div className="pc-btns">
            <span className="pc-btn">
              <Icon name="coffee" size={19} stroke={1.6} />
              Break
            </span>
            <span className="pc-btn pc-btn--dark">
              <Icon name="save" size={18} stroke={1.6} />
              Log &amp; Switch
            </span>
          </div>
        </div>
        <div className="pc-work-rule" />
        <div className="pc-total">
          <span>
            <span className="pc-total-k">Total hours</span>
            <span className="pc-total-v">{timer(a.todaySeconds)}</span>
          </span>
          <span className="pc-btn pc-btn--pink">
            <Stopwatch size={21} stroke={1.8} />
            Clock Out
          </span>
        </div>
      </div>
    </PhoneShell>
  );
}
