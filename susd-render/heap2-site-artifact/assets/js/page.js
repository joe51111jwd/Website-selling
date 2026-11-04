/* Scaling Up-Side-Down: The Heap v2, clean. The page: the story clock, the words' windows, the chrome and the form.
   - t = scroll progress through #story (0..1). The scene (heap2.js) reads window.SUSD.t; the words read it here.
   - each .cap has data-a / data-b (its window in t) and data-f (fade length, default 0.012). Reduced motion: cuts.
   - "Get it free" jumps straight to #get (never a smooth scroll through the story) and steps aside over the form.
   - the form: an invalid address shows the error label; a valid one shows the going label, then the same tab opens
     the Bootloader page. Nothing is sent from here and the field has no name, so the email is never in a URL.
     In the framed copy (form[data-newtab], the claude.ai artifact) it opens a new tab instead, inside the submit
     handler, with a visible link if the browser blocks it; the frame itself is never navigated.
   Plain ES5, no dependencies. Without WebGL (html lacks .gl) the story is a stack of stills and only the chrome and
   the form run. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  var SUSD = window.SUSD = window.SUSD || {};
  var RM = html.classList.contains('rm');
  var params = new URLSearchParams(location.search);
  var story = d.getElementById('story');
  var caps = [].slice.call(d.querySelectorAll('.cap'));
  var form = d.getElementById('get-form'), email = d.getElementById('email');
  // the framed copy (claude.ai artifact) marks its form data-newtab: the page then never navigates or rewrites its frame
  var NEWTAB = !!(form && form.hasAttribute('data-newtab'));
  var phone = window.matchMedia('(max-width: 720px), (max-aspect-ratio: 4/5)');

  function c01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function lin(a, b, x) { return c01((x - a) / (b - a)); }
  var spans = caps.map(function (el) {
    return { el: el, a: +el.getAttribute('data-a'), b: +el.getAttribute('data-b'), f: +(el.getAttribute('data-f') || 0.012), o: -1 };
  });
  // a second sentence that lands a beat after the first, inside the same line (span.punch, its own data-a / data-f);
  // its line fades out with the rest of the cap
  var punches = [].slice.call(d.querySelectorAll('.cap .punch')).map(function (el) {
    return { el: el, a: +el.getAttribute('data-a'), f: +(el.getAttribute('data-f') || 0.008), o: -1 };
  });

  function tNow() {
    if (!story || !html.classList.contains('gl')) return 0;
    var r = story.getBoundingClientRect(), H = story.offsetHeight - window.innerHeight;
    return H > 0 ? c01(-r.top / H) : 0;
  }
  var last = {};
  var chromeHero = [].slice.call(d.querySelectorAll('.top .title,.top .getit,.bar'));
  function render() {
    var t = tNow();
    SUSD.t = t;
    for (var i = 0; i < spans.length; i++) {
      var s = spans[i], o;
      if (RM) o = t >= s.a && t < s.b ? 1 : 0;
      else o = Math.min(lin(s.a, s.a + s.f, t), 1 - lin(s.b - s.f, s.b, t));
      if (s.a <= 0 && t <= s.a + s.f) o = Math.min(1, 1 - lin(s.b - s.f, s.b, t));
      o = Math.round(o * 1000) / 1000;
      if (o !== s.o) {
        s.o = o;
        s.el.style.opacity = o;
        s.el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
        s.el.style.transform = RM ? '' : 'translate3d(0,' + ((1 - o) * 10).toFixed(1) + 'px,0)';
      }
    }
    for (var k = 0; k < punches.length; k++) {
      var pu = punches[k], po = RM ? (t >= pu.a ? 1 : 0) : lin(pu.a, pu.a + pu.f, t);
      po = Math.round(po * 1000) / 1000;
      if (po !== pu.o) { pu.o = po; pu.el.style.opacity = po; pu.el.style.transform = RM ? '' : 'translate3d(0,' + ((1 - po) * 8).toFixed(1) + 'px,0)'; }
    }
    // on the first screen the hero has the title and the one button: the chrome's title and its "Get it free" (the
    // phone's bar too) wait until the hero goes, so there is never more than one button on screen
    var ho = html.classList.contains('gl') && spans.length ? spans[0].o : 0;   // spans[0] is the hero
    if (ho !== last.ho) {
      last.ho = ho;
      for (var c = 0; c < chromeHero.length; c++) {
        // no inline opacity once the hero is gone, so .dock-off (over the form) still hides the button
        chromeHero[c].style.opacity = ho > 0 ? (1 - ho).toFixed(3) : '';
        chromeHero[c].style.visibility = ho > 0.99 ? 'hidden' : '';
      }
    }
  }
  var queued = false;
  function request() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; render(); }); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { layout(); request(); });

  // ---- the room the hero leaves for the title (the scene fits the cable title between these two lines) -----------
  function layout() {
    var line = d.querySelector('.cap.hero p'), top = d.querySelector('.top');   // the hero's first line (the byline)
    if (!line || !top) return;
    var tb = 0;
    [].forEach.call(top.children, function (el) { var r = el.getBoundingClientRect(); if (r.height > 0) tb = Math.max(tb, r.bottom); });
    // offsets, not rects: the hero's fade moves it by a few px, its resting place is what counts
    SUSD.layout = { top: tb, hero: line.parentNode.offsetTop + line.offsetTop, w: window.innerWidth, h: window.innerHeight };
    SUSD.layoutV = (SUSD.layoutV || 0) + 1;
  }
  layout();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(layout);

  // ---- the chrome steps aside while the form is on screen (or the phone keyboard is up) ----------------------------
  var off = {};
  function setOff(k, v) {
    off[k] = v;
    var any = !!(off.form || off.kbd);
    if (last.off !== any) { last.off = any; html.classList.toggle('dock-off', any); }
  }
  if ('IntersectionObserver' in window && form) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { setOff('form', e.isIntersecting && e.intersectionRatio >= 0.3); });
    }, { threshold: [0, 0.3, 0.6, 1] }).observe(form);
  }
  d.addEventListener('focusin', function (e) { if (phone.matches && e.target.tagName === 'INPUT') setOff('kbd', true); });
  d.addEventListener('focusout', function (e) { if (e.target.tagName === 'INPUT') setOff('kbd', false); });

  // ---- "Get it free": an instant jump to the form ---------------------------------------------------------------
  var get = d.getElementById('get');
  [].forEach.call(d.querySelectorAll('a[href="#get"]'), function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      setOff('form', true);
      SUSD.snap = true;   // the scene cuts to the end instead of easing through the story behind the form
      window.scrollTo(0, get.getBoundingClientRect().top + (window.scrollY || window.pageYOffset));
      render();
      if (!NEWTAB) try { if (history.replaceState) history.replaceState(null, '', '#get'); } catch (er) {}
      // keyboard and mouse: focus the field. Touch: no, the keyboard would cover what the file is before it is read.
      if (window.matchMedia('(pointer: fine)').matches) email.focus({ preventScroll: true });
      else { get.setAttribute('tabindex', '-1'); get.focus({ preventScroll: true }); }
    });
  });

  // ---- the form (same behaviour as The Heap v1) ------------------------------------------------------------------
  if (form) {
    var bad = form.querySelector('.msg-bad'), go = form.querySelector('.msg-go'), btn = form.querySelector('button');
    var blocked = form.querySelector('.msg-blocked');
    // a message that lands just under the fold (short phones) is brought into view
    var reveal = function (el) {
      requestAnimationFrame(function () { var r = el.getBoundingClientRect(); if (r.height && r.bottom > window.innerHeight - 8) window.scrollBy(0, r.bottom - window.innerHeight + 16); });
    };
    var send = function (e) {
      if (e) e.preventDefault();
      var v = email.value.trim();
      if (!v || !email.checkValidity()) {
        bad.hidden = false; go.hidden = true; email.setAttribute('aria-invalid', 'true'); email.focus();
        reveal(bad);
        return;
      }
      bad.hidden = true; email.removeAttribute('aria-invalid');
      var url = form.getAttribute('action');            // https://scaling-up-side-down.vercel.app/appendix#get
      if (NEWTAB) {
        // a new tab, opened inside the submit gesture (synchronously, or the browser blocks it); if it is blocked
        // anyway, a visible link to the same page
        var w = null;
        if (!params.has('nonav')) { try { w = window.open(url, '_blank'); } catch (er) { w = null; } }
        if (w) { try { w.opener = null; } catch (er) {} go.hidden = false; if (blocked) blocked.hidden = true; reveal(go); }
        else { go.hidden = true; if (blocked) { blocked.hidden = false; reveal(blocked); } }
        return;
      }
      go.hidden = false; btn.disabled = true; reveal(go);
      if (params.has('nonav')) return;
      setTimeout(function () { location.assign(url); }, RM ? 300 : 800);
    };
    form.addEventListener('submit', send);
    if (NEWTAB) {
      // a sandboxed frame without allow-forms blocks the submission before any submit event fires, so in the framed
      // copy the button and the Enter key never submit the form: they call send directly (still a user gesture)
      btn.type = 'button';
      btn.addEventListener('click', send);
      email.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.keyCode === 13) send(e); });
    }
    email.addEventListener('input', function () { if (!bad.hidden) { bad.hidden = true; email.removeAttribute('aria-invalid'); } });
  }

  // a test hook: ?t=0.42 starts the story at that point
  if (params.has('t') && story && html.classList.contains('gl')) {
    var H = story.offsetHeight - window.innerHeight;
    window.scrollTo(0, story.offsetTop + (+params.get('t')) * H);
  }
  render();
  SUSD.render = render;
})();
