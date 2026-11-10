import Link from "next/link";
import { logout } from "@/app/actions";
import { provider } from "@/lib/providers";

const NAV = [
  { href: "/", label: "Today" },
  { href: "/tracks", label: "Tracks" },
  { href: "/outbox", label: "Emails" },
  { href: "/settings", label: "Rules" },
];

export function Shell({ children, here }: { children: React.ReactNode; here: string }) {
  const sim = provider().simulated;
  return (
    <div className="doc">
      <header className="mast">
        <Link href="/" className="mast__name">TMWRK <span>Roster Intelligence</span></Link>
        <nav className="mast__nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={here === n.href ? "page" : undefined}>{n.label}</Link>
          ))}
          <form action={logout}><button>Sign out</button></form>
        </nav>
      </header>
      {sim && <p className="demo">Demo data | No data provider connected | Every number here is simulated</p>}
      <main className="body">{children}</main>
      <footer className="foot">
        <span>TMWRK | Private</span>
        <span>Never miss a moment.</span>
      </footer>
    </div>
  );
}
