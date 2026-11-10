// npm run success-test — the brief's acceptance test, end to end on the simulated data:
// an older DRAMA track spikes on TikTok while Spotify stays flat, and the right email is produced.
import { compose } from "../lib/email";
import { latest } from "../lib/detect";
import { simulate } from "../lib/providers/demo";
import { DEFAULT_THRESHOLDS as T, type Alert } from "../lib/types";

const sim = simulate("2026-11-10");
const track = sim.tracks.find((t) => t.id === "drama-2017")!;
const snaps = sim.snapshots.filter((s) => s.trackId === track.id);
const tk = latest(snaps, "tiktok", T)!, sp = latest(snaps, "spotify", T)!;
console.log(`TikTok:  ${Math.round(tk.level)} today vs ${Math.round(tk.baseline)}/day → ${tk.spike ? "SPIKE" : "no spike"}`);
console.log(`Spotify: ${Math.round(sp.level)} today vs ${Math.round(sp.baseline)}/day → ${sp.spike ? "SPIKE" : "flat"}`);
const a: Alert = { id: "success-test", trackId: track.id, platform: "tiktok", date: tk.date, level: tk.level, baseline: tk.baseline, change: tk.change, pct: tk.pct, sentAt: new Date().toISOString(), delivered: "outbox", simulated: true };
const m = compose(a, track, sim.artists[0], { platform: "spotify", level: sp.level, baseline: sp.baseline });
console.log("\n" + m.text);
process.exit(tk.spike && !sp.spike ? 0 : 1);
