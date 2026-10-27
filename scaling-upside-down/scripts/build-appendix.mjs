// The Appendix: the SUSD Bootloader as one static page, for readers and for AI crawlers (which read
// the HTML and do not run JavaScript). Runs after `vite build` (npm run build):
//
//   node scripts/build-appendix.mjs
//
// Absolute URLs use the origin from scripts/site.mjs: SITE_URL if set, else Vercel's production domain
// (VERCEL_PROJECT_PRODUCTION_URL), else the vercel.app address. APPENDIX_OUT=<folder> writes somewhere other
// than dist/ (for testing).
//
// Reads public/bootloader.md and src/notice.json; writes dist/appendix.html (served at /appendix),
// dist/llms.txt, dist/llms-full.txt, dist/sitemap.xml and dist/robots.txt. The page's CSS and JS
// (scripts/appendix/) are inlined, so it is one request. Every heading and every term in the
// Vocabulary Lock gets a permanent anchor, so any part of the system has its own citable URL.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { siteUrl } from "./site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = process.env.APPENDIX_OUT || join(ROOT, "dist"); // the built site
const SITE = siteUrl();
const PAGE = `${SITE}/appendix`;
const HOST = SITE.replace(/^https?:\/\//, "");
const MD_PATH = join(ROOT, "public", "bootloader.md");
const md = readFileSync(MD_PATH, "utf8").replace(/\r\n?/g, "\n");
const notice = JSON.parse(readFileSync(join(ROOT, "src", "notice.json"), "utf8"));
const css = readFileSync(join(ROOT, "scripts", "appendix", "appendix.css"), "utf8");
const js = readFileSync(join(ROOT, "scripts", "appendix", "appendix.js"), "utf8");

// ---------- the manuscript's own words for the page (house rule: sentences verbatim, line cited) ----------
const TWO_FORMS = "This appendix exists in two forms: the pages that follow, and a downloadable file designed to be loaded into any AI assistant you already use."; // L4495
const REFERENCE = "The pages are reference. The file is the operating system."; // L4497
const SPEC = "The SUSD Bootloader is a specification designed for use with third-party artificial-intelligence systems."; // L4561 (1st sentence)
const UPLOAD = "Upload the file and use the starting prompt provided with it."; // L4531

// ---------- facts read from the file itself, so a new version needs nothing else ----------
const words = (md.match(/\S*[\p{L}\p{N}]\S*/gu) ?? []).length; // words, not Markdown (same count as the site)
const bytes = Buffer.byteLength(md, "utf8");
const kb = `${Math.round(bytes / 1024)} KB`;
const verMatch = md.match(/\*\*Document Version:\*\*\s*SUSD_Bootloader_(V[\w.]+)\s*\(([^)]+)\)/);
const version = verMatch ? verMatch[1] : "";
const updated = verMatch ? verMatch[2].trim() : "";
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const updatedIso = (() => {
  const m = updated.toLowerCase().match(/([a-z]+)\s+(\d{4})/);
  const i = m ? MONTHS.indexOf(m[1]) : -1;
  return i >= 0 ? `${m[2]}-${String(i + 1).padStart(2, "0")}` : "";
})();
// The day the Bootloader last changed, for the sitemap's <lastmod> and the JSON-LD dateModified. It must not
// move on a redeploy, so it is the file's own "Document Version: ... (October 2026)" as the first of that
// month, unless git history names the commit that last changed the file. A shallow clone's oldest commit does
// not count (there every file looks newly added), and the file's mtime never does (that is the checkout time).
const modified = (() => {
  const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  try {
    const [hash, day] = git("log", "-1", "--format=%H %cs", "--", "public/bootloader.md").split(" ");
    if (hash && /^\d{4}-\d{2}-\d{2}$/.test(day ?? "")) {
      const parentless = git("rev-list", "--parents", "-n", "1", hash).split(" ").length === 1;
      if (!(parentless && git("rev-parse", "--is-shallow-repository") === "true")) return day;
    }
  } catch {
    /* no git here: the file's own date */
  }
  return updatedIso ? `${updatedIso}-01` : "";
})();
const promptMatch = md.match(/\*\*Canonical Prompt \(For Users\)\*\*[\s\S]*?```[^\n]*\n([\s\S]*?)\n```/);
const startingPrompt = promptMatch ? promptMatch[1] : "";
const purpose = (md.match(/## PURPOSE\s+([^\n]+)/) || [])[1] || ""; // the Bootloader's own first lines

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const text = (html) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
const slugify = (s) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
// ids the page itself uses, so no heading can take one; then first come, first served, in document order
const used = new Set(["top", "main", "nav", "contents", "toc-search", "toc-empty", "get", "get-h", "load-h", "optin", "optin-email", "optin-msg", "copy-prompt", "copy-status", "starting-prompt", "canonical-prompt", "bootloader", "use-notice", "use-notice-h", "cite", "cite-h", "end", "foot", "optin-sent", "optin-file", "optin-already", "optin-failed", "optin-error"]);
const unique = (base) => {
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  used.add(id);
  return id;
};

// ---------- the document ----------
const toc = []; // { depth: 2 | 3 | 4, id, text } (h4s are listed hidden: the contents search finds them)
const terms = []; // { id, term }
let pageTitleSeen = false;
const marked = new Marked({ gfm: true });
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      const plain = text(inner);
      if (depth === 1) {
        // the file's title is the page's <h1> (in the header); its later part titles are banners, not headings
        if (!pageTitleSeen) {
          pageTitleSeen = true;
          return "";
        }
        const [k, ...rest] = plain.split(/:\s*/);
        const t = rest.join(": ");
        return `<div class="part"><span class="part-mark" aria-hidden="true"><i></i><i></i><i></i></span><span class="part-k">${esc(k)}</span>${t ? `<span class="part-t">${esc(t)}</span>` : ""}</div>\n`;
      }
      const base = slugify(plain);
      const id = unique(/^\d/.test(base) ? `sec-${base}` : base); // "2.4 The 12 Systems" -> #sec-2-4-the-12-systems
      if (depth <= 4) toc.push({ depth, id, text: plain });
      // the section number in mono, the words unchanged (the text a crawler reads stays the file's)
      const shown = inner.replace(/^(Section \d+(?: \(Continued\))?:|INVERSION #\d+:|\d+(?:\.\d+)+[a-z]?(?=\s))/, '<span class="hn">$1</span>');
      return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1"></a>${shown}</h${depth}>\n`;
    },
    table(token) {
      const head = token.header.map((c) => this.parser.parseInline(c.tokens));
      const isTerms = text(head[0]).startsWith("Use This"); // the Vocabulary Lock: one anchor per term
      const al = (i) => (token.align[i] ? ` style="text-align:${token.align[i]}"` : "");
      // a plain wrapper: appendix.js makes it a named, focusable region only while it actually scrolls sideways
      let out = `<div class="tw"><table class="c${head.length}${isTerms ? " terms" : ""}"><thead><tr>`;
      out += head.map((h, i) => `<th scope="col"${al(i)}>${h}</th>`).join("");
      out += "</tr></thead><tbody>";
      for (const row of token.rows) {
        const cells = row.map((c) => this.parser.parseInline(c.tokens));
        let open = "<tr>";
        let first = `<td${al(0)}>${cells[0]}</td>`;
        if (isTerms && text(cells[0])) {
          const term = text(cells[0]);
          const id = unique(`term-${slugify(term)}`);
          terms.push({ id, term });
          open = `<tr id="${id}">`;
          first = `<th scope="row"${al(0)}><a class="anchor t" href="#${id}" aria-hidden="true" tabindex="-1"></a>${cells[0]}</th>`;
        }
        out += open + first + cells.slice(1).map((c, i) => `<td${al(i + 1)}>${c}</td>`).join("") + "</tr>";
      }
      return `${out}</tbody></table></div>\n`;
    },
    code({ text: code }) {
      const isPrompt = code.startsWith("You are my Scaling Up-Side-Down operating assistant");
      return `<pre class="code${isPrompt ? " prompt" : ""}"${isPrompt ? ' id="canonical-prompt"' : ""}><code>${esc(code)}</code></pre>\n`;
    },
  },
});
const article = marked.parse(md);

