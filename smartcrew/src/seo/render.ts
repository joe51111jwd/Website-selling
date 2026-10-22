// Renders the SEO library's pages to plain static HTML (see ./types.ts). One template: a docs-style
// page with the library's navigation on the left, the article in the middle and "On this page" on
// the right (laptops). No script is needed to read anything: crawlers and AI assistants get the
// whole text, tables and FAQ in the HTML, plus JSON-LD (Article, BreadcrumbList, FAQPage).

import { SHOTS } from "./shots";
import type { Block, Cell, Faq, Kind, SeoPage, Shot } from "./types";

export const SITE = "https://www.smartcrewhq.com";
export const BRAND = "SmartCrew";

/** The hub page of each kind, in the order the navigation lists them. */
export const HUBS: { kind: Kind; slug: string; title: string; nav: string; h1: string; lede: string; description: string }[] = [
  {
    kind: "industry",
    slug: "industries",
    nav: "By trade",
    title: "Software for Dirt Work & Heavy Civil Contractors by Trade",
    h1: "Software for dirt work and heavy civil contractors, by trade",
    lede: "What excavation, site work, utility, paving, drilling and hauling companies need from their software, and how SmartCrew handles each trade's day: time, machines, loads, job costs and paperwork in one app.",
    description: "Guides to running an excavation, site work, heavy civil, utility, paving or drilling company on one app: time, equipment, hauling and job costing.",
  },
  {
    kind: "compare",
    slug: "compare",
    nav: "Alternatives",
    title: "SmartCrew Compared: Alternatives to busybusy, ClockShark, Procore & More",
    h1: "SmartCrew compared with the apps contractors use today",
    lede: "Side-by-side comparisons of SmartCrew and the time tracking, field and construction management apps dirt work contractors look at, built from each company's own published pages and pricing.",
    description: "How SmartCrew compares with busybusy, ClockShark, WorkMax, QuickBooks Time, Raken, HCSS, Procore, Contractor Foreman and Jobber, with sources.",
  },
  {
    kind: "versus",
    slug: "vs",
    nav: "Head to head",
    title: "Construction App Head-to-Heads for Dirt Work Contractors",
    h1: "Head-to-head comparisons of construction apps",
    lede: "Two popular apps side by side, what each one is built for and where each falls short for an excavation or heavy civil crew, with SmartCrew as the all-in-one option.",
    description: "Head-to-head comparisons of construction time tracking and field apps for excavation and heavy civil contractors, with sources.",
  },
  {
    kind: "feature",
    slug: "features",
    nav: "Features",
    title: "SmartCrew Features for Dirt Work & Heavy Civil Contractors",
    h1: "What SmartCrew does, feature by feature",
    lede: "Each part of SmartCrew explained with real screens: GPS time tracking, job costing, equipment and DOT inspections, hauling tickets, daily reports, scheduling, sales, crew chat and safety.",
    description: "SmartCrew's features explained with real screens: GPS time tracking, job costing, equipment maintenance, hauling tickets, daily reports and more.",
  },
  {
    kind: "guide",
    slug: "guides",
    nav: "Guides",
    title: "Guides for Running a Dirt Work Company",
    h1: "Guides for running a dirt work company",
    lede: "Plain guides for owners of excavation and heavy civil companies: choosing software, costing jobs, tracking machines and loads, and getting crews to use the app.",
    description: "Plain guides for owners of excavation and heavy civil companies on software, job costing, equipment and crew time.",
  },
];

// ─── text ─────────────────────────────────────────────────────────────────────

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const isExternal = (href: string) => /^https?:\/\//.test(href) && !href.startsWith(SITE);

/** **bold** and [label](href) inside escaped text. Internal hrefs are slugs ("compare/x") or paths. */
export function inline(s: string): string {
  let out = esc(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const h = href.replace(/&amp;/g, "&");
    if (isExternal(h)) return `<a href="${esc(h)}" rel="noopener" target="_blank">${label}</a>`;
    return `<a href="${esc(pathOf(h))}">${label}</a>`;
  });
  return out;
}

