// Storyboard kit, batch 2. Each idea's HTML defines window.DRAW = { s1(p), s2(p), s3(p) } and this
// kit adds the sketch layer (rough.js), the site lockup, the nav button and the frame border.
(function () {
  const C = { board: '#80817c', screen: '#bebfba', dark: '#2e2e30', ink: '#161616', chalk: '#f2f2ef', red: '#c42a1d', amber: '#f1b02f', brass: '#d9a93e' };
  window.C = C;
  window.W = 1120; window.H = 700;

  window.rng = function (seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const NS = 'http://www.w3.org/2000/svg';
  function Pen(svg, target, seedBox, defaults) {
    const rc = rough.svg(svg);
    const base = Object.assign({ roughness: 1.1, bowing: 1, stroke: C.ink, strokeWidth: 2.2, hachureGap: 7, fillWeight: 1.4 }, defaults || {});
    const o = (x) => Object.assign({}, base, { seed: seedBox.n++ }, x || {});
    const add = (n) => (target.appendChild(n), n);
    const p = {
      rc, svg, target,
      line: (x1, y1, x2, y2, x) => add(rc.line(x1, y1, x2, y2, o(x))),
      rect: (x, y, w, h, opt) => add(rc.rectangle(x, y, w, h, o(opt))),
      circle: (x, y, d, opt) => add(rc.circle(x, y, d, o(opt))),
      ellipse: (x, y, w, h, opt) => add(rc.ellipse(x, y, w, h, o(opt))),
      curve: (pts, opt) => add(rc.curve(pts, o(opt))),
      poly: (pts, opt) => add(rc.polygon(pts, o(opt))),
      lines: (pts, opt) => add(rc.linearPath(pts, o(opt))),
      path: (d, opt) => add(rc.path(d, o(opt))),
      arc: (x, y, w, h, a0, a1, closed, opt) => add(rc.arc(x, y, w, h, a0, a1, closed, o(opt))),
      // a child group with a transform / opacity; returns a pen drawing into it
      g: (attrs) => {
        const el = document.createElementNS(NS, 'g');
        for (const k in attrs || {}) el.setAttribute(k, attrs[k]);
        target.appendChild(el);
        return Pen(svg, el, seedBox, defaults);
      },
      // plain SVG text (for type that is part of the drawn object, e.g. metal type, a printed label)
      text: (x, y, str, a) => {
        const el = document.createElementNS(NS, 'text');
        el.setAttribute('x', x); el.setAttribute('y', y);
        const s = Object.assign({ 'font-family': 'B612', 'font-size': 16, fill: C.ink }, a || {});
        for (const k in s) el.setAttribute(k, s[k]);
        el.textContent = str;
        return add(el);
      },
      // a standing stick figure, feet at (x, y), height h
      person: (x, y, h, opt) => {
        const s = h / 100, w = (opt && opt.strokeWidth) || 2.4;
        const st = Object.assign({ strokeWidth: w }, opt || {});
        p.circle(x, y - 88 * s, 22 * s, Object.assign({ fill: st.headFill || 'none', fillStyle: 'solid' }, st));
        p.line(x, y - 77 * s, x, y - 38 * s, st);
        p.line(x, y - 66 * s, x - 13 * s, y - 42 * s, st);
        p.line(x, y - 66 * s, x + 13 * s, y - 42 * s, st);
        p.line(x, y - 38 * s, x - 10 * s, y, st);
        p.line(x, y - 38 * s, x + 10 * s, y, st);
      },
    };
    return p;
  }
  window.Pen = Pen;

  function build() {
    document.querySelectorAll('.scr').forEach((scr, i) => {
      const dark = scr.classList.contains('dark');
      const sk = document.createElementNS(NS, 'svg');
      sk.setAttribute('class', 'sk'); sk.setAttribute('viewBox', '0 0 1120 700');
      scr.insertBefore(sk, scr.firstChild);
      let site = scr.querySelector('.site');
      if (!site) { site = document.createElement('div'); site.className = 'site'; scr.appendChild(site); }
      if (!scr.hasAttribute('data-nolockup')) {
        const lk = document.createElement('div'); lk.className = 'lockup';
        lk.innerHTML = '<div class="t">Scaling Up-Side-Down</div><div class="by">A book by Michael Wentz</div>'; // label
        site.insertBefore(lk, site.firstChild);
      }
      {
        const nav = document.createElement('div'); nav.className = 'nav'; nav.textContent = 'Get it free'; // label
        site.appendChild(nav);
      }
      const seedBox = { n: 11 + i * 1000 };
      const pen = Pen(sk, sk, seedBox, dark ? { stroke: C.chalk } : null);
      const fn = window.DRAW && window.DRAW[scr.id];
      if (fn) fn(pen, scr);
      // browser bar and frame border on top, so each frame reads as a desktop screen
      const top = document.createElementNS(NS, 'svg');
      top.setAttribute('class', 'top'); top.setAttribute('viewBox', '0 0 1120 700');
      scr.appendChild(top);
      const tp = Pen(top, top, { n: 7 + i });
      const bar = document.createElementNS(NS, 'rect');
      bar.setAttribute('width', 1120); bar.setAttribute('height', 30); bar.setAttribute('fill', '#a7a8a3');
      top.appendChild(bar);
      tp.line(0, 30, 1120, 30, { strokeWidth: 2, roughness: 0.4 });
      [18, 38, 58].forEach((x) => tp.circle(x, 15, 11, { strokeWidth: 1.6, roughness: 0.4 }));
      tp.rect(410, 6, 300, 18, { strokeWidth: 1.4, roughness: 0.4, fill: '#c9cac5', fillStyle: 'solid' });
      tp.text(560, 20, 'scalingupsidedown.com', { 'font-size': 12, 'text-anchor': 'middle', fill: '#3a3a38' }); // label
      tp.rect(2, 2, 1116, 696, { stroke: C.ink, strokeWidth: 3.2, roughness: 0.9 });
    });
    document.documentElement.setAttribute('data-ready', '1');
  }
  window.addEventListener('DOMContentLoaded', () => { document.fonts.ready.then(build); });
})();
