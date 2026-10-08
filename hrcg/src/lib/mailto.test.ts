// RFC 6068 unit tests for the mailto builder (brief 9.4 A6, 10.1 S7). Owner: A6.
// Expected subjects and bodies are typed out literally from the brief (3.10, 3.11, 3.12) so copy
// drift in src/content/copy/conversion.ts fails here too.

import { describe, expect, it } from 'vitest';
import { buildMailto, mailParts, parseMailto, normaliseLines, oneLine } from './mailto';
import { CONTACT_EMAIL } from '../content/config';

const CRLF = '\r\n';
const ADDR = CONTACT_EMAIL;

/** RFC 6068 hfvalue: only qchar = unreserved / pct-encoded / some-delims may appear unencoded. */
const QCHARS = /^(?:[A-Za-z0-9\-._~!$'()*+,;:@]|%[0-9A-F]{2})*$/;

function hfields(href: string): Array<[string, string]> {
  const q = href.indexOf('?');
  return href
    .slice(q + 1)
    .split('&')
    .map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i), p.slice(i + 1)];
    });
}

const TEAMS_DEFAULT_BODY = [
  'Hello,',
  '',
  "We'd like to discuss competing in the Humanoid Robot Construction Games, planned for New York City in 2027.",
  '',
  'From: -',
  '1. Platform: -',
  "2. Challenges we're ready for: Not sure yet",
  "3. What we'd need to take part: -",
].join(CRLF);

const SPONSORS_DEFAULT_BODY = [
  'Hello,',
  '',
  "We'd like to discuss supporting the Humanoid Robot Construction Games, planned for New York City in 2027.",
  '',
  'Company: -',
  'What we make: -',
  'We could bring: Not sure yet',
  'Challenge(s) of interest: Not sure yet',
  'Also interested in: -',
].join(CRLF);

describe('teams mailto (brief 3.10)', () => {
  it('default subject and body are exact', () => {
    const p = mailParts('teams');
    expect(p.to).toBe(ADDR);
    expect(p.subject).toBe('HRCG 2027 (planned) - Discuss competing - our team');
    expect(p.body).toBe(TEAMS_DEFAULT_BODY);
  });

  it('default href is exact, percent-encoded, CRLF as %0D%0A', () => {
    const href = buildMailto('teams');
    expect(href).toBe(
      `mailto:${ADDR}?subject=HRCG%202027%20(planned)%20-%20Discuss%20competing%20-%20our%20team` +
        '&body=Hello%2C%0D%0A%0D%0AWe\'d%20like%20to%20discuss%20competing%20in%20the%20Humanoid%20Robot%20Construction%20Games%2C%20planned%20for%20New%20York%20City%20in%202027.%0D%0A%0D%0A' +
        'From%3A%20-%0D%0A1.%20Platform%3A%20-%0D%0A2.%20Challenges%20we\'re%20ready%20for%3A%20Not%20sure%20yet%0D%0A3.%20What%20we\'d%20need%20to%20take%20part%3A%20-',
    );
  });

  it('filled fields land in the exact lines, challenges in 01..05 order', () => {
    const p = mailParts('teams', {
      team: '  Lab North ',
      platform: 'Biped with two 7-DoF arms',
      challenges: [3, 1],
      needs: 'Power, a pallet of brick',
    });
    expect(p.subject).toBe('HRCG 2027 (planned) - Discuss competing - Lab North');
    expect(p.body).toBe(
      [
        'Hello,',
        '',
        "We'd like to discuss competing in the Humanoid Robot Construction Games, planned for New York City in 2027.",
        '',
        'From: Lab North',
        '1. Platform: Biped with two 7-DoF arms',
        "2. Challenges we're ready for: Bricklaying, Bolted assembly",
        "3. What we'd need to take part: Power, a pallet of brick",
      ].join(CRLF),
    );
  });

  it('all five challenges', () => {
    const p = mailParts('teams', { challenges: [5, 4, 3, 2, 1] });
    expect(p.body).toContain(
      "2. Challenges we're ready for: Bricklaying, Drywall installation, Bolted assembly, Pipe assembly, Layout and marking",
    );
  });

  it('round-trips through decoding', () => {
    const fields = { team: 'A&B = C?', platform: '100% #1 + more', challenges: [2], needs: 'x\ny' };
    const { to, headers } = parseMailto(buildMailto('teams', fields));
    expect(to).toBe(ADDR);
    const p = mailParts('teams', fields);
    expect(headers.subject).toBe(p.subject);
    expect(headers.body).toBe(p.body);
  });
});

describe('sponsors mailto (brief 3.11)', () => {
  it('default subject and body are exact', () => {
    const p = mailParts('sponsors');
    expect(p.subject).toBe('HRCG 2027 (planned) - Discuss sponsorship - our company');
    expect(p.body).toBe(SPONSORS_DEFAULT_BODY);
  });

  it('chips land as plain words in the composer order', () => {
    const p = mailParts('sponsors', {
      company: 'Acme Masonry',
      make: 'Mortar and brick ties',
      bring: ['expertise', 'materials'],
      challenges: [1, 5],
      also: ['talent', 'demos'],
    });
    expect(p.subject).toBe('HRCG 2027 (planned) - Discuss sponsorship - Acme Masonry');
    expect(p.body).toBe(
      [
        'Hello,',
        '',
        "We'd like to discuss supporting the Humanoid Robot Construction Games, planned for New York City in 2027.",
        '',
        'Company: Acme Masonry',
        'What we make: Mortar and brick ties',
        'We could bring: Materials, expertise',
        'Challenge(s) of interest: Bricklaying, Layout and marking',
        'Also interested in: Demonstrations and visibility, recruiting and technical conversations',
      ].join(CRLF),
    );
  });

  it('unknown chip keys are ignored', () => {
    const p = mailParts('sponsors', { bring: ['gold'], also: ['nope'] });
    expect(p.body).toContain('We could bring: Not sure yet');
    expect(p.body).toContain('Also interested in: -');
  });
});

