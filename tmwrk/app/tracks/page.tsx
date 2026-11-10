import Link from "next/link";
import { Shell } from "@/components/Shell";
import { AddTrack } from "@/components/Forms";
import { Submit } from "@/components/Submit";
import { removeTrack } from "@/app/actions";
import { provider } from "@/lib/providers";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Tracks({ searchParams }: { searchParams: Promise<{ artist?: string }> }) {
  const { artist } = await searchParams;
  const s = store();
  const [tracks, artists] = await Promise.all([s.tracks(), s.artists()]);
  const order = (id: string) => artists.findIndex((a) => a.id === id);
  const shown = tracks.filter((t) => !artist || t.artistId === artist).sort((a, b) => order(a.artistId) - order(b.artistId) || (a.year ?? 0) - (b.year ?? 0));
  const name = (id: string) => artists.find((a) => a.id === id)?.name ?? id;
  return (
    <Shell here="/tracks">
      <header className="head">
        <div>
          <h1>Tracks</h1>
          <p className="head__sub">{tracks.length} of 20 watched</p>
        </div>
        <a href="#add" className="btn">Add track</a>
      </header>

      <section className="hero">
        <h2>Add a song to watch.</h2>
        <p>Paste its ISRC or Spotify link. Older songs are the point: the check reads every one each morning, however old.</p>
      </section>
      <section className="card" id="add" style={{ marginTop: 12 }}>
        <AddTrack artists={artists} simulated={provider().simulated} />
      </section>

      <nav className="tabs" style={{ marginTop: 36 }} aria-label="Filter by artist">
        <Link href="/tracks" aria-current={!artist ? "page" : undefined}>All</Link>
        {artists.map((a) => (
          <Link key={a.id} href={`/tracks?artist=${a.id}`} aria-current={artist === a.id ? "page" : undefined}>{a.name}</Link>
        ))}
      </nav>
      <ul className="list tlist">
        {shown.map((t) => (
          <li key={t.id}>
            <Link href={`/track/${t.id}`}>
              <b>{t.title}</b> <span>{name(t.artistId)}{t.year ? ` · ${t.year}` : ""}{t.isrc ? ` · ${t.isrc}` : t.spotifyId ? " · Spotify link" : ""}</span>
            </Link>
            <form action={removeTrack}>
              <input type="hidden" name="id" value={t.id} />
              <Submit className="btn btn--text" pending="Removing…">Remove</Submit>
            </form>
          </li>
        ))}
        {!shown.length && <li className="empty">No tracks here yet.</li>}
      </ul>
    </Shell>
  );
}
