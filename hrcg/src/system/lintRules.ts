// Copy lint rules (brief 10.5, G11). Owner: A1.
// Used by src/content/lint.test.ts (every string literal in src/content/**) and by
// scripts/prerender.mjs (every text group and human-readable attribute in the prerendered HTML).
// Word-boundary regexes; case-insensitive unless stated. Exceptions come ONLY from
// src/content/lint-allow.json: exact strings, each with a reason (and optionally the rule ids
// they are exempt from). Digit runs must match an allowed pattern.

import { CONTACT_EMAIL } from '../content/config';

export interface AllowEntry {
  text: string;
  reason: string;
  /** Rule ids this string is exempt from; omitted = all rules. */
  rules?: string[];
}

export interface LintViolation {
  rule: string;
  message: string;
  text: string;
  where: string;
}

interface Rule {
  id: string;
  /** audit section 4 rule number(s), for the message */
  ref: string;
  test: (s: string) => string | null;
}

const ci = (re: string) => new RegExp(re, 'i');
const cs = (re: string) => new RegExp(re);

function matchAny(s: string, res: RegExp[]): string | null {
  for (const re of res) {
    const m = s.match(re);
    if (m) return m[0];
  }
  return null;
}

const MONTHS =
  'January|February|March|April|May|June|July|August|September|October|November|December';

/** Digit tokens allowed anywhere (rule 5). Order matters: longer tokens first. */
const ALLOWED_DIGIT_TOKENS: RegExp[] = [
  /HRCG-2027/g,
  // measured T7 proof label, only ever printed from t7-proof.json smallestLabel (A6-1)
  /\b\d{1,4} PX WIDE\b/g,
  // detail bubble numbering, bare form inside the mark: "1 / A-101" (A3-1)
  /\b[1-6] \/ A-(?:101|102|103|104|105|300|301|900)\b/g,
  // detail numbering in labels: "DETAIL 1", "Open detail 1, …" (A3-1)
  /\bdetail [1-6]\b/gi,
  /\bA-(?:000|100|101|102|103|104|105|200|300|301|900|404)\b/gi,
  /\bRFI-001\b/g,
  /\btag36h11\b/g,
  /\bID 7\b/g,
  /\b128 bricks\b/gi,
  /\b11 SHEETS\b/gi,
  /\(1 S\)/g,
  /\b0:30\b/g,
  /\b29°/g,
  /\bTHE 1811 GRID\b/gi,
  /\bPRINT AT 100%/g,
  /\bUS Letter\b/g,
  /\bA4\b/g,
  /\b3D\b/g,
  /\bT7\b/g,
  /\b404\b/g,
  /\b2027\b/g,
  /\b0[1-5]-A\b/g,
  /\b0[1-5]–0[1-5]\b/g,
  /\b0[1-5]\b/g,
  /\b07\b/g,
  /\[[1-6]\]/g,
  // numbered form fields, notes, keynotes: "1 · PLATFORM", "1. Platform:", "3 · WHAT YOU…"
  /(^|\n|\s)[1-6](?= · |\. )/g,
];

function stripAllowedDigits(s: string): string {
  let out = s;
  for (const re of ALLOWED_DIGIT_TOKENS) {
    out = out.replace(re, (...args: unknown[]) => {
      const p1 = args[1];
      return (typeof p1 === 'string' ? p1 : '') + ' ';
    });
  }
  return out;
}