/** "compare/x" → "/compare/x/"; "/" and "#…" and "/?…" pass through. */
export function pathOf(slugOrPath: string) {
  if (/^(\/|#|https?:)/.test(slugOrPath)) return slugOrPath;
  const [p, hash] = slugOrPath.split("#");
  return `/${p.replace(/^\/|\/$/g, "")}/${hash ? `#${hash}` : ""}`;
}

const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1");

export const slugify = (s: string) =>
  plain(s)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

// ─── pieces ───────────────────────────────────────────────────────────────────

const ICON = {
  yes: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  no: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7l-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  partial: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  unknown: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="1.6" fill="currentColor"/></svg>',
};
const MARK_WORD = { yes: "Yes", no: "No", partial: "Partly", unknown: "Not listed" } as const;

function cell(c: Cell, th = false) {
  const tag = th ? "th" : "td";
  if (typeof c === "string") return `<${tag}${th ? ' scope="row"' : ""}>${inline(c)}</${tag}>`;
  return `<td class="mk mk-${c.mark}"><span class="mk-i">${ICON[c.mark]}</span><span class="mk-w">${MARK_WORD[c.mark]}</span>${
    c.note ? `<span class="mk-n">${inline(c.note)}</span>` : ""
  }</td>`;
}

function shot(s: Shot, eager = false) {
  const f = SHOTS[s.id];
  if (!f) throw new Error(`seo: unknown shot "${s.id}"`);
  const img = `<img src="${f.src}" width="${f.w}" height="${f.h}" alt="${esc(f.alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`;
  return `<figure class="shot shot-${f.device}"><div class="dev dev-${f.device}">${
    f.device === "laptop" ? `<div class="dev-bar"><i></i><i></i><i></i></div>` : `<div class="dev-island"></div>`
  }<div class="dev-screen">${img}</div></div>${s.caption ? `<figcaption>${inline(s.caption)}</figcaption>` : ""}</figure>`;
}

function shots(list: Shot[], caption?: string, eager = false) {
  const kinds = list.map((s) => SHOTS[s.id]?.device).join("-");
  return `<div class="shots shots-${list.length} shots-${kinds}">${list.map((s) => shot(s, eager)).join("")}</div>${
    caption ? `<p class="shots-cap">${inline(caption)}</p>` : ""
  }`;
}

const ctaHref = (slug: string) => `/?try=${encodeURIComponent(slug.replace(/\//g, "-"))}`;

function ctaBand(slug: string, title?: string, text?: string) {
  return `<aside class="band" aria-label="Try SmartCrew">
  <div class="band-t"><p class="band-h">${inline(title ?? "See SmartCrew on your own jobs")}</p><p class="band-p">${inline(
    text ?? "A quick call with Andrew, SmartCrew’s founder: he sets it up around your crews, machines and cost codes.",
  )}</p></div>
  <a class="btn" href="${ctaHref(slug)}">Try SmartCrew</a>
</aside>`;
}

function block(b: Block, page: SeoPage): string {
  switch (b.t) {
    case "h2":
      return `<h2 id="${b.id ?? slugify(b.text)}">${inline(b.text)}</h2>`;
    case "h3":
      return `<h3>${inline(b.text)}</h3>`;
    case "p":
      return `<p>${inline(b.text)}</p>`;
    case "ul":
      return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
    case "ol":
      return `<ol>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ol>`;
    case "shots":
      return shots(b.shots, b.caption);
    case "table":
      return `<div class="tbl-wrap"><table>${b.caption ? `<caption>${inline(b.caption)}</caption>` : ""}<thead><tr>${b.head
        .map((h, i) => `<th scope="col"${i === 1 && page.kind === "compare" ? ' class="us"' : ""}>${inline(h)}</th>`)
        .join("")}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c, i) => (i === 0 ? cell(c, true) : cell(c))).join("")}</tr>`)
        .join("")}</tbody></table></div>${b.note ? `<p class="tbl-note">${inline(b.note)}</p>` : ""}`;
    case "note":
      return `<aside class="note note-${b.tone ?? "plain"}"><p class="note-h">${inline(b.title)}</p><p>${inline(b.text)}</p></aside>`;
    case "cards":
      return `<div class="cards cards-${b.cards.length}">${b.cards
        .map(
          (c) =>
            `<section class="card card-${c.tone ?? "plain"}"><h3>${inline(c.title)}</h3><ul>${c.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul></section>`,
        )
        .join("")}</div>`;
    case "steps":
      return `<ol class="steps">${b.steps.map((s) => `<li><p class="step-h">${inline(s.title)}</p><p>${inline(s.text)}</p></li>`).join("")}</ol>`;
    case "quote":
      return `<figure class="quote"><blockquote><p>${inline(b.text)}</p></blockquote><figcaption>${inline(b.who)}</figcaption></figure>`;
    case "cta":
      return ctaBand(page.slug, b.title, b.text);
  }
}

// ─── page shell ───────────────────────────────────────────────────────────────

export type Library = { pages: SeoPage[] };

const kindOf = (k: Kind) => HUBS.find((h) => h.kind === k)!;

function sideNav(lib: Library, current: string) {
  return HUBS.map((h) => {
    const items = lib.pages.filter((p) => p.kind === h.kind);
    if (!items.length) return "";
    return `<div class="nav-g"><a class="nav-h${current === h.slug ? " on" : ""}" href="/${h.slug}/">${esc(h.nav)}</a><ul>${items
      .map((p) => `<li><a href="/${p.slug}/"${p.slug === current ? ' aria-current="page" class="on"' : ""}>${esc(p.nav)}</a></li>`)
      .join("")}</ul></div>`;
  }).join("");
}

function header(slug: string) {
  return `<header class="bar">
  <a class="home" href="/"><img src="/seo-assets/smartcrew-logo.webp" width="601" height="110" alt="SmartCrew home" /></a>
  <nav class="bar-nav" aria-label="Library">${HUBS.filter((h) => h.kind !== "versus")
    .map((h) => `<a href="/${h.slug}/">${esc(h.nav)}</a>`)
    .join("")}</nav>
  <a class="btn btn-sm" href="${ctaHref(slug)}">Try SmartCrew</a>
</header>`;
}

function footer(lib: Library) {
  const year = new Date().getUTCFullYear();
  return `<footer class="foot">
  <div class="foot-cols">${HUBS.map((h) => {
    const items = lib.pages.filter((p) => p.kind === h.kind);
    if (!items.length) return "";
    return `<div><p class="foot-h"><a href="/${h.slug}/">${esc(h.nav)}</a></p><ul>${items.map((p) => `<li><a href="/${p.slug}/">${esc(p.nav)}</a></li>`).join("")}</ul></div>`;
  }).join("")}</div>
  <p class="foot-fine">© ${year} SmartCrew HQ · <a href="/">smartcrewhq.com</a> · <a href="/privacy-policy/">Privacy</a> · <a href="/terms-of-service/">Terms</a> · support@smartcrewhq.com</p>
  <p class="foot-fine">Product screens show a demo account; names and numbers are made up. Other companies’ product names and trademarks belong to their owners and are used only to describe and compare. Facts about other products come from their own public pages on the dates shown; tell us at support@smartcrewhq.com if something has changed and we’ll fix it.</p>
</footer>`;
}

function toc(page: SeoPage) {
  const hs = page.blocks.filter((b): b is Extract<Block, { t: "h2" }> => b.t === "h2");
  const items = [...hs.map((h) => ({ id: h.id ?? slugify(h.text), text: plain(h.text) })), { id: "faq", text: "FAQ" }];
  if (page.sources?.length) items.push({ id: "sources", text: "Sources" });
  return `<nav class="toc" aria-label="On this page"><p class="toc-h">On this page</p><ul>${items
    .map((i) => `<li><a href="#${i.id}">${esc(i.text)}</a></li>`)
    .join("")}</ul></nav>`;
}

function faqHtml(faqs: Faq[]) {
  return `<h2 id="faq">Questions people ask</h2><div class="faq">${faqs
    .map((f) => `<section class="faq-i"><h3>${inline(f.q)}</h3><p>${inline(f.a)}</p></section>`)
    .join("")}</div>`;
}

function sourcesHtml(page: SeoPage) {
  if (!page.sources?.length) return "";
  return `<h2 id="sources">Sources</h2><ol class="src">${page.sources
    .map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${inline(s.label)}</a> <span>checked ${fmtDate(s.accessed)}</span></li>`)
    .join("")}</ol>`;
}

function relatedHtml(lib: Library, page: SeoPage) {
  const rel = (page.related ?? []).map((s) => lib.pages.find((p) => p.slug === s)).filter((p): p is SeoPage => !!p);
  if (!rel.length) return "";
  return `<nav class="rel" aria-label="Related"><p class="rel-h">Keep reading</p><div class="rel-g">${rel
    .map((p) => `<a class="rel-c" href="/${p.slug}/"><span class="rel-k">${esc(kindOf(p.kind).nav)}</span><span class="rel-t">${esc(p.h1)}</span></a>`)
    .join("")}</div></nav>`;
}

type HeadOpts = { title: string; description: string; path: string; jsonld: object[]; noindex: boolean; css: string };

function head(o: HeadOpts) {
  const url = `${SITE}${o.path}`;
  return `<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}" />
<link rel="canonical" href="${url}" />
${o.noindex ? '<meta name="robots" content="noindex, nofollow" />\n' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />\n'}<meta name="theme-color" content="#FBF8F4" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="SmartCrew" />
<meta property="og:title" content="${esc(o.title)}" />
<meta property="og:description" content="${esc(o.description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${SITE}/phone/screens/web-dashboard-960.webp" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" type="image/svg+xml" href="/brand/mark.svg" />
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/special-gothic-var.latin.woff2" />
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/finlandica-text-var.latin.woff2" />
<link rel="stylesheet" href="${o.css}" />
${o.jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>`;
}

const ORG = {
  "@type": "Organization",
  "@id": `${SITE}/#org`,
  name: "SmartCrew",
  alternateName: "SmartCrew HQ",
  url: `${SITE}/`,
  logo: `${SITE}/seo-assets/smartcrew-logo.webp`,
  email: "support@smartcrewhq.com",
  founder: { "@type": "Person", name: "Andrew Drish" },
};

const crumbs = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE}${c.path}` })),
});

export type RenderOpts = { noindex: boolean; css: string };

export function renderPage(lib: Library, page: SeoPage, o: RenderOpts): string {
  const hub = kindOf(page.kind);
  const path = `/${page.slug}/`;
  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.h1,
      description: page.description,
      dateModified: page.updated,
      datePublished: page.updated,
      mainEntityOfPage: `${SITE}${path}`,
      image: `${SITE}/phone/screens/${page.hero?.[0]?.id ?? "web-dashboard"}-${SHOTS[page.hero?.[0]?.id ?? "web-dashboard"]?.device === "phone" ? "720" : "960"}.webp`,
      author: ORG,
      publisher: ORG,
      about: { "@type": "SoftwareApplication", name: "SmartCrew", applicationCategory: "BusinessApplication", url: `${SITE}/` },
    },
    crumbs([
      { name: "SmartCrew", path: "/" },
      { name: hub.nav, path: `/${hub.slug}/` },
      { name: page.nav, path },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: plain(f.q), acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
    },
  ];

  const body = `<article class="doc">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">SmartCrew</a><span>/</span><a href="/${hub.slug}/">${esc(hub.nav)}</a></nav>
  <p class="eyebrow">${inline(page.eyebrow)}</p>
  <h1>${inline(page.h1)}</h1>
  <p class="meta">Updated <time datetime="${page.updated}">${fmtDate(page.updated)}</time> · SmartCrew team</p>
  <p class="lede">${inline(page.lede)}</p>
  ${
    page.summary?.length
      ? `<section class="tldr" aria-label="The short version"><p class="tldr-h">The short version</p><ul>${page.summary.map((s) => `<li>${inline(s)}</li>`).join("")}</ul></section>`
      : ""
  }
  ${page.hero?.length ? shots(page.hero, undefined, true) : ""}
  ${page.blocks.map((b) => block(b, page)).join("\n  ")}
  ${faqHtml(page.faqs)}
  ${ctaBand(page.slug)}
  ${sourcesHtml(page)}
  ${relatedHtml(lib, page)}
</article>`;

  return shell(lib, page.slug, head({ title: page.title, description: page.description, path, jsonld, noindex: o.noindex, css: o.css }), body, toc(page));
}

function shell(lib: Library, current: string, headHtml: string, main: string, right: string) {
  return `<!doctype html>
<html lang="en">
${headHtml}
<body>
${header(current)}
<div class="lay">
  <aside class="side"><details class="side-d"><summary>Browse the library</summary><nav aria-label="Library pages">${sideNav(lib, current)}</nav></details><nav class="side-n" aria-label="Library pages">${sideNav(
    lib,
    current,
  )}</nav></aside>
  <main id="main">${main}</main>
  <div class="right">${right}</div>
</div>
${footer(lib)}
</body>
</html>
`;
}

export function renderHub(lib: Library, kind: Kind, o: RenderOpts): string {
  const h = kindOf(kind);
  const items = lib.pages.filter((p) => p.kind === kind);
  const path = `/${h.slug}/`;
  const jsonld = [
    crumbs([
      { name: "SmartCrew", path: "/" },
      { name: h.nav, path },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: h.h1,
      description: h.description,
      url: `${SITE}${path}`,
      hasPart: items.map((p) => ({ "@type": "Article", headline: p.h1, url: `${SITE}/${p.slug}/` })),
    },
  ];
  const body = `<article class="doc">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">SmartCrew</a></nav>
  <h1>${esc(h.h1)}</h1>
  <p class="lede">${inline(h.lede)}</p>
  <div class="hub">${items
    .map((p) => `<a class="hub-c" href="/${p.slug}/"><span class="hub-t">${esc(p.h1)}</span><span class="hub-d">${esc(p.description)}</span></a>`)
    .join("")}</div>
  ${ctaBand(h.slug)}
</article>`;
  return shell(lib, h.slug, head({ title: `${h.title} · SmartCrew`, description: h.description, path, jsonld, noindex: o.noindex, css: o.css }), body, "");
}

/** sitemap.xml for the library (the product page and /book are listed too). */
export function sitemap(lib: Library) {
  const urls = [
    { loc: `${SITE}/`, lastmod: undefined as string | undefined },
    ...HUBS.filter((h) => lib.pages.some((p) => p.kind === h.kind)).map((h) => ({
      loc: `${SITE}/${h.slug}/`,
      lastmod: lib.pages.filter((p) => p.kind === h.kind).reduce((m, p) => (p.updated > m ? p.updated : m), ""),
    })),
    ...lib.pages.map((p) => ({ loc: `${SITE}/${p.slug}/`, lastmod: p.updated })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`;
}

/** llms.txt (llmstxt.org): a plain index of the library for AI assistants. */
export function llms(lib: Library) {
  return `# SmartCrew

> SmartCrew is all-in-one software for heavy civil and dirt work contractors with 5–100 employees: GPS time tracking, job costing against the bid, equipment maintenance and DOT inspections, hauling tickets and materials, daily reports, scheduling, sales pipeline, crew messaging, safety forms and file storage, with QuickBooks Online integration. Founded by Andrew Drish, whose family has been in construction for 75 years. Website: ${SITE}/ · Contact: support@smartcrewhq.com

${HUBS.map((h) => {
  const items = lib.pages.filter((p) => p.kind === h.kind);
  if (!items.length) return "";
  return `## ${h.nav}\n\n${items.map((p) => `- [${p.h1}](${SITE}/${p.slug}/): ${plain(p.lede).split(". ")[0].replace(/\.$/, "")}.`).join("\n")}\n`;
})
  .filter(Boolean)
  .join("\n")}`;
}
