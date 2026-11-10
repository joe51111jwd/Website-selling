export type Platform = "spotify" | "tiktok";
export const PLATFORMS: Platform[] = ["spotify", "tiktok"];

export const PLATFORM_LABEL: Record<Platform, string> = { spotify: "Spotify", tiktok: "TikTok" };
export const UNIT: Record<Platform, string> = { spotify: "streams", tiktok: "new creations" };

export type Artist = { id: string; name: string };

export type Track = {
  id: string;
  artistId: string;
  title: string;
  year?: number;
  isrc?: string;
  spotifyId?: string;
  tiktokSoundUrl?: string;
  /** the provider's own id (Soundcharts song UUID), resolved on add */
  providerId?: string;
  addedAt: string;
};

/** One provider reading: the cumulative total on a date (streams to date, videos to date). */
export type Snapshot = { trackId: string; platform: Platform; date: string; total: number };

export type Thresholds = {
  /** percent growth over the 7-day baseline that counts as a spike */
  minPct: number;
  /** and the absolute daily increase it must also clear */
  minAbs: Record<Platform, number>;
  /** a floor for the baseline, so 0 → 3 isn't +∞% */
  baselineFloor: Record<Platform, number>;
  /** days in the rolling baseline */
  window: number;
  /** a spike that stays at the same level doesn't alert again for this many days */
  cooldownDays: number;
  /** ...unless it grows by this much over the level last alerted */
  escalatePct: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  minPct: 150,
  minAbs: { spotify: 25_000, tiktok: 300 },
  baselineFloor: { spotify: 2_000, tiktok: 20 },
  window: 7,
  cooldownDays: 3,
  escalatePct: 50,
};

export type Alert = {
  id: string; // trackId:platform:date
  trackId: string;
  platform: Platform;
  date: string;
  level: number; // daily activity on the alert day
  baseline: number; // rolling daily average before it
  change: number;
  pct: number;
  sentAt: string;
  delivered: "email" | "outbox";
  simulated: boolean;
};

export type RunLog = { at: string; ok: boolean; source: string; simulated: boolean; snapshots: number; alerts: number; error?: string };
