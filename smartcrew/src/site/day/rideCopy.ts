// One Day's ride: its own few strings (kept here until they move into src/content/copy.ts with
// the copy review). "Enjoy the ride" is the agency owner's line: keep it.

import { MOMENTS } from "../../content/moments";
import { DAY2 } from "../../content/copy";

/** "About a minute." / "About 45 seconds." from the film's real length. */
export function aboutLength(ms: number) {
  const s = ms / 1000;
  if (s >= 52 && s <= 72) return "About a minute.";
  if (s > 72) return `About ${Math.round(s / 60)} minutes.`;
  return `About ${Math.round(s / 5) * 5} seconds.`;
}

export const RIDE_COPY = {
  title: "Enjoy the ride",
  /** the finale, over the whole app (the brief's line) */
  finale: "That\u2019s SmartCrew.",
  sub: (ms: number) => `One day at a 16-person dirt crew. ${aboutLength(ms)}`,
  /** 5:30 PM: when the crew chips say the plan starts (the demo's schedule) */
  chipWhen: "Mon 7:00 AM",
  /** 5:00 PM: under the profit card's budget bars (the screen's own figures: spent ÷ budget) */
  barsNote: "of budget spent, by cost type",
  /** 9:20 AM: the two ends of the haul road on the map ground (the demo's places) */
  haulFrom: "Hollis Sand & Gravel pit",
  haulTo: "Riverside Storm Sewer",
  /** the ride's music: the prompt while the browser holds sound back, and the bar's button */
  sound: {
    prompt: "Turn on sound",
    on: "Turn sound on",
    off: "Turn sound off",
  },
  controls: {
    group: "The day's controls",
    play: "Play the day",
    pause: "Pause",
    resume: "Resume the ride",
    replay: "Replay",
    skip: "Skip",
    prev: "Previous moment",
    next: "Next moment",
    tick: (i: number) => `${MOMENTS[i].when}: ${DAY2[MOMENTS[i].id].headline}`,
  },
};
