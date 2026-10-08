// Chrome copy: sheet header, title strip, phone bar, INDEX, states, 404, SEO (brief 3.1, 3.13, 8.8).
// Owner: A1. Exact brief copy; typographic apostrophes and dashes in the UI (brief 5.2).

export const SKIP_LINK = 'Skip to content';

export const HEADER = {
  name: 'HRCG',
  line1: 'HUMANOID ROBOT',
  line2: 'CONSTRUCTION GAMES',
  homeLabel: 'Humanoid Robot Construction Games, back to the cover',
  index: 'INDEX',
  indexLabel: 'Open the drawing index',
} as const;

export const STRIP = {
  navLabel: 'Title block',
  markLabel: 'Humanoid Robot Construction Games, back to the cover',
  projectLabel: 'PROJECT',
  projectValue: 'Humanoid Robot Construction Games',
  statusLabel: 'STATUS · PLACE · YEAR',
  statusValue: 'PLANNED · NEW YORK CITY · 2027',
  statusShort: 'PLANNED · NYC · 2027',
  holdLabel: 'DATE · VENUE',
  holdValue: 'HOLD',
  holdSr: 'Date to be announced on this site. Venue to be announced on this site.',
  imageryLabel: 'IMAGERY',
  imageryValue: 'CONCEPT · AI-GENERATED',
  imageryShort: 'CONCEPT',
  sheetLabel: 'SHEET',
  motionLabel: 'MOTION',
  motionOn: 'ON',
  motionOff: 'OFF',
  motionButtonLabel: 'Motion',
  teamsLabel: 'ROBOT TEAMS',
  teamsValue: 'Bring the robot →',
  sponsorsLabel: 'CONSTRUCTION COMPANIES',
  sponsorsValue: 'Bring your product →',
  teamsShort: 'Teams →',
  sponsorsShort: 'Sponsors →',
} as const;

export const PHONE_BAR = {
  /** Left button; the sheet number is appended: 'PLANNED · NYC · 2027 · A-103' */
  statusPrefix: 'PLANNED · NYC · 2027',
  sheetTitle: 'TITLE BLOCK · HRCG-2027 · PLANNED',
  close: 'CLOSE',
} as const;

export const INDEX = {
  title: 'DRAWING INDEX · HRCG-2027 · PLANNED · 11 SHEETS · NTS',
  dialogLabel: 'Drawing index, HRCG-2027, planned',
  watchTheSet:
    '▶ WATCH THE SET (0:30) · CONCEPT FILM: AI-GENERATED CONCEPT FOOTAGE',
  close: 'CLOSE (ESC)',
  inPageLabel: 'Drawing index',
} as const;

export const THE_SET = {
  dialogLabel: 'The Set, a 30-second concept film',
  posterAlt:
    'Concept film poster: robot 07 behind blue chalk dust under the headline What can a humanoid actually build? AI-generated concept footage.',
  close: 'CLOSE (ESC)',
} as const;

/** Media states (brief 3.13) */
export const MEDIA_STATES = {
  filmUnavailable: 'FILM UNAVAILABLE · POSTER SHOWN',
  play: '▶ PLAY',
  /** aria-label: 'Play: {the video’s aria-label}' */
  playLabelPrefix: 'Play: ',
} as const;

export const NOT_FOUND = {
  tag: 'A-404 · SHEET NOT FOUND',
  h1: 'This sheet isn’t in the set.',
  back: 'Back to the cover →',
} as const;

export const SEO = {
  title: 'Humanoid Robot Construction Games | Planned for NYC 2027',
  description:
    'An inaugural humanoid robot construction competition planned for New York City in 2027. Five construction challenges bringing robotics teams and the building industry together.',
  ogDescription:
    'An inaugural humanoid robot construction competition. Planned for NYC, 2027. Five challenges. Real construction.',
  ogImageAlt:
    'Concept image: robot 07 behind blue chalk dust, with the headline What can a humanoid actually build? Planned for New York City, 2027. AI-generated concept; this hasn’t happened yet.',
  siteName: 'Humanoid Robot Construction Games',
} as const;
