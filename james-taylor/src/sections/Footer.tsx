import { SITE, SOURCES } from "../content";
import { PHOTOS } from "../photos";
import { CLIPS } from "../clips";
import { SCANS } from "../scans";

// every credit, once: photos, archive films (one per film, not per clip) and 3D scans
const CREDITS = [
  ...Object.values(PHOTOS).map((p) => p.credit),
  ...Object.values(CLIPS)
    .map((c) => c.credit)
    .filter((c, i, all) => all.findIndex((d) => d.page === c.page) === i),
  ...SCANS.map((s) => ({ ...s, title: `${s.title} (3D scan)` })),
];
import "./Footer.css";

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <p className="foot-name display">James Taylor</p>
        <div className="foot-grid">
          <div>
            <p className="eyebrow">Find him</p>
            <p>
              Executive Chef, {SITE.restaurant}
              <br />
              {SITE.address}
            </p>
            <p>
              <a href={SITE.joyce} target="_blank" rel="noreferrer">
                thejoycerestaurant.com
              </a>
              <br />
              <a href={SITE.instagram} target="_blank" rel="noreferrer">
                @thejoycerestaurant
              </a>
            </p>
          </div>
          <div>
            <p className="eyebrow">Quoted on this page</p>
            <ul className="foot-src">
              {SOURCES.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">The pictures</p>
            <p>
              Photographs, public-domain film from the 1950s and 3D scans of real steaks, all from people who
              share their work openly. Not his plates: those are better seen in person.
            </p>
            <details className="foot-credits">
              <summary>Credits ({CREDITS.length})</summary>
              <ul>
                {CREDITS.map((c) => (
                  <li key={c.page}>
                    <a href={c.page} target="_blank" rel="noreferrer">
                      {c.title}
                    </a>{" "}
                    by {c.author},{" "}
                    {c.licenseUrl ? (
                      <a href={c.licenseUrl} target="_blank" rel="noreferrer">
                        {c.license}
                      </a>
                    ) : (
                      c.license
                    )}
                  </li>
                ))}
              </ul>
              <p className="foot-note">Photos are cropped, cut out or recoloured for the collage; film clips are cut short.</p>
            </details>
          </div>
        </div>
        <p className="foot-base">
          <span>© {new Date().getFullYear()} James Taylor</span>
          <a href="#top">Back to the top ↑</a>
        </p>
      </div>
    </footer>
  );
}
