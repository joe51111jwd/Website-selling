// The still of the real MacBook + iPhone (rendered offline from the Stage at 3x, transparent):
// PHONE MODE's device shot. The hero no longer shows devices; the FAQ's close does (phones).

const base = import.meta.env.BASE_URL;
/** 4.6 × 3.05 frame units, rendered full-bleed at 390 px (3x and 2x files). */
export const PHONE_HERO_STILL = {
  src: `${base}renders/phone-hero.webp`,
  srcSet: `${base}renders/phone-hero-2x.webp 780w, ${base}renders/phone-hero.webp 1170w`,
  aspect: 4.6 / 3.05,
};
