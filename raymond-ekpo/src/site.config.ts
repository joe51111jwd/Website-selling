// Everything site-wide that Raymond might want to change lives here.
// Service names and prices live in src/content/services/, one file each.

export const site = {
  name: 'Raymond Ekpo',
  role: 'Investor Narrative Specialist',
  // The live domain. Used for canonical URLs, the sitemap and share images.
  // Points at the Vercel deployment until Raymond's own domain (e.g. raymondekpo.com) is connected.
  // PUBLIC_SITE_URL overrides it for other builds, such as the Liquid Glass version.
  url: (import.meta.env?.PUBLIC_SITE_URL as string | undefined) || 'https://raymond-ekpo.vercel.app',
  description:
    'Raymond Ekpo helps pre-seed and seed founders in the US and UK build the investment narrative behind their raise: the thesis, the storyline and the deck.',

  email: 'raymond@maneuverandco.co',
  replyTime: 'two business days',

  x: { handle: '@raymonduekpo', url: 'https://x.com/raymonduekpo' },
  linkedin: 'https://www.linkedin.com/in/raymonduekpo/',

  firm: {
    name: 'Maneuver & Co.',
    url: 'https://maneuverandco.com',
    line: 'a growth strategy firm for B2B companies whose traction has flattened',
  },

  // Where the enquiry form posts, as JSON. Works with either:
  //   FormSubmit  https://formsubmit.co/ajax/<email>   (no account; confirm the first email it sends)
  //   Formspree   https://formspree.io/f/<form id>
  formEndpoint: 'https://formsubmit.co/ajax/raymond@maneuverandco.co',

  // A Cal.com or Calendly link. Leave empty to hide the "book a call" option.
  bookingUrl: '',

  // The domain as added in Plausible. Leave empty to turn analytics off.
  plausibleDomain: 'raymond-ekpo.vercel.app',

  // A portrait in /public, e.g. '/raymond-ekpo.jpg'. Leave empty for the typographic plate.
  portrait: '',
};
