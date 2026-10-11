import { useEffect, useRef, useState } from "react";
import { filaments, products, sizes, stats } from "../content/catalog";
import Logo from "./Logo";

const total = products.reduce((sum, p) => sum + stats(p, sizes[1].mm, filaments[p.filaments[0]]).lineM, 0);

// The logo is drawn as one line, the way a nozzle would trace it, then filled in.
export default function Footer() {
  const [drawn, setDrawn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
      <div ref={ref} className={`footer__mark${drawn ? " is-drawn" : ""}`}>
        <Logo />
      </div>
      <div className="footer__row mono">
        <a href="mailto:hello@example.com">hello@example.com</a>
        <span>Printed to order in [City]</span>
        <span className="footer__links">
          <a href="#" onClick={(e) => e.preventDefault()}>Instagram</a>
          <a href="#" onClick={(e) => e.preventDefault()}>TikTok</a>
        </span>
        <span>© {new Date().getFullYear()} VAYN3D</span>
      </div>
    </footer>
  );
}
