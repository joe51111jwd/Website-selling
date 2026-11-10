import Link from "next/link";
import { logout } from "@/app/actions";
import { provider } from "@/lib/providers";
import { Icon, Mark } from "./Icon";

const NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/tracks", label: "Tracks", icon: "tracks" },
  { href: "/outbox", label: "Emails", icon: "mail" },
  { href: "/settings", label: "Alert rules", icon: "rules" },
];

export function Shell({ children, here }: { children: React.ReactNode; here: string }) {
  const sim = provider().simulated;
  return (
    <div className="app">
      <aside className="side">
        <Link href="/" className="logo">
          <Mark />
          <b>TMWRK</b>
          {sim && <span className="badge">Demo data</span>}
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav__item" aria-current={here === n.href ? "page" : undefined}>
              <Icon name={n.icon} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="side__foot">
          {sim && (
            <div className="note">
              <b>Demo data</b>
              <p>The numbers are simulated until a data provider is connected.</p>
              <Link href="/settings#setup" className="btn btn--soft btn--sm">How to connect</Link>
            </div>
          )}
          <form action={logout}>
            <button className="nav__item nav__item--btn"><Icon name="out" />Sign out</button>
          </form>
        </div>
      </aside>
      <main className="panel">
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
