import { Bento } from "@/components/Bento";
import { Shell } from "@/components/Shell";
import { bento } from "@/lib/bento";
import { collect } from "@/lib/collect";
import { link } from "@/lib/email";
import { provider } from "@/lib/providers";
import { store } from "@/lib/store";
import { dashboard } from "@/lib/view";

export const dynamic = "force-dynamic";

export default async function Home() {
  // first visit with no provider: load the demo roster so there is something to look at
  if (provider().simulated && (await store().isEmpty())) await collect();
  const d = await dashboard();
  return (
    <Shell here="/" wide>
      <Bento b={bento(d, (r, p) => link(r.track, p))} />
    </Shell>
  );
}
