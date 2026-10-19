// Everything the page needs to know about the outside world, in one place.
// Fill these in before launch; empty values switch the matching feature off safely.

export const config = {
  /** Cal.com event the "Book a call" page embeds, as "<user>/<event>" (the one smartcrewhq.com/demo uses). */
  calLink: "andrew-drish/15min",

  /**
   * How long the call is, as every page says it ("a 30-minute call"). The brief and the hero say 30
   * minutes; ⚑ Andrew's Cal.com link (/15min) opens a 45-minute "SmartCrew Demo" today, so the copy
   * carries a flag until he sets the event to match and flips callLengthConfirmed. Empty string:
   * the copy says "a short call".
   */
  callLength: "30-minute",
  callLengthConfirmed: false,

  /**
   * Where the trial form posts its lead, once per step ("start" after step 1, "complete" after
   * step 2). Sent as a plain form post (application/x-www-form-urlencoded, no CORS preflight,
   * survives the jump to /book), which Zapier, Make, GoHighLevel and Google Apps Script all read.
   * Empty: the lead is only carried to the booking page.
   */
  leadWebhook: "",

  /**
   * Meta Pixel and Google Analytics IDs. smartcrewhq.com uses pixel 1259016858853739 and
   * GA4 G-FED5LLVE5W; they stay empty on previews so test clicks don't reach the ad account.
   */
  metaPixelId: "",
  gaId: "",

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
   * own sign-up or first-login page); empty, /book says Andrew's team sends the login. ⚑ Both need
   * Andrew: whether a trial can start without the call, how the account gets made, and how fast.
   */
  trialFirst: false,
  trialStartUrl: "",

  /** Katie's photo next to her quote under the hero's button (bold and classic; a file in public/). ⚑ Empty until she OKs it. */
  katiePhoto: "",

  /** The ConExpo logo over classic's headline ("Featured by", Andrew's round 2; a file in public/). ⚑ Empty until
   *  Andrew sends the file: the word "ConExpo" stands in for it. */
  conexpoLogo: "",

  privacyUrl: "https://smartcrewhq.com/privacy-policy",
  termsUrl: "https://smartcrewhq.com/terms-of-service",

  loginUrl: "https://smart-crew-app.web.app/",
  email: "hello@smartcrewhq.com",
};

/** "a 30-minute call" when the length is set, "a short call" until then. */
export const aCall = () => (config.callLength ? `a ${config.callLength} call` : "a short call");