const RULES: Rule[] = [
  {
    id: 'date',
    ref: '1',
    test: (s) =>
      matchAny(s, [
        cs(`\\b(${MONTHS})\\b`),
        cs(`\\b(${MONTHS.toUpperCase()})\\b`),
        ci('\\b(spring|summer|winter|autumn)\\b'),
        ci('\\bT-\\s?(minus\\b|\\d)'),
        ci('\\bcountdown\\b'),
      ]),
  },
  {
    id: 'venue',
    ref: '2',
    test: (s) =>
      matchAny(s, [
        ci('\\bManhattan\\b'),
        ci('\\b(Javits|Navy Yard|Pier 76|Madison Square|Hudson Yards|Barclays|Meadowlands)\\b'),
      ]),
  },
  {
    id: 'planned',
    ref: '3',
    test: (s) => {
      if (/\b2027\b/.test(s) && !/\bplanned\b/i.test(s)) return '2027 without "planned" in the same string';
      if (/HRCG-2027/.test(s) && !/\bPLANNED\b/i.test(s)) return 'HRCG-2027 without PLANNED in the same string';
      return matchAny(s, [ci('\\bconfirmed\\b'), ci('\\bcoming to (NYC|New York)\\b'), ci('\\blive in (NYC|New York)\\b')]);
    },
  },
  { id: 'prizes', ref: '4', test: (s) => matchAny(s, [ci('\\b(PRIZES?|PURSE|MEDALS?|PODIUM|TROPH\\w*)\\b')]) },
  {
    id: 'digits',
    ref: '5',
    test: (s) => {
      const rest = stripAllowedDigits(s);
      const m = rest.match(/\d+/);
      return m ? `digit run "${m[0]}" is not an allowed pattern` : null;
    },
  },
  {
    id: 'sponsors',
    ref: '6',
    test: (s) => matchAny(s, [ci('\\b(BACKED BY|TRUSTED BY|PARTNERS|SPONSORED BY|PRESENTED BY|GOLD|SILVER|PLATINUM|BRONZE|AS SEEN IN)\\b')]),
  },
  {
    id: 'rules',
    ref: '8',
    test: (s) =>
      matchAny(s, [
        ci('\\b(HEATS?|ROUNDS?|FINALS?|QUALIF\\w*|SEASON|SCORE\\w*|LEADERBOARD|TOLERANCES?|POINTS|TIME LIMITS?)\\b'),
        /±/,
        ci('\\b\\d+\\s?mm\\b'),
      ]),
  },
  { id: 'autonomy', ref: '9', test: (s) => matchAny(s, [ci('\\b(AUTONOMOUS|AUTONOMY|TELEOP\\w*|HUMAN-IN-THE-LOOP|AI-ONLY)\\b')]) },
  { id: 'eligibility', ref: '10', test: (s) => matchAny(s, [ci('\\b(ELIGIB\\w*|BIPEDAL|ANY FORM FACTOR|OPEN TO)\\b')]) },
  { id: 'subset', ref: '11', test: (s) => matchAny(s, [ci('\\benter one, some or all\\b')]) },
  {
    id: 'registration',
    ref: '12',
    test: (s) => matchAny(s, [ci('\\b(REGISTER\\w*|APPLY|APPLICATIONS?|DEADLINES?|SPOTS|ENTRY FEES?|SIGN UP)\\b')]),
  },
  { id: 'tickets', ref: '13', test: (s) => matchAny(s, [ci('\\b(TICKETS?|LIVESTREAM|STREAM\\w*|WATCH LIVE|LIVE)\\b')]) },
  { id: 'metrics', ref: '14', test: (s) => matchAny(s, [ci('\\bREACH\\b\\s*[\\d,.]+')]) },
  {
    id: 'contact',
    ref: '15',
    test: (s) => {
      const emails = s.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) ?? [];
      const bad = emails.find((e) => e.toLowerCase() !== CONTACT_EMAIL);
      if (bad) return `address "${bad}" (only CONTACT_EMAIL is allowed)`;
      return matchAny(s, [ci('\\b(tel:|phone:)'), /\+\d[\d\s().-]{6,}/]);
    },
  },
  {
    id: 'handles',
    ref: '16',
    test: (s) => {
      const rest = s.split(CONTACT_EMAIL).join('');
      return rest.includes('@') ? '"@" outside the contact address' : null;
    },
  },
  { id: 'first', ref: '18', test: (s) => matchAny(s, [ci("\\b(FIRST|WORLD['’]?S|FIRST-EVER)\\b")]) },
  { id: 'olympic', ref: '19', test: (s) => matchAny(s, [ci('\\bOLYMPI\\w*')]) },
  { id: 'nyc-marks', ref: '20', test: (s) => matchAny(s, [ci('\\bMTA\\b'), ci('I\\s?(♥|❤|LOVE)\\s?NY\\b'), ci('\\bEMPIRE STATE\\b')]) },
  {
    id: 'brands',
    ref: '21',
    test: (s) =>
      matchAny(s, [ci('\\b(OPTIMUS|TESLA|ATLAS|BOSTON DYNAMICS|AGILITY|DIGIT|APPTRONIK|APOLLO|UNITREE|1X|NEO)\\b')]),
  },
  {
    id: 'percent',
    ref: '23',
    test: (s) => (s.replace(/PRINT AT 100%/g, '').includes('%') ? '"%" in copy' : null),
  },
  {
    id: 'vendors',
    ref: 'site',
    test: (s) => matchAny(s, [ci('\\b(HIGGSFIELD|KLING|GPT|NANO BANANA|SEEDANCE|DEPTH ANYTHING|REMOTION|MIDJOURNEY|SORA|RUNWAY)\\b')]),
  },
  { id: 'ground-truth', ref: 'site', test: (s) => matchAny(s, [ci('\\bGROUND TRUTH\\b')]) },
  { id: 'nothing-stored', ref: 'site', test: (s) => matchAny(s, [ci('\\bnothing is stored\\b')]) },
  { id: 'broadcast', ref: '22', test: (s) => matchAny(s, [ci('\\b(RECAP|HIGHLIGHTS|LAST YEAR)\\b')]) },
];

export const RULE_IDS = RULES.map((r) => r.id);

function allowedRules(text: string, allow: AllowEntry[]): Set<string> | 'all' | null {
  let set: Set<string> | null = null;
  for (const a of allow) {
    if (a.text !== text) continue;
    if (!a.rules || a.rules.length === 0) return 'all';
    set ??= new Set();
    a.rules.forEach((r) => set!.add(r));
  }
  return set;
}

