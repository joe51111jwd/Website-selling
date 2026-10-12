// Shared pieces of the Gen C phone "clock" screens (M1 Home, M2 Working, M3 Select task):
// the big weekday header with the camera button and date, and the 7-day week strip.
// Measured on vercel-module-gps-time-tracking-mobile.png (1560 px wide = 402 CSS px × 3.88).
import { Icon } from "../kit";
import { TODAY, phoneWeek, type DayMark } from "../data";
import "./clock.css";

/** "Fri ●   (camera)   Oct 09 / 2026" */
export function DayHeader() {
  return (
    <div className="pc-head">
      <span className="pc-head-day">{TODAY.weekday}</span>
      <span className="pc-head-dot" />
      <span className="pc-head-cam">
        <Icon name="camera" size={24} stroke={1.6} />
      </span>
      <span className="pc-head-date">
        <span>{TODAY.monthDay}</span>
        <span className="pc-head-year">{TODAY.year}</span>
      </span>
    </div>
  );
}

function Mark({ mark }: { mark: DayMark }) {
  if (mark === "check") return <Icon name="check" size={15} stroke={2.3} className="pc-mark pc-mark--check" />;
  if (mark === "miss") return <Icon name="x" size={16} stroke={2.2} className="pc-mark pc-mark--miss" />;
  if (mark === "lock") return <Icon name="lock" size={14} stroke={1.9} className="pc-mark pc-mark--lock" />;
  return null;
}

/**
 * Mon..Sun tiles: date number, weekday, status mark (✓ worked, ✕ missed, lock = future).
 * `todayMark` overrides the mark on today's (selected) tile, e.g. "check" once clocked in.
 */
export function WeekStrip({ todayMark }: { todayMark?: DayMark }) {
  return (
    <div className="pc-week">
      {phoneWeek.map((d) => {
        const mark = d.today && todayMark !== undefined ? todayMark : d.mark;
        const cls = d.today ? " is-today" : d.mark === "lock" ? " is-locked" : "";
        return (
          <div key={d.date} className={`pc-tile${cls}`}>
            <span className="pc-tile-num">{d.day}</span>
            <span className="pc-tile-dow">{d.label}</span>
            <span className="pc-tile-mark">
              <Mark mark={mark} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Stopwatch with the two side ticks, as drawn on the Clock In / Clock Out buttons. */
export function Stopwatch({ size = 22, stroke = 1.7 }: { size?: number; stroke?: number }) {
  return (
    <svg className="sc-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="13.4" r="7.6" />
      <path d="M12 9.9v3.7l2.3 1.5M9.7 2.6h4.6M12 2.6v3.2M4.6 6.6l1.3-1.3M19.4 6.6l-1.3-1.3" />
    </svg>
  );
}
