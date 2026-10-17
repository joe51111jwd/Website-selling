// Sends CTA and contact clicks to Plausible as goals. Does nothing if analytics is off.

type Plausible = (event: string, options?: { props?: Record<string, string> }) => void;

export function track(event: string, props?: Record<string, string>) {
  const plausible = (window as unknown as { plausible?: Plausible }).plausible;
  if (plausible) plausible(event, props ? { props } : undefined);
}

document.addEventListener('click', (e) => {
  const el = (e.target as Element | null)?.closest<HTMLElement>('[data-cta], [data-contact]');
  if (!el) return;
  if (el.dataset.cta) {
    track('CTA', { cta: el.dataset.cta, location: el.dataset.ctaLocation ?? 'unknown', page: location.pathname });
  } else if (el.dataset.contact) {
    track('Contact click', { channel: el.dataset.contact, page: location.pathname });
  }
});
