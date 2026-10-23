// One HTML build is served on *.vercel.app and on smartcrewhq.com. A noindex meta baked into
// that HTML would follow the files onto the real domain, so the meta is added in the browser
// only when the hostname is a Vercel host. Crawlers that do not run JavaScript still see
// X-Robots-Tag from vercel.json on those hosts (see vercel.json).

/** Inline script for every HTML page. Marker: sc-preview-robots. */
export function previewRobotsSnippet(): string {
  return `<script>
/* sc-preview-robots: noindex only when the hostname is a vercel.app host. */
(function () {
  if (!/(^|\\.)vercel\\.app$/i.test(location.hostname)) return;
  var nodes = document.querySelectorAll('meta[name="robots"]');
  for (var i = nodes.length - 1; i >= 0; i--) nodes[i].parentNode.removeChild(nodes[i]);
  var meta = document.createElement("meta");
  meta.setAttribute("name", "robots");
  meta.setAttribute("content", "noindex, nofollow");
  document.head.appendChild(meta);
})();
</script>`;
}