// ---------- contents ----------
const label = (t) => esc(t).replace(/^(Section \d+(?: \(Continued\))?:|INVERSION #\d+:|\d+(?:\.\d+)+[a-z]?(?=\s))/, '<span class="tn">$1</span>');
const tocList = (() => {
  let out = '<ol class="toc-l">';
  out += '<li class="x"><a href="#get">Get the Bootloader</a></li>';
  // sections (h2) hold their subsections (h3); an h3 holds its h4s, which stay hidden until the search finds them
  let open2 = false;
  let open3 = false;
  let open4 = false;
  const close4 = () => {
    if (open4) out += "</ol>";
    open4 = false;
  };
  const close3 = () => {
    close4();
    if (open3) out += "</li>";
    open3 = false;
  };
  const close2 = () => {
    close3();
    if (open2) out += "</ol></li>";
    open2 = false;
  };
  for (const t of toc) {
    const link = `<a href="#${t.id}">${label(t.text)}</a>`;
    if (t.depth === 2) {
      close2();
      out += `<li>${link}<ol>`;
      open2 = true;
      continue;
    }
    if (!open2) {
      out += "<li><ol>";
      open2 = true;
    }
    if (t.depth === 3) {
      close3();
      out += `<li>${link}`;
      open3 = true;
    } else if (open3) {
      if (!open4) out += '<ol class="t4l">';
      open4 = true;
      out += `<li class="t4" hidden>${link}</li>`;
    } else out += `<li class="t4" hidden>${link}</li>`; // an h4 straight under a section
  }
  close2();
  out += '<li class="x"><a href="#use-notice">Use notice</a></li><li class="x"><a href="#cite">How to cite</a></li>';
  return `${out}</ol>`;
})();

// ---------- the use notice (the same words as the site's dialog) ----------
const noticeHtml = (() => {
  const [subtitle, ...rest] = notice.paragraphs;
  const body = rest
    .map((p) => {
      if (p.startsWith("## ")) {
        const t = p.slice(3);
        return `<h3 id="${unique(`notice-${slugify(t)}`)}">${esc(t)}</h3>`;
      }
      return `<p>${esc(p)}</p>`;
    })
    .join("\n");
  return `<section class="notice" id="use-notice" aria-labelledby="use-notice-h">
<p class="kicker"><span class="tri" aria-hidden="true"><i></i><i></i><i></i></span>Use notice</p>
<h2 id="use-notice-h">${esc(notice.title)}</h2>
<p class="notice-sub">${esc(subtitle)}</p>
${body}
</section>`;
})();

// ---------- structured data ----------
const description = `${TWO_FORMS} ${REFERENCE}`;
const ld = [
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${PAGE}#bootloader`,
    headline: "The SUSD Bootloader",
    alternativeHeadline: "Scaling Up-Side-Down Operating System: the Appendix",
    name: `SUSD Bootloader ${version}`.trim(),
    description: `${SPEC} ${REFERENCE}`,
    abstract: purpose,
    url: PAGE,
    mainEntityOfPage: PAGE,
    author: { "@type": "Person", name: "Michael Wentz" },
    creator: { "@type": "Person", name: "Michael Wentz" },
    version,
    wordCount: words,
    ...(modified ? { dateModified: modified } : {}),
    inLanguage: "en",
    isPartOf: { "@type": "Book", "@id": `${SITE}/#book`, name: "Scaling Up-Side-Down", url: `${SITE}/` }, // the home page's Book
    encoding: { "@type": "MediaObject", contentUrl: `${SITE}/bootloader.md`, encodingFormat: "text/markdown", contentSize: kb, name: "SUSD-Bootloader.md" },
    articleSection: toc.filter((t) => t.depth === 2).map((t) => t.text),
    keywords: terms.slice(0, 40).map((t) => t.term).join(", "),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Scaling Up-Side-Down", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "The Appendix: SUSD Bootloader", item: PAGE },
    ],
  },
];
const ldTags = ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");

