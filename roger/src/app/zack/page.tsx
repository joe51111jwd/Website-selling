import type { Metadata } from "next";
import Link from "next/link";
import { zackAgents, zackVersion } from "@/data/zack";

export const metadata: Metadata = {
  title: "Run Zack on yourself",
  description: "Zack reviews your past week with your agent and writes up your best plays. It runs in your own account, once.",
};

export default function ZackPage() {
  return (
    <>
      <section className="night page-top" data-tone="night" style={{ paddingBottom: "clamp(4rem, 10vh, 6rem)" }}>
        <div className="wrap">
          <p className="t-eyebrow ink-2">Zack the Collector</p>
          <h1 className="t-display" style={{ marginTop: "1rem", maxWidth: "16ch" }}>Find out what your agent did this week.</h1>
          <p className="t-lead ink-2" style={{ marginTop: "1.5rem", maxWidth: "36rem" }}>
            Zack reviews your past seven days with your agent and writes up your best plays, with identities removed. This free run happens once, in your own account, and sends nothing on its own.
          </p>
        </div>
      </section>
      <section className="chapter ground" data-tone="ground">
        <div className="wrap">
          <h2 className="t-h2">Pick your agent.</h2>
          <div className="two-col" style={{ marginTop: "2.5rem" }}>
            {zackAgents.map((a) => (
              <Link key={a.slug} href={`/zack/${a.slug}`} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem" }}>
                <span>
                  <span className="t-meta ink-2" style={{ display: "block" }}>Zack the Collector for</span>
                  <span className="t-h3" style={{ display: "block", marginTop: "0.2rem" }}>{a.name}</span>
                  <span className="t-meta ink-2" style={{ display: "block", marginTop: "0.3rem" }}>Version {zackVersion}</span>
                </span>
                <span className="link">Start <span aria-hidden="true">›</span></span>
              </Link>
            ))}
          </div>
          <Link href="/zack/other" className="card" style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginTop: "1rem", background: "var(--color-ground-2)" }}>
            <span>
              <span className="t-title" style={{ display: "block" }}>Agent not listed?</span>
              <span className="ink-2" style={{ display: "block", marginTop: "0.3rem" }}>Start from the Hark file and ask your own agent to adapt it.</span>
            </span>
            <span className="link">Start <span aria-hidden="true">›</span></span>
          </Link>
        </div>
      </section>
    </>
  );
}
