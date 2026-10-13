// /book, under the calendar: "What you're setting up". The spec sheet in brief (the product page's
// six groups, src/site/specsheet/data.ts) with each group's first tools, and one line on the five
// apps it stands in for (the Five apps scene). Nothing new is claimed here: every name and count
// comes from the product page's own data. Tools Andrew hasn't confirmed (⚑) are never picked as a
// headline; they stay inside each group's "+N more", as on the spec sheet.

import { CATEGORIES, TOOL_COUNT, type Category } from "../site/specsheet/data";
import { APPS, SPEC } from "../content/copy";

/** Headline tools per group: three on laptops, two on phones (one line each). */
const top = (c: Category, n: number) => c.tools.filter((t) => !t.confirm).slice(0, n);

/** "Time tracking" → "time tracking"; "CRM" stays "CRM". */
const lower = (s: string) => (s === s.toUpperCase() ? s : s.toLowerCase());
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export const SETUP = {
  title: "What you’re setting up",
  /** The spec sheet's key specs, in one line. */
  sub: `${TOOL_COUNT} tools in ${CATEGORIES.length} groups, on the crew app and the office web app.`,
  /** Five apps → one (APPS_SCENE: "Replace all that. With one software."; APPS.footnote). */
  apps: `One system in place of five apps: ${list(APPS.apps.map((a) => lower(a.kind)))}. QuickBooks is integrated, not replaced.`,
};

export function Setup({ compact }: { compact: boolean }) {
  const n = compact ? 2 : 3;
  return (
    <section className="bk-setup" aria-labelledby="bk-setup-h" data-testid="book-setup">
      <header className="bk-setup-head">
        <h2 id="bk-setup-h">{SETUP.title}</h2>
        <p>{SETUP.sub}</p>
      </header>
      <ul className="bk-setup-list">
        {CATEGORIES.map((c) => {
          const head = top(c, n);
          const more = c.tools.length - head.length;
          return (
            <li key={c.id} className="bk-setup-row">
              <h3 className="bk-setup-name">{c.name}</h3>
              <p className="bk-setup-tools">
                {head.map((t, i) => (
                  <span key={t.id}>
                    {i > 0 && <span className="bk-setup-dot"> · </span>}
                    {compact ? (SPEC.short[t.id] ?? t.label) : t.label}
                  </span>
                ))}
                {more > 0 && <span className="bk-setup-more"> {SPEC.more(more)}</span>}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="bk-setup-apps">{SETUP.apps}</p>
    </section>
  );
}
