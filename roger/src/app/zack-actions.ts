"use server";

import { randomUUID } from "node:crypto";

export type FreeRunResult =
  | { ok: true; token: string; plays: string[] }
  | { ok: false; field: "email" | "report" | "form"; message: string };

const MAX = 20_000;

/**
 * Saves a free Zack run. Follows the saveLead pattern in src/app/library-actions.ts:
 * honeypot, trimmed inputs, clear messages.
 *
 * TO WIRE IN PETER'S REPO: insert into `free_runs` (token, email, agent, report) and
 * rate-limit by IP and email. This prototype has no database, so it validates, reads the
 * play titles out of the report, and returns a token without storing anything.
 */
export async function saveFreeRun(_: FreeRunResult | null, form: FormData): Promise<FreeRunResult> {
  if (form.get("company")) return { ok: false, field: "form", message: "Something went wrong. Try again." };
  const email = String(form.get("email") ?? "").trim();
  const report = String(form.get("report") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, field: "email", message: "Enter the email you used in the step above." };
  if (report.length < 80) return { ok: false, field: "report", message: "Paste the whole report Zack wrote." };
  if (report.length > MAX) return { ok: false, field: "report", message: "That is longer than 20,000 characters. Paste only Zack's report." };

  const plays = report
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^(#{1,3}\s+|\*\*)?\s*(play\s*\d+|\d+[.)])/i.test(l))
    .map((l) => l.replace(/^[#*\s]+|[*]+$/g, "").replace(/^(play\s*\d+|\d+[.)])\s*[:.·]?\s*/i, "").replace(/\*\*/g, "").trim())
    .filter((l) => l.length > 3)
    .slice(0, 3);

  return { ok: true, token: randomUUID().replace(/-/g, "").slice(0, 16), plays };
}
