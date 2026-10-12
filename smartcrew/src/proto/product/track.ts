// Prototype tracking: pushes the PLAYBOOK §7.2 event names to window.dataLayer and keeps the
// call-prep lists (modules viewed, FAQs opened) that ride with the lead to Andrew.

type Props = Record<string, unknown>;

export const prep = { modules: new Set<string>(), faqs: new Set<string>() };

export function track(event: string, props: Props = {}) {
  if (event === "module_view" && typeof props.module_id === "string") prep.modules.add(props.module_id);
  if (event === "faq_open" && typeof props.faq_id === "string") prep.faqs.add(props.faq_id);
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    (w.dataLayer ||= []).push({ event, ...props, ts: Date.now() });
  } catch {
    /* never block the page on analytics */
  }
}
