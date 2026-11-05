// Everything here is enhancement: without JavaScript every page reads in full and the X-ray shows its last step.
document.documentElement.classList.add("js");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Header: solid once the page has scrolled.
const bar = document.querySelector<HTMLElement>("[data-top]");
const onScroll = () => bar?.toggleAttribute("data-scrolled", scrollY > 24);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile menu.
const btn = document.querySelector<HTMLButtonElement>("[data-menu-btn]");
const setMenu = (open: boolean) => {
  btn?.setAttribute("aria-expanded", String(open));
  bar?.toggleAttribute("data-open", open);
};
btn?.addEventListener("click", () => setMenu(btn.getAttribute("aria-expanded") !== "true"));
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && btn?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    btn.focus();
  }
});
document.querySelectorAll("#menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

// Hero headline: words blur in one by one.
let d = 0;
document.querySelectorAll<HTMLElement>("[data-words]").forEach((el) => {
  const words = (el.textContent ?? "").trim().split(/\s+/);
  el.textContent = "";
  words.forEach((w, i) => {
    const s = document.createElement("span");
    s.className = "w";
    s.style.setProperty("--d", String(d++));
    s.textContent = w;
    el.append(s);
    if (i < words.length - 1) el.append(" ");
  });
});

// The X-ray: the step in the middle of the screen sets the stage.
const xray = document.querySelector<HTMLElement>("[data-xray]");
if (xray) {
  const stage = xray.querySelector<HTMLElement>("[data-stage]")!;
  const steps = [...xray.querySelectorAll<HTMLElement>(".xray-step")];
  stage.dataset.stage = "0";
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        steps.forEach((s) => s.toggleAttribute("data-on", s === el));
        stage.dataset.stage = el.dataset.step ?? "0";
      }
    },
    { rootMargin: matchMedia("(max-width: 899px)").matches ? "-75% 0px -20% 0px" : "-48% 0px -48% 0px" },
  );
  steps.forEach((s) => io.observe(s));
  steps[0]?.setAttribute("data-on", "");
}

// Reveal on scroll, staggered within a group.
if (!reduced && "IntersectionObserver" in window) {
  document.querySelectorAll("[data-reveal-group]").forEach((g) =>
    g.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, i) => el.style.setProperty("--r", String(i % 6))),
  );
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
}
export {};
