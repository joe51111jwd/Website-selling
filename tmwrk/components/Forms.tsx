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
      <Submit pending="Checking…">Sign in</Submit>
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
        <label>Or a new artist<input name="newArtist" placeholder="Artist name" /></label>
      </div>
      <div className="f2">
        <label>Track title<input name="title" required placeholder="Song title" /></label>
        <label>Release year<input name="year" inputMode="numeric" placeholder="2017" /></label>
      </div>
      <label>ISRC or Spotify link<input name="id" required placeholder="USUM71703861 or https://open.spotify.com/track/…" /></label>
      <label>TikTok sound link <small>(optional, used for the email button)</small><input name="tiktok" placeholder="https://www.tiktok.com/music/…" /></label>
      <div className="form__foot">
        <Submit pending="Looking it up…">Add track</Submit>
        <span className="muted">{simulated ? "Demo data: any valid ISRC or Spotify link works." : "We look it up on Soundcharts before adding it."}</span>
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
        <label>More than usual, at least (%)<input name="minPct" type="number" min="0" step="5" defaultValue={t.minPct} /></label>
        <label>Days that make up “usual”<input name="window" type="number" min="3" max="28" defaultValue={t.window} /></label>
      </div>
      <fieldset>
        <legend>And at least this many more in a day</legend>
        <div className="f2">
          <label>Spotify streams<input name="minAbsSpotify" type="number" min="0" step="1000" defaultValue={t.minAbs.spotify} /></label>
          <label>TikTok videos<input name="minAbsTiktok" type="number" min="0" step="10" defaultValue={t.minAbs.tiktok} /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Lowest “usual” we count (so 2 → 40 isn&apos;t a 20× alert)</legend>
        <div className="f2">
          <label>Spotify<input name="floorSpotify" type="number" min="0" step="500" defaultValue={t.baselineFloor.spotify} /></label>
          <label>TikTok<input name="floorTiktok" type="number" min="0" step="5" defaultValue={t.baselineFloor.tiktok} /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Repeat alerts</legend>
        <div className="f2">
          <label>Days before the same track can alert again<input name="cooldownDays" type="number" min="0" max="30" defaultValue={t.cooldownDays} /></label>
          <label>Unless it grows again by (%)<input name="escalatePct" type="number" min="0" step="10" defaultValue={t.escalatePct} /></label>
        </div>
      </fieldset>
      <div className="form__foot"><Submit pending="Saving…">Save rules</Submit></div>
      {s?.ok && <p className="ok" role="status">{s.ok}</p>}
    </form>
  );
}
