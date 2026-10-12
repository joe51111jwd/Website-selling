import { config } from "../config";
import { track } from "./track";

// The trial form's data: validated, sent to the webhook, and carried to the booking page so
// Andrew's calendar opens already filled in.

export type Lead = {
  company: string;
  name: string;
  email: string;
  phone: string;
  size: string;
  /** Which button opened the form: "trial" or "demo". */
  intent: "trial" | "demo";
};

export type LeadErrors = Partial<Record<keyof Lead, string>>;

const KEY = "smartcrew-lead";

export function validate(l: Lead): LeadErrors {
  const e: LeadErrors = {};
  if (!l.company.trim()) e.company = "Your company's name";
  if (!l.name.trim()) e.name = "Your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(l.email.trim())) e.email = "An email we can reach you at";
  if (l.phone.replace(/\D/g, "").length < 10) e.phone = "A 10-digit phone number";
  if (!l.size) e.size = "Pick your crew size";
  return e;
}

/** (555) 123-4567 as you type; leaves anything that isn't a US number alone. */
export function formatPhone(v: string) {
  const d = v.replace(/\D/g, "");
  if (v.trim().startsWith("+") || d.length > 11) return v;
  const n = d.length === 11 && d[0] === "1" ? d.slice(1) : d.slice(0, 10);
  if (n.length < 4) return n;
  if (n.length < 7) return `(${n.slice(0, 3)}) ${n.slice(3)}`;
  return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
}

export async function submitLead(l: Lead) {
  const lead = { ...l, page: location.href, submittedAt: new Date().toISOString() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(lead));
  } catch {
    /* private mode: the booking page just won't be prefilled */
  }
  track("Lead", { content_name: l.intent === "demo" ? "Book a demo" : "Free trial" });
  if (config.leadWebhook) {
    // keepalive so the request survives the page changing to the booking page
    await fetch(config.leadWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      keepalive: true,
    }).catch(() => {});
  }
}

export function savedLead(): (Lead & { submittedAt?: string }) | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
