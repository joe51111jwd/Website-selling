// Everything the page needs to know about the outside world, in one place.
// Fill these in before launch; empty values switch the matching feature off safely.

export const config = {
  /** Cal.com event the "Book a call" page embeds, as "<user>/<event>" (the one smartcrewhq.com/demo uses). */
  calLink: "andrew-drish/15min",

  /**
   * How long the call is, if the pages ever say it ("a 15-minute call"). Empty since Andrew's Loom
   * (Oct 20): "We're not going to call it a 15-minute walkthrough. We'll just call it a quick demo
   * because it'll probably be 45 minutes." With it empty every page says "a quick demo" and no ⚑.
   */
  callLength: "",
  callLengthConfirmed: false,

  /**
   * Where the trial form posts its lead, once per step ("start" after step 1, "complete" after
   * step 2). Sent as a plain form post (application/x-www-form-urlencoded, no CORS preflight,
   * survives the jump to /book), which Zapier, Make, GoHighLevel and Google Apps Script all read.
   * Empty: the lead is only carried to the booking page.
   */
  leadWebhook: "",

  /**
   * The site's own lead endpoint (api/lead.ts): the finished form becomes a lead in Andrew's Close.com
   * with the Facebook ad it came from, plus a Slack message and a phone alert (Andrew, by text, Oct 21).
   * Each part switches on with its key in the Vercel environment; none set, nothing is sent. Test
   * leads (example.com emails, 555 numbers) are never sent. Empty: the page doesn't call it.
   */
  leadApi: "/api/lead",

  /**
   * Andrew's tracking (his doc, Oct 20; James: "ill install that"): the Meta Pixel, Mouseflow
   * (session recordings) and Crisp (the chat bubble). They load only on the real site, never on a
   * preview or test host (src/lib/track.ts liveSite: *.vercel.app, localhost), so test visits
   * don't reach his ad account, his recordings or his chat inbox. Except Mouseflow, which also
   * records on smartcrew-preview.vercel.app so Andrew can check it works (James, Oct 20). GA4 (G-FED5LLVE5W on
   * smartcrewhq.com) stays off until he asks for it.
   */
  metaPixelId: "1259016858853739",
  gaId: "",
  mouseflowId: "3e607048-41d2-4af9-8a55-56539e51f4a5",
  crispId: "be6cf10b-a0a0-4c80-8b30-bf4c90d4f2fd",

  /**
   * Microsoft Clarity project ID (free heatmaps, scroll maps and session recordings: where people
   * click, how far they scroll, where they stall). Empty on previews like the IDs above, so test
   * visits don't fill the heatmaps. The sign-up popup and /book are masked, so names, emails and
   * phone numbers never leave the browser.
   */
  clarityId: "",

  /**
   * Andrew's videos, as they are today (Vidalytics account 5_H1Y3QY): the 85-second explainer
   * from the smartcrewhq.com home page, and the screen-share walkthrough from smartcrewhq.com/demo,
   * which stands in on the booking page until Andrew records the free-trial video.
   */
  vidalytics: { account: "5_H1Y3QY", explainer: "0IR575Ertss_OqdW", walkthrough: "Lz1Z_A8eimAA04gJ" },

  /**
   * Andrew's business mobile in E.164 ("+15155550123"), for "Save Andrew's number" after booking.
   * ⚑ Empty until he picks the number he calls and texts from; the contact card then carries only
   * his email.
   */
  andrewPhone: "",

  /**
   * The price, once Andrew sets it ("no price anywhere" was the top objection in every test; click-science
   * playbook §8b.2). null: no price anywhere (today). Either one starting figure (`from: "$X"`), a figure
   * per crew-size band using the popup's bands (`bands: { "6–12": "$X", … }`), or both, plus what they're
   * per (`per: "a month"`). Shows in the bold look only (src/lib/offer.ts). Never put a number here that
   * Andrew hasn't set.
   */
  pricing: null as null | { from?: string; bands?: Record<string, string>; per?: string },

  /**
   * Trial before the call (playbook §8b.1). false: the free trial is set up on the call (today). true:
   * the popup starts the trial and the call becomes optional setup help ("load your jobs and trucks"),
   * in the bold look only. trialStartUrl is where "Open SmartCrew" goes once the trial is on (the app's
   * own sign-up or first-login page); empty, /book says Andrew's team sends the login. Decided Oct 19:
   * stays false. Andrew (by text): no free trial up front, it pushes cash collection back a week and
   * the experience is poor until their project data is in; every button says "Try SmartCrew".
   */
  trialFirst: false,
  trialStartUrl: "",

  /** Katie's photo next to her quote under the hero's button (bold and classic; a file in public/). ⚑ Empty until she OKs it. */
  katiePhoto: "",

  /** The ConExpo logo over classic's headline ("Featured by", Andrew's round 2; a file in public/): the
   *  CONEXPO-CON/AGG colour logo from conexpoconagg.com, via James's asset zip (Oct 20). Empty shows the word.
   *  Off: Andrew's comment-mode note, Oct 20: "i think we just keep the name here. logo is nice. but its
   *  also distracting to the eye." The file stays at logos/conexpo.webp. */
  conexpoLogo: "",

  privacyUrl: "https://smartcrewhq.com/privacy-policy",
  termsUrl: "https://smartcrewhq.com/terms-of-service",

  loginUrl: "https://smart-crew-app.web.app/",
  email: "support@smartcrewhq.com",
};

/** "a 15-minute call" when the length is set, "a quick demo" otherwise (Andrew's word, Oct 20). */
export const aCall = () => (config.callLength ? `a ${config.callLength} call` : "a quick demo");
