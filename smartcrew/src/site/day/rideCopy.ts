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
  sub: (ms: number) => `One day at a 16-person dirt crew. ${aboutLength(ms)}`,
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
