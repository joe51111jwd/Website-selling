import { author, book, faq } from "../content";
import { PyramidMark, Reveal } from "./ui";

export function Author() {
  return (
    <section className="section section-alt author" aria-label="About the author">
      <div className="wrap author-grid">
        <Reveal>
          <p className="eyebrow eyebrow-left">{author.eyebrow}</p>
          <h2 className="headline-left author-title">{author.headline}</h2>
          <p className="author-body">{author.body}</p>
        </Reveal>
        <Reveal className="author-stats" delay={0.1}>
          <div className="callout">
            <span className="callout-big">12 years</span>
            <span className="callout-small">bootstrapping companies</span>
          </div>
          <div className="callout">
            <span className="callout-big">9 years</span>
            <span className="callout-small">in equity research at Morningstar</span>
          </div>
          <div className="callout">
            <span className="callout-big">Austin</span>
            <span className="callout-small">where he writes and builds</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className="section faq" id="faq" aria-label="Questions">
      <div className="wrap">
        <Reveal>
          <h2 className="headline-left">Questions? Answers.</h2>
        </Reveal>
        <div className="faq-list">
          {faq.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>
                {f.q}
                <span className="faq-ico" aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <PyramidMark className="footer-mark" />
          <span>{book.title}</span>
        </div>
        <p className="footer-note">
          Mockup. Copy is drafted from the discovery call and will be replaced with lines from the manuscript. Cover art is a
          placeholder.
        </p>
        <div className="footer-bottom">
          <span>Copyright © 2026 {book.author}. All rights reserved.</span>
          <span className="footer-links">
            <a href="#overview">Overview</a>
            <a href="#bootloader">Bootloader</a>
            <a href="#faq">Questions</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
