// The SEO library's content model: every page (industry, comparison, feature, guide) is one SeoPage,
// rendered by ./render.ts into a plain static HTML doc page (no script needed to read it, so search
// engines and AI assistants get the whole text). One template for all of them (James, Oct 22: "We'll
// have a format, and we'll use that for all of them").
//
// Inline text in any string supports **bold** and [label](href) links. Nothing else.

export type Kind = "industry" | "compare" | "versus" | "feature" | "guide";

/** A comparison cell: yes / no / partial / unknown, plus an optional short note. */
export type Mark = "yes" | "no" | "partial" | "unknown";
export type Cell = string | { mark: Mark; note?: string };

/** An app screen from public/ (real SmartCrew screens, demo account "Cedar Ridge Earthworks"). */
export type Shot = {
  /** key into SHOTS in ./shots.ts */
  id: string;
  caption?: string;
};

export type Block =
  | { t: "h2"; text: string; id?: string }
  | { t: "h3"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  /** one screen, or two-three side by side (a laptop screen and a phone screen pair well) */
  | { t: "shots"; shots: Shot[]; caption?: string }
  | { t: "table"; caption?: string; head: string[]; rows: Cell[][]; note?: string }
  /** a boxed aside: "Worth knowing", "Where X is the better pick" */
  | { t: "note"; title: string; text: string; tone?: "plain" | "warn" }
  /** two (or three) cards side by side: "Pick X if… / Pick SmartCrew if…" */
  | { t: "cards"; cards: { title: string; items: string[]; tone?: "us" | "them" | "plain" }[] }
  /** a short run of numbered steps with a title each: a workflow */
  | { t: "steps"; steps: { title: string; text: string }[] }
  /** Andrew's own words (only real quotes from his copy) */
  | { t: "quote"; text: string; who: string }
  /** the mid-page Try SmartCrew band */
  | { t: "cta"; title?: string; text?: string };

export type Faq = { q: string; a: string };

export type Source = { label: string; url: string; accessed: string };

export type SeoPage = {
  kind: Kind;
  /** path without slashes at either end: "excavation-software", "compare/busybusy-alternative" */
  slug: string;
  /** the <title> (keep under ~60 characters) */
  title: string;
  /** meta description (~150 characters) */
  description: string;
  /** small label over the H1 */
  eyebrow: string;
  h1: string;
  /** the answer up front, 2–3 sentences: what AI assistants and featured snippets quote */
  lede: string;
  /** "The short version" bullets under the lede */
  summary?: string[];
  /** the screen(s) right under the summary */
  hero?: Shot[];
  blocks: Block[];
  faqs: Faq[];
  /** every outside fact on the page links to one of these */
  sources?: Source[];
  /** slugs of related pages, shown at the end */
  related?: string[];
  /** the main keyword this page is for (for our reports; not shown) */
  keyword: string;
  /** ISO date the facts were last checked */
  updated: string;
  /** short name in the side navigation */
  nav: string;
};
