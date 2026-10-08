// Conversion copy: A-300 FOR TEAMS, A-301 FOR SPONSORS, A-900 GENERAL NOTES, the mailto templates and
// the copy-address states (brief 3.10, 3.11, 3.12, 3.13). Owner: A6.
// Exact brief copy. Typographic apostrophes and dashes in the UI; plain ASCII (" - ", "'") in the
// mailto subjects and bodies (brief 5.2). The address itself is CONTACT_EMAIL (src/content/config.ts),
// never typed here (rule 15).

// ------------------------------------------------------------------------------------------ shared

/** The two lines every conversion block shares (brief 3.10, 3.11, 3.13; G17). */
export const SEND = {
  finePrint:
    'Opens your email app with this filled in. Nothing you type is stored or sent by this page. Ticking a box only adds it to the email.',
  afterClick: 'Nothing opened? Copy the address below and email us from your mail app.',
  /** Followed by the CONTACT_EMAIL link */
  orEmail: 'Or email',
} as const;

/** Copy-address button states (brief 3.10, 3.13) */
export const COPY = {
  idle: 'Copy address',
  copied: 'Copied',
  /** aria-live text (brief 3.1, 3.13) */
  announce: 'Address copied.',
  denied: 'Press Ctrl+C or ⌘C to copy',
} as const;

// ------------------------------------------------------------------------------------------ A-300

export const TEAMS = {
  diptychLeft: '07 ISN’T REAL.',
  diptychRight: 'YOURS IS.',
  standIn:
    '07 is a stand-in we designed for these films: no team, no maker, no platform. The Games are for real robots.',
  /** Stencil slot default and the bay number slot (we never assign numbers) */
  slotDefault: 'YOUR ROBOT',
  bayNumber: '—',
  /** Legend word over the bay number slot (F-096) */
  bayLabel: 'BAY',
  /** Painted on the bay floor under the slot: READY FOR — until a box is ticked, then only the ticked numbers (F-098) */
  readyFor: 'READY FOR',
  readyNone: '—',
  h2: 'BRING THE ROBOT. PROVE THE WORK.',
  lead: 'For humanoid robot developers, research labs, and university teams.',
  body: 'Put your platform to work in front of the construction industry. Tell us three things: your platform, which of the five you’re ready for, and what you’d need to take part.',
  formHeader: 'RFI-001',
  fields: {
    team: { label: 'FROM (TEAM OR LAB)', placeholder: 'Your team or lab' },
    platform: { label: '1 · PLATFORM', placeholder: 'Which robot, and what it does today' },
    challenges: {
      label: '2 · CHALLENGES YOU’RE READY FOR',
      helper:
        'Tell us which challenges suit your platform. We’ll start from the work your robot is ready to attempt.',
    },
    needs: { label: '3 · WHAT YOU’D NEED TO TAKE PART', placeholder: 'Equipment, materials, support, questions' },
  },
  button: 'Discuss competing →',
} as const;

/** Control target T7 (brief 3.10 part 3, G4) */
export const T7 = {
  label: 'CONTROL TARGET T7',
  h3: 'A wall a camera can read.',
  body: 'This target is 128 bricks in stack bond, two stacked in each square cell. To you it’s brickwork. To a camera it’s an AprilTag: family tag36h11, ID 7, the number on our concept robot’s chest. Print it. Use it in your own tests.',
  note: 'A gift for developers, not a rule of the Games.',
  letter: 'Download T7 (US Letter PDF)',
  a4: 'Download T7 (A4 PDF)',
  svg: 'Download T7 (SVG)',
  /**
   * Proof caption (brief 3.10), split over the three proof columns with no new words (F-097):
   * proofHead, then one label per render (FLAT · WARPED + BLURRED · `{measured}`), then proofTail.
   * `{measured}` is the exact `smallestLabel` string from t7-proof.json (e.g. "26 PX WIDE"), else
   * `{px}` + proofUnit. The row is shown only when the pipeline has really measured it.
   */
  proofHead: 'DETECTED IN OUR TESTS ON DIGITAL RENDERS, NOT PRINTS:',
  proofRenders: ['FLAT', 'WARPED + BLURRED'],
  proofUnit: ' PX WIDE',
  proofTail: 'DETECTOR: OPEN-SOURCE APRILTAG LIBRARY.',
  alt: 'Control target T7: a square panel of dark and light bricks in stack bond, two bricks to each cell, that forms AprilTag tag36h11, ID 7.',
  proofAlt:
    'Our digital test renders of the target, flat, warped and blurred, and small, each outlined where the detector found the tag.',
} as const;

