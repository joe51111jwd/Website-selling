import { describe, expect, it } from "vitest";
import { dailyRates, latest, shouldAlert } from "../lib/detect";
import { DEFAULT_THRESHOLDS as T, type Snapshot } from "../lib/types";
import { simulate } from "../lib/providers/demo";

const cum = (platform: "spotify" | "tiktok", rates: number[], start = "2026-10-01", every = 1): Snapshot[] => {
  const out: Snapshot[] = [];
  let total = 1_000_000;
  const t0 = Date.parse(start + "T00:00:00Z");
  out.push({ trackId: "t", platform, date: start, total });
  rates.forEach((r, i) => {
    total += r;
    if ((i + 1) % every === 0 || i === rates.length - 1)
      out.push({ trackId: "t", platform, date: new Date(t0 + (i + 1) * 86_400_000).toISOString().slice(0, 10), total });
  });
  return out;
};

describe("dailyRates", () => {
  it("spreads a gap evenly across the missing days", () => {
    const d = dailyRates([{ date: "2026-11-01", total: 100 }, { date: "2026-11-03", total: 300 }]);
    expect(d).toEqual([{ date: "2026-11-02", rate: 100 }, { date: "2026-11-03", rate: 100 }]);
  });
  it("treats a downward correction as no activity", () => {
    expect(dailyRates([{ date: "2026-11-01", total: 100 }, { date: "2026-11-02", total: 90 }])[0].rate).toBe(0);
  });
});

describe("spike detection", () => {
  it("fires on the brief's example: 50/day → 1,000 in 24h on TikTok", () => {
    const r = latest(cum("tiktok", [50, 50, 50, 50, 50, 50, 50, 1000]), "tiktok", T)!;
    expect(r.spike).toBe(true);
    expect(Math.round(r.baseline)).toBe(50);
    expect(Math.round(r.change)).toBe(950);
    expect(Math.round(r.pct)).toBe(1900);
  });
  it("ignores a big percentage on a tiny base (absolute bar)", () => {
    expect(latest(cum("tiktok", [2, 3, 2, 1, 2, 3, 2, 40]), "tiktok", T)!.spike).toBe(false);
  });
  it("ignores a big absolute move that is ordinary for a hit (percentage bar)", () => {
    expect(latest(cum("spotify", Array(7).fill(400_000).concat(460_000)), "spotify", T)!.spike).toBe(false);
  });
  it("needs some history before it judges", () => {
    expect(latest(cum("tiktok", [50, 1000]), "tiktok", T)!.spike).toBe(false);
  });
  it("works when TikTok only refreshes every other day", () => {
    const r = latest(cum("tiktok", [50, 50, 50, 50, 50, 50, 50, 50, 1500, 1500], "2026-10-01", 2), "tiktok", T)!;
    expect(r.spike).toBe(true);
  });
});

describe("duplicates", () => {
  const r = { date: "2026-11-09", level: 1000, baseline: 50, change: 950, pct: 1900, spike: true, ready: true };
  it("never sends the same event twice", () => {
    expect(shouldAlert(r, [{ date: "2026-11-09", level: 1000 }], T)).toBe(false);
  });
  it("holds a spike that is still running at the same level", () => {
    expect(shouldAlert({ ...r, date: "2026-11-10", level: 1100 }, [{ date: "2026-11-09", level: 1000 }], T)).toBe(false);
  });
  it("alerts again when the spike keeps growing", () => {
    expect(shouldAlert({ ...r, date: "2026-11-10", level: 2400 }, [{ date: "2026-11-09", level: 1000 }], T)).toBe(true);
  });
  it("alerts again after the cooldown", () => {
    expect(shouldAlert({ ...r, date: "2026-11-15" }, [{ date: "2026-11-09", level: 1000 }], T)).toBe(true);
  });
});

describe("the brief's success test (simulated)", () => {
  it("an older DRAMA track's TikTok spike alerts while its Spotify stays flat", () => {
    const sim = simulate("2026-11-10");
    const track = sim.tracks.find((t) => t.id === "drama-2017")!;
    const snaps = sim.snapshots.filter((s) => s.trackId === track.id);
    const tiktok = latest(snaps, "tiktok", T)!;
    const spotify = latest(snaps, "spotify", T)!;
    expect(tiktok.spike).toBe(true);
    expect(spotify.spike).toBe(false);
    expect(Math.abs(spotify.pct)).toBeLessThan(25);
  });
});
