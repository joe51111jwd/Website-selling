import { Shell } from "@/components/Shell";
import { AddTrack } from "@/components/Forms";
import { Submit } from "@/components/Submit";
import { removeTrack } from "@/app/actions";
import { provider } from "@/lib/providers";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Tracks() {
  const s = store();
  const [tracks, artists] = await Promise.all([s.tracks(), s.artists()]);
  const byArtist = artists.map((a) => ({ a, ts: tracks.filter((t) => t.artistId === a.id).sort((x, y) => (x.year ?? 0) - (y.year ?? 0)) })).filter((x) => x.ts.length);
  return (
    <Shell here="/tracks">
      <h1 className="page-title">Tracks <small>{tracks.length} / 20</small></h1>
      <div className="two">
        <section className="panel">
          <h2>Watching</h2>
          {byArtist.map(({ a, ts }) => (
            <div key={a.id} className="artist">
              <h3>{a.name}</h3>
              <ul className="tracklist">
                {ts.map((t) => (
                  <li key={t.id}>
                    <span><b>{t.title}</b> <span className="muted">{t.year ?? ""}{t.isrc ? ` · ${t.isrc}` : t.spotifyId ? " · Spotify" : ""}</span></span>
                    <form action={removeTrack}><input type="hidden" name="id" value={t.id} /><Submit className="btn btn--text" pending="Removing…">Remove</Submit></form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!tracks.length && <p className="muted">Nothing yet.</p>}
        </section>
        <section className="panel">
          <h2>Add a track</h2>
          <p className="muted">Back catalog welcome: older songs are the ones this is for.</p>
          <AddTrack artists={artists} simulated={provider().simulated} />
        </section>
      </div>
    </Shell>
  );
}
