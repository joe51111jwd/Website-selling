import { useEffect, useRef, useState } from "react";
import { filaments, products, sizes, stats } from "../content/catalog";

const total = products.reduce((sum, p) => sum + stats(p, sizes[1].mm, filaments[p.filaments[0]]).lineM, 0);

// The wordmark is drawn as one stroke, the way a plotter would write it.
const WORD = "M50 42 C 42 29, 10 28, 10 51 C 10 72, 52 66, 52 89 C 52 113, 15 115, 6 98 M70 36 V100 C 70 108, 76 111, 86 109 M58 60 H86 M102 110 V60 M102 82 C 102 67, 113 59, 128 61 M190 60 V110 M190 85 C 190 70, 178 60, 166 60 C 152 60, 144 72, 144 85 C 144 98, 152 110, 166 110 C 178 110, 190 100, 190 85 M212 110 V60 M212 80 C 212 66, 222 60, 232 60 C 244 60, 252 68, 252 80 V110 M310 30 V110 M310 85 C 310 70, 298 60, 286 60 C 272 60, 264 72, 264 85 C 264 98, 272 110, 286 110 C 298 110, 310 100, 310 85";

export default function Footer() {
  const [drawn, setDrawn] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setDrawn(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <footer className="footer">
      <p className="footer__total">
        Six pieces, <strong>{(total / 1000).toFixed(2)} km</strong> of line. Every metre of it laid down as one strand.
      </p>
      <svg ref={ref} className={`footer__word${drawn ? " is-drawn" : ""}`} viewBox="0 0 320 120" role="img" aria-label="Strand">
        <path d={WORD} pathLength={1} />
      </svg>
      <div className="footer__row mono">
        <a href="mailto:hello@example.com">hello@example.com</a>
        <span>Printed to order in [City]</span>
        <span className="footer__links">
          <a href="#" onClick={(e) => e.preventDefault()}>Instagram</a>
          <a href="#" onClick={(e) => e.preventDefault()}>TikTok</a>
        </span>
        <span>© {new Date().getFullYear()} Strand</span>
      </div>
    </footer>
  );
}