/** Teams mailto (brief 3.10; exact; ASCII only). Values are filled by src/lib/mailto.ts. */
export const TEAMS_MAIL = {
  subject: (team: string) => `HRCG 2027 (planned) - Discuss competing - ${team}`,
  teamDefault: 'our team',
  intro: 'We\'d like to discuss competing in the Humanoid Robot Construction Games, planned for New York City in 2027.',
  from: 'From: ',
  platform: '1. Platform: ',
  challenges: '2. Challenges we\'re ready for: ',
  needs: '3. What we\'d need to take part: ',
} as const;

// ------------------------------------------------------------------------------------------ A-301

export interface Keynote {
  n: 1 | 2 | 3;
  title: string;
  text: string;
}

export const SPONSORS = {
  h2: 'PUT YOUR PRODUCT IN A ROBOT’S HANDS.',
  body: 'Support the inaugural Games and connect your company with robotics teams and the people who specify and buy construction products.',
  keynotesTitle: 'KEYNOTES',
  keynotes: [
    { n: 1, title: 'SUPPORT A CHALLENGE', text: 'Contribute materials, tools, fixtures, or practical expertise.' },
    {
      n: 2,
      title: 'SHOW WHAT YOU MAKE',
      text: 'Get in front of the people who specify and buy. Ask us about demonstrations and visibility.',
    },
    {
      n: 3,
      title: 'MEET THE TALENT',
      // H-4 (director, FIXLIST-1 §8): "Meet … Meet" repetition removed; "Connect with" is the
      // client's own verb for this keynote (audit §1), same meaning (rule 24).
      text: 'Connect with the engineers making robots useful on site, through recruiting and technical conversations with developers and research teams.',
    },
  ] as readonly Keynote[],
  /** Five 1:1 material crops (N07), left to right, with the keynotes printed beside each (brief 3.11) */
  materials: [
    { label: 'MAT 01 · BRICK AND MORTAR', keynotes: [1] },
    { label: 'MAT 02 · BOARD AND FIXINGS', keynotes: [1, 2] },
    { label: 'MAT 03 · BOLTS AND NUTS', keynotes: [1, 2] },
    { label: 'MAT 04 · PIPE AND FITTINGS', keynotes: [1] },
    { label: 'MAT 05 · LINE AND MARKING', keynotes: [1, 2] },
  ] as ReadonlyArray<{ label: string; keynotes: ReadonlyArray<1 | 2 | 3> }>,
  composerTitle: 'KIT COMPOSER',
  fields: {
    company: { label: 'COMPANY', placeholder: 'Your company' },
    make: { label: 'WHAT YOU MAKE', placeholder: 'Products, tools or services' },
    bring: { label: 'WHAT COULD YOU BRING?' },
    challenge: { label: 'WHICH CHALLENGE?' },
    also: { label: 'ALSO INTERESTED IN' },
  },
  /** Chip text (UI) and its form in the email (sentence case, ASCII) */
  bring: [
    { key: 'materials', chip: 'MATERIALS', mail: 'Materials' },
    { key: 'tools', chip: 'TOOLS', mail: 'Tools' },
    { key: 'fixtures', chip: 'FIXTURES', mail: 'Fixtures' },
    { key: 'expertise', chip: 'EXPERTISE', mail: 'Expertise' },
  ],
  also: [
    { key: 'demos', chip: 'DEMONSTRATIONS AND VISIBILITY', mail: 'Demonstrations and visibility' },
    { key: 'talent', chip: 'RECRUITING AND TECHNICAL CONVERSATIONS', mail: 'Recruiting and technical conversations' },
  ],
  button: 'Discuss sponsorship →',
} as const;

