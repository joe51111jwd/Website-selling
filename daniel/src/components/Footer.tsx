import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { site } from "../content/site";
import { useFitText } from "../lib/hooks";
import { clamp, ease, isTouch, lenis, onTick, reducedMotion } from "../lib/ticker";
import { pointer } from "../lib/cursor";
import { Clock } from "./Chrome";
import { Magnetic } from "./Magnetic";
import { Label, Reveal, Roll } from "./Text";

export function Arrow({ className }: { className?: string }) {
  return (
    <svg className={`arrow${className ? ` ${className}` : ""}`} viewBox="0 0 24 24" aria-hidden>
      <path d="M5 19 19 5M8 5h11v11" />
    </svg>
  );
}

function CopyEmail() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="copy-email"
      data-cursor="copy"
      data-cursor-label={copied ? "Copied" : "Copy"}
      onClick={() => {
        navigator.clipboard?.writeText(site.email).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
    >
      <Roll>{site.email}</Roll>
      <span className="copy-email-note" aria-live="polite">
        {copied ? "Copied to clipboard" : "Click to copy"}
      </span>
    </button>
  );
}

/**
 * The name, edge to edge, at the very bottom. Letters swell toward the
 * pointer: weight and width both follow distance.
 */
function BigName() {
  const ref = useRef<HTMLDivElement>(null);
  const size = useFitText(ref);
  const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  useEffect(() => {
    if (isTouch || reducedMotion) return;
    return onTick(() => {
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;
      el.querySelectorAll<HTMLElement>(".big-letter").forEach((letter) => {
        const r = letter.getBoundingClientRect();
        const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
        const t = pointer.active ? clamp(1 - d / (window.innerWidth * 0.32)) : 0;
        const k = t * t * (3 - 2 * t);
        const prev = Number(letter.dataset.k ?? 0);
        const next = prev + (k - prev) * 0.12;
        letter.dataset.k = String(next);
        letter.style.fontVariationSettings = `"wght" ${Math.round(460 + next * 240)}, "wdth" ${(100 - next * 22).toFixed(1)}`;
      });
    });
  }, []);

  return (
    <div className="big-name" ref={ref} style={{ fontSize: size || undefined }} aria-hidden data-x="div.big-name">
      <span className="fit-probe big-name-probe" data-fit-probe>
        {site.name}
      </span>
      <span className="big-name-row">
        {[...site.name].map((ch, i) => (
          <span className="mask" key={i}>
            <motion.span
              className="big-letter"
              initial={{ y: "100%" }}
              animate={seen ? { y: "0%" } : undefined}
              transition={{ duration: 1.2, ease, delay: i * 0.06 }}
            >
              {ch}
            </motion.span>
          </span>
        ))}
      </span>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer" id="contact" data-theme="paper" data-x="footer#contact">
      <div className="wrap">
        <Label index="05">Contact</Label>
        <div className="footer-cta">
          <Reveal as="h2" className="footer-title" text="Have a project *in mind?*" />
          <Magnetic strength={0.28} className="footer-cta-btn">
            <a className="cta-circle" href={`mailto:${site.email}`}>
              <span>Let's talk</span>
              <Arrow />
            </a>
          </Magnetic>
        </div>
        <div className="footer-grid">
          <div>
            <p className="label">Email</p>
            <CopyEmail />
          </div>
          <div>
            <p className="label">Elsewhere</p>
            <ul className="footer-socials">
              {site.socials.map((s) => (
                <li key={s.label}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      <Roll>{s.label}</Roll>
                    </a>
                  ) : (
                    <span>{s.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">Local time</p>
            <p>
              {site.location}
              <br />
              <Clock />
            </p>
          </div>
          <div>
            <p className="label">Availability</p>
            <p>
              <span className="dot" /> {site.availability}
            </p>
          </div>
        </div>
      </div>
      <BigName />
      <div className="wrap footer-base">
        <span>
          © {year} {site.name}
        </span>
        <span className="footer-hint">
          Press <kbd>S</kbd> to see how it's built
        </span>
        <button type="button" onClick={() => lenis.scrollTo(0, { duration: 2 })}>
          <Roll>Back to top</Roll> ↑
        </button>
      </div>
    </footer>
  );
}
