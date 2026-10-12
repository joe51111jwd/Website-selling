// M3 · "Select task and project" sheet (live-site fragment), shown over the dimmed home screen
// right after Clock In. Picks match what M2 then shows as the running task.
import { StatusBar, TabBar, Icon } from "../kit";
import { currentActivity } from "../data";
import { HomeBody } from "./Home";

function Select({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="pc-sel-label">{label}</span>
      <div className="pc-sel">
        <span>{value}</span>
        <Icon name="chevronDown" size={18} stroke={2} />
      </div>
    </>
  );
}

export default function SelectTask() {
  const a = currentActivity;
  return (
    <div className="sc sc-phone">
      <StatusBar />
      <div className="sc-phone-body sc-phone-body--pad">
        <HomeBody />
      </div>
      <TabBar active="Home" />
      <div className="pc-scrim" />
      <div className="pc-sheet">
        <div className="pc-sheet-head">
          <span className="pc-sheet-title">Select task and project</span>
          <Icon name="x" size={22} stroke={1.45} className="pc-sheet-x" />
        </div>
        <Select label="Project" value={a.project} />
        <Select label="Activity code" value={a.activity} />
        <Select label="Equipment" value={a.equipment} />
        <div className="pc-sheet-btns">
          <span className="pc-sheet-cancel">Cancel</span>
          <span className="pc-sheet-start">Start</span>
        </div>
        <span className="sc-homebar" />
      </div>
    </div>
  );
}
