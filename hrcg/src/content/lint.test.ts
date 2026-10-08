// Copy lint (brief 10.5, G11): fails `npm run build` on any truth-rule violation in src/content/**.
// The prerendered HTML is linted by scripts/prerender.mjs with the same rules (and here too when
// HRCG_LINT_HTML points at a built index.html). Owner: A1.

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSource, lintString, lintHtml, htmlGroups, type AllowEntry, type LintViolation } from '../system/lintRules';
import { VIEW_TITLE_STRINGS } from './viewTitles';
import { CONTACT_EMAIL, resolveSiteUrl } from './config';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..');
const allow: AllowEntry[] = JSON.parse(readFileSync(join(here, 'lint-allow.json'), 'utf8')).allow;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function jsonStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => jsonStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => jsonStrings(x, out));
  return out;
}

function report(v: LintViolation[]): string {
  return v.map((x) => `\n  ${x.where}: ${x.message}\n    "${x.text}"`).join('');
}

describe('copy lint: src/content/**', () => {
  const files = walk(here).filter(
    (f) => (/\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f)) || (/\.json$/.test(f) && !f.endsWith('lint-allow.json')),
  );

  it('finds the content files', () => {
    expect(files.length).toBeGreaterThan(3);
  });

  for (const f of files) {
    it(relative(SRC, f), () => {
      const src = readFileSync(f, 'utf8');
      const v = f.endsWith('.json')
        ? jsonStrings(JSON.parse(src)).flatMap((s) => lintString(s, relative(SRC, f), allow))
        : lintSource(src, relative(SRC, f), allow);
      expect(v, report(v)).toEqual([]);
    });
  }
});

describe('copy lint: the contact address lives in one constant (rule 15)', () => {
  it('hello@example.com appears literally only in src/content/config.ts', () => {
    const offenders = walk(SRC)
      .filter((f) => /\.(ts|tsx|json)$/.test(f) && !/\.test\.tsx?$/.test(f))
      .filter((f) => !f.endsWith(join('content', 'config.ts')) && !f.endsWith('lint-allow.json'))
      .filter((f) => readFileSync(f, 'utf8').includes(CONTACT_EMAIL))
      .map((f) => relative(SRC, f));
    expect(offenders, `use CONTACT_EMAIL from src/content/config.ts instead: ${offenders.join(', ')}`).toEqual([]);
  });
});

