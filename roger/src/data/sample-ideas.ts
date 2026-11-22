// The sample Monday list for the public site.
//
// Source: the anonymized Cora sample (three ideas a real user was sent) and the Monday
// Morning Playbooks prototype. Names, the brokerage, phone and email are removed.
// Ideas 1 and 3 use the prototype's own scores, tiles, playbook and time working.
// Idea 2 has no prototype play behind it: its playbook and five scores are PLACEHOLDERS
// written for this design, and its time figure is the one in the anonymized note.
// On the live site this data is replaced by the play chosen in the admin (spec A.4).

export type Factor = "hours" | "reach" | "ease" | "proof" | "surprise";

export const factorLabels: Record<Factor, string> = {
  hours: "Hours saved",
  reach: "Reach",
  ease: "Ease to copy",
  proof: "Proof",
  surprise: "Surprise",
};

export type PlaybookPart = {
  label: "Play" | "Trigger" | "Setup first" | "Steps" | "Guardrails" | "Output" | "Pitfalls seen" | "Done when";
  note: string; // the one-line margin note used on /how-it-works
  text?: string;
  items?: string[];
  ordered?: boolean;
};

export type Idea = {
  id: string;
  title: string;
  category: string;
  score: number;
  fit: string;
  timeLine: string;
  desc: string;
  tiles: { value: string; unit: string; label: string; note: string }[];
  factors: Record<Factor, number>; // each out of 10
  paste: string;
  playbook: PlaybookPart[];
  math: { head: string; lines: string[] }[];
};

export const sampleWeek = "Monday, 7:00 AM";