// ---------- the page ----------
const tri = '<span class="tri" aria-hidden="true"><i></i><i></i><i></i></span>';
const dl = '<a href="/bootloader.md" download="SUSD-Bootloader.md">Download the Bootloader (.md)</a>';
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The SUSD Bootloader · Appendix · Scaling Up-Side-Down</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="Michael Wentz">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta name="theme-color" content="#f6f0dd">
<link rel="canonical" href="${PAGE}">
<link rel="alternate" type="text/markdown" href="/bootloader.md" title="SUSD Bootloader ${esc(version)} (Markdown)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Scaling Up-Side-Down">
<meta property="og:title" content="The SUSD Bootloader · the Appendix">
<meta property="og:description" content="${esc(REFERENCE)}">
<meta property="og:url" content="${PAGE}">
<meta property="og:image" content="${SITE}/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400..700&family=IBM+Plex+Mono:wght@400;500&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap">
${ldTags}
<style>${css}</style>
</head>
<body id="top">
<a class="skip" href="#main">Skip to the document</a>
<header class="nav" id="nav">
  <a class="brand" href="/"><span class="mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Scaling Up-Side-Down</span></a>
  <nav class="nav-links" aria-label="Site">
    <a href="/">The story</a>
    <a href="/appendix" aria-current="page">The appendix</a>
    <a href="/#book">The book</a>
  </nav>
  <a class="nav-cta" href="#get">Get the Bootloader</a>
