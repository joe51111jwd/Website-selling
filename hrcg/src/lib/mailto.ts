// mailto builder (brief 3.10, 3.11, 3.12, 9.2). Owner: A6.
//
//   buildMailto('teams', { team, platform, challenges: [1, 3], needs })
//   buildMailto('sponsors', { company, make, bring: ['materials'], challenges: [2], also: ['demos'] })
//   buildMailto('plain')                         // the A-900 address link, subject only
//
// RFC 6068:
// - `mailto:` addr-spec `?` hfields joined by `&`; the address is not encoded (it is the RFC 2606
//   placeholder CONTACT_EMAIL and contains only unreserved characters and "@").
// - Header values are percent-encoded UTF-8. encodeURIComponent leaves only unreserved characters and
//   ! * ' ( ) unescaped, which are all `qchar`s, so "&", "=", "#", "?", "%", "+" and spaces are always
//   encoded (spaces as %20, never "+").
// - Line breaks in the body are CRLF, encoded %0D%0A (RFC 6068 section 5). User text is normalised:
//   any CR, LF or CRLF inside a body value becomes CRLF; subject values are folded onto one line.
// - The template text is ASCII only (brief 5.2: " - ", never "·"; straight apostrophes). What a
//   visitor types is kept as typed and travels as UTF-8.
// No network request is ever made: this only builds a string.

import { CONTACT_EMAIL } from '../content/config';
import { CHALLENGES, type ChallengeNo } from '../content/challenges';
import { MAIL, SPONSORS, SPONSORS_MAIL, TEAMS_MAIL } from '../content/copy/conversion';

export type MailKind = 'teams' | 'sponsors' | 'plain';

export interface TeamsFields {
  team?: string;
  platform?: string;
  /** Ticked challenges, 1..5 (any order; the email lists them in the fixed 01..05 order) */
  challenges?: readonly number[];
  needs?: string;
}

export type BringKey = (typeof SPONSORS.bring)[number]['key'];
export type AlsoKey = (typeof SPONSORS.also)[number]['key'];

export interface SponsorsFields {
  company?: string;
  make?: string;
  bring?: readonly string[];
  challenges?: readonly number[];
  also?: readonly string[];
}

export interface MailParts {
  to: string;
  subject: string;
  /** Lines, joined with CRLF in the URL */
  body: string | null;
}

const CRLF = '\r\n';

/** Collapse whitespace runs (incl. line breaks) to single spaces and trim: for subjects and one-line values. */
export function oneLine(v: string | undefined | null): string {
  return (v ?? '').replace(/[\s\u2028\u2029]+/g, ' ').trim();
}

/** Normalise any CR / LF / CRLF (and Unicode line separators) to CRLF; trim the ends. */
export function normaliseLines(v: string | undefined | null): string {
  return (v ?? '')
    .replace(/\r\n|\r|\n|\u2028|\u2029/g, '\n')
    .trim()
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join(CRLF);
}

/** RFC 6068 hfvalue encoding: percent-encoded UTF-8, spaces as %20. */
export function encodeHfvalue(v: string): string {
  return encodeURIComponent(v);
}

/** Challenge names (sentence case) for ticked numbers, in the fixed 01..05 order. */
export function challengeNames(nos: readonly number[] | undefined): string[] {
  if (!nos?.length) return [];
  const set = new Set(nos);
  return CHALLENGES.filter((c) => set.has(c.no)).map((c) => c.name);
}

/** "Materials, tools" from chip keys, in the composer's order; first letter capitalised only. */
function chipList<T extends { key: string; mail: string }>(all: readonly T[], keys: readonly string[] | undefined): string {
  if (!keys?.length) return '';
  const set = new Set(keys);
  const words = all.filter((c) => set.has(c.key)).map((c) => c.mail);
  if (!words.length) return '';
  const joined = words.map((w, i) => (i === 0 ? w : w.charAt(0).toLowerCase() + w.slice(1))).join(', ');
  return joined;
}

function or(v: string, fallback: string): string {
  return v ? v : fallback;
}