export const sampleIdeas: Idea[] = [
  {
    id: "evening-prep-briefs",
    title: "Evening prep briefs for tomorrow's appointments",
    category: "Client meetings",
    score: 77,
    fit: "Your week shows showings and listing appointments you prepared for by hand.",
    timeLine: "About 2.6 hours a week for people who run it",
    desc: "The night before a showing, evaluation or listing appointment, your AI agent builds a one-page brief from the email thread, the listing details, 3 to 5 nearby sold homes, calendar conflicts and questions to ask. Any client email is left in Drafts for you to review.",
    tiles: [
      { value: "2.6", unit: "hours a week", label: "Time saved", note: "Range 1.7 to 3.4. Counted from history." },
      { value: "42", unit: "minutes", label: "Saved each time", note: "Per appointment" },
      { value: "10.4", unit: "hours a week", label: "Heavy-user best guess", note: "Several client meetings a day" },
      { value: "1", unit: "user", label: "Run by", note: "Never named" },
    ],
    factors: { hours: 6, reach: 8, ease: 7, proof: 8, surprise: 10 },
    paste:
      "Save this play as a skill called Prep brief before an appointment, using its Setup, Steps, Guardrails and Output sections exactly, and create a routine that runs it every day at 6:00 PM for tomorrow's appointments.",
    playbook: [
      {
        label: "Play",
        note: "What it does, in one line.",
        text: "Prep brief before an appointment. Produces a short brief the evening before each appointment with someone outside the business, plus a morning reminder.",
      },
      {
        label: "Trigger",
        note: "When it runs.",
        text: "A routine every evening at 6:00 PM that looks at tomorrow's calendar, and a morning reminder 30 to 60 minutes before each qualifying appointment.",
      },
      {
        label: "Setup first",
        note: "What your AI agent asks you before it installs.",
        items: [
          "Which meetings count (outside guests only; skip internal, personal and recurring)?",
          "What is your business, and what are you selling or looking for, so the brief can say what the other side likely wants?",
          "How much detail: 5 bullets or a page?",
          "Connect your calendar and email.",
        ],
      },
      {
        label: "Steps",
        note: "The work, in order.",
        ordered: true,
        items: [
          "List tomorrow's one-time meetings with outside guests.",
          "For each, find the intro email or booking thread in the inbox and read it.",
          "Search the web for the person, their role and their companies. Confirm it is the same person.",
          "Write the brief: who they are, why the meeting was booked, 2 to 3 questions to ask, and one thing to decide before the meeting.",
          "Check the rest of tomorrow's calendar and note any conflict or tight gap.",
          "In the morning, send one short reminder with the time and only what is new since the brief. Skip it if nothing is new.",
        ],
      },
      {
        label: "Guardrails",
        note: "What it must never do.",
        items: [
          "Never email or message the guest.",
          "Never accept, decline or move the meeting.",
          "Keep the brief private to you.",
          "If a person cannot be confirmed, say so instead of guessing.",
        ],
      },
      {
        label: "Output",
        note: "What you receive.",
        text: "One brief per meeting: 5 to 7 bullets, including \"Ask:\" lines and a \"Decide before the meeting\" line. Then a 2 to 3 line morning reminder.",
      },
      {
        label: "Pitfalls seen",
        note: "What went wrong for the people who ran it, and the fix.",
        items: [
          "The brief arrived in four pieces, and one note only repeated what was already known. Fix: do all research before sending the evening brief, and send the morning reminder only with new items.",
        ],
      },
      {
        label: "Done when",
        note: "How you know it worked.",
        text: "Every qualifying appointment on tomorrow's calendar has one brief by the evening before, and you walk in knowing the person, their likely ask and the one question to settle.",
      },
    ],
    math: [
      {
        head: "Doing this by hand",
        lines: [
          "Searching the web for the person and their two companies: 3 searches × 5 minutes = 15 minutes",
          "Opening and checking their profile, both company sites, the intro email and the calendar invite: 5 items × 1.5 minutes = 7.5 minutes",
          "Searching the inbox for the intro and any newer emails: 1 search × 5 minutes = 5 minutes",
          "Comparing the meeting with the rest of the day's calendar: 1 comparison × 3 minutes = 3 minutes",
          "Writing the prep brief: 1 brief × 15 minutes = 15 minutes",
          "Total by hand: 45.5 minutes",
        ],
      },
      {
        head: "Using the AI agent",
        lines: ["Reading the evening brief, two add-on notes and the morning reminder: 4 notes × 1 minute = 4 minutes"],
      },
      {
        head: "Time saved",
        lines: [
          "45.5 minutes by hand, less 4 minutes with the AI agent: about 42 minutes saved",
          "Range, if the job took 30% less or 30% more by hand: 28 to 55 minutes saved",
        ],
      },
    ],
  },
  {
    id: "whos-waiting-on-me",
    title: "A \"Who's waiting on me?\" list every morning",
    category: "Email and calendar",
    score: 71,
    fit: "Your week shows replies that sat in Drafts for more than a day.",
    timeLine: "About 38 minutes saved each time for the person who runs it",
    desc: "Each weekday your AI agent reads your email, drafts, calendar and follow-up tracker, then lists who is waiting on you (and whether a reply is already sitting in Drafts), who you are waiting on, and today's appointments. It changes nothing and sends nothing.",
    tiles: [
      { value: "3.2", unit: "hours a week", label: "Time saved", note: "Five sweeps a week. Estimated." },
      { value: "38", unit: "minutes", label: "Saved each time", note: "Per morning sweep" },
      { value: "3.2", unit: "hours a week", label: "Heavy-user best guess", note: "A full inbox every weekday" },
      { value: "1", unit: "user", label: "Run by", note: "Never named" },
    ],
    factors: { hours: 6, reach: 9, ease: 8, proof: 5, surprise: 6 },
    paste:
      "Save this play as a skill called Who's waiting on me, using its Setup, Steps, Guardrails and Output sections exactly, and add it to my weekday morning routine. Read only. Send nothing.",
    playbook: [
      {
        label: "Play",
        note: "What it does, in one line.",
        text: "A \"Who's waiting on me?\" list. Each weekday morning you get one short list of the people waiting on you, the people you are waiting on, and today's appointments.",
      },
      {
        label: "Trigger",
        note: "When it runs.",
        text: "Part of your weekday morning routine. Also on request: \"who's waiting on me?\"",
      },
      {
        label: "Setup first",
        note: "What your AI agent asks you before it installs.",
        items: [
          "Connect email and calendar. Where is your follow-up tracker, if you keep one?",
          "How many days back should it look?",
          "Whose messages never count (newsletters, notifications, internal lists)?",
        ],
      },
      {
        label: "Steps",
        note: "The work, in order.",
        ordered: true,
        items: [
          "Read the inbox for threads where the last message is from someone else and needs a reply.",
          "Check Drafts and mark any thread that already has a reply waiting to be sent.",
          "Read Sent for threads where you asked for something and have not heard back.",
          "Read today's calendar and the follow-up tracker.",
          "Write one list in three parts: waiting on you, you are waiting on, today.",
        ],
      },
      {
        label: "Guardrails",
        note: "What it must never do.",
        items: ["Read only. Never send, reply, archive or move anything.", "No client details outside the list it gives you."],
      },
      {
        label: "Output",
        note: "What you receive.",
        text: "One message, three short sections, oldest waiting first, with \"reply is in Drafts\" marked where it applies.",
      },
      {
        label: "Pitfalls seen",
        note: "What went wrong for the people who ran it, and the fix.",
        items: ["Automatic notifications crowded the list. Fix: name the senders that never count during setup."],
      },
      {
        label: "Done when",
        note: "How you know it worked.",
        text: "Before your first appointment you know who needs an answer from you today, without opening your inbox.",
      },
    ],
    math: [
      {
        head: "How this was worked out",
        lines: [
          "One user's report put the time saved at about 38 minutes per sweep.",
          "38 minutes × 5 weekday sweeps = about 3.2 hours a week. This is an estimate, not a count.",
        ],
      },
    ],
  },
  {
    id: "local-news-scout",
    title: "Weekday local news scout with ready post drafts",
    category: "Marketing",
    score: 62,
    fit: "Your week shows you writing local market posts yourself.",
    timeLine: "About 5.5 hours a week for people who run it",
    desc: "Every weekday morning your AI agent scans your local market and nearby regional news, picks the 2 or 3 best stories, writes a post for each in your voice using your style guide, and queues them as drafts. Nothing posts until you approve it.",
    tiles: [
      { value: "5.5", unit: "hours a week", label: "Time saved", note: "Range 0.8 to 10.2. Counted from history." },
      { value: "66", unit: "minutes", label: "Saved each time", note: "Per morning run" },
      { value: "7.75", unit: "hours a week", label: "Heavy-user best guess", note: "Someone who posts every day" },
      { value: "3", unit: "users", label: "Run by", note: "Never named" },
    ],
    factors: { hours: 7, reach: 8, ease: 4, proof: 10, surprise: 1 },
    paste:
      "Save this as a skill called 'Weekday news scout', following the Play, Trigger, Setup first, Steps, Guardrails, Output, Pitfalls seen and Done when sections exactly. Ask me the Setup first questions once and remember my answers. Then create a routine for weekdays at 7:00 AM [time zone] that runs it and sends me the drafts here, drafts only, nothing posted without my yes.",
    playbook: [
      {
        label: "Play",
        note: "What it does, in one line.",
        text: "Weekday news scout with ready post drafts. Each weekday morning you get 2 or 3 sourced post drafts in your voice about what moved in your market overnight.",
      },
      {
        label: "Trigger",
        note: "When it runs.",
        text: "A schedule: weekdays at 7:00 AM in your time zone. Also on request: \"run the scout again now\".",
      },
      {
        label: "Setup first",
        note: "What your AI agent asks you before it installs.",
        items: [
          "What is your market, in a few topics?",
          "Which news sources and which accounts should it watch?",
          "Paste 3 to 5 of your best posts so it learns your voice. What should it never do?",
          "How many drafts a day, and should it stay silent on quiet days?",
          "Who posts approved drafts?",
        ],
      },
      {
        label: "Steps",
        note: "The work, in order.",
        ordered: true,
        items: [
          "Search the news for your market's stories from the last 24 hours.",
          "Open each candidate's original source and check the facts.",
          "Drop anything you already posted about or that overlaps a recent post.",
          "Pick 2 or 3 by timing and relevance, and say which is the strongest.",
          "Write each in your voice, about 60 to 80 words, ending on a prediction instead of a question.",
          "Under each draft add the source link and one line on why it is moving.",
          "End with one line listing what was seen but skipped.",
        ],
      },
      {
        label: "Guardrails",
        note: "What it must never do.",
        items: [
          "Drafts only. Never post, schedule or reply anywhere without an explicit yes.",
          "No client names or details in any draft.",
          "Every fact needs a source link. If something cannot be verified, leave it out or say so.",
        ],
      },
      {
        label: "Output",
        note: "What you receive.",
        text: "A short lead line (\"Three drafts for today, nothing posted\"), then each draft with its source link and why it is moving, the pick, and a one-line skipped list.",
      },
      {
        label: "Pitfalls seen",
        note: "What went wrong for the people who ran it, and the fix.",
        items: [
          "A trending summary had the wrong date range for a key statistic. Fix: always check the original source.",
          "Drafts came out longer and more explanatory than the user writes. Fix: the short news form, with the user's own post saved as the example.",
          "The daily schedule paused when the plan changed. Fix: check the routine is still running.",
        ],
      },
      {
        label: "Done when",
        note: "How you know it worked.",
        text: "On weekday mornings you have 2 or 3 sourced drafts you could post with light edits, and on quiet days you hear nothing.",
      },
    ],
    math: [
      {
        head: "Doing this by hand",
        lines: [
          "Searching the news for the last day's stories: 3 searches × 5 minutes = 15 minutes",
          "Searching for posts that are taking off: 1 search × 5 minutes = 5 minutes",
          "Opening and verifying candidate stories and their sources: 8 items × 1.5 minutes = 12 minutes",
          "Writing a short post in your voice for each pick: 2.33 posts × 15 minutes = 35 minutes",
          "Total by hand: 67 minutes",
        ],
      },
      { head: "Using the AI agent", lines: ["Reading the morning drafts: 1 read × 1 minute = 1 minute"] },
      {
        head: "Time saved",
        lines: [
          "67 minutes by hand, less 1 minute with the AI agent: about 66 minutes saved, 6 times that week",
          "Range, if the job took 30% less or 30% more by hand: 275 to 517 minutes saved that week",
        ],
      },
    ],
  },
];