</header>
<div class="layout">
<details class="toc" id="contents" open>
  <summary><span>Contents</span><span class="toc-count">${toc.filter((t) => t.depth === 2).length} sections</span></summary>
  <div class="toc-in">
    <label class="toc-find"><span class="sr">Search the contents</span><input id="toc-search" type="search" placeholder="Search the contents" autocomplete="off" spellcheck="false"></label>
    <nav class="toc-nav" aria-label="Contents">${tocList}</nav>
    <p class="toc-empty" id="toc-empty" role="status"></p>
  </div>
</details>
<main id="main">
<header class="doc-head">
  <p class="kicker">${tri}SUSD · Operating System · Appendix</p>
  <h1>The SUSD Bootloader</h1>
  <p class="lede">${esc(TWO_FORMS)}</p>
  <p class="pull">${esc(REFERENCE)}</p>
  <p class="spec">${esc(SPEC)}</p>
  <dl class="facts">
    <div><dt>Version</dt><dd>${esc(version)}</dd></div>
    <div><dt>Updated</dt><dd>${esc(updated)}</dd></div>
    <div><dt>Words</dt><dd>${words.toLocaleString("en-US")}</dd></div>
    <div><dt>File</dt><dd>Markdown · ${kb}</dd></div>
    <div><dt>Status</dt><dd><span class="dot" aria-hidden="true"></span>Closed system</dd></div>
  </dl>
</header>

<section class="get" id="get" aria-labelledby="get-h">
  <div class="get-mail">
    <p class="kicker">${tri}Opt in</p>
    <h2 id="get-h">Get the Bootloader</h2>
    <p class="get-sub">The file, by email.</p>
    <form id="optin" class="optin" method="post" action="/api/optin" novalidate>
      <label class="lbl" for="optin-email">Email</label>
      <div class="optin-row">
        <input id="optin-email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@company.com" aria-describedby="optin-msg">
        <button type="submit" class="btn">Send me the Bootloader</button>
      </div>
      <div class="hp" aria-hidden="true" data-nosnippet><label>Company <input name="company" type="text" tabindex="-1" autocomplete="off"></label></div>
      <input type="hidden" name="source" value="appendix">
      <p class="msg" id="optin-msg" role="status" aria-live="polite"></p>
    </form>
    <!-- where a plain form post (no JavaScript) lands: /api/optin answers with a 303 to one of these. Hidden
         unless targeted, and kept out of snippets (they are in the HTML a crawler reads), so each must read true
         on its own -->
    <div class="done ok" id="optin-sent" data-nosnippet>Sent. Check your inbox.</div>
    <div class="done ok" id="optin-file" data-nosnippet>Here's the file. ${dl}</div>
    <div class="done ok" id="optin-already" data-nosnippet>You're already on the list. Here's the file. ${dl}</div>
    <div class="done err" id="optin-failed" data-nosnippet>Couldn't send. Download the file instead. ${dl}</div>
    <div class="done err" id="optin-error" data-nosnippet>That email address didn't look right. Try again.</div>
  </div>
  <div class="get-load" aria-labelledby="load-h">
    <h3 id="load-h">Load it into your AI</h3>
    <ol class="steps">
      <li>
        <a class="btn ghost" href="/bootloader.md" download="SUSD-Bootloader.md"><span aria-hidden="true">↓</span> Download the Bootloader (.md)</a>
        <span class="small">SUSD-Bootloader.md · ${kb}</span>
      </li>
      <li>
        <p>${esc(UPLOAD)}</p>
        <pre class="code prompt" id="starting-prompt"><code>${esc(startingPrompt)}</code></pre>
        <button type="button" class="btn ghost" id="copy-prompt">Copy the starting prompt</button>
        <span class="sr" id="copy-status" role="status"></span>
      </li>
    </ol>
    <p class="fine"><a href="#use-notice">Use notice</a></p>
  </div>
