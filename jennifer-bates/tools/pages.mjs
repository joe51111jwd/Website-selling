// Writes every page of the site from tools/content.mjs.
//   python3 tools/webimg.py .   (once, or when masters/ changes)
//   node tools/pages.mjs
// The pages are committed, so crawlers and AI answer engines read every word without running JavaScript.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as C from "./content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIZES = JSON.parse(readFileSync(join(ROOT, "public/img/sizes.json"), "utf8"));
const { SITE, person, contact } = C;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longDate = (d) => { const [y, m, day] = d.split("-").map(Number); return `${MONTHS[m - 1]} ${day}, ${y}`; };
const ext = (href, text, cls = "") => `<a${cls ? ` class="${cls}"` : ""} href="${href}" rel="noopener" target="_blank">${text}<span class="sr"> (opens in a new tab)</span></a>`;
const arrow = `<svg class="arr" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;

function img(name, { alt, sizes, cls = "", eager = false }) {
  const s = SIZES[name];
  if (!s) throw new Error(`no image ${name} in public/img/sizes.json: run python3 tools/webimg.py .`);
  const srcset = s.widths.map((w) => `/img/${name}-${w}.webp ${w}w`).join(", ");
  const fallback = s.widths.includes(1280) ? 1280 : s.widths.at(-1);
  return `<img${cls ? ` class="${cls}"` : ""} src="/img/${name}-${fallback}.webp" srcset="${srcset}" sizes="${sizes}" width="${s.w}" height="${s.h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}
const portrait = (sizes, cls, eager) => img("jennifer-bates", { alt: "Jennifer G. Bates, founder and CEO of HumanFactor", sizes, cls, eager });

