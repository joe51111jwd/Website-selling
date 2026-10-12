// 7 · Andrew + the offer (BRIEF §7): his face, three lines of his story, and the offer as a ledger
// (what you get vs. what it costs you: one call). STUB: owner fills.

import { OFFER } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { Stub } from "../ui/Stub";
import { Cta } from "../ui/Cta";

export default function Offer() {
  return (
    <Scene id="offer" pinnedViewports={1} label="Andrew and the offer" className="stub-scene">
      <Stub id="offer" title={OFFER.andrew} note={`Stub: the ledger. It costs you: ${OFFER.costs}`} />
      <div className="wrap">
        <Cta source="offer" />
      </div>
    </Scene>
  );
}