/** Lint one string group. */
export function lintString(text: string, where: string, allow: AllowEntry[] = []): LintViolation[] {
  const s = text.replace(/\s+/g, ' ').trim();
  if (!s) return [];
  const exempt = allowedRules(s, allow);
  if (exempt === 'all') return [];
  const out: LintViolation[] = [];
  for (const r of RULES) {
    if (exempt?.has(r.id)) continue;
    const hit = r.test(s);
    if (hit) out.push({ rule: r.id, message: `rule ${r.ref} (${r.id}): ${hit}`, text: s, where });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Source strings: every string/template literal in a TS/TSX file (comments and import paths skipped)

export function extractStringLiterals(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  const n = src.length;
  let lastToken = '';
  let lastSig = ''; // last significant char outside comments
  while (i < n) {
    const c = src[i]!;
    const next = src[i + 1];
    if (c === '/' && next === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && next === '*') {
      i = src.indexOf('*/', i + 2);
      i = i < 0 ? n : i + 2;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      let j = i + 1;
      let buf = '';
      while (j < n && src[j] !== q) {
        if (src[j] === '\\') {
          const e = src[j + 1];
          buf += e === 'n' ? '\n' : e === 't' ? '\t' : (e ?? '');
          j += 2;
          continue;
        }
        if (q === '`' && src[j] === '$' && src[j + 1] === '{') {
          // template expression: replace with a neutral placeholder, skip balanced braces
          let depth = 1;
          j += 2;
          while (j < n && depth > 0) {
            if (src[j] === '{') depth++;
            else if (src[j] === '}') depth--;
            j++;
          }
          buf += '{x}';
          continue;
        }
        buf += src[j];
        j++;
      }
      const isImport = /\b(from|import)\s*\(?\s*$/.test(lastToken) || /\bimport\s*$/.test(lastToken);
      // object keys ({ 'a101-plan': … }) are identifiers, not copy
      const after = src.slice(j + 1).trimStart()[0];
      const isKey = (lastSig === '{' || lastSig === ',') && after === ':';
      if (!isImport && !isKey) out.push(buf);
      i = j + 1;
      lastToken = '';
      lastSig = q;
      continue;
    }
    lastToken = (lastToken + c).slice(-12);
    if (!/\s/.test(c)) lastSig = c;
    i++;
  }
  return out;
}

export function lintSource(src: string, file: string, allow: AllowEntry[] = []): LintViolation[] {
  return extractStringLiterals(src).flatMap((s) => lintString(s, file, allow));
}

// ---------------------------------------------------------------------------------------------
// Prerendered HTML: text grouped by block element (inline tags merge), plus human-readable
// attributes. An element with data-lint-group lints its whole text as one group.

const BLOCK = new Set(
  'address article aside blockquote body button caption dd details dialog div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header html label legend li main nav ol option p pre section summary table tbody td tfoot th thead title tr ul a head'.split(
    ' ',
  ),
);
const VOID = new Set('area base br col embed hr img input link meta source track wbr'.split(' '));
const READABLE_ATTRS = ['alt', 'aria-label', 'title', 'placeholder', 'aria-valuetext', 'aria-description'];

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function htmlGroups(html: string): string[] {
  const body = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const groups: string[] = [];
  const stack: Array<{ tag: string; group: boolean }> = [];
  let buf = '';
  let groupDepth = 0;
  const flush = () => {
    if (groupDepth > 0) {
      buf += ' ';
      return;
    }
    const t = buf.replace(/\s+/g, ' ').trim();
    if (t) groups.push(t);
    buf = '';
  };
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    if (m[4] !== undefined) {
      buf += decodeEntities(m[4]);
      continue;
    }
    // every tag boundary separates words (flex/block spans render apart: "SHEET" + "A-000")
    buf += ' ';
    const closing = m[1] === '/';
    const tag = m[2]!.toLowerCase();
    const attrs = m[3] ?? '';
    if (!closing) {
      for (const a of READABLE_ATTRS) {
        const am = attrs.match(new RegExp(`\\s${a}="([^"]*)"`, 'i'));
        if (am && am[1]!.trim()) groups.push(decodeEntities(am[1]!));
      }
      if (tag === 'meta') {
        const name = attrs.match(/\s(?:name|property)="([^"]*)"/i)?.[1] ?? '';
        const content = attrs.match(/\scontent="([^"]*)"/i)?.[1];
        if (content && /description|title|alt|site_name/i.test(name)) groups.push(decodeEntities(content));
      }
      if (VOID.has(tag) || attrs.trim().endsWith('/')) continue;
      const isGroup = /\sdata-lint-group\b/.test(attrs);
      if (BLOCK.has(tag)) flush();
      if (isGroup) {
        flush();
        groupDepth++;
      }
      stack.push({ tag, group: isGroup });
    } else {
      // pop to the matching tag
      let idx = stack.length - 1;
      while (idx >= 0 && stack[idx]!.tag !== tag) idx--;
      if (idx < 0) continue;
      const popped = stack.splice(idx);
      for (const p of popped.reverse()) {
        if (p.group) {
          groupDepth--;
          flush();
        } else if (BLOCK.has(p.tag)) {
          flush();
        }
      }
    }
  }
  groupDepth = 0;
  flush();
  return groups;
}

export function lintHtml(html: string, where: string, allow: AllowEntry[] = []): LintViolation[] {
  return htmlGroups(html).flatMap((g) => lintString(g, where, allow));
}
