// Stand-in for the PLAYBOOK §7.2 event dictionary: events land in window.dataLayer so they can be
// inspected in the prototype. Behaviour fields (modules viewed, FAQ opened) ride along with the
// lead, as Andrew's call prep.

type Props = Record<string, string | number | boolean | undefined>;

export const session = {
  modulesViewed: new Set<string>(),
  faqOpened: new Set<string>(),
};

export function track(event: string, props: Props = {}) {
  if (event === "module_view" && typeof props.module_id === "string") session.modulesViewed.add(props.module_id);
  if (event === "faq_open" && typeof props.faq_id === "string") session.faqOpened.add(props.faq_id);
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    (w.dataLayer ||= []).push({ event, ...props });
  } catch {
    /* never block the page on analytics */
  }
}
