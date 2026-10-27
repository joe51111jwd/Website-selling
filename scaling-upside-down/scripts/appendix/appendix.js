// The Appendix reads completely without this. It adds: the contents' search and current section,
// copying the starting prompt, and sending the opt-in form without leaving the page.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const FILE = "/bootloader.md";
  const NAME = "SUSD-Bootloader.md";

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

  // search: a section shows if its title matches (with all its parts) or any of its parts match
  const search = $("#toc-search");
  const empty = $("#toc-empty");
  const groups = [...document.querySelectorAll(".toc-l > li")];
  search?.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const li of groups) {
      const head = li.querySelector(":scope > a");
      const parts = [...li.querySelectorAll(":scope > ol > li")];
      const self = !q || (head ? head.textContent.toLowerCase().includes(q) : false);
      let any = false;
      for (const p of parts) {
        const m = self || p.textContent.toLowerCase().includes(q);
        p.hidden = !m;
        any ||= m;
      }
      li.hidden = !(self || any);
      if (!li.hidden) shown++;
    }
    if (empty) empty.hidden = shown > 0;
  });

  // the section on screen: the last heading above the top third, marked in the contents (and kept in view there)
  const links = new Map();
  for (const a of document.querySelectorAll('.toc-l a[href^="#"]')) links.set(decodeURIComponent(a.getAttribute("href").slice(1)), a);
  const heads = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  let current = null;
  let queued = 0;
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
    if (!a || !box || narrow.matches) return;
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

  // ---------- copy the starting prompt ----------
  const copyBtn = $("#copy-prompt");
  const prompt = $("#starting-prompt");
  copyBtn?.addEventListener("click", () => {
    const t = prompt ? prompt.textContent : "";
    const label = copyBtn.textContent;
    const done = (ok) => {
      copyBtn.textContent = ok ? "Copied" : "Select the prompt above and copy it";
      window.setTimeout(() => (copyBtn.textContent = label), 2400);
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
      if (r.ok && d.ok && d.emailed) {
        form.dataset.state = "sent";
        say(`Sent. Check your inbox. ${fileLink}`, "ok");
      } else if (r.ok && d.ok) {
        form.dataset.state = "sent";
        say(`Email delivery isn't connected yet, so here's the file now. ${fileLink}`, "ok");
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
      delete form.dataset.state;
      say(`Couldn't send. Download the file instead. ${fileLink}`, "error");
    }
  });
})();
