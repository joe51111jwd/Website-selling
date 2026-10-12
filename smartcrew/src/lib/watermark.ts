// Preview builds only (`npm run build:watermark`): a tiled watermark over everything, plus
// light deterrents against copying. The watermark lives in a closed shadow root above every
// layer (the 3D canvases and the inspector included) and puts itself back if it's removed.
// None of this stops a determined person; it stops casual lifting and marks every screenshot.

export function installWatermark(spec: string) {
  const lines = spec.split("|").map((s) => s.trim()).filter(Boolean);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const W = 560;
  const H = 300;
  const text = lines
    .map((l, i) => `<text x="${W / 2}" y="${H / 2 - ((lines.length - 1) * 13) + i * 26}" text-anchor="middle">${esc(l)}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><g transform="rotate(-24 ${W / 2} ${H / 2})" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="16" font-weight="700" letter-spacing="2" fill="rgb(128,128,128)" fill-opacity="0.32">${text}</g></svg>`;
  const tile = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  const css = `position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;display:block!important;opacity:1!important;visibility:visible!important;background-image:${tile}!important;background-repeat:repeat!important;background-size:${W}px ${H}px!important;`;

  const HOST = "position: fixed !important; inset: 0px !important; z-index: 2147483647 !important; pointer-events: none !important; display: block !important;";
  let host: HTMLElement;
  const mount = () => {
    host = document.createElement("smartcrew-preview");
    host.setAttribute("aria-hidden", "true");
    const root = host.attachShadow({ mode: "closed" });
    const layer = document.createElement("div");
    layer.style.cssText = css;
    root.appendChild(layer);
    host.style.cssText = HOST;
    document.body.appendChild(host);
    // if its own styles are tampered with, swap in a fresh one
    new MutationObserver(() => !intact() && (host.remove(), mount())).observe(host, { attributes: true });
  };
  const intact = () => {
    if (!host.isConnected) return false;
    const s = getComputedStyle(host);
    return s.display !== "none" && s.position === "fixed" && s.zIndex === "2147483647" && s.visibility !== "hidden" && s.opacity === "1";
  };
  mount();
  // put it back if it's deleted or hidden
  new MutationObserver(() => {
    if (!host.isConnected) mount();
  }).observe(document.body, { childList: true });
  setInterval(() => {
    if (!intact()) {
      host.remove();
      mount();
    }
  }, 1500);

  // no right-click, dragging, copying, saving or printing outside of the form fields
  const field = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input, textarea");
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("dragstart", (e) => e.preventDefault());
  document.addEventListener("copy", (e) => !field(e.target) && e.preventDefault());
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && ["s", "p", "u"].includes(e.key.toLowerCase())) e.preventDefault();
  });
  const style = document.createElement("style");
  style.textContent = `body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}input,textarea{-webkit-user-select:text;user-select:text}@media print{body{display:none!important}}`;
  document.head.appendChild(style);
}
