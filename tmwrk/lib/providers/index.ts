import type { Platform, Track } from "../types";
import { soundcharts } from "./soundcharts";
import { demo } from "./demo";

export type Reading = { date: string; total: number };

export interface Provider {
  name: string;
  /** true when the numbers are made up (demo); every screen and email says so */
  simulated: boolean;
  /** find the provider's id for a song from its ISRC or Spotify track id */
  resolve(q: { isrc?: string; spotifyId?: string }): Promise<{ providerId: string; title?: string; artist?: string } | null>;
  /** cumulative totals per day between two dates (inclusive), oldest first */
  series(track: Track, platform: Platform, start: string, end: string): Promise<Reading[]>;
}

/** Soundcharts when its credentials are set, the labelled simulation otherwise. */
export function provider(): Provider {
  if (process.env.SOUNDCHARTS_APP_ID && process.env.SOUNDCHARTS_API_KEY) return soundcharts;
  return demo;
}
