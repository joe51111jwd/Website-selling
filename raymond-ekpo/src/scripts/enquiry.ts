import { track } from './track';

// The enquiry form posts JSON straight to the form service (FormSubmit or Formspree)
// and shows its own success and error states. It never hands off to a mail app.

export function initEnquiry() {
  const form = document.querySelector<HTMLFormElement>('#enquiry');
  const success = document.querySelector<HTMLElement>('#enquiry-success');
  if (!form || !success) return;

  const endpoint = form.dataset.endpoint ?? '';
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const submitLabel = submit.querySelector<HTMLElement>('.submit-label')!;
  const deck = form.querySelector<HTMLInputElement>('#f-deck')!;
  const errorBox = form.querySelector<HTMLElement>('.form-error')!;
  const invalidBox = form.querySelector<HTMLElement>('.form-invalid')!;
  const radios = form.querySelectorAll<HTMLInputElement>('input[name="Request"]');

  const isAudit = () => form.querySelector<HTMLInputElement>('input[name="Request"]:checked')?.value === 'Mini-audit';

  function syncMode() {
    const audit = isAudit();
    deck.required = audit;
    form!.querySelector<HTMLElement>('[data-deck-optional]')!.hidden = audit;
    form!.querySelector<HTMLElement>('[data-deck-required]')!.hidden = !audit;
    form!.querySelectorAll<HTMLElement>('[data-project-only]').forEach((el) => (el.hidden = audit));
    submitLabel.textContent = (audit ? submit.dataset.labelAudit : submit.dataset.labelProject) ?? '';
  }

  // Links from elsewhere on the site preselect the request type and service
  const params = new URLSearchParams(location.search);
  if (params.get('type') === 'audit') {
    radios.forEach((r) => (r.checked = r.value === 'Mini-audit'));
  }
  // ?service=rewrite, or several from the fit check: ?service=rewrite,qa-prep
  for (const service of (params.get('service') ?? '').split(',').filter(Boolean)) {
    const box = form.querySelector<HTMLInputElement>(`input[data-service="${CSS.escape(service)}"]`);
    if (box) box.checked = true;
  }
  radios.forEach((r) => r.addEventListener('change', syncMode));
  syncMode();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    invalidBox.hidden = true;

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      invalidBox.hidden = false;
      // fieldsets match :invalid too, so look for the control itself
      form.querySelector<HTMLElement>('input:invalid, select:invalid, textarea:invalid')?.focus();
      return;
    }

    const data = new FormData(form);
    // Bots fill hidden fields; quietly pretend it worked
    if (data.get('_honey') || data.get('_gotcha')) {
      showSuccess();
      return;
    }

    const audit = isAudit();
    const payload: Record<string, string> = {};
    for (const [key, value] of data.entries()) {
      if (key === '_honey' || key === '_gotcha' || typeof value !== 'string' || value.trim() === '') continue;
      payload[key] = payload[key] ? `${payload[key]}, ${value}` : value.trim();
    }
    const company = payload['Company'] ?? 'a founder';
    payload._subject = audit ? `Mini-audit request: ${company}` : `Enquiry: ${company}`;
    payload._template = 'table';
    payload._captcha = 'false';

    submit.disabled = true;
    const label = submitLabel.textContent;
    submitLabel.textContent = 'Sending…';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { success?: string | boolean; ok?: boolean };
      // FormSubmit answers { success: "true" }, Formspree answers { ok: true }
      if (!res.ok || body.success === 'false' || body.success === false) throw new Error(`Form service: ${res.status}`);

      track(audit ? 'Audit request' : 'Enquiry', {
        stage: payload['Stage'] ?? '',
        timing: payload['Timing'] ?? '',
        services: payload['Services'] ?? '',
      });
      showSuccess();
    } catch {
      errorBox.hidden = false;
      submit.disabled = false;
      submitLabel.textContent = label;
    }
  });

  function showSuccess() {
    form!.hidden = true;
    success!.hidden = false;
    success!.focus();
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    success!.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
  }
}
