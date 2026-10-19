// Reads a founder's one-sentence description the way a busy investor does, and says what will
// survive being retold. It runs in the browser on fixed rules, never a model, so the same sentence
// always gets the same reading and nothing typed is sent anywhere.
//
// Six checks: who buys, what changes for them, proof, why now, plain words, and whether it can be
// said in one breath. Each word is marked as one that survives the retelling (specific nouns,
// numbers, the outcome), one that fades (filler and adjectives), or one that's flagged (the words
// investors have learned to skip).

export type State = 'pass' | 'part' | 'miss' | 'idle';
export type CheckId = 'who' | 'change' | 'proof' | 'now' | 'plain' | 'breath';
export type Check = { id: CheckId; label: string; state: State; note: string };
export type Kind = 'space' | 'keep' | 'fade' | 'flag';
export type Token = { text: string; kind: Kind; tip?: string };
export type Reading = {
  tokens: Token[];
  words: number;
  checks: Check[];
  passed: number;
  kept: string[];
  aside: string;
  ready: boolean;
};

export const LABELS: Record<CheckId, string> = {
  who: 'Who buys',
  change: 'What changes',
  proof: 'Proof',
  now: 'Why now',
  plain: 'Plain words',
  breath: 'One breath',
};

// the words investors have learned to skip, and what to do instead
const JARGON: [RegExp, string][] = [
  [/\b(ai|ml)[- ](powered|driven|enabled|first|native)\b|\bpowered by (ai|machine learning)\b/g, 'If AI is how it works, say what it does for the customer.'],
  [/\bplatforms?\b/g, 'A platform is a shape, not a product. What does someone use it for?'],
  [/\bsolutions?\b/g, 'A solution to what? Name the problem instead.'],
  [/\brevolutioni[sz](e|es|ed|ing)\b|\brevolutionary\b/g, 'Investors discount “revolutionise” to zero. Say what changes.'],
  [/\bdisrupt(s|ing|ive|ion)?\b/g, '“Disrupt” is a claim about the future. Say what you do today.'],
  [/\btransform(s|ing|ative|ation)?\b/g, 'Transform how? Name the before and the after.'],
  [/\bseamless(ly)?\b/g, '“Seamless” is a promise nobody can check.'],
  [/\binnovative\b|\binnovation\b/g, 'Calling it innovative doesn’t make it so. Show the new thing.'],
  [/\bcutting[- ]edge\b|\bstate[- ]of[- ]the[- ]art\b|\bnext[- ]gen(eration)?\b/g, 'Dates badly, and says nothing about the customer.'],
  [/\b(world|best|first)[- ]in[- ]class\b|\bworld[- ]class\b|\b(industry|market)[- ]leading\b/g, 'Unprovable in one sentence. Leave it out.'],
  [/\bleverag(e|es|ed|ing)\b/g, 'Say “use”, or better, say what for.'],
  [/\bsynerg(y|ies|istic)\b/g, 'Nobody repeats “synergy” on Monday.'],
  [/\becosystems?\b/g, 'Who is in it, and who pays?'],
  [/\bend[- ]to[- ]end\b|\bone[- ]stop[- ]shop\b|\ball[- ]in[- ]one\b/g, 'Doing everything sounds like doing nothing in particular. What do people come for?'],
  [/\bholistic\b|\brobust\b|\bscalable\b|\bfrictionless\b/g, 'Adjectives fade first. Spend the words on nouns.'],
  [/\bgame[- ]chang(er|ing)\b/g, 'Let the investor decide that.'],
  [/\bempower(s|ed|ing)?\b/g, 'Empower them to do what? Use that verb instead.'],
  [/\bunlock(s|ed|ing)?\b/g, 'Unlock what, exactly?'],
  [/\bstreamlin(e|es|ed|ing)\b/g, 'Streamline from what to what? A number helps.'],
  [/\boptimi[sz](e|es|ed|ing)\b/g, 'Optimise what, and by how much?'],
  [/\breimagin(e|es|ed|ing)\b/g, 'Say what it looks like now.'],
  [/\b(uber|airbnb|netflix|tinder|spotify) (for|of)\b/g, 'An analogy borrows someone else’s story. Tell yours.'],
  [/\bmission\b|\bpassionate\b/g, 'That’s about you. The sentence should be about them.'],
  [/\b(cloud|data)[- ](based|driven)\b/g, 'That says how, not what. Lead with the outcome.'],
];

