/* Shared storyboard engine. Each idea's HTML calls board({...}) with its rank, title and three frames.
   A frame = a 1120x700 desktop screen: a rough.js sketch (the idea's object) under the site layer
   (title lockup, the Get it free button, and the line of Michael for that beat, in the project fonts). */
/* global rough */
const NS = 'http://www.w3.org/2000/svg';
const C = { ink: '#161616', red: '#c42a1d', screen: '#bebfba', chalk: '#f2f2ef', sheet: '#e3e3df', mid: '#9c9d98', dark: '#3a3b39', soft: '#6d6e6a' };
const FW = 1120, FH = 700, BAR = 30;
let SEED = 7;
const SITE = {
  byline: 'A book by Michael Wentz', // label
  button: 'Get it free', // label
  facts: 'SUSD Bootloader · a file for your AI · v16 · 35,445 words · free, by email', // label
  book: 'Pre-order the book', // label
};

function el(tag, cls, parent, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  if (parent) parent.appendChild(n);
  return n;
}

// A small sketch kit bound to one svg: rough shapes with the house defaults, plus svg text.
function kit(svg) {
  const rc = rough.svg(svg);
  let parent = svg;
  const base = (o = {}) => Object.assign({ stroke: C.ink, strokeWidth: 2, roughness: 1.1, bowing: 0.8, seed: SEED++, hachureGap: 7, fillWeight: 1.2 }, o);
  const put = (n) => { parent.appendChild(n); return n; };
  const F = {
    rc, C,
    r: (x, y, w, h, o) => put(rc.rectangle(x, y, w, h, base(o))),
    l: (x1, y1, x2, y2, o) => put(rc.line(x1, y1, x2, y2, base(o))),
    c: (cx, cy, d, o) => put(rc.circle(cx, cy, d, base(o))),
    e: (cx, cy, w, h, o) => put(rc.ellipse(cx, cy, w, h, base(o))),
    p: (d, o) => put(rc.path(d, base(o))),
    poly: (pts, o) => put(rc.polygon(pts, base(o))),
    lin: (pts, o) => put(rc.linearPath(pts, base(o))),
    curve: (pts, o) => put(rc.curve(pts, base(o))),
    arc: (cx, cy, w, h, a0, a1, closed, o) => put(rc.arc(cx, cy, w, h, a0, a1, closed, base(o))),
    // plain svg text for printed things that belong to the object (dial numbers, labels on a plate)
    t: (x, y, str, o = {}) => {
      const n = document.createElementNS(NS, 'text');
      n.setAttribute('x', x); n.setAttribute('y', y);
      n.setAttribute('font-family', o.font || 'B612');
      n.setAttribute('font-weight', o.weight || 400);
      n.setAttribute('font-size', o.size || 16);
      n.setAttribute('fill', o.fill || C.ink);
      n.setAttribute('text-anchor', o.anchor || 'start');
      if (o.rot) n.setAttribute('transform', `rotate(${o.rot} ${x} ${y})`);
      if (o.ls) n.setAttribute('letter-spacing', o.ls);
      n.textContent = str;
      return put(n);
    },
    // a flat svg fill (no wobble) for big tone areas, cheap for the JPEG
    flat: (d, fill, opacity = 1) => {
      const n = document.createElementNS(NS, 'path');
      n.setAttribute('d', d); n.setAttribute('fill', fill); n.setAttribute('opacity', opacity);
      return put(n);
    },
    // draw into a transformed group
    g: (transform, fn) => {
      const n = document.createElementNS(NS, 'g');
      if (transform) n.setAttribute('transform', transform);
      put(n);
      const prev = parent; parent = n; fn(); parent = prev;
      return n;
    },
    // grey squiggles that stand for printed text (no real words)
    textLines: (x, y, w, rows, gap = 26, o = {}) => {
      for (let i = 0; i < rows; i++) {
        const len = (i % 5 === 4) ? w * 0.55 : w * (0.9 + 0.1 * Math.sin(i * 1.7));
        const yy = y + i * gap;
        const pts = [];
        for (let xx = x; xx <= x + len; xx += 9) pts.push([xx, yy + Math.sin(xx * 0.35 + i) * 2.2]);
        F.lin(pts, Object.assign({ stroke: o.stroke || C.soft, strokeWidth: o.sw || 2.4, roughness: 0.6 }, o));
      }
    },
    // a person as a storyboard stick figure. pose: stand | sit | arms (arms out level)
    person: (x, y, s = 1, o = {}) => {
      const sw = o.sw || 3;
      const st = o.stroke || C.ink;
      const head = y - 150 * s;
      F.c(x, head, 34 * s, { fill: o.fill || C.screen, fillStyle: 'solid', stroke: st, strokeWidth: sw });
      const neck = head + 17 * s, hip = y - 62 * s;
      F.l(x, neck, x, hip, { stroke: st, strokeWidth: sw + 1 });
      if (o.pose === 'sit') {
        F.lin([[x, hip], [x + 42 * s * (o.face || 1), hip], [x + 42 * s * (o.face || 1), y]], { stroke: st, strokeWidth: sw + 1 });
      } else {
        F.l(x, hip, x - 18 * s, y, { stroke: st, strokeWidth: sw + 1 });
        F.l(x, hip, x + 18 * s, y, { stroke: st, strokeWidth: sw + 1 });
      }
      const sh = neck + 18 * s;
      if (o.arms === 'out') { F.l(x - 70 * s, sh, x + 70 * s, sh, { stroke: st, strokeWidth: sw + 1 }); }
      else if (o.arms === 'up') { F.l(x, sh, x - 34 * s, sh - 50 * s, { stroke: st, strokeWidth: sw }); F.l(x, sh, x + 34 * s, sh - 50 * s, { stroke: st, strokeWidth: sw }); }
      else if (o.arms === 'head') { F.lin([[x, sh], [x - 28 * s, sh - 14 * s], [x - 10 * s, head - 4 * s]], { stroke: st, strokeWidth: sw }); F.lin([[x, sh], [x + 28 * s, sh - 14 * s], [x + 10 * s, head - 4 * s]], { stroke: st, strokeWidth: sw }); }
      else if (Array.isArray(o.arms)) { o.arms.forEach(([dx, dy]) => F.l(x, sh, x + dx * s, sh + dy * s, { stroke: st, strokeWidth: sw })); }
      else { F.l(x, sh, x - 26 * s, sh + 58 * s, { stroke: st, strokeWidth: sw }); F.l(x, sh, x + 26 * s, sh + 58 * s, { stroke: st, strokeWidth: sw }); }
    },
    // a small figurine (a pawn): stands for one person on a tabletop
    pawn: (x, y, s = 1, o = {}) => {
      F.poly([[x - 14 * s, y], [x + 14 * s, y], [x + 7 * s, y - 30 * s], [x - 7 * s, y - 30 * s]], { fill: o.fill || C.dark, fillStyle: 'solid', strokeWidth: 2, roughness: 0.8 });
      F.c(x, y - 40 * s, 18 * s, { fill: o.fill || C.dark, fillStyle: 'solid', strokeWidth: 2, roughness: 0.6 });
    },
    arrow: (x1, y1, x2, y2, o = {}) => {
      F.l(x1, y1, x2, y2, o);
      const a = Math.atan2(y2 - y1, x2 - x1), k = o.head || 16;
      F.lin([[x2 - k * Math.cos(a - 0.45), y2 - k * Math.sin(a - 0.45)], [x2, y2], [x2 - k * Math.cos(a + 0.45), y2 - k * Math.sin(a + 0.45)]], o);
    },
  };
  return F;
}

