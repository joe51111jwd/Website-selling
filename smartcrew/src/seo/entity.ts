// Home-page JSON-LD. @id matches ORG in render.ts so the home page and the article pages
// describe one organization. Facts are the ones already published (this file's description is
// the entity blurb in llms(), and the home page title and meta description).

export const SITE = "https://www.smartcrewhq.com";

// TODO(andrew): sameAs. Add official profile URLs (LinkedIn, YouTube, Facebook, X, app stores).
// None are in the repo, so sameAs is omitted.
const SAME_AS: string[] = [];

// TODO(andrew): telephone. config.andrewPhone is empty.
// TODO(andrew): address. No postal address is in the repo.
const ORG = {
  "@type": "Organization",
  "@id": `${SITE}/#org`,
  name: "SmartCrew",
  alternateName: "SmartCrew HQ",
  url: `${SITE}/`,
  logo: `${SITE}/seo-assets/smartcrew-logo.webp`,
  email: "support@smartcrewhq.com",
  founder: { "@type": "Person", name: "Andrew Drish" },
  ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
};

// TODO(andrew): price. config.pricing is null, so there is no offers block.
// TODO(andrew): operatingSystem and install URL. No verified app-store listing is in the repo.
const APP = {
  "@type": "SoftwareApplication",
  "@id": `${SITE}/#app`,
  name: "SmartCrew",
  applicationCategory: "BusinessApplication",
  url: `${SITE}/`,
  description:
    "All-in-one software for heavy civil and dirt work contractors with 5–100 employees: GPS time tracking, job costing against the bid, equipment maintenance and DOT inspections, hauling tickets and materials, daily reports, scheduling, sales pipeline, crew messaging, safety forms and file storage, with QuickBooks Online integration. Founded by Andrew Drish, whose family has been in construction for 75 years.",
  featureList: [
    "GPS time tracking",
    "Job costing",
    "Equipment maintenance and DOT inspections",
    "Hauling tickets and materials",
    "Daily reports",
    "Scheduling",
    "Sales pipeline",
    "Crew messaging",
    "Safety forms",
    "File storage",
    "QuickBooks Online integration",
  ],
  publisher: { "@id": `${SITE}/#org` },
};

export function homeJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      ORG,
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        name: "SmartCrew",
        url: `${SITE}/`,
        publisher: { "@id": `${SITE}/#org` },
      },
      APP,
    ],
  };
}

/** Canonical, explicit index directive, and the entity graph. Home page only. */
export function homeHeadTags(): string {
  const json = JSON.stringify(homeJsonLd()).replace(/</g, "\\u003c");
  return `<link rel="canonical" href="${SITE}/" />
<meta property="og:url" content="${SITE}/" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<!-- TODO(andrew): sameAs, telephone, address, price, and operatingSystem are omitted. They are not verified in the repo. -->
<script type="application/ld+json">${json}</script>`;
}
