import Link from "next/link";
import { logout } from "@/app/actions";
import { provider } from "@/lib/providers";
import { Mark } from "./Icon";

const NAV = [
  { href: "/", label: "Today" },
  { href: "/tracks", label: "Tracks" },
  { href: "/outbox", label: "Emails" },
  { href: "/settings", label: "Rules" },
];

export function Shell({ children, here, wide = false }: { children: React.ReactNode; here: string; wide?: boolean }) {
  const sim = provider().simulated;
  return (
    <div className="app">
      <header className="bar">
        <Link href="/" className="logo"><Mark /><b>TMWRK</b>{sim && <span className="badge">Demo data</span>}</Link>
        <nav className="seg seg--nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={here === n.href ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
        <form action={logout} className="bar__out"><button className="btn--text">Sign out</button></form>
      </header>
      <main className={wide ? "page page--wide" : "page"}>{children}</main>
    </div>
  );
}
