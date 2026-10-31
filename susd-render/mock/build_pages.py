#!/usr/bin/env python3
"""Write the mock pages (first screen, every story beat the reviews asked to see, the finale) from one table,
placing the HTML from each still's anchors.json. Review round 2 (docs/06-HERO-BUILD.md, "Round 2 fixes").

    python3 mock/build_img.py && python3 mock/build_pages.py && node mock/shoot.cjs

Copy rules: every sentence is Michael's, verbatim, with its reference in a comment on the same line; labels
carry `// label` on their line (node susd-options/tools/copycheck.mjs mock/*.html must print 0 not found).
Positions are percentages of the 16:10 frame (desktop) or the 9:19.5 frame (phone), so they hold at any size.

Round 2 changes, in one place:
  - the dock says what the file does for you (one outcome label, BL 314) and never changes voice; it steps aside
    (with the phone bar) while the offer or the form is on screen, so each screen has exactly one button;
  - the first screen's instrument: the Bootloader's question, the readout, the active band and Michael's own line on
    what that question reveals [BL 314]; the other bands are ticks on the rendered draught marks, not a list;
  - '12 people: the load line' sits LEFT of the mark on its line, no leader; nothing positioned may overlap (shoot.cjs
    checks every pair of text boxes, and every text box against the rendered sentence);
  - capacity (the seam the words stand on), complexity (the waterline) and margin (the gap) are all pinned to the
    picture from Side on;
  - the three questions move up to beat 3, where the pain is; the finale is one cluster.
"""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
STILLS = os.environ.get('MOCK_STILLS', os.path.join(ROOT, 'out', 'stills'))
MOCK = os.environ.get('MOCK_DIR', os.path.join(ROOT, 'mock'))


def anchors(name):
    p = os.path.join(STILLS, name + '.anchors.json')
    return json.load(open(p)) if os.path.exists(p) else {}


def pct(v):
    return f'{v * 100:.2f}%'


BANDS = {  # id: (tag (label), Michael's line, ref, first n)
    'teamOfTeams': ('Team of Teams 40+', 'At 40+, Team of Teams physics apply. Different constraints, different playbook.', 'BL 4253', 40),
    'graveyard': ('Graveyard 15&#x2013;39', "The Graveyard is not a temporary problem. It's a structural trap.", 'BL 3451', 15),
    'threshold': ('Threshold 13&#x2013;14', 'At 13-14 employees, next hire is a phase change, not incremental growth.', 'BL 3450', 13),
    'team': ('Team 8&#x2013;12', "Leader + team. Still know everyone's name.", 'BL 1250', 8),
    'valley': ('Valley 4&#x2013;7', 'Transition zone between Small Team and Team.', 'BL 1249', 4),
    'smallTeam': ('Small Team 2&#x2013;3', 'Leader + helpers. Coordination manageable.', 'BL 1248', 2),
    'solopreneur': ('Solopreneur 1', 'Founder only. No coordination overhead.', 'BL 1247', 1),
}
SELL = ('This single question reveals location on the destination map, physics that apply, and what advice will fit '
        'vs. make things worse.')     # BL 314