</section>

<article class="doc" id="bootloader" aria-label="The SUSD Bootloader">
${article}
</article>

${noticeHtml}

<section class="cite" id="cite" aria-labelledby="cite-h">
  <p class="kicker">${tri}Reference</p>
  <h2 id="cite-h">How to cite</h2>
  <p class="cite-ref">Wentz, M. (2026). <cite>The SUSD Bootloader</cite> (${esc(version)}). <i>Scaling Up-Side-Down</i>. <a href="${PAGE}">${esc(HOST)}/appendix</a></p>
  <p class="cite-note">Cite a section or term: <a href="#term-cyclical-growth"><code>${esc(HOST)}/appendix#term-cyclical-growth</code></a></p>
  <p class="cite-note">File: <a href="/bootloader.md"><code>${esc(HOST)}/bootloader.md</code></a></p>
</section>
<p class="end" id="end">End of document · SUSD Bootloader ${esc(version)} · <a href="${PAGE}">${esc(HOST)}/appendix</a></p>
</main>
</div>
<footer class="foot" id="foot">
  <a class="brand" href="/"><span class="mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Scaling Up-Side-Down</span></a>
  <nav aria-label="Footer"><a href="/">The story</a><a href="/#book">The book</a><a href="#use-notice">Use notice</a><a href="#top">Back to top ↑</a></nav>
  <p>© 2026 Michael Wentz</p>
</footer>
<script>${js}</script>
</body>
</html>
`;

// ---------- files for crawlers ----------
const llms = `# Scaling Up-Side-Down

> ${SPEC} ${purpose.replace(/^This document is designed to be read by both humans and AI\.\s*/, "")}

- Book: Scaling Up-Side-Down
- Author: Michael Wentz
- Appendix: SUSD Bootloader ${version}, ${words.toLocaleString("en-US")} words
- Page: ${PAGE}
- File: ${SITE}/bootloader.md

## Docs

- [The SUSD Bootloader (the Appendix)](${PAGE}): the complete Bootloader as one HTML page, with a permanent anchor for every section and every Vocabulary Lock term (e.g. ${PAGE}#term-cyclical-growth).
- [SUSD Bootloader, Markdown](${SITE}/bootloader.md): the same document as the file designed to be loaded into an AI assistant.

## Optional

- [Scaling Up-Side-Down](${SITE}/): the book's site.
`;
const llmsFull = `# SUSD Bootloader ${version} (full text)

Source: ${PAGE} · Markdown: ${SITE}/bootloader.md · Author: Michael Wentz

${md}`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc></url>
  <url><loc>${PAGE}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ""}</url>
</urlset>
`;
const robots = `# Scaling Up-Side-Down: everything here may be read, by people and by AI.
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;

for (const [name, body] of [
  ["appendix.html", html],
  ["llms.txt", llms],
  ["llms-full.txt", llmsFull],
  ["sitemap.xml", sitemap],
  ["robots.txt", robots],
])
  writeFileSync(join(DIST, name), body);
console.log(`appendix: ${toc.filter((t) => t.depth === 2).length} sections, ${toc.filter((t) => t.depth === 3).length} subsections, ${toc.filter((t) => t.depth === 4).length} h4s, ${terms.length} terms, updated ${modified || "?"}, ${words.toLocaleString("en-US")} words, ${Math.round(Buffer.byteLength(html) / 1024)} KB html · ${SITE}`);
