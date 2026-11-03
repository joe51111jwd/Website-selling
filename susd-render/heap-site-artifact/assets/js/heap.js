/* Scaling Up-Side-Down: The Heap, the stage player. Cut down from the Waterline player (site/assets/js/stage.js,
   docs/08-SITE-BUILD.md section 3): one clock, one beat table, frames hold then crossfade, captions fade.
   Locked camera, so a crossfade reads as the new hire's cables landing on the pile.
   - s = scroll position through the story in vh (0 .. config.len), measured against the runway's real height.
   - the beat table is the <section class="beat"> elements: data-k (frame key), data-n (people), data-fs (frame fully
     on at s), data-f (blend length, default config.F), data-cin / data-cout (the words' window).
   - the counts count with the scroll: people = the frame's n; cables = n(n-1)/2, counting up through the blend, with
     "(+n-1)" for each hire after the first screen. They sit at the mugs and the heap from assets/img/anchors.json
     (written with the renders); until it loads, or if it is missing, the concept renders' anchors below.
   Plain ES5, no dependencies, nothing from other hosts. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  if (!html.classList.contains('js')) return;
  var cfg = JSON.parse(d.getElementById('story-config').textContent);
  var RM = html.classList.contains('rm');
  var stage = d.querySelector('.stage'), runway = d.querySelector('.runway'), livebox = d.querySelector('.livebox');
  var cP = livebox.querySelector('.cnt-people'), cC = livebox.querySelector('.cnt-cables');
  var fP = cP.querySelector('.fig'), fC = cC.querySelector('.fig'), fD = cC.querySelector('.delta');
  var lead = livebox.querySelector('.leader'), rackT = livebox.querySelector('.racktag'), rackL = livebox.querySelector('.rackleader');
  var bar = d.querySelector('.bar'), form = d.getElementById('get-form'), email = d.getElementById('email');
  var mqPhone = window.matchMedia('(max-aspect-ratio: 3/4)');
  var params = new URLSearchParams(location.search);

  // ---- anchors (x, y in 0..1 of the frame from the top left) -------------------------------------------------
  // fallback: out/ideas/02-heap/final_{first,key}_desktop / final_first_phone .anchors.json
  var FD1 = { mugs_left: [0.5312, 0.1824], mugs_right: [0.7592, 0.1824], mugs_top: [0.6452, 0.165], shelf_under: [0.5271, 0.2715],
    heap_top: [0.5024, 0.6361], heap_left: [0.2725, 0.8144], floor_wall_left: [0.0703, 0.6696], desk_top: [0.774, 0.4284], desk_left_top: [0.5959, 0.4593] };
  var FDK = { mugs_left: [0.5312, 0.1824], mugs_right: [0.9664, 0.1824], mugs_top: [0.7488, 0.165], shelf_under: [0.5271, 0.2715],
    heap_top: [0.4798, 0.568], heap_left: [0.2725, 0.8144], floor_wall_left: [0.0703, 0.6696], desk_top: [0.774, 0.4284], desk_left_top: [0.5959, 0.4593] };
  var FP1 = { mugs_left: [0.4068, 0.2613], mugs_right: [0.8673, 0.2591], mugs_top: [0.6479, 0.2492], shelf_under: [0.3873, 0.32],
    heap_top: [0.4475, 0.589], heap_left: [-0.1545, 0.7941], floor_wall_left: [-0.875, 0.6664], desk_top: [0.9418, 0.4091], desk_left_top: [0.6498, 0.4496] };
  var ANC = {};
  ['08', '09', '10', '11', '12', '13', '14', '15', 'tidy'].forEach(function (k) {
    ANC['d' + k] = (k === 'tidy' || +k >= 12) ? FDK : FD1;
    ANC['p' + k] = FP1;
  });

  function num(v) { return v === undefined || v === '' ? null : +v; }
  var secs = [].slice.call(d.querySelectorAll('.beat')).map(function (el) {
    var ds = el.dataset;
    return { el: el, id: el.id, k: ds.k, n: num(ds.n), fs: num(ds.fs), f: num(ds.f) || cfg.F, cut: ds.cut === '1',
      cin: num(ds.cin), cout: num(ds.cout), tidy: el.classList.contains('tidy'),
      img: el.querySelector('.frame img'), layer: el.querySelector('.layer'), cap: el.querySelector('.caption'),
      fo: el.id === 'b08' ? 1 : 0, lo: el.id === 'b08' ? 1 : 0, loaded: false };
  });
  var frames = secs.filter(function (s) { return s.fs !== null; });
  var layers = secs.filter(function (s) { return s.layer && s.cap && (s.cin !== null || s.cout !== null); });
  var finFrame = frames[frames.length - 1];
  // the frame a caption is read over (a beat without its own frame reads over the last one before it)
  layers.forEach(function (L) {
    if (L.fs !== null) { L.ground = L; return; }
    for (var i = frames.length - 1; i >= 0; i--) if (frames[i].fs <= L.cin) { L.ground = frames[i]; break; }
    L.ground = L.ground || frames[0];
  });

  // ---- geometry ---------------------------------------------------------------------------------------------
  var G = { unit: 1, top: 0, W: 0, H: 0, phone: false, bx: 0, by: 0, bw: 0, bh: 0, sr: null };
  function anc(sec) { return ANC[(G.phone ? 'p' : 'd') + sec.k] || ANC['d' + sec.k]; }
  function measure() {
    G.phone = mqPhone.matches;
    G.unit = runway.offsetHeight / cfg.len || 1;
    G.top = runway.offsetTop - stage.offsetHeight;
    var sr = stage.getBoundingClientRect(), br = livebox.getBoundingClientRect();
    G.W = sr.width; G.H = sr.height; G.bx = br.left - sr.left; G.by = br.top - sr.top; G.bw = br.width; G.bh = br.height; G.sr = sr;
    sizes();
    fitLayers();
    last = {};
    render();
  }
  function barTop() { return G.phone && bar ? G.H - bar.offsetHeight : G.H; }
  function sizes() {
    G.pw = cP.offsetWidth; G.ph = cP.offsetHeight; G.cw = cC.offsetWidth; G.ch = cC.offsetHeight;
  }

  // ---- the clock --------------------------------------------------------------------------------------------
  function clock() { return Math.max(0, ((window.scrollY || window.pageYOffset) - G.top) / G.unit); }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function win(s, a, b, f) {
    var x = 1;
    if (a !== null && a !== undefined) x = Math.min(x, (s - a) / f);
    if (b !== null && b !== undefined) x = Math.min(x, (b - s) / f);
    x = clamp01(x);
    return RM ? (x >= 0.5 ? 1 : 0) : x;
  }
  function frameState(s) {
    var k = 0;
    for (var j = 1; j < frames.length; j++) if (frames[j].fs - frames[j].f <= s) k = j;
    var A = frames[k], B = null, t = 0;
    if (k > 0 && s < frames[k].fs) {
      A = frames[k - 1]; B = frames[k]; t = clamp01((s - (frames[k].fs - B.f)) / B.f);
      if (B.cut || RM) t = t < 0.5 ? 0 : 1;
      if (t === 1) { A = B; B = null; t = 0; } else if (t === 0) B = null;
    }
    if (B && !B.loaded) { want(B); B = null; t = 0; }
    if (!A.loaded) {
      want(A);
      var i = frames.indexOf(A), alt = null;
      for (var q = i - 1; q >= 0 && !alt; q--) if (frames[q].loaded) alt = frames[q];
      for (q = i + 1; q < frames.length && !alt; q++) if (frames[q].loaded) alt = frames[q];
      A = alt || A; B = null; t = 0;
    }
    return { A: A, B: B, t: t };
  }
  function drawFrames(fst) {
    frames.forEach(function (f) {
      var o = f === fst.A ? 1 : f === fst.B ? fst.t : 0;
      if (o !== f.fo) { f.fo = o; f.el.style.setProperty('--fo', o.toFixed(3)); }
    });
  }

  // ---- loading: the first frame is in the HTML; the rest load in story order, two at a time ----------------
  var inflight = 0, started = false;
  function want(f) {
    if (f.el.classList.contains('ld')) return;
    f.el.classList.add('ld'); inflight++;
  }
  function pump() {
    if (!started) return;
    for (var i = 0; i < frames.length && inflight < 2; i++) if (!frames[i].el.classList.contains('ld')) want(frames[i]);
  }
  frames.forEach(function (f) {
    if (!f.img) return;
    var done = function () {
      if (f.img.naturalWidth) f.loaded = true;
      if (f.el.classList.contains('ld') && !f.counted) { f.counted = true; inflight = Math.max(0, inflight - 1); }
      last = {}; request(); pump();
    };
    if (f.img.complete && f.img.naturalWidth) { f.loaded = true; f.counted = true; }
    f.img.addEventListener('load', done);
    f.img.addEventListener('error', done);
  });
  function start() {
    if (started) return;
    // the form's ground goes first: every "Get it free" lands on it, from any screen
    requestAnimationFrame(function () { requestAnimationFrame(function () { started = true; want(finFrame); pump(); }); });
  }
  if (d.readyState === 'complete') start(); else window.addEventListener('load', start);

  // ---- where the counts stand for a set of anchors (px in the frame box) ------------------------------------
  function P(a, key) { return a && a[key] ? a[key] : null; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpAnc(a, b, t) {
    if (!b || t <= 0) return a; if (!a || t >= 1) return b;
    var o = {};
    for (var key in a) if (b[key]) o[key] = [lerp(a[key][0], b[key][0], t), lerp(a[key][1], b[key][1], t)];
    return o;
  }
  function countsAt(a) {
    var W = G.bw, H = G.bh, Lx = (G.phone ? 16 : Math.max(56, 24 - G.bx)) - G.bx;
    var ml = P(a, 'mugs_left') || [0.53, 0.18], su = P(a, 'shelf_under') || [0.53, 0.27], ht = P(a, 'heap_top') || [0.5, 0.63];
    var o = {}, hx = ht[0] * W, hy = ht[1] * H;
    if (!G.phone) {
      o.p = { left: ml[0] * W + 87, top: su[1] * H - 40 };
      var right = Math.max(hx - 14, Lx + G.cw);
      o.c = { left: right - G.cw, top: hy - 96 };
      var x1 = right - 40, y1 = o.c.top + G.ch + 4;
      o.l = { left: x1, top: y1, w: Math.max(1, hx - x1), h: Math.max(0, hy - 8 - y1), v: false };
    } else {
      // phone: cables count stacked, on the wall left of the desk; L-shaped leader to heap_top
      o.p = { left: Math.max(Lx, ml[0] * W), top: su[1] * H - 28 };
      o.c = { left: Lx, top: Math.max(hy - G.ch - 90, o.p.top + G.ph + 12) };
      var lx = Lx + 22, ly = o.c.top + G.ch + 6;
      o.l = { left: lx, top: ly, w: Math.max(1, hx - lx), h: Math.max(0, hy - 10 - ly), v: false };
    }
    o.p.right = o.p.left + G.pw; o.p.bottom = o.p.top + G.ph;
    o.c.right = o.c.left + G.cw; o.c.bottom = o.c.top + G.ch;
    return o;
  }
  // stage px boxes of the things the words must stay off, for one frame's anchors
  function obstacles(a) {
    var W = G.bw, H = G.bh, bx = G.bx, by = G.by, out = [];
    function add(l, t, r, b) { out.push({ left: bx + l, top: by + t, right: bx + r, bottom: by + b }); }
    var ml = P(a, 'mugs_left'), mr = P(a, 'mugs_right'), mt = P(a, 'mugs_top'), su = P(a, 'shelf_under');
    // the mugs and the shelf board they stand on (mugs_left is the first mug's left edge; the shelf is ~0.025 below
    // the mugs' middle; shelf_under is the bracket foot, thin enough to ignore)
    if (ml && mr) add(ml[0] * W - 8, (mt ? mt[1] : ml[1]) * H - 12, mr[0] * W + 30, (ml[1] + 0.025) * H);
    var ht = P(a, 'heap_top'), hl = P(a, 'heap_left');
    if (ht) add(hl ? hl[0] * W : ht[0] * W - 0.25 * W, ht[1] * H - 6, ht[0] * W + 0.3 * W, H);
    var dl = P(a, 'desk_left_top');
    if (dl) add(dl[0] * W - 10, dl[1] * H - 40, W, H);
    var rk = P(a, 'rack');
    if (rk) add(rk[0] * W - 40, rk[1] * H - 40, rk[0] * W + 200, rk[1] * H + 40);
    return out;
  }
  function countBoxes(a) {
    var o = countsAt(a), out = [];
    [o.p, o.c].forEach(function (b) { out.push({ left: G.bx + b.left, top: G.by + b.top, right: G.bx + b.right, bottom: G.by + b.bottom }); });
    return out;
  }
  function hit(a, b, p) { return a.left - p < b.right && b.left - p < a.right && a.top - p < b.bottom && b.top - p < a.bottom; }

  // the text lines of a caption, as stage px boxes (each line as wide as its words, not its block)
  function lineRects(el) {
    var out = [], w = d.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), n, r = d.createRange();
    while ((n = w.nextNode())) {
      if (!n.nodeValue.trim() || (n.parentNode.closest && n.parentNode.closest('.static'))) continue;
      r.selectNodeContents(n);
      [].forEach.call(r.getClientRects(), function (q) {
        if (q.width > 0.5) out.push({ left: q.left - G.sr.left, right: q.right - G.sr.left, top: q.top - G.sr.top, bottom: q.bottom - G.sr.top });
      });
    }
    return out;
  }
  function scaled(rs, x0, y0, k) {
    return rs.map(function (q) { return { left: x0 + (q.left - x0) * k, right: x0 + (q.right - x0) * k, top: y0 + (q.top - y0) * k, bottom: y0 + (q.bottom - y0) * k }; });
  }

  // ---- fitting: words that would run onto the mugs, the heap, the desk or a count scale down (not below 0.7) --
  function fitLayers() {
    layers.forEach(function (L) {
      var el = L.cap;
      el.style.scale = '';
      var a = anc(L.ground) || {};
      var obs = obstacles(a);
      if (L.ground.n) obs = obs.concat(countBoxes(a));
      var safeB = (G.phone ? barTop() : G.H) - 14;
      obs.push({ left: -1e4, right: 1e4, top: safeB, bottom: 1e5 });
      var cr = el.getBoundingClientRect(), x0 = cr.left - G.sr.left, y0 = cr.top - G.sr.top;
      var rs = lineRects(el), k = 1;
      function bad(kk) { return scaled(rs, x0, y0, kk).some(function (q) { return obs.some(function (o) { return hit(q, o, 6); }); }); }
      while (k > 0.7 && bad(k)) k = Math.round((k - 0.03) * 100) / 100;
      if (k < 1) el.style.scale = k.toFixed(2);
      L.boxes = scaled(rs, x0, y0, k);
    });
  }

  // ---- render -----------------------------------------------------------------------------------------------
  var last = {};
  function setO(el, key, o) { o = RM ? (o >= 0.5 ? 1 : 0) : +o.toFixed(3); if (last[key] !== o) { last[key] = o; el.style.opacity = o; } }
  function place(el, key, b) {
    var v = Math.round(b.left) + ',' + Math.round(b.top);
    if (last[key] !== v) { last[key] = v; el.style.left = Math.round(b.left) + 'px'; el.style.top = Math.round(b.top) + 'px'; }
  }

  function render() {
    var s = clock();
    if (params.has('debug')) html.setAttribute('data-s', s.toFixed(1));
    var fst = frameState(s);
    drawFrames(fst);
    var A = fst.A, B = fst.B, t = fst.t;

    // the words
    var active = [];
    layers.forEach(function (L) {
      var o = win(s, L.cin, L.cout, cfg.fc);
      if (o !== L.lo) { L.lo = o; L.el.style.setProperty('--lo', o.toFixed(3)); L.layer.classList.toggle('off', o === 0); }
      if (o > 0.02 && L.boxes) active = active.concat(L.boxes);
    });

    // the counts: people = n of the frame on screen; cables count up through the blend into the next frame
    var nA = A.n, nB = B ? B.n : null, people, cables, co, a;
    if (nA && nB) {
      people = Math.round(lerp(nA, nB, t));
      cables = Math.round(lerp(nA * (nA - 1) / 2, nB * (nB - 1) / 2, t));
      co = 1; a = lerpAnc(anc(A), anc(B), t);
    } else if (nA) { people = nA; cables = nA * (nA - 1) / 2; co = B ? 1 - t : 1; a = anc(A); }
    else if (nB) { people = nB; cables = nB * (nB - 1) / 2; co = t; a = anc(B); }
    else { people = 15; cables = 105; co = 0; a = anc(A); }
    var delta = people >= 9 ? ' (+' + (people - 1) + ')' : '';
    if (last.n !== people || last.c !== cables || last.d !== delta) {
      last.n = people; last.c = cables; last.d = delta;
      fP.textContent = people; fC.textContent = cables; fD.textContent = delta;
      sizes();
    }
    var at = countsAt(a);
    place(cP, 'pp', at.p); place(cC, 'cp', at.c);
    var lk = [at.l.left, at.l.top, at.l.w, at.l.h].map(Math.round).join(',');
    if (last.lk !== lk) {
      last.lk = lk;
      lead.style.left = Math.round(at.l.left) + 'px'; lead.style.top = Math.round(at.l.top) + 'px';
      lead.style.width = Math.round(at.l.w) + 'px'; lead.style.height = Math.round(at.l.h) + 'px';
      lead.classList.toggle('v', at.l.v);
    }
    // a count steps aside rather than sit on words that had to stay where they are
    function sbox(b) { return { left: G.bx + b.left, top: G.by + b.top, right: G.bx + b.right, bottom: G.by + b.bottom }; }
    var pHit = active.some(function (q) { return hit(q, sbox(at.p), 6); });
    var cHit = active.some(function (q) { return hit(q, sbox(at.c), 6); });
    var lo = at.l.h >= 10 ? 1 : 0;
    setO(cP, 'po', pHit ? 0 : co);
    setO(cC, 'co', cHit ? 0 : co);
    setO(lead, 'lo', cHit ? 0 : co * lo);

    // the rack's one empty port, in the tidy room
    var ro = (A.tidy ? (B ? 1 - t : 1) : 0) + (B && B.tidy ? t : 0);
    // the tag stands on the wall just above the rack; a thin leader drops from it into the one empty port
    var ta = A.tidy ? anc(A) : B && B.tidy ? anc(B) : null, rk = ta && (ta.rack_port || ta.rack), rc = ta && ta.rack, rl = ta && ta.rack_left;
    if (rk && rk[0] > 0 && rk[0] < 1 && rk[1] > 0 && rk[1] < 1) {
      if (rackT.hidden) { rackT.hidden = false; rackL.hidden = false; last.rw = null; }
      if (!last.rw) last.rw = rackT.offsetWidth;
      var px = rk[0] * G.bw, py = rk[1] * G.bh;
      var halfW = rc && rl ? (rc[0] - rl[0]) * G.bw : 60;
      var rackTop = (rc ? rc[1] * G.bh : py) - 0.62 * halfW;
      var flip = px + last.rw > G.bw - 8;
      var rb = { left: flip ? px + 1 - last.rw : px - 1, top: rackTop - 40 - 16 };
      rackT.classList.toggle('flip', flip);
      place(rackT, 'rp', rb);
      var rlk = [Math.round(px), Math.round(rb.top + 19), Math.round(Math.max(0, py - 4 - rb.top - 19))].join(',');
      if (last.rlk !== rlk) { last.rlk = rlk; rackL.style.left = Math.round(px) + 'px'; rackL.style.top = Math.round(rb.top + 19) + 'px'; rackL.style.height = Math.round(Math.max(0, py - 4 - rb.top - 19)) + 'px'; }
      var sb = { left: G.bx + rb.left, top: G.by + rb.top, right: G.bx + rb.left + last.rw, bottom: G.by + rb.top + 16 };
      if (sb.left < 4 || sb.right > G.W - 4 || sb.top < 60 || (G.phone && sb.bottom > barTop() - 8) || active.some(function (q) { return hit(q, sb, 8); })) ro = 0;
      setO(rackT, 'ro', ro); setO(rackL, 'rlo', ro);
    } else if (!rackT.hidden) { rackT.hidden = true; rackL.hidden = true; }
  }

  // ---- the dock and the bar step aside while the form is on screen (or the phone keyboard is up) ------------
  var off = {};
  function setDockOff(k, v) {
    off[k] = v;
    var any = off.form || off.kbd;
    if (last.dock !== any) { last.dock = any; html.classList.toggle('dock-off', !!any); }
  }
  if ('IntersectionObserver' in window && form) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { setDockOff('form', e.isIntersecting && e.intersectionRatio >= 0.3); });
    }, { threshold: [0, 0.3, 0.6, 1] }).observe(form);
  }
  d.addEventListener('focusin', function (e) { if (G.phone && e.target.tagName === 'INPUT') setDockOff('kbd', true); });
  d.addEventListener('focusout', function (e) { if (e.target.tagName === 'INPUT') setDockOff('kbd', false); });

  // ---- "Get it free": an instant jump to the form (never a smooth scroll through the whole story) ----------
  var get = d.getElementById('get');
  [].forEach.call(d.querySelectorAll('a[href="#get"]'), function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      html.classList.add('jump'); setDockOff('form', true);
      setTimeout(function () { html.classList.remove('jump'); }, 400);
      window.scrollTo(0, get.getBoundingClientRect().top + (window.scrollY || window.pageYOffset));
      render();
      try { if (history.replaceState) history.replaceState(null, '', '#get'); } catch (er) {}
      // keyboard and mouse: focus the field. Touch: no, the keyboard would cover what the file is before it is read.
      if (window.matchMedia('(pointer: fine)').matches) email.focus({ preventScroll: true });
      else { get.setAttribute('tabindex', '-1'); get.focus({ preventScroll: true }); }
    });
  });

  // ---- framed copy (claude.ai artifact, story-config "newtab": true): the page never navigates its own frame.
  // In-page links scroll by script (a host <base> could turn "#book" into a navigation); the form opens a new tab.
  if (cfg.newtab) {
    [].forEach.call(d.querySelectorAll('a[href^="#"]:not([href="#get"])'), function (el) {
      el.addEventListener('click', function (e) {
        var t = d.getElementById(el.getAttribute('href').slice(1));
        if (!t) return;
        e.preventDefault();
        window.scrollTo(0, t.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - 16);
      });
    });
  }

  // ---- the form: check the address, then open the Bootloader page (same tab; a new tab in the framed copy).
  // Nothing is sent from here. -------------------------------------------------------------------------------
  if (form) {
    var bad = form.querySelector('.msg-bad'), go = form.querySelector('.msg-go'), btn = form.querySelector('button');
    var blocked = form.querySelector('.msg-blocked');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = email.value.trim();
      if (!v || !email.checkValidity()) {
        bad.hidden = false; go.hidden = true; email.setAttribute('aria-invalid', 'true'); email.focus();
        requestAnimationFrame(function () { var r = bad.getBoundingClientRect(); if (r.bottom > window.innerHeight - 8) window.scrollBy(0, r.bottom - window.innerHeight + 16); });
        return;
      }
      bad.hidden = true; email.removeAttribute('aria-invalid');
      var url = form.getAttribute('action');            // https://scaling-up-side-down.vercel.app/appendix#get
      if (cfg.newtab) {
        // inside the submit gesture, synchronously, or the browser blocks it; a visible link if it is blocked anyway
        var w = null;
        if (!params.has('nonav')) { try { w = window.open(url, '_blank'); } catch (er) { w = null; } }
        if (w) { try { w.opener = null; } catch (er) {} go.hidden = false; if (blocked) blocked.hidden = true; }
        else { go.hidden = true; if (blocked) blocked.hidden = false; }
        return;
      }
      go.hidden = false; btn.disabled = true;
      if (params.has('nonav')) return;
      setTimeout(function () { location.assign(url); }, RM ? 300 : 800);
    });
    email.addEventListener('input', function () { if (!bad.hidden) { bad.hidden = true; email.removeAttribute('aria-invalid'); } });
  }

  // ---- run -------------------------------------------------------------------------------------------------
  var queued = false;
  function request() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; render(); }); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { measure(); });
  if (mqPhone.addEventListener) mqPhone.addEventListener('change', measure);
  measure();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(measure);
  // the renders' anchors (assets/img/anchors.json: {"d08": {"people", "cables", "anchors": {...}}, ...})
  if (window.fetch) fetch('assets/img/anchors.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (!j) return;
    // keys: d08 .. d15, d-tidy, p08 .. p15, p-tidy (the beats' data-k is "tidy", so "d-tidy" is read as "dtidy")
    for (var key in j) if (j[key] && j[key].anchors) ANC[key.replace('-', '')] = j[key].anchors;
    measure();
  }).catch(function () {});
  if (params.has('s')) window.scrollTo(0, G.top + (+params.get('s')) * G.unit);
  window.HEAP = { clock: clock, unit: function () { return G.unit; }, top: function () { return G.top; }, measure: measure };
})();