/** Sponsors mailto (brief 3.11; exact; ASCII only). */
export const SPONSORS_MAIL = {
  subject: (company: string) => `HRCG 2027 (planned) - Discuss sponsorship - ${company}`,
  companyDefault: 'our company',
  intro: 'We\'d like to discuss supporting the Humanoid Robot Construction Games, planned for New York City in 2027.',
  company: 'Company: ',
  make: 'What we make: ',
  bring: 'We could bring: ',
  challenges: 'Challenge(s) of interest: ',
  also: 'Also interested in: ',
} as const;

/** Shared mailto words (ASCII) */
export const MAIL = {
  hello: 'Hello,',
  empty: '-',
  notSure: 'Not sure yet',
  /** A-900 email link subject (brief 3.12) */
  plainSubject: 'HRCG 2027 (planned)',
} as const;

// ------------------------------------------------------------------------------------------ A-900

export interface Note {
  q: string;
  a: string;
}

export const NOTES = {
  h2: 'General notes.',
  notes: [
    {
      q: 'When and where are the Games?',
      a: 'Planned for New York City in 2027. Date and venue will be announced on this site.',
    },
    {
      q: 'Who is the competition for?',
      a: 'Humanoid robot developers, research labs, and university teams interested in demonstrating construction capabilities.',
    },
    {
      q: 'Does a team need to enter all five challenges?',
      a: 'Tell us which challenges suit your platform. We’ll start from the work your robot is ready to attempt.',
    },
    {
      q: 'How can my company get involved?',
      a: 'Explore challenge support, product demonstrations, recruiting, and visibility with construction buyers. Get in touch to discuss the right fit.',
    },
    {
      q: 'Are the images and films real?',
      a: 'No. Every photo-style image and film of robots, bays and materials on this site is AI-generated concept imagery. The Games haven’t happened yet.',
    },
    {
      q: 'Who is robot 07?',
      a: 'A concept robot designed for these films. We didn’t model it on any real robot or company, and it isn’t a competitor.',
    },
  ] as readonly Note[],
  imageryTitle: 'IMAGERY NOTES',
  imagery: [
    {
      k: 'FOOTAGE',
      v: 'Concept films and stills of robots, bays and materials, AI-generated. Robot 07 is an original concept design.',
    },
    {
      k: 'DEPTH VIEWS',
      v: '3D VIEW 05-A and SECTION A–A are estimated from single frames of the concept films by a monocular depth model. Relative, no units. A drawing of the footage, not robot perception data. They do not describe how the Games will be judged.',
    },
    {
      k: 'KNOWN LIMITATIONS',
      v: 'One camera sees one side of everything. Dust and haze confuse the estimate. Where the view looks behind an object, the hidden area is filled with a darkened blur of its surroundings.',
    },
    {
      k: 'CONTROL TARGET T7',
      v: 'AprilTag family tag36h11, ID 7, laid as 128 bricks in stack bond, two to each cell so the tag is square. A test target for developers, not a rule of the Games. Detection was tested on digital renders, not prints.',
    },
    { k: 'SCALE', v: 'Nothing on this site is drawn to scale.' },
  ] as ReadonlyArray<{ k: string; v: string }>,
  rollCallLabel: 'Roll-call',
  closing: 'Tell us what your robot can do, or what you could bring.',
  /**
   * Footer title block (brief 3.12), one row per line as LABEL|Value. It is one string on purpose:
   * the block renders as one ruled table (one lint group), so YEAR 2027 always sits beside STATUS
   * Planned (rule 3). CHALLENGES, CONTACT and INDEX values are filled by the component (from
   * CHALLENGES, CONTACT_EMAIL and <InPageIndex/>).
   */
  block: `PROJECT|Humanoid Robot Construction Games
LOCATION|New York City
STATUS|Planned
YEAR|2027
DATE|Hold. To be announced on this site.
VENUE|Hold. To be announced on this site.
CHALLENGES|
IMAGERY|Imagery and film are concept visualizations, AI-generated.
SCALE|NTS
SHEET|A-900 · End of set
CONTACT|
INDEX|`,
  /** Challenge list separator in the CHALLENGES cell */
  challengeSep: ' · ',
} as const;