// Michael's line: a positioned block. spec: { text, x, y, w, size, kind: angular|linear|body, color, red, align, insert }
function siteLine(fr, s) {
  const d = el('div', 'line' + (s.kind && s.kind !== 'angular' ? ' ' + s.kind : ''), fr);
  Object.assign(d.style, { left: s.x + 'px', top: s.y + 'px', width: s.w + 'px', fontSize: s.size + 'px', color: s.color || C.ink, textAlign: s.align || 'left' });
  if (s.lh) d.style.lineHeight = s.lh;
  if (s.red) {
    const i = s.text.indexOf(s.red);
    d.append(s.text.slice(0, i)); el('span', 'red', d, s.red); d.append(s.text.slice(i + s.red.length));
  } else if (s.insert) {
    const i = s.text.indexOf(s.insert.after) + s.insert.after.length;
    d.append(s.text.slice(0, i) + ' ');
    const sp = el('span', 'obj', d);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', s.insert.w); svg.setAttribute('height', s.insert.h);
    sp.appendChild(svg);
    s.insert.draw(kit(svg));
    d.append(s.text.slice(i));
  } else d.textContent = s.text;
  if (s.style) Object.assign(d.style, s.style);
  return d;
}

function board(cfg) {
  cfg = Object.assign({}, SITE, cfg);
  document.title = cfg.title;
  const h = el('header', null, document.body);
  el('div', 'rank', h, '#' + cfg.rank);
  const tt = el('div', null, h);
  el('h1', null, tt, cfg.title);
  el('p', 'sub', tt, cfg.sub);

  cfg.frames.forEach((spec) => {
    const wrap = el('section', 'frame-wrap', document.body);
    el('h2', 'frame-label', wrap, spec.label);
    const fr = el('div', 'frame', wrap);
    if (spec.bg) fr.style.background = spec.bg;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', FW); svg.setAttribute('height', FH); svg.setAttribute('viewBox', `0 0 ${FW} ${FH}`);
    fr.appendChild(svg);
    const F = kit(svg);
    spec.draw(F);
    // browser bar, so each frame reads as a desktop screen
    F.flat(`M0 0H${FW}V${BAR}H0Z`, '#a7a8a3');
    F.l(0, BAR, FW, BAR, { strokeWidth: 2, roughness: 0.4 });
    [18, 38, 58].forEach((x) => F.c(x, BAR / 2, 11, { strokeWidth: 1.6, roughness: 0.4 }));
    F.r(FW / 2 - 150, 6, 300, 18, { strokeWidth: 1.4, roughness: 0.4, fill: '#c9cac5', fillStyle: 'solid' });
    F.t(FW / 2, 20, 'scalingupsidedown.com', { size: 12, anchor: 'middle', fill: '#3a3a38' }); // label
    F.r(2, 2, FW - 4, FH - 4, { strokeWidth: 3.2, roughness: 0.9 });

    const dark = spec.siteDark ? ' on-dark' : '';
    const lk = el('div', 'lockup' + dark, fr);
    el('div', 't', lk, 'Scaling Up-Side-Down');
    el('div', 'by', lk, cfg.byline);
    if (spec.nav !== false) el('div', 'nav' + (spec.navDark ? ' on-dark' : ''), fr, cfg.button);
    (spec.lines || []).forEach((s) => siteLine(fr, s));
    if (spec.ask) {
      const a = spec.ask;
      const box = el('div', 'ask' + (a.dark ? ' on-dark' : ''), fr);
      Object.assign(box.style, { left: a.x + 'px', top: a.y + 'px', width: a.w + 'px', color: a.dark ? C.chalk : C.ink });
      if (a.q) { const q = el('div', 'q', box, a.q); if (a.qSize) q.style.fontSize = a.qSize + 'px'; }
      const row = el('div', 'row', box);
      if (a.email) el('div', 'email', row, a.email);
      el('div', 'btn', row, cfg.button);
      if (a.facts) el('div', 'facts', box, a.facts === true ? cfg.facts : a.facts);
      if (a.book) el('div', 'book', box, a.book === true ? cfg.book : a.book);
    }
  });
}
