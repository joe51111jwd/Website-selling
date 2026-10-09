/**
 * The work. `featured: true` puts a project in the pinned "Selected work"
 * sequence on the home page (designed for three); everything else shows in
 * "More work" and on /work. Add a project here and it gets a case study page
 * at /work/<slug> automatically.
 *
 * All projects below are placeholders until the real ones arrive.
 */

export type Media = {
  src: string;
  alt: string;
  /** Videos play muted and looped. */
  kind?: "image" | "video";
  poster?: string;
};

export type Block =
  | { type: "text"; label: string; title?: string; body: string }
  | { type: "full"; media: Media; caption?: string }
  | { type: "pair"; media: [Media, Media] }
  | { type: "phones"; media: Media[]; caption?: string }
  | { type: "stats"; items: { value: string; label: string }[] }
  | { type: "quote"; text: string; by: string };

export type Project = {
  slug: string;
  name: string;
  featured: boolean;
  client: string;
  category: string;
  year: string;
  role: string;
  services: string[];
  stack: string[];
  /** Live link. Leave empty and the page shows "Link coming soon". */
  url: string;
  urlLabel: string;
  /** One line, used in lists. */
  summary: string;
  /** The case study's opening paragraph. */
  overview: string;
  /** The project's own color, used for small accents on its pages. */
  color: string;
  cover: Media;
  /** A scroll-through film; when present it plays wherever the cover would. */
  reel?: Media;
  blocks: Block[];
};

const m = (slug: string, file: string, alt: string): Media => ({ src: `/media/work/${slug}/${file}`, alt });
const reel = (slug: string, alt: string): Media => ({
  src: `/media/work/${slug}/reel.mp4`,
  poster: `/media/work/${slug}/reel-poster.webp`,
  kind: "video",
  alt,
});

