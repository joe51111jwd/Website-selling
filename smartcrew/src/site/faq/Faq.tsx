// 8 · FAQ (BRIEF §8): five questions, one open at a time, then the final CTA line. STUB: owner fills.

import { FAQ_TITLE } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { Stub } from "../ui/Stub";

export default function Faq() {
  return (
    <Scene id="faq" pinnedViewports={0} label={FAQ_TITLE} className="stub-scene stub-natural">
      <Stub
        id="faq"
        title={FAQ_TITLE}
        note="Stub: Why a call? · Will my crew actually use it? · Does it work with QuickBooks? · How long does setup take? · What does it cost?"
      />
    </Scene>
  );
}
