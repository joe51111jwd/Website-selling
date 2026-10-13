// O1 · the crew's phone: Marcus Bell's SmartCrew app on Friday morning, standing inside the Hwy 9
// Culvert geofence, one tap from clocking in. Built from the app's own parts (the Gen C phone
// shell, its status bar and tab bar, the day header, the regional map, the black Clock In button)
// with the demo account's data (src/screens/data.ts), set larger than the app does so the words
// read on a phone that is ~0.5x its native size (Hwy 9 Culvert, You're on site, Clock In,
// Clocked in 6:42 AM: >= 13 px on screen at 390 x 664, >= 16 px at 1440 x 660).
//
// The map, its geofence and Marcus's pin are NOT drawn in the screen: the opening lays them over
// it (./index.tsx), from the first frame, because the camera carries them on after the rest of the
// phone has gone (the geofence and the pin become the hero's fence and MB marker). This screen
// leaves the map's slot empty and exports where everything sits.

import "@fontsource-variable/inter";
import "../../screens/screens.css";
import { StatusBar, TabBar } from "../../screens/kit/PhoneShell";
import { DayHeader, Stopwatch } from "../../screens/phone/ClockParts";
import { HERO_JOBS } from "../../content/copy";
import { clockIns, crewById, featuredProject } from "../../screens/data";
import mapUrl from "./map-hwy9.webp";

/** The job's map: the app's regional map (kit/MapPanel) at the Hwy 9 culvert (the project's map
 * point, at the image's centre), a 2x snapshot (11 KB) of ./mapshot.tsx's live ClockMap: one image
 * instead of ~260 SVG nodes and their text to lay out in the first second on a phone. The opening
 * lays it over the screen's slot as its own layer, so the camera can carry it on after the rest of
 * the phone has gone. */
export const MAP_SRC = mapUrl;
/** the culvert, the map's point (MapPanel world units) */
export const MAP_AT = featuredProject?.map ?? { x: 748, y: 190 };

/** Native px of the screen (402 x 874) where the pieces sit. */
export const MAP = { x: 20, y: 116, w: 362, h: 268 } as const;
/** the Clock In button (a 176 px circle) */
export const BTN = { x: 113, y: 514, w: 176, h: 176 } as const;
/** the geofence: the hero's fence shape, scaled to at most this big, centred across the map; its
 * height on the map is chosen by the opening (where the headline's phrase will be), and the map
 * is centred so the culvert sits inside it */
export const GEO = { cx: MAP.x + MAP.w / 2, maxW: 300, maxH: 132, minY: MAP.y + 52, maxY: MAP.y + MAP.h - 52 } as const;
/** the map's zoom (CSS px per world unit) */
export const ZOOM = 1.25;

const marcus = crewById("c01");
const clockIn = clockIns.find((c) => c.crewId === "c01")!;
/** "Hwy 9 Culvert": the job's short name, as the hero's tag names it */
export const JOB = HERO_JOBS.rows[0].job;
/** "6:42 AM", from the demo account's clock-ins */
export const TIME = clockIn.time;
export const INITIALS = marcus?.initials ?? "MB";
/** the status bar's clock: the minute he clocks in */
const NOW = TIME.replace(/ [AP]M$/, "");

/** the map is drawn this much taller above and below its window, so the opening can slide it
 * (transform only) to put the culvert wherever the geofence has to be */
export const MAP_PAD = 84;

export function ClockScreen() {
  return (
    <div className="sc sc-phone o1-scr">
      <StatusBar />
      <span className="o1-scr-now">{NOW}</span>
      <div className="sc-phone-body sc-phone-body--pad">
        <DayHeader />
        <div className="o1-scr-job">
          <span className="o1-scr-name">{JOB}</span>
          <span className="o1-scr-on">
            <svg viewBox="0 0 15 13" aria-hidden="true">
              <path d="M1 6.5 4 1.2h7L14 6.5 11 11.8H4Z" />
            </svg>
            You’re on site
          </span>
        </div>
        {/* the map's slot: the map itself (MAP_SRC) is laid over this spot by the opening */}
        <div className="o1-scr-slot" />
        <div className="o1-scr-btn">
          {/* the app's black Clock In button … */}
          <span className="o1-btn-off">
            <Stopwatch size={30} stroke={1.8} />
            <span>Clock In</span>
          </span>
          {/* … and its state once tapped (shown by the opening: opacity only) */}
          <span className="o1-btn-on">
            <span className="o1-btn-k">Clocked in</span>
            <span className="o1-btn-t">{TIME}</span>
          </span>
        </div>
      </div>
      <TabBar active="Home" />
    </div>
  );
}
