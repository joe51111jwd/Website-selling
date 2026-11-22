// Privacy and terms for v3. DRAFTS until Peter has them read (spec A.13).
// The existing passages on the library, watches and analytics stay as they are in the
// live src/data/legal.ts; merge them back in under "The public library" when porting.

export const legalDated = "November 2026";
export type LegalSection = { title: string; body: string[]; list?: string[] };

export const privacy: LegalSection[] = [
  {
    title: "What we collect when you sign up",
    body: ["Your name, your email, your answers to the sign-up questions, the AI agent you use, your country and your time zone."],
  },
  {
    title: "Your card",
    body: ["Your card is collected and held by Stripe. Roger never sees or stores the card number."],
  },
  {
    title: "What Zack does",
    body: [
      "Zack is an AI agent that runs inside your own AI agent account. He reads only that account's activity from the past seven days. He replaces names, clients, addresses, amounts and other private details with placeholders, and sends his report to Roger each week because you agreed to that when you signed up.",
      "You can read the exact instructions your Zack runs, change what he collects, and turn sharing off, all in your dashboard.",
    ],
  },
  {
    title: "What happens to a report",
    body: [
      "Each report is checked again for private details, stored, and processed by Cora, an AI system, through a model provider.",
      "[To confirm before launch: the model provider's name and its position on training on this data.]",
    ],
  },
  {
    title: "What other users see",
    body: ["Anonymous plays only. Never who a play came from. A play is described as run by a number of users, never as yours."],
  },
  {
    title: "How long we keep it",
    body: [
      "Reports are kept while you subscribe and for 90 days after. You can delete any report from your dashboard. Plays already shared stay in the pool without anything that identifies you.",
    ],
  },
  {
    title: "Who holds the data",
    body: ["These services hold or process data for Roger. Some of them store data outside Canada."],
    list: ["Vercel (hosting)", "Neon (database)", "Resend (email)", "Stripe (payments)", "Google (sign-in and Meet)", "The model provider that runs Cora"],
  },
  {
    title: "The public library",
    body: ["The existing passages on the library, watches and analytics stay as they are on the current site."],
  },
  {
    title: "Asking what we hold",
    body: [
      "Email hello@meetroger.ai to ask what we hold about you, to correct it, or to have it deleted. We will answer within 30 days.",
    ],
  },
];

export const terms: LegalSection[] = [
  {
    title: "The trial",
    body: [
      "Your first two delivered Monday lists are free. We ask for a card when you start. On monthly, the card is charged with your third list. On one at a time, it is charged only when you order a list.",
      "If no first list has been delivered within 21 days of sign-up, the trial closes without a charge.",
    ],
  },
  {
    title: "Prices",
    body: [
      "Monthly is US$200 a month, or CA$280 a month in Canada. One list at a time is US$100 a list, or CA$140 a list in Canada. A one-at-a-time list is ordered by you and is never charged automatically.",
    ],
  },
  {
    title: "Contributing",
    body: [
      "Roger works because everyone's Zack contributes. On monthly, the first week Zack misses in a billing month is forgiven. A second miss makes that month US$400 (CA$560). A miss caused by Roger never counts. We email you both times, and the difference appears on your next invoice.",
      "If you switch sharing off in your dashboard, the monthly price is US$400 (CA$560). One-at-a-time lists need that week's Zack report.",
    ],
  },
  {
    title: "Refunds and cancelling",
    body: ["There are no refunds. You can cancel at any time in one click, and your access continues to the end of the month you have paid for."],
  },
  {
    title: "Tax",
    body: ["Prices are shown before tax. HST or other tax is added where it applies."],
  },
  {
    title: "Your plays",
    body: [
      "Plays are shared so that other users can use them. You keep the right to your own work, and you grant Roger the right to share the anonymised play with other users.",
    ],
  },
  {
    title: "No promise of a result",
    body: ["The ideas are other people's working methods, offered as they are. Roger does not promise any result from using them."],
  },
];