/** The decoded subject and body for a kind (exact brief text; used by the builder and the tests). */
export function mailParts(kind: 'teams', fields?: TeamsFields): MailParts;
export function mailParts(kind: 'sponsors', fields?: SponsorsFields): MailParts;
export function mailParts(kind: 'plain', fields?: undefined): MailParts;
export function mailParts(kind: MailKind, fields?: TeamsFields | SponsorsFields): MailParts;
export function mailParts(kind: MailKind, fields: TeamsFields | SponsorsFields = {}): MailParts {
  if (kind === 'teams') {
    const f = fields as TeamsFields;
    const team = oneLine(f.team);
    const lines = [
      MAIL.hello,
      '',
      TEAMS_MAIL.intro,
      '',
      TEAMS_MAIL.from + or(team, MAIL.empty),
      TEAMS_MAIL.platform + or(normaliseLines(f.platform), MAIL.empty),
      TEAMS_MAIL.challenges + or(challengeNames(f.challenges).join(', '), MAIL.notSure),
      TEAMS_MAIL.needs + or(normaliseLines(f.needs), MAIL.empty),
    ];
    return {
      to: CONTACT_EMAIL,
      subject: TEAMS_MAIL.subject(or(team, TEAMS_MAIL.teamDefault)),
      body: lines.join(CRLF),
    };
  }
  if (kind === 'sponsors') {
    const f = fields as SponsorsFields;
    const company = oneLine(f.company);
    const lines = [
      MAIL.hello,
      '',
      SPONSORS_MAIL.intro,
      '',
      SPONSORS_MAIL.company + or(company, MAIL.empty),
      SPONSORS_MAIL.make + or(normaliseLines(f.make), MAIL.empty),
      SPONSORS_MAIL.bring + or(chipList(SPONSORS.bring, f.bring), MAIL.notSure),
      SPONSORS_MAIL.challenges + or(challengeNames(f.challenges).join(', '), MAIL.notSure),
      SPONSORS_MAIL.also + or(chipList(SPONSORS.also, f.also), MAIL.empty),
    ];
    return {
      to: CONTACT_EMAIL,
      subject: SPONSORS_MAIL.subject(or(company, SPONSORS_MAIL.companyDefault)),
      body: lines.join(CRLF),
    };
  }
  return { to: CONTACT_EMAIL, subject: MAIL.plainSubject, body: null };
}

/** Serialise parts into an RFC 6068 mailto URI. */
export function toMailto(parts: MailParts): string {
  const h = [`subject=${encodeHfvalue(oneLine(parts.subject))}`];
  if (parts.body !== null) h.push(`body=${encodeHfvalue(parts.body)}`);
  return `mailto:${parts.to}?${h.join('&')}`;
}

/** buildMailto(kind, fields) (brief 9.2). Pure: safe in render and in the prerender. */
export function buildMailto(kind: 'teams', fields?: TeamsFields): string;
export function buildMailto(kind: 'sponsors', fields?: SponsorsFields): string;
export function buildMailto(kind: 'plain', fields?: undefined): string;
export function buildMailto(kind: MailKind, fields?: TeamsFields | SponsorsFields): string;
export function buildMailto(kind: MailKind, fields?: TeamsFields | SponsorsFields): string {
  return toMailto(mailParts(kind, fields));
}

/** Parse a mailto URI back into its parts (tests and QA). */
export function parseMailto(href: string): { to: string; headers: Record<string, string> } {
  if (!href.startsWith('mailto:')) throw new Error(`not a mailto: ${href}`);
  const rest = href.slice('mailto:'.length);
  const q = rest.indexOf('?');
  const to = decodeURIComponent(q < 0 ? rest : rest.slice(0, q));
  const headers: Record<string, string> = {};
  if (q >= 0) {
    for (const pair of rest.slice(q + 1).split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const k = decodeURIComponent(eq < 0 ? pair : pair.slice(0, eq)).toLowerCase();
      headers[k] = decodeURIComponent(eq < 0 ? '' : pair.slice(eq + 1));
    }
  }
  return { to, headers };
}

export type { ChallengeNo };
