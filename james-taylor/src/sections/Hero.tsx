import { useEffect, useRef } from "react";
import { SITE } from "../content";
import { BroilerFire } from "../ui/BroilerFire";
import { Cutout, Doodle, Label, Note, Piece, Print, Scrap, Spread, Torn } from "../ui/collage";
import { markHeroReady, reducedMotion } from "../lib/motion";
import "./Hero.css";

const NAME = ["James", "Taylor"];
// paper for each letter chip, so the name reads like it was cut from a dozen different sheets
const CHIPS = ["n", "k", "b", "e", "n", "b", "n", "e", "k", "n", "b"];

/** The cover: the paper is torn open on the broiler (live flames, the pointer fans them), the name is
 * stuck on in cut-out letters, and the first bits of the story are lying around. Pick them up. */
export function Hero({ ready }: { ready: boolean }) {
  const heat = useRef(0);
  const pointer = useRef({ x: 0.5, y: 0.2, stir: 0 });
  const fire = useRef<HTMLDivElement>(null);

  // the broiler lights once the page is ready, then breathes
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    const t0 = performance.now();
    const calm = reducedMotion();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      const ignite = Math.min(1, t / 1.6);
      const breathe = calm ? 0 : 0.05 * Math.sin(t * 0.9) + 0.03 * Math.sin(t * 2.3);
      heat.current = (0.5 + breathe) * (1 - Math.pow(1 - ignite, 3));
      pointer.current.stir *= 0.94;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  const onMove = (e: React.PointerEvent) => {
    const r = fire.current?.getBoundingClientRect();
    if (!r) return;
    const p = pointer.current;
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const speed = Math.hypot(x - p.x, y - p.y);
    p.x = x;
    p.y = y;
    p.stir = Math.min(1, p.stir + speed * 6 + 0.02);
  };


  let k = 0;
  return (
    <Spread id="top" className={`hero ${ready ? "in" : ""}`} label="James Taylor">
      <div className="hero-fire" ref={fire} onPointerMove={onMove}>
        <BroilerFire heat={heat} pointer={pointer} />
      </div>
      <div className="hero-sheet paper" onPointerMove={onMove}>
        <Torn edge="top" color="var(--paper)" seed={7} depth={40} />
      </div>

      <div className="hero-title">
        <Label className="hero-role">
          Executive chef · {SITE.restaurant} · Miami Beach
        </Label>
        <h1 className="hero-name" aria-label="James Taylor">
          {NAME.map((word) => (
            <span className="hero-word" key={word} aria-hidden>
              {word.split("").map((ch) => {
                const i = k++;
                return (
                  <span
                    key={i}
                    className={`chip chip-${CHIPS[i % CHIPS.length]}`}
                    style={{ ["--i" as string]: i, ["--t" as string]: `${((i * 47) % 9) - 4}deg` }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>
      </div>

      <Piece at={{ x: 63, y: 9, w: 33, r: 7, z: 6 }} m={{ x: 36, y: 40, w: 70, r: 8, z: 6 }} depth={0.35} drag order={1}>
        <Cutout id="rib-raw" eager onLoad={markHeroReady} />
      </Piece>
      <Piece at={{ x: 51, y: 13, w: 12, r: -6, z: 7 }} m={{ x: 0, y: 0, w: 0 }} depth={0.5} className="hero-pick desk">
        <Note color="bone">go on, pick things up</Note>
        <Doodle kind="arrow" color="bone" className="hero-pick-arrow" width={4} />
      </Piece>
      <Piece at={{ x: 4, y: 63, w: 21, r: -5, z: 4 }} m={{ x: 2, y: 60, w: 50, r: -5, z: 4 }} depth={0.12} drag order={3}>
        <Print id="chicago" frame="border" caption="Chicago, where he learned" tape="top" />
      </Piece>
      <Piece at={{ x: 76, y: 55, w: 16, r: 6, z: 5 }} m={{ x: 55, y: 63, w: 42, r: 6, z: 5 }} depth={0.22} drag order={4}>
        <Print id="embers" frame="polaroid" caption="the broiler: about 900°" tape="none" />
      </Piece>
      <Piece at={{ x: 33, y: 73, w: 34, r: 1.5, z: 4 }} m={{ x: 4, y: 81, w: 70, r: 1.5, z: 4 }} depth={0.06} order={2}>
        <Scrap tone="white" className="hero-line">
          <p className="type">{SITE.line}</p>
          <p className="hero-line-sub hand">TGI Fridays at five. Alinea. Now his own dining room on Española Way.</p>
        </Scrap>
      </Piece>
    </Spread>
  );
}
