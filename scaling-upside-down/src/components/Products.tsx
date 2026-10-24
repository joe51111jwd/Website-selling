import { useEffect, useState } from "react";
import { products } from "../content";
import { drawCover, drawSpine, fontsReady } from "../cover";
import { Chevron, Reveal } from "./ui";

/** "Read it. Then run it." Two product tiles side by side, like Apple's accessories row. */

function useCoverArt() {
  const [art, setArt] = useState<{ front: string; spine: string } | null>(null);
  useEffect(() => {
    let gone = false;
    fontsReady().then(() => {
      if (gone) return;
      setArt({ front: drawCover(720, 1080).toDataURL("image/jpeg", 0.92), spine: drawSpine(164, 1080).toDataURL("image/jpeg", 0.92) });
    });
    return () => {
      gone = true;
    };
  }, []);
  return art;
}

function BookObject() {
  const art = useCoverArt();
  return (
    <div className="bookobj" aria-hidden="true">
      <div className="bookobj-3d">
        <div className="bookobj-front" style={art ? { backgroundImage: `url(${art.front})` } : undefined} />
        <div className="bookobj-spine" style={art ? { backgroundImage: `url(${art.spine})` } : undefined} />
        <div className="bookobj-pages" />
      </div>
    </div>
  );
}

function FileObject() {
  return (
    <div className="fileobj" aria-hidden="true">
      <div className="fileobj-sheet">
        <div className="fileobj-bar">
          <i />
          <i />
          <i />
          <span>scaling-upside-down.md</span>
        </div>
        <pre>
          <b># Bootloader</b>
          {"\n"}
          <em>## Entry points</em>
          {"\n| You ask about     | Route to        |\n|-------------------|-----------------|\n| hiring            | Roles           |\n| a plateau         | Complexity      |\n| AI output         | Review cost     |\n\n"}
          <em>## Floors and ceilings</em>
          {"\nsolopreneur_floor: 1\nteam_ceiling:      12\nteam_of_teams:     40-70\n\n"}
          <em>## Guardrails</em>
          {"\n- Stay inside the framework.\n- Route before you answer."}
        </pre>
      </div>
    </div>
  );
}

export function Products() {
  return (
    <section className="section products" id="buy" aria-label="Get it">
      <Reveal className="wrap">
        <h2 className="headline headline-md">{products.headline}</h2>
      </Reveal>
      <div className="wrap tile-row">
        {[
          { ...products.book, visual: <BookObject />, href: "#buy" },
          { ...products.file, visual: <FileObject />, href: "#bootloader" },
        ].map((p, i) => (
          <Reveal className="tile" key={p.name} delay={i * 0.08}>
            <p className="tile-meta">{p.meta}</p>
            <h3 className="tile-name">{p.name}</h3>
            <p className="tile-text">{p.text}</p>
            <a className="link" href={p.href}>
              {p.link} <Chevron />
            </a>
            <div className="tile-visual">{p.visual}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
