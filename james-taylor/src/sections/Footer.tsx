import { SITE, SOURCES } from "../content";
import { PHOTOS } from "../photos";
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
              Places, ingredients and fire, from photographers who share their work openly. Not his plates:
              those are better seen in person.
            </p>
            <details className="foot-credits">
              <summary>Photo credits ({Object.keys(PHOTOS).length})</summary>
              <ul>
                {Object.entries(PHOTOS).map(([id, p]) => (
                  <li key={id}>
                    <a href={p.credit.page} target="_blank" rel="noreferrer">
                      {p.credit.title}
                    </a>{" "}
                    by {p.credit.author},{" "}
                    {p.credit.licenseUrl ? (
                      <a href={p.credit.licenseUrl} target="_blank" rel="noreferrer">
                        {p.credit.license}
                      </a>
                    ) : (
                      p.credit.license
                    )}
                  </li>
                ))}
              </ul>
              <p className="foot-note">Some are cropped, cut out or recoloured for the collage.</p>
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