describe('copy lint: rules catch what they must', () => {
  const bad: Array<[string, string]> = [
    ['date', 'See you in March 2027, planned.'],
    ['date', 'COMING THIS SUMMER'],
    ['venue', 'Live from Manhattan'],
    ['planned', 'NEW YORK CITY · 2027'],
    ['planned', 'DRAWING INDEX · HRCG-2027 · 11 SHEETS'],
    ['prizes', 'Win the trophy'],
    ['digits', '50+ teams'],
    ['sponsors', 'Trusted by builders'],
    ['rules', 'Three rounds and a final'],
    ['rules', 'Lay it to ±3 mm'],
    ['autonomy', 'Fully autonomous robots'],
    ['eligibility', 'Open to anyone'],
    ['registration', 'Register now'],
    ['tickets', 'Get tickets'],
    ['tickets', 'Watch it live'],
    ['metrics', 'Reach 10,000 buyers'],
    ['contact', 'Write to team@hrcg.com'],
    ['handles', 'Follow @hrcg'],
    ['first', 'The world’s first robot games'],
    ['olympic', 'The Olympics of robotics'],
    ['nyc-marks', 'I ♥ NY'],
    ['brands', 'Built on Tesla Optimus'],
    ['percent', 'A 98% success'],
    ['vendors', 'Made with Higgsfield'],
    ['ground-truth', 'Ground truth for robots'],
    ['nothing-stored', 'Nothing is stored.'],
  ];
  for (const [rule, text] of bad) {
    it(`${rule}: "${text}"`, () => {
      const v = lintString(text, 'test');
      expect(v.map((x) => x.rule)).toContain(rule);
    });
  }

  const good = [
    'PLANNED · NEW YORK CITY · 2027',
    'DRAWING INDEX · HRCG-2027 · PLANNED · 11 SHEETS · NTS',
    'A-103 · CHALLENGE 03 · BOLTED ASSEMBLY · DETAIL / PERSPECTIVE / PLAN · NTS',
    'DETAIL 1 / A-101 · CONCEPT FILM · AI-GENERATED',
    'PLAN VIEWS 01–05 · CONCEPT FILM · AI-GENERATED',
    '3D VIEW 05-A · DEPTH ESTIMATED FROM ONE FRAME OF AI-GENERATED CONCEPT FILM · RELATIVE, NO UNITS · NOT ROBOT PERCEPTION DATA',
    '▶ PLAY THE SNAP (1 S) · CONCEPT FILM',
    'CONTROL POINT',
    'You may ground the line; the surroundings are dark.',
    'Or email hello@example.com',
    'HRCG 2027 (planned) - Discuss competing - our team',
    '1 · PLATFORM',
    '[2] SHOW WHAT YOU MAKE',
    'This target is 128 bricks in stack bond. AprilTag: family tag36h11, ID 7.',
    'PRINT AT 100%',
    'Download T7 (US Letter PDF)',
    'Download T7 (A4 PDF)',
    'A-404 · SHEET NOT FOUND',
    '1 / A-101',
    'Open detail 1, concept film of a robot hand pressing a brick into mortar',
    'DETAIL 5 / A-105 · CONCEPT FILM · AI-GENERATED',
  ];
  for (const text of good) {
    it(`passes: "${text}"`, () => {
      const v = lintString(text, 'test', allow);
      expect(v, report(v)).toEqual([]);
    });
  }

  it('honours the allowlist by exact string', () => {
    expect(lintString('The Set, a 30-second concept film', 'test', allow)).toEqual([]);
    expect(lintString('The Set, a 31-second concept film', 'test', allow).length).toBeGreaterThan(0);
  });
});