// ---------- schema ----------
const PERSON_ID = `${SITE.url}/#jennifer`;
const personLd = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: person.name,
  jobTitle: "Founder and CEO",
  description: SITE.short,
  url: `${SITE.url}/`,
  image: `${SITE.url}/img/jennifer-bates-1280.webp`,
  worksFor: { "@type": "Organization", name: person.company, alternateName: "HumanFactor", url: person.companyUrl, sameAs: [person.companyLinkedin] },
  alumniOf: { "@type": "CollegeOrUniversity", name: "New York University Stern School of Business" },
  homeLocation: { "@type": "Place", name: "New York, NY" },
  knowsAbout: ["Stakeholder Risk", "Enterprise value", "Corporate governance", "Private equity due diligence", "Leadership alignment", "Life sciences", "Capital transitions"],
  sameAs: [person.linkedin],
};
const websiteLd = { "@type": "WebSite", "@id": `${SITE.url}/#site`, url: `${SITE.url}/`, name: SITE.name, about: { "@id": PERSON_ID }, inLanguage: "en-US" };
const faqLd = (items) => ({ "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
const crumbs = (name, path) => ({ "@type": "BreadcrumbList", itemListElement: [
  { "@type": "ListItem", position: 1, name: SITE.name, item: `${SITE.url}/` },
  { "@type": "ListItem", position: 2, name, item: `${SITE.url}${path}` },
] });

// ---------- shell ----------
const NAV = [
  ["stakeholder-risk", "/stakeholder-risk/", "Stakeholder Risk"],
  ["speaking", "/speaking/", "Speaking"],
  ["about", "/about/", "About"],
  ["contact", "/contact/", "Contact"],
];
const header = (nav) => `<header class="top" data-top>
  <div class="wrap top-in">
    <a class="mark" href="/" aria-label="${SITE.name}, home">
      <span class="mark-name">Jennifer G. Bates</span>
      <span class="mark-role">Founder &amp; CEO, HumanFactor™</span>
    </a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn><span>Menu</span><i aria-hidden="true"></i></button>
    <nav class="menu" id="menu" aria-label="Main">
      <ul>${NAV.map(([k, href, label]) => `<li><a href="${href}"${k === nav ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}</ul>
      ${ext(contact.briefing, "Request a briefing", "btn btn-sm")}
    </nav>
  </div>
</header>`;

const footer = `<footer class="foot">
  <div class="wrap">
    <div class="foot-cta">
      <p class="foot-line">Decision clarity, <em>before consequence.</em></p>
      <div class="btns">${ext(contact.briefing, `Request a briefing ${arrow}`, "btn")}<a class="btn btn-ghost" href="/speaking/">Book Jennifer to speak</a></div>
    </div>
    <div class="foot-grid">
      <div>
        <p class="foot-name">Jennifer G. Bates</p>
        <p>Founder &amp; CEO of HumanFactor™, creator of Stakeholder Risk. New York.</p>
      </div>
      <nav aria-label="Footer"><ul>
        <li><a href="/stakeholder-risk/">What is Stakeholder Risk?</a></li>
        <li><a href="/speaking/">Speaking</a></li>
        <li><a href="/about/">About Jennifer</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul></nav>
      <ul>
        <li>${ext(person.companyUrl, "HumanFactor")}</li>
        <li>${ext(contact.index, "HumanFactor Index™")}</li>
        <li>${ext(person.linkedin, "LinkedIn")}</li>
        <li><a href="tel:${contact.phone.tel}">${contact.phone.display}</a></li>
      </ul>
    </div>
    <p class="fine">${C.DISCLAIMER} HumanFactor™, Stakeholder Diligence™, HumanFactor Index™, RealTime Advisory™, Living Blueprint™ and Enterprise Value Blueprint™ are trademarks of HumanFactor. © ${new Date().getFullYear()} Jennifer G. Bates.</p>
  </div>
</footer>`;

function page({ nav, path, title, description, ld = [], body }) {
  const full = title ? `${title} | ${SITE.name}` : `${SITE.name}, Founder & CEO of HumanFactor™ and creator of Stakeholder Risk`;
  const graph = { "@context": "https://schema.org", "@graph": [websiteLd, personLd, ...ld] };
  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(full)}</title>
    <meta name="description" content="${esc(description)}" />
    <!--robots-->
    <link rel="canonical" href="${SITE.url}${path}" />
    <meta name="theme-color" content="#0e1822" />
    <meta name="color-scheme" content="dark light" />
    <meta property="og:type" content="${nav === "about" ? "profile" : "website"}" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:title" content="${esc(full)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${SITE.url}${path}" />
    <meta property="og:image" content="${SITE.url}/og.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&family=Geist:wght@400..600&family=Geist+Mono:wght@400;500&display=swap" />
    <link rel="stylesheet" href="/src/styles.css" />
    <script type="application/ld+json">${JSON.stringify(graph)}</script>
  </head>
  <body data-page="${nav}">
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

function write(rel, html) {
  const file = join(ROOT, rel, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log("wrote", join(rel, "index.html"));
}

// ---------- shared blocks ----------
const statsBand = (cls = "") => `<section class="stats ${cls}" aria-label="By the numbers">
  <div class="wrap">
    <dl class="stats-grid">${C.stats.map((s) => `<div><dt>${s.label}</dt><dd>${s.n}</dd></div>`).join("")}</dl>
    <p class="stats-note">${C.DISCLAIMER}</p>
  </div>
</section>`;

const faqBlock = (items, heading = "Questions, answered") => `<section class="sec faq" id="faq" aria-labelledby="faq-h">
  <div class="wrap faq-grid">
    <div class="sec-head">
      <p class="eyebrow">FAQ</p>
      <h2 id="faq-h">${heading}</h2>
    </div>
    <div class="faq-list">${items.map((f) => `
      <details>
        <summary><h3>${esc(f.q)}</h3><i aria-hidden="true"></i></summary>
        <p>${esc(f.a)}</p>
      </details>`).join("")}
    </div>
  </div>
</section>`;

const frameworksBlock = `<section class="sec work" aria-labelledby="work-h">
  <div class="wrap">
    <div class="sec-head split">
      <div><p class="eyebrow">The body of work</p><h2 id="work-h">Six frameworks, from first look to exit.</h2></div>
      <p class="lede">Jennifer built each one to answer the question a CEO, board or investor faces at that moment of a company’s life. Together they run from mapping the people to pricing them at a sale.</p>
    </div>
    <ol class="steps" data-reveal-group>${C.frameworks.map((f, i) => `
      <li data-reveal>
        <span class="step-n">${String(i + 1).padStart(2, "0")} · ${f.verb}</span>
        <h3>${f.name}</h3>
        <p>${f.text}</p>
        <span class="step-t">${f.time}</span>
      </li>`).join("")}
    </ol>
    <p class="more">${ext(person.companyUrl, `See how engagements work at HumanFactor ${arrow}`, "link")}</p>
  </div>
</section>`;

// The pinned X-ray: a deal model, the people under it, where they strain, and what that costs.
const NODES = [
  { id: "ceo", label: "Founder &amp; CEO", x: 50, y: 9 },
  { id: "chair", label: "Board chair", x: 84, y: 22 },
  { id: "inv", label: "Lead investor", x: 87, y: 64 },
  { id: "lend", label: "Lender", x: 66, y: 93 },
  { id: "cfo", label: "CFO", x: 34, y: 93 },
  { id: "cso", label: "Chief scientist", x: 13, y: 64 },
  { id: "cof", label: "Co-founder", x: 16, y: 22 },
];
const at = (id) => NODES.find((n) => n.id === id);
const EDGES = [
  ["ceo", "chair"], ["ceo", "cof"], ["chair", "inv"], ["inv", "lend"], ["lend", "cfo"], ["cfo", "cso"], ["cso", "cof"],
  ["ceo", "inv"], ["chair", "cfo"], ["cof", "cfo"], ["ceo", "cso"], ["inv", "cfo"],
];
const STRAIN = [
  { a: "ceo", b: "inv", code: "SAR", tag: "Different exit years", t: 0.85 },
  { a: "ceo", b: "chair", code: "ASR", tag: "Who really decides?", t: 0.5 },
  { a: "cfo", b: "cso", code: "DAR", tag: "Both own the pipeline call", t: 0.5 },
  { a: "ceo", b: "cof", code: "LIR", tag: "The founder is the product", t: 0.5 },
];
const line = ([a, b], cls = "", i = 0) => `<line x1="${at(a).x}" y1="${at(a).y}" x2="${at(b).x}" y2="${at(b).y}" pathLength="1" class="${cls}" style="--i:${i}" />`;

const xray = `<section class="xray" id="xray" aria-labelledby="xray-h" data-xray>
  <div class="wrap xray-grid">
    <div class="xray-text">
      <div class="xray-step" data-step="0">
        <p class="eyebrow">The idea</p>
        <h2 id="xray-h">Every financial model sits on a human system.</h2>
        <p>This is what diligence prices: revenue, margin, a multiple and the value they add up to. It looks finished.</p>
      </div>
      <div class="xray-step" data-step="1">
        <p class="eyebrow">01 · The people</p>
        <h3>Underneath it are the people who decide.</h3>
        <p>A founder, a co-founder, a board chair, an investor, a lender, the executives. Every number in the model assumes they will act together.</p>
      </div>
      <div class="xray-step" data-step="2">
        <p class="eyebrow">02 · The strain</p>
        <h3>That assumption is the risk.</h3>
        <p>Two executives think they own the same decision. The CEO and the lead investor want different exit years. Stakeholder Risk lives in these lines, and no model shows them.</p>
      </div>
      <div class="xray-step" data-step="3">
        <p class="eyebrow">03 · The price</p>
        <h3>The model didn’t change. The people did.</h3>
        <p>When buyers find the strain, they find it in the multiple. Jennifer’s work is to find it first, measure it, and fix it while it is still cheap.</p>
        <p class="note">Illustrative company and figures.</p>
      </div>
    </div>
    <div class="xray-stage" aria-hidden="true">
      <div class="stage" data-stage="3">
        <svg class="web" viewBox="0 0 100 100" preserveAspectRatio="none">
          ${EDGES.map((e, i) => line(e, "edge", i)).join("")}
          ${STRAIN.map((s, i) => line([s.a, s.b], "strain", i)).join("")}
        </svg>
        ${NODES.map((n, i) => `<span class="node${STRAIN.some((s) => s.a === n.id || s.b === n.id) ? " hot" : ""}" style="--x:${n.x};--y:${n.y};--i:${i}">${n.label}</span>`).join("")}
        ${STRAIN.map((s, i) => { const a = at(s.a), b = at(s.b); return `<span class="tag" style="--x:${a.x + (b.x - a.x) * s.t};--y:${a.y + (b.y - a.y) * s.t};--i:${i}"><b>${s.code}</b><span class="tag-t">${s.tag}</span></span>`; }).join("")}
        <div class="model">
          <p class="model-h"><span>Deal model</span><span>FY26</span></p>
          <dl>
            <div><dt>Revenue</dt><dd>$84.0M</dd></div>
            <div><dt>EBITDA</dt><dd>$18.5M</dd></div>
            <div><dt>Multiple</dt><dd><span class="was">14.0×</span><span class="now">10.5×</span></dd></div>
            <div class="ev"><dt>Enterprise value</dt><dd><span class="was">$259M</span><span class="now">$194M</span></dd></div>
          </dl>
          <p class="model-delta">−$65M <span>with the same numbers</span></p>
        </div>
      </div>
    </div>
  </div>
</section>`;

// ---------- pages ----------
const home = page({
  nav: "home",
  path: "/",
  title: "",
  description: "Jennifer G. Bates is the founder and CEO of HumanFactor™ and the creator of Stakeholder Risk: the enterprise risk that comes from the people who decide a company’s outcome. Advisor to CEOs, boards and investors.",
  ld: [faqLd(C.faq)],
  body: `
<section class="hero" aria-labelledby="hero-h">
  <div class="hero-photo">${portrait("(max-width: 860px) 100vw, 50vw", "", true)}</div>
  <div class="wrap hero-in">
    <div class="hero-copy">
      <p class="eyebrow">Founder &amp; CEO, HumanFactor™ · Creator of Stakeholder Risk</p>
      <h1 id="hero-h"><span data-words>The risk no model prices is</span> <em data-words>the human one.</em></h1>
      <p class="hero-lede">Jennifer G. Bates created <strong>Stakeholder Risk</strong>, the enterprise risk that lives in the relationships, incentives, governance and decision rights among the people who decide a company’s outcome. For more than 20 years she has helped CEOs, boards and investors measure it, and fix it, before it shows up in the price.</p>
      <div class="btns">
        ${ext(contact.briefing, `Request a briefing ${arrow}`, "btn")}
        <a class="btn btn-ghost" href="/stakeholder-risk/">What is Stakeholder Risk?</a>
      </div>
    </div>
  </div>
  <a class="hero-cue" href="#xray"><span>See it</span><i aria-hidden="true"></i></a>
</section>

${xray}

${statsBand()}

<section class="sec define" aria-labelledby="def-h">
  <div class="wrap define-grid">
    <div class="sec-head">
      <p class="eyebrow">The category</p>
      <h2 id="def-h">What is Stakeholder Risk?</h2>
    </div>
    <div class="define-body">
      <p class="big">${C.definition}</p>
      <p>It sits upstream of everything a model measures. When those people pull apart, execution stalls, valuation comes under pressure and enterprise value erodes, often by seven to nine figures, while every line of the spreadsheet still checks out.</p>
      <div class="isnt">
        <div><h3>It is</h3><ul><li>Enterprise risk, measured and benchmarked</li><li>Diligence on the system, not the individuals</li><li>Priced into raises, deals and exits</li></ul></div>
        <div><h3>It isn’t</h3><ul><li>Organizational consulting</li><li>Executive coaching</li><li>HR advisory</li></ul></div>
      </div>
      <p class="more"><a class="link" href="/stakeholder-risk/">How it is measured: the four diagnostics ${arrow}</a></p>
    </div>
  </div>
</section>

${frameworksBlock}

<section class="sec who" aria-labelledby="who-h">
  <div class="wrap">
    <div class="sec-head"><p class="eyebrow">Who she works with</p><h2 id="who-h">The people who carry the outcome.</h2></div>
    <ul class="who-grid">${C.audiences.map((a) => `<li><h3>${a.who}</h3><p>${a.what}</p></li>`).join("")}</ul>
  </div>
</section>

<section class="sec quote-sec" aria-label="In her words">
  <div class="wrap quote-grid">
    <figure class="quote">
      <blockquote><p>“${esc(person.quote)}”</p></blockquote>
      <figcaption>Jennifer G. Bates</figcaption>
    </figure>
    <div class="quote-side">
      <p>A six-time founder and a frequent keynote speaker, Jennifer has worked across more than 25 industries, with outcomes that include valuation increases of up to 800% and multiple seven- and eight-figure exits.</p>
      <p class="more"><a class="link" href="/about/">About Jennifer ${arrow}</a></p>
    </div>
  </div>
</section>

<section class="sec talks-teaser" aria-labelledby="talks-h">
  <div class="wrap">
    <div class="sec-head split">
      <div><p class="eyebrow">Speaking</p><h2 id="talks-h">On stage, and in the room.</h2></div>
      <p class="lede">Keynotes, panels and closed-door sessions for investors, boards and founders.</p>
    </div>
    <ul class="talk-list">${C.talks.map((t) => `<li><a href="/speaking/#${t.title.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "")}"><span class="talk-t">${t.title}</span><span class="talk-s">${t.sub}</span>${arrow}</a></li>`).join("")}</ul>
  </div>
</section>

${faqBlock(C.faq.slice(0, 6))}
`,
});
write("", home);

const sr = page({
  nav: "stakeholder-risk",
  path: "/stakeholder-risk/",
  title: "What is Stakeholder Risk?",
  description: "Stakeholder Risk is the enterprise risk that comes from the relationships, incentives, governance and decision rights among a company’s founders, executives, board, investors and lenders. How it is defined, measured and priced.",
  ld: [
    { "@type": "DefinedTerm", name: "Stakeholder Risk", description: C.definition, url: `${SITE.url}/stakeholder-risk/`, creator: { "@id": PERSON_ID } },
    { "@type": "Article", headline: "What is Stakeholder Risk?", description: C.definition, author: { "@id": PERSON_ID }, about: "Stakeholder Risk", mainEntityOfPage: `${SITE.url}/stakeholder-risk/` },
    faqLd(C.faq.slice(1, 7)),
    crumbs("What is Stakeholder Risk?", "/stakeholder-risk/"),
  ],
  body: `
<section class="page-hero" aria-labelledby="sr-h">
  <div class="wrap narrow">
    <p class="eyebrow">The category Jennifer G. Bates created</p>
    <h1 id="sr-h">What is Stakeholder Risk?</h1>
    <p class="answer">${C.definition}</p>
    <p class="hero-lede">It is the risk underneath the financial model. Management diligence looks at each executive; Stakeholder Risk looks at the system between them, and at whether the people who must agree for the plan to work actually will.</p>
  </div>
</section>

<section class="sec" aria-labelledby="up-h">
  <div class="wrap two">
    <div class="sec-head"><p class="eyebrow">Why it matters</p><h2 id="up-h">Upstream of the numbers.</h2></div>
    <div class="prose">
      <p>Most enterprise risk is priced. Markets have numbers for volatility, credit and governance. The human system that runs a company has been taken on trust: assessed one executive at a time, if at all.</p>
      <p>Yet that system decides whether the plan gets executed. When decision rights overlap, incentives pull in different directions or a board and a CEO want different outcomes, the damage comes first in execution, then in valuation, and finally in enterprise value. Jennifer’s practice has seen stakeholder misalignment erode value by seven to nine figures in single companies.</p>
      <p>Stakeholder Risk names that exposure as a category of its own, so it can be measured, benchmarked and priced like any other.</p>
    </div>
  </div>
</section>

<section class="sec diag" aria-labelledby="diag-h">
  <div class="wrap">
    <div class="sec-head split">
      <div><p class="eyebrow">How it is measured</p><h2 id="diag-h">Four diagnostics.</h2></div>
      <p class="lede">The HumanFactor Index™ scores each from 0 to 100, benchmarked against more than 350,000 leaders. A higher score means more observed exposure.</p>
    </div>
    <ol class="diag-list" data-reveal-group>${C.diagnostics.map((d) => `
      <li data-reveal>
        <div class="diag-top"><span class="code">${d.code}</span><span class="score" style="--s:${d.score}"><b>${d.score}</b><i></i></span></div>
        <h3>${d.name}</h3>
        <p class="q">${d.q}</p>
        <p class="ex">${d.example}</p>
      </li>`).join("")}
    </ol>
    <p class="note">Scores shown are the HumanFactor Index™ illustrative sample, not a real company.</p>
  </div>
</section>

<section class="sec" aria-labelledby="twelve-h">
  <div class="wrap two">
    <div class="sec-head"><p class="eyebrow">What the index tracks</p><h2 id="twelve-h">Twelve risks.</h2></div>
    <div>
      <ol class="twelve">${C.twelve.map((t) => `<li>${t}</li>`).join("")}</ol>
      <p class="more">${ext(contact.index, `The HumanFactor Index™ ${arrow}`, "link")}</p>
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="when-h">
  <div class="wrap two">
    <div class="sec-head"><p class="eyebrow">When to look</p><h2 id="when-h">When the people around the table change.</h2></div>
    <ul class="when">
      <li><h3>Before a raise</h3><p>New capital brings new voices to the board, and new definitions of success.</p></li>
      <li><h3>Before an acquisition</h3><p>Diligence the people system of a target before the price is set, not after close.</p></li>
      <li><h3>At a CEO transition</h3><p>Authority moves. Decision rights that were informal stop working.</p></li>
      <li><h3>Across a portfolio</h3><p>Sponsors and lenders track Stakeholder Risk the way they track covenants.</p></li>
      <li><h3>Before an exit</h3><p>Buyers price what they find. Find it first.</p></li>
    </ul>
  </div>
</section>

${frameworksBlock}

${faqBlock(C.faq.slice(1, 7), "Stakeholder Risk, answered")}
`,
});
write("stakeholder-risk", sr);

const slug = (t) => t.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "");
const speaking = page({
  nav: "speaking",
  path: "/speaking/",
  title: "Speaking",
  description: "Book Jennifer G. Bates, creator of Stakeholder Risk, for keynotes, panels and fireside chats on why deals fail, founder authority, pricing the human system and life sciences.",
  ld: [crumbs("Speaking", "/speaking/"), ...C.appearances.map((a) => ({ "@type": "PodcastEpisode", name: a.title, datePublished: a.date, url: a.url, partOfSeries: { "@type": "PodcastSeries", name: a.show }, actor: { "@id": PERSON_ID } }))],
  body: `
<section class="page-hero page-hero-photo" aria-labelledby="sp-h">
  <div class="wrap two">
    <div>
      <p class="eyebrow">Speaking</p>
      <h1 id="sp-h">The human side of enterprise value, <em>on stage.</em></h1>
      <p class="hero-lede">Jennifer G. Bates is a frequent keynote speaker for investors, boards, founders and life sciences leaders. Every talk brings the audience the same thing: a way to see the risk in the room that no model prices.</p>
      <div class="btns"><a class="btn" href="mailto:media@stakeholderrisk.com?subject=Speaking%20request">Request Jennifer ${arrow}</a></div>
    </div>
    <div class="sp-photo">${portrait("(max-width: 860px) 100vw, 40vw")}</div>
  </div>
</section>

<section class="sec" aria-labelledby="topics-h">
  <div class="wrap">
    <div class="sec-head"><p class="eyebrow">Keynotes</p><h2 id="topics-h">Four talks.</h2></div>
    <ol class="talks">${C.talks.map((t, i) => `
      <li id="${slug(t.title)}">
        <span class="talk-n">${String(i + 1).padStart(2, "0")}</span>
        <div>
          <h3>${t.title}</h3>
          <p class="talk-s">${t.sub}</p>
        </div>
        <div>
          <p>${t.text}</p>
          <p class="talk-for">For ${t.for.charAt(0).toLowerCase() + t.for.slice(1)}</p>
        </div>
      </li>`).join("")}
    </ol>
  </div>
</section>

<section class="sec formats" aria-labelledby="fmt-h">
  <div class="wrap two">
    <div class="sec-head"><p class="eyebrow">Formats</p><h2 id="fmt-h">However the room is set.</h2></div>
    <ul class="fmt">
      <li><h3>Keynote</h3><p>30 to 45 minutes, with time for questions.</p></li>
      <li><h3>Panel or fireside</h3><p>On deal failure, governance, founder transitions or life sciences.</p></li>
      <li><h3>Closed-door session</h3><p>For an investment committee, a board or a portfolio leadership group.</p></li>
      <li><h3>Podcast and press</h3><p>Interviews on Stakeholder Risk and the people behind enterprise value.</p></li>
    </ul>
  </div>
</section>

<section class="sec" aria-labelledby="app-h">
  <div class="wrap two">
    <div class="sec-head"><p class="eyebrow">Recent</p><h2 id="app-h">Listen.</h2></div>
    <ul class="apps">${C.appearances.map((a) => `
      <li>
        <p class="app-meta">${a.show} · <time datetime="${a.date}">${longDate(a.date)}</time></p>
        <h3>${ext(a.url, a.title)}</h3>
        <p>${a.note}</p>
      </li>`).join("")}
    </ul>
  </div>
</section>

<section class="sec book" aria-labelledby="book-h">
  <div class="wrap narrow center">
    <h2 id="book-h">Book Jennifer.</h2>
    <p class="lede">Send the event, the date, the audience and the format. The team replies with availability.</p>
    <p><a class="btn" href="mailto:media@stakeholderrisk.com?subject=Speaking%20request">media@stakeholderrisk.com</a></p>
  </div>
</section>
`,
});
write("speaking", speaking);

const about = page({
  nav: "about",
  path: "/about/",
  title: "About Jennifer G. Bates",
  description: "Jennifer G. Bates is the founder and CEO of HumanFactor™, a six-time founder and the creator of Stakeholder Risk. Her work spans more than 25 industries and $4.2B+ in enterprise value.",
  ld: [{ "@type": "ProfilePage", mainEntity: { "@id": PERSON_ID }, url: `${SITE.url}/about/` }, crumbs("About", "/about/")],
  body: `
<section class="page-hero about-hero" aria-labelledby="ab-h">
  <div class="wrap about-grid">
    <div class="about-photo">${portrait("(max-width: 860px) 100vw, 44vw", "", true)}</div>
    <div>
      <p class="eyebrow">About</p>
      <h1 id="ab-h">Jennifer G. Bates</h1>
      <p class="answer">Jennifer G. Bates is the founder and CEO of HumanFactor™ and the originator of Stakeholder Risk, the formal category of enterprise risk that comes from the relationships, dynamics, incentives, governance and decision systems among the stakeholders who determine a company’s outcome.</p>
      <div class="prose">
        <p>A six-time founder and 23-year entrepreneur based in New York, Jennifer has advised CEOs, boards, investors and fiduciary decision-makers across life sciences, technology, finance and private equity. She created the proprietary frameworks behind Stakeholder Diligence™, the HumanFactor Index™ and RealTime Advisory™.</p>
        <p>Her work spans more than 25 industries and has impacted more than $4.2 billion in enterprise value, including valuation increases of up to 800% and multiple seven- and eight-figure exits.</p>
        <p>She advises biotech and life sciences founders, CEOs, boards and investors, and is a frequent keynote speaker. She holds an ${person.education}.</p>
      </div>
      <dl class="facts">
        <div><dt>Company</dt><dd>${ext(person.companyUrl, "HumanFactor™")}</dd></div>
        <div><dt>Based in</dt><dd>New York</dd></div>
        <div><dt>Education</dt><dd>${person.education}</dd></div>
        <div><dt>Elsewhere</dt><dd>${ext(person.linkedin, "LinkedIn")}</dd></div>
      </dl>
    </div>
  </div>
</section>

<section class="sec quote-sec" aria-label="In her words">
  <div class="wrap narrow">
    <figure class="quote">
      <blockquote><p>“${esc(person.quote2)}”</p></blockquote>
      <figcaption>Jennifer G. Bates</figcaption>
    </figure>
  </div>
</section>

<section class="sec" aria-labelledby="tl-h">
  <div class="wrap two">
    <div class="sec-head"><p class="eyebrow">Timeline</p><h2 id="tl-h">Twenty years to a category.</h2></div>
    <ol class="timeline" data-reveal-group>${C.timeline.map((t) => `<li data-reveal><span class="tl-y">${t.year}</span><p>${t.text}</p></li>`).join("")}</ol>
  </div>
</section>

${statsBand("stats-light")}
`,
});
write("about", about);

const contactPage = page({
  nav: "contact",
  path: "/contact/",
  title: "Contact",
  description: "Request a confidential Stakeholder Risk briefing with Jennifer G. Bates and HumanFactor™, or reach the advisory, speaking and media, capital and research teams.",
  ld: [crumbs("Contact", "/contact/"), { "@type": "ContactPage", url: `${SITE.url}/contact/`, about: { "@id": PERSON_ID } }],
  body: `
<section class="page-hero" aria-labelledby="ct-h">
  <div class="wrap narrow">
    <p class="eyebrow">Contact</p>
    <h1 id="ct-h">Start with a briefing.</h1>
    <p class="answer">Every engagement with Jennifer G. Bates and HumanFactor™ starts with a confidential briefing of about 30 minutes, followed by a scoped memorandum of understanding within 5 to 10 business days.</p>
    <div class="btns">${ext(contact.briefing, `Request a briefing ${arrow}`, "btn")}${ext(contact.assessment, "Score your Stakeholder Risk", "btn btn-ghost")}</div>
  </div>
</section>

<section class="sec" aria-labelledby="routes-h">
  <div class="wrap">
    <h2 id="routes-h" class="sr">Write to the right team</h2>
    <ul class="routes">${contact.routes.map((r) => `<li><h3>${r.label}</h3><p>${r.text}</p><a class="link" href="mailto:${r.email}">${r.email}</a></li>`).join("")}</ul>
    <dl class="facts phones">
      <div><dt>New York</dt><dd><a href="tel:${contact.phone.tel}">${contact.phone.display}</a></dd></div>
      <div><dt>International</dt><dd><a href="tel:${contact.intl.tel}">${contact.intl.display}</a></dd></div>
      <div><dt>Offices</dt><dd>New York (headquarters) · Wilmington, Delaware (registered office) · London (opening 2027)</dd></div>
    </dl>
  </div>
</section>
`,
});
write("contact", contactPage);

// ---------- crawl files ----------
const paths = ["/", "/stakeholder-risk/", "/speaking/", "/about/", "/contact/"];
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, "public/sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
writeFileSync(join(ROOT, "public/robots.txt"), `# Search and AI answer engines are welcome.
User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`);
writeFileSync(join(ROOT, "public/llms.txt"), `# Jennifer G. Bates

> ${SITE.short} She advises CEOs, boards, investors and fiduciaries on the risk that comes from the people who decide a company's outcome.

${C.definition}

## Pages
- [What is Stakeholder Risk?](${SITE.url}/stakeholder-risk/): definition, the four diagnostics of the HumanFactor Index, the twelve risks, when it matters
- [Speaking](${SITE.url}/speaking/): keynotes, formats, recent appearances, booking
- [About](${SITE.url}/about/): biography and timeline
- [Contact](${SITE.url}/contact/): briefings, advisory, media, capital and research

## Facts
- Founder and CEO of HumanFactor (HumanFactor Enterprises), headquartered in New York: ${person.companyUrl}
- Six-time founder; more than 20 years advising CEOs, boards and investors in life sciences, technology, finance and private equity
- Created the HumanFactor Index, Stakeholder Diligence, RealTime Advisory and the Enterprise Value Blueprint
- ${person.education}

## Questions
${C.faq.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}
`);
console.log("wrote public/sitemap.xml, robots.txt, llms.txt");
