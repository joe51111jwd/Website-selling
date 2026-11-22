import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { letter } from "@/data/v3-copy";

/** Shows the file when it is in public/media and a quiet fallback when it is not. */
const hasFile = (src: string) => existsSync(join(process.cwd(), "public", src));

export function Letter({ lead, more }: { lead?: string; more?: boolean }) {
  const photo = hasFile("media/peter.jpg");
  const signature = hasFile("media/peter-signature.svg");
  return (
    <div className="narrow letter" style={{ marginInline: "auto" }}>
      {lead && <h2 className="t-h2" style={{ marginBottom: "2.5rem" }}>{lead}</h2>}
      <div className="letter-top">
        <span className="avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photo ? <img src="/media/peter.jpg" alt="Peter Kuperman" /> : <span aria-hidden="true">PK</span>}
        </span>
      </div>
      <p>{letter.greeting}</p>
      {letter.paragraphs.map((p) => <p key={p}>{p}</p>)}
      <p className="signature">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {signature ? <img src="/media/peter-signature.svg" alt="Peter" /> : "Peter"}
      </p>
      <p className="t-meta ink-2" style={{ marginTop: "1rem", fontSize: "0.8125rem", lineHeight: 1.5 }}>{letter.byline}</p>
      {more && (
        <p style={{ marginTop: "2rem", fontSize: "1.0625rem" }}>
          <Link href="/about" className="link">About Roger <span aria-hidden="true">›</span></Link>
        </p>
      )}
    </div>
  );
}
