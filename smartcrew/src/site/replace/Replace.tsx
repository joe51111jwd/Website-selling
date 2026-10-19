// 2 · Replace 5 apps: the problem, right after the hero. Andrew's mock, crafted: a dark rounded
// panel on the light ground; kicker, headline, sub; six cards (what SmartCrew covers, and the
// apps it replaces, in their own colours); thin orange lines from every card into one SmartCrew
// box; the small print; the orange button. The lines draw in once when the box comes into view
// (./Wires.tsx + replace.css), then the box lights; nothing loops, nothing pins.
//
// Desktop ≥ 1180 px: six cards in one row, the box under them. 761–1179 px: three cards above the
// box, three below, lines from both rows. Phones: two columns, the box under them, the lines from
// the last row only (they fade in: transform/opacity only on phones), the button full width.

import { useEffect, useRef, useState, type RefObject } from "react";
import { REPLACE } from "../../content/replace";
import { Logo } from "../../brand/Logo";
import { Scene } from "../scene/Scene";
import { Cta, DemoLink } from "../ui/Cta";
import { usePhoneLite } from "../phone";
import { GLASS, OPTIMIZED } from "../../lib/look";
import { HERO4 } from "../../content/copy";
import { AppMark, CardIcon } from "./glyphs";
import { Wires } from "./Wires";
import "./replace.css";
import "./glass.css";
import "./focus.css";

/**
 * True once the wiring is where the visitor is looking. Desktop: the box is mostly on screen (the
 * lines above it are then in view and draw into it). Phones: the cards come into view (the spine
 * runs down through them and fades in).
 */
function useWired(net: RefObject<HTMLElement | null>, hub: RefObject<HTMLElement | null>, phone: boolean) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = phone ? net.current : hub.current;
    if (!el || on) return;
    if (typeof IntersectionObserver === "undefined") {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      phone ? { threshold: 0, rootMargin: "0px 0px -35% 0px" } : { threshold: 0.6, rootMargin: "0px 0px -4% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [net, hub, phone, on]);
  return on;
}

export default function Replace() {
  const net = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLDivElement>(null);
  const phone = usePhoneLite();
  const wired = useWired(net, hub, phone);
  const h = REPLACE.headline;

  return (
    <Scene id="replace" pinnedViewports={0} stage="keep" label={REPLACE.label} className="rp">
      <div className="wrap rp-wrap">
        {/* the optimized look's trimmed first screen moves the hero's sub here, word for word */}
        {OPTIMIZED && <p className="rp-bridge">{HERO4.sub}</p>}
        <div className="rp-panel" data-cursor-tone={GLASS ? undefined : "dark"}>
          <header className="rp-head">
            <p className="rp-kicker">{REPLACE.kicker}</p>
            <h2 className="rp-h2" id="rp-title">
              <span className="rp-h2-lead">{h.lead}</span> <span className="rp-h2-aside">{h.aside}</span>{" "}
              <span className="rp-h2-tail">{h.tail}</span>
            </h2>
            <p className="rp-sub">{REPLACE.sub}</p>
          </header>

          <div className={`rp-net${wired ? " is-wired" : ""}`} ref={net}>
            <Wires />
            <ul className="rp-cards" aria-label={REPLACE.cardsLabel}>
              {REPLACE.cards.map((c) => (
                <li className="rp-card" key={c.id} data-rp-card={c.id} data-testid={`rp-card-${c.id}`}>
                  <span className="rp-ico" data-rp-port="">
                    <CardIcon id={c.id} />
                  </span>
                  <h3 className="rp-name">{c.name}</h3>
                  <p className="rp-line">{c.line}</p>
                  <div className="rp-was">
                    <span className="rp-was-label">{REPLACE.replacesLabel}</span>
                    <ul className="rp-apps">
                      {c.apps.map((a) => (
                        <AppMark key={a.name} app={a} />
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
            <div className="rp-hub" ref={hub} data-rp-hub="" data-testid="rp-hub">
              <Logo className="rp-hub-logo" tone="white" title="SmartCrew" />
              <p className="rp-hub-line">{REPLACE.platform}</p>
            </div>
          </div>

          <div className="rp-fine">
            {REPLACE.fine.map((f) => (
              <p key={f}>{f}</p>
            ))}
          </div>

          <div className="rp-act">
            <Cta source="replace" size="lg" />
            <DemoLink source="replace" className="rp-demo" />
          </div>
        </div>
      </div>
    </Scene>
  );
}
