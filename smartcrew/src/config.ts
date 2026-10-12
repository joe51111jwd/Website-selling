// Everything the page needs to know about the outside world, in one place.
// Fill these in before launch; empty values switch the matching feature off safely.

export const config = {
  /** Cal.com event the "Book a call" page embeds, as "<user>/<event>" (the one smartcrewhq.com/demo uses). */
  calLink: "andrew-drish/15min",

  /**
   * Where the trial form posts its lead (JSON). Any webhook works: Zapier, Make, GoHighLevel,
   * HubSpot, a Google Apps Script. Empty: the lead is only carried to the booking page.
   */
  leadWebhook: "",

  /**
   * Meta Pixel and Google Analytics IDs. smartcrewhq.com uses pixel 1259016858853739 and
   * GA4 G-FED5LLVE5W; they stay empty on previews so test clicks don't reach the ad account.
   */
  metaPixelId: "",
  gaId: "",

  /**
   * Andrew's videos, as they are today (Vidalytics account 5_H1Y3QY): the 85-second explainer
   * from the smartcrewhq.com home page, and the screen-share walkthrough from smartcrewhq.com/demo,
   * which stands in on the booking page until the Founding Member video is recorded.
   */
  vidalytics: { account: "5_H1Y3QY", explainer: "0IR575Ertss_OqdW", walkthrough: "Lz1Z_A8eimAA04gJ" },

  loginUrl: "https://smart-crew-app.web.app/",
  email: "hello@smartcrewhq.com",
};

