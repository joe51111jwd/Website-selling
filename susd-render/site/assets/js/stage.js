/* Scaling Up-Side-Down: the stage player, v1 (docs/08-SITE-BUILD.md).
   One clock: s = scroll position in vh of the story (0 .. config.len), measured against the runway's real height.
   One beat table: the <section class="beat"> elements (data-fs: where the frame is fully on screen; data-cut: no
   blend into it; data-cin/data-cout: the caption window; data-a: the anchors) plus #story-config (the readout's n,
   the chrome windows). Frames hold, then crossfade over config.F vh; captions fade over config.fc vh.
   To play a rendered sequence later, replace drawFrames() with a canvas painter that takes the same (A, B, t): the
   clock, the captions and the instrument do not change. Plain ES5, no dependencies, nothing from other hosts. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  if (!html.classList.contains('js')) return;
  var cfg = JSON.parse(d.getElementById('story-config').textContent);
  var RM = html.classList.contains('rm');
  var stage = d.querySelector('.stage'), runway = d.querySelector('.runway'), livebox = d.querySelector('.livebox');
  var inst = livebox.querySelector('.instrument'), leg = livebox.querySelector('.legend');
  var wtag = livebox.querySelector('.wtag'), wtext = wtag.querySelector('.wtext');
  var roN = inst.querySelector('.ro-n'), roP = inst.querySelector('.ro-p'), roD = inst.querySelector('.ro-d');
  var roLive = livebox.querySelector('.ro-live');
  var bar = d.querySelector('.bar'), form = d.getElementById('get-form'), email = d.getElementById('email');
  var drainbox = d.querySelector('.drainbox');
  var mqPhone = window.matchMedia('(max-aspect-ratio: 3/4)');
  var params = new URLSearchParams(location.search);

  function num(v) { return v === undefined || v === '' ? null : +v; }
  var secs = [].slice.call(d.querySelectorAll('.beat')).map(function (el) {
    var ds = el.dataset;
    return { el: el, id: el.id, fs: num(ds.fs), cut: ds.cut === '1', cin: num(ds.cin), cout: num(ds.cout),
      a: JSON.parse(ds.a || '{}'), img: el.querySelector('.frame img'), tags: el.querySelector('.tags'),
      layer: el.querySelector('.layer'), fo: el.id === 'b-hero' ? 1 : 0, lo: el.id === 'b-hero' ? 1 : 0, loaded: false };
  });
  var frames = secs.filter(function (s) { return s.fs !== null; });
  var layers = secs.filter(function (s) { return s.layer && (s.cin !== null || s.cout !== null); });
  var offerSec = secs.filter(function (s) { return s.el.classList.contains('offerbeat'); })[0];
  var finFrame = frames[frames.length - 1];                  // b-fin: the ground under the form (#get)

  // ---- geometry ---------------------------------------------------------------------------------------------
  var G = { unit: 1, top: 0, W: 0, H: 0, phone: false, bx: 0, by: 0, bw: 0, bh: 0 };
  function anc(sec) { return G.phone ? (sec.a.p || sec.a) : sec.a; }
  function measure() {
    G.phone = mqPhone.matches;
    G.unit = runway.offsetHeight / cfg.len || 1;
    G.top = runway.offsetTop - stage.offsetHeight;
    var sr = stage.getBoundingClientRect(), br = livebox.getBoundingClientRect();
    G.W = sr.width; G.H = sr.height; G.bx = br.left - sr.left; G.by = br.top - sr.top; G.bw = br.width; G.bh = br.height;
    G.sr = sr;
    fitLayers();
    last = {};
    render();
  }
  function barTop() {
    if (!G.phone || !bar) return G.H;
    return G.H - bar.offsetHeight;
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
  function nAt(s) {
    var K = cfg.n;
    if (s <= K[0][0]) return K[0][1];
    for (var i = 1; i < K.length; i++) if (s <= K[i][0]) {
      var a = K[i - 1], b = K[i];
      return a[1] + (b[1] - a[1]) * (s - a[0]) / (b[0] - a[0]);
    }
    return K[K.length - 1][1];
  }
  // which two frames are on screen, and how far the blend has gone
  function frameState(s) {
    var k = 0, F = cfg.F;
    for (var j = 1; j < frames.length; j++) if (frames[j].fs - F <= s) k = j;
    var A = frames[k], B = null, t = 0;
    if (k > 0 && s < frames[k].fs) {
      A = frames[k - 1]; B = frames[k]; t = clamp01((s - (frames[k].fs - F)) / F);
      if (B.cut || RM) t = t < 0.5 ? 0 : 1;
      if (t === 1) { A = B; B = null; t = 0; } else if (t === 0) B = null;
    }
    if (B && !B.loaded) { want(B); B = null; t = 0; }
    if (!A.loaded && A === finFrame) {
      // the form's ground: a stand-in frame would put its sentence under the finale's words (QA round 1: "Get it
      // free" on a fresh load printed "In an open system..." over the first frame). Dark water until it arrives.
      want(A);
      return { A: A, B: null, t: 0, blank: true };
    }
    if (!A.loaded) {
      want(A);
      var i = frames.indexOf(A), alt = null;
      for (var q = i - 1; q >= 0 && !alt; q--) if (frames[q].loaded) alt = frames[q];
      for (q = i + 1; q < frames.length && !alt; q++) if (frames[q].loaded) alt = frames[q];
      A = alt || A; B = null; t = 0;
    }
    return { A: A, B: B, t: t };
  }

  // ---- frames: crossfading stills now; a canvas sequence later (same A, B, t) ------------------------------
  function drawFrames(fst) {
    frames.forEach(function (f) {
      var o = fst.blank ? 0 : f === fst.A ? 1 : f === fst.B ? fst.t : 0;
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
  // after the first screen has painted (window load waits for its frame and fonts), never before
  function start() {
    if (started) return;
    // the finale's frame goes first: every "Get it free" lands on it, from any screen (QA round 1)
    requestAnimationFrame(function () { requestAnimationFrame(function () { started = true; if (finFrame) want(finFrame); pump(); }); });
  }
  if (d.readyState === 'complete') start(); else window.addEventListener('load', start);

  // ---- fitting: a caption that would run under the bar or off the bottom moves up (never onto the words) ----
  function fitLayers() {
    layers.forEach(function (L) {
      var a = anc(L);
      L.boxes = [];
      [].forEach.call(L.layer.querySelectorAll('.caption, .offer'), function (el) {
        el.style.translate = ''; el.style.scale = ''; el.classList.remove('short');
        var docked = G.phone && L.cin !== null && L.cin < cfg.readout[1];
        var safe = G.phone ? barTop() - 12 - (docked ? 34 : 0) : G.H - 16;
        if (el.classList.contains('offer')) safe = G.H - 16;          // the bar steps aside for the offer
        var minTop = G.by + (a.wb || 0) * G.bh + 12;
        var r = el.getBoundingClientRect(), top = r.top - G.sr.top, h = r.height;
        // ... nor onto the rendered load-line mark (phone anchors carry it when it shows); below it is fine
        if (a.m && r.right - G.sr.left > G.bx + a.m[0] * G.bw && top + h > G.by + a.m[1] * G.bh) minTop = Math.max(minTop, G.by + (a.m[1] + 0.012) * G.bh + 8);
        if (top + h > safe && G.phone && el.classList.contains('offer')) {
          el.classList.add('short'); r = el.getBoundingClientRect(); top = r.top - G.sr.top; h = r.height;
        }
        var dy = 0;
        if (top + h > safe) dy = Math.min(top + h - safe, Math.max(0, top - minTop));
        if (dy) el.style.translate = '0 ' + (-dy).toFixed(1) + 'px';
        var k = 1;
        if (top - dy + h > safe) { k = Math.max(0.72, (safe - (top - dy)) / h); el.style.transformOrigin = '0 0'; el.style.scale = k.toFixed(3); }
        L.boxes.push({ top: top - dy, bottom: top - dy + h * k, left: r.left - G.sr.left, right: r.left - G.sr.left + r.width * k });
      });
    });
    // phone, first screen: the audience line and its scroll cue sit between the sentence and the water tag. A short
    // phone (iPhone SE, 360 x 640) has less room there and the cue ran onto "complexity: 28 pathways": the type steps
    // down (17 -> 15 px) until it clears the tag; if it still cannot, the box below makes the tag step aside instead.
    var hs = secs[0], aud = hs.layer && hs.layer.querySelector('.audience');
    if (aud) {
      aud.style.fontSize = '';
      if (G.phone) {
        var wl = G.by + (anc(hs).wy || 0) * G.bh - 8 - 10;          // the tag's top (it sits 8 px over the line), less 10
        for (var fz = 16; fz >= 15 && aud.getBoundingClientRect().bottom - G.sr.top > wl; fz--) aud.style.fontSize = fz + 'px';
      }
      var ar = aud.getBoundingClientRect();
      if (hs.boxes && ar.height) hs.boxes.push({ top: ar.top - G.sr.top, bottom: ar.bottom - G.sr.top, left: ar.left - G.sr.left, right: ar.right - G.sr.left });
    }
    frames.forEach(function (f) {
      f.tagBoxes = [];
      if (!f.tags) return;
      [].forEach.call(f.tags.querySelectorAll('.tag'), function (el) {
        el.style.visibility = '';
        if (getComputedStyle(el).display === 'none') return;
        var t = el.classList.contains('tag-margin') ? el.querySelector('span') : el;
        var r = t.getBoundingClientRect();
        // a viewport narrower than 16:10 crops the frame's right side: a label the screen would cut is left out
        if (r.right > G.sr.right - 4 || r.left < G.sr.left + 4) { el.style.visibility = 'hidden'; return; }
        f.tagBoxes.push({ top: r.top - G.sr.top, bottom: r.bottom - G.sr.top, left: r.left - G.sr.left, right: r.right - G.sr.left });
      });
    });
  }
  function hit(a, b, p) { return a.left - p < b.right && b.left - p < a.right && a.top - p < b.bottom && b.top - p < a.bottom; }

  // ---- the live instrument, legend and water tag ------------------------------------------------------------
  function topOf(sec) {
    var a = anc(sec);
    if (!a || !a.it) return null;
    var m = -1e9;
    a.it.forEach(function (q) { m = Math.max(m, q[0] * G.bh + q[1]); });
    return m;
  }
  function lerp(a, b, t) { return a === null ? b : b === null ? a : a + (b - a) * t; }
  var bandOf = function (n) { return n <= 12 ? 'team' : n <= 14 ? 'threshold' : 'graveyard'; };
  var liveTimer = null, liveSaid = '', curBand = 'team';
  function sayBand(n, p) {
    var label = inst.querySelector('.band[data-band="' + bandOf(n) + '"] .btag').textContent;
    var msg = n + ' people, ' + p + ' coordination pathways, ' + label;
    if (liveTimer || msg === liveSaid) return;
    liveTimer = setTimeout(function () { liveTimer = null; liveSaid = msg; roLive.textContent = msg; }, 1500);
  }

  var last = {};
  function setOpacity(el, key, o) { if (last[key] !== o) { last[key] = o; el.style.opacity = o; } }

  function render() {
    var s = clock();
    if (params.has('debug')) html.setAttribute('data-s', s.toFixed(1));
    var fst = frameState(s);
    drawFrames(fst);
    var A = fst.A, B = fst.B, t = fst.t, shown = (B && t >= 0.5) ? B : A;

    // captions and the offer
    var activeBoxes = [], offerOn = false;
    layers.forEach(function (L) {
      var o = win(s, L.cin, L.cout, cfg.fc);
      if (o !== L.lo) {
        L.lo = o; L.el.style.setProperty('--lo', o.toFixed(3));
        L.layer.classList.toggle('off', o === 0);
      }
      if (o > 0.02 && L.boxes) activeBoxes = activeBoxes.concat(L.boxes);
      if (L === offerSec && o > 0.3) offerOn = true;
    });
    // the offer's button only takes focus while the offer is on screen
    if (offerSec && last.offer !== offerOn) {
      last.offer = offerOn;
      [].forEach.call(offerSec.layer.querySelectorAll('a'), function (a) { a.tabIndex = offerOn ? 0 : -1; });
    }

    // anchored tags step aside from a caption that had to move over them (short phones)
    [A, B].forEach(function (f) {
      if (!f || !f.tags) return;
      var q = activeBoxes.some(function (b) { return f.tagBoxes.some(function (tb) { return hit(b, tb, 8); }); });
      if (q !== f.quiet) { f.quiet = q; f.tags.classList.toggle('quiet', q); }
    });

    // the readout: counts with the scroll, lands on each frame's n as that frame lands
    var n = Math.round(nAt(s)), p = n * (n - 1) / 2;
    var ro = win(s, null, cfg.readout[1], 12);       // on from the first paint; fades out after Redline
    if (last.n !== n) {
      last.n = n;
      roN.textContent = n; roP.textContent = p;
      var b = bandOf(n);
      if (b !== curBand) {
        curBand = b;
        [].forEach.call(inst.querySelectorAll('[data-band]'), function (el) { el.hidden = el.getAttribute('data-band') !== b; });
        sayBand(n, p);
      }
    }
    var delta = (s >= cfg.delta[0] && s <= cfg.delta[1] && n >= 9 && n <= 13) ? ' (+' + (n - 1) + ')' : '';
    if (last.delta !== delta) { last.delta = delta; roD.textContent = delta; }
    var hero = s < cfg.hero[1], q3 = !G.phone && s >= cfg.q3[0] && s <= cfg.q3[1];
    var mode = (hero ? 'hero' : G.phone ? 'docked' : 'col') + (q3 ? ' q3on' : '');
    if (last.mode !== mode) {
      last.mode = mode;
      inst.classList.toggle('hero', hero); inst.classList.toggle('docked', G.phone && !hero); inst.classList.toggle('q3on', q3);
      inst.classList.remove('tight');
      last.ih = null;
    }
    setOpacity(inst, 'ro', ro);
    // where it stands: under the water, right column (desktop); under the water, then docked above the bar (phone)
    var it = (B && B.a.it && A.a.it) ? lerp(topOf(A), topOf(B), t) : topOf(A.a.it ? A : (B || A));
    if (it === null) it = last.it || 0;
    last.it = it;
    var gx = lerp(A.a.gx || null, B ? (B.a.gx || null) : null, t) || 0.96;
    var ih = inst.offsetHeight;
    var top, left;
    if (G.phone) {
      left = 20;
      if (hero) {
        top = it;
        if (G.by + top + ih > barTop() - 12 && !inst.classList.contains('tight')) { inst.classList.add('tight'); ih = inst.offsetHeight; }
      } else top = barTop() - 16 - ih - G.by;
    } else {
      left = Math.min(gx * G.bw - 356, G.W - G.bx - 354);
      top = it;
      var wb = (shown.a.wb || 0) * G.bh + 12;
      if (G.by + top + ih > G.H - 16) top = Math.max(wb, G.H - 16 - ih - G.by);
    }
    var pos = Math.round(left) + ',' + Math.round(top);
    if (last.pos !== pos) { last.pos = pos; inst.style.left = Math.round(left) + 'px'; inst.style.top = Math.round(top) + 'px'; }

    // the cycle legend (desktop): lit phase follows the frame on screen
    var lo = 0;
    cfg.legend.forEach(function (w) { lo = Math.max(lo, win(s, w[0], w[1], 10)); });
    setOpacity(leg, 'leg', lo);
    if (lo > 0) {
      var ph = cfg.phases[0];
      cfg.phases.forEach(function (q) { if (s >= q[0]) ph = q; });
      var key = ph.join(',');
      if (last.ph !== key) {
        last.ph = key;
        [].forEach.call(leg.querySelectorAll('.phase'), function (el) {
          var on = el.getAttribute('data-ph') === ph[1];
          el.classList.toggle('on', on); el.classList.toggle('nocell', on && !ph[3]);
        });
        [].forEach.call(leg.querySelectorAll('.lap'), function (el) { el.hidden = +el.getAttribute('data-lap') !== ph[2]; });
      }
      var ltop = it, lleft = Math.min(gx * G.bw - 356, G.W - G.bx - 354);
      var lpos = Math.round(lleft) + ',' + Math.round(ltop);
      if (last.lpos !== lpos) { last.lpos = lpos; leg.style.left = Math.round(lleft) + 'px'; leg.style.top = Math.round(ltop) + 'px'; }
    }

    // the water tag rides the waterline between frames; it carries the pathways while the readout is on
    var aA = anc(A), aB = B ? anc(B) : null;
    var wo = (aA.cx ? 1 - t : 0) + (aB && aB.cx ? t : 0);
    var wy = (aA.cx && aB && aB.cx) ? lerp(aA.wy, aB.wy, t) : (aA.cx ? aA.wy : aB ? aB.wy : aA.wy);
    var txt = (ro > 0.5 && (A.a.ro || (B && B.a.ro))) ? 'complexity: ' + p + ' pathways' : 'complexity';
    if (last.wt !== txt) { last.wt = txt; wtext.textContent = txt; }
    var wpx = Math.round((wy || 0) * G.bh);
    if (last.wy !== wpx) { last.wy = wpx; wtag.style.top = wpx + 'px'; }
    if (wo > 0 && activeBoxes.length) {
      var r = wtag.getBoundingClientRect(), wb2 = { top: r.top - G.sr.top, bottom: r.bottom - G.sr.top, left: r.left - G.sr.left, right: r.right - G.sr.left };
      if (activeBoxes.some(function (b) { return hit(b, wb2, 8); })) wo = 0;
    }
    if (G.phone && !hero && wo > 0) {      // the docked readout line and the bar own the bottom of a phone
      var r2 = wtag.getBoundingClientRect();
      if (r2.bottom - G.sr.top > barTop() - 16 - ih - 8) wo = 0;
    }
    setOpacity(wtag, 'wo', RM ? (wo >= 0.5 ? 1 : 0) : +wo.toFixed(3));

    // one button per screen
    setDockOff('offer', offerOn);
  }

  // ---- the dock and the bar step aside while the offer or the form is on screen (or the keyboard is up) -----
  var off = {};
  function setDockOff(k, v) {
    off[k] = v;
    var any = off.offer || off.form || off.kbd;
    if (last.dock !== any) { last.dock = any; html.classList.toggle('dock-off', !!any); }
  }
  if ('IntersectionObserver' in window && form) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        setDockOff('form', e.isIntersecting && e.intersectionRatio >= 0.3);
        if (e.isIntersecting && drainbox) drainbox.classList.add('ld');     // the drain frame loads when the form is near
      });
    }, { threshold: [0, 0.3, 0.6, 1] }).observe(form);
  }
  d.addEventListener('focusin', function (e) { if (G.phone && e.target.tagName === 'INPUT') setDockOff('kbd', true); });
  d.addEventListener('focusout', function (e) { if (e.target.tagName === 'INPUT') setDockOff('kbd', false); });

  // ---- "Get it free": an instant jump to the form (never a smooth scroll through the whole story) ----------
  var get = d.getElementById('get');
  [].forEach.call(d.querySelectorAll('a[href="#get"]'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      html.classList.add('jump'); setDockOff('form', true);     // land clean: no fades from the screen left behind
      setTimeout(function () { html.classList.remove('jump'); }, 400);
      window.scrollTo(0, get.getBoundingClientRect().top + (window.scrollY || window.pageYOffset));
      render();
      if (history.replaceState) history.replaceState(null, '', '#get');
      // keyboard and mouse: focus the field. Touch: no, the keyboard would cover what the file is before it is read.
      if (window.matchMedia('(pointer: fine)').matches) email.focus({ preventScroll: true });
      else get.setAttribute('tabindex', '-1'), get.focus({ preventScroll: true });
    });
  });

  // ---- the form: check the address, drain the water, open the Bootloader page (same tab) --------------------
  if (form) {
    var bad = form.querySelector('.msg-bad'), go = form.querySelector('.msg-go'), btn = form.querySelector('button');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = email.value.trim();
      if (!v || !email.checkValidity()) {
        bad.hidden = false; go.hidden = true; email.setAttribute('aria-invalid', 'true'); email.focus();
        // on a short phone the message lands under the button, below the fold: bring it up
        requestAnimationFrame(function () { var r = bad.getBoundingClientRect(); if (r.bottom > window.innerHeight - 8) window.scrollBy(0, r.bottom - window.innerHeight + 16); });
        return;
      }
      bad.hidden = true; email.removeAttribute('aria-invalid'); go.hidden = false; btn.disabled = true;
      if (drainbox) drainbox.classList.add('ld');
      html.classList.add('draining');
      var url = form.getAttribute('action');            // https://scaling-up-side-down.vercel.app/appendix#get
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
  if (params.has('s')) { window.scrollTo(0, G.top + (+params.get('s')) * G.unit); }
  window.SUSD = { clock: clock, unit: function () { return G.unit; }, top: function () { return G.top; }, measure: measure };
})();