const STOP = new Set(
  'a an the and or but of to in on at by for with from into onto over under about as is are was were be been being it its this that these those which who whom whose what when where why how we our us i my me you your they their them he she his her so such than then there here very really just also only even all any each every some more most less few many much can could will would should may might do does did done have has had having not no yes our ours ourselves before after until while because through across via per without instead like own already still use uses using used way ways'.split(
    ' ',
  ),
);

// buyers too broad to picture
const GENERIC = new Set(
  'business businesses company companies organisation organisations organization organizations enterprise enterprises people users user everyone anyone customers customer consumers consumer individuals teams team brands brand smes smbs professionals clients client creators makers'.split(
    ' ',
  ),
);

// modifiers that don't narrow a buyer down
const BROAD = new Set('small big large modern local global growing ambitious busy all any every many most other various'.split(' '));

// plurals that are things, not buyers
const THINGS = new Set(
  'operations workflows processes tasks payments invoices documents records results insights outcomes products services tools apps features sales costs revenues profits errors emails calls meetings appointments orders deliveries bookings data decisions goals needs problems challenges things days weeks months years minutes hours times seconds systems assets funds jobs leads deals contracts reports'.split(
    ' ',
  ),
);
// words ending in s that are verbs
const VERBS_S = /^(uses|needs|wants|takes|gives|lets|gets|helps|means|works|runs|comes|goes|says|does|has|is|was|becomes|allows|includes|requires|keeps|looks|feels|seems|turns|pays|reaches|makes|shows|tells|lives|focuses)$/;

// verbs that say what actually changes for the customer
const OUTCOME =
  /^(cut|cuts|cutting|reduc(e|es|ed|ing)|sav(e|es|ed|ing)|fill(s|ed|ing)?|stop(s|ped|ping)?|avoid(s|ed|ing)?|recover(s|ed|ing)?|collect(s|ed|ing)?|automat(e|es|ed|ing)|replac(e|es|ed|ing)|find(s|ing)?|book(s|ed|ing)?|track(s|ed|ing)?|prevent(s|ed|ing)?|lower(s|ed|ing)?|increas(e|es|ed|ing)|grow(s|ing)?|halv(e|es|ed|ing)|doubl(e|es|ed|ing)|tripl(e|es|ed|ing)|catch(es|ing)?|detect(s|ed|ing)?|match(es|ed|ing)?|ship(s|ped|ping)?|deliver(s|ed|ing)?|schedul(e|es|ed|ing)|sell(s|ing)?|rent(s|ed|ing)?|hir(e|es|ed|ing)|train(s|ed|ing)?|teach(es|ing)?|diagnos(e|es|ed|ing)|treat(s|ed|ing)?|insur(e|es|ed|ing)|lend(s|ing)?|pay(s|ing)?|paid|approv(e|es|ed|ing)|verif(y|ies|ied|ying)|fil(e|es|ed|ing)|clos(e|es|ed|ing)|win(s|ning)?|keep(s|ing)?|retain(s|ed|ing)?|turn(s|ed|ing)?|get(s|ting)?|translat(e|es|ed|ing)|sort(s|ed|ing)?|draft(s|ed|ing)?|writ(e|es|ing)|answer(s|ed|ing)?|spot(s|ted|ting)?|flag(s|ged|ging)?|measur(e|es|ed|ing)|test(s|ed|ing)?|run(s|ning)?|charg(e|es|ed|ing)|refund(s|ed|ing)?|resolv(e|es|ed|ing)|predict(s|ed|ing)?|check(s|ed|ing)?|quot(e|es|ed|ing)|price(s|d)?|plan(s|ned|ning)?|cook(s|ed|ing)?|clean(s|ed|ing)?|repair(s|ed|ing)?|fix(es|ed|ing)?|send(s|ing)?|sign(s|ed|ing)?)$/;
