// Footer (BRIEF §8): contact, privacy/terms, trademark note, model credits. STUB: owner fills.

import { FOOTER, T } from "../../content/copy";
import { Scene } from "../scene/Scene";

export default function Footer() {
  return (
    <Scene id="footer" pinnedViewports={0} label="Footer" className="stub-scene stub-natural">
      <footer className="wrap stub-footer t-small">
        <p>
          <a href={`mailto:${T.EMAIL}`}>{T.EMAIL}</a>
        </p>
        <p>{FOOTER.trademarks}</p>
      </footer>
    </Scene>
  );
}
