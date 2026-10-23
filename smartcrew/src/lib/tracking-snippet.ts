import { config } from "../config";

// The three tags from smartcrewhq.com (Meta's standard PageView base, Crisp, Mouseflow), with the
// IDs in config.ts. One HTML build is served on the preview and on the real domain, so the script
// itself applies the same host rules as liveSite and mouseflowPreview in track.ts:
// Pixel and Crisp only on the real site; Mouseflow also on smartcrew-preview.vercel.app.

function mouseflowTag(id: string) {
  return `window._mfq = window._mfq || [];
(function() {
  var mf = document.createElement("script");
  mf.type = "text/javascript"; mf.defer = true;
  mf.src = "//cdn.mouseflow.com/projects/${id}.js";
  document.getElementsByTagName("head")[0].appendChild(mf);
})();`;
}

/** Inline block for every HTML page, including the prerendered SEO pages. */
export function trackingSnippets(): string {
  const { metaPixelId, crispId, mouseflowId } = config;
  const pixel = metaPixelId
    ? `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${metaPixelId}');fbq('track', 'PageView');`
    : "";
  const crisp = crispId
    ? `window.$crisp=[];window.CRISP_WEBSITE_ID="${crispId}";(function(){var d=document,s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`
    : "";
  const mouseflow = mouseflowId ? mouseflowTag(mouseflowId) : "";
  if (!pixel && !crisp && !mouseflow) return "";
  return `<script>
(function () {
  var h = location.hostname;
  var live = location.protocol === "https:" && !!h && !/(^|\\.)vercel\\.app$|^localhost$|^127\\.|^0\\.0\\.0\\.0$|^\\[?::1\\]?$/.test(h);
  var mfPreview = location.protocol === "https:" && h === "smartcrew-preview.vercel.app";
  if (!live && !mfPreview) return;
  if (live) {
    ${pixel}
    ${crisp}
  }
  ${mouseflow}
})();
</script>`;
}
