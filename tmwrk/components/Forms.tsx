"use client";

import { useActionState } from "react";
import { addTrack, login, saveThresholds } from "@/app/actions";
import type { Artist, Thresholds } from "@/lib/types";
import { Submit } from "./Submit";

type Res = { error?: string; ok?: string } | undefined;

export function LoginForm({ next }: { next?: string }) {
  const [s, act] = useActionState<Res, FormData>(login as never, undefined);
  return (
    <form action={act} className="login__form">
      <input type="hidden" name="next" value={next ?? "/"} />
      <label htmlFor="pw">Team password</label>
      <input id="pw" name="password" type="password" autoComplete="current-password" required autoFocus />
      <Submit pending="Checking…">Enter</Submit>
      {s?.error && <p className="err" role="alert">{s.error}</p>}
    </form>
  );
}

export function AddTrack({ artists, simulated }: { artists: Artist[]; simulated: boolean }) {
  const [s, act] = useActionState<Res, FormData>(addTrack as never, undefined);
  return (
    <form action={act} className="form">
      <div className="f2">
        <label>Artist
          <select name="artist" defaultValue={artists[0]?.id}>
            {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label>…or a new artist<input name="newArtist" placeholder="Artist name" /></label>
      </div>
      <div className="f2">
        <label>Track title<input name="title" required placeholder="Song title" /></label>
        <label>Release year<input name="year" inputMode="numeric" placeholder="2017" /></label>
      </div>
      <label>ISRC or Spotify link<input name="id" required placeholder="USUM71703861 or https://open.spotify.com/track/…" /></label>
      <label>TikTok sound link <small>(optional, for the email’s button)</small><input name="tiktok" placeholder="https://www.tiktok.com/music/…" /></label>
      <div className="form__foot">
        <Submit pending="Looking it up…">Watch this track</Submit>
        <span className="muted">{simulated ? "Simulated mode: any valid ISRC or link is accepted." : "Looked up on Soundcharts before it is added."}</span>
      </div>
      {s?.error && <p className="err" role="alert">{s.error}</p>}
      {s?.ok && <p className="ok" role="status">{s.ok}</p>}
    </form>
  );
}

export function ThresholdsForm({ t }: { t: Thresholds }) {
  const [s, act] = useActionState<Res, FormData>(saveThresholds as never, undefined);
  return (
    <form action={act} className="form">
      <div className="f2">
        <label>Growth over the baseline (%)<input name="minPct" type="number" min="0" step="5" defaultValue={t.minPct} /></label>
        <label>Baseline window (days)<input name="window" type="number" min="3" max="28" defaultValue={t.window} /></label>
      </div>
      <fieldset>
        <legend>…and at least this many more per day</legend>
        <div className="f2">
          <label>Spotify streams<input name="minAbsSpotify" type="number" min="0" step="1000" defaultValue={t.minAbs.spotify} /></label>
          <label>TikTok videos<input name="minAbsTiktok" type="number" min="0" step="10" defaultValue={t.minAbs.tiktok} /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Baseline floor (so 2 → 40 isn&apos;t +1,900%)</legend>
        <div className="f2">
          <label>Spotify<input name="floorSpotify" type="number" min="0" step="500" defaultValue={t.baselineFloor.spotify} /></label>
          <label>TikTok<input name="floorTiktok" type="number" min="0" step="5" defaultValue={t.baselineFloor.tiktok} /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Repeats</legend>
        <div className="f2">
          <label>Quiet days after an alert<input name="cooldownDays" type="number" min="0" max="30" defaultValue={t.cooldownDays} /></label>
          <label>…unless it grows by (%)<input name="escalatePct" type="number" min="0" step="10" defaultValue={t.escalatePct} /></label>
        </div>
      </fieldset>
      <div className="form__foot"><Submit pending="Saving…">Save thresholds</Submit></div>
      {s?.ok && <p className="ok" role="status">{s.ok}</p>}
    </form>
  );
}