describe('view titles are exact brief strings (brief 3.2)', () => {
  const expected: Record<string, string> = {
    'hero-film':
      'PERSPECTIVE 05-A · LAYOUT AND MARKING · CONCEPT FILM · AI-GENERATED. THIS HASN’T HAPPENED YET.',
    'hero-still':
      'PERSPECTIVE 05-A · LAYOUT AND MARKING · CONCEPT FILM STILL · AI-GENERATED. THIS HASN’T HAPPENED YET.',
    'hero-3d':
      '3D VIEW 05-A · DEPTH ESTIMATED FROM ONE FRAME OF AI-GENERATED CONCEPT FILM · RELATIVE, NO UNITS · NOT ROBOT PERCEPTION DATA',
    'plan-cut': 'PLAN 05 · CONCEPT FILM STILL · AI-GENERATED',
    'a100-plans': 'PLAN VIEWS 01–05 · CONCEPT FILM · AI-GENERATED',
    'a101-plan': 'PLAN 01 · CONCEPT FILM · AI-GENERATED',
    'a101-perspective': 'PERSPECTIVE 01-A · CONCEPT FILM · AI-GENERATED',
    'a101-detail': 'DETAIL 1 / A-101 · CONCEPT FILM · AI-GENERATED',
    'a102-perspective': 'PERSPECTIVE 02-A · CONCEPT FILM · AI-GENERATED',
    'a102-plan': 'PLAN 02 · CONCEPT FILM · AI-GENERATED',
    'a103-detail': 'DETAIL 3 / A-103 · CONCEPT FILM · AI-GENERATED',
    'a103-perspective': 'PERSPECTIVE 03-A · CONCEPT FILM · AI-GENERATED',
    'a103-plan': 'PLAN 03 · CONCEPT FILM · AI-GENERATED',
    'a104-plan': 'PLAN 04 · CONCEPT FILM · AI-GENERATED',
    'a104-perspective': 'PERSPECTIVE 04-A · CONCEPT FILM · AI-GENERATED',
    'a104-trace': 'TASK DRAWING TRACED FROM CONCEPT FOOTAGE · DRAWING',
    'a105-plan': 'PLAN 05 · CONCEPT FILM · AI-GENERATED',
    'a105-trace': 'LINES TRACED FROM CONCEPT FOOTAGE · DRAWING',
    'a105-section':
      'SECTION A–A · DEPTH ESTIMATED FROM AI-GENERATED CONCEPT FILM · RELATIVE, NO UNITS · NOT ROBOT PERCEPTION DATA · ILLUSTRATIVE: PLAN AND SECTION ARE DIFFERENT SHOTS',
    'a105-detail': 'DETAIL 5 / A-105 · CONCEPT FILM · AI-GENERATED',
    'a200-poster': 'PLAN VIEWS 01–05 · CONCEPT FILM STILL · AI-GENERATED',
    'a200-drawing': 'CONTEXT · THE 1811 GRID (HISTORY) · DRAWING · NOT A MAP',
    'a300-detail07':
      'DETAIL 07 · CONCEPT ILLUSTRATION · AI-GENERATED · ROBOT 07 IS A CONCEPT DESIGN, NOT A REAL ROBOT OR A COMPETITOR',
    'a300-empty-bay': 'PLAN · AN EMPTY BAY · CONCEPT ILLUSTRATION · AI-GENERATED · NOT A VENUE PLAN',
    'a301-materials': 'MATERIALS · CONCEPT ILLUSTRATION · AI-GENERATED · NOT SPONSOR PRODUCTS',
  };
  it('matches the table', () => {
    expect(VIEW_TITLE_STRINGS).toEqual(expected);
  });
  it('only the hero film titles carry THIS HASN’T HAPPENED YET. (G8)', () => {
    const carriers = Object.entries(VIEW_TITLE_STRINGS)
      .filter(([, s]) => s.includes('HASN’T HAPPENED'))
      .map(([k]) => k);
    expect(carriers.sort()).toEqual(['hero-film', 'hero-still']);
  });
});

describe('SITE_URL resolution (brief 8.8)', () => {
  it('prefers SITE_URL, then Netlify URL, then Vercel', () => {
    expect(resolveSiteUrl({ SITE_URL: 'https://a.example/', URL: 'https://b.example' })).toBe('https://a.example');
    expect(resolveSiteUrl({ URL: 'https://b.netlify.app' })).toBe('https://b.netlify.app');
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'c.vercel.app' })).toBe('https://c.vercel.app');
    expect(resolveSiteUrl({})).toBeNull();
    expect(resolveSiteUrl({ SITE_URL: 'not a url' })).toBeNull();
  });
});

describe('HTML grouping', () => {
  it('merges inline text and splits on blocks', () => {
    const g = htmlGroups('<div><span>PLANNED</span> · <b>NYC</b> · 2027</div><p>2027</p><img alt="robot 07">');
    expect(g).toEqual(['PLANNED · NYC · 2027', '2027', 'robot 07']);
  });
  it('data-lint-group joins a block subtree', () => {
    const g = htmlGroups('<dl data-lint-group><dt>STATUS</dt><dd>Planned</dd><dt>YEAR</dt><dd>2027</dd></dl>');
    expect(g).toEqual(['STATUS Planned YEAR 2027']);
  });
});

const builtHtml = process.env.HRCG_LINT_HTML;
describe.skipIf(!builtHtml || !existsSync(builtHtml))('copy lint: built HTML', () => {
  it(String(builtHtml), () => {
    const v = lintHtml(readFileSync(builtHtml!, 'utf8'), String(builtHtml), allow);
    expect(v, report(v)).toEqual([]);
  });
});