// verbs that say something happens without saying what
const VAGUE = /^(manag(e|es|ed|ing)|improv(e|es|ed|ing)|simplif(y|ies|ied|ying)|help(s|ed|ing)?|mak(e|es|ing)|build(s|ing)?|handl(e|es|ed|ing)|connect(s|ed|ing)?|enabl(e|es|ed|ing)|support(s|ed|ing)?|provid(e|es|ed|ing)|offer(s|ed|ing)?|deliver(ing)?|power(s|ed|ing)?|facilitat(e|es|ed|ing))$/;
const CHANGE_PHRASE = /\b(instead of|without|so (that|they|you)|in (seconds|minutes|hours|days)|per (day|week|month|year)|a (day|week|month|year)|faster|cheaper|fewer|less time)\b/;

const NUMBER_WORDS = /^(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|hundreds|thousand|thousands|million|millions|half|double|twice|triple|dozen|dozens)$/;
const NUMERIC = /[0-9]/;
const MARKET = /\b\d+(\.\d+)?\s?(bn|billion|trillion|tn)\b|[$£€]\s?\d+(\.\d+)?\s?(bn|b|billion|trillion|t)\b|\b(tam|sam|market size)\b/;
const NOW = /\b(now|today|since|newly|recently|finally|for the first time|no longer|this year|last year|as of|(19|20)\d{2}|laws?|regulations?|mandates?|deadlines?|changed|shifted|cheaper than ever|new (laws?|rules?|regulations?|mandates?|standards?|requirements?))\b/;

const BUYER_TRIGGER = /^(for|helps?|let|lets|enables?|serves?|gives?|to|at|used|built|with)$/;

const core = (w: string) => w.toLowerCase().replace(/^[^a-z0-9£$€]+|[^a-z0-9%]+$/g, '');
const isNumber = (w: string, raw: string) => NUMERIC.test(raw) || NUMBER_WORDS.test(w) || /^[£$€]/.test(raw);
const isProper = (raw: string, i: number) => i > 0 && /^[A-Z][A-Za-z0-9&'’-]*[A-Za-z0-9]$/.test(raw.replace(/[^\w&'’-]+$/g, ''));
const isAcronym = (raw: string) => /^[A-Z]{2,6}s?$/.test(raw.replace(/[^\w]+/g, '')) && raw.replace(/[^\w]+/g, '') !== 'I';

