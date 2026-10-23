// llms-full.txt: a plain markdown copy of every page in the SEO library, for AI assistants that read
// one file instead of crawling. Same text as the HTML pages (no extra claims), built from the same
// SeoPage data. llms.txt (render.ts) stays the short index and links here.
import type { Block, Cell, SeoPage } from "./types";

const SITE = "https://www.smartcrewhq.com";
/** [label](slug) -> [label](https://www.smartcrewhq.com/slug/) */
const md = (s: string) => s.replace(/\]\((?!https?:)([^)]+)\)/g, (_m, p) => `](${SITE}/${p.replace(/^\/|\/$/g, "")}/)`);
const cell = (c: Cell) => (typeof c === "string" ? md(c) : [c.mark, c.note].filter(Boolean).join(": ")).replace(/\|/g, "/");

function block(b: Block): string {
  switch (b.t) {
    case "h2": return `## ${b.text}`;
    case "h3": return `### ${b.text}`;
    case "p": return md(b.text);
    case "ul": return b.items.map((i) => `- ${md(i)}`).join("\n");
    case "ol": return b.items.map((i, n) => `${n + 1}. ${md(i)}`).join("\n");
    case "table":
      return [b.caption ? `Table: ${b.caption}` : "", `| ${b.head.join(" | ")} |`, `| ${b.head.map(() => "---").join(" | ")} |`, ...b.rows.map((r) => `| ${r.map(cell).join(" | ")} |`), b.note ? `Note: ${md(b.note)}` : ""].filter(Boolean).join("\n");
    case "note": return `> **${b.title}:** ${md(b.text)}`;
    case "cards": return b.cards.map((c) => `**${c.title}**\n${c.items.map((i) => `- ${md(i)}`).join("\n")}`).join("\n\n");
    case "steps": return b.steps.map((s, n) => `${n + 1}. **${s.title}:** ${md(s.text)}`).join("\n");
    case "quote": return `> "${b.text}" (${b.who})`;
    case "shots": return b.caption ? `[Screens: ${b.caption}]` : "";
    case "cta": return "";
  }
}

function page(p: SeoPage) {
  return [
    `# ${p.h1}`,
    `URL: ${SITE}/${p.slug}/ · Updated: ${p.updated}`,
    md(p.lede),
    p.summary?.length ? p.summary.map((s) => `- ${md(s)}`).join("\n") : "",
    ...p.blocks.map(block),
    p.faqs.length ? `## FAQ\n\n${p.faqs.map((f) => `**${f.q}**\n${md(f.a)}`).join("\n\n")}` : "",
    p.sources?.length ? `## Sources\n\n${p.sources.map((s) => `- [${s.label}](${s.url}) (checked ${s.accessed})`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function llmsFull(pages: SeoPage[]) {
  // the entity guide first, so a reader meets "what SmartCrew is" before any comparison
  const order = [...pages].sort((a, b) => Number(b.slug === "guides/what-is-smartcrew") - Number(a.slug === "guides/what-is-smartcrew"));
  return `# SmartCrew: full text of the SmartCrew guides\n\nEvery page in the SmartCrew library at ${SITE}, as markdown. The short index is ${SITE}/llms.txt.\n\n${order.map(page).join("\n\n---\n\n")}\n`;
}