# Each page: still (desktop), phone still (optional), readout (n, p, band, delta), column (instrument | legend |
# none), caption [(class, text, ref)], anchored tags, dock (file | hidden).
PAGES = [
    dict(file='index.html', title='first screen', still='d01_hero_K1', phone='p01_hero_K1', s=0,
         readout=(8, 28, 'team', None), column='instrument', hero=True, tags=['complexity', 'twelve', 'ticks'], dock='file',
         alt="Welded white capital letters on the dark side of a ship spell the sentence above; clear water sits below them."),
    dict(file='beat-hire.html', title='beat 2, hiring (s 80, n = 10)', still='d15_hire_n10', s=80,
         readout=(10, 45, 'team', 9), column='instrument', tags=['complexity', 'twelve', 'ticks'], dock='file',
         caption=[('mid', "Each addition doesn't add one unit of complexity — it adds n-1 new interaction pathways.", 'BL 2339')], capw=640,
         alt='The water has risen under the words; the tenth hire added nine pathways.'),
    dict(file='beat-twelve.html', title='beat 2, twelve (s 160)', still='d02_twelve_K2', phone='p03_twelve_K2', s=160,
         readout=(12, 66, 'team', 11), column='instrument', tags=['twelve', 'ticks'], dock='file',
         caption=[('big', "12 isn't where you're trying to get. It's the line you don't cross.", 'BL 544')], capw=600,
         alt='The water has risen to the painted load line under the words.'),
    dict(file='beat-touch.html', title='beat 3, thirteen (s 240)', still='d03_touch_K3', phone='p04_touch_K3', s=240,
         readout=(13, 78, 'threshold', 12), column='instrument', questions=True, tags=['ticks'], dock='file',
         caption=[('big1', 'Past twelve, something breaks.', 'M 3509, copy.ts:88')], capw=560,
         alt='The water touches the foot of every letter; the load signal above the words shows red.'),
    dict(file='beat-under.html', title='beat 4, going under (s 360)', still='d04_under_K5', phone='p02_under_K5', s=360,
         readout=(19, 171, 'graveyard', None), column='instrument', tags=[], dock='file',
         caption=[('big', 'Complexity that accumulated faster than the structure could hold.', 'M 2021, copy.ts:96')], capw=640,
         alt='Under the water, looking at the ship: the whole sentence is under clear green water, the surface a silver ripple above it.'),
    dict(file='beat-redline.html', title='beat 5, Redline (s 480)', still='d05_redline_K6', phone='p05_redline_K6', s=480,
         readout=(39, 741, 'graveyard', None), column='instrument', tags=[], dock='file',
         caption=[('eqred', 'Complexity > Capacity = Redline.', 'M 2997, copy.ts:80'),
                  ('support', 'The business is drowning. Every addition makes it worse.', 'BL 717')], capw=720,
         alt='Deeper under a clouded sky, the drowned sentence is dim; the red lamp glows under the water.'),
    dict(file='beat-turn.html', title='beat 6, the turn (s 560)', still='d06_turn_K7', phone='p06_turn_K7', s=560,
         readout=None, column='none', tags=[], dock='file',
         caption=[('big', 'You were never the problem. The model you inherited was.', 'M 216, copy.ts:196')], capw=560,
         alt='The sun is back on the flooded hull; the words wait under the clear water.'),
    dict(file='beat-side.html', title='beat 6, Side (s 640)', still='d07_side1_K8', s=640,
         readout=None, column='legend', phase='side', tags=['capacity'], dock='file',
         caption=[('big', 'Systems were what actually held the weight.', 'M 2408, copy.ts:103')], capw=560,
         alt='A new strake of steel is welded in under the words and lifts them; their top lines are out of the water.'),
    dict(file='beat-down.html', title='beat 7, Down (s 740)', still='d08_down1_K9', s=740,
         readout=None, column='legend', phase='down', nocell=True, tags=['complexity', 'capacity', 'margin'], dock='file',
         caption=[('big', 'Something needs to be cut.', 'M 2564, copy.ts:111'),
                  ('support', 'Complexity pruned, margin recaptured, efficiency locked', 'BL 863')], capw=520,
         alt='The water has dropped below the load line; the words stand dry on their first new strake; the signal is green.'),
    dict(file='beat-offer.html', title='beat 7, the offer (s 860)', still='d08_down1_K9', phone='p07_down1_K9', s=860,
         readout=None, column='none', tags=['complexity', 'capacity', 'margin'], dock='hidden', offer=True,
         alt='The water has dropped below the load line; the words stand dry on their first new strake; the signal is green.'),
    dict(file='beat-cycle2.html', title='beat 8, cycle 2 (s 960)', still='d10_side2_K11', s=960,
         readout=None, column='legend', phase='side', lap=2, tags=['complexity', 'capacity', 'margin'], dock='file',
         caption=[('big', 'Up. Side. Down. Repeat.', 'M 1713, copy.ts:125'),
                  ('support', 'Each cycle deposits systems and margin. The next cycle withdraws from a larger account.', 'BL 866')], capw=620,
         alt='A second new strake under the words; the water has come up again and stopped at the load line.'),
    dict(file='beat-repeat.html', title='beat 8, Repeat (s 1020)', still='d11_up3_K13', s=1020,
         readout=None, column='legend', phase='up', lap=3, tags=['complexity', 'capacity', 'margin', 'twelve'], dock='file',
         caption=[('big', 'Nothing moves forward until the cycle completes. But when it does, the next cycle starts higher.', 'BL 870')], capw=660,
         alt='Two new strakes under the words; the water has come up again and stopped at the load line.'),
    dict(file='beat-oxygen.html', title='beat 9, Oxygen (s 1150)', still='d12_oxygen_K16', phone='p08_oxygen_K16', s=1150,
         readout=None, column='none', tags=['complexity', 'capacity', 'margin', 'highwater'], dock='file',
         caption=[('eqgreen', 'Capacity > Complexity = Oxygen.', 'M 2999, copy.ts:119'),
                  ('support', 'The business can breathe. Systems carry what the business creates.', 'BL 718')], capw=720,
         alt='The words stand high and dry in the sun on three new strakes, far above the water and the load line.'),
    dict(file='finale.html', title='beat 9, the finale (s 1240)', still='d13_finale_K16F', phone='p09_finale_K16F', s=1240,
         readout=None, column='none', tags=[], dock='hidden', finale=True,
         alt='The words stand high on the ship above calm clear water; the newest strake is stencilled with the Bootloader mark.'),
]

HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Scaling Up-Side-Down</title>
<link rel="preload" href="fonts/Plimsoll-Heavy.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="mock.css">
<!-- Mock: {title}. Generated by mock/build_pages.py from out/stills/{still}.anchors.json. -->
<style>{style}</style>
</head>
<body class="{bodycls}">
'''

# one button per screen: the dock and the phone bar step aside while the offer or the form is in view (review round 2)
DOCK_IO = '''<script>
(function () {
  var t = document.querySelectorAll('.offer, #get-form');
  if (!t.length || !('IntersectionObserver' in window)) return;
  var seen = new Set();
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
    document.body.classList.toggle('dock-off', seen.size > 0);
  });
  t.forEach(function (e) { io.observe(e); });
})();
</script>'''


def chrome(pg):
    out = ['<div class="lockup">',
           '  <p class="title">Scaling Up&#x2011;Side&#x2011;Down</p>',
           '  <p class="byline">A book by Michael Wentz</p> <!-- // label -->',
           '  <a class="booklink" href="#book">The book</a> <!-- // label -->',
           '</div>',
           '<div class="dock">',
           '  <span class="mark" aria-hidden="true">&#x29B5;</span>',
           '  <span class="dtext">',
           '    <span class="name">SUSD Bootloader</span>',
           '    <span class="meta">A free file for your AI. It finds where your team stands and which advice fits.</span> <!-- // label (outcome: BL 314) -->',
           '    <span class="meta dim">Works with Claude, ChatGPT and Gemini</span> <!-- // label (BL 221 names these three) -->',
           '  </span>',
           '  <a class="btn" href="#get" data-cta="dock" aria-label="Get the free SUSD Bootloader file">Get it free</a> <!-- // label -->',
           '</div>']
    return out


def instrument(pg, an):
    n, p, band, delta = pg['readout']
    tag, line, ref, _ = BANDS[band]
    out = ['<div class="instrument">',
           '  <p class="question"><span class="asks">The Bootloader asks</span> How many people are on your team?</p> <!-- BL 310 (label: "The Bootloader asks") -->',
           '  <div class="readout" aria-live="polite">',
           f'    <span><span class="fig">{n}</span><span class="unit">people</span></span> <!-- // label -->',
           f'    <span><span class="fig">{p}</span><span class="unit">coordination pathways{f" (+{delta})" if delta else ""}</span></span> <!-- // label (+n-1: BL 2339) -->',
           '  </div>',
           f'  <p class="band"><span class="btag">{tag}</span></p> <!-- // label -->',
           f'  <p class="bandline">{line}</p> <!-- {ref} -->']
    if pg.get('hero'):
        out.append(f'  <p class="sell">{SELL}</p> <!-- BL 314 -->')
        out.append('  <p class="cue">Scroll to hire. Each step is one more person.</p> <!-- // label -->')
    if pg.get('questions'):
        out += ['  <p class="qlabel">The Bootloader starts with three questions</p> <!-- // label (BL 3748, "The Three Questions") -->',
                '  <p class="q">Where am I now?</p> <!-- BL 3748 -->',
                '  <p class="q">Where does my vehicle top out?</p> <!-- BL 3748 -->',
                '  <p class="gloss">your vehicle: bicycle, car, limousine or airplane</p> <!-- // label (BL 3564) -->',
                '  <p class="q">Where do I actually want to be?</p> <!-- BL 3748 -->']
    out.append('</div>')
    return out


def legend(pg):
    ph = pg['phase']
    rows = [('up', 'Up', 'Up for growth.', 'Revenue expands, reach grows, capacity stretches', 'BL 861'),
            ('side', 'Side', 'Side for stability.', 'Systems absorb the growth, structure stabilizes', 'BL 862'),
            ('down', 'Down', 'Down for pruning.', 'Complexity pruned, margin recaptured, efficiency locked', 'BL 863')]
    out = ['<div class="legend">',
           '  <p class="llead">Real scaling is cyclical.</p> <!-- BL 795 -->']
    if pg.get('lap'):
        out.append(f'  <p class="lap">Cycle {pg["lap"]} of 3</p> <!-- // label -->')
    for key, name, line, cell, ref in rows:
        on = key == ph
        out.append(f'  <div class="phase{" on" if on else ""}">')
        out.append(f'    <p class="pname">{name}</p> <p class="pline">{line}</p> <!-- BL 795 -->')
        if on and not pg.get('nocell'):
            out.append(f'    <p class="cell">{cell}</p> <!-- {ref} -->')
        out.append('  </div>')
    out.append('</div>')
    return out


def caption(pg):
    out = ['<div class="caption">']
    for kind, text, ref in pg['caption']:
        out.append(f'  <p class="{kind}">{text}</p> <!-- {ref} -->')
    out.append('</div>')
    return out


def offer():
    return ['<div class="offer">',
            '  <p class="big">The pages are reference. The file is the operating system.</p> <!-- M 4497, copy.ts:61 -->',
            '  <div class="offerrow">',
            '    <div class="ofile">',
            '      <p class="filehead"><span class="mark" aria-hidden="true">&#x29B5;</span><span class="fname">SUSD Bootloader</span></p>',
            '      <p class="what">A free file for your AI. It finds where your team stands and which advice fits.</p> <!-- // label (BL 314) -->',
            "      <p class=\"spec\">Version 16<br>35,445 words for your AI to read, so you don't have to<br>Works with Claude, ChatGPT and Gemini</p> <!-- // label (BL 747, BL 221) -->",
            '    </div>',
            '    <div class="oq">',
            '      <p class="qlabel">It starts with three questions</p> <!-- // label (BL 3748, "The Three Questions") -->',
            '      <p class="q">Where am I now?</p> <!-- BL 3748 -->',
            '      <p class="q">Where does my vehicle top out?</p> <!-- BL 3748 -->',
            '      <p class="gloss">your vehicle: bicycle, car, limousine or airplane</p> <!-- // label (BL 3564) -->',
            '      <p class="q">Where do I actually want to be?</p> <!-- BL 3748 -->',
            '    </div>',
            '  </div>',
            '  <a class="btn" href="#get" data-cta="offer">Get the free Bootloader</a> <!-- // label -->',
            '</div>']


def finale():
    return ['<div class="cluster" id="get">',
            '  <div class="lead">',
            '    <p>In an open system, AI accelerates chaos.</p> <!-- M 4523, copy.ts:136 -->',
            '    <p>In a closed system, AI accelerates clarity.</p> <!-- M 4523, copy.ts:140 -->',
            '  </div>',
            '  <div class="fgrid">',
            '    <div class="fspec">',
            '      <p class="filehead"><span class="mark" aria-hidden="true">&#x29B5;</span><span class="fname">SUSD Bootloader</span></p>',
            '      <p class="what">A free file for your AI</p> <!-- // label -->',
            "      <p class=\"spec\">Version 16<br>35,445 words for your AI to read, so you don't have to<br>Works with Claude, ChatGPT and Gemini</p> <!-- // label (BL 747, BL 221) -->",
            '    </div>',
            '    <div class="fform">',
            '      <p class="getback"><span class="qlabel">What you get back</span> Where your team stands, which physics apply, and which advice fits.</p> <!-- // label (BL 314) -->',
            '      <form class="form" id="get-form" action="https://scaling-up-side-down.vercel.app/appendix#get" method="get" novalidate>',
            '        <label for="email">Email address</label> <!-- // label -->',
            '        <div class="formrow">',
            '          <input id="email" name="email" type="email" inputmode="email" autocomplete="email" enterkeyhint="send" placeholder="you@company.com" aria-describedby="note">',
            '          <button class="btn" type="submit" data-cta="finale">Get the free Bootloader</button> <!-- // label -->',
            '        </div>',
            '        <p class="note" id="note">Opens the Bootloader page, where the file is sent by email.</p> <!-- // label (handoff mode; post mode: "The file is sent to this address.") -->',
            '      </form>',
            '      <p class="next">Upload the file and use the starting prompt provided with it.</p> <!-- M 4531, copy.ts:150 -->',
            '      <p class="next">Then let the system locate you.</p> <!-- M 4533, copy.ts:151 -->',
            '      <a class="appendix" href="https://scaling-up-side-down.vercel.app/appendix">Read the Appendix</a> <!-- // label -->',
            '    </div>',
            '  </div>',
            '  <p class="bookline" id="book"><span class="booktitle">Scaling Up&#x2011;Side&#x2011;Down</span> The book by Michael Wentz. Pre-orders open soon.</p> <!-- // label -->',
            '</div>']


def tags(pg, an):
    """Anchored labels: 1 px cream rules and B612 text, never boxed; each points at a thing in the render."""
    out = []
    if not an:
        return out
    wy = an.get('waterY', 0.5)
    tl = pg.get('tags', [])
    for t in tl:
        if t == 'complexity':
            txt = f'complexity: {pg["readout"][1]} pathways' if pg.get('readout') and pg.get('readout')[1] else 'complexity'
            out.append(f'<div class="tag tag-water" style="top:{pct(wy)}"><span class="rule-h"></span>{txt}</div> <!-- // label -->')
        elif t == 'twelve' and an.get('mark12Left'):
            mx, my = an['mark12Left']
            out.append(f'<div class="tag tag-mark" style="right:calc(100% - {pct(mx)} + 12px);top:{pct(my)}">12 people: the load line</div> <!-- // label -->')
        elif t == 'ticks' and an.get('levelY'):
            gx = an['gaugeX']
            for n_, name in (('13', 'Threshold 13&#x2013;14'), ('15', 'Graveyard 15&#x2013;39')):
                ly = an['levelY'][n_]
                if ly < wy - 0.01 and ly > (an['words'][1] if an.get('words') else 0):
                    out.append(f'<div class="tag tag-tick" style="right:calc(100% - {pct(gx)} + 12px);top:{pct(ly)}">{name}<span class="rule-h short"></span></div> <!-- // label -->')
        elif t in ('capacity', 'margin') and an.get('deckY') is not None and an['deckY'] > an.get('waterY', 1) - 0.004:
            continue          # the seam is under water (Side 1): no tag points at what you cannot see (art review minor)
        elif t == 'capacity' and an.get('deckY') is not None:
            dx0 = an['deckX'][0]
            off = 28 if 'margin' in tl else 14       # with the margin dimension: left of its top tick
            out.append(f'<div class="tag tag-deck" style="right:calc(100% - {pct(dx0)} + {off}px);top:{pct(an["deckY"])}">capacity<span class="rule-h"></span></div> <!-- // label -->')
        elif t == 'margin' and an.get('deckY') is not None and wy - an['deckY'] > 0.03:
            dx0, dy = an['deckX'][0], an['deckY']
            out.append(f'<div class="tag tag-margin" style="left:calc({pct(dx0)} - 26px);top:{pct(dy)};height:{pct(wy - dy)}"><span>margin</span></div> <!-- // label -->')
        elif t == 'highwater' and an.get('scarY') is not None:
            gx = an.get('gaugeX', 0.9)
            out.append(f'<div class="tag tag-scar" style="left:calc({pct(gx)} - 30px);top:{pct(an["scarY"])}"><span class="rule-h"></span>high water, 39 people</div> <!-- // label -->')
    return out


def page(pg):
    an = anchors(pg['still'])
    style = []
    words = an.get('words') or [0, 0, 0, 0]
    wy = max(an.get('waterY', 0.55), words[3] + 0.02)
    top_inst = f'calc({pct(wy)} + 24px)'
    if 'twelve' in pg.get('tags', []) and an.get('mark12'):
        top_inst = f'max(calc({pct(wy)} + 24px), calc({pct(an["mark12"][1])} + 34px))'
    # the right column stands clear of the rendered draught marks (their x moves with the camera: 96 % in the first
    # screen, about 86 % on the crane frames)
    gx = an.get('gaugeX', 1.0)
    style.append(f'.instrument, .legend {{ top: {top_inst}; left: min(1036px, calc({pct(gx)} - 356px)); }}')
    style.append(f'.caption {{ top: max(calc({pct(wy)} + 70px), 58%); width: {pg.get("capw", 640)}px; }} '
                 f'.offer {{ top: calc({pct(wy)} + 34px); }}')
    if pg.get('hero'):
        style.append(f'.audience {{ top: calc({pct(wy)} + 40px); }}')
    if pg.get('finale'):
        # the cluster sits on the dark hull plate under the words and their stencil (review round 2: "the form sits on
        # dark plate or wall, not on reflections")
        below = (an.get('stencil') or words)[3]
        style.append(f'.cluster {{ top: calc({pct(below)} + 34px); }}')
    pan = anchors(pg['phone']) if pg.get('phone') else {}
    if pan:
        pw = pan.get('words') or [0, 0, 0, 0]
        pwy = max(pan.get('waterY', 0.58), pw[3] + 0.02)
        # !important: the tags carry their desktop position inline, which would otherwise win on the phone
        pbelow = (pan.get('stencil') or pw)[3]
        ph = [f'.tag-water {{ top: {pct(pwy)} !important; }}', f'.audience {{ top: calc({pct(pwy)} + 34px); }}',
              f'.caption {{ top: calc({pct(pwy)} + 40px); }}', f'.offer {{ top: calc({pct(pw[3])} + 28px); }}',
              f'.cluster {{ top: calc({pct(pbelow)} + 24px); }}']
        if pg.get('hero'):
            ph.append(f'.instrument {{ top: calc({pct(pwy)} + 128px); }}')
        if pan.get('mark12Left') and 'twelve' in pg.get('tags', []):
            # on the phone the mark sits under the lines' right end: its label goes under it, right-aligned to it
            mx, my = pan['mark12Left']
            rx = 2 * pan['mark12'][0] - mx
            ph.append(f'.tag-mark {{ right: calc(100% - {pct(rx)}) !important; top: calc({pct(my)} + 30px) !important; }}')
        style.append('@media (max-aspect-ratio: 3/4) { ' + ' '.join(ph) + ' }')
    bodycls = ' '.join(x for x in ['finale' if pg.get('finale') else '', 'offerpage' if pg.get('offer') else '',
                                   'hasphone' if pg.get('phone') else '',
                                   'hero' if pg.get('hero') else 'beat',
                                   'dock-off' if pg['dock'] == 'hidden' else ''] if x)
    out = [HEAD.format(title=pg['title'], still=pg['still'], style=' '.join(style), bodycls=bodycls)]
    if pg.get('hero'):
        out.append('<a class="sr-only" href="#get">Skip to the Bootloader</a> <!-- // label -->')
    out.append('<main>')
    data = f' data-words="{",".join(str(v) for v in words)}"' if an else ''
    if an.get('gaugeX') and an.get('mark12'):        # the rendered draught marks: no text may sit on them
        data += f' data-gauge="{an["gaugeX"]},{an["mark12"][1]}"'
    pdata = f' data-pwords="{",".join(str(v) for v in pan["words"])}"' if pan.get('words') else ''
    out.append(f'<section class="stage"{data}{pdata} aria-label="The story, told by the water"> <!-- // label -->')
    src = f'<source media="(max-aspect-ratio: 3/4)" srcset="img/{pg["phone"]}.jpg">' if pg.get('phone') else ''
    out.append(f'  <picture>{src}<img src="img/{pg["still"]}.jpg" alt="{pg["alt"]}" fetchpriority="high"></picture> <!-- // label -->')
    if pg.get('hero'):
        out.append('  <h1 class="sr-only">Every hire compounds complexity before it compounds capacity.</h1> <!-- M 696, copy.ts:60 -->')
    out += ['  ' + x for x in chrome(pg)]
    if pg.get('hero'):
        out.append('  <p class="audience">For bootstrapped, self-funded founders with teams of 1&#x2013;12</p> <!-- // label (fit table, BL 4773, BL 4775) -->')
    out += ['  ' + x for x in tags(pg, an)]
    if pg['column'] == 'instrument':
        out += ['  ' + x for x in instrument(pg, an)]
    elif pg['column'] == 'legend':
        out += ['  ' + x for x in legend(pg)]
    if pg.get('caption'):
        out += ['  ' + x for x in caption(pg)]
    if pg.get('offer'):
        out += ['  ' + x for x in offer()]
    if pg.get('finale'):
        out += ['  ' + x for x in finale()]
    out.append('</section>')
    out.append('</main>')
    out += ['<div class="bar">',
            '  <span class="mark" aria-hidden="true">&#x29B5;</span>',
            '  <span class="dtext"><span class="name">SUSD Bootloader</span><span class="meta">Free AI file: find where your team stands</span> <!-- // label (BL 314) -->',
            '    <span class="meta dim">Works with Claude, ChatGPT, Gemini</span></span> <!-- // label -->',
            '  <a class="btn" href="#get" data-cta="bar" aria-label="Get the free SUSD Bootloader file">Get it free</a> <!-- // label -->',
            '</div>']
    out.append(DOCK_IO)
    out.append('</body>')
    out.append('</html>')
    return '\n'.join(out) + '\n'


if __name__ == '__main__':
    keep = {pg['file'] for pg in PAGES}
    for f in os.listdir(MOCK):
        if f.endswith('.html') and f not in keep:
            os.remove(os.path.join(MOCK, f)); print('removed', 'mock/' + f)
    for pg in PAGES:
        open(os.path.join(MOCK, pg['file']), 'w').write(page(pg))
        print('wrote', 'mock/' + pg['file'], '(no anchors yet)' if not anchors(pg['still']) else '')