describe('plain mailto (A-900 address link, brief 3.12)', () => {
  it('subject only', () => {
    expect(buildMailto('plain')).toBe(`mailto:${ADDR}?subject=HRCG%202027%20(planned)`);
  });
});

describe('RFC 6068 encoding', () => {
  const samples = [
    buildMailto('teams'),
    buildMailto('sponsors'),
    buildMailto('plain'),
    buildMailto('teams', { team: 'Équipe Zürich', platform: 'a & b = c ? d # e % f + g', challenges: [1, 2], needs: 'line 1\r\nline 2\rline 3\nline 4' }),
    buildMailto('sponsors', { company: 'O’Brien “Tools”', make: '<script>alert(1)</script>', bring: ['tools'], challenges: [4], also: ['demos'] }),
  ];

  it('every hfvalue contains only qchars (RFC 6068 section 2)', () => {
    for (const href of samples) {
      for (const [name, value] of hfields(href)) {
        expect(['subject', 'body']).toContain(name);
        expect(value, `${name} in ${href}`).toMatch(QCHARS);
      }
    }
  });

  it('the whole URI is ASCII and has no raw space, "+" for space, CR or LF', () => {
    for (const href of samples) {
      expect(href).toMatch(/^[\x21-\x7e]+$/);
      expect(href).not.toMatch(/[ \r\n]/);
      expect(href).not.toMatch(/\+/); // spaces are %20, "+" is %2B
    }
  });

  it('reserved characters in values are encoded', () => {
    const href = buildMailto('teams', { platform: 'a & b = c ? d # e % f + g' });
    expect(href).toContain('a%20%26%20b%20%3D%20c%20%3F%20d%20%23%20e%20%25%20f%20%2B%20g');
    // exactly two hfields: a value can never smuggle a third header
    expect(hfields(buildMailto('teams', { team: 'x&cc=a@b.c', needs: 'y&bcc=d@e.f' })).map(([k]) => k)).toEqual([
      'subject',
      'body',
    ]);
  });

  it('body line breaks are CRLF only (%0D%0A), whatever the visitor typed', () => {
    const href = buildMailto('teams', { needs: 'line 1\r\nline 2\rline 3\nline 4\u2028line 5' });
    const body = hfields(href).find(([k]) => k === 'body')![1];
    expect(body).not.toMatch(/%0A(?<!%0D%0A)/);
    expect(body.replace(/%0D%0A/g, '')).not.toMatch(/%0D|%0A/);
    expect(parseMailto(href).headers.body).toContain('line 1\r\nline 2\r\nline 3\r\nline 4\r\nline 5');
  });

  it('subjects are one line', () => {
    const p = mailParts('teams', { team: 'Lab\r\nNorth\tWest' });
    expect(p.subject).toBe('HRCG 2027 (planned) - Discuss competing - Lab North West');
    expect(buildMailto('teams', { team: 'Lab\nNorth' })).toContain('subject=HRCG%202027%20(planned)%20-%20Discuss%20competing%20-%20Lab%20North&');
  });

  it('non-ASCII input travels as percent-encoded UTF-8', () => {
    const href = buildMailto('teams', { team: 'Équipe Zürich' });
    expect(href).toContain('%C3%89quipe%20Z%C3%BCrich');
    expect(parseMailto(href).headers.subject).toBe('HRCG 2027 (planned) - Discuss competing - Équipe Zürich');
  });

  it('the template text itself is ASCII only (brief 5.2)', () => {
    for (const kind of ['teams', 'sponsors', 'plain'] as const) {
      const p = mailParts(kind);
      expect(p.subject).toMatch(/^[\x20-\x7e]+$/);
      if (p.body) expect(p.body).toMatch(/^[\x20-\x7e\r\n]+$/);
      expect(`${p.subject}${p.body ?? ''}`).not.toMatch(/[·’“”–—]/);
    }
  });

  it('the address is the CONTACT_EMAIL placeholder (rule 15)', () => {
    for (const href of samples) expect(parseMailto(href).to).toBe('hello@example.com');
  });

  it('whitespace-only fields fall back to the defaults', () => {
    expect(mailParts('teams', { team: '   ', platform: '\n', needs: ' \r\n ' })).toEqual(mailParts('teams'));
    expect(mailParts('sponsors', { company: ' ', make: '\t' })).toEqual(mailParts('sponsors'));
  });
});

describe('helpers', () => {
  it('oneLine', () => {
    expect(oneLine('  a \n b\t c  ')).toBe('a b c');
    expect(oneLine(undefined)).toBe('');
  });
  it('normaliseLines', () => {
    expect(normaliseLines('a\rb\nc\r\nd')).toBe('a\r\nb\r\nc\r\nd');
    expect(normaliseLines('  x  ')).toBe('x');
  });
});