export const work: Project[] = [
  {
    slug: "northpass",
    name: "Northpass",
    featured: true,
    client: "Northpass Inc.",
    category: "Fintech",
    year: "2026",
    role: "Design & development",
    services: ["Art direction", "Web design", "Front-end", "WebGL"],
    stack: ["Next.js", "TypeScript", "three.js", "Sanity"],
    url: "",
    urlLabel: "northpass.com",
    summary: "Treasury and spend software for small teams, launched with a site that feels like the product.",
    overview:
      "Northpass gives small finance teams the tools big companies have: one place for cash, cards and approvals. They came to me two months before their Series A with a product that was ready and a website that wasn't.",
    color: "#c8f560",
    cover: m("northpass", "cover.webp", "The Northpass home page: a glowing card above the headline"),
    reel: reel("northpass", "Scrolling through the Northpass home page"),
    blocks: [
      {
        type: "text",
        label: "Challenge",
        title: "Make money software feel calm.",
        body: "Fintech sites shout. Northpass's customers are tired finance leads who want to trust a tool at a glance, so the site had to be quiet, exact, and fast on any connection.",
      },
      { type: "full", media: m("northpass", "shot-1.webp", "Product panels showing balances and a cash-flow chart") },
      {
        type: "pair",
        media: [
          m("northpass", "shot-2.webp", "A bento grid of Northpass features"),
          m("northpass", "shot-3.webp", "The Northpass stats band and testimonial"),
        ],
      },
      {
        type: "text",
        label: "Approach",
        title: "The product is the hero.",
        body: "Instead of illustrations, every section shows the real interface, rebuilt in code so it stays sharp at any size. One accent color, used only where money moves.",
      },
      {
        type: "phones",
        media: [
          m("northpass", "mobile-1.webp", "Northpass on a phone: the hero"),
          m("northpass", "mobile-2.webp", "Northpass on a phone: features"),
          m("northpass", "mobile-3.webp", "Northpass on a phone: pricing"),
        ],
        caption: "Designed phone-first: most visitors arrive from a link in a group chat.",
      },
      {
        type: "stats",
        items: [
          { value: "0.8s", label: "Largest paint on 4G" },
          { value: "100", label: "Lighthouse accessibility" },
          { value: "6 wk", label: "From kickoff to launch" },
        ],
      },
      { type: "quote", text: "It finally looks like the product we built.", by: "Co-founder, Northpass" },
    ],
  },
  {
    slug: "atlas",
    name: "Atlas Type Co.",
    featured: true,
    client: "Atlas Type Co.",
    category: "Type foundry",
    year: "2026",
    role: "Design & development",
    services: ["Web design", "Front-end", "Type tester", "E-commerce"],
    stack: ["Astro", "TypeScript", "Shopify", "Variable fonts"],
    url: "",
    urlLabel: "atlastype.co",
    summary: "A foundry site where the typefaces do the talking, with a live tester for every family.",
    overview:
      "Atlas is an independent foundry with nine families and no patience for templates. The brief: a shop that is also a specimen book, where you can try every weight before you buy a license.",
    color: "#e4381e",
    cover: m("atlas", "cover.webp", "The Atlas Type Co. specimen hero"),
    reel: reel("atlas", "Scrolling through the Atlas Type Co. site"),
    blocks: [
      {
        type: "text",
        label: "Challenge",
        title: "Nine families, one page at a time.",
        body: "Type sites either drown you in glyphs or hide them behind PDFs. Atlas wanted every family to have its own stage, without the shop turning into a catalog.",
      },
      { type: "full", media: m("atlas", "shot-1.webp", "A weights waterfall from Thin to Black") },
      {
        type: "pair",
        media: [
          m("atlas", "shot-2.webp", "The Atlas type tester with sliders"),
          m("atlas", "shot-3.webp", "The list of Atlas typefaces with prices"),
        ],
      },
      {
        type: "text",
        label: "Approach",
        title: "A specimen you can touch.",
        body: "Every family page opens on a tester wired to the variable font's axes. Licensing lives one click away, and the cart remembers what you were testing.",
      },
      {
        type: "phones",
        media: [
          m("atlas", "mobile-1.webp", "Atlas on a phone: the specimen hero"),
          m("atlas", "mobile-2.webp", "Atlas on a phone: the glyph grid"),
          m("atlas", "mobile-3.webp", "Atlas on a phone: licensing"),
        ],
      },
      {
        type: "stats",
        items: [
          { value: "9", label: "Families with live testers" },
          { value: "38 KB", label: "JavaScript on a family page" },
          { value: "2×", label: "Licenses sold, first quarter" },
        ],
      },
    ],
  },
  {
    slug: "halftone",
    name: "Halftone Records",
    featured: true,
    client: "Halftone Records",
    category: "Music",
    year: "2025",
    role: "Design & development",
    services: ["Art direction", "Web design", "Front-end", "Motion"],
    stack: ["SvelteKit", "GSAP", "Shopify", "Mux"],
    url: "",
    urlLabel: "halftonerecords.com",
    summary: "An independent label's home for releases, tour dates and records you can hear before you buy.",
    overview:
      "Halftone puts out loud records in small runs. Their old site was a link list. The new one is a record shop, a tour poster and a listening room, and it sells out pressings on release day.",
    color: "#ff5a1f",
    cover: m("halftone", "cover.webp", "The Halftone Records home page with vinyl sliding out of sleeves"),
    reel: reel("halftone", "Scrolling through the Halftone Records site"),
    blocks: [
      {
        type: "text",
        label: "Challenge",
        title: "Sell the record, not the website.",
        body: "Release days bring a spike of fans who want one thing. The site had to look like the label's sleeves and still get someone from a link to checkout in three taps.",
      },
      { type: "full", media: m("halftone", "shot-1.webp", "The Halftone release grid") },
      {
        type: "pair",
        media: [
          m("halftone", "shot-2.webp", "Halftone tour dates"),
          m("halftone", "shot-3.webp", "The Halftone newsletter section"),
        ],
      },
      {
        type: "text",
        label: "Approach",
        title: "Every release gets a sleeve.",
        body: "Each release page takes its colors from the record's artwork. The player keeps going as you browse, so the site never goes quiet.",
      },
      {
        type: "phones",
        media: [
          m("halftone", "mobile-1.webp", "Halftone on a phone: the home page"),
          m("halftone", "mobile-2.webp", "Halftone on a phone: releases"),
          m("halftone", "mobile-3.webp", "Halftone on a phone: tour dates"),
        ],
      },
      {
        type: "stats",
        items: [
          { value: "3 taps", label: "From link to checkout" },
          { value: "11 min", label: "First pressing sold out" },
          { value: "60fps", label: "On a five-year-old phone" },
        ],
      },
    ],
  },
  {
    slug: "meridian",
    name: "Meridian",
    featured: false,
    client: "Meridian Architects",
    category: "Architecture",
    year: "2025",
    role: "Design & development",
    services: ["Web design", "Front-end", "CMS"],
    stack: ["Next.js", "Sanity"],
    url: "",
    urlLabel: "meridian.studio",
    summary: "A quiet portfolio for an architecture studio, drawn on a hairline grid.",
    overview:
      "Meridian's buildings are calm and precise, so the site is too: a hairline grid, one typeface, and drawings that load before the photos do.",
    color: "#8a7f6e",
    cover: m("meridian", "cover.webp", "The Meridian home page with an elevation drawing"),
    blocks: [{ type: "full", media: m("meridian", "shot-1.webp", "The Meridian project index") }],
  },
  {
    slug: "bloom",
    name: "Bloom & Bower",
    featured: false,
    client: "Bloom & Bower",
    category: "Commerce",
    year: "2025",
    role: "Design & development",
    services: ["Web design", "Shopify theme"],
    stack: ["Shopify", "Liquid"],
    url: "",
    urlLabel: "bloomandbower.com",
    summary: "Same-day flowers, ordered in under a minute.",
    overview: "A florist's shop rebuilt around one question: what can you get delivered today? The answer is always on screen.",
    color: "#1f3d2b",
    cover: m("bloom", "cover.webp", "The Bloom & Bower home page"),
    blocks: [{ type: "full", media: m("bloom", "shot-1.webp", "Bloom & Bower product cards") }],
  },
  {
    slug: "parcel",
    name: "Parcel",
    featured: false,
    client: "Parcel Logistics",
    category: "SaaS",
    year: "2024",
    role: "Front-end development",
    services: ["Front-end", "Interactive demo"],
    stack: ["React", "TypeScript", "Mapbox"],
    url: "",
    urlLabel: "parcel.io",
    summary: "A logistics platform whose home page is a working demo of its dashboard.",
    overview: "Parcel's product is a live map of every shipment. The home page hands you that map and lets you play with it.",
    color: "#6d4aff",
    cover: m("parcel", "cover.webp", "The Parcel dashboard hero"),
    blocks: [{ type: "full", media: m("parcel", "shot-1.webp", "Parcel's feature section") }],
  },
  {
    slug: "tidewater",
    name: "Tidewater Surf Club",
    featured: false,
    client: "Tidewater Surf Club",
    category: "Hospitality",
    year: "2024",
    role: "Design & development",
    services: ["Web design", "Booking flow"],
    stack: ["Astro", "Cal.com"],
    url: "",
    urlLabel: "tidewater.surf",
    summary: "A surf school's site with the day's tide chart and a booking flow built in.",
    overview: "Lessons depend on the tide, so the tide chart is the home page. Pick a window, book a board, done.",
    color: "#0e4d52",
    cover: m("tidewater", "cover.webp", "The Tidewater Surf Club home page with layered waves"),
    blocks: [{ type: "full", media: m("tidewater", "shot-1.webp", "Tidewater lesson cards") }],
  },
];

export const featured = work.filter((p) => p.featured);
export const moreWork = work.filter((p) => !p.featured);
export const findProject = (slug: string) => work.find((p) => p.slug === slug);

/** The film if there is one, else the cover. */
export const heroMedia = (p: Project): Media => p.reel ?? p.cover;

/** A still that matches the film's first frame, for small previews. */
export const still = (p: Project): Media => (p.reel?.poster ? { src: p.reel.poster, alt: p.reel.alt } : p.cover);

export function nextProject(slug: string): Project {
  const i = work.findIndex((p) => p.slug === slug);
  return work[(i + 1) % work.length];
}

/** Two-digit index used across the site: 01, 02, ... */
export const pad = (n: number) => String(n).padStart(2, "0");
