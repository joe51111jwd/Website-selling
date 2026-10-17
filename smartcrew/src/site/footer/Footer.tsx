// Footer (BRIEF §8, PLAYBOOK S10): quiet, on the night ground. The logo (no dashed fence round it:
// "no random polygons"), contact, log in, privacy/terms, the trademark and demo notes, and the XDR
// model credit only if a scene shows it.

import { useEffect, useRef, useState } from "react";
import { FLAG, FOOTER_SCENE } from "../../content/copy";
import { config } from "../../config";
import { Logo } from "../../brand/Logo";
import { devicesInUse, onStageChange } from "../../three/stage/store";
import { Scene } from "../scene/Scene";
import { useSeen } from "../offer/useSeen";
import "./footer.css";
import "./glass.css";
import "./focus.css";

/** True once any scene's keys show the Pro Display XDR (its CC-BY licence asks for the credit). */
function useXdrInUse() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => setOn(devicesInUse().has("display"));
    check();
    return onStageChange(check);
  }, []);
  return on;
}

export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const seen = useSeen(root, 0.4);
  const xdr = useXdrInUse();

  return (
    // stage="keep": the devices the close brought back simply scroll away under the footer
    <Scene id="footer" pinnedViewports={0} stage="keep" label="Footer" className="ftr-scene">
      <footer
        className={`ftr${seen ? " is-seen" : ""}`}
        ref={root}
        data-cursor-tone="dark"
      >
        <div className="wrap ftr-in">
          <div className="ftr-top">
            <div className="ftr-brand">
              <a
                className="ftr-logo"
                href="#top"
                aria-label="SmartCrew, back to the top"
              >
                <span className="ftr-mark">
                  <Logo className="ftr-mark-svg" variant="mark" decorative />
                </span>
                <Logo
                  className="ftr-word"
                  variant="wordmark"
                  tone="white"
                  decorative
                />
              </a>
              <p className="ftr-tag" data-cursor="text">{FOOTER_SCENE.tagline}</p>
            </div>
            <ul className="ftr-links">
              <li>
                <a href={`mailto:${FOOTER_SCENE.email}`}>
                  {FOOTER_SCENE.email}
                </a>
              </li>
              <li>
                <a href={config.loginUrl}>{FOOTER_SCENE.login}</a>
              </li>
            </ul>
          </div>

          <div className="ftr-base">
            <ul className="ftr-legal">
              <li>
                {/* ⚑ the live pages predate this flow (SMS consent, the free-trial sign-up) */}
                <a href={config.privacyUrl}>
                  {FOOTER_SCENE.privacy}
                  <span
                    className="flag"
                    title="Andrew/counsel: update for the new trial flow"
                  >
                    {FLAG}
                  </span>
                </a>
              </li>
              <li>
                <a href={config.termsUrl}>
                  {FOOTER_SCENE.terms}
                  <span
                    className="flag"
                    title="Andrew/counsel: update for the new trial flow"
                  >
                    {FLAG}
                  </span>
                </a>
              </li>
              <li className="ftr-copy">{FOOTER_SCENE.copyright}</li>
            </ul>
            <p className="ftr-notes" data-cursor="text">
              {FOOTER_SCENE.demo} {FOOTER_SCENE.trademarks}
              {xdr && <> {FOOTER_SCENE.xdr}</>}
            </p>
          </div>
        </div>
      </footer>
    </Scene>
  );
}
