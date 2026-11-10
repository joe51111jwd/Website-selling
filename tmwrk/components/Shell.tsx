import Link from "next/link";
import { logout, runNow } from "@/app/actions";
import { provider } from "@/lib/providers";
import { store } from "@/lib/store";
import { ago } from "@/lib/view";
import { Submit } from "./Submit";

export async function Shell({ children, here }: { children: React.ReactNode; here: string }) {
  const p = provider();
  const runs = await store().runs(5);
  const ok = runs.find((r) => r.ok);
  const nav = [["/", "Dashboard"], ["/tracks", "Tracks"], ["/outbox", "Alerts sent"], ["/settings", "Settings"]];
  return (
    <div className="shell">
      <header className="top">
        <Link href="/" className="brand" aria-label="TMWRK Roster Intelligence">
          <b>TMWRK</b>
          <span>Roster Intelligence</span>
        </Link>
        <nav className="nav">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} aria-current={here === href ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <div className="status">
          <span className={`source ${p.simulated ? "source--sim" : "source--live"}`} title={p.simulated ? "No data provider connected: these numbers are made up to show the alert logic." : `Live data from ${p.name}`}>
            <i />{p.simulated ? "Simulated data" : p.name}
          </span>
          <span className="updated">{ok ? <>Updated {ago(ok.at)}</> : "No run yet"}</span>
          <form action={runNow}><Submit className="btn btn--ghost" pending="Running…">Run now</Submit></form>
          <form action={logout}><button className="btn btn--text">Log out</button></form>
        </div>
      </header>
      {p.simulated && (
        <p className="simbar">
          <b>Simulated.</b> No music-data provider is connected, so every number here is made up to show how alerts work.
          Add Soundcharts credentials to go live.
        </p>
      )}
      <main className="main">{children}</main>
    </div>
  );
}