export function analyse(text: string): Reading {
  // tokens, keeping every space so the styled copy lines up with what was typed
  const parts = text.split(/(\s+)/).filter((p) => p !== '');
  const tokens: Token[] = [];
  const spans: { start: number; end: number }[] = [];
  let at = 0;
  for (const p of parts) {
    tokens.push({ text: p, kind: /^\s+$/.test(p) ? 'space' : 'fade' });
    spans.push({ start: at, end: at + p.length });
    at += p.length;
  }
  const wordIdx = tokens.map((t, i) => (t.kind === 'space' ? -1 : i)).filter((i) => i >= 0);
  const raw = wordIdx.map((i) => tokens[i].text);
  const w = raw.map(core);
  const n = wordIdx.length;
  const lower = text.toLowerCase();

  // flagged words, from phrases matched across the whole sentence
  const flags: { word: string; tip: string }[] = [];
  for (const [re, tip] of JARGON) {
    re.lastIndex = 0;
    for (let m = re.exec(lower); m; m = re.exec(lower)) {
      const s = m.index;
      const e = s + m[0].length;
      let hit = false;
      tokens.forEach((t, i) => {
        if (t.kind !== 'space' && spans[i].start < e && spans[i].end > s) {
          t.kind = 'flag';
          t.tip = tip;
          hit = true;
        }
      });
      if (hit) flags.push({ word: text.slice(s, e), tip });
    }
  }
  const flagged = (k: number) => tokens[wordIdx[k]].kind === 'flag';
  const keep = (k: number) => {
    if (k >= 0 && k < n && !flagged(k) && w[k] && !STOP.has(w[k])) tokens[wordIdx[k]].kind = 'keep';
  };
  const endsClause = (k: number) => /[,.;:!?)]$/.test(raw[k]);

  // what changes: the outcome verb and the words it acts on
  let change: State = 'miss';
  let outcomeEnd = -1;
  for (let k = 0; k < n; k++) {
    if (OUTCOME.test(w[k]) && !flagged(k)) {
      change = 'pass';
      keep(k);
      let taken = 0;
      for (let j = k + 1; j < n && taken < 3; j++) {
        if (STOP.has(w[j]) && taken > 0) break;
        if (STOP.has(w[j])) continue;
        if (flagged(j)) break;
        keep(j);
        taken++;
        outcomeEnd = j;
        if (endsClause(j)) break;
      }
    }
  }
  if (change === 'miss' && CHANGE_PHRASE.test(lower)) change = 'pass';
  if (change === 'miss' && w.some((x) => VAGUE.test(x))) change = 'part';

  // who buys: the words after "for", "helps" and the like; failing that, a broad buyer
  // ("businesses"), or the first plural noun that isn't a thing or the outcome
  const take = (k: number) => {
    const phrase: number[] = [];
    for (let j = k; j < n && phrase.length < 4; j++) {
      if (STOP.has(w[j]) && phrase.length) break;
      if (STOP.has(w[j]) || flagged(j)) continue;
      if (OUTCOME.test(w[j]) || VAGUE.test(w[j]) || isNumber(w[j], raw[j])) break;
      phrase.push(j);
      if (endsClause(j)) break;
    }
    return phrase;
  };
  const judge = (phrase: number[]): State => {
    if (!phrase.length) return 'miss';
    if (phrase.some((j) => isProper(raw[j], j) || isAcronym(raw[j]))) return 'pass';
    const head = w[phrase[phrase.length - 1]];
    // an activity ("dog walking") or a thing is a market, not someone who pays
    if (THINGS.has(head) || /ing$/.test(head)) return 'miss';
    const narrowed = phrase.slice(0, -1).some((j) => !BROAD.has(w[j]) && !GENERIC.has(w[j]));
    if (GENERIC.has(head)) return narrowed ? 'pass' : 'part';
    return /s$/.test(head) && !/ss$/.test(head) ? 'pass' : narrowed ? 'pass' : 'part';
  };
  const plural = (k: number) =>
    w[k].length > 3 && /s$/.test(w[k]) && !/ss$/.test(w[k]) && !STOP.has(w[k]) && !flagged(k) && !GENERIC.has(w[k]) && !THINGS.has(w[k]) && !VERBS_S.test(w[k]) && !OUTCOME.test(w[k]) && !VAGUE.test(w[k]) && !isNumber(w[k], raw[k]);

  let who: State = 'miss';
  let buyer: number[] = [];
  for (let k = 0; k < n - 1; k++) {
    if (!BUYER_TRIGGER.test(w[k])) continue;
    const phrase = take(k + 1);
    const verdict = judge(phrase);
    if (verdict === 'pass') {
      who = 'pass';
      buyer = phrase;
      break;
    }
    if (verdict === 'part' && who === 'miss') {
      who = 'part';
      buyer = phrase;
    }
  }
  if (who !== 'pass') {
    const outcomeWords = new Set(wordIdx.map((ti, k) => (tokens[ti].kind === 'keep' && k <= outcomeEnd ? k : -1)));
    for (let k = 0; k < n; k++) {
      if (outcomeWords.has(k) || !plural(k)) continue;
      let s0 = k;
      while (s0 > 0 && k - s0 < 3 && !STOP.has(w[s0 - 1]) && !flagged(s0 - 1) && !OUTCOME.test(w[s0 - 1]) && !VAGUE.test(w[s0 - 1]) && !isNumber(w[s0 - 1], raw[s0 - 1])) s0--;
      buyer = Array.from({ length: k - s0 + 1 }, (_, i) => s0 + i);
      who = 'pass';
      break;
    }
  }
  if (who === 'miss') {
    const g = w.findIndex((x) => GENERIC.has(x));
    if (g >= 0) {
      who = 'part';
      buyer = g > 0 && !STOP.has(w[g - 1]) && !flagged(g - 1) ? [g - 1, g] : [g];
    }
  }
  if (who !== 'miss') buyer.forEach(keep);

  // concrete things survive too: the plural nouns a listener can picture
  for (let k = 0; k < n; k++) if (plural(k)) keep(k);

  // proof: a number, but not the size of the world
  let proof: State = 'miss';
  for (let k = 0; k < n; k++) {
    if (isNumber(w[k], raw[k])) {
      proof = 'pass';
      keep(k);
      if (k + 1 < n && !STOP.has(w[k + 1]) && !flagged(k + 1)) keep(k + 1);
    }
  }
  if (proof === 'pass' && MARKET.test(lower)) proof = 'part';

  // why now
  const nowMatch = NOW.exec(lower);
  const now: State = nowMatch ? 'pass' : 'miss';
  if (nowMatch) {
    for (let k = 0; k < n; k++) {
      if (nowMatch[0].split(' ').includes(w[k])) {
        keep(k);
        for (let j = k + 1, taken = 0; j < n && taken < 2; j++) {
          if (STOP.has(w[j])) continue;
          keep(j);
          taken++;
        }
        break;
      }
    }
  }

  // names and acronyms survive
  for (let k = 0; k < n; k++) if (isProper(raw[k], k) || isAcronym(raw[k])) keep(k);

  const plain: State = flags.length === 0 ? 'pass' : flags.length === 1 ? 'part' : 'miss';
  const breath: State = n <= 25 ? 'pass' : n <= 35 ? 'part' : 'miss';
  const ready = n >= 4;

  const notes: Record<CheckId, Record<Exclude<State, 'idle'>, string>> = {
    who: {
      pass: 'A buyer someone could picture.',
      part: 'Which ones? Narrow it until someone could count them.',
      miss: 'Say who pays. A specific buyer is the first thing that gets repeated.',
    },
    change: {
      pass: 'Says what changes for them.',
      part: 'That says something happens. Say what, with a verb you could film.',
      miss: 'What’s different for the customer afterwards?',
    },
    proof: {
      pass: 'A number survives the retelling better than any adjective.',
      part: 'A market size isn’t proof. Use a number from your own customers.',
      miss: 'Add one number from your own customers: how many, how much, how fast.',
    },
    now: {
      pass: 'Answers the question that comes next: why now?',
      part: '',
      miss: 'Optional here, but it’s the next question: why hasn’t this been done before?',
    },
    plain: {
      pass: 'No words investors have learned to skip.',
      part: flags[0] ? `“${flags[0].word}”: ${flags[0].tip}` : '',
      miss: flags[0] ? `${flags.length} words investors skip. “${flags[0].word}”: ${flags[0].tip}` : '',
    },
    breath: {
      pass: `${n} words. Short enough to say in one breath.`,
      part: `${n} words. Could you say it in one breath?`,
      miss: `${n} words. It won’t survive being retold. Aim for under 25.`,
    },
  };
  const states: Record<CheckId, State> = { who, change, proof, now, plain, breath };
  const checks: Check[] = (Object.keys(LABELS) as CheckId[]).map((id) => ({
    id,
    label: LABELS[id],
    state: ready ? states[id] : 'idle',
    note: ready ? notes[id][states[id] as Exclude<State, 'idle'>] : '',
  }));
  const passed = ready ? checks.filter((c) => c.state === 'pass').length : 0;

  // what survives: runs of kept words
  const kept: string[] = [];
  let run: string[] = [];
  for (let k = 0; k <= n; k++) {
    const isKeep = k < n && tokens[wordIdx[k]].kind === 'keep';
    if (isKeep) run.push(raw[k].replace(/^[(“"']+|[,.;:!?)”"']+$/g, ''));
    if ((!isKeep || (k < n && endsClause(k))) && run.length) {
      kept.push(run.join(' '));
      run = [];
    }
  }

  // the investor's aside: the first thing they'd ask
  let aside = '…that one I can repeat.';
  if (who === 'miss') aside = '…but who actually pays for it?';
  else if (who === 'part') aside = '…which ones, though?';
  else if (change !== 'pass') aside = '…and what changes for them?';
  else if (proof === 'miss') aside = '…any numbers yet?';
  else if (proof === 'part') aside = '…but how much of that is theirs?';
  else if (plain === 'miss') aside = '…lot of buzzwords, though.';
  else if (breath === 'miss') aside = '…I lost the thread halfway.';
  else if (now === 'miss') aside = '…why hasn’t anyone done this before?';

  // nothing survived: what's left is a vague noun, or the jargon itself
  if (!kept.length && n) {
    const nouns = w.filter((x, k) => x && !STOP.has(x) && !flagged(k) && !VAGUE.test(x) && !/^(we|re|ve|building|build|built|is|are|company)$/.test(x));
    const last = nouns.slice(-2).join(' ');
    kept.push(last ? `some ${last} thing` : flags.length ? `some kind of ${flags[flags.length - 1].word}` : '');
  }

  return { tokens, words: n, checks, passed, kept: kept.filter(Boolean).slice(0, 5), aside, ready };
}
