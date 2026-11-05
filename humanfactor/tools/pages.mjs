// Writes every HumanFactor page from tools/content.mjs.
//   python3 tools/webimg.py .   (when masters/ changes)
//   node tools/pages.mjs
// Pages are committed as finished HTML, so search and AI crawlers read every word without JavaScript.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as C from "./content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIZES = JSON.parse(readFileSync(join(ROOT, "public/img/sizes.json"), "utf8"));
const { SITE, contact } = C;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pad = (n) => String(n).padStart(2, "0");
const ARR = `<svg class="arr" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;
const NE = `<svg class="arr" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;
const out = (href, text, cls = "") => `<a${cls ? ` class="${cls}"` : ""} href="${href}" rel="noopener" target="_blank">${text}<span class="sr"> (opens in a new tab)</span></a>`;
const fmt = (s) => `${s.pre ?? ""}${s.n.toLocaleString("en-US", { minimumFractionDigits: s.dp ?? 0, maximumFractionDigits: s.dp ?? 0 })}${s.suf ?? ""}`;

function img(name, { alt, sizes, cls = "", eager = false }) {
  const s = SIZES[name];
  if (!s) throw new Error(`no image ${name}: run python3 tools/webimg.py .`);
  const srcset = s.widths.map((w) => `/img/${name}-${w}.webp ${w}w`).join(", ");
  const fallback = s.widths.includes(1280) ? 1280 : s.widths.at(-1);
  return `<img${cls ? ` class="${cls}"` : ""} src="/img/${name}-${fallback}.webp" srcset="${srcset}" sizes="${sizes}" width="${s.w}" height="${s.h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

// The ring motif as a still: five ellipses, each tilted its own way. Reprised in every inner page's hero.
function rings(seed = 0, cls = "rings-svg") {
  const tilt = [[0.34, -12], [0.52, 14], [0.22, 31], [0.62, -28], [0.42, 4]];
  return `<svg class="${cls}" viewBox="-110 -110 220 220" aria-hidden="true">${[60, 70, 80, 90, 100].map((r, i) => {
    const [ry, rot] = tilt[(i + seed) % 5];
    return `<ellipse rx="${r}" ry="${(r * ry).toFixed(1)}" transform="rotate(${rot + seed * 9})" ${i === 2 ? 'class="hot"' : ""}/>`;
  }).join("")}</svg>`;
}

// ---------- schema ----------
const ORG = `${SITE.url}/#org`;
const orgLd = {
  "@type": "Organization", "@id": ORG, name: SITE.name, legalName: SITE.legal, url: `${SITE.url}/`,
  logo: `${SITE.url}/favicon.svg`, slogan: "Stakeholder Risk is the most underpriced driver of enterprise value.",
  description: "HumanFactor originated Stakeholder Risk and measures it for CEOs, boards, sponsors and life sciences companies.",
  founder: { "@type": "Person", name: "Jennifer G. Bates", jobTitle: "Founder & CEO" },
  address: { "@type": "PostalAddress", addressLocality: "New York", addressRegion: "NY", addressCountry: "US" },
  telephone: "+1-212-369-9100", sameAs: [contact.linkedin],
  knowsAbout: ["Stakeholder Risk", "Enterprise value", "Private equity due diligence", "Corporate governance", "Life sciences strategy"],
};
const siteLd = { "@type": "WebSite", "@id": `${SITE.url}/#site`, url: `${SITE.url}/`, name: SITE.name, publisher: { "@id": ORG } };
const faqLd = (items) => ({ "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
const crumbs = (name, path) => ({ "@type": "BreadcrumbList", itemListElement: [
  { "@type": "ListItem", position: 1, name: SITE.name, item: `${SITE.url}/` },
  { "@type": "ListItem", position: 2, name, item: `${SITE.url}${path}` },
] });

// ---------- shell ----------
const NAV = [
  ["stakeholder-risk", "/stakeholder-risk/", "Stakeholder Risk"],
  ["index", "/humanfactor-index/", "The Index"],
  ["life-sciences", "/life-sciences/", "Life Sciences"],
  ["company", "/company/", "Company"],
];
const LOGO = `<svg class="logo-mark" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-24 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(24 12 12)"/></svg>`;
const header = (nav) => `<header class="top" data-top>
  <div class="top-in">
    <a class="logo" href="/" aria-label="HumanFactor, home">${LOGO}<span>HumanFactor<sup>™</sup></span></a>
    <nav class="nav" aria-label="Main">
      <ul>${NAV.map(([k, h, l]) => `<li><a href="${h}"${k === nav ? ' aria-current="page"' : ""}>${l}</a></li>`).join("")}</ul>
    </nav>
    <a class="pill" href="${contact.briefing}"${nav === "briefing" ? ' aria-current="page"' : ""}>Request a briefing</a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="sheet" data-burger><span class="sr">Menu</span><i></i><i></i></button>
  </div>
  <div class="sheet" id="sheet" data-sheet>
    <ul>${[...NAV, ["briefing", "/briefing/", "Request a briefing"]].map(([k, h, l], i) => `<li><a href="${h}"${k === nav ? ' aria-current="page"' : ""}><span class="lbl">${pad(i + 1)}</span>${l}</a></li>`).join("")}</ul>
    <p class="lbl">New York · Wilmington · London 2027</p>
  </div>
</header>`;

const footer = `<footer class="foot">
  <div class="wrap">
    <p class="lbl">Decision clarity</p>
    <p class="foot-big">Decision clarity,<br>before consequence<span class="dot">.</span></p>
    <a class="btn btn-light" href="${contact.briefing}">Request a briefing ${ARR}</a>
    <div class="foot-grid">
      <div>
        <p class="lbl">Firm</p>
        <ul>${NAV.map(([, h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}<li><a href="/briefing/">Briefing</a></li></ul>
      </div>
      <div>
        <p class="lbl">Write to</p>
        <ul>${contact.routes.map((r) => `<li><a href="mailto:${r.email}">${r.label}</a></li>`).join("")}</ul>
      </div>
      <div>
        <p class="lbl">Offices</p>
        <ul>${contact.offices.map((o) => `<li>${o.city} <span class="mute">· ${o.what}</span></li>`).join("")}</ul>
      </div>
      <div>
        <p class="lbl">Call</p>
        <ul><li><a href="tel:${contact.phone.tel}">${contact.phone.display}</a></li><li><a href="tel:${contact.intl.tel}">${contact.intl.display}</a> <span class="mute">· Intl.</span></li><li>${out(contact.linkedin, "LinkedIn")}</li></ul>
      </div>
    </div>
    <div class="foot-base">
      <span>© ${new Date().getFullYear()} ${SITE.legal}</span>
      <span>${C.DISCLAIMER}</span>
    </div>
  </div>
</footer>`;

function page({ nav, path, title, description, ld = [], body, tone = "dark" }) {
  const full = title ? `${title} | HumanFactor™` : "HumanFactor™ | Stakeholder Risk Intelligence";
  const graph = { "@context": "https://schema.org", "@graph": [siteLd, orgLd, ...ld] };
  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(full)}</title>
    <meta name="description" content="${esc(description)}" />
    <!--robots-->
    <link rel="canonical" href="${SITE.url}${path}" />
    <meta name="theme-color" content="#0a1017" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="HumanFactor" />
    <meta property="og:title" content="${esc(full)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${SITE.url}${path}" />
    <meta property="og:image" content="${SITE.url}/og.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..600&family=Geist+Mono:wght@400;500&display=swap" />
    <link rel="stylesheet" href="/src/styles.css" />
    <script type="application/ld+json">${JSON.stringify(graph)}</script>
  </head>
  <body data-page="${nav}" data-tone="${tone}">
    <a class="skip" href="#main">Skip to content</a>
    ${header(nav)}
    <main id="main">
${body}
    </main>
    ${footer}
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
}
const write = (rel, html) => {
  const file = join(ROOT, rel, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log("wrote", join(rel, "index.html"));
};

// ---------- blocks ----------
const head = (n, label, h, aside = "") => `<div class="head">
      <p class="lbl"><span>/ ${pad(n)}</span>${label}</p>
      <h2>${h}</h2>${aside ? `\n      <p class="aside">${aside}</p>` : ""}
    </div>`;

const numbers = (n) => `<section class="sec" aria-labelledby="num-h">
  <div class="wrap">
    ${head(n, "Record", '<span id="num-h">The record.</span>')}
    <dl class="nums">${C.stats.map((s) => `
      <div data-reveal><dt>${s.label}</dt><dd data-count="${s.n}" data-pre="${s.pre ?? ""}" data-suf="${s.suf ?? ""}" data-dp="${s.dp ?? 0}">${fmt(s)}</dd></div>`).join("")}
    </dl>
    <p class="fine">${C.DISCLAIMER}</p>
  </div>
</section>`;

const lineageBlock = (n) => `<section class="sec dark" aria-labelledby="lin-h">
  <div class="wrap">
    ${head(n, "Lineage", '<span id="lin-h">Every generation of capital needed a new measurement standard.</span>', "Stakeholder Risk is next.")}
    <ol class="rail">${C.lineage.map((l) => `
      <li${l.us ? ' class="us"' : ""} data-reveal><span class="rail-y">${l.year}</span><span class="rail-n">${l.name}</span><span class="rail-w">${l.what}</span></li>`).join("")}
    </ol>
  </div>
</section>`;

const frameworksBlock = (n) => `<section class="sec" aria-labelledby="fw-h">
  <div class="wrap">
    ${head(n, "Approach", '<span id="fw-h">Six proprietary frameworks, from first read to exit.</span>')}
    <ol class="rows fw">${C.frameworks.map((f, i) => `
      <li data-reveal>
        <span class="lbl">${pad(i + 1)}</span>
        <span class="fw-v lbl">${f.verb}</span>
        <h3>${f.name}</h3>
        <p>${f.text}</p>
        <span class="fw-t lbl">${f.time}</span>
      </li>`).join("")}
    </ol>
  </div>
</section>`;

const faqBlock = (n, items) => `<section class="sec" id="faq" aria-labelledby="faq-h">
  <div class="wrap">
    ${head(n, "FAQ", '<span id="faq-h">Questions, answered.</span>')}
    <div class="faq">${items.map((f) => `
      <details>
        <summary><h3>${esc(f.q)}</h3><i aria-hidden="true"></i></summary>
        <p>${esc(f.a)}</p>
      </details>`).join("")}
    </div>
  </div>
</section>`;

const peopleBlock = (n, list = C.people, full = false) => `<section class="sec" aria-labelledby="ppl-h">
  <div class="wrap">
    ${head(n, "Leadership", '<span id="ppl-h">The operators behind the work.</span>')}
    <ul class="people">${list.map((p) => `
      <li data-reveal>
        <div class="ph">${img(p.slug, { alt: `Portrait of ${p.name}`, sizes: "(max-width: 760px) 100vw, 40vw" })}</div>
        <p class="lbl">${p.title}</p>
        <h3>${p.name}</h3>
        ${full ? `<p class="bio">${p.bio}</p><blockquote>“${esc(p.quote)}”</blockquote><p>${out(p.linkedin, `LinkedIn ${NE}`, "link")}</p>` : `<p class="bio">${p.bio.split(". ")[0]}.</p>`}
      </li>`).join("")}
    </ul>
    ${full ? "" : `<p class="more"><a class="link" href="/company/">About the firm ${ARR}</a></p>`}
  </div>
</section>`;

const ctaBand = (h, sub) => `<section class="band" aria-label="Request a briefing">
  <div class="wrap band-in">
    ${rings(3, "rings-svg band-rings")}
    <div>
      <p class="lbl">Private briefing</p>
      <h2>${h}</h2>
      <p>${sub}</p>
      <a class="btn btn-light" href="${contact.briefing}">Request a briefing ${ARR}</a>
    </div>
  </div>
</section>`;

const pageHero = ({ label, h1, lede, seed = 0, extra = "" }) => `<section class="phero">
  <div class="wrap phero-in">
    <div class="phero-copy">
      <p class="lbl">${label}</p>
      <h1>${h1}</h1>
      ${lede ? `<p class="lede">${lede}</p>` : ""}
      ${extra}
    </div>
    ${rings(seed)}
  </div>
</section>`;

// ---------- home ----------
const story = `<section class="story" data-story aria-label="Stakeholder Risk, in four scenes">
  <div class="stage" data-stage="0">
    <canvas class="gl" data-rings aria-hidden="true"></canvas>
    ${rings(0, "rings-svg gl-fallback")}
    <div class="readout diag" aria-hidden="true">
      <p class="lbl">HumanFactor Index™ · diagnostics</p>
      <ul>${C.diagnostics.map((d) => `<li style="--s:${d.score}"><span class="lbl">${d.code}</span><span>${d.name}</span><b>${d.score}</b><i></i></li>`).join("")}</ul>
    </div>
    <div class="readout comp" aria-hidden="true">
      <p class="lbl">Composite · Q1 2026 · illustrative</p>
      <p class="comp-n">${C.composite}</p>
      <p class="lbl">v2.4 · scale 0–100</p>
    </div>
    <div class="meta" aria-hidden="true"><span class="lbl">40.7128° N, 74.0060° W</span><span class="lbl" data-scene-label>00 / Stakeholder Risk</span></div>
  </div>

  <div class="scene hero" data-scene="0">
    <div class="wrap">
      <p class="lbl">Stakeholder Risk Intelligence™</p>
      <h1>The risk no model prices<span class="dot">.</span></h1>
      <div class="hero-foot">
        <p>HumanFactor measures the human system beneath every financial model, for the CEOs, boards and investors who carry the outcome.</p>
        <div class="btns"><a class="btn btn-light" href="${contact.briefing}">Request a briefing ${ARR}</a><a class="btn btn-line" href="/stakeholder-risk/">What is Stakeholder Risk?</a></div>
      </div>
    </div>
  </div>
  <div class="scene" data-scene="1">
    <div class="wrap"><p class="lbl">01 / Alignment</p><h2>Every model assumes the people behind it agree.</h2></div>
  </div>
  <div class="scene" data-scene="2">
    <div class="wrap"><p class="lbl">02 / Strain</p><h2>They rarely do.</h2><p>Identity, authority, decisions, alignment. The human system breaks in four places, long before the numbers do.</p></div>
  </div>
  <div class="scene" data-scene="3">
    <div class="wrap"><p class="lbl">03 / Measured</p><h2>HumanFactor puts a number on it.</h2><p>The HumanFactor Index™ scores Stakeholder Risk from 0 to 100 against 350,000+ leaders, the way the VIX benchmarks volatility.</p><a class="link" href="/humanfactor-index/">The Index ${ARR}</a></div>
  </div>
</section>`;

write("", page({
  nav: "home", path: "/", title: "",
  description: "HumanFactor originated Stakeholder Risk: the risk in leadership dynamics, governance, incentives and decision architecture beneath every financial model. Measured and benchmarked for CEOs, boards and sponsors.",
  ld: [faqLd(C.faq)],
  body: `
${story}

<section class="sec statement" aria-labelledby="def-h">
  <div class="wrap">
    <p class="lbl"><span>/ 01</span>The category</p>
    <h2 id="def-h" class="sr">What is Stakeholder Risk?</h2>
    <p class="say" data-say>${C.definition}</p>
    <p class="say-sub">Not personality. Not culture. The structural fault line beneath strategy, operations and capital, and the most underpriced driver of enterprise value.</p>
  </div>
</section>

${numbers(2)}

${lineageBlock(3)}

${frameworksBlock(4)}

<section class="sec" aria-labelledby="who-h">
  <div class="wrap">
    ${head(5, "Who we work with", '<span id="who-h">For the people who carry the outcome.</span>')}
    <ul class="aud">${C.audiences.map((a) => `
      <li data-reveal><a href="${a.href}">
        <span class="lbl">${a.who}</span>
        <span class="aud-line">${a.line}</span>
        <span class="aud-text">${a.text}</span>
        ${ARR}
      </a></li>`).join("")}
    </ul>
  </div>
</section>

<section class="sec dark" aria-labelledby="eng-h">
  <div class="wrap">
    ${head(6, "Engagement", '<span id="eng-h">From a 30-minute briefing to an 18-month partnership.</span>')}
    <ol class="path">${C.engagement.map((e, i) => `
      <li data-reveal><span class="lbl">${pad(i + 1)} · ${e.time}</span><h3>${e.step}</h3><p>${e.text}</p></li>`).join("")}
    </ol>
  </div>
</section>

${peopleBlock(7)}

<section class="sec tint" aria-labelledby="ins-h">
  <div class="wrap">
    ${head(8, "Insights", '<span id="ins-h">Thinking on Stakeholder Risk.</span>')}
    <ul class="rows ins">${C.insights.map((x) => `
      <li data-reveal>${out(x.url, `<span class="lbl">${x.date}</span><span class="lbl ins-tag">${x.tag}</span><span class="ins-t">${x.title}</span>${NE}`)}</li>`).join("")}
    </ul>
  </div>
</section>

${faqBlock(9, C.faq.slice(0, 5))}
`,
}));

// ---------- stakeholder risk ----------
write("stakeholder-risk", page({
  nav: "stakeholder-risk", path: "/stakeholder-risk/", title: "What is Stakeholder Risk?",
  description: "Stakeholder Risk is the category of risk in leadership dynamics, governance, incentives and decision architecture: the human system beneath every financial model. How it is defined, measured and priced.",
  ld: [
    { "@type": "DefinedTerm", name: "Stakeholder Risk", description: C.definition, url: `${SITE.url}/stakeholder-risk/`, inDefinedTermSet: { "@type": "DefinedTermSet", name: "Stakeholder Risk Intelligence", creator: { "@id": ORG } } },
    faqLd(C.faq.slice(0, 5)), crumbs("What is Stakeholder Risk?", "/stakeholder-risk/"),
  ],
  body: `
${pageHero({ label: "The category HumanFactor originated", h1: "Stakeholder Risk<span class=\"dot\">.</span>", lede: C.definition, seed: 1 })}

<section class="sec" aria-labelledby="up-h">
  <div class="wrap">
    ${head(1, "Why it matters", '<span id="up-h">Upstream of execution. Upstream of valuation.</span>')}
    <div class="cols prose">
      <p>Traditional diligence measures financial, strategic and operational risk. Stakeholder Risk sits beneath all three and decides whether strategy gets executed, operations stay aligned and capital is deployed well.</p>
      <p>Yet it rarely appears on a balance sheet or in a quality-of-earnings report. Management diligence looks at individuals; HumanFactor measures the system between them, and where it will break under pressure.</p>
    </div>
  </div>
</section>

<section class="sec tint" aria-labelledby="dim-h">
  <div class="wrap">
    ${head(2, "What it measures", '<span id="dim-h">Six dimensions.</span>')}
    <ol class="grid3">${C.dimensions.map((d, i) => `<li data-reveal><span class="lbl">${pad(i + 1)}</span><h3>${d.name}</h3><p>${d.text}</p></li>`).join("")}</ol>
  </div>
</section>

<section class="sec" aria-labelledby="when-h">
  <div class="wrap">
    ${head(3, "When to measure", '<span id="when-h">At the points of highest leverage.</span>')}
    <ol class="rows when">${["Before a transaction", "At platform formation", "Ahead of an add-on integration", "In the post-close value creation window", "Before a recapitalization or sale"].map((w, i) => `<li data-reveal><span class="lbl">${pad(i + 1)}</span><h3>${w}</h3></li>`).join("")}</ol>
  </div>
</section>

${faqBlock(4, C.faq.slice(0, 5))}

`,
}));

// ---------- the index ----------
write("humanfactor-index", page({
  nav: "index", path: "/humanfactor-index/", title: "The HumanFactor Index™",
  description: "The HumanFactor Index™ benchmarks Stakeholder Risk the way the VIX benchmarks volatility: twelve risks and four diagnostics scored 0 to 100 against 350,000+ leaders, for diligence, portfolio monitoring and exit readiness.",
  ld: [crumbs("The HumanFactor Index", "/humanfactor-index/")],
  body: `
<section class="phero idx-hero">
  <div class="wrap phero-in">
    <div class="phero-copy">
      <p class="lbl">The instrument · Methodology v2.4</p>
      <h1>The HumanFactor Index<sup>™</sup></h1>
      <p class="lede">A score for something most companies can feel but can’t measure. The Index turns HumanFactor Analysis™ into a quantified, benchmarked Stakeholder Risk metric, so sponsors, boards and leadership teams work from a number instead of instinct.</p>
    </div>
    <div class="idx-card" data-reveal>
      <p class="lbl">Composite · Q1 2026 · illustrative</p>
      <p class="comp-n">${C.composite}</p>
      <ul>${C.diagnostics.map((d) => `<li style="--s:${d.score}"><span class="lbl">${d.code}</span><span>${d.name}</span><b>${d.score}</b><i></i></li>`).join("")}</ul>
      <p class="lbl mute">Benchmark methodology under embargo</p>
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="diag-h">
  <div class="wrap">
    ${head(1, "Diagnostics", '<span id="diag-h">Four questions every investment committee should ask.</span>')}
    <ol class="grid4">${C.diagnostics.map((d) => `<li data-reveal><span class="lbl">${d.code}</span><h3>${d.name}</h3><p>${d.line}</p></li>`).join("")}</ol>
  </div>
</section>

<section class="sec tint" aria-labelledby="tw-h">
  <div class="wrap">
    ${head(2, "Coverage", '<span id="tw-h">Twelve risks, one score.</span>', "Each signal is scored 0 to 100. A higher score means greater observed exposure.")}
    <ol class="twelve">${C.twelve.map((t, i) => `<li data-reveal><span class="lbl">${pad(i + 1)}</span>${t}</li>`).join("")}</ol>
  </div>
</section>

<section class="sec" aria-labelledby="use-h">
  <div class="wrap">
    ${head(3, "Deployment", '<span id="use-h">Where the score gets used.</span>')}
    <ol class="grid3">
      <li data-reveal><span class="lbl">Pre-close</span><h3>Due diligence</h3><p>Support the investment committee with real data on the people side, before the price is set.</p></li>
      <li data-reveal><span class="lbl">Post-close</span><h3>Portfolio monitoring</h3><p>Track the health of the human system across a portfolio, quarter by quarter.</p></li>
      <li data-reveal><span class="lbl">Always</span><h3>Enterprise resilience</h3><p>Benchmark across companies to spot emerging risk early, and before an exit conversation.</p></li>
    </ol>
  </div>
</section>

<section class="sec tint" aria-labelledby="q-h">
  <div class="wrap">
    ${head(4, "A sample question", '<span id="q-h">Authority & decision rights.</span>')}
    <form class="quiz" data-quiz>
      <fieldset>
        <legend>When a high-stakes decision needs to be made this quarter, how clear is the chain of authority between the CEO, the board and the sponsor?</legend>
        ${["Documented and tested: everyone moves in the same direction.", "Clear in practice, but never written down.", "Re-negotiated case by case.", "Actively contested at the top."].map((o, i) => `<label><input type="radio" name="q" value="${i}"><span class="lbl">${String.fromCharCode(65 + i)}</span>${o}</label>`).join("")}
      </fieldset>
      <p class="quiz-out" data-quiz-out aria-live="polite">One of the questions behind the Authority Structure diagnostic. The full Index is scored in a briefing.</p>
    </form>
  </div>
</section>

${lineageBlock(5)}

`,
}));

// ---------- life sciences ----------
const jean = C.people.find((p) => p.slug === "jean-pineault");
write("life-sciences", page({
  nav: "life-sciences", path: "/life-sciences/", title: "Life Sciences",
  description: "HumanFactor’s Global Life Sciences Group advises biotech and life sciences companies on capital readiness, commercialization, governance and exit through Stakeholder Risk Intelligence™ and the Enterprise Value Blueprint™.",
  ld: [crumbs("Life Sciences", "/life-sciences/")],
  body: `
${pageHero({ label: "Global Life Sciences Group", h1: "Enterprise value is built long before the transaction<span class=\"dot\">.</span>", lede: "A breakthrough does not create enterprise value on its own. Value is created when science, strategy, capital and stakeholders move together.", seed: 2 })}

<section class="sec" aria-labelledby="ent-h">
  <div class="wrap">
    ${head(1, "Where we enter", '<span id="ent-h">At each inflection point.</span>', "For pre-commercial, venture-backed, commercial-stage and grant-funded companies across North America and Europe.")}
    <ol class="rows when">${C.ls.enters.map((w, i) => `<li data-reveal><span class="lbl">${pad(i + 1)}</span><h3>${w}</h3></li>`).join("")}</ol>
  </div>
</section>

<section class="sec dark" aria-labelledby="evb-h">
  <div class="wrap">
    ${head(2, "Enterprise Value Blueprint™", '<span id="evb-h">Nine pillars. Thirty-two value drivers.</span>', "Co-authored with the CEO, board and leadership team, and updated every quarter.")}
    <ol class="pillars">${C.ls.pillars.map((p, i) => `<li data-reveal><span class="lbl">${pad(i + 1)}</span>${p}</li>`).join("")}</ol>
  </div>
</section>

<section class="sec" aria-labelledby="rec-h">
  <div class="wrap">
    ${head(3, "Record", '<span id="rec-h">Built, transitioned and realized.</span>')}
    <ul class="rows rec">${C.ls.record.map((r, i) => `<li data-reveal><span class="lbl">${pad(i + 1)}</span><h3>${r}</h3></li>`).join("")}</ul>
    <p class="fine">A representative sample of prior operating, advisory and partner experience.</p>
  </div>
</section>

<section class="sec tint" aria-labelledby="call-h">
  <div class="wrap">
    ${head(4, "When to call", '<span id="call-h">Earlier than you think.</span>')}
    <ol class="grid4">${C.ls.when.map((w, i) => `<li data-reveal><span class="lbl">${pad(i + 1)}</span><p class="big-p">${w}</p></li>`).join("")}</ol>
  </div>
</section>

${peopleBlock(5, [jean, C.people[0]], true)}

`,
}));

// ---------- company ----------
write("company", page({
  nav: "company", path: "/company/", title: "Company",
  description: "HumanFactor Enterprises originated Stakeholder Risk as a category of enterprise risk. Led by founder and CEO Jennifer G. Bates, headquartered in New York, opening in London in 2027.",
  ld: [crumbs("Company", "/company/"), ...C.people.map((p) => ({ "@type": "Person", name: p.name, jobTitle: p.title, worksFor: { "@id": ORG }, sameAs: [p.linkedin] }))],
  body: `
${pageHero({ label: "The firm", h1: "We created the category<span class=\"dot\">.</span>", lede: "HumanFactor originated Stakeholder Risk because the most consequential risk to any company was the one no model priced and no advisor could measure.", seed: 4 })}

<section class="sec" aria-labelledby="is-h">
  <div class="wrap">
    ${head(1, "Position", '<span id="is-h">An advisory and intelligence firm.</span>')}
    <div class="isnt">
      <div data-reveal><p class="lbl">What we are</p><ul><li>Enterprise risk, measured and benchmarked</li><li>Diligence on the system, not the individuals</li><li>Named practitioners, clear scope, defined deliverables</li></ul></div>
      <div data-reveal><p class="lbl">What we are not</p><ul class="not"><li>Organizational consulting</li><li>Executive coaching</li><li>HR advisory</li></ul></div>
    </div>
  </div>
</section>

${peopleBlock(2, C.people, true)}

${numbers(3)}

<section class="sec tint" aria-labelledby="off-h">
  <div class="wrap">
    ${head(4, "Offices", '<span id="off-h">New York, and soon London.</span>')}
    <ul class="grid3">${contact.offices.map((o) => `<li data-reveal><span class="lbl">${o.what}</span><h3>${o.city}</h3></li>`).join("")}</ul>
  </div>
</section>

`,
}));

// ---------- briefing ----------
write("briefing", page({
  nav: "briefing", path: "/briefing/", title: "Request a private briefing",
  description: "A confidential, 30-minute working session with HumanFactor on the risk no one else is measuring. Reviewed within one business day; a scoped MOU follows within 5 to 10 business days.",
  ld: [crumbs("Request a briefing", "/briefing/"), { "@type": "ContactPage", url: `${SITE.url}/briefing/`, about: { "@id": ORG } }],
  body: `
<section class="phero brief">
  <div class="wrap brief-in">
    <div class="phero-copy">
      <p class="lbl">Private briefing · Limited availability</p>
      <h1>A working session on the risk no one else is measuring<span class="dot">.</span></h1>
      <p class="lede">Thirty minutes, confidential, on where Stakeholder Risk sits in your situation today. If it is a fit, you receive a scoped MOU within 5 to 10 business days.</p>
      <dl class="kv">${contact.routes.map((r) => `<div><dt class="lbl">${r.label}</dt><dd><a href="mailto:${r.email}">${r.email}</a></dd></div>`).join("")}
        <div><dt class="lbl">New York</dt><dd><a href="tel:${contact.phone.tel}">${contact.phone.display}</a></dd></div>
      </dl>
    </div>
    <form class="form" data-brief>
      <label><span class="lbl">Name</span><input name="name" autocomplete="name" required></label>
      <label><span class="lbl">Work email</span><input name="email" type="email" autocomplete="email" required></label>
      <label><span class="lbl">Company</span><input name="company" autocomplete="organization"></label>
      <label><span class="lbl">Your role</span><select name="role" required><option value="">Select</option>${["CEO / Founder", "Board / Chair", "Managing Partner", "Operating Partner", "Investment Professional", "Other"].map((o) => `<option>${o}</option>`).join("")}</select></label>
      <label><span class="lbl">Revenue / EBITDA band</span><select name="band"><option value="">Select</option>${["Pre-revenue / clinical stage", "$5M–$25M", "$25M–$75M", "$75M–$200M", "$200M+", "PE fund (sponsor inquiry)"].map((o) => `<option>${o}</option>`).join("")}</select></label>
      <label class="wide"><span class="lbl">What decision is in front of you?</span><textarea name="note" rows="4"></textarea></label>
      <button class="btn btn-light wide" type="submit">Request the briefing ${ARR}</button>
      <p class="lbl mute wide">Confidential · Reviewed within one business day · Opens your email app, addressed to advisory@stakeholderrisk.com</p>
    </form>
  </div>
</section>
`,
}));

// ---------- crawl files ----------
const paths = ["/", "/stakeholder-risk/", "/humanfactor-index/", "/life-sciences/", "/company/", "/briefing/"];
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, "public/sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
writeFileSync(join(ROOT, "public/robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
writeFileSync(join(ROOT, "public/llms.txt"), `# HumanFactor

> HumanFactor (HumanFactor Enterprises, New York) originated Stakeholder Risk and measures it for CEOs, boards, private equity sponsors and life sciences companies.

${C.definition}

## Pages
- [What is Stakeholder Risk?](${SITE.url}/stakeholder-risk/): definition, six dimensions, when to measure
- [The HumanFactor Index](${SITE.url}/humanfactor-index/): four diagnostics, twelve risks, how the score is used
- [Life Sciences](${SITE.url}/life-sciences/): the Global Life Sciences Group and the Enterprise Value Blueprint
- [Company](${SITE.url}/company/): leadership (Jennifer G. Bates, founder and CEO; Jean Pineault, Global Head, Life Sciences) and offices
- [Request a briefing](${SITE.url}/briefing/)

## Questions
${C.faq.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}
`);
console.log("wrote crawl files");
