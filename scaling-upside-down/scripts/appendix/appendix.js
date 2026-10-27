// The Appendix reads completely without this. It adds: the contents' search and current section,
// keyboard access to tables that scroll sideways, copying the starting prompt, and sending the opt-in
// form without leaving the page.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const FILE = "/bootloader.md";
  const NAME = "SUSD-Bootloader.md";

  // ---------- after the web fonts arrive ----------
  // A deep link (/appendix#term-...) is scrolled to while the fallback fonts are still in use; the real
  // fonts then reflow the text. Until they are in, nothing here may scroll (scrolling the contents box ends
  // the browser's own tracking of the target), and once they are in, the target is scrolled to again,
  // unless the reader has already moved, or this load is a reload or a back/forward (or restored-tab)
  // load: there the browser puts back the reader's own place, and that must win over the link.
  const navType = (() => {
    try {
      const e = performance.getEntriesByType?.("navigation")?.[0];
      if (e && e.type) return e.type;
      const t = performance.navigation?.type; // older browsers: 1 = reload, 2 = back/forward
      return t === 1 ? "reload" : t === 2 ? "back_forward" : "navigate";
    } catch {
      return "navigate";
    }
  })();
  const restored = navType === "reload" || navType === "back_forward";
  let moved = false;
  for (const type of ["wheel", "touchstart", "keydown", "mousedown"]) addEventListener(type, () => (moved = true), { passive: true, once: true });
  const fontsIn = new Promise((done) => {
    void document.documentElement.getBoundingClientRect(); // lay out first, so every font the page uses has been asked for
    const ready = document.fonts?.ready;
    if (ready) ready.then(done, done);
    else done();
  });

  // ---------- contents: a sidebar on desktop, folded away on a phone ----------
  const toc = $("#contents");
  const box = $(".toc-nav");
  const narrow = window.matchMedia("(max-width: 999px)");
  const fold = () => {
    if (toc) toc.open = !narrow.matches;
  };
  fold();
  narrow.addEventListener?.("change", fold);
  // on a desktop the sidebar stays open; on a phone a chosen section closes it
  toc?.querySelector("summary")?.addEventListener("click", (e) => {
    if (!narrow.matches) e.preventDefault();
  });
  box?.addEventListener("click", (e) => {
    if (narrow.matches && e.target.closest("a") && toc) toc.open = false;
  });

  // search: a section shows if its title matches (with all its parts) or any of its parts match;
  // the h4s under a part (hidden otherwise) show, and link straight to themselves, when they match
  const search = $("#toc-search");
  const empty = $("#toc-empty");
  const groups = [...document.querySelectorAll(".toc-l > li")];
  const has = (li, q) => {
    const a = li.querySelector(":scope > a");
    return a ? a.textContent.toLowerCase().includes(q) : false;
  };
  search?.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const li of groups) {
      const self = !q || has(li, q);
      let any = false;
      for (const p of li.querySelectorAll(":scope > ol > li")) {
        let sub = false;
        for (const h of p.matches(".t4") ? [p] : p.querySelectorAll(":scope > ol > li.t4")) {
          h.hidden = !(q && has(h, q));
          sub ||= !h.hidden;
        }
        if (!p.matches(".t4")) p.hidden = !(self || has(p, q) || sub);
        any ||= !p.hidden;
      }
      li.hidden = !(self || any);
      if (!li.hidden) shown++;
    }
    if (empty) empty.textContent = shown ? "" : "No section matches.";
  });

  // the section on screen: the last heading above the top third, marked in the contents (and kept in view there)
  const links = new Map();
  for (const a of document.querySelectorAll('.toc-l li:not(.t4) > a[href^="#"]')) links.set(decodeURIComponent(a.getAttribute("href").slice(1)), a);
  const heads = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  let current = null;
  let queued = 0;
  let boxFree = false; // the contents box is scrolled only once the fonts are in (see above)
  const update = () => {
    queued = 0;
    const line = window.innerHeight * 0.3;
    let at = null;
    for (const h of heads) {
      if (h.getBoundingClientRect().top <= line) at = h;
      else break;
    }
    const a = at ? links.get(at.id) : null;
    if (a === current) return;
    current?.removeAttribute("aria-current");
    if (a) a.setAttribute("aria-current", "location");
    current = a;
    if (!a || !box || narrow.matches || !boxFree) return;
    const r = a.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (r.top < b.top + 24 || r.bottom > b.bottom - 24) box.scrollTop += r.top - b.top - b.height / 3;
  };
  const queue = () => {
    if (!queued) queued = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("hashchange", queue);
  queue();

  // ---------- tables: a tab stop and a named region only while one actually scrolls sideways ----------
  // named by the nearest heading above (plus "table 2 of 3" where one heading has several)
  const tables = [...document.querySelectorAll(".doc .tw")];
  const named = new Map(); // wrapper -> { h: heading id, n: its number under that heading }
  const perHead = new Map();
  {
    let last = null;
    for (const el of document.querySelectorAll(".doc :is(h2, h3, h4, h5, h6), .doc .tw")) {
      if (!el.matches(".tw")) {
        if (el.id) last = el.id;
        continue;
      }
      const n = (perHead.get(last) ?? 0) + 1;
      perHead.set(last, n);
      named.set(el, { h: last, n });
    }
  }
  const label = (t, i) => {
    const { h, n } = named.get(t) ?? { h: null, n: 1 };
    const of = perHead.get(h) ?? 1;
    if (!h) return t.setAttribute("aria-label", of > 1 ? `Table ${n} of ${of}` : "Table");
    if (of === 1) return t.setAttribute("aria-labelledby", h);
    if (!t.id) {
      let id = `tw-${i + 1}`;
      while (document.getElementById(id)) id += "-t";
      t.id = id;
    }
    t.setAttribute("aria-label", `table ${n} of ${of}`);
    t.setAttribute("aria-labelledby", `${h} ${t.id}`); // the heading's words, then this table's own number
  };
  let sizing = 0;
  const sizeTables = () => {
    sizing = 0;
    const over = tables.map((t) => t.scrollWidth > t.clientWidth + 1); // read everything, then write
    tables.forEach((t, i) => {
      if (over[i] === t.hasAttribute("tabindex")) return;
      if (over[i]) {
        t.tabIndex = 0;
        t.setAttribute("role", "region");
        label(t, i);
      } else for (const k of ["tabindex", "role", "aria-labelledby", "aria-label"]) t.removeAttribute(k);
    });
  };
  const queueSize = () => {
    if (!sizing) sizing = requestAnimationFrame(sizeTables);
  };
  sizeTables();
  window.addEventListener("resize", queueSize);

  fontsIn.then(() => {
    let target = null;
    try {
      target = !restored && location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    } catch {
      target = null;
    }
    if (target && !moved) target.scrollIntoView();
    boxFree = true;
    current?.removeAttribute("aria-current");
    current = null;
    queue();
    queueSize();
  });

  // ---------- copy the starting prompt ----------
  const copyBtn = $("#copy-prompt");
  const prompt = $("#starting-prompt");
  const copyStatus = $("#copy-status");
  const copyLabel = copyBtn ? copyBtn.textContent : "";
  let copyTimer = 0;
  copyBtn?.addEventListener("click", () => {
    const t = prompt ? prompt.textContent : "";
    if (copyStatus) copyStatus.textContent = "";
    const done = (ok) => {
      copyBtn.textContent = ok ? "Copied" : "Select the prompt above and copy it";
      if (copyStatus) copyStatus.textContent = ok ? "Starting prompt copied." : "Couldn't copy. Select the prompt above and copy it.";
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => {
        copyBtn.textContent = copyLabel;
        if (copyStatus) copyStatus.textContent = "";
      }, 2400);
    };
    const legacy = () => {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      ta.remove();
      copyBtn.focus();
      return ok;
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(t).then(() => done(true), () => done(legacy()));
    else done(legacy());
  });

  // ---------- the opt-in ----------
  const form = $("#optin");
  if (!form) return;
  const field = form.elements.namedItem("email");
  const trap = form.elements.namedItem("company");
  const msg = $("#optin-msg");
  const say = (html, kind) => {
    msg.innerHTML = html;
    if (kind) msg.dataset.kind = kind;
    else delete msg.dataset.kind;
  };
  const fileLink = `<a href="${FILE}" download="${NAME}">Download the Bootloader (.md)</a>`;
  const invalid = (on) => {
    if (on) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  };
  // the field and the button go away on success, so focus moves to the message (it keeps the file's link)
  const settle = (html) => {
    form.dataset.state = "sent";
    say(html, "ok");
    msg.tabIndex = -1;
    msg.focus();
  };
  field.addEventListener("input", () => invalid(false));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.dataset.state === "sending") return;
    const email = field.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      invalid(true);
      say("Enter a valid email address.", "error");
      field.focus();
      return;
    }
    invalid(false);
    form.dataset.state = "sending";
    say("Sending…");
    try {
      const r = await fetch("/api/optin", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email, source: "appendix", company: trap ? trap.value : "" }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok && d.already) {
        // already signed up: the service will not email it again, so the file is here instead
        settle(`You're already on the list. Here's the file. ${fileLink}`);
      } else if (r.ok && d.ok && d.emailed) {
        settle(`Sent. Check your inbox. ${fileLink}`);
      } else if (r.ok && d.ok) {
        settle(`Email delivery isn't connected yet, so here's the file now. ${fileLink}`);
        // the link above is the sure way; this starts the download where the browser allows it
        const a = document.createElement("a");
        a.href = FILE;
        a.download = NAME;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else if (r.status === 400 && d.error === "email") {
        delete form.dataset.state;
        invalid(true);
        say("Enter a valid email address.", "error");
        field.focus();
      } else throw new Error(String(r.status));
    } catch {
      // the field and the button stay where they were (and so does focus); the message offers the file
      delete form.dataset.state;
      say(`Couldn't send. Download the file instead. ${fileLink}`, "error");
    }
  });
})();
