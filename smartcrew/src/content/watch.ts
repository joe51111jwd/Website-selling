// "Watch it work" (round 4, Andrew's Oct 16 outline): the seven One Day moments as one skimmable
// board instead of the ride. Each moment leads with its feature headline (DAY2.headline; Andrew:
// "lead with feature headlines instead of the time of day"), the time of day only small, and the
// flow of data in one glance: what the crew's phone shows (DAY2.phone) → what lands in the office
// (DAY2.office). Everything below is read from approved copy (copy.ts DAY2 / DAY_UI / CTA /
// APPS_SCENE, moments.ts); the only new lines are the sub (a plain description of the demo) and
// the close's lead-in (the first half of CTA.inline). Demo data only: DAY_UI.caption.

import { APPS_SCENE, CTA, DAY2, DAY2_UI, DAY_UI, T } from "./copy";
import { MOMENTS, type MomentId } from "./moments";

export type WatchMoment = {
  id: MomentId;
  /** time of day, set small (moments.ts `when`) */
  when: string;
  /** "up": the crew's phone → the office; "down": the office → the crew's phones (Monday's plan) */
  dir: "up" | "down";
  headline: string;
  phone: string;
  office: string;
  /** the part of the app the office line lands in (first segment of DAY2.where) */
  where: string;
};

export const WATCH = {
  /** the section's accessible name */
  label: "Watch it work",
  /** Andrew's page outline */
  title: "Watch it work.",
  sub: `One day at ${T.COMPANY}, our demo company. What the crew taps in the field shows up in the office as it happens.`,
  /** column heads over the two ends of every flow (the Stage's loupe tags, APPS_SCENE) */
  phoneHead: APPS_SCENE.loupeCrew,
  officeHead: APPS_SCENE.loupeOffice,
  /** screen-reader prefixes for the two ends */
  phoneSr: DAY2_UI.phoneSr,
  officeSr: DAY2_UI.officeSr,
  /** the list's accessible name */
  listLabel: DAY_UI.rail,
  /** the close's lead-in, before the primary button (CTA.inline's first half) */
  close: CTA.inline.slice(0, CTA.inline.indexOf("?") + 1),
  caption: DAY_UI.caption,
  moments: MOMENTS.map(
    (m): WatchMoment => ({
      id: m.id,
      when: m.when,
      dir: m.dir,
      headline: DAY2[m.id].headline,
      phone: DAY2[m.id].phone,
      office: DAY2[m.id].office,
      where: DAY2[m.id].where.split(" · ")[0],
    }),
  ),
};
