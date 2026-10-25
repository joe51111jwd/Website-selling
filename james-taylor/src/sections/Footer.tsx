import { SITE, SOURCES } from "../content";
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
            <p className="eyebrow">The dishes</p>
            <p>Modelled, lit and rendered in Blender: every plate on this page is 3D, not a photograph.</p>
          </div>
        </div>
        <p className="foot-base">
          <span>© {new Date().getFullYear()} James Taylor</span>
          <a href="#top">Back to the fire ↑</a>
        </p>
      </div>
    </footer>
  );
}
